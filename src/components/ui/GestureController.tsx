import { useRef, useEffect, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// 检测是否移动端
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// 手势类型
type GestureName =
  | 'None'
  | 'Open_Palm'
  | 'Closed_Fist'
  | 'Pointing_Up'
  | 'Thumb_Up'
  | 'Thumb_Down'
  | 'Victory'
  | 'ILoveYou'
  | 'Pinch';

interface GestureControllerProps {
  onGesture: (gesture: string) => void;
  onMove?: (speed: number) => void;
  onStatus: (status: string) => void;
  debugMode: boolean;
  enabled: boolean;
  onPinch?: (pos: { x: number; y: number }) => void;
  onPalmMove?: (deltaX: number, deltaY: number) => void;
  onPalmVertical?: (y: number) => void;
  onZoom?: (delta: number) => void;
  isPhotoSelected: boolean;
  photoLocked?: boolean; // 照片锁定状态（捏合选择后锁定1秒）
  palmSpeed?: number; // 控制灵敏度的倍率
  zoomSpeed?: number; // 放大缩小速度
}

export const GestureController = ({
  onGesture,
  onMove,
  onStatus,
  debugMode,
  enabled,
  onPinch,
  onPalmMove,
  onPalmVertical,
  onZoom,
  isPhotoSelected,
  photoLocked = false,
  palmSpeed = 25,
  zoomSpeed = 100,
}: GestureControllerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mobile = isMobile();

  // 追踪状态
  const lastPalmPosRef = useRef<{ x: number; y: number } | null>(null);
  // 位置历史记录（用于平滑去抖）
  const palmHistoryRef = useRef<{ x: number; y: number }[]>([]);
  const lastVideoTimeRef = useRef<number>(-1);
  const gestureStreakRef = useRef<{ name: string | null; count: number }>({
    name: null,
    count: 0,
  });
  const pinchCooldownRef = useRef<number>(0);
  const pinchActiveRef = useRef<boolean>(false);
  const lastPinchPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // 旋转加速度
  const rotationBoostRef = useRef<number>(0);
  // 手掌尺寸追踪
  const lastHandScaleRef = useRef<number | null>(null);

  const callbacksRef = useRef({
    onGesture,
    onMove,
    onStatus,
    debugMode,
    onPinch,
    onPalmMove,
    onPalmVertical,
    onZoom,
    isPhotoSelected,
    photoLocked,
    palmSpeed,
    zoomSpeed
  });
  callbacksRef.current = {
    onGesture,
    onMove,
    onStatus,
    debugMode,
    onPinch,
    onPalmMove,
    onPalmVertical,
    onZoom,
    isPhotoSelected,
    photoLocked,
    palmSpeed,
    zoomSpeed
  };


  /**
   * 核心算法：判断手指是否弯曲
   * 平衡握拳和张开手掌的识别率
   */
  const getFingerState = useCallback(
    (landmarks: NormalizedLandmark[], wrist: NormalizedLandmark) => {
      // 指尖索引: 拇指4, 食指8, 中指12, 无名指16, 小指20
      // 指根索引(MCP): 拇指2, 食指5, 中指9, 无名指13, 小指17
      // PIP关节索引: 食指6, 中指10, 无名指14, 小指18
      
      // 计算手指弯曲程度
      const isCurled = (tipIdx: number, pipIdx: number, mcpIdx: number) => {
        const tip = landmarks[tipIdx];
        const pip = landmarks[pipIdx]; // PIP关节（第二关节）
        const mcp = landmarks[mcpIdx]; // 指根
        
        // 1. 指尖到手腕的距离
        const tipToWrist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
        const mcpToWrist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
        
        // 2. 指尖到指根的距离
        const tipToMcp = Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
        const pipToMcp = Math.hypot(pip.x - mcp.x, pip.y - mcp.y);
        
        // 主要判定：指尖到手腕的距离比（放宽到 1.4）
        const distanceCheck = tipToWrist < mcpToWrist * 1.4;
        
        // 辅助判定：指尖到指根的距离很短（弯曲时指尖靠近指根）
        const severelyBent = tipToMcp < pipToMcp * 0.8;
        
        // 主要条件满足，或者严重弯曲时判定为弯曲
        return distanceCheck || severelyBent;
      };

      // 拇指单独逻辑
      const thumbTip = landmarks[4];
      const thumbIP = landmarks[3]; // 拇指IP关节
      const pinkyMCP = landmarks[17];
      const indexMCP = landmarks[5];
      
      const palmWidth = Math.hypot(indexMCP.x - pinkyMCP.x, indexMCP.y - pinkyMCP.y);
      const thumbOutDist = Math.hypot(thumbTip.x - pinkyMCP.x, thumbTip.y - pinkyMCP.y);
      
      // 拇指弯曲检测：指尖非常靠近IP关节
      const thumbTipToIP = Math.hypot(thumbTip.x - thumbIP.x, thumbTip.y - thumbIP.y);
      const thumbCurled = thumbTipToIP < palmWidth * 0.3;
      
      // 拇指伸直判定
      const thumbExtended = thumbOutDist > palmWidth * 0.9 && !thumbCurled;

      return {
        thumb: thumbExtended,
        index: !isCurled(8, 6, 5),
        middle: !isCurled(12, 10, 9),
        ring: !isCurled(16, 14, 13),
        pinky: !isCurled(20, 18, 17)
      };
    },
    []
  );

  useEffect(() => {
    if (!enabled) {
      callbacksRef.current.onStatus('AI 已禁用');
      return;
    }

    let handLandmarker: HandLandmarker | null = null;
    let requestRef: number;
    let isActive = true;
    let loadingTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const TOTAL_TIMEOUT = 120000; // 总超时 120 秒

    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const localWasmRoot = `${baseUrl}/wasm`;
    const localModelPath = `${baseUrl}/models/hand_landmarker.task`;

    const createLandmarker = async (vision: any, delegate: 'GPU' | 'CPU') => {
      return HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: localModelPath,
          delegate
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
    };

    // 带超时的 Promise
    const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error(errorMsg)), ms)
        )
      ]);
    };


    const setup = async () => {
      callbacksRef.current.onStatus('AI: 初始化...');
      const startTime = Date.now();

      // 设置总体超时
      loadingTimeoutId = setTimeout(() => {
        if (isActive && !handLandmarker) {
          console.warn('AI total timeout reached');
          callbacksRef.current.onStatus('AI: 超时');
        }
      }, TOTAL_TIMEOUT);

      try {
        // 1. 并行：获取摄像头 + 加载 WASM
        callbacksRef.current.onStatus('AI: 请求摄像头...');
        
        const cameraPromise = withTimeout(
          navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 320 },
              height: { ideal: 240 },
              frameRate: { ideal: 30 },
            },
            audio: false,
          }),
          8000,
          '摄像头请求超时'
        );

        // 加载本地 WASM
        callbacksRef.current.onStatus('AI: 加载引擎...');
        
        let vision: any = null;
        let stream: MediaStream;
        
        try {
          // 并行执行摄像头和 WASM 加载
          const [cameraResult, wasmResult] = await Promise.all([
            cameraPromise,
            withTimeout(
              FilesetResolver.forVisionTasks(localWasmRoot),
              15000,
              'WASM 加载超时'
            )
          ]);
          
          stream = cameraResult;
          vision = wasmResult;
          console.log('WASM loaded from:', localWasmRoot, 'in', Date.now() - startTime, 'ms');
        } catch (e) {
          throw e;
        }

        if (!isActive) {
          stream!.getTracks().forEach((track) => track.stop());
          return;
        }

        // 2. 加载模型（GPU 优先，快速回退到 CPU）
        callbacksRef.current.onStatus('AI: 加载模型...');
        let landmarker: HandLandmarker | null = null;
        
        // GPU 尝试（较短超时，快速失败）
        try {
          landmarker = await withTimeout(
            createLandmarker(vision, 'GPU'),
            8000,
            'GPU 模型超时'
          );
          console.log('Model loaded with GPU in', Date.now() - startTime, 'ms');
        } catch (gpuErr) {
          console.warn('GPU failed, trying CPU:', gpuErr);
          callbacksRef.current.onStatus('AI: 切换 CPU 模式...');
          
          // CPU 回退（给更长时间）
          landmarker = await withTimeout(
            createLandmarker(vision, 'CPU'),
            12000,
            'CPU 模型超时'
          );
          console.log('Model loaded with CPU in', Date.now() - startTime, 'ms');
        }

        if (!isActive || !landmarker) {
          stream!.getTracks().forEach((track) => track.stop());
          landmarker?.close();
          return;
        }

        handLandmarker = landmarker;

        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;
          
          // 移动端需要显式调用 play() 并等待
          const startVideo = async () => {
            try {
              await video.play();
              console.log('Video playing, readyState:', video.readyState);
            } catch (playErr) {
              console.warn('Video play error:', playErr);
            }
          };
          
          // 使用多种事件确保能捕获到视频就绪
          const onVideoReady = () => {
            console.log('Video ready event fired, readyState:', video.readyState);
            if (video.readyState >= 2 && canvasRef.current) {
              // 移除所有监听器
              video.removeEventListener('loadeddata', onVideoReady);
              video.removeEventListener('canplay', onVideoReady);
              video.removeEventListener('playing', onVideoReady);
              
              requestAnimationFrame(() => {
                if (!isActive) return;
                if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
                callbacksRef.current.onStatus('AI 就绪');
                lastFrameTimeRef.current = Date.now();
                predictWebcam();
              });
            }
          };
          
          // 监听多个事件，确保移动端兼容性
          video.addEventListener('loadeddata', onVideoReady, { once: false });
          video.addEventListener('canplay', onVideoReady, { once: false });
          video.addEventListener('playing', onVideoReady, { once: false });
          
          // 如果视频已经就绪
          if (video.readyState >= 2) {
            console.log('Video already ready');
            onVideoReady();
          } else {
            // 移动端需要显式播放
            startVideo();
          }
        }
      } catch (err: unknown) {
        console.error('AI Setup Error:', err);
        const errorName = (err as { name?: string })?.name;
        const errorMessage = (err as Error)?.message || '';
        
        if (loadingTimeoutId) {
          clearTimeout(loadingTimeoutId);
          loadingTimeoutId = null;
        }
        
        if (errorName === 'NotAllowedError' || errorName === 'NotReadableError' || errorName === 'NotFoundError') {
          callbacksRef.current.onStatus('AI: 摄像头权限被拒绝');
        } else if (errorMessage.includes('超时') || errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
          // 超时可以重试
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            const delay = retryCount * 1500;
            callbacksRef.current.onStatus(`AI: 加载超时，${delay/1000}秒后重试 (${retryCount}/${MAX_RETRIES})`);
            setTimeout(() => {
              if (isActive) setup();
            }, delay);
          } else {
            callbacksRef.current.onStatus('AI: 加载失败，请刷新重试');
          }
        } else if (errorMessage.includes('AggregateError') || errorMessage.includes('所有')) {
          // 所有源都失败
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            callbacksRef.current.onStatus(`AI: 网络不稳定，重试中 (${retryCount}/${MAX_RETRIES})`);
            setTimeout(() => {
              if (isActive) setup();
            }, 2000);
          } else {
            callbacksRef.current.onStatus('AI: 网络错误，请检查网络');
          }
        } else {
          // 其他错误也尝试重试一次
          if (retryCount < 1) {
            retryCount++;
            callbacksRef.current.onStatus('AI: 初始化失败，重试中...');
            setTimeout(() => {
              if (isActive) setup();
            }, 1000);
          } else {
            callbacksRef.current.onStatus('AI: 初始化失败');
          }
        }
      }
    };


    const predictWebcam = () => {
      if (!isActive || !handLandmarker || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const { debugMode: dbg } = callbacksRef.current;

      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        if (video.videoWidth > 0 && canvas.width !== video.videoWidth) {
           canvas.width = video.videoWidth;
           canvas.height = video.videoHeight;
        }

        lastVideoTimeRef.current = video.currentTime;
        const now = Date.now();
        const delta = (now - lastFrameTimeRef.current) / 1000;
        lastFrameTimeRef.current = now;

        if (pinchCooldownRef.current > 0) pinchCooldownRef.current -= delta;

        const results = handLandmarker.detectForVideo(video, now);

        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const wrist = landmarks[0];

          // 调试绘制
          if (dbg && ctx) {
            const drawingUtils = new DrawingUtils(ctx);
            drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: '#FFD700', lineWidth: 2 });
            drawingUtils.drawLandmarks(landmarks, { color: '#FF0000', lineWidth: 1 });
          }

          // 1. 获取手指状态
          const fingers = getFingerState(landmarks, wrist);
          
          // 2. 捏合检测 - 放宽阈值提高识别率
          const pinchDist = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y);
          const isPinch = pinchDist < 0.08;

          // 3. 手掌位置 & 移动 (平滑处理)
          const rawPalmX = (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3;
          const rawPalmY = (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3;
          
          // 添加到历史记录
          palmHistoryRef.current.push({ x: rawPalmX, y: rawPalmY });
          if (palmHistoryRef.current.length > 4) {
             palmHistoryRef.current.shift();
          }
          
          // 计算平均位置
          const palmX = palmHistoryRef.current.reduce((sum, p) => sum + p.x, 0) / palmHistoryRef.current.length;
          const palmY = palmHistoryRef.current.reduce((sum, p) => sum + p.y, 0) / palmHistoryRef.current.length;
          
          let dx = 0;
          let dy = 0;
          if (lastPalmPosRef.current) {
            dx = 1.0 - palmX - (1.0 - lastPalmPosRef.current.x); 
            dy = palmY - lastPalmPosRef.current.y;
          }
          lastPalmPosRef.current = { x: palmX, y: palmY };

          // 4. 手势逻辑判定
          let detectedGesture: GestureName = 'None';

          // 统计伸直的手指 (不含拇指)
          const extendedCount = (fingers.index ? 1 : 0) + (fingers.middle ? 1 : 0) + (fingers.ring ? 1 : 0) + (fingers.pinky ? 1 : 0);

          if (isPinch && fingers.middle) {
             detectedGesture = 'Pinch';
          } else if (extendedCount === 4 && fingers.thumb) {
             // 五指张开：所有手指都伸直
             detectedGesture = 'Open_Palm';
          } else if (extendedCount <= 1 && !fingers.thumb) {
             // 握拳：放宽条件，允许最多1根手指轻微伸出
             detectedGesture = 'Closed_Fist';
          } else if (extendedCount === 0 && fingers.thumb) {
             // 只有拇指伸直，其他手指弯曲 - 判断拇指方向
             const thumbTipY = landmarks[4].y;
             const thumbBaseY = landmarks[2].y;
             const thumbDiffY = thumbTipY - thumbBaseY;

             if (thumbDiffY < -0.05) {
               detectedGesture = 'Thumb_Up';
             } else if (thumbDiffY > 0.05) {
               detectedGesture = 'Thumb_Down';
             } else {
               detectedGesture = 'Closed_Fist'; // 拇指水平，视为握拳
             }

          } else if (fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
             detectedGesture = 'Victory';
          } else if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
             detectedGesture = 'Pointing_Up';
          } else if (fingers.thumb && fingers.index && !fingers.middle && !fingers.ring && fingers.pinky) {
             detectedGesture = 'ILoveYou';
          }

          // 5. 状态平滑与防抖
          if (detectedGesture !== 'None') {
            if (gestureStreakRef.current.name === detectedGesture) {
              gestureStreakRef.current.count++;
            } else {
              gestureStreakRef.current = { name: detectedGesture, count: 1 };
            }
          } else {
            gestureStreakRef.current = { name: null, count: 0 };
          }

          const thresholdMap: Record<string, number> = {
            'Pinch': 2,
            'Open_Palm': 2,
            'Closed_Fist': 2,
            'Thumb_Up': 5,
            'Thumb_Down': 5,
            'Victory': 4,
            'ILoveYou': 5
          };
          const threshold = thresholdMap[detectedGesture] || 3;

          const isStable = gestureStreakRef.current.count >= threshold;

          if (dbg) {
             const stateStr = `T:${fingers.thumb?1:0} I:${fingers.index?1:0} M:${fingers.middle?1:0} R:${fingers.ring?1:0} P:${fingers.pinky?1:0}`;
             callbacksRef.current.onStatus(
               `${detectedGesture} (${gestureStreakRef.current.count}/${threshold}) ${stateStr}`
             );
          }


          // 6. 触发回调与物理效果
          
          // 手掌张开时的移动和缩放
          if (detectedGesture === 'Open_Palm' || extendedCount === 4) {
             // 如果在进行 Open_Palm 交互，暂停自动旋转的动量累积
             rotationBoostRef.current = 0; 
             callbacksRef.current.onMove?.(0);

             // 照片锁定期间禁止移动和缩放，但继续处理其他手势
             if (!callbacksRef.current.photoLocked) {
               // 缩放控制 (仅在稳定时)
               if (isStable) {
                  const handSize = Math.hypot(landmarks[0].x - landmarks[9].x, landmarks[0].y - landmarks[9].y);
                  const currentScale = lastHandScaleRef.current === null 
                     ? handSize 
                     : lastHandScaleRef.current * 0.9 + handSize * 0.1; // 平滑处理
                  
                  if (lastHandScaleRef.current !== null && callbacksRef.current.onZoom) {
                     const deltaScale = currentScale - lastHandScaleRef.current;
                     const currentZoomSpeed = callbacksRef.current.zoomSpeed || 100;
                     if (Math.abs(deltaScale) > 0.001) {
                        callbacksRef.current.onZoom(deltaScale * currentZoomSpeed); 
                     }
                  }
                  lastHandScaleRef.current = currentScale;
               } else {
                 lastHandScaleRef.current = null;
               }
               
               // 视角移动
               const moveThreshold = 0.001;
               if (callbacksRef.current.onPalmMove && (Math.abs(dx) > moveThreshold || Math.abs(dy) > moveThreshold)) {
                 callbacksRef.current.onPalmMove(dx * callbacksRef.current.palmSpeed, dy * callbacksRef.current.palmSpeed);
               }
             } else {
               // 锁定期间重置状态，但不处理移动和缩放
               lastHandScaleRef.current = null;
               lastPalmPosRef.current = null;
             }
          } else {
             lastHandScaleRef.current = null;
             lastPalmPosRef.current = null;
             
             // 非 Open_Palm 状态下，应用旋转阻尼
             if (callbacksRef.current.isPhotoSelected || detectedGesture === 'Pinch') {
                rotationBoostRef.current = 0;
                callbacksRef.current.onMove?.(0);
             } else {
                rotationBoostRef.current *= 0.9;
                if (Math.abs(rotationBoostRef.current) < 0.01) rotationBoostRef.current = 0;
                callbacksRef.current.onMove?.(rotationBoostRef.current * 0.08);
             }
          }

          // 触发稳定手势
          if (isStable) {
            if (detectedGesture === 'Pinch') {
              // 计算捏合位置（翻转 x 坐标以匹配屏幕坐标系，因为摄像头是镜像的）
              const pinchX = 1 - (landmarks[4].x + landmarks[8].x) / 2;
              const pinchY = (landmarks[4].y + landmarks[8].y) / 2;
              
              // 检查是否与上次捏合位置相近（防止同一位置重复触发）
              const lastPos = lastPinchPosRef.current;
              const posChanged = !lastPos || 
                Math.abs(pinchX - lastPos.x) > 0.1 || 
                Math.abs(pinchY - lastPos.y) > 0.1;
              
              if (!pinchActiveRef.current && pinchCooldownRef.current <= 0 && posChanged) {
                 pinchActiveRef.current = true;
                 pinchCooldownRef.current = 0.3;
                 lastPinchPosRef.current = { x: pinchX, y: pinchY };
                 callbacksRef.current.onPinch?.({
                   x: pinchX,
                   y: pinchY
                 });
              }
            } else {
               pinchActiveRef.current = false;
               if (detectedGesture !== 'None') {
                  callbacksRef.current.onGesture(detectedGesture);
               }
            }
          } else if (detectedGesture === 'None') {
             pinchActiveRef.current = false;
             lastPinchPosRef.current = null;
          }

        } else {
          // 未检测到手
          palmHistoryRef.current = []; 
          gestureStreakRef.current = { name: null, count: 0 };
          rotationBoostRef.current *= 0.9;
          callbacksRef.current.onMove?.(rotationBoostRef.current * 0.05);
          if (!dbg) callbacksRef.current.onStatus('AI 就绪');
        }
      }
      requestRef = requestAnimationFrame(predictWebcam);
    };

    setup();

    return () => {
      isActive = false;
      if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
      cancelAnimationFrame(requestRef);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      handLandmarker?.close();
    };
  }, [enabled, getFingerState]);


  return (
    <>
      {/* 视频预览容器 - 只在 debugMode 时显示 */}
      {debugMode && (
        <div
          style={{
            position: 'fixed',
            top: mobile ? '60px' : '50px',
            right: '16px',
            width: '160px',
            borderRadius: '8px',
            zIndex: 100,
            overflow: 'hidden',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '12px',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            📷 加载中...
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        style={{
          opacity: debugMode ? 0.8 : 0,
          position: 'fixed',
          top: mobile ? '60px' : '50px',
          right: '16px',
          width: debugMode ? '160px' : '1px',
          height: debugMode ? 'auto' : '1px',
          borderRadius: '8px',
          zIndex: debugMode ? 102 : -1,
          transform: 'scaleX(-1)',
          pointerEvents: 'none',
          backgroundColor: 'transparent',
        }}
        playsInline
        muted
        autoPlay
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: mobile ? '60px' : '50px',
          right: '16px',
          width: debugMode ? '160px' : '1px',
          height: debugMode ? 'auto' : '1px',
          zIndex: debugMode ? 103 : -1,
          transform: 'scaleX(-1)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

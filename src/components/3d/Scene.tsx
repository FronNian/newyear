import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Preload, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useAppStore, useSettings, useCountdown, useCelebrationState, usePhotoWallSettings } from '@/stores/appStore';
import { useStorylineStore } from '@/stores/storylineStore';
import { detectDevice, getRecommendedRenderSettings } from '@/utils/deviceUtils';
import { triggerCelebration } from '@/services/celebrationService';
import ParticleTree from './ParticleTree';
import CountdownDisplay from './CountdownDisplay';
import CountdownParticleText from './CountdownParticleText';
import CountdownPulseParticles from './CountdownPulseParticles';
import Snowfall from './Snowfall';
import Fireworks from './Fireworks';
import HeartEffect from './HeartEffect';
import PhotoOrnaments from './PhotoOrnaments';
import DecorSystem from './DecorSystem';
import YearDisplay from './YearDisplay';
import BlessingAnimation from './BlessingAnimation';
import ConfettiEffect from './ConfettiEffect';
import PhotoWall from './PhotoWall';
import { TunnelPlayer } from './storyline';

// 点击空白处取消选中照片的组件
function ClickCatcher() {
  const setSelectedPhotoId = useAppStore((state) => state.setSelectedPhotoId);
  
  return (
    <mesh
      position={[0, 0, -50]}
      onClick={() => setSelectedPhotoId(null)}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

// 相机移动检测组件 - 移动相机时取消选中照片
function CameraMovementDetector() {
  const { camera } = useThree();
  const selectedPhotoId = useAppStore((state) => state.selectedPhotoId);
  const setSelectedPhotoId = useAppStore((state) => state.setSelectedPhotoId);
  
  const lastCameraPos = useRef({ x: 0, y: 0, z: 0 });
  const lastCameraRot = useRef({ x: 0, y: 0 });
  
  useFrame(() => {
    if (selectedPhotoId === null) {
      // 没有选中照片时，只更新位置记录
      lastCameraPos.current = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
      lastCameraRot.current = { x: camera.rotation.x, y: camera.rotation.y };
      return;
    }
    
    // 检测相机位置变化
    const posDelta = Math.abs(camera.position.x - lastCameraPos.current.x) +
                     Math.abs(camera.position.y - lastCameraPos.current.y) +
                     Math.abs(camera.position.z - lastCameraPos.current.z);
    
    // 检测相机旋转变化
    const rotDelta = Math.abs(camera.rotation.x - lastCameraRot.current.x) +
                     Math.abs(camera.rotation.y - lastCameraRot.current.y);
    
    // 如果相机移动超过阈值，取消选中照片
    if (posDelta > 0.1 || rotDelta > 0.02) {
      setSelectedPhotoId(null);
    }
    
    // 更新记录
    lastCameraPos.current = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    lastCameraRot.current = { x: camera.rotation.x, y: camera.rotation.y };
  });
  
  return null;
}

// 默认相机位置和朝向
const DEFAULT_CAMERA_POSITION = { x: 0, y: 0, z: 10 };
const DEFAULT_CAMERA_TARGET = { x: 0, y: 0, z: 0 };

// 支持手势控制的 OrbitControls
function GestureOrbitControls() {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const { camera } = useThree();
  const palmMove = useAppStore((state) => state.palmMove);
  const setPalmMove = useAppStore((state) => state.setPalmMove);
  const zoomDelta = useAppStore((state) => state.zoomDelta);
  const setZoomDelta = useAppStore((state) => state.setZoomDelta);
  const selectedPhotoId = useAppStore((state) => state.selectedPhotoId);
  const cameraResetRequested = useAppStore((state) => state.cameraResetRequested);
  const setCameraResetRequested = useAppStore((state) => state.setCameraResetRequested);
  
  // 平滑重置相机的状态
  const isResettingRef = useRef(false);
  const resetProgressRef = useRef(0);
  const startPosRef = useRef({ x: 0, y: 0, z: 0 });
  
  // 组件挂载时立即重置相机到默认位置
  useEffect(() => {
    // 立即设置相机位置和朝向
    camera.position.set(DEFAULT_CAMERA_POSITION.x, DEFAULT_CAMERA_POSITION.y, DEFAULT_CAMERA_POSITION.z);
    camera.up.set(0, 1, 0);
    camera.lookAt(DEFAULT_CAMERA_TARGET.x, DEFAULT_CAMERA_TARGET.y, DEFAULT_CAMERA_TARGET.z);
    
    if (controlsRef.current) {
      controlsRef.current.target.set(DEFAULT_CAMERA_TARGET.x, DEFAULT_CAMERA_TARGET.y, DEFAULT_CAMERA_TARGET.z);
      controlsRef.current.update();
    }
  }, [camera]);
  
  // 监听重置请求
  useEffect(() => {
    if (cameraResetRequested && controlsRef.current) {
      // 记录当前位置，开始平滑过渡
      startPosRef.current = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      };
      isResettingRef.current = true;
      resetProgressRef.current = 0;
      setCameraResetRequested(false);
    }
  }, [cameraResetRequested, camera, setCameraResetRequested]);
  
  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    
    // 处理相机重置动画
    if (isResettingRef.current) {
      resetProgressRef.current += delta * 2; // 0.5秒完成
      const t = Math.min(1, resetProgressRef.current);
      // 使用 easeOutCubic 缓动
      const eased = 1 - Math.pow(1 - t, 3);
      
      // 平滑插值到目标位置
      camera.position.x = startPosRef.current.x + (DEFAULT_CAMERA_POSITION.x - startPosRef.current.x) * eased;
      camera.position.y = startPosRef.current.y + (DEFAULT_CAMERA_POSITION.y - startPosRef.current.y) * eased;
      camera.position.z = startPosRef.current.z + (DEFAULT_CAMERA_POSITION.z - startPosRef.current.z) * eased;
      
      // 确保相机朝向正确
      camera.up.set(0, 1, 0);
      
      // 更新 OrbitControls 的 target
      controlsRef.current.target.set(
        DEFAULT_CAMERA_TARGET.x,
        DEFAULT_CAMERA_TARGET.y,
        DEFAULT_CAMERA_TARGET.z
      );
      
      // 让相机看向目标点
      camera.lookAt(DEFAULT_CAMERA_TARGET.x, DEFAULT_CAMERA_TARGET.y, DEFAULT_CAMERA_TARGET.z);
      
      if (t >= 1) {
        isResettingRef.current = false;
      }
      
      controlsRef.current.update();
      return;
    }
    
    // 处理手势移动
    if (palmMove && selectedPhotoId === null) {
      const currentAzimuth = controlsRef.current.getAzimuthalAngle();
      const currentPolar = controlsRef.current.getPolarAngle();
      
      // 平滑移动
      const smoothFactor = 0.15;
      const targetAzimuth = currentAzimuth + palmMove.x;
      const smoothAzimuth = currentAzimuth + (targetAzimuth - currentAzimuth) * smoothFactor;
      controlsRef.current.setAzimuthalAngle(smoothAzimuth);
      
      // 垂直移动（限制范围）
      const targetPolar = Math.max(0.3, Math.min(Math.PI * 0.85, currentPolar + palmMove.y));
      const smoothPolar = currentPolar + (targetPolar - currentPolar) * smoothFactor;
      controlsRef.current.setPolarAngle(smoothPolar);
      
      // 清除移动状态
      setPalmMove(null);
    }
    
    // 处理缩放
    if (Math.abs(zoomDelta) > 0.1) {
      const currentDistance = controlsRef.current.getDistance();
      const targetDistance = Math.max(3, Math.min(20, currentDistance - zoomDelta * 0.5));
      
      // 平滑缩放
      const direction = controlsRef.current.object.position.clone().normalize();
      const newDistance = currentDistance + (targetDistance - currentDistance) * delta * 5;
      const newPos = direction.multiplyScalar(newDistance);
      controlsRef.current.object.position.copy(newPos);
      
      // 衰减缩放值
      setZoomDelta(zoomDelta * 0.9);
      if (Math.abs(zoomDelta) < 0.1) {
        setZoomDelta(0);
      }
    }
    
    controlsRef.current.update();
  });
  
  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={20}
      maxPolarAngle={Math.PI * 0.85}
      enablePan={false}
    />
  );
}


function SceneContent() {
  const settings = useSettings();
  const photoWallSettings = usePhotoWallSettings();
  const activeEffects = useAppStore((state) => state.activeEffects);
  const clearEffect = useAppStore((state) => state.clearEffect);
  const photos = useAppStore((state) => state.photos);
  const isManualCountdownActive = useAppStore((state) => state.isManualCountdownActive);
  const stopManualCountdown = useAppStore((state) => state.stopManualCountdown);
  const triggerEffect = useAppStore((state) => state.triggerEffect);
  const celebrationState = useCelebrationState();
  const isParticleSpread = useAppStore((state) => state.isParticleSpread);
  const toggleParticleSpread = useAppStore((state) => state.toggleParticleSpread);
  
  // 故事线模式状态
  const isStorylineMode = useStorylineStore((state) => state.isStorylineMode);
  
  // 手动倒计时序列状态
  const [manualCountdownText, setManualCountdownText] = useState<string>('');
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentCountRef = useRef(0);
  const triggerCountdownPulse = useAppStore((state) => state.triggerCountdownPulse);
  const clearCountdownPulse = useAppStore((state) => state.clearCountdownPulse);
  const setIsPlaying = useAppStore((state) => state.setIsPlaying);
  const setCurrentSong = useAppStore((state) => state.setCurrentSong);
  const playlist = useAppStore((state) => state.playlist);
  
  // 播放倒计时音乐
  const playCountdownMusic = useCallback(() => {
    // 如果配置了特定音乐，切换到该音乐
    if (settings.countdownMusicId && playlist.length > 0) {
      const targetSong = playlist.find(s => s.id === settings.countdownMusicId);
      if (targetSong) {
        setCurrentSong(targetSong);
      }
    }
    // 开始播放
    setIsPlaying(true);
  }, [settings.countdownMusicId, playlist, setCurrentSong, setIsPlaying]);
  
  // 当手动倒计时激活时，开始倒计时
  useEffect(() => {
    if (isManualCountdownActive) {
      currentCountRef.current = settings.countdownDuration;
      setManualCountdownText(currentCountRef.current.toString());
      // 触发初始脉冲
      triggerCountdownPulse(currentCountRef.current, settings.countdownDuration);
      
      // 倒计时开始时播放音乐
      if (settings.countdownMusicTrigger === 'start') {
        playCountdownMusic();
      }
      
      countdownTimerRef.current = setInterval(() => {
        currentCountRef.current -= 1;
        
        if (currentCountRef.current > 0) {
          setManualCountdownText(currentCountRef.current.toString());
          // 每秒触发脉冲效果
          triggerCountdownPulse(currentCountRef.current, settings.countdownDuration);
        } else {
          // 倒计时结束
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          
          // 清除脉冲效果
          clearCountdownPulse();
          
          // 倒计时结束时播放音乐
          if (settings.countdownMusicTrigger === 'end') {
            playCountdownMusic();
          }
          
          // 倒计时结束后自动散开粒子
          if (!isParticleSpread) {
            toggleParticleSpread();
          }
          
          triggerEffect('firework');
          triggerCelebration();
          stopManualCountdown();
        }
      }, 1000);
    } else {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setManualCountdownText('');
      clearCountdownPulse();
    }
    
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [isManualCountdownActive, settings.countdownDuration, settings.countdownMusicTrigger, triggerEffect, stopManualCountdown, isParticleSpread, toggleParticleSpread, triggerCountdownPulse, clearCountdownPulse, playCountdownMusic]);
  
  // 庆祝序列状态 - 调试日志
  useEffect(() => {
    if (celebrationState.isActive) {
      console.log('[Celebration] Active, phase:', celebrationState.phase);
    }
  }, [celebrationState.isActive, celebrationState.phase]);
  
  // 庆祝序列显示条件
  const showYearDisplay = celebrationState.isActive && 
    (celebrationState.phase === 'year_display' || celebrationState.phase === 'blessing' || celebrationState.phase === 'confetti' || celebrationState.phase === 'firework_burst');
  // 祝福语与年份同时显示（year_display 阶段就开始）
  const showBlessing = celebrationState.isActive && 
    (celebrationState.phase === 'year_display' || celebrationState.phase === 'blessing' || celebrationState.phase === 'confetti');
  const showConfetti = celebrationState.isActive && celebrationState.phase === 'confetti';
  
  // 是否隐藏主要3D元素（庆祝时或手动倒计时时）
  const hideMainElements = isManualCountdownActive || celebrationState.isActive;
  
  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, 5, -10]} intensity={0.3} color="#ff6b6b" />
      
      {/* 星空背景 - 根据照片墙设置决定是否显示 */}
      {settings.starFieldEnabled && !isStorylineMode && 
       !(photoWallSettings.enabled && photoWallSettings.backgroundMode === 'replace') && (
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
      )}
      
      {/* 照片墙背景 */}
      {!isStorylineMode && <PhotoWall />}
      
      {/* 故事线播放器 - 使用新的隧道模式 */}
      {isStorylineMode && <TunnelPlayer />}
      
      {/* 粒子图形 - 手动倒计时、庆祝和故事线模式时隐藏 */}
      {!hideMainElements && !isStorylineMode && (
        <>
          <ParticleTree
            particleCount={settings.particleCount}
            particleShape={settings.particleShape}
            colorTheme={settings.colorTheme}
          />
          
          {/* 照片装饰 - 随粒子图形一起显示 */}
          {photos.length > 0 && (
            <PhotoOrnaments photoPaths={photos.map(p => p.url)} />
          )}
        </>
      )}
      
      {/* 普通倒计时显示 - 非手动倒计时、非庆祝和非故事线模式时显示 */}
      {!hideMainElements && !isStorylineMode && (
        <CountdownDisplay />
      )}
      
      {/* 手动倒计时粒子文字 - 使用平滑过渡 */}
      {settings.particleTextEnabled && isManualCountdownActive && manualCountdownText && (
        <CountdownParticleText
          text={manualCountdownText}
          colorTheme={settings.colorTheme}
          particleCount={settings.countdownParticleCount}
          position={[0, 0, 1]}
          scale={2.5}
        />
      )}
      
      {/* 倒计时伴舞脉冲粒子 - 围绕倒计时数字旋转 */}
      {isManualCountdownActive && (
        <CountdownPulseParticles particleCount={150} />
      )}
      
      {/* 雪花特效 */}
      {(settings.snowEnabled || activeEffects.has('snow')) && !isStorylineMode && (
        <Snowfall count={settings.snowEnabled ? 500 : 1000} />
      )}
      
      {/* 爱心特效 */}
      {!isStorylineMode && (
        <HeartEffect
          active={activeEffects.has('heart')}
          onComplete={() => clearEffect('heart')}
        />
      )}
      
      {/* 3D 装饰物品 - 手动倒计时、庆祝和故事线模式时隐藏 */}
      {!hideMainElements && !isStorylineMode && <DecorSystem />}
      
      {/* 庆祝序列组件 */}
      {showYearDisplay && <YearDisplay visible={showYearDisplay} />}
      {showBlessing && <BlessingAnimation visible={showBlessing} position={[0, -1.5, 4]} />}
      <ConfettiEffect active={showConfetti} intensity={1} />
      
      {/* 点击空白处取消选中照片 */}
      <ClickCatcher />
      
      {/* 相机移动检测 - 移动相机时取消选中照片 */}
      <CameraMovementDetector />
      
      {/* 相机控制 - 支持手势移动，故事线模式时禁用 */}
      {!isStorylineMode && <GestureOrbitControls />}
    </>
  );
}


export default function Scene() {
  const settings = useSettings();
  const countdown = useCountdown();
  const activeEffects = useAppStore((state) => state.activeEffects);
  const clearEffect = useAppStore((state) => state.clearEffect);
  const setDeviceInfo = useAppStore((state) => state.setDeviceInfo);
  const setLoading = useAppStore((state) => state.setLoading);
  
  useEffect(() => {
    // 检测设备信息
    const deviceInfo = detectDevice();
    setDeviceInfo(deviceInfo);
  }, [setDeviceInfo]);
  
  const deviceInfo = useAppStore((state) => state.deviceInfo);
  const renderSettings = deviceInfo
    ? getRecommendedRenderSettings(deviceInfo)
    : { antialias: true, pixelRatio: 1, shadowMapEnabled: false };
  
  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{
          antialias: renderSettings.antialias,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={renderSettings.pixelRatio}
        onCreated={() => {
          // 场景创建完成
          setTimeout(() => setLoading(false), 500);
        }}
      >
        <color attach="background" args={['#050505']} />
        
        <Suspense fallback={null}>
          <SceneContent />
          
          {/* 后处理效果 */}
          <EffectComposer>
            <Bloom
              intensity={settings.bloomIntensity}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
          
          <Preload all />
        </Suspense>
      </Canvas>
      
      {/* 烟花特效 - 在 Canvas 外部渲染 */}
      <Fireworks
        active={activeEffects.has('firework') || countdown.isFinished}
        onComplete={() => clearEffect('firework')}
      />
    </>
  );
}

/**
 * 音频分析服务 - 使用 Web Audio API 进行实时音频频率分析
 * 用于音频可视化（频谱柱状图、色差效果等）
 */

export interface AudioAnalyzerConfig {
  fftSize: number;              // FFT 大小，默认 256
  smoothingTimeConstant: number; // 平滑系数，默认 0.8
  minDecibels: number;          // 最小分贝，默认 -90
  maxDecibels: number;          // 最大分贝，默认 -10
}

const DEFAULT_CONFIG: AudioAnalyzerConfig = {
  fftSize: 256,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
};

type AnalyzerEventCallback = (event: 'connect' | 'disconnect' | 'error', data?: unknown) => void;

class AudioAnalyzerService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private connectedElement: HTMLAudioElement | null = null;
  private frequencyData: Uint8Array = new Uint8Array(0);
  private timeDomainData: Uint8Array = new Uint8Array(0);
  private config: AudioAnalyzerConfig = DEFAULT_CONFIG;
  private callbacks: Set<AnalyzerEventCallback> = new Set();
  // 缓存已创建的 source nodes，避免重复创建
  private sourceNodeCache: WeakMap<HTMLAudioElement, MediaElementAudioSourceNode> = new WeakMap();

  /**
   * 订阅事件
   */
  subscribe(callback: AnalyzerEventCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private emit(event: 'connect' | 'disconnect' | 'error', data?: unknown): void {
    this.callbacks.forEach((cb) => cb(event, data));
  }

  /**
   * 连接到音频源
   */
  connect(audioElement: HTMLAudioElement, config?: Partial<AudioAnalyzerConfig>): boolean {
    // 如果已连接同一元素，跳过
    if (this.connectedElement === audioElement && this.analyser) {
      return true;
    }

    try {
      // 合并配置
      this.config = { ...DEFAULT_CONFIG, ...config };

      // 创建或复用 AudioContext
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // 恢复 AudioContext（处理浏览器自动播放策略）
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // 创建分析器节点
      if (!this.analyser) {
        this.analyser = this.audioContext.createAnalyser();
      }
      this.analyser.fftSize = this.config.fftSize;
      this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;
      this.analyser.minDecibels = this.config.minDecibels;
      this.analyser.maxDecibels = this.config.maxDecibels;

      // 检查是否已有缓存的 source node
      let sourceNode = this.sourceNodeCache.get(audioElement);
      
      if (!sourceNode) {
        // 创建新的音频源节点
        sourceNode = this.audioContext.createMediaElementSource(audioElement);
        this.sourceNodeCache.set(audioElement, sourceNode);
      }
      
      // 断开之前的连接
      if (this.sourceNode && this.sourceNode !== sourceNode) {
        try {
          this.sourceNode.disconnect();
        } catch {
          // 忽略断开错误
        }
      }
      
      this.sourceNode = sourceNode;
      
      // 重新连接
      try {
        this.sourceNode.disconnect();
      } catch {
        // 可能未连接，忽略
      }
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      // 初始化数据数组
      const bufferLength = this.analyser.frequencyBinCount;
      this.frequencyData = new Uint8Array(bufferLength);
      this.timeDomainData = new Uint8Array(bufferLength);

      this.connectedElement = audioElement;
      this.emit('connect');
      return true;
    } catch (error) {
      console.warn('AudioAnalyzer: 连接失败', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * 断开连接（保留 analyser 以便重新连接）
   */
  disconnect(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // 忽略断开错误
      }
      // 不要设为 null，保留在缓存中
    }

    this.connectedElement = null;
    this.emit('disconnect');
  }

  /**
   * 完全销毁（释放所有资源）
   */
  destroy(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // 忽略断开错误
      }
      this.sourceNode = null;
    }

    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch {
        // 忽略断开错误
      }
      this.analyser = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.connectedElement = null;
    this.frequencyData = new Uint8Array(0);
    this.timeDomainData = new Uint8Array(0);
    this.callbacks.clear();
  }

  /**
   * 获取频率数据 (0-255 数组)
   */
  getFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData);
    }
    return this.frequencyData;
  }

  /**
   * 获取时域数据 (波形)
   */
  getTimeDomainData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.timeDomainData);
    }
    return this.timeDomainData;
  }

  /**
   * 获取平均振幅 (用于色差效果)
   */
  getAverageAmplitude(): number {
    const data = this.getFrequencyData();
    if (data.length === 0) return 0;

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / data.length;
  }

  /**
   * 获取低频能量 (用于节拍检测，取前1/4频段)
   */
  getBassEnergy(): number {
    const data = this.getFrequencyData();
    if (data.length === 0) return 0;

    const bassRange = Math.floor(data.length / 4);
    let sum = 0;
    for (let i = 0; i < bassRange; i++) {
      sum += data[i];
    }
    return sum / bassRange;
  }

  /**
   * 获取频段数量
   */
  getFrequencyBinCount(): number {
    return this.analyser?.frequencyBinCount || 0;
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.analyser !== null && this.connectedElement !== null;
  }

  /**
   * 获取 AudioContext 状态
   */
  getContextState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  /**
   * 恢复 AudioContext（用于用户交互后恢复）
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

// 单例导出
export const audioAnalyzerService = new AudioAnalyzerService();

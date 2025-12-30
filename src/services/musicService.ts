import { Howl, Howler } from 'howler';
import type { Song, LyricLine, PlayMode } from '@/types';
import { parseLRC } from '@/utils/lrcParser';

// 内置歌曲列表 - 基于 public/music 目录的实际文件
export const DEFAULT_SONGS: Song[] = [
  {
    id: 'countdown',
    title: '倒数',
    artist: 'G.E.M. 邓紫棋',
    src: '/music/倒数 - G.E.M. 邓紫棋.mp3',
    lrcSrc: '/music/倒数 - G.E.M. 邓紫棋.lrc',
  },
  {
    id: 'gongxi',
    title: '恭喜发财',
    artist: '刘德华',
    src: '/music/恭喜发财 - 刘德华.mp3',
    lrcSrc: '/music/恭喜发财 - 刘德华.lrc',
  },
  {
    id: 'xiangqin',
    title: '相亲相爱',
    artist: '陈慧琳、张惠妹、孙楠、古淖文',
    src: '/music/相亲相爱 - 陈慧琳、张惠妹、孙楠、古淖文.mp3',
    lrcSrc: '/music/相亲相爱 - 陈慧琳、张惠妹、孙楠、古淖文.lrc',
  },
  {
    id: 'bubu',
    title: '步步',
    artist: '五月天',
    src: '/music/步步 - 五月天.mp3',
    lrcSrc: '/music/步步 - 五月天.lrc',
  },
  {
    id: 'weiyi',
    title: '唯一',
    artist: 'G.E.M. 邓紫棋',
    src: '/music/唯一 - G.E.M. 邓紫棋.mp3',
    lrcSrc: '/music/唯一 - G.E.M. 邓紫棋.lrc',
  },
  {
    id: 'buyihan',
    title: '不遗憾',
    artist: '李荣浩',
    src: '/music/不遗憾 - 李荣浩.mp3',
    lrcSrc: '/music/不遗憾 - 李荣浩.lrc',
  },
  {
    id: 'tebideren',
    title: '特别的人',
    artist: '方大同',
    src: '/music/特别的人 - 方大同.mp3',
    lrcSrc: '/music/特别的人 - 方大同.lrc',
  },
  {
    id: 'jimoyanhua',
    title: '寂寞烟火',
    artist: '朱婧汐Akini Jing',
    src: '/music/寂寞烟火 - 朱婧汐Akini Jing.mp3',
    lrcSrc: '/music/寂寞烟火 - 朱婧汐Akini Jing.lrc',
  },
  {
    id: 'yizuogudao',
    title: '一座孤岛',
    artist: '夏子航（2603）',
    src: '/music/一座孤岛 - 夏子航（2603）.mp3',
    lrcSrc: '/music/一座孤岛 - 夏子航（2603）.lrc',
  },
  {
    id: 'hugme',
    title: 'Hug me (抱我)',
    artist: '蔡徐坤',
    src: '/music/Hug me (抱我) - 蔡徐坤.mp3',
    lrcSrc: '/music/Hug me (抱我) - 蔡徐坤.lrc',
  },
  {
    id: 'lovestory',
    title: 'Love Story',
    artist: 'Taylor Swift',
    src: '/music/Love Story - Taylor Swift.mp3',
    lrcSrc: '/music/Love Story - Taylor Swift.lrc',
  },
  {
    id: 'newyearseve',
    title: "New Year's Eve",
    artist: 'MØ',
    src: "/music/New Year's Eve - MØ.mp3",
    lrcSrc: "/music/New Year's Eve - MØ.lrc",
  },
];

type MusicEventCallback = (event: string, data?: unknown) => void;

class MusicService {
  private currentHowl: Howl | null = null;
  private currentSong: Song | null = null;
  private lyrics: LyricLine[] = [];
  private volume: number = 0.7;
  private isPlaying: boolean = false;
  private callbacks: Set<MusicEventCallback> = new Set();
  private updateInterval: number | null = null;
  private playMode: PlayMode = 'list-repeat';
  private playlist: Song[] = DEFAULT_SONGS;
  
  constructor() {
    // 设置全局音量
    Howler.volume(this.volume);
  }
  
  /**
   * 订阅事件
   */
  subscribe(callback: MusicEventCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
  
  /**
   * 触发事件
   */
  private emit(event: string, data?: unknown): void {
    this.callbacks.forEach((cb) => cb(event, data));
  }
  
  /**
   * 设置播放模式
   */
  setPlayMode(mode: PlayMode): void {
    this.playMode = mode;
    this.emit('playModeChange', mode);
  }
  
  /**
   * 获取播放模式
   */
  getPlayMode(): PlayMode {
    return this.playMode;
  }
  
  /**
   * 设置播放列表
   */
  setPlaylist(songs: Song[]): void {
    this.playlist = songs;
  }
  
  /**
   * 获取播放列表
   */
  getPlaylist(): Song[] {
    return this.playlist;
  }
  
  /**
   * 根据播放模式获取下一首歌
   */
  getNextSong(): Song | null {
    if (this.playlist.length === 0) return null;
    
    const currentIndex = this.currentSong 
      ? this.playlist.findIndex(s => s.id === this.currentSong?.id)
      : -1;
    
    switch (this.playMode) {
      case 'single-repeat':
        return this.currentSong;
      
      case 'list-repeat':
        return this.playlist[(currentIndex + 1) % this.playlist.length];
      
      case 'sequential':
        if (currentIndex < this.playlist.length - 1) {
          return this.playlist[currentIndex + 1];
        }
        return null;
      
      case 'shuffle':
        if (this.playlist.length === 1) {
          return this.playlist[0];
        }
        // 随机选择一首不同的歌
        const available = this.playlist.filter(s => s.id !== this.currentSong?.id);
        return available[Math.floor(Math.random() * available.length)];
      
      default:
        return this.playlist[(currentIndex + 1) % this.playlist.length];
    }
  }
  
  /**
   * 根据播放模式获取上一首歌
   */
  getPrevSong(): Song | null {
    if (this.playlist.length === 0) return null;
    
    const currentIndex = this.currentSong 
      ? this.playlist.findIndex(s => s.id === this.currentSong?.id)
      : 0;
    
    switch (this.playMode) {
      case 'single-repeat':
        return this.currentSong;
      
      case 'shuffle':
        if (this.playlist.length === 1) {
          return this.playlist[0];
        }
        const available = this.playlist.filter(s => s.id !== this.currentSong?.id);
        return available[Math.floor(Math.random() * available.length)];
      
      default:
        return this.playlist[(currentIndex - 1 + this.playlist.length) % this.playlist.length];
    }
  }
  
  /**
   * 加载歌曲
   */
  async load(song: Song): Promise<void> {
    // 停止当前播放
    this.stop();
    
    this.currentSong = song;
    
    // 创建新的 Howl 实例
    this.currentHowl = new Howl({
      src: [song.src],
      html5: true,
      volume: this.volume,
      onload: () => {
        // 音频加载完成后发送 duration 事件
        const duration = this.currentHowl?.duration() || 0;
        if (duration > 0) {
          this.emit('duration', duration);
        }
      },
      onplay: () => {
        this.isPlaying = true;
        this.emit('play');
        // 播放时再次发送 duration 确保正确
        const duration = this.currentHowl?.duration() || 0;
        if (duration > 0) {
          this.emit('duration', duration);
        }
        this.startTimeUpdate();
      },
      onpause: () => {
        this.isPlaying = false;
        this.emit('pause');
        this.stopTimeUpdate();
      },
      onstop: () => {
        this.isPlaying = false;
        this.emit('stop');
        this.stopTimeUpdate();
      },
      onend: () => {
        this.isPlaying = false;
        this.emit('end');
        this.stopTimeUpdate();
      },
      onloaderror: (_id, error) => {
        this.emit('error', { type: 'load', error });
      },
      onplayerror: (_id, error) => {
        this.emit('error', { type: 'play', error });
      },
    });
    
    // 加载歌词
    if (song.lrcSrc) {
      try {
        const response = await fetch(song.lrcSrc);
        if (response.ok) {
          const lrcContent = await response.text();
          this.lyrics = parseLRC(lrcContent);
          this.emit('lyrics', this.lyrics);
        }
      } catch {
        this.lyrics = [];
      }
    } else {
      this.lyrics = [];
    }
    
    this.emit('loaded', song);
  }
  
  /**
   * 播放
   */
  play(): void {
    if (this.currentHowl) {
      this.currentHowl.play();
    }
  }
  
  /**
   * 暂停
   */
  pause(): void {
    if (this.currentHowl) {
      this.currentHowl.pause();
    }
  }
  
  /**
   * 停止
   */
  stop(): void {
    if (this.currentHowl) {
      this.currentHowl.stop();
      this.currentHowl.unload();
      this.currentHowl = null;
    }
    this.stopTimeUpdate();
  }
  
  /**
   * 切换播放/暂停
   */
  toggle(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  /**
   * 跳转到指定时间
   */
  seek(time: number): void {
    if (this.currentHowl) {
      this.currentHowl.seek(time);
      this.emit('seek', time);
    }
  }
  
  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.volume);
    if (this.currentHowl) {
      this.currentHowl.volume(this.volume);
    }
    this.emit('volume', this.volume);
  }
  
  /**
   * 获取当前播放时间
   */
  getCurrentTime(): number {
    if (this.currentHowl) {
      const time = this.currentHowl.seek();
      return typeof time === 'number' ? time : 0;
    }
    return 0;
  }
  
  /**
   * 获取歌曲时长
   */
  getDuration(): number {
    if (this.currentHowl) {
      return this.currentHowl.duration();
    }
    return this.currentSong?.duration || 0;
  }
  
  /**
   * 获取当前歌曲
   */
  getCurrentSong(): Song | null {
    return this.currentSong;
  }
  
  /**
   * 获取歌词
   */
  getLyrics(): LyricLine[] {
    return this.lyrics;
  }
  
  /**
   * 是否正在播放
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }
  
  /**
   * 开始时间更新
   */
  private startTimeUpdate(): void {
    this.stopTimeUpdate();
    this.updateInterval = window.setInterval(() => {
      const time = this.getCurrentTime();
      this.emit('timeupdate', time);
    }, 100);
  }
  
  /**
   * 停止时间更新
   */
  private stopTimeUpdate(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  /**
   * 获取底层 HTMLAudioElement（用于音频分析）
   * 注意：仅在 html5 模式下可用
   */
  getAudioElement(): HTMLAudioElement | null {
    if (!this.currentHowl) return null;
    
    // Howler 内部结构：_sounds[0]._node 是底层 audio element
    const sounds = (this.currentHowl as any)._sounds;
    if (sounds && sounds.length > 0 && sounds[0]._node) {
      return sounds[0]._node as HTMLAudioElement;
    }
    return null;
  }
  
  /**
   * 销毁
   */
  destroy(): void {
    this.stop();
    this.callbacks.clear();
  }
}

// 单例
export const musicService = new MusicService();

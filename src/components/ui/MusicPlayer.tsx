import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore, useMusicPlayMode, useLyricsPosition } from '@/stores/appStore';
import { musicService, DEFAULT_SONGS } from '@/services/musicService';
import { audioAnalyzerService } from '@/services/audioAnalyzerService';
import { getCurrentLyricIndex } from '@/utils/lrcParser';
import type { Song, LyricLine, PlayMode } from '@/types';
import { PLAY_MODE_ORDER, PLAY_MODE_NAMES } from '@/types';
import { Repeat, Repeat1, Shuffle, ListOrdered, Music, X } from 'lucide-react';
import SpectrumBars from './SpectrumBars';
import ChromaticAberration from './ChromaticAberration';

// 播放模式图标组件
const PlayModeIcon = ({ mode, className }: { mode: PlayMode; className?: string }) => {
  switch (mode) {
    case 'single-repeat':
      return <Repeat1 className={className} />;
    case 'list-repeat':
      return <Repeat className={className} />;
    case 'shuffle':
      return <Shuffle className={className} />;
    case 'sequential':
      return <ListOrdered className={className} />;
    default:
      return <Repeat className={className} />;
  }
};

export default function MusicPlayer() {
  const settings = useAppStore((state) => state.settings);
  const playMode = useMusicPlayMode();
  const lyricsPosition = useLyricsPosition();
  const setMusicPlayMode = useAppStore((state) => state.setMusicPlayMode);
  const storePlaylist = useAppStore((state) => state.playlist);
  const setStorePlaylist = useAppStore((state) => state.setPlaylist);
  const storeIsPlaying = useAppStore((state) => state.isPlaying);
  const setStoreIsPlaying = useAppStore((state) => state.setIsPlaying);
  
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showModeToast, setShowModeToast] = useState(false);
  const [playlist] = useState<Song[]>(DEFAULT_SONGS);
  
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const userScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  // 同步播放列表到 store（供设置面板使用）
  useEffect(() => {
    if (storePlaylist.length === 0 && playlist.length > 0) {
      setStorePlaylist(playlist);
    }
  }, [playlist, storePlaylist.length, setStorePlaylist]);

  // 监听 store 的播放请求（从其他组件触发播放）
  // 这个 effect 只处理外部组件（如倒计时）触发的播放请求
  const hasTriggeredPlayRef = useRef(false);
  const isAutoPlayingNextRef = useRef(false); // 标记是否正在自动播放下一首
  
  useEffect(() => {
    // 如果正在自动播放下一首，跳过此逻辑
    if (isAutoPlayingNextRef.current) return;
    
    // 只在 storeIsPlaying 变为 true 且还没触发过时执行
    if (storeIsPlaying && !hasTriggeredPlayRef.current) {
      hasTriggeredPlayRef.current = true;
      
      // 如果当前没在播放，且 musicService 也没在播放，才开始播放
      if (!isPlaying && !musicService.getIsPlaying()) {
        if (currentSong) {
          musicService.play();
        } else if (playlist.length > 0) {
          musicService.load(playlist[0]).then(() => {
            musicService.play();
          });
        }
      }
    }
    
    // 当 storeIsPlaying 变为 false 时，重置标记
    if (!storeIsPlaying) {
      hasTriggeredPlayRef.current = false;
    }
  }, [storeIsPlaying, isPlaying, currentSong, playlist]);

  // 同步播放模式到服务
  useEffect(() => {
    musicService.setPlayMode(playMode);
  }, [playMode]);
  
  // 初始化音乐服务
  useEffect(() => {
    musicService.setPlaylist(playlist);
    
    const unsubscribe = musicService.subscribe((event, data) => {
      switch (event) {
        case 'loaded':
          setCurrentSong(data as Song);
          setDuration(0); // 重置 duration，等待 duration 事件
          break;
        case 'duration':
          // 收到 duration 事件时更新
          setDuration(data as number);
          break;
        case 'play':
          setIsPlaying(true);
          setStoreIsPlaying(true);
          // 延迟连接音频分析器，确保 Howler 内部 audio element 已就绪
          setTimeout(() => {
            const audioEl = musicService.getAudioElement();
            if (audioEl && !audioAnalyzerService.isConnected()) {
              audioAnalyzerService.connect(audioEl);
            }
          }, 100);
          break;
        case 'pause':
        case 'stop':
          setIsPlaying(false);
          setStoreIsPlaying(false);
          break;
        case 'end':
          setIsPlaying(false);
          // 自动播放下一首
          isAutoPlayingNextRef.current = true;
          const nextSong = musicService.getNextSong();
          if (nextSong) {
            musicService.load(nextSong).then(() => {
              musicService.play();
              isAutoPlayingNextRef.current = false;
            }).catch(() => {
              isAutoPlayingNextRef.current = false;
            });
          } else {
            setStoreIsPlaying(false);
            isAutoPlayingNextRef.current = false;
          }
          break;
        case 'timeupdate':
          setCurrentTime(data as number);
          break;
        case 'lyrics':
          setLyrics(data as LyricLine[]);
          break;
      }
    });
    
    // 加载第一首歌
    if (playlist.length > 0) {
      musicService.load(playlist[0]);
    }
    
    return () => {
      unsubscribe();
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [playlist, setStoreIsPlaying]);
  
  // 更新音量
  useEffect(() => {
    musicService.setVolume(settings.volume);
  }, [settings.volume]);
  
  // 更新当前歌词索引并自动滚动
  useEffect(() => {
    const index = getCurrentLyricIndex(lyrics, currentTime);
    setCurrentLyricIndex(index);
    
    // 只在歌词索引变化时滚动，且用户没有在手动滑动
    if (lyricsContainerRef.current && index >= 0 && !userScrollingRef.current) {
      const container = lyricsContainerRef.current;
      const lyricElements = container.querySelectorAll('[data-lyric-index]');
      const currentElement = lyricElements[index] as HTMLElement;
      if (currentElement) {
        currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLyricIndex, lyrics]); // 只依赖 currentLyricIndex 变化，不是每次 timeupdate
  
  // 单独更新歌词索引
  useEffect(() => {
    const index = getCurrentLyricIndex(lyrics, currentTime);
    if (index !== currentLyricIndex) {
      setCurrentLyricIndex(index);
    }
  }, [currentTime, lyrics]);
  
  // 处理用户手动滚动歌词
  const handleLyricsScroll = useCallback(() => {
    userScrollingRef.current = true;
    
    // 清除之前的定时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // 3秒后恢复自动滚动
    scrollTimeoutRef.current = window.setTimeout(() => {
      userScrollingRef.current = false;
    }, 3000);
  }, []);
  
  const handlePlayPause = useCallback(() => {
    musicService.toggle();
  }, []);
  
  const handleNext = useCallback(() => {
    const nextSong = musicService.getNextSong();
    if (nextSong) {
      musicService.load(nextSong).then(() => {
        musicService.play();
      });
    }
  }, []);
  
  const handlePrev = useCallback(() => {
    const prevSong = musicService.getPrevSong();
    if (prevSong) {
      musicService.load(prevSong).then(() => {
        musicService.play();
      });
    }
  }, []);
  
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    musicService.seek(time);
    setCurrentTime(time);
  }, []);
  
  const handleLyricClick = useCallback((time: number) => {
    musicService.seek(time);
    if (!isPlaying) {
      musicService.play();
    }
  }, [isPlaying]);
  
  const handleSongSelect = useCallback((song: Song) => {
    musicService.load(song).then(() => {
      musicService.play();
    });
    setShowPlaylist(false);
    setIsExpanded(false);
  }, []);
  
  const handlePlayModeToggle = useCallback(() => {
    const currentIndex = PLAY_MODE_ORDER.indexOf(playMode);
    const nextIndex = (currentIndex + 1) % PLAY_MODE_ORDER.length;
    const nextMode = PLAY_MODE_ORDER[nextIndex];
    setMusicPlayMode(nextMode);
    
    // 显示提示
    setShowModeToast(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setShowModeToast(false);
    }, 1500);
  }, [playMode, setMusicPlayMode]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 计算进度百分比
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // 当前歌词文本
  const currentLyricText = lyrics[currentLyricIndex]?.text || '';


  return (
    <>
      {/* 音频可视化组件 */}
      <SpectrumBars isPlaying={isPlaying} />
      <ChromaticAberration isPlaying={isPlaying} />
      
      {/* 播放模式切换提示 */}
      {showModeToast && (
        <div className="fixed bottom-32 left-4 z-50 bg-black/90 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 animate-fade-in">
          <PlayModeIcon mode={playMode} className="w-3 h-3" />
          <span>{PLAY_MODE_NAMES[playMode]}</span>
        </div>
      )}
      
      {/* 屏幕中央歌词显示 - 放在开始倒计时按钮下方 */}
      {lyricsPosition === 'center' && isPlaying && currentLyricText && (
        <div className="fixed bottom-52 sm:bottom-45 md:bottom-40 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="text-center px-8 py-4 bg-black/40 backdrop-blur-sm rounded-2xl max-w-lg">
            <div className="text-white text-xl sm:text-2xl font-medium leading-relaxed">
              {currentLyricText}
            </div>
            <div className="text-gray-400 text-sm mt-2">
              {currentSong?.title} - {currentSong?.artist}
            </div>
          </div>
        </div>
      )}
      
      {/* 展开的播放器弹窗 */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
          <div className="relative bg-gray-900/95 w-full sm:w-96 max-h-[80vh] sm:max-h-[70vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
            {/* 头部 */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700/50 shrink-0">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Music className="w-4 h-4" />
                {showPlaylist ? `播放列表 (${playlist.length})` : '正在播放'}
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {showPlaylist ? (
              /* 歌曲列表 */
              <div className="flex-1 overflow-y-auto">
                {playlist.map((song, index) => (
                  <button
                    key={song.id}
                    onClick={() => handleSongSelect(song)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors ${
                      currentSong?.id === song.id ? 'bg-white/10' : ''
                    }`}
                  >
                    <span className="w-6 text-center text-gray-500 text-sm">
                      {currentSong?.id === song.id ? (
                        <span className="text-green-400">♪</span>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="flex-1 min-w-0 text-left">
                      <div className={`text-sm truncate ${
                        currentSong?.id === song.id ? 'text-green-400' : 'text-white'
                      }`}>
                        {song.title}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {song.artist}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* 播放器详情 */
              <div className="flex-1 overflow-y-auto p-4">
                {/* 歌曲信息 */}
                <div className="text-center mb-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-red-500 rounded-2xl flex items-center justify-center text-4xl mb-3">
                    🎵
                  </div>
                  <div className="text-white text-lg font-medium">
                    {currentSong?.title || '未选择歌曲'}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {currentSong?.artist || '-'}
                  </div>
                </div>
                
                {/* 进度条 */}
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                
                {/* 控制按钮 */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={handlePrev}
                    className="w-12 h-12 text-white hover:bg-white/10 rounded-full flex items-center justify-center text-xl"
                  >
                    ⏮
                  </button>
                  <button
                    onClick={handlePlayPause}
                    className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform text-2xl"
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-12 h-12 text-white hover:bg-white/10 rounded-full flex items-center justify-center text-xl"
                  >
                    ⏭
                  </button>
                </div>
                
                {/* 播放模式和播放列表按钮 */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={handlePlayModeToggle}
                    className="flex items-center gap-1.5 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
                  >
                    <PlayModeIcon mode={playMode} className="w-4 h-4" />
                    <span>{PLAY_MODE_NAMES[playMode]}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowPlaylist(true)}
                    className="flex items-center gap-1.5 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
                  >
                    <Music className="w-4 h-4" />
                    <span>播放列表</span>
                  </button>
                </div>
                
                {/* 歌词显示 */}
                {lyrics.length > 0 ? (
                  <div 
                    ref={lyricsContainerRef}
                    onScroll={handleLyricsScroll}
                    onTouchStart={() => { userScrollingRef.current = true; }}
                    className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 bg-black/30 rounded-lg p-3"
                  >
                    {lyrics.map((lyric, index) => (
                      <div
                        key={index}
                        data-lyric-index={index}
                        onClick={() => handleLyricClick(lyric.time)}
                        className={`text-sm py-1.5 px-2 cursor-pointer transition-colors rounded text-center ${
                          index === currentLyricIndex
                            ? 'text-green-400 font-medium bg-white/5'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {lyric.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-sm py-6 bg-black/30 rounded-lg">
                    暂无歌词
                  </div>
                )}
              </div>
            )}
            
            {/* 底部切换按钮 */}
            {!showPlaylist && (
              <div className="px-4 py-3 border-t border-gray-700/50">
                <button
                  onClick={() => setShowPlaylist(true)}
                  className="w-full py-2 text-gray-400 hover:text-white text-sm"
                >
                  查看播放列表 ({playlist.length} 首)
                </button>
              </div>
            )}
            {showPlaylist && (
              <div className="px-4 py-3 border-t border-gray-700/50">
                <button
                  onClick={() => setShowPlaylist(false)}
                  className="w-full py-2 text-gray-400 hover:text-white text-sm"
                >
                  返回播放器
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      
      {/* 迷你播放器 - 带进度条 */}
      <div className="fixed top-16 left-4 z-30">
        <div className="bg-black/80 backdrop-blur-md rounded-2xl overflow-hidden">
          {/* 进度条 */}
          <div className="h-1 bg-gray-700">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          <div className="flex items-center gap-2 p-2">
            {/* 封面/展开按钮 */}
            <button
              onClick={() => setIsExpanded(true)}
              className="w-10 h-10 bg-gradient-to-br from-green-500 to-red-500 rounded-xl flex items-center justify-center text-xl shrink-0"
            >
              🎵
            </button>
            
            {/* 歌曲信息 - 仅桌面端显示 */}
            <div className="hidden sm:block min-w-0 max-w-32">
              <div className="text-white text-xs font-medium truncate">
                {currentSong?.title || '未选择'}
              </div>
              <div className="text-gray-400 text-[10px] truncate">
                {currentSong?.artist || '-'}
              </div>
            </div>
            
            {/* 控制按钮 */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={handlePrev}
                className="w-8 h-8 text-white hover:bg-white/10 rounded-full flex items-center justify-center text-sm"
              >
                ⏮
              </button>
              <button
                onClick={handlePlayPause}
                className="w-9 h-9 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform text-sm"
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                onClick={handleNext}
                className="w-8 h-8 text-white hover:bg-white/10 rounded-full flex items-center justify-center text-sm"
              >
                ⏭
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import type { LyricLine } from '@/types';

/**
 * 解析 LRC 歌词文件内容
 * @param lrcContent LRC 文件内容
 * @returns 歌词行数组，按时间排序
 */
export function parseLRC(lrcContent: string): LyricLine[] {
  const lines = lrcContent.split('\n');
  const lyrics: LyricLine[] = [];
  
  // 匹配时间标签 [mm:ss.xx] 或 [mm:ss.xxx]
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
  
  for (const line of lines) {
    // 跳过元数据行（如 [ti:], [ar:], [al:] 等）
    if (/^\[[a-z]+:/i.test(line)) {
      continue;
    }
    
    const matches = [...line.matchAll(timeRegex)];
    const text = line.replace(timeRegex, '').trim();
    
    // 只处理有时间标签和文本的行
    if (text && matches.length > 0) {
      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const msStr = match[3];
        // 处理 2 位或 3 位毫秒
        const ms = msStr.length === 2 
          ? parseInt(msStr, 10) * 10 
          : parseInt(msStr, 10);
        
        const time = minutes * 60 + seconds + ms / 1000;
        lyrics.push({ time, text });
      }
    }
  }
  
  // 按时间排序
  return lyrics.sort((a, b) => a.time - b.time);
}

/**
 * 将歌词数组格式化为 LRC 字符串
 * @param lyrics 歌词行数组
 * @returns LRC 格式字符串
 */
export function formatLRC(lyrics: LyricLine[]): string {
  return lyrics
    .map((lyric) => {
      const totalSeconds = lyric.time;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = Math.floor(totalSeconds % 60);
      const ms = Math.round((totalSeconds % 1) * 100);
      
      const mm = minutes.toString().padStart(2, '0');
      const ss = seconds.toString().padStart(2, '0');
      const xx = ms.toString().padStart(2, '0');
      
      return `[${mm}:${ss}.${xx}]${lyric.text}`;
    })
    .join('\n');
}

/**
 * 获取当前播放时间对应的歌词行索引
 * @param lyrics 歌词行数组（已按时间排序）
 * @param currentTime 当前播放时间（秒）
 * @returns 当前歌词行索引，如果没有匹配返回 -1
 */
export function getCurrentLyricIndex(
  lyrics: LyricLine[],
  currentTime: number
): number {
  if (lyrics.length === 0) {
    return -1;
  }
  
  // 找到最后一个 time <= currentTime 的歌词
  let index = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= currentTime) {
      index = i;
    } else {
      break;
    }
  }
  
  return index;
}

/**
 * 获取当前播放的歌词行
 * @param lyrics 歌词行数组
 * @param currentTime 当前播放时间（秒）
 * @returns 当前歌词行，如果没有匹配返回 null
 */
export function getCurrentLyric(
  lyrics: LyricLine[],
  currentTime: number
): LyricLine | null {
  const index = getCurrentLyricIndex(lyrics, currentTime);
  return index >= 0 ? lyrics[index] : null;
}

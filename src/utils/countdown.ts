import type { CountdownData, CountdownMode } from '@/types';

/** 2026 年目标时间 */
export const TARGET_DATE = new Date('2026-01-01T00:00:00');

/**
 * 计算倒计时数据
 * @param currentDate 当前时间
 * @param targetDate 目标时间（默认 2026 年）
 * @returns 倒计时数据
 */
export function calculateCountdown(
  currentDate: Date,
  targetDate: Date = TARGET_DATE
): CountdownData {
  const diff = targetDate.getTime() - currentDate.getTime();
  
  // 如果已经过了目标时间
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isFinished: true,
      isLastTenSeconds: false,
    };
  }
  
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    isFinished: false,
    isLastTenSeconds: totalSeconds <= 10,
  };
}

/**
 * 获取倒计时显示模式
 * @param countdown 倒计时数据
 * @returns 显示模式
 */
export function getCountdownMode(countdown: CountdownData): CountdownMode {
  return countdown.isLastTenSeconds ? 'final' : 'full';
}

/**
 * 格式化倒计时为字符串
 * @param countdown 倒计时数据
 * @returns 格式化字符串
 */
export function formatCountdown(countdown: CountdownData): string {
  const { days, hours, minutes, seconds } = countdown;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  if (days > 0) {
    return `${days}天 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * 获取最后倒计时数字（用于 3-2-1 显示）
 * @param countdown 倒计时数据
 * @returns 显示的数字，如果不在最后 10 秒返回 null
 */
export function getFinalCountdownNumber(countdown: CountdownData): number | null {
  if (!countdown.isLastTenSeconds || countdown.isFinished) {
    return null;
  }
  return countdown.totalSeconds;
}

import type { TimezoneOption } from '@/types';
import { COMMON_TIMEZONES } from '@/types';

// ============================================
// 时区相关函数
// ============================================

/**
 * 根据时区计算目标新年时间
 * @param targetYear 目标年份
 * @param timezone 时区设置 ('auto' 或 IANA 时区名)
 * @returns 目标时间的 Date 对象（本地时间表示）
 */
export function calculateTargetTime(
  targetYear: number,
  timezone: TimezoneOption
): Date {
  // 如果是 auto，使用本地时区
  if (timezone === 'auto') {
    return new Date(targetYear, 0, 1, 0, 0, 0, 0);
  }
  
  try {
    // 使用 Intl.DateTimeFormat 获取时区偏移
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    // 创建一个参考时间点来计算偏移
    const refDate = new Date(`${targetYear}-01-01T00:00:00Z`);
    const parts = formatter.formatToParts(refDate);
    
    // 解析格式化后的时间
    const getPart = (type: string) => {
      const part = parts.find(p => p.type === type);
      return part ? parseInt(part.value, 10) : 0;
    };
    
    const formattedYear = getPart('year');
    const formattedMonth = getPart('month');
    const formattedDay = getPart('day');
    const formattedHour = getPart('hour');
    const formattedMinute = getPart('minute');
    
    // 计算时区偏移（目标时区相对于 UTC 的偏移）
    // 如果 UTC 00:00 在目标时区显示为其他时间，说明有偏移
    const utcMidnight = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0));
    const targetTzTime = new Date(
      formattedYear,
      formattedMonth - 1,
      formattedDay,
      formattedHour,
      formattedMinute,
      0
    );
    
    // 计算偏移量（毫秒）
    const localOffset = utcMidnight.getTimezoneOffset() * 60 * 1000;
    const targetOffset = (targetTzTime.getTime() - utcMidnight.getTime()) + localOffset;
    
    // 目标时区的新年零点对应的 UTC 时间
    const targetNewYearUTC = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0) - targetOffset);
    
    // 转换为本地时间
    return new Date(targetNewYearUTC.getTime());
  } catch (error) {
    console.warn(`Invalid timezone: ${timezone}, falling back to local time`);
    return new Date(targetYear, 0, 1, 0, 0, 0, 0);
  }
}

/**
 * 获取时区的显示信息
 * @param timezone 时区设置
 * @returns { name: string, offset: string }
 */
export function getTimezoneDisplay(timezone: TimezoneOption): {
  name: string;
  offset: string;
} {
  if (timezone === 'auto') {
    const offset = -new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';
    const offsetStr = minutes > 0 
      ? `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`
      : `UTC${sign}${hours}`;
    return {
      name: '系统时区',
      offset: offsetStr,
    };
  }
  
  const tzInfo = COMMON_TIMEZONES.find(tz => tz.value === timezone);
  if (tzInfo) {
    return {
      name: tzInfo.label,
      offset: tzInfo.offset,
    };
  }
  
  return {
    name: timezone,
    offset: '',
  };
}

/**
 * 检查是否应该触发自动庆祝
 * @param targetTime 目标时间
 * @param currentTime 当前时间
 * @param hasTriggered 是否已触发
 * @param enabled 是否启用自动触发
 * @returns boolean
 */
export function shouldAutoTrigger(
  targetTime: Date,
  currentTime: Date,
  hasTriggered: boolean,
  enabled: boolean
): boolean {
  if (!enabled || hasTriggered) {
    return false;
  }
  
  // 当前时间已到达或超过目标时间
  return currentTime.getTime() >= targetTime.getTime();
}

/**
 * 检查目标时间是否已过
 * @param targetTime 目标时间
 * @param currentTime 当前时间
 * @returns boolean
 */
export function isTargetTimePassed(targetTime: Date, currentTime: Date): boolean {
  return currentTime.getTime() > targetTime.getTime();
}

/**
 * 获取距离目标时间的秒数（可以是负数，表示已过）
 * @param targetTime 目标时间
 * @param currentTime 当前时间
 * @returns 秒数
 */
export function getSecondsToTarget(targetTime: Date, currentTime: Date): number {
  return Math.floor((targetTime.getTime() - currentTime.getTime()) / 1000);
}

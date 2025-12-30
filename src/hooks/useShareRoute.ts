/**
 * 分享路由处理 Hook
 * 解析 URL 路径和参数，判断当前页面模式
 */

import { useState, useEffect } from 'react';

/**
 * 路由信息接口
 */
export interface ShareRouteInfo {
  /** 是否为分享查看模式 */
  isShareView: boolean;
  /** 是否为编辑模式 */
  isEditMode: boolean;
  /** 分享 ID（8位字符） */
  shareId: string | null;
  /** 编辑令牌（32位字符） */
  editToken: string | null;
}

/**
 * Share ID 格式验证（8位小写字母和数字）
 */
function isValidShareId(id: string): boolean {
  return /^[a-z0-9]{8}$/.test(id);
}

/**
 * Edit Token 格式验证（32位字母和数字）
 */
function isValidEditToken(token: string): boolean {
  return /^[A-Za-z0-9]{32}$/.test(token);
}

/**
 * 解析当前 URL 获取路由信息
 */
function parseRoute(): ShareRouteInfo {
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  
  // 默认值
  const result: ShareRouteInfo = {
    isShareView: false,
    isEditMode: false,
    shareId: null,
    editToken: null,
  };
  
  // 移除开头的斜杠并分割路径
  const pathParts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  
  // 空路径 = 主页
  if (pathParts.length === 0) {
    return result;
  }
  
  // 第一段可能是 shareId
  const potentialShareId = pathParts[0];
  
  // 验证 shareId 格式
  if (!isValidShareId(potentialShareId)) {
    return result;
  }
  
  result.shareId = potentialShareId;
  result.isShareView = true;
  
  // 检查是否为编辑模式: /{shareId}/edit?token={token}
  if (pathParts.length >= 2 && pathParts[1] === 'edit') {
    const token = searchParams.get('token');
    if (token && isValidEditToken(token)) {
      result.isEditMode = true;
      result.editToken = token;
    }
  }
  
  return result;
}

/**
 * 分享路由 Hook
 * 
 * 路由规则：
 * - `/` - 主页
 * - `/{shareId}` - 查看分享
 * - `/{shareId}/edit?token={token}` - 编辑分享
 * 
 * @returns 路由信息
 */
export function useShareRoute(): ShareRouteInfo {
  const [routeInfo, setRouteInfo] = useState<ShareRouteInfo>(parseRoute);
  
  // 监听 URL 变化
  useEffect(() => {
    const handlePopState = () => {
      setRouteInfo(parseRoute());
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  
  return routeInfo;
}

/**
 * 导航到主页
 */
export function navigateToHome(): void {
  window.history.pushState({}, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * 导航到分享页面
 * @param shareId 分享 ID
 */
export function navigateToShare(shareId: string): void {
  if (!isValidShareId(shareId)) {
    console.error('Invalid share ID:', shareId);
    return;
  }
  window.history.pushState({}, '', `/${shareId}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * 导航到编辑页面
 * @param shareId 分享 ID
 * @param editToken 编辑令牌
 */
export function navigateToEdit(shareId: string, editToken: string): void {
  if (!isValidShareId(shareId)) {
    console.error('Invalid share ID:', shareId);
    return;
  }
  if (!isValidEditToken(editToken)) {
    console.error('Invalid edit token');
    return;
  }
  window.history.pushState({}, '', `/${shareId}/edit?token=${editToken}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * 获取当前分享的完整 URL
 * @param shareId 分享 ID
 * @returns 完整的分享 URL
 */
export function getFullShareUrl(shareId: string): string {
  return `${window.location.origin}/${shareId}`;
}

/**
 * 获取当前编辑的完整 URL
 * @param shareId 分享 ID
 * @param editToken 编辑令牌
 * @returns 完整的编辑 URL
 */
export function getFullEditUrl(shareId: string, editToken: string): string {
  return `${window.location.origin}/${shareId}/edit?token=${editToken}`;
}

export default useShareRoute;

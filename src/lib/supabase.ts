/**
 * Supabase 集成（已弃用）
 * 
 * 此文件已被 R2 存储集成替代。
 * 保留此文件仅供参考，不再使用。
 * 
 * 如需使用 Supabase，请安装依赖：
 * npm install @supabase/supabase-js
 */

// 导出空对象以避免导入错误
export const supabase = null;
export const uploadPhoto = async (): Promise<null> => null;
export const saveShareToSupabase = async (): Promise<{ success: false; error: string }> => ({
  success: false,
  error: 'Supabase integration is deprecated. Use R2 storage instead.'
});
export const getShareFromSupabase = async (): Promise<null> => null;
export const cleanExpiredShares = async (): Promise<void> => {};

// 类型定义保留以供参考
export interface ShareData {
  id: string;
  photos: string[];
  config: Record<string, unknown>;
  message?: string;
  created_at: string;
  expires_at: string;
}

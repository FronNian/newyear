/**
 * 密码工具函数
 * 提供密码格式验证、哈希和验证功能
 */

// 密码长度限制
const MIN_PASSWORD_LENGTH = 4;
const MAX_PASSWORD_LENGTH = 20;

/**
 * 验证密码格式
 * @param password 密码字符串
 * @returns 验证结果，包含 valid 和可选的 error 信息
 */
export function validatePasswordFormat(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: '密码不能为空' };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `密码长度不能少于 ${MIN_PASSWORD_LENGTH} 个字符` };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, error: `密码长度不能超过 ${MAX_PASSWORD_LENGTH} 个字符` };
  }

  return { valid: true };
}

/**
 * 生成随机盐值
 * @returns 16 字节的十六进制盐值字符串
 */
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 将字符串转换为 ArrayBuffer
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * 将 ArrayBuffer 转换为十六进制字符串
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 使用 SHA-256 + salt 哈希密码
 * @param password 原始密码
 * @returns 包含 hash 和 salt 的对象
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = generateSalt();
  const saltedPassword = password + salt;
  const data = stringToArrayBuffer(saltedPassword);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = arrayBufferToHex(hashBuffer);
  
  return { hash, salt };
}

/**
 * 验证密码是否正确
 * @param password 用户输入的密码
 * @param hash 存储的哈希值
 * @param salt 存储的盐值
 * @returns 密码是否匹配
 */
export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  const saltedPassword = password + salt;
  const data = stringToArrayBuffer(saltedPassword);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const computedHash = arrayBufferToHex(hashBuffer);
  
  return computedHash === hash;
}

import * as THREE from 'three';
import type { FireworkParticle } from '@/types';

/**
 * 粒子对象池 - 用于复用粒子对象，减少内存分配
 */
export class ParticlePool {
  private pool: FireworkParticle[] = [];
  private activeCount: number = 0;
  private maxSize: number;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }

  /**
   * 从池中获取一个粒子
   */
  acquire(): FireworkParticle | null {
    if (this.activeCount >= this.maxSize) {
      return null; // 达到最大限制
    }

    let particle: FireworkParticle;

    if (this.pool.length > 0) {
      // 复用池中的粒子
      particle = this.pool.pop()!;
      this.resetParticle(particle);
    } else {
      // 创建新粒子
      particle = this.createParticle();
    }

    this.activeCount++;
    return particle;
  }

  /**
   * 释放一个粒子回池中
   */
  release(particle: FireworkParticle): void {
    if (this.activeCount > 0) {
      this.activeCount--;
      this.pool.push(particle);
    }
  }

  /**
   * 释放多个粒子
   */
  releaseMany(particles: FireworkParticle[]): void {
    particles.forEach((p) => this.release(p));
  }

  /**
   * 释放所有粒子
   */
  releaseAll(): void {
    this.activeCount = 0;
    // 保留池中的对象以便复用
  }

  /**
   * 获取当前活跃粒子数量
   */
  getActiveCount(): number {
    return this.activeCount;
  }

  /**
   * 获取池中可用粒子数量
   */
  getPoolSize(): number {
    return this.pool.length;
  }

  /**
   * 获取最大容量
   */
  getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * 设置最大容量
   */
  setMaxSize(size: number): void {
    this.maxSize = size;
  }

  /**
   * 清空池
   */
  clear(): void {
    this.pool = [];
    this.activeCount = 0;
  }

  /**
   * 创建新粒子
   */
  private createParticle(): FireworkParticle {
    return {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      color: new THREE.Color(),
      life: 1,
      maxLife: 1,
      size: 0.1,
      trail: [],
    };
  }

  /**
   * 重置粒子状态
   */
  private resetParticle(particle: FireworkParticle): void {
    particle.position.set(0, 0, 0);
    particle.velocity.set(0, 0, 0);
    particle.color.setRGB(1, 1, 1);
    particle.life = 1;
    particle.maxLife = 1;
    particle.size = 0.1;
    particle.trail = [];
  }
}

// 全局粒子池实例
export const globalParticlePool = new ParticlePool(10000);

/**
 * 获取移动端优化的粒子池
 */
export function getMobileOptimizedPool(): ParticlePool {
  return new ParticlePool(3000); // 移动端限制更低
}

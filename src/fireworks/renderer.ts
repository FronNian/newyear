/**
 * Canvas Renderer for Firework System - Optimized
 * 
 * Performance optimizations:
 * - Batch rendering particles by color
 * - Simplified glow (no gradients, use larger circles)
 * - Reduced trail rendering overhead
 * - Transparent background to show content behind
 */

import { FireworkSystem } from './fireworkSystem';

export interface RendererConfig {
  glowEnabled: boolean;
  trailEnabled: boolean;
  motionBlurEnabled: boolean;
  fadeAlpha: number;
}

const DEFAULT_RENDERER_CONFIG: RendererConfig = {
  glowEnabled: true,
  trailEnabled: true,
  motionBlurEnabled: true,
  fadeAlpha: 0.15
};

export class FireworkRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: RendererConfig;
  
  constructor(canvas: HTMLCanvasElement, config: Partial<RendererConfig> = {}) {
    this.canvas = canvas;
    // Use alpha: true for transparent background
    this.ctx = canvas.getContext('2d', { alpha: true })!;
    this.config = { ...DEFAULT_RENDERER_CONFIG, ...config };
  }
  
  clear(): void {
    if (this.config.motionBlurEnabled) {
      // Use transparent fade for motion blur effect
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.fillStyle = `rgba(0, 0, 0, ${this.config.fadeAlpha})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.globalCompositeOperation = 'source-over';
    } else {
      // Clear to fully transparent
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
  
  render(system: FireworkSystem): void {
    const particles = system.getAllParticles();
    if (particles.length === 0) return;
    
    this.ctx.globalCompositeOperation = 'lighter';
    
    // Batch render all particles
    for (const p of particles) {
      const alpha = p.getAlpha();
      if (alpha <= 0.05) continue;
      
      const { x, y, size, color } = p;
      const r = Math.floor(color.r);
      const g = Math.floor(color.g);
      const b = Math.floor(color.b);
      
      // Render trail (simplified)
      if (this.config.trailEnabled && p.trail.length > 1) {
        this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`;
        this.ctx.lineWidth = size * 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          this.ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        this.ctx.stroke();
      }
      
      // Render glow (simplified - just a larger circle)
      if (this.config.glowEnabled && alpha > 0.2) {
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.15})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      // Render particle core
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Bright center for high alpha
      if (alpha > 0.6) {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    this.ctx.globalCompositeOperation = 'source-over';
  }
  
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
  
  setConfig(config: Partial<RendererConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

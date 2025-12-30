/**
 * Particle System - Core particle class with physics simulation
 * 
 * Physics model:
 * - Position updates: x += vx * dt, y += vy * dt
 * - Velocity updates: vx += ax * dt, vy += ay * dt
 * - Gravity: constant downward acceleration
 * - Air resistance: velocity *= (1 - drag * dt)
 */

export interface ParticleConfig {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  lifespan: number;
  color: ParticleColor;
  size: number;
  brightness: number;
  flickerRate?: number;  // Hz, 0 = no flicker
  trailLength?: number;
}

export interface ParticleColor {
  r: number;
  g: number;
  b: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

export class Particle {
  // Position
  x: number;
  y: number;
  
  // Velocity
  vx: number;
  vy: number;
  
  // Acceleration (gravity is applied separately)
  ax: number = 0;
  ay: number = 0;
  
  // Physics constants
  gravity: number;
  drag: number;
  
  // Lifecycle
  lifespan: number;
  age: number = 0;
  alive: boolean = true;
  
  // Visual properties
  color: ParticleColor;
  initialColor: ParticleColor;
  size: number;
  initialSize: number;
  brightness: number;
  flickerRate: number;
  
  // Trail system
  trail: TrailPoint[] = [];
  trailLength: number;
  
  constructor(config: ParticleConfig) {
    this.x = config.x;
    this.y = config.y;
    this.vx = config.vx;
    this.vy = config.vy;
    this.gravity = config.gravity;
    this.drag = config.drag;
    this.lifespan = config.lifespan;
    this.color = { ...config.color };
    this.initialColor = { ...config.color };
    this.size = config.size;
    this.initialSize = config.size;
    this.brightness = config.brightness;
    this.flickerRate = config.flickerRate || 0;
    this.trailLength = config.trailLength || 0;
  }
  
  /**
   * Update particle state using time-based physics
   * @param dt Delta time in seconds
   */
  update(dt: number): void {
    if (!this.alive) return;
    
    // Store trail point before position update
    if (this.trailLength > 0) {
      this.trail.push({
        x: this.x,
        y: this.y,
        alpha: this.getLifeRatio()
      });
      
      // Limit trail length
      while (this.trail.length > this.trailLength) {
        this.trail.shift();
      }
    }
    
    // Apply air resistance (drag force proportional to velocity)
    // F_drag = -drag * v, so dv = -drag * v * dt
    this.vx *= (1 - this.drag * dt);
    this.vy *= (1 - this.drag * dt);
    
    // Apply gravity (constant downward acceleration)
    this.vy += this.gravity * dt;
    
    // Apply any additional acceleration
    this.vx += this.ax * dt;
    this.vy += this.ay * dt;
    
    // Update position using velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // Update age
    this.age += dt;
    
    // Check if particle has expired
    if (this.age >= this.lifespan) {
      this.alive = false;
    }
    
    // Update visual properties based on life ratio
    this.updateVisuals();
  }
  
  /**
   * Update visual properties (color, size, brightness) based on particle age
   */
  private updateVisuals(): void {
    const lifeRatio = this.getLifeRatio();
    
    // Size decay - particles shrink as they age
    this.size = this.initialSize * (0.3 + 0.7 * lifeRatio);
    
    // Brightness decay with optional flicker
    let flickerMod = 1;
    if (this.flickerRate > 0) {
      // Strobe effect using sine wave
      flickerMod = 0.5 + 0.5 * Math.sin(this.age * this.flickerRate * Math.PI * 2);
    }
    this.brightness = lifeRatio * flickerMod;
    
    // Color transition: initial color -> white (hot) -> orange -> dim
    // This simulates cooling of incandescent particles
    if (lifeRatio > 0.7) {
      // Hot phase - shift toward white
      const t = (lifeRatio - 0.7) / 0.3;
      this.color.r = this.initialColor.r + (255 - this.initialColor.r) * t * 0.5;
      this.color.g = this.initialColor.g + (255 - this.initialColor.g) * t * 0.3;
      this.color.b = this.initialColor.b + (200 - this.initialColor.b) * t * 0.2;
    } else if (lifeRatio > 0.3) {
      // Cooling phase - maintain color
      this.color.r = this.initialColor.r;
      this.color.g = this.initialColor.g;
      this.color.b = this.initialColor.b;
    } else {
      // Fade phase - shift toward orange/red and dim
      const t = 1 - lifeRatio / 0.3;
      this.color.r = this.initialColor.r;
      this.color.g = this.initialColor.g * (1 - t * 0.5);
      this.color.b = this.initialColor.b * (1 - t * 0.8);
    }
  }
  
  /**
   * Get remaining life as ratio (1 = just born, 0 = dead)
   */
  getLifeRatio(): number {
    return Math.max(0, 1 - this.age / this.lifespan);
  }
  
  /**
   * Get current alpha value for rendering
   */
  getAlpha(): number {
    return this.brightness * this.getLifeRatio();
  }
  
  /**
   * Get RGBA color string for canvas rendering
   */
  getColorString(alphaMultiplier: number = 1): string {
    const alpha = this.getAlpha() * alphaMultiplier;
    return `rgba(${Math.floor(this.color.r)}, ${Math.floor(this.color.g)}, ${Math.floor(this.color.b)}, ${alpha})`;
  }
}

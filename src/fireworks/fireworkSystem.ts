/**
 * Firework System - Multi-phase particle simulation
 * 
 * Phases:
 * 1. Launch - Single comet particle with trail, ascending
 * 2. Primary Explosion - Radial burst from single origin
 * 3. Secondary Effects - Sparkles, crackle, micro-bursts
 * 4. Decay - Particles fade and fall
 * 
 * Physics:
 * - Radial explosion uses uniform angular distribution
 * - Velocity magnitude follows Gaussian-like distribution
 * - Ballistic trajectory with gravity and air resistance
 */

import { Particle, ParticleColor } from './particle';

// Firework phase enumeration
export enum FireworkPhase {
  LAUNCH = 'launch',
  EXPLOSION = 'explosion',
  SECONDARY = 'secondary',
  DECAY = 'decay',
  COMPLETE = 'complete'
}

// Configuration for firework behavior
export interface FireworkConfig {
  // Launch parameters
  launchX: number;
  launchY: number;
  targetY: number;
  launchSpeed: number;
  
  // Explosion parameters
  explosionParticleCount: number;
  explosionVelocityMin: number;
  explosionVelocityMax: number;
  explosionVelocityDistribution: 'uniform' | 'gaussian';
  
  // Secondary effects
  secondaryEnabled: boolean;
  secondaryDelay: number;  // seconds after explosion
  secondaryParticleCount: number;
  crackleEnabled: boolean;
  
  // Physics
  gravity: number;
  drag: number;
  
  // Visual
  primaryColor: ParticleColor;
  secondaryColor?: ParticleColor;
  trailLength: number;
  flickerRate: number;
}

// Default configuration - optimized for performance
export const DEFAULT_FIREWORK_CONFIG: FireworkConfig = {
  launchX: 0,
  launchY: 0,
  targetY: -300,
  launchSpeed: 800,
  
  explosionParticleCount: 80,  // Reduced from 200
  explosionVelocityMin: 80,
  explosionVelocityMax: 250,
  explosionVelocityDistribution: 'uniform',  // Faster than gaussian
  
  secondaryEnabled: false,  // Disabled by default for performance
  secondaryDelay: 0.4,
  secondaryParticleCount: 20,
  crackleEnabled: false,
  
  gravity: 150,  // pixels/s²
  drag: 0.6,
  
  primaryColor: { r: 255, g: 200, b: 100 },
  trailLength: 8,  // Reduced from 15
  flickerRate: 0
};

export class Firework {
  config: FireworkConfig;
  phase: FireworkPhase = FireworkPhase.LAUNCH;
  
  // Particle collections
  launchParticle: Particle | null = null;
  explosionParticles: Particle[] = [];
  secondaryParticles: Particle[] = [];
  trailParticles: Particle[] = [];
  
  // Timing
  phaseStartTime: number = 0;
  explosionOrigin: { x: number; y: number } = { x: 0, y: 0 };
  secondaryTriggered: boolean = false;
  
  constructor(config: Partial<FireworkConfig> = {}) {
    this.config = { ...DEFAULT_FIREWORK_CONFIG, ...config };
    this.initLaunch();
  }
  
  /**
   * Initialize launch phase - create ascending comet
   */
  private initLaunch(): void {
    this.phase = FireworkPhase.LAUNCH;
    this.phaseStartTime = 0;
    
    // Calculate launch velocity to reach target height
    // Using kinematic equation: v² = v₀² + 2a(y - y₀)
    // At apex, v = 0, so v₀ = sqrt(-2 * a * Δy)
    const deltaY = this.config.targetY - this.config.launchY;
    const launchVy = -Math.sqrt(Math.abs(2 * this.config.gravity * deltaY));
    
    // Add slight horizontal variance for natural look
    const launchVx = (Math.random() - 0.5) * 30;
    
    this.launchParticle = new Particle({
      x: this.config.launchX,
      y: this.config.launchY,
      vx: launchVx,
      vy: launchVy,
      gravity: this.config.gravity,
      drag: 0.1,  // Low drag for launch
      lifespan: 10,  // Long lifespan, will be killed on explosion
      color: { r: 255, g: 255, b: 200 },  // Bright white-yellow
      size: 4,
      brightness: 1,
      trailLength: 20
    });
  }
  
  /**
   * Trigger primary explosion - radial particle burst
   */
  private triggerExplosion(): void {
    if (!this.launchParticle) return;
    
    this.phase = FireworkPhase.EXPLOSION;
    this.phaseStartTime = 0;
    this.explosionOrigin = { x: this.launchParticle.x, y: this.launchParticle.y };
    
    // Kill launch particle
    this.launchParticle.alive = false;
    
    const count = this.config.explosionParticleCount;
    const { primaryColor, gravity, drag, trailLength, flickerRate } = this.config;
    
    for (let i = 0; i < count; i++) {
      // Uniform angular distribution over 360°
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      
      // Velocity magnitude distribution
      let speed: number;
      if (this.config.explosionVelocityDistribution === 'gaussian') {
        // Box-Muller transform for Gaussian distribution
        speed = this.gaussianRandom(
          (this.config.explosionVelocityMin + this.config.explosionVelocityMax) / 2,
          (this.config.explosionVelocityMax - this.config.explosionVelocityMin) / 4
        );
        speed = Math.max(this.config.explosionVelocityMin, 
                        Math.min(this.config.explosionVelocityMax, speed));
      } else {
        speed = this.config.explosionVelocityMin + 
                Math.random() * (this.config.explosionVelocityMax - this.config.explosionVelocityMin);
      }
      
      // Convert polar to Cartesian velocity
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      // Color variation
      const colorVariation = 0.2;
      const color: ParticleColor = {
        r: primaryColor.r * (1 + (Math.random() - 0.5) * colorVariation),
        g: primaryColor.g * (1 + (Math.random() - 0.5) * colorVariation),
        b: primaryColor.b * (1 + (Math.random() - 0.5) * colorVariation)
      };
      
      // Lifespan variation
      const lifespan = 1.5 + Math.random() * 1.5;
      
      const particle = new Particle({
        x: this.explosionOrigin.x,
        y: this.explosionOrigin.y,
        vx,
        vy,
        gravity,
        drag,
        lifespan,
        color,
        size: 2 + Math.random() * 2,
        brightness: 1,
        flickerRate: flickerRate > 0 ? flickerRate * (0.8 + Math.random() * 0.4) : 0,
        trailLength
      });
      
      this.explosionParticles.push(particle);
    }
  }
  
  /**
   * Trigger secondary effects - sparkles and crackle
   */
  private triggerSecondary(): void {
    if (this.secondaryTriggered || !this.config.secondaryEnabled) return;
    this.secondaryTriggered = true;
    
    this.phase = FireworkPhase.SECONDARY;
    
    // Create secondary particles from random explosion particles
    const sourceParticles = this.explosionParticles.filter(p => p.alive);
    const count = Math.min(this.config.secondaryParticleCount, sourceParticles.length);
    
    for (let i = 0; i < count; i++) {
      const source = sourceParticles[Math.floor(Math.random() * sourceParticles.length)];
      
      // Small burst from each source
      const burstCount = this.config.crackleEnabled ? 3 + Math.floor(Math.random() * 3) : 1;
      
      for (let j = 0; j < burstCount; j++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 30 + Math.random() * 50;
        
        const particle = new Particle({
          x: source.x,
          y: source.y,
          vx: Math.cos(angle) * speed + source.vx * 0.3,
          vy: Math.sin(angle) * speed + source.vy * 0.3,
          gravity: this.config.gravity * 0.8,
          drag: this.config.drag * 1.5,
          lifespan: 0.3 + Math.random() * 0.5,
          color: this.config.secondaryColor || { r: 255, g: 255, b: 255 },
          size: 1 + Math.random(),
          brightness: 1,
          flickerRate: this.config.crackleEnabled ? 20 + Math.random() * 20 : 0,
          trailLength: 3
        });
        
        this.secondaryParticles.push(particle);
      }
    }
  }

  
  /**
   * Update all particles - main simulation loop
   * @param dt Delta time in seconds
   */
  update(dt: number): void {
    this.phaseStartTime += dt;
    
    switch (this.phase) {
      case FireworkPhase.LAUNCH:
        this.updateLaunch(dt);
        break;
        
      case FireworkPhase.EXPLOSION:
      case FireworkPhase.SECONDARY:
        this.updateExplosion(dt);
        break;
        
      case FireworkPhase.DECAY:
        this.updateDecay(dt);
        break;
    }
  }
  
  /**
   * Update launch phase
   */
  private updateLaunch(dt: number): void {
    if (!this.launchParticle) return;
    
    // Spawn trail particles (reduced frequency)
    if (Math.random() < 0.5) {
      const trail = new Particle({
        x: this.launchParticle.x + (Math.random() - 0.5) * 2,
        y: this.launchParticle.y,
        vx: (Math.random() - 0.5) * 15,
        vy: Math.random() * 20 + 5,
        gravity: this.config.gravity * 0.3,
        drag: 3,
        lifespan: 0.2 + Math.random() * 0.2,
        color: { r: 255, g: 200, b: 100 },
        size: 1 + Math.random(),
        brightness: 0.7,
        trailLength: 0
      });
      this.trailParticles.push(trail);
    }
    
    // Update launch particle
    this.launchParticle.update(dt);
    
    // Update trail particles
    this.trailParticles = this.trailParticles.filter(p => {
      p.update(dt);
      return p.alive;
    });
    
    // Check for apex (velocity changes direction or reaches target)
    if (this.launchParticle.vy >= 0 || this.launchParticle.y <= this.config.targetY) {
      this.triggerExplosion();
    }
  }
  
  /**
   * Update explosion and secondary phases
   */
  private updateExplosion(dt: number): void {
    // Update explosion particles
    this.explosionParticles = this.explosionParticles.filter(p => {
      p.update(dt);
      return p.alive;
    });
    
    // Update secondary particles
    this.secondaryParticles = this.secondaryParticles.filter(p => {
      p.update(dt);
      return p.alive;
    });
    
    // Update remaining trail particles
    this.trailParticles = this.trailParticles.filter(p => {
      p.update(dt);
      return p.alive;
    });
    
    // Trigger secondary effects after delay
    if (!this.secondaryTriggered && 
        this.phaseStartTime >= this.config.secondaryDelay &&
        this.config.secondaryEnabled) {
      this.triggerSecondary();
    }
    
    // Transition to decay when most particles are gone
    if (this.explosionParticles.length < this.config.explosionParticleCount * 0.1 &&
        this.phase !== FireworkPhase.DECAY) {
      this.phase = FireworkPhase.DECAY;
    }
    
    // Check for completion
    if (this.explosionParticles.length === 0 && 
        this.secondaryParticles.length === 0 &&
        this.trailParticles.length === 0) {
      this.phase = FireworkPhase.COMPLETE;
    }
  }
  
  /**
   * Update decay phase
   */
  private updateDecay(dt: number): void {
    // Same as explosion update, just tracking phase
    this.updateExplosion(dt);
  }
  
  /**
   * Check if firework is complete
   */
  isComplete(): boolean {
    return this.phase === FireworkPhase.COMPLETE;
  }
  
  /**
   * Get all active particles for rendering
   */
  getAllParticles(): Particle[] {
    const particles: Particle[] = [];
    
    if (this.launchParticle?.alive) {
      particles.push(this.launchParticle);
    }
    
    particles.push(...this.trailParticles);
    particles.push(...this.explosionParticles);
    particles.push(...this.secondaryParticles);
    
    return particles;
  }
  
  /**
   * Gaussian random number using Box-Muller transform
   */
  private gaussianRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
}

/**
 * Firework System Manager - handles multiple fireworks
 */
export class FireworkSystem {
  fireworks: Firework[] = [];
  canvas: { width: number; height: number };
  
  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvas = { width: canvasWidth, height: canvasHeight };
  }
  
  /**
   * Launch a new firework
   */
  launch(config: Partial<FireworkConfig> = {}): Firework {
    // Default launch position at bottom center with variance
    const defaultConfig: Partial<FireworkConfig> = {
      launchX: this.canvas.width / 2 + (Math.random() - 0.5) * this.canvas.width * 0.6,
      launchY: this.canvas.height,
      targetY: this.canvas.height * 0.2 + Math.random() * this.canvas.height * 0.3,
      ...config
    };
    
    const firework = new Firework(defaultConfig);
    this.fireworks.push(firework);
    return firework;
  }
  
  /**
   * Update all fireworks
   */
  update(dt: number): void {
    // Update all fireworks
    this.fireworks.forEach(fw => fw.update(dt));
    
    // Remove completed fireworks
    this.fireworks = this.fireworks.filter(fw => !fw.isComplete());
  }
  
  /**
   * Get all particles from all fireworks
   */
  getAllParticles(): Particle[] {
    return this.fireworks.flatMap(fw => fw.getAllParticles());
  }
  
  /**
   * Resize canvas dimensions
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}

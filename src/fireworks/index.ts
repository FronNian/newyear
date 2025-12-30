/**
 * Firework System - Public API
 */

export { Particle } from './particle';
export type { ParticleConfig, ParticleColor, TrailPoint } from './particle';

export { Firework, FireworkSystem, FireworkPhase } from './fireworkSystem';
export type { FireworkConfig } from './fireworkSystem';
export { DEFAULT_FIREWORK_CONFIG } from './fireworkSystem';

export { FireworkRenderer } from './renderer';
export type { RendererConfig } from './renderer';

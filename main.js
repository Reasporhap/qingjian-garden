import { layout } from './layout.js';
import { materials } from './materials.js';
import { cameraSchedule } from './camera-schedule.js';
import { createModule as createTerrain } from './terrain-rocks.js';
import { createModule as createWater } from './water-life.js';
import { createModule as createHall } from './hall-timber.js';
import { createModule as createCloudStones } from './cloud-stones.js';
import { createModule as createCorridor } from './corridor-walls.js';
import { createModule as createPlants } from './plants-bonsai.js';

export const DURATION_SECONDS = cameraSchedule.durationSeconds; // 30 seconds

let active;

/**
 * Initialize once with an injected engine and shared material instances.
 * context.updateCamera(t, cameraSchedule, layout.cameraAnchors) must sample
 * absolute seconds, including schedule crossfades; it must not run a clock.
 * No scene, camera, material, geometry or render loop is created here.
 * The returned module roots remain available for the caller to attach.
 */
export function initialize(context) {
  if (active) throw new Error('main is already initialized');
  const engine = context?.THREE ?? context?.engine;
  if (!engine || !context.materials || typeof context.updateCamera !== 'function') {
    throw new TypeError('main requires an engine, shared materials and updateCamera');
  }
  const shared = {
    ...context,
    THREE: engine,
    engine,
    layout,
    materialSpecification: materials,
    cameraSchedule,
  };
  const modules = [];
  try {
    for (const create of [
      createTerrain, createWater, createHall,
      createCloudStones, createCorridor, createPlants,
    ]) modules.push(create(shared));
  } catch (error) {
    for (const module of modules.reverse()) module.dispose?.();
    throw error;
  }
  active = { modules, updateCamera: context.updateCamera.bind(context) };
  return { modules: [...modules], seek };
}

/** Sample any absolute second, forward or backward; endpoints clamp to [0, 30]. */
export function seek(t) {
  if (!Number.isFinite(t)) throw new TypeError('seek requires finite seconds');
  if (!active) throw new Error('Call initialize(context) before seek(t)');
  const seconds = Math.max(0, Math.min(DURATION_SECONDS, t));
  for (const module of active.modules) module.update?.(seconds);
  active.updateCamera(seconds, cameraSchedule, layout.cameraAnchors);
  return seconds;
}

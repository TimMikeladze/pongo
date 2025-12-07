// src/scheduler/region.ts

/**
 * Region where this scheduler is running
 */
export const REGION =
  process.env.PONGO_REGION || process.env.FLY_REGION || "default";

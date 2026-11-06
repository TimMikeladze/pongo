export function isHowItWorksEnabled(
  env: { NODE_ENV?: string; SHOW_HOW_IT_WORKS?: string } = process.env,
): boolean {
  if (env.SHOW_HOW_IT_WORKS !== undefined) {
    return env.SHOW_HOW_IT_WORKS === "true";
  }
  return env.NODE_ENV === "development";
}

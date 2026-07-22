/**
 * sceneJump.ts — pure helper extracted from PresentationEngine.jumpTo
 *
 * The previous implementation lived inside the engine's useCallback
 * closure, which made unit-testing it an exercise in mock-rendering
 * a SceneTransition + AnimatePresence. Pulling the resolution into
 * a pure function lets us verify direction logic, unknown-id
 * early-return, and same-position no-op with no React plumbing.
 */

/** Minimal scene shape needed for jump resolution. */
export interface JumpableScene {
  id: string;
}

/** Resolved jump + direction. */
export interface ResolvedJump {
  index: number;
  direction: 1 | -1;
}

/**
 * Resolve a target scene id against the active array. Returns null
 * if the id is unknown. Direction is `1` for forward, `-1` for back;
 * when the target index equals the current index, the direction is
 * still computed (typically `1` since `>=` is rare here) but callers
 * should treat that case as a no-op in the engine.
 */
export function resolveJumpTo(
  scenes: ReadonlyArray<JumpableScene>,
  currentIndex: number,
  targetId: string,
): ResolvedJump | null {
  const idx = scenes.findIndex((s) => s.id === targetId);
  if (idx < 0) return null;
  return { index: idx, direction: idx > currentIndex ? 1 : -1 };
}

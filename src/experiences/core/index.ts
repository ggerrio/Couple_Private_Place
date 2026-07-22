/**
 * core/index.ts
 *
 * Public API of the experience engine. Anything outside `src/experiences/`
 * should import from this barrel rather than reaching into individual files.
 */

export { PresentationEngine } from "./PresentationEngine";
export type {
  PresentationEngineProps,
  PresentationScene,
  SceneComponentProps,
} from "./PresentationEngine";

export { ExperienceOverlay } from "./ExperienceOverlay";
export type { ExperienceOverlayProps } from "./ExperienceOverlay";

export { ExperienceNavigation } from "./ExperienceNavigation";
export type { ExperienceNavigationProps } from "./ExperienceNavigation";

export { ExperienceProgress } from "./ExperienceProgress";
export type { ExperienceProgressProps } from "./ExperienceProgress";

export { ExperienceMusic } from "./ExperienceMusic";
export type { ExperienceMusicProps } from "./ExperienceMusic";

export { SceneTransition } from "./SceneTransition";
export type { SceneTransitionProps, SceneTransitionVariant } from "./SceneTransition";

/**
 * birthday/index.ts
 *
 * Public API of the birthday experience.
 */

export { BirthdayExperience } from "./BirthdayExperience";
export type { BirthdayExperienceProps } from "./BirthdayExperience";

export {
  useBirthdayTrigger,
  BirthdayReplayButton,
} from "./BirthdayTrigger";
export type {
  BirthdayReplayButtonProps,
  UseBirthdayTriggerOptions,
} from "./BirthdayTrigger";
export type { BirthdayTriggerState } from "./birthday.types";

export {
  BIRTHDAY_PHOTOS,
  BIRTHDAY_BGM_SRC,
  BIRTHDAY_CONTENT,
  BIRTHDAY_SCENE_ORDER,
  BIRTHDAY_SCENES,
  BIRTHDAY_PHOTO_CAPTIONS,
} from "./birthday.data";
export type {
  BirthdayPhoto,
  BirthdayContent,
  BirthdaySceneId,
  BirthdaySceneConfig,
  BirthdaySceneProps,
} from "./birthday.types";

export {
  isBirthdayToday,
  hasFiredToday,
  markFiredToday,
  clearFiredToday,
  firedStorageKey,
} from "./birthday.utils";

export * from "./scenes";
// components/ folder was removed — inline decorations & per-scene layout
// are now part of each scene file. Add new shared components here when
// the experience grows.
export * from "./svg/Decorations";

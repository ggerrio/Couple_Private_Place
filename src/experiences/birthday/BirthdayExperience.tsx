/**
 * BirthdayExperience.tsx
 *
 * The orchestrator. Mounts ExperienceOverlay → ExperienceMusic →
 * PresentationEngine → scenes/. Ties everything together is the
 * SCENE_COMPONENT_MAP — type-safe lookup from scene id to scene
 * component, with per-scene meta injected for the 16 PhotoSlide
 * variants.
 *
 * Replay model:
 *   - `replayCount` state bumps on Replay click
 *   - It's used as React `key` on PresentationEngine so the engine
 *     fully remounts at index 0 (BGM restarts, AnimatePresence
 *     replays gift-open, all focus & auto-advance timers reset)
 *   - EndingScene gets `onReplay={handleReplay}` via the engine's
 *     optional onReplay prop
 */

import React, { useCallback, useMemo, useState } from "react";
import type { ComponentType } from "react";

import {
  PresentationEngine,
  ExperienceOverlay,
  ExperienceMusic,
} from "../core";
import type { PresentationScene, SceneComponentProps } from "../core";

import {
  BIRTHDAY_SCENES,
  BIRTHDAY_BGM_SRC,
  BIRTHDAY_CONTENT,
  BIRTHDAY_PHOTOS,
  BIRTHDAY_PHOTO_VARIANTS,
} from "./birthday.data";
import { dialogTitle } from "./birthday.constants";
import type { BirthdaySceneId, BirthdaySceneConfig } from "./birthday.types";

import {
  GiftOpeningScene,
  IntroScene,
  ScrapbookScene,
  PhotoSlide,
  EndingScene,
  ClosingSealScene,
  CityMapScene,
  StatsFavoritesScene,
  StatsTimelineScene,
  ChapterDividerScene,
} from "./scenes";

// Only the scenes with a 1:1 component mapping live here. The 16
// photo-* scenes are all served by PhotoSlide with per-scene meta
// injected at runtime, so they don't need entries in this map.
const BASE_COMPONENT_MAP: Partial<
  Record<BirthdaySceneId, ComponentType<SceneComponentProps>>
> = {
  "gift-open": GiftOpeningScene as ComponentType<SceneComponentProps>,
  "hero": IntroScene as ComponentType<SceneComponentProps>,
  "stats-favorites": StatsFavoritesScene as ComponentType<SceneComponentProps>,
  "scrapbook": ScrapbookScene as ComponentType<SceneComponentProps>,
  "map": ChapterDividerScene as ComponentType<SceneComponentProps>,
  "stats-timeline": StatsTimelineScene as ComponentType<SceneComponentProps>,
  "seal-close": ClosingSealScene as ComponentType<SceneComponentProps>,
  "ending": EndingScene as ComponentType<SceneComponentProps>,
  "chapter-end-1": ChapterDividerScene as ComponentType<SceneComponentProps>,
  "chapter-end-2": ChapterDividerScene as ComponentType<SceneComponentProps>,
};

export interface BirthdayExperienceProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  /**
   * Optional recipient-name override. When provided, replaces
   * BIRTHDAY_CONTENT.recipientName end-to-end so every scene,
   * the dialog aria-label, the letter greeting, and the ending
   * signoff reflect the override. Used by the dev sandbox
   * (`?sandbox=<name>`) so we can preview the experience for any
   * celebrant without touching the production content file.
   */
  recipientNameOverride?: string;
}

export function BirthdayExperience({
  isOpen,
  onClose,
  onComplete,
  recipientNameOverride,
}: BirthdayExperienceProps) {
  // Bump on Replay — used as React `key` on the engine so it fully
  // remounts at index 0 (gift-open replays from scratch, BGM restarts,
  // all per-scene timers & focus state reset).
  const [replayCount, setReplayCount] = useState(0);
  const handleReplay = useCallback(() => {
    setReplayCount((c) => c + 1);
  }, []);

  // Compose the effective content. When the sandbox passes an
  // override, splice it into recipientName so every scene + the
  // ExperienceOverlay aria-label see the override; everything else
  // (memory captions, BGM, photo asset paths) stays untouched.
  const effectiveContent = useMemo(() => {
    const trimmed = (recipientNameOverride ?? "").trim();
    if (!trimmed) return BIRTHDAY_CONTENT;
    return { ...BIRTHDAY_CONTENT, recipientName: trimmed };
  }, [recipientNameOverride]);

  const scenes: PresentationScene[] = useMemo(() => {
    return BIRTHDAY_SCENES.map((cfg: BirthdaySceneConfig) => {
      // For photo-N scenes we use the same PhotoSlide component but
      // inject a different variant + photoIdx via meta.
      const isPhotoScene = cfg.id.startsWith("photo-");
      const photoIdx = isPhotoScene
        ? parseInt(cfg.id.replace("photo-", ""), 10) - 1
        : -1;
      const Component: ComponentType<SceneComponentProps> = isPhotoScene
        ? (PhotoSlide as ComponentType<SceneComponentProps>)
        : BASE_COMPONENT_MAP[cfg.id] ??
          (PhotoSlide as ComponentType<SceneComponentProps>);
      return {
        id: cfg.id,
        component: Component,
        durationMs: cfg.durationMs,
        transitionVariant: cfg.transitionVariant,
        meta: isPhotoScene
          ? {
              variant: BIRTHDAY_PHOTO_VARIANTS[photoIdx],
              photoIdx,
            }
          : undefined,
      } satisfies PresentationScene;
    });
  }, []);

  return (
    <ExperienceOverlay
      isOpen={isOpen}
      onClose={onClose}
      title={dialogTitle(effectiveContent.recipientName)}
    >
      {/* Replay wrapper — keyed at this level so engine AND BGM reset together
          (BGM is a sibling, not a child, of engine — moving the key one level
          up makes Replay also restarts the music cleanly). */}
      <div key={replayCount} className="relative w-full h-full overflow-hidden">
        <PresentationEngine
          scenes={scenes}
          transitionVariant="paper"
          onComplete={onComplete ?? onClose}
          birthdayContent={effectiveContent}
          birthdayPhotos={BIRTHDAY_PHOTOS}
          onCloseRequest={onClose}
          onReplay={handleReplay}
        />
        <ExperienceMusic
          src={BIRTHDAY_BGM_SRC}
          sceneConfigs={BIRTHDAY_SCENES}
          autoPlay
          loop
        />
      </div>
    </ExperienceOverlay>
  );
}

import type { AnimationSettings } from "../types/chat";

export interface AnimationFrameState {
  opacity: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  typedProgress: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOutCubic = (value: number) => 1 - (1 - clamp01(value)) ** 3;
const easeInCubic = (value: number) => clamp01(value) ** 3;
const easeOutBack = (value: number) => {
  const t = clamp01(value),
    c1 = 1.70158,
    c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

export function animationTotalMs(settings: AnimationSettings) {
  return Math.max(100, (settings.delay + settings.duration) * 1000);
}

export function animationFrame(settings: AnimationSettings, elapsedMs: number): AnimationFrameState {
  const activeMs = Math.max(100, settings.duration * 1000);
  const progress = clamp01((elapsedMs - settings.delay * 1000) / activeMs);
  const beforeDelay = elapsedMs < settings.delay * 1000;
  const distance = 36 * Math.max(0.25, settings.intensity);
  const strength = Math.max(0.25, settings.intensity);
  const base = {
    opacity: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    typedProgress: 1,
  };

  switch (settings.type) {
    case "typing":
      return { ...base, typedProgress: beforeDelay ? 0 : progress };
    case "pop-in": {
      const t = easeOutBack(progress / 0.38);
      return {
        ...base,
        opacity: beforeDelay ? 0 : clamp01(progress / 0.24),
        scale: beforeDelay ? 0.62 : 0.62 + 0.38 * t,
      };
    }
    case "pop-out": {
      const t = clamp01((progress - 0.68) / 0.32);
      return {
        ...base,
        opacity: progress >= 1 ? 0 : clamp01(1 - easeInCubic(t)),
        scale: 1 - 0.38 * easeInCubic(t),
      };
    }
    case "pop-in-out": {
      const enter = clamp01(progress / 0.22),
        exit = clamp01((progress - 0.78) / 0.22);
      return {
        ...base,
        opacity: beforeDelay ? 0 : Math.min(clamp01(enter / 0.65), 1 - easeInCubic(exit)),
        scale: beforeDelay ? 0.62 : Math.min(0.62 + 0.38 * easeOutBack(enter), 1 - 0.38 * easeInCubic(exit)),
      };
    }
    case "fade-in":
      return { ...base, opacity: beforeDelay ? 0 : easeOutCubic(progress) };
    case "fade-out":
      return { ...base, opacity: 1 - easeInCubic(progress) };
    case "slide-up": {
      const t = easeOutCubic(progress);
      return {
        ...base,
        opacity: beforeDelay ? 0 : t,
        offsetY: distance * (1 - t),
      };
    }
    case "bounce": {
      const t = easeOutBack(progress / 0.48);
      return {
        ...base,
        opacity: beforeDelay ? 0 : clamp01(progress / 0.18),
        scale: beforeDelay ? 0.45 : 0.45 + 0.55 * t,
        offsetY: beforeDelay ? distance : distance * (1 - easeOutCubic(progress / 0.42)),
      };
    }
    case "pulse":
      return {
        ...base,
        scale: 1 + Math.sin(progress * Math.PI * 4) * 0.07 * strength,
      };
    case "float":
      return {
        ...base,
        offsetY: Math.sin(progress * Math.PI * 2) * distance * 0.38,
      };
    case "shake":
      return {
        ...base,
        offsetX: Math.sin(progress * Math.PI * 16) * distance * 0.35 * (1 - progress),
      };
  }
}

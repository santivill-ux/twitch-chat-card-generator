import type { AnimationSettings, BackCardStyle, BadgeType, ChatLayout, ChatMessage, ChatProject, FrontCardStyle, StyleClipboard, StylePresetName } from "../types/chat";

export const STORAGE_KEY = "twitch-chat-card-generator:v2";
export const USERNAME_COLORS = ["#FF7A7A", "#FFB86C", "#FFD866", "#A8E063", "#50FA7B", "#4DD0E1", "#5C9DFF", "#7A7CFF", "#BD93F9", "#FF79C6", "#FF4FA3"];
export const BACK_COLORS = ["#70AFFF", "#72E4C0", "#FF8FB8", "#B792FF", "#FFB866", "#68D7F2", "#9EE56B", "#F48BFF"];
const MATCHING_HUES = [6, 28, 48, 88, 145, 178, 208, 232, 267, 302, 327];
export const BADGE_META: Record<BadgeType, { short: string; color: string; asset?: string }> = {
  Broadcaster: {
    short: "BC",
    color: "#E91916",
    asset: "/badges/broadcaster.png",
  },
  Moderator: { short: "M", color: "#00AD78", asset: "/badges/moderator.png" },
  VIP: { short: "VIP", color: "#E005B9", asset: "/badges/vip.png" },
  Subscriber: {
    short: "SUB",
    color: "#8B5CF6",
    asset: "/badges/subscriber.png",
  },
  Founder: { short: "F", color: "#F59E0B", asset: "/badges/founder.png" },
  Prime: { short: "P", color: "#1597E5", asset: "/badges/prime.png" },
  Turbo: { short: "T", color: "#A970FF", asset: "/badges/turbo.png" },
  Artist: { short: "A", color: "#F43F5E", asset: "/badges/artist.png" },
  Staff: { short: "S", color: "#111827", asset: "/badges/staff.png" },
  TikTok: { short: "♪", color: "#000000" },
  Custom: { short: "★", color: "#64748B" },
};

export const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export function referenceFront(): FrontCardStyle {
  return {
    backgroundColor: "#19171C",
    opacity: 1,
    autoSize: true,
    width: 412,
    height: 89,
    minWidth: 412,
    maxWidth: 780,
    paddingX: 34,
    paddingY: 18,
    borderRadius: 24,
    border: { enabled: false, color: "#FFFFFF", thickness: 1 },
    shadow: { enabled: false, blur: 18, opacity: 0.22, x: 0, y: 10 },
  };
}
export function referenceBack(): BackCardStyle {
  return {
    backgroundColor: "#70AFFF",
    opacity: 1,
    offsetX: 16,
    offsetY: 20,
    fillMode: "solid",
    gradientType: "linear",
    gradientStart: "#70AFFF",
    gradientEnd: "#A970FF",
    gradientAccent: "#50FA7B",
    gradientAccent2: "#FF79C6",
    gradientAngle: 135,
    matchFrontSize: true,
    width: 412,
    height: 89,
    widthAdjustment: 0,
    heightAdjustment: 0,
    borderRadius: 24,
    linkBorderRadius: true,
    scaleX: 1,
    scaleY: 1,
    border: { enabled: true, color: "#19171C", thickness: 1 },
    shadow: { enabled: false, blur: 14, opacity: 0.16, x: 0, y: 8 },
  };
}

export function referenceAnimation(): AnimationSettings {
  return {
    type: "pop-in-out",
    duration: 3,
    delay: 0.2,
    intensity: 1,
    fps: 30,
    format: "mp4",
    quality: 2,
    padding: 48,
    backgroundColor: "#FFFFFF",
    loopPreview: false,
  };
}

export function createMessage(index = 0, randomUsername = false): ChatMessage {
  return {
    id: uid(),
    username: index ? `Viewer${index + 1}` : "",
    message: index ? "That play was actually unreal" : "",
    visible: true,
    front: referenceFront(),
    back: referenceBack(),
    content: {
      layout: "stacked",
      usernameColor: randomUsername ? randomUsernameColor("#19171C") : "#F4F4F4",
      usernameColorMode: randomUsername ? "random" : "manual",
      messageColor: "#F4F4F4",
      usernameFontSize: 22,
      messageFontSize: 16,
      usernameWeight: 700,
      messageWeight: 400,
      lineHeight: 1.25,
      messageMaxWidth: 680,
      textAlign: "left",
      badgeUsernameSpacing: 8,
      usernameMessageSpacing: 3,
      fontFamily: "Roobert",
    },
    badges: index
      ? []
      : [
          {
            id: uid(),
            type: "Broadcaster",
            label: "Broadcaster",
            visible: true,
          },
          { id: uid(), type: "TikTok", label: "TikTok", visible: true },
        ],
    badgeSettings: { size: 18, spacing: 5 },
    transform: { x: 960, y: 540 + index * 130, scale: 1, rotation: 0 },
    animation: referenceAnimation(),
  };
}

export function createProject(): ChatProject {
  const message = createMessage();
  return {
    version: 2,
    canvas: {
      orientation: "horizontal",
      width: 1920,
      height: 1080,
      randomizeOnNew: false,
      previewMode: "message",
      previewBackgroundColor: "#FFFFFF",
      previewBackgroundPreset: "white",
      previewPadding: 64,
    },
    messages: [message],
    selectedId: message.id,
    randomize: {
      usernameColor: true,
      backCardColor: true,
      cardOffset: true,
      borderRadius: true,
    },
    export: { mode: "message", padding: 20, scale: 4 },
    styleClipboard: null,
    savedPresets: [],
  };
}

export function loadProject(): ChatProject {
  if (typeof window === "undefined") return createProject();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createProject();
    const parsed = JSON.parse(saved) as ChatProject;
    if (parsed.version !== 2 || !Array.isArray(parsed.messages) || !parsed.messages.length) return createProject();
    const defaults = createProject();
    const baseMessage = createMessage();
    const legacyCanvas = parsed.canvas as ChatProject["canvas"] & {
      previewBackgroundEnabled?: boolean;
    };
    const savedPresets = Array.isArray(parsed.savedPresets) ? parsed.savedPresets.filter((preset) => preset && typeof preset.name === "string" && preset.style?.front && preset.style?.back && preset.style?.content && preset.style?.badgeSettings) : [];
    return {
      ...defaults,
      ...parsed,
      canvas: {
        ...defaults.canvas,
        ...parsed.canvas,
        previewBackgroundPreset: legacyCanvas.previewBackgroundPreset ?? (legacyCanvas.previewBackgroundEnabled === false ? "transparent" : "white"),
      },
      export: { ...defaults.export, ...parsed.export, scale: 4 },
      savedPresets,
      messages: parsed.messages.map((message) => ({
        ...message,
        back: { ...referenceBack(), ...message.back },
        content: {
          ...baseMessage.content,
          ...message.content,
          fontFamily: message.content?.fontFamily ?? "Roobert",
        },
        animation: { ...referenceAnimation(), ...message.animation },
      })),
    };
  } catch {
    return createProject();
  }
}

export function contrastRatio(a: string, b: string) {
  const lum = (hex: string) => {
    const rgb = hex
      .replace("#", "")
      .match(/.{2}/g)
      ?.map((v) => parseInt(v, 16) / 255) ?? [0, 0, 0];
    const x = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * x[0] + 0.7152 * x[1] + 0.0722 * x[2];
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
export function randomUsernameColor(background = "#19171C") {
  const safe = USERNAME_COLORS.filter((color) => contrastRatio(color, background) >= 4.5);
  return (safe.length ? safe : USERNAME_COLORS)[Math.floor(Math.random() * (safe.length ? safe : USERNAME_COLORS).length)];
}
export function randomBackColor() {
  return BACK_COLORS[Math.floor(Math.random() * BACK_COLORS.length)];
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const h = (((hue % 360) + 360) % 360) / 360,
    s = saturation / 100,
    l = lightness / 100;
  const channel = (offset: number) => {
    const k = (offset + h * 12) % 12;
    return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return `#${[channel(0), channel(8), channel(4)]
    .map((value) =>
      Math.round(value * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

export interface MatchingColorPalette {
  username: string;
  solid: string;
  start: string;
  accent: string;
  accent2: string;
  end: string;
}

export function randomMatchingPalette(background = "#19171C", random: () => number = Math.random): MatchingColorPalette {
  const hue = MATCHING_HUES[Math.min(MATCHING_HUES.length - 1, Math.floor(random() * MATCHING_HUES.length))];
  const candidates = [68, 76, 84, 92, 32, 24, 16].map((lightness) => hslToHex(hue, lightness > 60 ? 88 : 74, lightness));
  const username = candidates.find((color) => contrastRatio(color, background) >= 4.5) ?? randomUsernameColor(background);
  const start = hslToHex(hue, 88, 62);
  return {
    username,
    solid: start,
    start,
    accent: hslToHex(hue + 22, 82, 68),
    accent2: hslToHex(hue - 24, 84, 58),
    end: hslToHex(hue + 46, 78, 52),
  };
}

export function measureText(text: string, fontSize: number, weight = 400) {
  return Math.max(fontSize * 0.5, Array.from(text || " ").reduce((sum, char) => sum + (char === " " ? 0.31 : /[MW@#%]/.test(char) ? 0.82 : /[ilI1|]/.test(char) ? 0.3 : 0.56) * fontSize, 0) * (weight >= 700 ? 1.025 : 1));
}
export function wrappedLineCount(text: string, maxWidth: number, fontSize: number, weight: number) {
  const paragraphs = (text || " ").split("\n");
  let lines = 0;
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    let width = 0;
    for (const word of words) {
      const w = measureText(word, fontSize, weight);
      const space = measureText(" ", fontSize, weight);
      if (width && width + space + w > maxWidth) {
        lines++;
        width = w;
      } else if (w > maxWidth) {
        lines += Math.max(1, Math.ceil(w / maxWidth)) - 1;
        width = w % maxWidth;
      } else width += width ? space + w : w;
    }
    lines++;
  }
  return Math.max(1, lines);
}

export interface CaptionTextLayout {
  prefixWidth: number;
  firstLine: string;
  remainingLines: string[];
  lineCount: number;
}

function wrapTextLines(text: string, maxWidth: number, fontSize: number, weight: number) {
  if (!text.trim()) return [];
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measureText(candidate, fontSize, weight) > maxWidth) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    if (line) lines.push(line);
  }
  return lines;
}

export function calculateCaptionText(chat: ChatMessage, maxWidth: number, messageOverride?: string): CaptionTextLayout {
  const username = chat.username || "SoySanwich";
  const message = messageOverride === undefined ? chat.message || "Ingresa lo que quieras decir" : messageOverride;
  const visibleBadges = chat.badges.filter((badge) => badge.visible).length;
  const badgesWidth = visibleBadges ? visibleBadges * chat.badgeSettings.size + (visibleBadges - 1) * chat.badgeSettings.spacing : 0;
  const badgeLead = visibleBadges ? badgesWidth + chat.content.badgeUsernameSpacing : 0;
  const prefixWidth = measureText(`${username}: `, chat.content.usernameFontSize, chat.content.usernameWeight);
  const firstLineWidth = Math.max(20, maxWidth - badgeLead - prefixWidth);
  const words = message.trim().split(/\s+/).filter(Boolean);
  const firstWords: string[] = [];
  while (words.length) {
    const candidate = [...firstWords, words[0]].join(" ");
    if (firstWords.length && measureText(candidate, chat.content.messageFontSize, chat.content.messageWeight) > firstLineWidth) break;
    if (!firstWords.length && measureText(candidate, chat.content.messageFontSize, chat.content.messageWeight) > firstLineWidth) break;
    firstWords.push(words.shift()!);
  }
  const remainingLines = wrapTextLines(words.join(" "), maxWidth, chat.content.messageFontSize, chat.content.messageWeight);
  return { prefixWidth, firstLine: firstWords.join(" "), remainingLines, lineCount: 1 + remainingLines.length };
}

export function calculateLayout(chat: ChatMessage): ChatLayout {
  const displayUsername = chat.username || "SoySanwich";
  const displayMessage = chat.message || "Ingresa lo que quieras decir";
  const visibleBadges = chat.badges.filter((b) => b.visible).length;
  const badgesWidth = visibleBadges ? visibleBadges * chat.badgeSettings.size + (visibleBadges - 1) * chat.badgeSettings.spacing : 0;
  const badgeLead = visibleBadges ? badgesWidth + chat.content.badgeUsernameSpacing : 0;
  const usernameWidth = measureText(displayUsername, chat.content.usernameFontSize, chat.content.usernameWeight);
  const captionPrefixWidth = measureText(`${displayUsername}: `, chat.content.usernameFontSize, chat.content.usernameWeight);
  const headerHeight = Math.max(visibleBadges ? chat.badgeSettings.size : 0, chat.content.usernameFontSize * 1.15, chat.content.layout === "caption" ? chat.content.messageFontSize * chat.content.lineHeight : 0);
  const messageNatural = measureText(displayMessage, chat.content.messageFontSize, chat.content.messageWeight);
  const desiredContent = chat.content.layout === "stacked" ? Math.max(badgeLead + usernameWidth, Math.min(messageNatural, chat.content.messageMaxWidth)) : chat.content.layout === "caption" ? badgeLead + Math.min(captionPrefixWidth + messageNatural, chat.content.messageMaxWidth) : badgeLead + usernameWidth + measureText(": ", chat.content.usernameFontSize, chat.content.usernameWeight) + Math.min(messageNatural, chat.content.messageMaxWidth);
  const autoWidth = clamp(desiredContent + chat.front.paddingX * 2, chat.front.minWidth, chat.front.maxWidth);
  const width = chat.front.autoSize ? autoWidth : chat.front.width;
  const contentWidth = Math.max(20, width - chat.front.paddingX * 2);
  const inlineLead = chat.content.layout === "inline" ? badgeLead + usernameWidth + measureText(": ", chat.content.usernameFontSize, chat.content.usernameWeight) : chat.content.layout === "caption" ? badgeLead : 0;
  const messageWidth = Math.max(20, Math.min(chat.content.messageMaxWidth, contentWidth - inlineLead));
  const messageLines = chat.content.layout === "caption" ? calculateCaptionText(chat, contentWidth).lineCount : wrappedLineCount(displayMessage, messageWidth, chat.content.messageFontSize, chat.content.messageWeight);
  const messageHeight = messageLines * chat.content.messageFontSize * chat.content.lineHeight;
  const naturalHeight = chat.front.paddingY * 2 + (chat.content.layout === "stacked" ? headerHeight + chat.content.usernameMessageSpacing + messageHeight : Math.max(headerHeight, messageHeight));
  const height = chat.front.autoSize ? Math.max(chat.front.height, Math.ceil(naturalHeight)) : chat.front.height;
  const backWidth = (chat.back.matchFrontSize ? width : chat.back.width) + chat.back.widthAdjustment;
  const backHeight = (chat.back.matchFrontSize ? height : chat.back.height) + chat.back.heightAdjustment;
  return {
    width,
    height,
    backWidth: Math.max(8, backWidth),
    backHeight: Math.max(8, backHeight),
    headerHeight,
    contentWidth,
    messageLines,
    overflow: !chat.front.autoSize && naturalHeight > height + 1,
    usernameWidth,
  };
}

export function applyPreset(chat: ChatMessage, name: StylePresetName): ChatMessage {
  const next = clone(chat);
  next.front = referenceFront();
  next.back = referenceBack();
  Object.assign(next.content, {
    layout: "stacked",
    usernameFontSize: 22,
    messageFontSize: 16,
    usernameWeight: 700,
    messageWeight: 400,
    lineHeight: 1.25,
    usernameMessageSpacing: 3,
    fontFamily: "Roobert",
  });
  next.badgeSettings = { size: 18, spacing: 5 };
  if (name === "Compact") {
    Object.assign(next.front, {
      minWidth: 300,
      width: 300,
      height: 68,
      paddingX: 16,
      paddingY: 12,
      borderRadius: 18,
    });
    Object.assign(next.back, { offsetX: 10, offsetY: 12, borderRadius: 18 });
    Object.assign(next.content, {
      usernameFontSize: 16,
      messageFontSize: 16,
      usernameMessageSpacing: 2,
    });
    next.badgeSettings = { size: 15, spacing: 4 };
  }
  if (name === "Big Creator") {
    Object.assign(next.front, {
      minWidth: 560,
      width: 560,
      height: 142,
      paddingX: 32,
      paddingY: 26,
      borderRadius: 36,
      maxWidth: 1000,
    });
    Object.assign(next.back, { offsetX: 24, offsetY: 28, borderRadius: 36 });
    Object.assign(next.content, {
      usernameFontSize: 28,
      messageFontSize: 30,
      usernameMessageSpacing: 10,
      messageMaxWidth: 900,
    });
    next.badgeSettings = { size: 26, spacing: 7 };
  }
  if (name === "Minimal") {
    Object.assign(next.front, {
      minWidth: 360,
      width: 360,
      height: 82,
      paddingX: 20,
      paddingY: 16,
      borderRadius: 20,
    });
    Object.assign(next.back, { offsetX: 6, offsetY: 8, borderRadius: 20 });
    Object.assign(next.content, {
      usernameFontSize: 19,
      messageFontSize: 19,
      usernameMessageSpacing: 3,
    });
    next.badgeSettings = { size: 17, spacing: 4 };
  }
  if (name === "Bold Caption") {
    Object.assign(next.front, {
      backgroundColor: "#17161C",
      autoSize: true,
      minWidth: 720,
      width: 720,
      height: 154,
      maxWidth: 900,
      paddingX: 30,
      paddingY: 26,
      borderRadius: 30,
      border: { enabled: false, color: "#FFFFFF", thickness: 0 },
      shadow: { enabled: false, blur: 0, opacity: 0, x: 0, y: 0 },
    });
    Object.assign(next.back, {
      backgroundColor: "#FFFFFF",
      fillMode: "solid",
      opacity: 1,
      offsetX: 12,
      offsetY: 16,
      borderRadius: 30,
      linkBorderRadius: true,
      border: { enabled: false, color: "#FFFFFF", thickness: 0 },
      shadow: { enabled: false, blur: 0, opacity: 0, x: 0, y: 0 },
    });
    Object.assign(next.content, {
      layout: "caption",
      usernameColor: "#F4F4F4",
      messageColor: "#F4F4F4",
      usernameFontSize: 36,
      messageFontSize: 36,
      usernameWeight: 700,
      messageWeight: 700,
      lineHeight: 1.3,
      messageMaxWidth: 840,
      textAlign: "left",
      badgeUsernameSpacing: 10,
      fontFamily: "Roobert",
    });
    next.badgeSettings = { size: 26, spacing: 6 };
  }
  return next;
}

export function copyStyle(chat: ChatMessage): StyleClipboard {
  return clone({
    front: chat.front,
    back: chat.back,
    content: chat.content,
    badgeSettings: chat.badgeSettings,
  });
}
export function pasteStyle(chat: ChatMessage, style: StyleClipboard): ChatMessage {
  const next = clone(chat);
  next.front = clone(style.front);
  next.back = clone(style.back);
  next.content = clone(style.content);
  next.badgeSettings = clone(style.badgeSettings);
  return next;
}

export function sanitizeSvg(source: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(source, "image/svg+xml");
  if (doc.querySelector("parsererror")) throw new Error("Invalid SVG");
  doc.querySelectorAll("script,foreignObject,iframe,object,embed").forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((node) =>
    Array.from(node.attributes).forEach((attr) => {
      const n = attr.name.toLowerCase(),
        v = attr.value.trim().toLowerCase();
      if (n.startsWith("on") || ((n === "href" || n.endsWith(":href")) && (v.startsWith("http") || v.startsWith("javascript:") || v.startsWith("data:text/html")))) node.removeAttribute(attr.name);
    }),
  );
  return new XMLSerializer().serializeToString(doc);
}

export function safeFilename(value: string) {
  return (
    (value || "chat-message")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "chat-message"
  );
}

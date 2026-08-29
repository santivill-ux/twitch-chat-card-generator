import { describe, expect, it } from "vitest";
import { applyPreset, BADGE_META, BADGE_SECTIONS, calculateCaptionText, calculateFlowTextMetrics, calculateLayout, contrastRatio, copyStyle, createMessage, createProject, pasteStyle, randomMatchingPalette, randomUsernameColor } from "../utils/chat";
import { animationFrame, animationTotalMs } from "../utils/animation";

describe("reference layout", () => {
  it("matches the supplied two-card reference", () => {
    const chat = createMessage();
    const layout = calculateLayout(chat);
    expect(layout.width).toBe(412);
    expect(layout.height).toBe(89);
    expect(layout.backWidth).toBe(412);
    expect(layout.backHeight).toBe(89);
    expect(chat.back.offsetX).toBe(16);
    expect(chat.back.offsetY).toBe(20);
    expect(chat.front.backgroundColor).toBe("#19171C");
    expect(chat.back.backgroundColor).toBe("#70AFFF");
    expect(chat.back.fillMode).toBe("solid");
    expect(chat.content.fontFamily).toBe("Roobert");
  });
  it("grows and wraps long messages in auto size", () => {
    const chat = createMessage();
    chat.message = "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen";
    chat.front.maxWidth = 420;
    chat.content.messageMaxWidth = 350;
    const layout = calculateLayout(chat);
    expect(layout.messageLines).toBeGreaterThan(1);
    expect(layout.height).toBeGreaterThan(89);
    expect(layout.overflow).toBe(false);
  });
  it("reports overflow for a manual card", () => {
    const chat = createMessage();
    chat.front.autoSize = false;
    chat.front.width = 220;
    chat.front.height = 45;
    chat.message = "a very long message that cannot fit inside this manually sized card";
    expect(calculateLayout(chat).overflow).toBe(true);
  });
});

describe("styles and project state", () => {
  it("keeps content and transform when pasting style", () => {
    const source = applyPreset(createMessage(), "Big Creator");
    const target = createMessage(1);
    target.username = "Keep Me";
    target.message = "Keep this text";
    target.transform.x = 77;
    const result = pasteStyle(target, copyStyle(source));
    expect(result.username).toBe("Keep Me");
    expect(result.message).toBe("Keep this text");
    expect(result.transform.x).toBe(77);
    expect(result.front.borderRadius).toBe(36);
  });
  it("matches the bold caption reference and preserves its content", () => {
    const chat = createMessage();
    chat.username = "johan98";
    chat.message = "se caso el huitlacoche con una uraca famosa";
    const result = applyPreset(chat, "Bold Caption");
    const layout = calculateLayout(result);
    expect(result.username).toBe("johan98");
    expect(result.message).toBe(chat.message);
    expect(result.content.layout).toBe("caption");
    expect(result.content.messageWeight).toBe(700);
    expect(result.front.backgroundColor).toBe("#17161C");
    expect(result.back.backgroundColor).toBe("#FFFFFF");
    expect(result.back.offsetY).toBe(16);
    expect(layout.messageLines).toBe(2);
  });
  it("keeps caption username and message typography independent", () => {
    const chat = applyPreset(createMessage(), "Bold Caption");
    chat.content.usernameWeight = 700;
    chat.content.messageWeight = 400;
    const boldPrefix = calculateCaptionText(chat, 840).prefixWidth;
    chat.content.usernameWeight = 400;
    const regularPrefix = calculateCaptionText(chat, 840).prefixWidth;
    expect(chat.content.messageWeight).toBe(400);
    expect(boldPrefix).toBeGreaterThan(regularPrefix);
  });
  it("aligns caption username and message on the same first-line center", () => {
    const chat = applyPreset(createMessage(), "Bold Caption");
    chat.content.usernameFontSize = 34;
    chat.content.messageFontSize = 22;
    const metrics = calculateFlowTextMetrics(chat);
    const usernameCenter = metrics.usernameOffsetY + metrics.usernameLineHeight / 2;
    const messageCenter = metrics.messageOffsetY + metrics.messageLineHeight / 2;
    expect(usernameCenter).toBeCloseTo(messageCenter);
  });
  it("wraps inline continuation lines at the full card margin", () => {
    const chat = createMessage();
    chat.content.layout = "inline";
    chat.front.maxWidth = 420;
    chat.content.messageMaxWidth = 350;
    chat.message = `Hola soy ${"s".repeat(90)}`;
    const layout = calculateLayout(chat);
    const flow = calculateCaptionText(chat, layout.contentWidth);
    expect(flow.remainingLines.length).toBeGreaterThan(1);
    expect(flow.remainingLines.every((line) => line.length > 0)).toBe(true);
    expect(layout.height).toBeGreaterThan(89);
    expect(layout.overflow).toBe(false);
  });
  it("creates a versioned local project", () => {
    const project = createProject();
    expect(project.version).toBe(2);
    expect(project.messages).toHaveLength(1);
    expect(project.selectedId).toBe(project.messages[0].id);
    expect(project.canvas.previewBackgroundPreset).toBe("white");
    expect(project.export.scale).toBe(4);
    expect(project.savedPresets).toEqual([]);
    expect(project.messages[0].animation.type).toBe("pop-in-out");
  });
  it("organizes Twitch, Kick, YouTube and TikTok badges into separate sections", () => {
    expect(BADGE_SECTIONS.map((section) => section.id)).toEqual(["twitch", "kick", "youtube", "tiktok"]);
    const types = BADGE_SECTIONS.flatMap((section) => section.types);
    expect(new Set(types).size).toBe(types.length);
    expect(BADGE_SECTIONS.find((section) => section.id === "kick")?.types).toContain("KickSubscriber");
    expect(BADGE_SECTIONS.find((section) => section.id === "youtube")?.types).toContain("YouTubeMember");
    expect(BADGE_SECTIONS.find((section) => section.id === "tiktok")?.types).toContain("TikTokFanClub");
    for (const type of types) expect(BADGE_META[type]).toBeDefined();
  });
  it("generates readable username colors", () => {
    for (let i = 0; i < 30; i++) expect(contrastRatio(randomUsernameColor("#19171C"), "#19171C")).toBeGreaterThanOrEqual(4.5);
  });
  it("generates coordinated palettes with readable usernames", () => {
    for (const background of ["#19171C", "#FFFFFF"]) {
      for (const seed of [0, 0.25, 0.5, 0.75, 0.999]) {
        const palette = randomMatchingPalette(background, () => seed);
        expect(contrastRatio(palette.username, background)).toBeGreaterThanOrEqual(4.5);
        expect(new Set([palette.start, palette.accent, palette.accent2, palette.end]).size).toBe(4);
      }
    }
  });
});

describe("animation timeline", () => {
  it("reveals typing content progressively after its delay", () => {
    const settings = createMessage().animation;
    settings.type = "typing";
    settings.delay = 0.2;
    settings.duration = 2;
    expect(animationFrame(settings, 0).typedProgress).toBe(0);
    expect(animationFrame(settings, 1200).typedProgress).toBeCloseTo(0.5);
    expect(animationFrame(settings, 2200).typedProgress).toBe(1);
    expect(animationTotalMs(settings)).toBe(2200);
  });
  it("enters and exits without invalid frame values", () => {
    const types = ["typing", "pop-in", "pop-out", "pop-in-out", "fade-in", "fade-out", "slide-up", "bounce", "pulse", "float", "shake"] as const;
    for (const type of types) {
      const settings = { ...createMessage().animation, type };
      for (const time of [0, settings.delay * 1000, animationTotalMs(settings) / 2, animationTotalMs(settings)]) {
        const frame = animationFrame(settings, time);
        expect(frame.opacity).toBeGreaterThanOrEqual(0);
        expect(frame.opacity).toBeLessThanOrEqual(1);
        expect(frame.scale).toBeGreaterThan(0);
        expect(Object.values(frame).every(Number.isFinite)).toBe(true);
      }
    }
  });
  it("keeps pop-out visible before removing it", () => {
    const settings = {
      ...createMessage().animation,
      type: "pop-out" as const,
      delay: 0,
      duration: 2,
    };
    expect(animationFrame(settings, 0).opacity).toBe(1);
    expect(animationFrame(settings, 2000).opacity).toBe(0);
  });
});

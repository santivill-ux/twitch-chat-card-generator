export type Orientation = "horizontal" | "vertical";
export type LayoutMode = "stacked" | "inline";
export type ColorMode = "manual" | "random";
export type FontChoice = "Roobert" | "Inter" | "Arial" | "Helvetica" | "Verdana" | "Georgia" | "Trebuchet MS" | "system-ui";
export type PreviewMode = "canvas" | "message";
export type PreviewBackgroundPreset = "white" | "black" | "checker" | "chroma" | "custom" | "transparent";
export type BackGradientType = "linear" | "radial" | "angular" | "diamond" | "mesh" | "shape-blur" | "freeform" | "multiple" | "aurora";
export type InspectorTab = "content" | "front" | "back" | "badges" | "transform" | "export";
export type BadgeType = "Broadcaster" | "Moderator" | "VIP" | "Subscriber" | "Founder" | "Prime" | "Turbo" | "Artist" | "Staff" | "TikTok" | "Custom";

export interface BorderStyle { enabled: boolean; color: string; thickness: number; }
export interface ShadowStyle { enabled: boolean; blur: number; opacity: number; x: number; y: number; }

export interface FrontCardStyle {
  backgroundColor: string; opacity: number; autoSize: boolean; width: number; height: number;
  minWidth: number; maxWidth: number; paddingX: number; paddingY: number; borderRadius: number;
  border: BorderStyle; shadow: ShadowStyle;
}

export interface BackCardStyle {
  backgroundColor: string; opacity: number; offsetX: number; offsetY: number;
  fillMode: "solid" | "gradient"; gradientType: BackGradientType; gradientStart: string; gradientEnd: string; gradientAccent: string; gradientAccent2: string; gradientAngle: number;
  matchFrontSize: boolean; width: number; height: number; widthAdjustment: number; heightAdjustment: number;
  borderRadius: number; linkBorderRadius: boolean; scaleX: number; scaleY: number;
  border: BorderStyle; shadow: ShadowStyle;
}

export interface ContentStyle {
  layout: LayoutMode; usernameColor: string; usernameColorMode: ColorMode; messageColor: string;
  usernameFontSize: number; messageFontSize: number; usernameWeight: number; messageWeight: number;
  lineHeight: number; messageMaxWidth: number; textAlign: "left" | "center" | "right";
  badgeUsernameSpacing: number; usernameMessageSpacing: number; fontFamily: FontChoice;
}

export interface BadgeInstance {
  id: string; type: BadgeType; label: string; visible: boolean; customDataUrl?: string;
}

export interface BadgeSettings { size: number; spacing: number; }
export interface Transform { x: number; y: number; scale: number; rotation: number; }

export interface ChatMessage {
  id: string; username: string; message: string; visible: boolean;
  front: FrontCardStyle; back: BackCardStyle; content: ContentStyle;
  badges: BadgeInstance[]; badgeSettings: BadgeSettings; transform: Transform;
}

export interface CanvasSettings {
  orientation: Orientation; width: number; height: number; randomizeOnNew: boolean; previewMode: PreviewMode;
  previewBackgroundColor: string; previewBackgroundPreset: PreviewBackgroundPreset; previewPadding: number;
}

export interface RandomizeOptions { usernameColor: boolean; backCardColor: boolean; cardOffset: boolean; borderRadius: boolean; }
export interface ExportSettings { mode: "full" | "message"; padding: number; scale: 1 | 2 | 4; }

export interface StyleClipboard {
  front: FrontCardStyle; back: BackCardStyle; content: ContentStyle; badgeSettings: BadgeSettings;
}

export interface ChatProject {
  version: 2; canvas: CanvasSettings; messages: ChatMessage[]; selectedId: string;
  randomize: RandomizeOptions; export: ExportSettings; styleClipboard: StyleClipboard | null;
}

export interface ChatLayout {
  width: number; height: number; backWidth: number; backHeight: number; headerHeight: number;
  contentWidth: number; messageLines: number; overflow: boolean; usernameWidth: number;
}

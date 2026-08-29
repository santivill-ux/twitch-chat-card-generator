export type Orientation = "horizontal" | "vertical";
export type LayoutMode = "stacked" | "inline" | "caption";
export type StylePresetName = "Reference" | "Compact" | "Big Creator" | "Minimal" | "Bold Caption";
export type ColorMode = "manual" | "random";
export type FontChoice = "Roobert" | "Inter" | "Arial" | "Helvetica" | "Verdana" | "Georgia" | "Trebuchet MS" | "system-ui";
export type PreviewMode = "canvas" | "message";
export type PreviewBackgroundPreset = "white" | "black" | "checker" | "chroma" | "custom" | "transparent";
export type BackGradientType = "linear" | "radial" | "angular" | "diamond" | "mesh" | "shape-blur" | "freeform" | "multiple" | "aurora";
export type AnimationType = "typing" | "pop-in" | "pop-out" | "pop-in-out" | "fade-in" | "fade-out" | "slide-up" | "bounce" | "pulse" | "float" | "shake";
export type VideoFormat = "mp4" | "mov";
export type InspectorTab = "content" | "front" | "back" | "badges" | "transform" | "animation" | "export";
export type BadgeType =
  | "Broadcaster"
  | "Moderator"
  | "VIP"
  | "Subscriber"
  | "Founder"
  | "Prime"
  | "Turbo"
  | "Artist"
  | "Staff"
  | "Kick"
  | "KickVerified"
  | "KickModerator"
  | "KickVIP"
  | "KickOG"
  | "KickSubscriber"
  | "YouTube"
  | "YouTubeVerified"
  | "YouTubeModerator"
  | "YouTubeMember"
  | "YouTubeTopFan"
  | "TikTok"
  | "TikTokVerified"
  | "TikTokModerator"
  | "TikTokSubscriber"
  | "TikTokFanClub"
  | "Custom";

export interface BorderStyle {
  enabled: boolean;
  color: string;
  thickness: number;
}
export interface ShadowStyle {
  enabled: boolean;
  blur: number;
  opacity: number;
  x: number;
  y: number;
}

export interface FrontCardStyle {
  backgroundColor: string;
  opacity: number;
  autoSize: boolean;
  width: number;
  height: number;
  minWidth: number;
  maxWidth: number;
  paddingX: number;
  paddingY: number;
  borderRadius: number;
  border: BorderStyle;
  shadow: ShadowStyle;
}

export interface BackCardStyle {
  backgroundColor: string;
  opacity: number;
  offsetX: number;
  offsetY: number;
  fillMode: "solid" | "gradient";
  gradientType: BackGradientType;
  gradientStart: string;
  gradientEnd: string;
  gradientAccent: string;
  gradientAccent2: string;
  gradientAngle: number;
  matchFrontSize: boolean;
  width: number;
  height: number;
  widthAdjustment: number;
  heightAdjustment: number;
  borderRadius: number;
  linkBorderRadius: boolean;
  scaleX: number;
  scaleY: number;
  border: BorderStyle;
  shadow: ShadowStyle;
}

export interface ContentStyle {
  layout: LayoutMode;
  usernameColor: string;
  usernameColorMode: ColorMode;
  messageColor: string;
  usernameFontSize: number;
  messageFontSize: number;
  usernameWeight: number;
  messageWeight: number;
  lineHeight: number;
  messageMaxWidth: number;
  textAlign: "left" | "center" | "right";
  badgeUsernameSpacing: number;
  usernameMessageSpacing: number;
  fontFamily: FontChoice;
}

export interface BadgeInstance {
  id: string;
  type: BadgeType;
  label: string;
  visible: boolean;
  customDataUrl?: string;
}

export interface BadgeSettings {
  size: number;
  spacing: number;
}
export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
export interface AnimationSettings {
  type: AnimationType;
  duration: number;
  delay: number;
  intensity: number;
  fps: 30 | 60;
  format: VideoFormat;
  quality: 1 | 2;
  padding: number;
  backgroundColor: string;
  loopPreview: boolean;
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  visible: boolean;
  front: FrontCardStyle;
  back: BackCardStyle;
  content: ContentStyle;
  badges: BadgeInstance[];
  badgeSettings: BadgeSettings;
  transform: Transform;
  animation: AnimationSettings;
}

export interface CanvasSettings {
  orientation: Orientation;
  width: number;
  height: number;
  randomizeOnNew: boolean;
  previewMode: PreviewMode;
  previewBackgroundColor: string;
  previewBackgroundPreset: PreviewBackgroundPreset;
  previewPadding: number;
}

export interface RandomizeOptions {
  usernameColor: boolean;
  backCardColor: boolean;
  cardOffset: boolean;
  borderRadius: boolean;
}
export interface ExportSettings {
  mode: "full" | "message";
  padding: number;
  scale: 1 | 2 | 4;
}

export interface StyleClipboard {
  front: FrontCardStyle;
  back: BackCardStyle;
  content: ContentStyle;
  badgeSettings: BadgeSettings;
}

export interface SavedStylePreset {
  id: string;
  name: string;
  createdAt: number;
  style: StyleClipboard;
}

export interface ChatProject {
  version: 2;
  canvas: CanvasSettings;
  messages: ChatMessage[];
  selectedId: string;
  randomize: RandomizeOptions;
  export: ExportSettings;
  styleClipboard: StyleClipboard | null;
  savedPresets: SavedStylePreset[];
}

export interface ChatLayout {
  width: number;
  height: number;
  backWidth: number;
  backHeight: number;
  headerHeight: number;
  contentWidth: number;
  messageLines: number;
  overflow: boolean;
  usernameWidth: number;
}

import { describe, expect, it } from "vitest";
import { applyPreset, calculateLayout, contrastRatio, copyStyle, createMessage, createProject, pasteStyle, randomUsernameColor } from "../utils/chat";

describe("reference layout",()=>{
  it("matches the supplied two-card reference",()=>{
    const chat=createMessage(); const layout=calculateLayout(chat);
    expect(layout.width).toBe(412); expect(layout.height).toBe(89);
    expect(layout.backWidth).toBe(412); expect(layout.backHeight).toBe(89);
    expect(chat.back.offsetX).toBe(16); expect(chat.back.offsetY).toBe(20);
    expect(chat.front.backgroundColor).toBe("#19171C"); expect(chat.back.backgroundColor).toBe("#70AFFF");
  });
  it("grows and wraps long messages in auto size",()=>{
    const chat=createMessage(); chat.message="one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen";chat.front.maxWidth=420;chat.content.messageMaxWidth=350;
    const layout=calculateLayout(chat); expect(layout.messageLines).toBeGreaterThan(1);expect(layout.height).toBeGreaterThan(89);expect(layout.overflow).toBe(false);
  });
  it("reports overflow for a manual card",()=>{
    const chat=createMessage();chat.front.autoSize=false;chat.front.width=220;chat.front.height=45;chat.message="a very long message that cannot fit inside this manually sized card";
    expect(calculateLayout(chat).overflow).toBe(true);
  });
});

describe("styles and project state",()=>{
  it("keeps content and transform when pasting style",()=>{
    const source=applyPreset(createMessage(),"Big Creator"); const target=createMessage(1);target.username="Keep Me";target.message="Keep this text";target.transform.x=77;
    const result=pasteStyle(target,copyStyle(source));expect(result.username).toBe("Keep Me");expect(result.message).toBe("Keep this text");expect(result.transform.x).toBe(77);expect(result.front.borderRadius).toBe(36);
  });
  it("creates a versioned local project",()=>{const project=createProject();expect(project.version).toBe(1);expect(project.messages).toHaveLength(1);expect(project.selectedId).toBe(project.messages[0].id);});
  it("generates readable username colors",()=>{for(let i=0;i<30;i++)expect(contrastRatio(randomUsernameColor("#19171C"),"#19171C")).toBeGreaterThanOrEqual(4.5);});
});

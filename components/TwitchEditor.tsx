"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type Konva from "konva";
import { Circle, Group, Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from "react-konva";
import type { BadgeInstance, BadgeType, ChatMessage, ChatProject, InspectorTab } from "../types/chat";
import { applyPreset, BADGE_META, calculateLayout, copyStyle, createMessage, createProject, loadProject, pasteStyle, randomBackColor, randomUsernameColor, safeFilename, sanitizeSvg, STORAGE_KEY, uid } from "../utils/chat";

type IconProps = { size?:number; className?:string };
const makeIcon = (glyph:string) => function Icon({size=14,className}:IconProps){return <span className={className??"ui-icon"} style={{fontSize:size}} aria-hidden="true">{glyph}</span>;};
const Copy=makeIcon("⧉"), Download=makeIcon("↓"), Eye=makeIcon("●"), EyeOff=makeIcon("○"), GripVertical=makeIcon("⠿"), ImagePlus=makeIcon("▣"), Layers3=makeIcon("▤"), Plus=makeIcon("+"), RotateCcw=makeIcon("↺"), Shuffle=makeIcon("⌁"), Sparkles=makeIcon("✦"), Trash2=makeIcon("×");

type Action =
  | { type:"project"; patch:Partial<ChatProject> }
  | { type:"message"; id:string; patch:Partial<ChatMessage> }
  | { type:"replace-message"; message:ChatMessage }
  | { type:"messages"; messages:ChatMessage[]; selectedId?:string }
  | { type:"reset"; project:ChatProject };

function reducer(state:ChatProject,action:Action):ChatProject {
  if(action.type==="project") return {...state,...action.patch};
  if(action.type==="message") return {...state,messages:state.messages.map(message=>message.id===action.id?{...message,...action.patch}:message)};
  if(action.type==="replace-message") return {...state,messages:state.messages.map(message=>message.id===action.message.id?action.message:message)};
  if(action.type==="messages") return {...state,messages:action.messages,selectedId:action.selectedId??state.selectedId};
  return action.project;
}

function useLoadedImage(source?:string) {
  const [image,setImage]=useState<HTMLImageElement|null>(null);
  useEffect(()=>{if(!source){setImage(null);return;} const next=new window.Image();next.onload=()=>setImage(next);next.src=source;return()=>{next.onload=null;};},[source]);
  return image;
}

function BadgeNode({badge,x,y,size}:{badge:BadgeInstance;x:number;y:number;size:number}) {
  const image=useLoadedImage(badge.customDataUrl);
  if(badge.type==="Custom"&&image) return <KonvaImage image={image} x={x} y={y} width={size} height={size} cornerRadius={Math.max(2,size*.18)} />;
  const meta=BADGE_META[badge.type];
  return <Group x={x} y={y}><Rect width={size} height={size} fill={meta.color} cornerRadius={Math.max(3,size*.22)} /><Text width={size} height={size} text={meta.short} fill="#fff" fontFamily="Roobert, Inter, Arial" fontStyle="bold" fontSize={Math.max(7,size*(meta.short.length>1?.36:.52))} align="center" verticalAlign="middle" /></Group>;
}

function ChatCard({chat,selected,onSelect,onPatch,register}:{chat:ChatMessage;selected:boolean;onSelect:()=>void;onPatch:(patch:Partial<ChatMessage>)=>void;register:(node:Konva.Group|null)=>void}) {
  const layout=calculateLayout(chat); const visibleBadges=chat.badges.filter(badge=>badge.visible);
  const badgesWidth=visibleBadges.length?visibleBadges.length*chat.badgeSettings.size+(visibleBadges.length-1)*chat.badgeSettings.spacing:0;
  const badgeLead=visibleBadges.length?badgesWidth+chat.content.badgeUsernameSpacing:0;
  const backX=chat.back.offsetX+(layout.width-layout.backWidth)/2; const backY=chat.back.offsetY+(layout.height-layout.backHeight)/2;
  const headerY=chat.front.paddingY; const usernameY=headerY+(layout.headerHeight-chat.content.usernameFontSize*1.15)/2;
  const usernameX=chat.front.paddingX+badgeLead;
  const messageY=chat.content.layout==="stacked"?headerY+layout.headerHeight+chat.content.usernameMessageSpacing:headerY;
  const inlineMessageX=usernameX+layout.usernameWidth+chat.content.usernameFontSize*.5;
  const messageWidth=chat.content.layout==="stacked"?layout.contentWidth:Math.max(20,layout.contentWidth-(inlineMessageX-chat.front.paddingX));
  const shadow=chat.front.shadow; const backShadow=chat.back.shadow;
  return (
    <Group ref={register} name={`chat-${chat.id}`} x={chat.transform.x} y={chat.transform.y} scaleX={chat.transform.scale} scaleY={chat.transform.scale} rotation={chat.transform.rotation} draggable visible={chat.visible}
      onClick={onSelect} onTap={onSelect} onDragStart={onSelect} onDragEnd={event=>onPatch({transform:{...chat.transform,x:event.target.x(),y:event.target.y()}})}
      onTransformEnd={event=>{const node=event.target;onPatch({transform:{x:node.x(),y:node.y(),scale:Math.max(.1,node.scaleX()),rotation:node.rotation()}});}}>
      <Rect x={backX} y={backY} width={layout.backWidth} height={layout.backHeight} scaleX={chat.back.scaleX} scaleY={chat.back.scaleY} offsetX={layout.backWidth*(chat.back.scaleX-1)/(chat.back.scaleX*2||1)} offsetY={layout.backHeight*(chat.back.scaleY-1)/(chat.back.scaleY*2||1)} fill={chat.back.backgroundColor} opacity={chat.back.opacity} cornerRadius={chat.back.borderRadius}
        stroke={chat.back.border.enabled?chat.back.border.color:undefined} strokeWidth={chat.back.border.enabled?chat.back.border.thickness:0} shadowColor="#000" shadowEnabled={backShadow.enabled} shadowBlur={backShadow.blur} shadowOpacity={backShadow.opacity} shadowOffsetX={backShadow.x} shadowOffsetY={backShadow.y} />
      <Rect width={layout.width} height={layout.height} fill={chat.front.backgroundColor} opacity={chat.front.opacity} cornerRadius={chat.front.borderRadius}
        stroke={chat.front.border.enabled?chat.front.border.color:undefined} strokeWidth={chat.front.border.enabled?chat.front.border.thickness:0} shadowColor="#000" shadowEnabled={shadow.enabled} shadowBlur={shadow.blur} shadowOpacity={shadow.opacity} shadowOffsetX={shadow.x} shadowOffsetY={shadow.y} />
      <Group clipX={0} clipY={0} clipWidth={layout.width} clipHeight={layout.height}>
        {visibleBadges.map((badge,index)=><BadgeNode key={badge.id} badge={badge} x={chat.front.paddingX+index*(chat.badgeSettings.size+chat.badgeSettings.spacing)} y={headerY+(layout.headerHeight-chat.badgeSettings.size)/2} size={chat.badgeSettings.size} />)}
        <Text x={usernameX} y={usernameY} text={chat.content.layout==="inline"?`${chat.username}:`:chat.username} fill={chat.content.usernameColor} fontFamily="Roobert, Inter, Arial" fontStyle={chat.content.usernameWeight>=700?"bold":"normal"} fontSize={chat.content.usernameFontSize} />
        <Text x={chat.content.layout==="stacked"?chat.front.paddingX:inlineMessageX} y={messageY} width={messageWidth} text={chat.message} fill={chat.content.messageColor} fontFamily="Roobert, Inter, Arial" fontStyle={chat.content.messageWeight>=700?"bold":"normal"} fontSize={chat.content.messageFontSize} lineHeight={chat.content.lineHeight} align={chat.content.textAlign} wrap="word" />
      </Group>
      {selected&&layout.overflow?<Circle x={layout.width-10} y={10} radius={5} fill="#F59E0B" />:null}
    </Group>
  );
}

function Field({label,children,wide=false}:{label:string;children:React.ReactNode;wide?:boolean}) { return <label className={wide?"field wide":"field"}><span>{label}</span>{children}</label>; }
function NumberField({label,value,onChange,min=-9999,max=9999,step=1,disabled=false}:{label:string;value:number;onChange:(value:number)=>void;min?:number;max?:number;step?:number;disabled?:boolean}) { return <Field label={label}><div className="number-wrap"><input type="number" value={Number.isFinite(value)?value:0} min={min} max={max} step={step} disabled={disabled} onChange={event=>onChange(Math.min(max,Math.max(min,Number(event.target.value))))}/><span>{step<1?"×":"px"}</span></div></Field>; }
function ColorField({label,value,onChange,disabled=false}:{label:string;value:string;onChange:(value:string)=>void;disabled?:boolean}) { return <Field label={label}><div className="color-control"><input aria-label={label} type="color" value={value} disabled={disabled} onChange={event=>onChange(event.target.value.toUpperCase())}/><input value={value.toUpperCase()} disabled={disabled} onChange={event=>/^#[0-9A-Fa-f]{6}$/.test(event.target.value)&&onChange(event.target.value.toUpperCase())}/></div></Field>; }
function Toggle({label,checked,onChange,help}:{label:string;checked:boolean;onChange:(checked:boolean)=>void;help?:string}) { return <button type="button" className="toggle-row" onClick={()=>onChange(!checked)}><span><b>{label}</b>{help?<small>{help}</small>:null}</span><i className={checked?"toggle on":"toggle"}><em /></i></button>; }
function PanelSection({title,children}:{title:string;children:React.ReactNode}) { return <section className="control-section"><h3>{title}</h3><div className="control-grid">{children}</div></section>; }

export default function TwitchEditor() {
  const [project,dispatch]=useReducer(reducer,undefined,loadProject); const [tab,setTab]=useState<InspectorTab>("content");
  const [viewport,setViewport]=useState({width:900,height:560}); const [toast,setToast]=useState(""); const [storageError,setStorageError]=useState(false);
  const stageRef=useRef<Konva.Stage|null>(null); const transformerRef=useRef<Konva.Transformer|null>(null); const canvasWrapRef=useRef<HTMLDivElement|null>(null); const groupRefs=useRef<Record<string,Konva.Group>>({});
  const selected=project.messages.find(message=>message.id===project.selectedId)??project.messages[0];
  const displayScale=Math.min((viewport.width-24)/project.canvas.width,(viewport.height-24)/project.canvas.height);
  const showToast=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(""),2200);};
  const patchSelected=(patch:Partial<ChatMessage>)=>dispatch({type:"message",id:selected.id,patch});

  useEffect(()=>{const target=canvasWrapRef.current;if(!target)return;const update=()=>setViewport({width:target.clientWidth,height:target.clientHeight});update();const observer=new ResizeObserver(update);observer.observe(target);return()=>observer.disconnect();},[]);
  useEffect(()=>{const timer=window.setTimeout(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(project));setStorageError(false);}catch{setStorageError(true);}},350);return()=>window.clearTimeout(timer);},[project]);
  useEffect(()=>{const transformer=transformerRef.current;const node=groupRefs.current[selected.id];if(transformer){transformer.nodes(node&&selected.visible?[node]:[]);transformer.getLayer()?.batchDraw();}},[selected.id,selected.visible,project.messages]);

  const patchFront=(patch:Partial<ChatMessage["front"]>)=>{const front={...selected.front,...patch};const back=front.borderRadius!==selected.front.borderRadius&&selected.back.linkBorderRadius?{...selected.back,borderRadius:front.borderRadius}:selected.back;patchSelected({front,back});};
  const patchBack=(patch:Partial<ChatMessage["back"]>)=>patchSelected({back:{...selected.back,...patch}});
  const patchContent=(patch:Partial<ChatMessage["content"]>)=>patchSelected({content:{...selected.content,...patch}});
  const patchBadgeSettings=(patch:Partial<ChatMessage["badgeSettings"]>)=>patchSelected({badgeSettings:{...selected.badgeSettings,...patch}});

  const newMessage=()=>{const next=createMessage(project.messages.length,project.canvas.randomizeOnNew);dispatch({type:"messages",messages:[...project.messages,next],selectedId:next.id});showToast("New chat message added");};
  const duplicateMessage=()=>{const next:ChatMessage=JSON.parse(JSON.stringify(selected));next.id=uid();next.username=`${selected.username} copy`;next.transform={...next.transform,x:next.transform.x+24,y:next.transform.y+24};next.badges=next.badges.map(b=>({...b,id:uid()}));dispatch({type:"messages",messages:[...project.messages,next],selectedId:next.id});showToast("Message duplicated");};
  const deleteMessage=()=>{if(project.messages.length===1){showToast("Keep at least one message");return;}const index=project.messages.findIndex(m=>m.id===selected.id);const messages=project.messages.filter(m=>m.id!==selected.id);dispatch({type:"messages",messages,selectedId:messages[Math.max(0,index-1)].id});};
  const reorder=(from:number,to:number)=>{if(to<0||to>=project.messages.length||from===to)return;const messages=[...project.messages];const [item]=messages.splice(from,1);messages.splice(to,0,item);dispatch({type:"messages",messages});};
  const randomizeStyle=()=>{const front={...selected.front};const back={...selected.back};const content={...selected.content};if(project.randomize.usernameColor)content.usernameColor=randomUsernameColor(front.backgroundColor);if(project.randomize.backCardColor)back.backgroundColor=randomBackColor();if(project.randomize.cardOffset){back.offsetX=Math.round(6+Math.random()*24);back.offsetY=Math.round(8+Math.random()*24);}if(project.randomize.borderRadius){front.borderRadius=Math.round(16+Math.random()*24);if(back.linkBorderRadius)back.borderRadius=front.borderRadius;}patchSelected({front,back,content});showToast("Style randomized");};
  const setOrientation=(orientation:"horizontal"|"vertical")=>dispatch({type:"project",patch:{canvas:{...project.canvas,orientation,width:orientation==="horizontal"?1920:1080,height:orientation==="horizontal"?1080:1920}}});
  const applyStylePreset=(name:"Reference"|"Compact"|"Big Creator"|"Minimal")=>{dispatch({type:"replace-message",message:applyPreset(selected,name)});showToast(`${name} preset applied`);};

  const addBadge=(type:BadgeType)=>{const meta=BADGE_META[type];patchSelected({badges:[...selected.badges,{id:uid(),type,label:type,visible:true,...(type==="Custom"?{}:{})}]});showToast(`${meta.short} badge added`);};
  const updateBadge=(id:string,patch:Partial<BadgeInstance>)=>patchSelected({badges:selected.badges.map(b=>b.id===id?{...b,...patch}:b)});
  const removeBadge=(id:string)=>patchSelected({badges:selected.badges.filter(b=>b.id!==id)});
  const reorderBadge=(from:number,to:number)=>{if(to<0||to>=selected.badges.length)return;const badges=[...selected.badges];const [badge]=badges.splice(from,1);badges.splice(to,0,badge);patchSelected({badges});};
  const uploadBadge=async(file?:File)=>{if(!file)return;if(file.size>1_500_000){showToast("Badge must be under 1.5 MB");return;}if(!["image/png","image/webp","image/svg+xml"].includes(file.type)){showToast("Use PNG, WebP or SVG");return;}try{let dataUrl:string;if(file.type==="image/svg+xml"){const clean=sanitizeSvg(await file.text());dataUrl=`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(clean)))}`;}else dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file);});patchSelected({badges:[...selected.badges,{id:uid(),type:"Custom",label:file.name,visible:true,customDataUrl:dataUrl}]});showToast("Custom badge added");}catch{showToast("That badge could not be read");}};

  const downloadPng=(mode=project.export.mode)=>{const stage=stageRef.current;if(!stage)return;const transformer=transformerRef.current;transformer?.visible(false);const previous=project.messages.map(message=>({id:message.id,visible:groupRefs.current[message.id]?.visible()??false}));let config:Konva.StageConfig & {pixelRatio:number;x?:number;y?:number;width?:number;height?:number}={pixelRatio:project.export.scale/displayScale};
    if(mode==="message"){Object.entries(groupRefs.current).forEach(([id,node])=>node.visible(id===selected.id));const node=groupRefs.current[selected.id];const rect=node.getClientRect({relativeTo:stage});const pad=project.export.padding*displayScale;config={...config,x:rect.x-pad,y:rect.y-pad,width:rect.width+pad*2,height:rect.height+pad*2};}
    stage.batchDraw();const url=stage.toDataURL(config);previous.forEach(item=>groupRefs.current[item.id]?.visible(item.visible));transformer?.visible(true);stage.batchDraw();const anchor=document.createElement("a");anchor.href=url;anchor.download=`${safeFilename(selected.username)}-${mode}-${project.canvas.orientation}-${project.export.scale}x.png`;anchor.click();showToast(mode==="full"?"Full canvas exported":"Message exported");};

  const resetProject=()=>{if(window.confirm("Reset the entire project? This cannot be undone.")){localStorage.removeItem(STORAGE_KEY);dispatch({type:"reset",project:createProject()});showToast("Project reset");}};
  const copyCurrentStyle=()=>{dispatch({type:"project",patch:{styleClipboard:copyStyle(selected)}});showToast("Style copied");};
  const pasteCurrentStyle=()=>{if(!project.styleClipboard){showToast("Copy a style first");return;}dispatch({type:"replace-message",message:pasteStyle(selected,project.styleClipboard)});showToast("Style pasted");};

  const tabs:{id:InspectorTab;label:string}[]=[{id:"content",label:"Content"},{id:"front",label:"Front Card"},{id:"back",label:"Back Card"},{id:"badges",label:"Badges"},{id:"transform",label:"Transform"},{id:"export",label:"Export"}];
  const currentLayout=calculateLayout(selected);

  return <main className="editor-shell">
    <header className="editor-topbar">
      <div className="editor-brand"><span>TC</span><div><small>OVERLAY STUDIO</small><h1>Twitch Chat Card Generator</h1></div></div>
      <div className="top-actions">
        <div className="orientation-switch"><button className={project.canvas.orientation==="horizontal"?"active":""} onClick={()=>setOrientation("horizontal")}>Horizontal</button><button className={project.canvas.orientation==="vertical"?"active":""} onClick={()=>setOrientation("vertical")}>Vertical</button></div>
        <button className="tool-button" onClick={newMessage}><Plus size={15}/>New message</button>
        <button className="tool-button" onClick={randomizeStyle}><Shuffle size={14}/>Randomize style</button>
        <button className="primary-button" onClick={()=>downloadPng()}><Download size={15}/>Export PNG</button>
      </div>
    </header>
    <div className="editor-workspace">
      <section className="canvas-pane">
        <div className="pane-meta"><span>CANVAS</span><span>{project.canvas.width} × {project.canvas.height} · {Math.round(displayScale*100)}%</span></div>
        <div className={`canvas-wrap ${project.canvas.orientation}`} ref={canvasWrapRef}>
          <div className="konva-holder" style={{width:project.canvas.width*displayScale,height:project.canvas.height*displayScale}}>
            <Stage ref={stageRef} width={project.canvas.width*displayScale} height={project.canvas.height*displayScale}>
              <Layer scaleX={displayScale} scaleY={displayScale}>
                {project.messages.map(chat=><ChatCard key={chat.id} chat={chat} selected={chat.id===selected.id} onSelect={()=>dispatch({type:"project",patch:{selectedId:chat.id}})} onPatch={patch=>dispatch({type:"message",id:chat.id,patch})} register={node=>{if(node)groupRefs.current[chat.id]=node;else delete groupRefs.current[chat.id];}}/>)}
                <Transformer ref={transformerRef} rotateEnabled enabledAnchors={["top-left","top-right","bottom-left","bottom-right"]} borderStroke="#8B65F4" anchorFill="#FFFFFF" anchorStroke="#8B65F4" anchorSize={9/displayScale} borderStrokeWidth={1.5/displayScale} padding={5/displayScale} keepRatio boundBoxFunc={(oldBox,newBox)=>Math.abs(newBox.width)<50||Math.abs(newBox.height)<24?oldBox:newBox}/>
              </Layer>
            </Stage>
          </div>
        </div>
        <div className="canvas-status"><span><i/> {storageError?"Storage full — project remains in this session":"Auto-saved locally"}</span><span>Transparent canvas · checkerboard not exported</span></div>
      </section>
      <aside className="property-pane">
        <div className="layers-title"><div><small>LAYERS</small><h2>Chat messages <em>{project.messages.length}</em></h2></div><button aria-label="Add message" onClick={newMessage}><Plus size={16}/></button></div>
        <div className="layer-list">
          {project.messages.map((chat,index)=><div key={chat.id} className={chat.id===selected.id?"layer-item selected":"layer-item"} draggable onDragStart={event=>event.dataTransfer.setData("text/plain",String(index))} onDragOver={event=>event.preventDefault()} onDrop={event=>reorder(Number(event.dataTransfer.getData("text/plain")),index)} onClick={()=>dispatch({type:"project",patch:{selectedId:chat.id}})}>
            <GripVertical size={14} className="grip"/><span className="layer-avatar" style={{background:chat.back.backgroundColor}}>{chat.username.slice(0,2).toUpperCase()}</span><span className="layer-copy"><b>{chat.username||"Username"}</b><small>{chat.message||"Empty message"}</small></span>
            <button aria-label={chat.visible?"Hide message":"Show message"} onClick={event=>{event.stopPropagation();dispatch({type:"message",id:chat.id,patch:{visible:!chat.visible}})}}>{chat.visible?<Eye size={14}/>:<EyeOff size={14}/>}</button>
            <span className="layer-order"><button aria-label="Move layer up" disabled={index===0} onClick={event=>{event.stopPropagation();reorder(index,index-1)}}>↑</button><button aria-label="Move layer down" disabled={index===project.messages.length-1} onClick={event=>{event.stopPropagation();reorder(index,index+1)}}>↓</button></span>
          </div>)}
        </div>
        <div className="layer-actions"><button onClick={duplicateMessage}><Copy size={13}/>Duplicate</button><button onClick={copyCurrentStyle}>Copy style</button><button disabled={!project.styleClipboard} onClick={pasteCurrentStyle}>Paste style</button><button className="danger" onClick={deleteMessage}><Trash2 size={13}/></button></div>
        <nav className="property-tabs">{tabs.map(item=><button key={item.id} className={tab===item.id?"active":""} onClick={()=>setTab(item.id)}>{item.label}</button>)}</nav>
        <div className="properties-scroll">
          {tab==="content"&&<>
            <PanelSection title="Message content"><Field label="Username" wide><input value={selected.username} onChange={e=>patchSelected({username:e.target.value})}/></Field><Field label="Message" wide><textarea rows={3} value={selected.message} onChange={e=>patchSelected({message:e.target.value})}/></Field><Field label="Layout" wide><select value={selected.content.layout} onChange={e=>patchContent({layout:e.target.value as "stacked"|"inline"})}><option value="stacked">Reference · stacked</option><option value="inline">Traditional · inline</option></select></Field></PanelSection>
            <PanelSection title="Username"><Field label="Color mode"><select value={selected.content.usernameColorMode} onChange={e=>patchContent({usernameColorMode:e.target.value as "manual"|"random"})}><option value="manual">Manual</option><option value="random">Random</option></select></Field><ColorField label="Username color" value={selected.content.usernameColor} onChange={usernameColor=>patchContent({usernameColor})}/><NumberField label="Font size" value={selected.content.usernameFontSize} min={8} max={96} onChange={usernameFontSize=>patchContent({usernameFontSize})}/><Field label="Weight"><select value={selected.content.usernameWeight} onChange={e=>patchContent({usernameWeight:Number(e.target.value)})}><option value="400">Regular</option><option value="500">Medium</option><option value="600">SemiBold</option><option value="700">Bold</option></select></Field><button className="secondary wide" onClick={()=>patchContent({usernameColor:randomUsernameColor(selected.front.backgroundColor),usernameColorMode:"random"})}><Sparkles size={13}/>Regenerate color</button><Toggle label="Randomize on new message" checked={project.canvas.randomizeOnNew} onChange={randomizeOnNew=>dispatch({type:"project",patch:{canvas:{...project.canvas,randomizeOnNew}}})}/></PanelSection>
            <PanelSection title="Message typography"><ColorField label="Message color" value={selected.content.messageColor} onChange={messageColor=>patchContent({messageColor})}/><NumberField label="Font size" value={selected.content.messageFontSize} min={8} max={120} onChange={messageFontSize=>patchContent({messageFontSize})}/><NumberField label="Line height" value={selected.content.lineHeight} min={.8} max={3} step={.05} onChange={lineHeight=>patchContent({lineHeight})}/><Field label="Weight"><select value={selected.content.messageWeight} onChange={e=>patchContent({messageWeight:Number(e.target.value)})}><option value="400">Regular</option><option value="500">Medium</option><option value="600">SemiBold</option><option value="700">Bold</option></select></Field><NumberField label="Maximum width" value={selected.content.messageMaxWidth} min={80} max={1400} onChange={messageMaxWidth=>patchContent({messageMaxWidth})}/><Field label="Alignment"><select value={selected.content.textAlign} onChange={e=>patchContent({textAlign:e.target.value as "left"|"center"|"right"})}><option>left</option><option>center</option><option>right</option></select></Field></PanelSection>
            <PanelSection title="Spacing"><NumberField label="Badge → username" value={selected.content.badgeUsernameSpacing} min={0} max={80} onChange={badgeUsernameSpacing=>patchContent({badgeUsernameSpacing})}/><NumberField label="Username → message" value={selected.content.usernameMessageSpacing} min={0} max={100} onChange={usernameMessageSpacing=>patchContent({usernameMessageSpacing})}/></PanelSection>
          </>}
          {tab==="front"&&<>
            <PanelSection title="Presets"><div className="preset-grid wide">{(["Reference","Compact","Big Creator","Minimal"] as const).map(name=><button key={name} onClick={()=>applyStylePreset(name)}>{name}</button>)}</div></PanelSection>
            <PanelSection title="Surface"><ColorField label="Background" value={selected.front.backgroundColor} onChange={backgroundColor=>patchFront({backgroundColor})}/><NumberField label="Opacity" value={selected.front.opacity} min={0} max={1} step={.05} onChange={opacity=>patchFront({opacity})}/><Toggle label="Auto Size" checked={selected.front.autoSize} onChange={autoSize=>patchFront({autoSize})} help={currentLayout.overflow?"Content is clipped at this size":undefined}/><span className="wide size-readout">Rendered size <b>{Math.round(currentLayout.width)} × {Math.round(currentLayout.height)} px</b></span></PanelSection>
            <PanelSection title="Dimensions"><NumberField label="Width" value={selected.front.width} min={80} max={1600} disabled={selected.front.autoSize} onChange={width=>patchFront({width})}/><NumberField label="Height" value={selected.front.height} min={24} max={1000} disabled={selected.front.autoSize} onChange={height=>patchFront({height})}/><NumberField label="Minimum width" value={selected.front.minWidth} min={80} max={1600} disabled={!selected.front.autoSize} onChange={minWidth=>patchFront({minWidth})}/><NumberField label="Maximum width" value={selected.front.maxWidth} min={80} max={1800} disabled={!selected.front.autoSize} onChange={maxWidth=>patchFront({maxWidth})}/><NumberField label="Horizontal padding" value={selected.front.paddingX} min={0} max={200} onChange={paddingX=>patchFront({paddingX})}/><NumberField label="Vertical padding" value={selected.front.paddingY} min={0} max={200} onChange={paddingY=>patchFront({paddingY})}/><NumberField label="Border radius" value={selected.front.borderRadius} min={0} max={300} onChange={borderRadius=>patchFront({borderRadius})}/></PanelSection>
            <PanelSection title="Border"><Toggle label="Enable border" checked={selected.front.border.enabled} onChange={enabled=>patchFront({border:{...selected.front.border,enabled}})}/><ColorField label="Border color" value={selected.front.border.color} disabled={!selected.front.border.enabled} onChange={color=>patchFront({border:{...selected.front.border,color}})}/><NumberField label="Thickness" value={selected.front.border.thickness} min={0} max={30} disabled={!selected.front.border.enabled} onChange={thickness=>patchFront({border:{...selected.front.border,thickness}})}/></PanelSection>
            <PanelSection title="Shadow"><Toggle label="Enable shadow" checked={selected.front.shadow.enabled} onChange={enabled=>patchFront({shadow:{...selected.front.shadow,enabled}})}/><NumberField label="Blur" value={selected.front.shadow.blur} min={0} max={120} disabled={!selected.front.shadow.enabled} onChange={blur=>patchFront({shadow:{...selected.front.shadow,blur}})}/><NumberField label="Opacity" value={selected.front.shadow.opacity} min={0} max={1} step={.05} disabled={!selected.front.shadow.enabled} onChange={opacity=>patchFront({shadow:{...selected.front.shadow,opacity}})}/><NumberField label="Shadow X" value={selected.front.shadow.x} min={-100} max={100} disabled={!selected.front.shadow.enabled} onChange={x=>patchFront({shadow:{...selected.front.shadow,x}})}/><NumberField label="Shadow Y" value={selected.front.shadow.y} min={-100} max={100} disabled={!selected.front.shadow.enabled} onChange={y=>patchFront({shadow:{...selected.front.shadow,y}})}/></PanelSection>
          </>}
          {tab==="back"&&<>
            <PanelSection title="Surface"><ColorField label="Back card color" value={selected.back.backgroundColor} onChange={backgroundColor=>patchBack({backgroundColor})}/><NumberField label="Opacity" value={selected.back.opacity} min={0} max={1} step={.05} onChange={opacity=>patchBack({opacity})}/><button className="secondary wide" onClick={()=>patchBack({backgroundColor:randomBackColor()})}><Sparkles size={13}/>Random back color</button></PanelSection>
            <PanelSection title="Position & size"><NumberField label="Offset X" value={selected.back.offsetX} min={-300} max={300} onChange={offsetX=>patchBack({offsetX})}/><NumberField label="Offset Y" value={selected.back.offsetY} min={-300} max={300} onChange={offsetY=>patchBack({offsetY})}/><Toggle label="Match Front Card Size" checked={selected.back.matchFrontSize} onChange={matchFrontSize=>patchBack({matchFrontSize})}/><span/><NumberField label="Width" value={selected.back.width} min={20} max={1800} disabled={selected.back.matchFrontSize} onChange={width=>patchBack({width})}/><NumberField label="Height" value={selected.back.height} min={20} max={1800} disabled={selected.back.matchFrontSize} onChange={height=>patchBack({height})}/><NumberField label="Width adjustment" value={selected.back.widthAdjustment} min={-600} max={600} onChange={widthAdjustment=>patchBack({widthAdjustment})}/><NumberField label="Height adjustment" value={selected.back.heightAdjustment} min={-600} max={600} onChange={heightAdjustment=>patchBack({heightAdjustment})}/><NumberField label="Scale X" value={selected.back.scaleX} min={.1} max={4} step={.05} onChange={scaleX=>patchBack({scaleX})}/><NumberField label="Scale Y" value={selected.back.scaleY} min={.1} max={4} step={.05} onChange={scaleY=>patchBack({scaleY})}/></PanelSection>
            <PanelSection title="Corners"><Toggle label="Link Border Radius" checked={selected.back.linkBorderRadius} onChange={linkBorderRadius=>patchBack({linkBorderRadius,borderRadius:linkBorderRadius?selected.front.borderRadius:selected.back.borderRadius})}/><NumberField label="Border radius" value={selected.back.borderRadius} min={0} max={300} disabled={selected.back.linkBorderRadius} onChange={borderRadius=>patchBack({borderRadius})}/></PanelSection>
            <PanelSection title="Border"><Toggle label="Enable border" checked={selected.back.border.enabled} onChange={enabled=>patchBack({border:{...selected.back.border,enabled}})}/><ColorField label="Border color" value={selected.back.border.color} disabled={!selected.back.border.enabled} onChange={color=>patchBack({border:{...selected.back.border,color}})}/><NumberField label="Thickness" value={selected.back.border.thickness} min={0} max={30} disabled={!selected.back.border.enabled} onChange={thickness=>patchBack({border:{...selected.back.border,thickness}})}/></PanelSection>
            <PanelSection title="Shadow"><Toggle label="Enable shadow" checked={selected.back.shadow.enabled} onChange={enabled=>patchBack({shadow:{...selected.back.shadow,enabled}})}/><NumberField label="Blur" value={selected.back.shadow.blur} min={0} max={120} disabled={!selected.back.shadow.enabled} onChange={blur=>patchBack({shadow:{...selected.back.shadow,blur}})}/><NumberField label="Opacity" value={selected.back.shadow.opacity} min={0} max={1} step={.05} disabled={!selected.back.shadow.enabled} onChange={opacity=>patchBack({shadow:{...selected.back.shadow,opacity}})}/><NumberField label="Shadow X" value={selected.back.shadow.x} min={-100} max={100} disabled={!selected.back.shadow.enabled} onChange={x=>patchBack({shadow:{...selected.back.shadow,x}})}/><NumberField label="Shadow Y" value={selected.back.shadow.y} min={-100} max={100} disabled={!selected.back.shadow.enabled} onChange={y=>patchBack({shadow:{...selected.back.shadow,y}})}/></PanelSection>
          </>}
          {tab==="badges"&&<>
            <PanelSection title="Add badges"><div className="badge-palette wide">{(Object.keys(BADGE_META) as BadgeType[]).filter(type=>type!=="Custom").map(type=><button key={type} onClick={()=>addBadge(type)} style={{"--badge":BADGE_META[type].color} as React.CSSProperties}><i>{BADGE_META[type].short}</i><span>{type}</span></button>)}</div><Field label="Add custom badge" wide><label className="upload-button"><ImagePlus size={15}/>PNG, WebP or SVG<input type="file" accept=".png,.webp,.svg,image/png,image/webp,image/svg+xml" onChange={event=>uploadBadge(event.target.files?.[0])}/></label></Field></PanelSection>
            <PanelSection title="Badge sizing"><NumberField label="Size" value={selected.badgeSettings.size} min={8} max={120} onChange={size=>patchBadgeSettings({size})}/><NumberField label="Spacing" value={selected.badgeSettings.spacing} min={0} max={80} onChange={spacing=>patchBadgeSettings({spacing})}/></PanelSection>
            <PanelSection title={`Active badges · ${selected.badges.length}`}><div className="active-badges wide">{selected.badges.length===0?<p>No badges yet. Add one above.</p>:selected.badges.map((badge,index)=><div key={badge.id} draggable onDragStart={event=>event.dataTransfer.setData("text/badge",String(index))} onDragOver={event=>event.preventDefault()} onDrop={event=>reorderBadge(Number(event.dataTransfer.getData("text/badge")),index)}><GripVertical size={13}/><i style={{background:BADGE_META[badge.type].color}}>{BADGE_META[badge.type].short}</i><span>{badge.label}</span><button onClick={()=>updateBadge(badge.id,{visible:!badge.visible})}>{badge.visible?<Eye size={13}/>:<EyeOff size={13}/>}</button><button disabled={index===0} onClick={()=>reorderBadge(index,index-1)}>↑</button><button disabled={index===selected.badges.length-1} onClick={()=>reorderBadge(index,index+1)}>↓</button><button className="danger" onClick={()=>removeBadge(badge.id)}><Trash2 size={12}/></button></div>)}</div></PanelSection>
          </>}
          {tab==="transform"&&<>
            <PanelSection title="Message transform"><NumberField label="X" value={selected.transform.x} min={-2000} max={4000} onChange={x=>patchSelected({transform:{...selected.transform,x}})}/><NumberField label="Y" value={selected.transform.y} min={-2000} max={4000} onChange={y=>patchSelected({transform:{...selected.transform,y}})}/><NumberField label="Scale" value={selected.transform.scale} min={.1} max={8} step={.05} onChange={scale=>patchSelected({transform:{...selected.transform,scale}})}/><NumberField label="Rotation" value={selected.transform.rotation} min={-360} max={360} onChange={rotation=>patchSelected({transform:{...selected.transform,rotation}})}/><button className="secondary wide" onClick={()=>patchSelected({transform:{x:(project.canvas.width-currentLayout.width)/2,y:(project.canvas.height-currentLayout.height)/2,scale:1,rotation:0}})}><RotateCcw size={13}/>Center and reset transform</button></PanelSection>
            <PanelSection title="Randomize style"><Toggle label="Username color" checked={project.randomize.usernameColor} onChange={usernameColor=>dispatch({type:"project",patch:{randomize:{...project.randomize,usernameColor}}})}/><Toggle label="Back card color" checked={project.randomize.backCardColor} onChange={backCardColor=>dispatch({type:"project",patch:{randomize:{...project.randomize,backCardColor}}})}/><Toggle label="Card offset" checked={project.randomize.cardOffset} onChange={cardOffset=>dispatch({type:"project",patch:{randomize:{...project.randomize,cardOffset}}})}/><Toggle label="Border radius" checked={project.randomize.borderRadius} onChange={borderRadius=>dispatch({type:"project",patch:{randomize:{...project.randomize,borderRadius}}})}/><button className="secondary wide" onClick={randomizeStyle}><Shuffle size={13}/>Randomize selected properties</button></PanelSection>
          </>}
          {tab==="export"&&<>
            <PanelSection title="Export mode"><button className={project.export.mode==="full"?"export-choice active wide":"export-choice wide"} onClick={()=>dispatch({type:"project",patch:{export:{...project.export,mode:"full"}}})}><Layers3 size={17}/><span><b>Full canvas</b><small>{project.canvas.width} × {project.canvas.height}, transparent</small></span></button><button className={project.export.mode==="message"?"export-choice active wide":"export-choice wide"} onClick={()=>dispatch({type:"project",patch:{export:{...project.export,mode:"message"}}})}><Sparkles size={17}/><span><b>Message only</b><small>Trimmed to the selected card</small></span></button></PanelSection>
            <PanelSection title="Output settings"><NumberField label="Export padding" value={project.export.padding} min={0} max={300} onChange={padding=>dispatch({type:"project",patch:{export:{...project.export,padding}}})}/><Field label="Export scale"><select value={project.export.scale} onChange={event=>dispatch({type:"project",patch:{export:{...project.export,scale:Number(event.target.value) as 1|2|4}}})}><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></Field><button className="export-main wide" onClick={()=>downloadPng()}><Download size={16}/>Export {project.export.mode==="full"?"full canvas":"message only"} at {project.export.scale}×</button></PanelSection>
            <PanelSection title="Project"><button className="reset-button wide" onClick={resetProject}><RotateCcw size={14}/>Reset project</button></PanelSection>
          </>}
        </div>
      </aside>
    </div>
    {toast?<div className="toast">{toast}</div>:null}
  </main>;
}

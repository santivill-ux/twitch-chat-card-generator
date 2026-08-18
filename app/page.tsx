"use client";

import { useEffect, useState } from "react";

type EditorComponent = typeof import("../components/TwitchEditor").default;

export default function Home() {
  const [Editor,setEditor] = useState<EditorComponent|null>(null);
  useEffect(()=>{let active=true;import("../components/TwitchEditor").then(module=>{if(active)setEditor(()=>module.default);});return()=>{active=false;};},[]);
  if(!Editor) return <main className="editor-loading"><span>TC</span><p>Preparing your transparent canvas…</p></main>;
  return <Editor />;
}

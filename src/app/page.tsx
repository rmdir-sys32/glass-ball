"use client";

import { useState } from "react";
import GlassBall from "./glass-ball";
import MarbleV1 from "./marble-v1";
import MarbleV2 from "./marble-v2";

const presets = ["#ad642a", "#477e8d", "#9c5379", "#5d8b52"];

export default function Page() {
  const [color, setColor] = useState(presets[0]);
  const [velocity, setVelocity] = useState(1.8);
  const [run, setRun] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [version, setVersion] = useState(3);

  const launch = (speed: number) => {
    setShaking(false);
    setVelocity(speed);
    setRun((value) => value + 1);
  };

  return (
    <main style={{ minHeight: "100vh", background: "#100f0e", color: "#f2e9dc", fontFamily: "Arial, Helvetica, sans-serif", padding: "clamp(24px, 5vw, 72px)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap", marginBottom: 44 }}>
          <span style={{ letterSpacing: "0.22em", fontSize: 12, color: "#dba96d", fontWeight: 700 }}>MATERIAL STUDY / 001</span>
          <span style={{ color: "#8f8880", fontSize: 12 }}>THREE.JS · GLASS · MOTION</span>
        </header>

        <nav aria-label="Marble versions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
          {[
            [1, "v1 · Red glass"],
            [2, "v2 · Golden core"],
            [3, "v3 · Clear ribbons"],
          ].map(([number, label]) => (
            <button key={number} onClick={() => setVersion(Number(number))} aria-pressed={version === number} style={{ ...buttonStyle, background: version === number ? "#79502d" : "#29231f", borderColor: version === number ? "#dba96d" : "#514338" }}>
              {label}
            </button>
          ))}
        </nav>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: "clamp(28px, 5vw, 72px)", alignItems: "center" }}>
          <section>
            <div style={{ color: "#dba96d", fontSize: 12, letterSpacing: "0.18em", marginBottom: 20 }}>INTERACTIVE OBJECT</div>
            <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "clamp(54px, 8vw, 104px)", letterSpacing: "-0.06em", lineHeight: 0.9, margin: "0 0 28px" }}>Glass<br /><i>marble.</i></h1>
            <p style={{ color: "#a7a099", lineHeight: 1.7, fontSize: 15, maxWidth: 370, marginBottom: 40 }}>A small study in light, weight, and motion. Change the inner swirl, then send the marble rolling.</p>

            <div style={{ borderTop: "1px solid #39332e", paddingTop: 24 }}>
              <div style={{ color: "#b8aa9d", fontSize: 11, letterSpacing: "0.14em", marginBottom: 16 }}>SWIRL COLOUR</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                {presets.map((value) => <button key={value} onClick={() => setColor(value)} aria-label={`Set swirl colour ${value}`} aria-pressed={color === value} style={{ width: 34, height: 34, borderRadius: "50%", background: value, border: color === value ? "2px solid #fff1da" : "2px solid transparent", outline: color === value ? "1px solid #8e7760" : "none", outlineOffset: 3, cursor: "pointer" }} />)}
                <input aria-label="Custom swirl colour" type="color" value={color} onChange={(event) => setColor(event.target.value)} style={{ width: 36, height: 36, background: "none", border: 0, cursor: "pointer" }} />
                <code style={{ color: "#b7a89a", marginLeft: 8, fontSize: 12 }}>{color.toUpperCase()}</code>
              </div>

              <div style={{ color: "#b8aa9d", fontSize: 11, letterSpacing: "0.14em", marginBottom: 16 }}>ROLL DIRECTION</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => launch(-1.8)} style={buttonStyle}>← Roll left</button>
                <button onClick={() => launch(1.8)} style={buttonStyle}>Roll right →</button>
                <button onClick={() => launch(0)} style={buttonStyle}>Drop ↓</button>
              </div>
              <button
                onClick={() => setShaking((value) => !value)}
                aria-pressed={shaking}
                style={{ ...buttonStyle, marginTop: 16, background: shaking ? "#79502d" : "#29231f", borderColor: shaking ? "#dba96d" : "#514338" }}
              >
                {shaking ? "Stop shaker" : "Start shaker ↻"}
              </button>
            </div>
          </section>

          <section style={{ border: "1px solid #322d28", borderRadius: 18, overflow: "hidden", background: version === 3 ? "#c9cccb" : "#171614", boxShadow: "0 30px 90px #0008" }}>
            {version === 1 ? <MarbleV1 /> : version === 2 ? <MarbleV2 /> : <GlassBall key={run} color={color} initialVelocityX={velocity} shaking={shaking} style={{ height: "min(65vh, 620px)", minHeight: 420 }} />}
            <div style={{ padding: "14px 20px", borderTop: "1px solid #302c27", color: version === 3 ? "#514a43" : "#aaa097", fontSize: 11, letterSpacing: "0.12em", display: "flex", justifyContent: "space-between" }}><span>VERSION 0.{version}.0</span><span>{version === 3 ? "LIVE PHYSICS" : "REFERENCE SNAPSHOT"}</span></div>
          </section>
        </div>
      </div>
    </main>
  );
}

const buttonStyle: React.CSSProperties = {
  color: "#e7dacb", background: "#29231f", border: "1px solid #514338",
  borderRadius: 6, padding: "11px 15px", cursor: "pointer", fontSize: 13,
};

/* ONE MORE RUN: JUNGLE RIFT. Three.js renderer.
   Pure view layer: reads the game state object `g` (world units in metres) and draws it.
   Forward is -Z. The player stands at z = 0; the world scrolls toward the camera.
   The "curved world" bend is done in the vertex shader so collision stays in straight world space. */
import * as THREE from "three";

export const LANE_W = 2.2, UN = 1.6;
const ZMAX = 125, CH = 25, NCH = 9, MAXSC = 150;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const bendU = { uCurve: { value: 0 } };
const bend = (m) => {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCurve = bendU.uCurve;
    sh.vertexShader = "uniform float uCurve;\n" + sh.vertexShader.replace("#include <project_vertex>",
      "#include <project_vertex>\nmvPosition.x += uCurve * pow(max(-mvPosition.z - 6.0, 0.0) / 90.0, 2.0);\ngl_Position = projectionMatrix * mvPosition;");
  };
  return m;
};

/* ---------- time-of-day palette ---------- */
const PAL = {
  day: { top: [110, 205, 255], bot: [205, 238, 215], gnd: [58, 107, 42], dark: 0 },
  dusk: { top: [255, 130, 90], bot: [255, 206, 140], gnd: [60, 80, 40], dark: 0.12 },
  night: { top: [14, 26, 64], bot: [44, 74, 122], gnd: [20, 50, 40], dark: 0.42 },
};
const KF = [[0, "day"], [0.35, "day"], [0.5, "dusk"], [0.62, "dusk"], [0.78, "night"], [0.93, "night"], [1, "day"]];
const mixPal = (a, b, t) => { const o = {}; for (const k in a) o[k] = Array.isArray(a[k]) ? a[k].map((v, i) => lerp(v, b[k][i], t)) : lerp(a[k], b[k], t); return o; };
function getPal(dist, night) {
  const tp = (dist / 2400) % 1; let p = PAL.day;
  for (let i = 0; i < KF.length - 1; i++) if (tp >= KF[i][0] && tp <= KF[i + 1][0]) { p = mixPal(PAL[KF[i][1]], PAL[KF[i + 1][1]], (tp - KF[i][0]) / (KF[i + 1][0] - KF[i][0])); break; }
  return night > 0 ? mixPal(p, PAL.night, night) : p;
}
const rgb = (a) => `rgb(${a.map((v) => Math.round(v)).join(",")})`;
const zoneOf = (wz) => ((Math.floor(wz / 350) % 4) + 4) % 4; /* 0 path, 1 bridge over river, 2 path, 3 ruins */

/* ---------- procedural textures ---------- */
function canvasTex(w, h, fn, rx, ry) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; fn(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); t.anisotropy = 4;
  if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t;
}
const speck = (c, w, h, cols, n, s) => { for (let i = 0; i < n; i++) { c.fillStyle = cols[(Math.random() * cols.length) | 0]; c.fillRect(Math.random() * w, Math.random() * h, s, s); } };
const laneLines = (c, w, h, col) => { c.fillStyle = col; [0.366, 0.634].forEach((u) => c.fillRect(u * w - 3, 0, 6, h * 0.5)); };
const texPath = () => canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = "#8f7547"; c.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) { c.fillStyle = `hsl(36,${24 + Math.random() * 10}%,${50 + Math.random() * 14}%)`; c.fillRect(k * w / 7 + (r % 2) * w / 14 + 2, r * h / 4 + 2, w / 7 - 4, h / 4 - 4); }
  speck(c, w, h, ["#6b8f3a", "#4e7a2c"], 70, 5); laneLines(c, w, h, "rgba(255,255,255,.6)");
  c.fillStyle = "#4b6a2a"; c.fillRect(0, 0, w * 0.06, h); c.fillRect(w * 0.94, 0, w * 0.06, h);
}, 1, 5);
const texBridge = () => canvasTex(256, 256, (c, w, h) => {
  for (let r = 0; r < 8; r++) { c.fillStyle = `hsl(28,${40 + Math.random() * 12}%,${34 + Math.random() * 12}%)`; c.fillRect(0, r * h / 8, w, h / 8 - 2); c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(0, r * h / 8 + h / 8 - 2, w, 2); }
  speck(c, w, h, ["#2b1a0c", "#5a3a1e"], 40, 3); laneLines(c, w, h, "rgba(255,240,180,.55)");
}, 1, 5);
const texRuin = () => canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = "#6f7a70"; c.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { c.fillStyle = `hsl(120,6%,${44 + Math.random() * 14}%)`; c.fillRect(k * w / 4 + 3, r * h / 4 + 3, w / 4 - 6, h / 4 - 6); c.strokeStyle = "rgba(30,60,30,.5)"; c.strokeRect(k * w / 4 + 22, r * h / 4 + 22, w / 4 - 44, h / 4 - 44); }
  speck(c, w, h, ["#4f8f3e", "#3d7a2e"], 80, 6); laneLines(c, w, h, "rgba(255,255,255,.5)");
}, 1, 5);
const texGrass = () => canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#3f9a46"; c.fillRect(0, 0, w, h); speck(c, w, h, ["#2f7d3a", "#58b552", "#347f3c"], 260, 3); }, 8, 6);
const texWater = () => canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#2c95d8"; c.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { c.strokeStyle = "rgba(255,255,255,.25)"; c.beginPath(); const y = Math.random() * h, x = Math.random() * w; c.moveTo(x, y); c.quadraticCurveTo(x + 10, y - 4, x + 22, y); c.stroke(); } }, 6, 5);
const texFalls = () => canvasTex(64, 128, (c, w, h) => { c.fillStyle = "#bfe9ff"; c.fillRect(0, 0, w, h); for (let i = 0; i < 18; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.5})`; c.fillRect(Math.random() * w, 0, 3 + Math.random() * 5, h); } }, 1, 2);

/* ---------- sign textures ---------- */
const SSTY = {
  WELCOME: ["rect", "#1f9d5a", "#ffffff", "🌴"], FUNNY: ["arrow", "#c98b4a", "#fff7e0", "😄"], MOTIVATION: ["round", "#2a8bd8", "#ffffff", "⭐"],
  TREASURE: ["arrow", "#7b4a22", "#ffd54a", "💰"], MILESTONE: ["stone", "#6b7280", "#ffffff", "🏁"], CHALLENGE: ["rect", "#7b3fc9", "#ffffff", "🔥"],
  ACHIEVEMENT: ["round", "#f0b400", "#2b1a00", "🏆"], DANGER: ["rect", "#ffcc00", "#111111", "⚠️"], SHORTCUT: ["arrow", "#e8553d", "#ffffff", "➜"], RIFT: ["rect", "#5b2fd0", "#ffffff", "⚡"],
};
function wrapText(c, text, maxW) {
  const out = []; let line = "";
  text.split(" ").forEach((w) => { const t = line ? line + " " + w : w; if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; });
  if (line) out.push(line); return out;
}
function signTexture(sg) {
  const st = SSTY[sg.type] || SSTY.FUNNY, c = document.createElement("canvas"); c.width = 512; c.height = 320; const x = c.getContext("2d");
  const W = 512, H = 320, dir = -sg.side; x.lineJoin = "round"; x.lineWidth = 10; x.fillStyle = st[1]; x.strokeStyle = "#ffffff"; x.beginPath();
  if (st[0] === "round") x.ellipse(W / 2, H / 2, W / 2 - 8, H / 2 - 8, 0, 0, 7);
  else if (st[0] === "stone") { x.moveTo(10, H - 10); x.lineTo(10, 90); x.quadraticCurveTo(W / 2, -50, W - 10, 90); x.lineTo(W - 10, H - 10); x.closePath(); }
  else if (st[0] === "arrow") { const t = 60; x.moveTo(dir > 0 ? 12 : W - 12, 20); x.lineTo(dir > 0 ? W - t : t, 20); x.lineTo(dir > 0 ? W - 10 : 10, H / 2); x.lineTo(dir > 0 ? W - t : t, H - 20); x.lineTo(dir > 0 ? 12 : W - 12, H - 20); x.closePath(); }
  else { const r = 28; x.moveTo(10 + r, 10); x.arcTo(W - 10, 10, W - 10, H - 10, r); x.arcTo(W - 10, H - 10, 10, H - 10, r); x.arcTo(10, H - 10, 10, 10, r); x.arcTo(10, 10, W - 10, 10, r); x.closePath(); }
  x.fill(); x.stroke();
  x.font = '44px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#000"; x.fillText(st[3], W / 2, 42);
  const mw = W - (st[0] === "arrow" ? 150 : st[0] === "round" || st[0] === "stone" ? 150 : 70);
  x.fillStyle = st[2]; x.font = 'bold 40px "Arial Black",Impact,sans-serif'; const tl = wrapText(x, sg.title, mw).slice(0, 3);
  x.font = '28px "Trebuchet MS",sans-serif'; const sl = wrapText(x, sg.sub, mw).slice(0, 2), tot = tl.length * 46 + sl.length * 34;
  let y = H / 2 + 22 - tot / 2 + 20; const cx = W / 2 - (st[0] === "arrow" ? dir * 24 : 0);
  x.font = 'bold 40px "Arial Black",Impact,sans-serif'; tl.forEach((l) => { x.fillText(l, cx, y); y += 46; });
  x.font = '28px "Trebuchet MS",sans-serif'; sl.forEach((l) => { x.fillText(l, cx, y); y += 34; });
  const t = new THREE.CanvasTexture(c); if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function symTexture(txt, bg) {
  const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
  if (bg) { x.fillStyle = bg; x.beginPath(); x.arc(64, 64, 58, 0, 7); x.fill(); x.strokeStyle = "#fff"; x.lineWidth = 6; x.stroke(); }
  x.font = (txt.length > 2 ? "bold 56px sans-serif" : '76px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'); x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#fff"; x.fillText(txt, 64, 68);
  const t = new THREE.CanvasTexture(c); if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- shared material cache ---------- */
const matC = new Map();
const mt = (c, flat) => { const k = c + (flat ? "f" : ""); if (!matC.has(k)) matC.set(k, bend(new THREE.MeshLambertMaterial({ color: c, flatShading: !!flat }))); return matC.get(k); };

/* ---------- obstacles ---------- */
function makeObs(k) {
  const G = new THREE.Group(), U = G.userData;
  const add = (geo, m, x, y, z, cast) => { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = cast !== false; G.add(o); return o; };
  const cyl = (a, b, h, s) => new THREE.CylinderGeometry(a, b, h, s || 8), box = (w, h, d) => new THREE.BoxGeometry(w, h, d), sph = (r) => new THREE.SphereGeometry(r, 10, 8);
  switch (k) {
    case "rock": add(new THREE.DodecahedronGeometry(0.8), mt(0x8b8f96, 1), 0, 0.55, 0).scale.set(1.15, 0.8, 1); break;
    case "log": add(cyl(0.38, 0.38, 2.1, 10), mt(0x7a4a22), 0, 0.38, 0).rotation.z = Math.PI / 2; add(cyl(0.2, 0.2, 2.13, 8), mt(0xd9a566), 0, 0.38, 0).rotation.z = Math.PI / 2; break;
    case "barricade": [-0.9, 0.9].forEach((x) => add(box(0.16, 1, 0.16), mt(0x6b4423), x, 0.5, 0)); [0.35, 0.75].forEach((y, i) => add(box(2.2, 0.24, 0.1), mt(i ? 0xe8e0c8 : 0xd9a441), 0, y, 0)); [-0.6, 0, 0.6].forEach((x) => add(box(0.2, 0.24, 0.12), mt(0xd93b2b), x, 0.35, 0.02)); break;
    case "melon": add(sph(0.6), mt(0x2f9e3f), 0, 0.6, 0); for (let i = 0; i < 4; i++) add(new THREE.TorusGeometry(0.6, 0.04, 6, 16), mt(0x15602a), 0, 0.6, 0).rotation.y = i * Math.PI / 4; break;
    case "mushroom": add(cyl(0.28, 0.34, 0.7), mt(0xf1e6c8), 0, 0.35, 0); add(new THREE.SphereGeometry(0.85, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mt(0xd9382b), 0, 0.62, 0); [[0.3, 1.2, 0.2], [-0.35, 1.1, 0.1], [0, 1.42, -0.2], [0.1, 1.05, 0.55]].forEach((p) => add(sph(0.11), mt(0xffffff), p[0] * 0.8, p[1] * 0.78, p[2] * 0.8, false)); break;
    case "barrel": add(cyl(0.5, 0.5, 1.15, 12), mt(0x8a5a2b), 0, 0.58, 0); [0.25, 0.9].forEach((y) => { add(new THREE.TorusGeometry(0.5, 0.04, 6, 16), mt(0x2b2b2b), 0, y, 0).rotation.x = Math.PI / 2; }); break;
    case "duck": add(sph(0.45), mt(0xffd43a), 0, 0.45, 0).scale.set(1, 0.8, 1.2); add(sph(0.26), mt(0xffd43a), 0, 0.92, 0.3); add(new THREE.ConeGeometry(0.09, 0.22, 6), mt(0xff8a1a), 0, 0.88, 0.58).rotation.x = Math.PI / 2; break;
    case "banana": add(new THREE.TorusGeometry(0.4, 0.1, 8, 12, Math.PI * 1.2), mt(0xffe14a), 0, 0.12, 0).rotation.x = -Math.PI / 2; break;
    case "chicken": U.body = add(sph(0.5), mt(0xffffff), 0, 0.75, 0); U.body.scale.set(1, 1.05, 1.2); add(sph(0.26), mt(0xffffff), 0, 1.3, 0.38); add(new THREE.ConeGeometry(0.08, 0.2, 5), mt(0xff9a1a), 0, 1.27, 0.66).rotation.x = Math.PI / 2; add(box(0.07, 0.16, 0.2), mt(0xe02a2a), 0, 1.6, 0.36);
      U.wL = add(box(0.1, 0.4, 0.5), mt(0xf2f2f2), -0.52, 0.8, 0); U.wR = add(box(0.1, 0.4, 0.5), mt(0xf2f2f2), 0.52, 0.8, 0); [-0.2, 0.2].forEach((x) => add(cyl(0.04, 0.04, 0.4), mt(0xffb02a), x, 0.2, 0)); break;
    case "spikes": add(box(1.7, 0.14, 1.7), mt(0x4a4f56), 0, 0.07, 0); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) add(new THREE.ConeGeometry(0.13, 0.55, 5), mt(0xdfe6ee), i * 0.5, 0.4, j * 0.5); break;
    case "boar": U.legs = []; add(box(1.0, 0.9, 1.7), mt(0x6b4a33), 0, 0.95, 0); add(box(0.8, 0.75, 0.8), mt(0x5a3d28), 0, 0.95, 1.05); add(box(0.5, 0.3, 0.3), mt(0xd7a8a0), 0, 0.82, 1.5, false);
      [-0.3, 0.3].forEach((x) => { add(new THREE.ConeGeometry(0.07, 0.35, 5), mt(0xffffff), x, 0.75, 1.45, false).rotation.x = -0.6; add(sph(0.06), mt(0xff2a2a), x * 0.9, 1.15, 1.43, false); });
      [[-0.35, -0.55], [0.35, -0.55], [-0.35, 0.55], [0.35, 0.55]].forEach((p) => { const l = add(box(0.2, 0.55, 0.2), mt(0x3d2a1c), p[0], 0.3, p[1]); U.legs.push(l); }); break;
    case "ftree": U.pivot = new THREE.Group(); U.pivot.position.x = 1.4; G.add(U.pivot); { const t = new THREE.Mesh(cyl(0.38, 0.45, 3.4, 8), mt(0x6b4423)); t.position.y = 1.7; t.castShadow = true; U.pivot.add(t); const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), mt(0x2e8b3d, 1)); c.position.y = 3.6; c.castShadow = true; U.pivot.add(c); } break;
    case "beam": [-0.95, 0.95].forEach((x) => add(cyl(0.09, 0.09, 2.7, 6), mt(0x2f6b2f), x, 1.35, 0)); U.log = add(cyl(0.3, 0.3, 2.2, 10), mt(0x7a4a22), 0, 1.72, 0); U.log.rotation.z = Math.PI / 2; [-0.5, 0.2, 0.7].forEach((x) => add(cyl(0.03, 0.03, 0.5, 4), mt(0x3f9a3e), x, 1.3, 0.1, false)); break;
    case "wall": add(box(2.0, 2.6, 0.95), mt(0x7d8591, 1), 0, 1.3, 0); add(box(2.04, 0.2, 0.99), mt(0x4f8f3e), 0, 2.65, 0); [0.7, 1.4, 2.1].forEach((y) => add(box(2.02, 0.04, 0.97), mt(0x555c66), 0, y, 0, false)); break;
    case "boulder": U.rock = add(new THREE.DodecahedronGeometry(1.05), mt(0x7d8087, 1), 0, 1.05, 0); break;
    case "pit": add(box(2.0, 0.05, 2.6), new THREE.MeshBasicMaterial({ color: 0x050201 }), 0, 0.03, 0, false); [-1.1, 1.1].forEach((x) => add(box(0.3, 0.1, 1.9), mt(0x6b4423), x, 0.05, 0, false).rotation.z = x * 0.15); break;
    case "thicket": add(box(2.0, 2.4, 6), mt(0x1f6b34), 0, 1.2, 0); for (let i = 0; i < 6; i++) add(sph(0.9), mt(0x2e8b3d), rnd(-0.4, 0.4), 2.4 + rnd(-0.2, 0.2), -2.5 + i); break;
    case "gate": [-4.6, 4.6].forEach((x) => { add(box(1.3, 6, 1.3), mt(0x8a8f86, 1), x, 3, 0); add(box(1.4, 0.4, 1.4), mt(0x4f8f3e), x, 6.1, 0); }); add(box(11, 1.3, 1.6), mt(0x7d8591, 1), 0, 6.4, 0);
      U.doors = [-1, 1].map((s) => add(box(1.1, 5, 0.4), mt(0x6b4423), s * 3.9, 2.5, 0)); { const pm = new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: 0.3, depthWrite: false, fog: false, side: THREE.DoubleSide }); U.portal = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 5), pm); U.portal.position.y = 2.7; G.add(U.portal); } break;
    case "cave": add(box(2.6, 0.9, 6.2), mt(0x3a3f45, 1), 0, 3.2, 0); [-0.8, 0, 0.8].forEach((x, i) => add(new THREE.ConeGeometry(0.2, 0.8, 5), mt(0x4a5058), x, 2.5, -1 + i)); add(box(0.5, 3.4, 6.2), mt(0x2f343a, 1), 1.55, 1.7, 0); break;
    default: break;
  }
  return G;
}
function animObs(G, o, z, g) {
  const U = G.userData; G.position.set(o.lane * LANE_W, 0, z);
  if (o.k === "chicken") { const f = Math.sin(g.t * 14); G.position.y = Math.abs(f) * 0.12; U.wL.rotation.z = f * 0.7; U.wR.rotation.z = -f * 0.7; }
  else if (o.k === "boulder") U.rock.rotation.x = -g.dist * 0.9;
  else if (o.k === "boar") { U.legs.forEach((l, i) => { l.rotation.x = Math.sin(g.t * 16 + (i % 2) * Math.PI) * 0.6; }); G.position.y = Math.abs(Math.sin(g.t * 16)) * 0.08; }
  else if (o.k === "ftree") { const f = o.fell ? clamp((g.t - o.fellT) / 0.45, 0, 1) : 0; U.pivot.rotation.z = f * f * (Math.PI / 2 - 0.05); }
  else if (o.k === "beam") U.log.rotation.x = Math.sin(g.t * 1.6 + o.wz) * 0.12;
  else if (o.k === "gate") { const open = clamp((26 - z * -1) / 16, 0, 1); /* z is negative ahead */ U.doors.forEach((d, i) => { d.position.x = (i ? 1 : -1) * (3.9 + 0.2 * (1 - open)); d.scale.y = 1 - 0.25 * (1 - open); }); U.portal.material.opacity = 0.22 + 0.12 * Math.sin(g.t * 3); }
}

/* ---------- pickups ---------- */
const PCOL = { magnet: 0xe84a4a, shield: 0x3fa0ff, rocket: 0xff7a2a, speed: 0xffd23a, heart: 0xff4d6d, mult: 0x9b59ff };
const PICO = { magnet: "🧲", shield: "🛡️", rocket: "🚀", speed: "⚡", heart: "❤️", mult: "x2" };
function makePick(type, glow, symCache) {
  const G = new THREE.Group();
  if (type === "chest") {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.75), mt(0x8a5a22)); body.position.y = 0.4; body.castShadow = true; G.add(body);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.1, 10, 1, false, 0, Math.PI), mt(0x9a6a2a)); lid.rotation.z = Math.PI / 2; lid.rotation.y = Math.PI / 2; lid.position.y = 0.7; lid.scale.set(1, 1, 1); G.add(lid);
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.12, 0.78), mt(0xffcf2e)); band.position.y = 0.62; G.add(band);
    if (glow) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 12, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.22, depthWrite: false, fog: false, side: THREE.DoubleSide })); b.position.y = 6; G.add(b); }
    return G;
  }
  const bub = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), bend(new THREE.MeshLambertMaterial({ color: PCOL[type], emissive: PCOL[type], emissiveIntensity: 0.5 }))); bub.position.y = 1.1; G.add(bub);
  const key = type; if (!symCache.has(key)) symCache.set(key, symTexture(PICO[type], null));
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: symCache.get(key), transparent: true, depthWrite: false })); sp.position.y = 1.1; sp.scale.set(0.95, 0.95, 1); G.add(sp);
  return G;
}

/* ---------- runner (procedural skeleton: hips, knees, ankles, shoulders, elbows) ---------- */
function buildRunner(ch, cos, ghost) {
  const mats = [];
  const M = (c, rough) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: rough || 0.8, metalness: 0 }); if (ghost) { m.transparent = true; m.opacity = 0.4; m.emissive = new THREE.Color(0x4fb8ff); m.emissiveIntensity = 0.9; m.depthWrite = false; } bend(m); mats.push(m); return m; };
  const jk = M(cos.jacket || ch.jacket), pn = M(cos.pants || ch.pants), sh = M(cos.shoes || ch.shoes), sk = M(ch.skin), hr = M(ch.hair, 0.9);
  const root = new THREE.Group(), flipG = new THREE.Group(), inner = new THREE.Group();
  root.add(flipG); flipG.position.y = 0.9; flipG.add(inner); inner.position.y = -0.9;
  const hips = new THREE.Group(); hips.position.y = 0.92; inner.add(hips);
  const body = new THREE.Group(); hips.add(body);
  const mesh = (geo, m, par, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = !ghost; par.add(o); return o; };
  const caps = (r, l) => new THREE.CapsuleGeometry(r, l, 4, 8);
  mesh(caps(0.2, 0.34), jk, body, 0, 0.32, 0).scale.z = 0.75;
  mesh(new THREE.SphereGeometry(0.22, 10, 8), pn, hips, 0, 0, 0).scale.set(1.1, 0.7, 0.9);
  const head = new THREE.Group(); head.position.set(0, 0.78, 0); body.add(head);
  mesh(new THREE.SphereGeometry(0.21, 14, 12), sk, head, 0, 0, 0);
  mesh(new THREE.SphereGeometry(0.235, 12, 10), hr, head, 0, 0.035, 0.035).scale.y = 0.95;
  const hs = ch.style; let pony = null;
  if (hs === "messy") for (let i = 0; i < 6; i++) { const c = mesh(new THREE.ConeGeometry(0.07, 0.2, 5), hr, head, Math.cos(i * 1.05) * 0.13, 0.22, Math.sin(i * 1.05) * 0.13); c.rotation.set(Math.sin(i) * 0.4, 0, Math.cos(i) * 0.4); }
  if (hs === "curly") for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; mesh(new THREE.SphereGeometry(0.09, 6, 6), hr, head, Math.cos(a) * 0.19, 0.12 + (i % 2) * 0.07, Math.sin(a) * 0.19 + 0.03); }
  if (hs === "pony") { pony = new THREE.Group(); pony.position.set(0, 0.12, 0.2); head.add(pony); mesh(caps(0.06, 0.22), hr, pony, 0, -0.16, 0.04); }
  if (hs === "bob") mesh(new THREE.BoxGeometry(0.5, 0.34, 0.46), hr, head, 0, -0.04, 0.06);
  const eyeM = M(0x1a1a1a); [-1, 1].forEach((s) => mesh(new THREE.SphereGeometry(0.028, 6, 6), eyeM, head, s * 0.075, 0.02, -0.19));
  if (cos.pack) mesh(new THREE.BoxGeometry(0.38, 0.44, 0.2), M(cos.pack), body, 0, 0.35, 0.22);
  if (cos.acc === "goggles") mesh(new THREE.TorusGeometry(0.215, 0.025, 6, 16), M(0x222222), head, 0, 0.03, 0).rotation.x = Math.PI / 2;
  if (cos.acc === "star") mesh(new THREE.IcosahedronGeometry(0.07, 0), M(0xffd23a), head, 0, 0.27, 0);
  const thigh = [], knee = [], foot = [], arm = [], elbow = [];
  [-1, 1].forEach((s, i) => {
    const t = new THREE.Group(); t.position.set(s * 0.12, 0, 0); hips.add(t); mesh(caps(0.095, 0.3), pn, t, 0, -0.22, 0);
    const k = new THREE.Group(); k.position.y = -0.43; t.add(k); mesh(caps(0.085, 0.3), pn, k, 0, -0.2, 0);
    const f = new THREE.Group(); f.position.y = -0.42; k.add(f); mesh(new THREE.BoxGeometry(0.17, 0.1, 0.31), sh, f, 0, -0.04, -0.05);
    thigh[i] = t; knee[i] = k; foot[i] = f;
    const a = new THREE.Group(); a.position.set(s * 0.29, 0.55, 0); body.add(a); mesh(caps(0.07, 0.2), jk, a, 0, -0.17, 0);
    const e = new THREE.Group(); e.position.y = -0.33; a.add(e); mesh(caps(0.062, 0.18), jk, e, 0, -0.15, 0); mesh(new THREE.SphereGeometry(0.068, 8, 6), sk, e, 0, -0.3, 0);
    arm[i] = a; elbow[i] = e;
  });
  return { root, hips, body, mats, flash: -1, j: { thigh, knee, foot, arm, elbow, pony, flipG } };
}
function poseRunner(R, st) {
  const { thigh, knee, foot, arm, elbow, pony, flipG } = R.j, ph = st.phase;
  let lean = 0.2, hy = 0.92, tw = 0, bodyX = null, rootX = 0;
  if (st.mode === "run") {
    for (let i = 0; i < 2; i++) {
      const p = ph + i * Math.PI, sn = Math.sin(p), cs = Math.cos(p);
      thigh[i].rotation.x = 0.95 * sn + 0.12; knee[i].rotation.x = -(0.14 + 1.1 * Math.max(0, cs)); foot[i].rotation.x = 0.35 * sn;
      arm[i].rotation.x = -0.9 * sn; arm[i].rotation.z = (i ? -1 : 1) * 0.12; elbow[i].rotation.x = 1.3 + 0.3 * Math.sin(p + 0.6);
    }
    lean = 0.2 + 0.14 * st.dashN; hy = 0.92 + 0.05 * Math.cos(2 * ph); tw = 0.14 * Math.sin(ph);
  } else if (st.mode === "jump") {
    thigh[0].rotation.x = 1.0; knee[0].rotation.x = -1.0; foot[0].rotation.x = 0.2; thigh[1].rotation.x = -0.3; knee[1].rotation.x = -0.4; foot[1].rotation.x = -0.3;
    arm[0].rotation.x = 2.6; arm[1].rotation.x = 2.2; arm[0].rotation.z = 0.2; arm[1].rotation.z = -0.2; elbow[0].rotation.x = 0.25; elbow[1].rotation.x = 0.25; lean = 0.1; hy = 0.95;
  } else if (st.mode === "slide") {
    for (let i = 0; i < 2; i++) { thigh[i].rotation.x = 1.2; knee[i].rotation.x = -0.25; foot[i].rotation.x = 0.4; arm[i].rotation.x = 0.9; arm[i].rotation.z = (i ? -1 : 1) * 0.15; elbow[i].rotation.x = 0.4; }
    bodyX = 1.25; hy = 0.4;
  } else if (st.mode === "fall") {
    const w = Math.sin(st.t * 22);
    for (let i = 0; i < 2; i++) { thigh[i].rotation.x = w * (i ? -1 : 1) * 0.9; knee[i].rotation.x = -0.4; arm[i].rotation.x = 2.5 + w * 0.3 * (i ? -1 : 1); elbow[i].rotation.x = 0.3; arm[i].rotation.z = (i ? -1 : 1) * 0.3; }
    lean = 0.1;
  } else if (st.mode === "dead") {
    for (let i = 0; i < 2; i++) { thigh[i].rotation.x = 0.2; knee[i].rotation.x = -0.2; arm[i].rotation.x = 0.6; arm[i].rotation.z = (i ? -1 : 1) * 0.5; elbow[i].rotation.x = 0.3; }
    rootX = -Math.min(1.35, st.deadT * 2.8); hy = 0.6; lean = 0;
  } else {
    for (let i = 0; i < 2; i++) { thigh[i].rotation.x = 0.05; knee[i].rotation.x = -0.1; foot[i].rotation.x = 0; arm[i].rotation.x = 0.1; arm[i].rotation.z = (i ? -1 : 1) * 0.1; elbow[i].rotation.x = 0.3; }
    hy = 0.92 + 0.012 * Math.sin(st.t * 3);
  }
  if (st.hit && st.mode !== "dead") { hy -= 0.06; tw += 0.3 * Math.sin(st.t * 38); }
  R.hips.position.y = hy; R.body.rotation.x = bodyX !== null ? bodyX : -lean; R.body.rotation.y = tw;
  if (pony) pony.rotation.x = 0.4 + 0.3 * Math.sin(ph * 2 + 1);
  flipG.rotation.x = -st.flipA;
  R.root.rotation.x = rootX; R.root.rotation.z = -st.roll * 0.3; R.root.rotation.y = -st.roll * 0.4; R.root.scale.y = 1 - 0.12 * st.landN;
  if (st.flash !== R.flash) { R.flash = st.flash; R.mats.forEach((m) => { if (m.emissive && !R.ghost) { m.emissive.setRGB(st.flash, 0, 0); m.emissiveIntensity = 1; } }); }
}

/* ---------- scene ---------- */
export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(62, 1, 0.1, 320);
  scene.fog = new THREE.Fog(0xcfeeff, 45, 130); scene.background = new THREE.Color(0xcfeeff);
  const hemi = new THREE.HemisphereLight(0xcfeeff, 0x3a6b2a, 0.9); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.1); sun.position.set(14, 26, 8); sun.target.position.set(0, 0, -18); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 90 }); sun.shadow.bias = -0.0006; scene.add(sun, sun.target);
  const skyU = { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(250, 24, 12), new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: "varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: "uniform vec3 top;uniform vec3 bot;varying vec3 vP;void main(){float h=clamp(normalize(vP).y*1.6,0.,1.);gl_FragColor=vec4(mix(bot,top,h),1.);}" }));
  sky.renderOrder = -10; scene.add(sky);
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false })); sunMesh.position.set(70, 85, -230); scene.add(sunMesh);
  const mountMat = new THREE.MeshBasicMaterial({ color: 0x6f8fa0, fog: false });
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(rnd(30, 50), rnd(45, 80), 5), mountMat); m.position.set(-190 + i * 48 + rnd(-10, 10), 15, -235 - rnd(0, 15)); scene.add(m); }

  /* road, ground, river and rails come in 25 m chunks */
  const roadMats = [texPath(), texBridge(), texPath(), texRuin()].map((t) => bend(new THREE.MeshLambertMaterial({ map: t })));
  const grassMat = bend(new THREE.MeshLambertMaterial({ map: texGrass() })), waterTex = texWater(), waterMat = bend(new THREE.MeshLambertMaterial({ map: waterTex, emissive: 0x0a3a66, emissiveIntensity: 0.35 }));
  const deckMat = mt(0x5a3a1e), railMat = mt(0x7a5a32);
  const chunks = [];
  for (let i = 0; i < NCH; i++) {
    const G = new THREE.Group(), road = new THREE.Mesh(new THREE.PlaneGeometry(8.2, CH).rotateX(-Math.PI / 2), roadMats[0]); road.receiveShadow = true; G.add(road);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.3, CH), deckMat); deck.position.y = -0.17; G.add(deck);
    const pl = (m, x, y) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(40, CH).rotateX(-Math.PI / 2), m); o.position.set(x, y, 0); o.receiveShadow = m === grassMat; G.add(o); return o; };
    const gr = [pl(grassMat, -24.1, -0.03), pl(grassMat, 24.1, -0.03)], wa = [pl(waterMat, -24.1, -1.3), pl(waterMat, 24.1, -1.3)];
    const rails = []; [-4.0, 4.0].forEach((x) => [1.05, 0.6].forEach((y) => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, CH), railMat); r.position.set(x, y, 0); G.add(r); rails.push(r); }));
    scene.add(G); chunks.push({ G, road, deck, gr, wa, rails, ci: -999 });
  }
  const postIM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), railMat, 140); postIM.castShadow = true; scene.add(postIM);
  const dummy = new THREE.Object3D(), colObj = new THREE.Color();

  /* vegetation (instanced) */
  const mkIM = (geo, mat, n) => { const im = new THREE.InstancedMesh(geo, mat, n); im.castShadow = true; im.frustumCulled = false; scene.add(im); return im; };
  const trunkIM = mkIM(new THREE.CylinderGeometry(0.22, 0.34, 1, 6), mt(0x6b4423), MAXSC), leafIM = mkIM(new THREE.IcosahedronGeometry(1, 0), mt(0xffffff, 1), MAXSC * 3);
  const bushIM = mkIM(new THREE.IcosahedronGeometry(1, 0), mt(0x3aa352, 1), MAXSC), rockIM = mkIM(new THREE.DodecahedronGeometry(1, 0), mt(0x858a90, 1), MAXSC);
  const pillarIM = mkIM(new THREE.BoxGeometry(1, 1, 1), mt(0x9aa093, 1), MAXSC * 2), mossIM = mkIM(new THREE.BoxGeometry(1, 1, 1), mt(0x4f8f3e), MAXSC);
  const GREENS = [0x2e8b3d, 0x27793a, 0x35a048, 0x1f6b34, 0x4aa84a, 0x3b9a3a];
  const bigPool = { temple: [], falls: [] }, fallsTex = texFalls();
  for (let i = 0; i < 3; i++) {
    const T = new THREE.Group(); [[9, 3, 9, 1.5], [7, 2.4, 7, 4.2], [5, 2.2, 5, 6.5]].forEach((s) => { const b = new THREE.Mesh(new THREE.BoxGeometry(s[0], s[1], s[2]), mt(0x8a9084, 1)); b.position.y = s[3]; b.castShadow = true; T.add(b); const m = new THREE.Mesh(new THREE.BoxGeometry(s[0] + 0.1, 0.25, s[2] + 0.1), mt(0x4f8f3e)); m.position.y = s[3] + s[1] / 2; T.add(m); });
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.3), new THREE.MeshBasicMaterial({ color: 0x66e0ff })); door.position.set(0, 1.4, 4.6); T.add(door); T.visible = false; scene.add(T); bigPool.temple.push(T);
    const F = new THREE.Group(), cl = new THREE.Mesh(new THREE.BoxGeometry(7, 13, 5), mt(0x6b7078, 1)); cl.position.y = 6.5; cl.castShadow = true; F.add(cl);
    const wf = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 12.6), new THREE.MeshBasicMaterial({ map: fallsTex, transparent: true, opacity: 0.85 })); wf.position.set(0, 6.5, 2.55); F.add(wf);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0.7 })); pool.position.set(0, 0.05, 5); F.add(pool); F.visible = false; scene.add(F); bigPool.falls.push(F);
  }

  /* dynamic object pools */
  const pools = {}, active = new Map(), pkPools = {}, pkActive = new Map(), signs = new Map(), symCache = new Map();
  const takeObs = (k) => { const a = pools[k] || (pools[k] = []); const G = a.pop() || makeObs(k); scene.add(G); return G; };
  const freeObs = (k, G) => { scene.remove(G); (pools[k] || (pools[k] = [])).push(G); };
  const coinGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.09, 16).rotateX(Math.PI / 2);
  const coinIM = mkIM(coinGeo, bend(new THREE.MeshLambertMaterial({ color: 0xffcf2e, emissive: 0x6b4a00, emissiveIntensity: 0.6 })), 300);
  const goldIM = mkIM(coinGeo.clone().scale(1.35, 1.35, 1.6), bend(new THREE.MeshLambertMaterial({ color: 0xff9a2a, emissive: 0x7a3a00, emissiveIntensity: 0.7 })), 120);
  const crysIM = mkIM(new THREE.OctahedronGeometry(0.42, 0).scale(1, 1.4, 1), bend(new THREE.MeshLambertMaterial({ color: 0x5ad7ff, emissive: 0x1a78a8, emissiveIntensity: 0.9 })), 60);
  [coinIM, goldIM, crysIM].forEach((im) => { im.castShadow = false; });
  const warnMat = new THREE.MeshBasicMaterial({ color: 0xff3b2a, transparent: true, opacity: 0.4, depthWrite: false, fog: false }), warnMesh = [];
  for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 3.2).rotateX(-Math.PI / 2), warnMat); w.visible = false; w.position.y = 0.06; scene.add(w); warnMesh.push(w); }
  const monkey = new THREE.Group(); { const b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), mt(0x7a4a2a)); b.position.y = 0.4; monkey.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), mt(0x8a5a3a)); h.position.set(0, 0.95, 0.1); monkey.add(h); const f = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), mt(0xe8c9a0)); f.position.set(0, 0.92, 0.3); monkey.add(f); const t = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 6, 12, 4), mt(0x7a4a2a)); t.position.set(0, 0.3, -0.45); monkey.add(t); const v = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4, 4), mt(0x2f6b2f)); v.position.y = 3; monkey.add(v); } monkey.visible = false; scene.add(monkey);
  const cbTex = {}, cbSprites = new Map();

  /* player, ghost and shadow blob */
  const R = { player: null, key: "", ghost: null, gkey: "", gLabel: null, gLabelTxt: "" };
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false })); blob.position.y = 0.04; scene.add(blob);
  const portalBack = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.2, 8, 24), new THREE.MeshBasicMaterial({ color: 0x66e0ff, fog: false })); portalBack.position.set(0, 2.6, 8); scene.add(portalBack);

  /* particles, rain, fireflies */
  const MAXP = 220, pPos = new Float32Array(MAXP * 3), pCol = new Float32Array(MAXP * 3), pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage)); pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage)); pGeo.setDrawRange(0, 0);
  const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.38, vertexColors: true, transparent: true, depthWrite: false, fog: false })); pts.frustumCulled = false; scene.add(pts);
  const colCache = new Map(), colOf = (s) => { let c = colCache.get(s); if (!c) { c = new THREE.Color(s); colCache.set(s, c); } return c; };
  const NR = 260, rainPos = new Float32Array(NR * 6), drops = new Float32Array(NR * 3), rainGeo = new THREE.BufferGeometry();
  for (let i = 0; i < NR; i++) { drops[i * 3] = rnd(-18, 18); drops[i * 3 + 1] = rnd(0, 16); drops[i * 3 + 2] = rnd(-40, 8); }
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3).setUsage(THREE.DynamicDrawUsage));
  const rainMat = new THREE.LineBasicMaterial({ color: 0xb8d4ff, transparent: true, opacity: 0, fog: false }), rain = new THREE.LineSegments(rainGeo, rainMat); rain.frustumCulled = false; scene.add(rain);
  const NF = 70, ffPos = new Float32Array(NF * 3), ffGeo = new THREE.BufferGeometry();
  for (let i = 0; i < NF; i++) { ffPos[i * 3] = (Math.random() < 0.5 ? -1 : 1) * rnd(5, 16); ffPos[i * 3 + 1] = rnd(0.4, 4.5); ffPos[i * 3 + 2] = rnd(-60, 6); }
  ffGeo.setAttribute("position", new THREE.BufferAttribute(ffPos, 3).setUsage(THREE.DynamicDrawUsage));
  const ffMat = new THREE.PointsMaterial({ color: 0xfff08a, size: 0.22, transparent: true, opacity: 0.6, depthWrite: false, fog: false }), ff = new THREE.Points(ffGeo, ffMat); ff.frustumCulled = false; scene.add(ff);

  let W = 400, H = 700, asp = 0.6, curQ = "high", camFov = 0, camX = 0, camY = 4.8;
  const lookV = new THREE.Vector3();

  function applyChunk(ch, ci) {
    ch.ci = ci; const zt = zoneOf(ci * CH + CH / 2), br = zt === 1;
    ch.road.material = roadMats[zt]; ch.deck.visible = br; ch.gr.forEach((m) => { m.visible = !br; }); ch.wa.forEach((m) => { m.visible = br; }); ch.rails.forEach((m) => { m.visible = br; });
  }
  function setRunner(env) {
    const key = env.char.id + JSON.stringify(env.cos);
    if (R.key === key) return;
    if (R.player) { scene.remove(R.player.root); }
    R.player = buildRunner(env.char, env.cos, false); R.key = key; scene.add(R.player.root);
  }
  function setGhost(env) {
    const G = env.ghost, ok = G && G.s && G.s.length >= 80; const key = ok ? env.char.id + "|" + Math.round(G.dist) : "";
    if (R.gkey === key) return;
    if (R.ghost) { scene.remove(R.ghost.root); R.ghost = null; }
    if (R.gLabel) { scene.remove(R.gLabel); if (R.gLabel.material.map) R.gLabel.material.map.dispose(); R.gLabel.material.dispose(); R.gLabel = null; }
    R.gkey = key;
    if (!ok) return;
    R.ghost = buildRunner(env.char, {}, true); R.ghost.ghost = true; scene.add(R.ghost.root);
    const c = document.createElement("canvas"); c.width = 256; c.height = 64; const x = c.getContext("2d"); x.fillStyle = "rgba(10,30,60,.75)"; x.fillRect(0, 0, 256, 64); x.strokeStyle = "#7fd0ff"; x.lineWidth = 4; x.strokeRect(2, 2, 252, 60);
    x.fillStyle = "#bfe8ff"; x.font = "bold 26px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(`BEST ${Math.round(G.dist).toLocaleString()} m`, 128, 33);
    const t = new THREE.CanvasTexture(c); if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    R.gLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); R.gLabel.scale.set(2.8, 0.7, 1); scene.add(R.gLabel);
  }
  function getSign(sg) {
    let G = signs.get(sg); if (G) return G;
    G = new THREE.Group(); const tex = signTexture(sg);
    [-1.9, 1.9].forEach((x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 3.6, 8), mt(0x5a3a1e)); p.position.set(x, 1.8, -0.1); p.castShadow = true; G.add(p); });
    const back = new THREE.Mesh(new THREE.BoxGeometry(5.7, 3.5, 0.14), mt(0x3a2614)); back.position.set(0, 4.0, -0.04); G.add(back);
    const m = bend(new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.05 })), board = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.5), m); board.position.set(0, 4.0, 0.05); G.add(board);
    G.rotation.y = -sg.side * 0.3; G.userData.tex = tex; G.userData.m = m; scene.add(G); signs.set(sg, G); return G;
  }
  function freeSign(sg, G) { scene.remove(G); G.userData.tex.dispose(); G.userData.m.dispose(); G.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); signs.delete(sg); }

  function render(g, env, now) {
    if (!(W > 10 && H > 10)) return;
    const p = g.p, S = env.set, dt = 1 / 60;
    if (curQ !== S.quality) { curQ = S.quality; sun.castShadow = curQ !== "low"; }
    bendU.uCurve.value = g.curve || 0;
    /* palette, fog, light */
    const pal = getPal(g.dist, g.night); let top = pal.top, bot = pal.bot;
    if (g.storm > 0.01) { top = top.map((v, i) => lerp(v, [70, 80, 92][i], g.storm * 0.8)); bot = bot.map((v, i) => lerp(v, [100, 112, 122][i], g.storm * 0.8)); }
    if (g.flash > 0.01) { top = top.map((v) => lerp(v, 255, g.flash * 0.7)); bot = bot.map((v) => lerp(v, 255, g.flash * 0.7)); }
    skyU.top.value.setRGB(top[0] / 255, top[1] / 255, top[2] / 255); skyU.bot.value.setRGB(bot[0] / 255, bot[1] / 255, bot[2] / 255);
    scene.fog.color.setStyle(rgb(bot)); scene.background.setStyle(rgb(bot));
    scene.fog.near = lerp(45, 10, g.fog); scene.fog.far = lerp(lerp(130, 62, g.fog), 100, g.storm);
    const dk = clamp(pal.dark * 2.3, 0, 1); hemi.intensity = lerp(0.95, 0.42, dk) + g.flash * 1.3; hemi.color.setStyle(rgb(top)); hemi.groundColor.setStyle(rgb(pal.gnd));
    sun.intensity = lerp(1.15, 0.3, dk) * (1 - 0.55 * g.storm); sun.color.setStyle(pal.dark > 0.25 ? "rgb(150,180,255)" : "rgb(255,244,214)");
    sunMesh.material.color.setStyle(pal.dark > 0.25 ? "#f4f6ff" : "#fff3b0"); sunMesh.visible = g.storm < 0.6;
    mountMat.color.setStyle(rgb(bot.map((v, i) => lerp(v, [70, 95, 110][i], 0.55))));
    /* camera: behind and above the runner, tilted down toward the road */
    const portrait = asp < 1, fov = clamp(62 + (1 - asp) * 36, 62, 84) - (S.reduced ? 0 : g.zoom * 3) + (p.dash > 0 && !S.reduced ? 6 : 0);
    if (Math.abs(fov - camFov) > 0.05) { camFov = fov; cam.fov = fov; cam.aspect = asp; cam.updateProjectionMatrix(); }
    const tx = p.lane * LANE_W * 0.55, ty = (portrait ? 5.5 : 4.8) + p.y * UN * 0.3;
    camX += (tx - camX) * 0.12; camY += (ty - camY) * 0.15;
    let sx = 0, sy = 0; if (S.shake && !S.reduced && g.shake > 0) { sx = (Math.random() - 0.5) * g.shake * 0.25; sy = (Math.random() - 0.5) * g.shake * 0.25; }
    cam.position.set(camX + sx, camY + sy, portrait ? 9.8 : 7.8); lookV.set(camX * 0.5, 1.0, -14); cam.lookAt(lookV);
    sky.position.copy(cam.position);
    /* road chunks */
    const base = Math.floor((g.dist - CH) / CH);
    for (let k = 0; k < NCH; k++) { const ci = base + k, ch = chunks[((ci % NCH) + NCH) % NCH]; if (ch.ci !== ci) applyChunk(ch, ci); ch.G.position.z = -(ci * CH + CH / 2 - g.dist); }
    waterTex.offset.y = -(now * 0.00004) % 1;
    let np = 0;
    for (let wz = Math.ceil((g.dist - 12) / 2.5) * 2.5; wz < g.dist + ZMAX && np < 69; wz += 2.5) if (zoneOf(wz) === 1) for (let s = -1; s <= 1; s += 2) { dummy.position.set(s * 4.0, 0.6, -(wz - g.dist)); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); postIM.setMatrixAt(np * 2 + (s > 0 ? 1 : 0), dummy.matrix); np++; }
    postIM.count = np * 2 - (np ? 0 : 0); postIM.instanceMatrix.needsUpdate = true;
    /* scenery */
    let nt = 0, nl = 0, nb = 0, nr = 0, nP = 0, nm = 0, nTemple = 0, nFalls = 0;
    const put = (im, i, x, y, z, sx2, sy2, sz2, ry) => { dummy.position.set(x, y, z); dummy.rotation.set(0, ry || 0, 0); dummy.scale.set(sx2, sy2, sz2); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); };
    for (const o of g.sc) {
      const z = -(o.wz - g.dist); if (z > 8 || z < -ZMAX - 8) continue; const x = o.side * (5.2 + (o.off - 2.2) * 2.6), s = o.sc, sd = o.seed;
      if ((o.kind === "tree" || o.kind === "palm") && nt < MAXSC - 1) {
        const pm = o.kind === "palm"; put(trunkIM, nt, x, 2.5 * s, z, pm ? 0.7 : 1, 5 * s, pm ? 0.7 : 1);
        const cols = [GREENS[(sd * 6) | 0], GREENS[(sd * 11) % 6 | 0], GREENS[(sd * 17) % 6 | 0]];
        const ls = pm ? [[0, 5.3, 0, 1.5], [1.1, 5.0, 0.3, 1.0], [-1.1, 5.1, -0.3, 1.0]] : [[0, 5.4, 0, 2.0], [-0.9, 4.4, 0.3, 1.4], [0.9, 4.6, -0.3, 1.5]];
        ls.forEach((l, i) => { if (nl < MAXSC * 3) { put(leafIM, nl, x + l[0] * s, l[1] * s, z + l[2] * s, l[3] * s, l[3] * s * (pm ? 0.5 : 0.85), l[3] * s, sd * 6); colObj.setHex(cols[i]); leafIM.setColorAt(nl, colObj); nl++; } });
        nt++;
      } else if (o.kind === "bush" && nb < MAXSC) { put(bushIM, nb++, x * 0.9, 0.6 * s, z, 1.3 * s, 0.8 * s, 1.3 * s, sd * 6); }
      else if (o.kind === "rock" && nr < MAXSC) { put(rockIM, nr++, x * 0.9, 0.5 * s, z, 1.2 * s, 0.8 * s, 1.0 * s, sd * 6); }
      else if (o.kind === "ruin" && nP < MAXSC * 2 - 1) { put(pillarIM, nP++, x, 1.5 * s, z, 0.9, 3 * s, 0.9); put(pillarIM, nP++, x, 3.1 * s, z, 1.3, 0.25, 1.3); if (nm < MAXSC) put(mossIM, nm++, x, 3.25 * s, z, 1.32, 0.08, 1.32); }
      else if (o.kind === "temple" && nTemple < 3) { const T = bigPool.temple[nTemple++]; T.visible = true; T.position.set(o.side * 17, 0, z); T.rotation.y = -o.side * 0.5; }
      else if (o.kind === "falls" && nFalls < 3) { const F = bigPool.falls[nFalls++]; F.visible = true; F.position.set(o.side * 15, 0, z); F.rotation.y = -o.side * 0.5; }
    }
    for (let i = nTemple; i < 3; i++) bigPool.temple[i].visible = false; for (let i = nFalls; i < 3; i++) bigPool.falls[i].visible = false;
    fallsTex.offset.y = -(now * 0.0006) % 1;
    trunkIM.count = nt; leafIM.count = nl; bushIM.count = nb; rockIM.count = nr; pillarIM.count = nP; mossIM.count = nm;
    [trunkIM, bushIM, rockIM, pillarIM, mossIM].forEach((im) => { im.instanceMatrix.needsUpdate = true; }); leafIM.instanceMatrix.needsUpdate = true; if (leafIM.instanceColor) leafIM.instanceColor.needsUpdate = true;
    /* obstacles */
    const seen = new Set();
    for (const o of g.obs) {
      const z = -(o.wz - g.dist); if (z > 10 || z < -ZMAX - 8) continue;
      let G = active.get(o); if (!G) { G = takeObs(o.k); active.set(o, G); }
      seen.add(o); animObs(G, o, z, g);
      if (S.cb && !o.deco && o.t !== "pit") {
        let sp = cbSprites.get(o); if (!sp) { const sym = { low: "▲", high: "▼", wall: "■" }[o.t]; if (!cbTex[sym]) cbTex[sym] = symTexture(sym, "#222"); sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cbTex[sym], transparent: true, depthTest: false })); sp.scale.set(0.9, 0.9, 1); scene.add(sp); cbSprites.set(o, sp); }
        sp.position.set(o.lane * LANE_W, o.t === "wall" ? 3.1 : 2.3, z); sp.visible = true;
      }
    }
    for (const [o, G] of active) if (!seen.has(o)) { freeObs(o.k, G); active.delete(o); }
    for (const [o, sp] of cbSprites) if (!seen.has(o) || !S.cb) { scene.remove(sp); sp.material.dispose(); cbSprites.delete(o); }
    /* coins */
    let nc = 0, ng = 0, nx = 0;
    for (const c of g.cn) {
      const z = -(c.wz - g.dist); if (z > 6 || z < -ZMAX - 5) continue;
      dummy.position.set(c.lane * LANE_W, c.h * UN, z); dummy.rotation.set(0, g.t * 4 + c.wz, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
      if (c.type === "x") { if (nx < 60) crysIM.setMatrixAt(nx++, dummy.matrix); } else if (c.type === "g") { if (ng < 120) goldIM.setMatrixAt(ng++, dummy.matrix); } else if (nc < 300) coinIM.setMatrixAt(nc++, dummy.matrix);
    }
    coinIM.count = nc; goldIM.count = ng; crysIM.count = nx; [coinIM, goldIM, crysIM].forEach((im) => { im.instanceMatrix.needsUpdate = true; });
    /* pickups */
    const pseen = new Set();
    for (const k of g.pk) {
      const z = -(k.wz - g.dist); if (z > 6 || z < -ZMAX - 5) continue;
      let G = pkActive.get(k); if (!G) { const pool = pkPools[k.type + (k.glow ? "g" : "")] || (pkPools[k.type + (k.glow ? "g" : "")] = []); G = pool.pop() || makePick(k.type, k.glow, symCache); G.userData.pk = k.type + (k.glow ? "g" : ""); scene.add(G); pkActive.set(k, G); }
      pseen.add(k); G.position.set(k.lane * LANE_W, Math.sin(g.t * 3 + k.wz) * 0.12, z); G.rotation.y = k.type === "chest" ? 0 : g.t * 2;
    }
    for (const [k, G] of pkActive) if (!pseen.has(k)) { scene.remove(G); (pkPools[G.userData.pk] || (pkPools[G.userData.pk] = [])).push(G); pkActive.delete(k); }
    /* signs */
    const sseen = new Set();
    for (const sg of g.sg) { const z = -(sg.wz - g.dist); if (z > 14 || z < -ZMAX - 5) continue; const G = getSign(sg); sseen.add(sg); G.position.set(sg.side * 7.4, 0, z); }
    for (const [sg, G] of signs) if (!sseen.has(sg)) freeSign(sg, G);
    /* warnings and monkey */
    warnMesh.forEach((w, i) => { const wn = g.warn[i]; if (!wn) { w.visible = false; return; } w.visible = true; const z = wn.rel ? -wn.rel : -(wn.wz - g.dist); w.position.set(wn.lane * LANE_W, 0.06, z); });
    warnMat.opacity = 0.25 + 0.25 * Math.abs(Math.sin(now / 90));
    if (g.monkey) { monkey.visible = true; monkey.position.set(g.monkey.lane * LANE_W, 1.6 + Math.sin(g.t * 6) * 0.15, -(g.monkey.wz - g.dist)); monkey.rotation.z = Math.sin(g.t * 5) * 0.2; } else monkey.visible = false;
    /* player */
    setRunner(env); setGhost(env);
    const dead = g.dead > 0, mode = dead ? (g.deadKind === "fall" ? "fall" : "dead") : p.slide > 0 ? "slide" : p.y > 0.03 ? "jump" : "run";
    const pr = R.player, roll = clamp(p.tl - p.lane, -1, 1);
    pr.root.position.set(p.lane * LANE_W, p.y * UN - (g.deadKind === "fall" ? g.dead * 5 : 0), 0);
    pr.root.visible = !(p.inv > 0 && !dead && Math.floor(g.t * 14) % 2 === 1);
    poseRunner(pr, { mode, phase: p.phase, t: g.t, dashN: p.dash > 0 ? 1 : 0, flipA: p.flip > 0 ? (1 - p.flip / 0.55) * Math.PI * 2 : 0, roll, landN: p.land / 0.15, hit: p.inv > 0.8 && g.lives < 3, flash: p.inv > 0.8 && g.lives < 3 ? clamp((p.inv - 0.8) / 0.4, 0, 1) : 0, deadT: g.dead });
    blob.position.x = p.lane * LANE_W; blob.scale.setScalar(clamp(1 - p.y * 0.3, 0.5, 1)); blob.visible = !(dead && g.deadKind === "fall");
    portalBack.position.z = 8 + g.dist; portalBack.visible = g.dist < 20; portalBack.rotation.z = now / 600;
    if (R.ghost) {
      const gh = g.gh, z = gh ? -(gh.d - g.dist) : 99;
      if (gh && z < 4 && z > -ZMAX) {
        R.ghost.root.visible = true; R.ghost.root.position.set(gh.lane * LANE_W, gh.y * UN, z);
        poseRunner(R.ghost, { mode: gh.end ? "idle" : gh.slide ? "slide" : gh.y > 0.03 ? "jump" : "run", phase: now * 0.012, t: g.t, dashN: 0, flipA: 0, roll: 0, landN: 0, hit: false, flash: 0, deadT: 0 });
        R.gLabel.visible = true; R.gLabel.position.set(gh.lane * LANE_W, 2.8 + gh.y * UN, z);
      } else { R.ghost.root.visible = false; R.gLabel.visible = false; }
    }
    /* particles */
    const n = Math.min(MAXP, g.parts.length);
    for (let i = 0; i < n; i++) { const q = g.parts[i], c = colOf(q.col); pPos[i * 3] = q.x; pPos[i * 3 + 1] = q.y; pPos[i * 3 + 2] = q.z; pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b; }
    pGeo.setDrawRange(0, n); pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
    /* rain (jungle storm) and fireflies */
    rainMat.opacity = 0.55 * g.storm; rain.visible = g.storm > 0.05;
    if (rain.visible) for (let i = 0; i < NR; i++) {
      drops[i * 3 + 1] -= 0.75; if (drops[i * 3 + 1] < 0) { drops[i * 3 + 1] = 16; drops[i * 3] = rnd(-18, 18); drops[i * 3 + 2] = rnd(-40, 8); }
      const x = drops[i * 3] + camX, y = drops[i * 3 + 1], z = drops[i * 3 + 2];
      rainPos[i * 6] = x; rainPos[i * 6 + 1] = y; rainPos[i * 6 + 2] = z; rainPos[i * 6 + 3] = x + 0.12 + g.wind * 0.4; rainPos[i * 6 + 4] = y - 1.1; rainPos[i * 6 + 5] = z;
    }
    if (rain.visible) rainGeo.attributes.position.needsUpdate = true;
    ffMat.opacity = clamp(0.25 + pal.dark * 1.6 + g.night * 0.5, 0, 0.9) * (1 - g.storm); ff.visible = ffMat.opacity > 0.05;
    if (ff.visible) { for (let i = 0; i < NF; i++) { ffPos[i * 3 + 2] += g.speed * dt * 0.5 + 0.02; ffPos[i * 3 + 1] += Math.sin(now / 700 + i) * 0.004; if (ffPos[i * 3 + 2] > 8) ffPos[i * 3 + 2] = -60; } ffGeo.attributes.position.needsUpdate = true; }
    renderer.render(scene, cam);
  }
  return {
    resize(w, h, dpr) { W = w; H = h; asp = w / h; renderer.setPixelRatio(curQ === "low" ? 1 : dpr); renderer.setSize(w, h, false); cam.aspect = asp; camFov = 0; },
    render,
    dispose() {
      active.clear(); pkActive.clear();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        ms.forEach((m) => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); });
        if (o.dispose && o.isInstancedMesh) o.dispose();
      });
      Object.values(cbTex).forEach((t) => t.dispose()); symCache.forEach((t) => t.dispose()); matC.clear(); pGeo.dispose(); rainGeo.dispose(); ffGeo.dispose();
      renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss();
    },
  };
}

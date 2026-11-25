import { useState, useEffect, useRef, useCallback } from "react";
import "./OneMoreRun.css";
import { createScene } from "./OneMoreRunScene";

/* ONE MORE RUN: Jungle Edition for Game Station.
   Canvas runner + DOM menus. No extra dependencies. Saves to localStorage. */

const KEY = "gamestation.onemorerun.v1", GKEY = "gamestation.onemorerun.v1.ghost";
const ZMAX = 125;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const fmt = (n) => Math.floor(n).toLocaleString();
const uid = () => Math.random().toString(36).slice(2, 8);
const safeName = (r) => {
  const s = String(r || "").normalize("NFKC").replace(/[^\p{L}\p{N} _'-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 12).trim();
  return s || "Runner";
};

/* ---------------- data ---------------- */
const CHARS = [
  { id: "alex", name: "Alex", tag: "Balanced explorer", price: 0, hair: "#5a3a22", jacket: "#2f6fe0", pants: "#1b1b22", shoes: "#f5f5f5", skin: "#f1c9a0", style: "messy" },
  { id: "mia", name: "Mia", tag: "Agile explorer", price: 0, hair: "#f08a2c", jacket: "#1fb5a3", pants: "#2c3e5a", shoes: "#ff7eb6", skin: "#e8b48a", style: "pony" },
  { id: "max", name: "Max", tag: "Trickster", price: 1500, hair: "#16141a", jacket: "#d6322f", pants: "#222230", shoes: "#111111", skin: "#9b6a45", style: "curly" },
  { id: "zoe", name: "Zoe", tag: "Fearless", price: 2500, hair: "#8a4bd6", jacket: "#7a3fc9", pants: "#3b2f5e", shoes: "#ffffff", skin: "#d9a47a", style: "bob" },
  { id: "leo", name: "Leo", tag: "Nature explorer", price: 3500, hair: "#4a2f1f", jacket: "#3f8f3f", pants: "#8a6d3b", shoes: "#7a4f2a", skin: "#e8b48a", style: "short" },
  { id: "nova", name: "Nova", tag: "Speed", price: 5000, hair: "#111111", jacket: "#2a7de1", pants: "#1d2f6b", shoes: "#39ff88", skin: "#8d5a3b", style: "pony" },
];
const SHOP = [
  { id: "ninja", cat: "outfit", name: "Ninja outfit", price: 2000, c: { jacket: "#1b1b1f", pants: "#2b2b33", shoes: "#c91f2e" } },
  { id: "astro", cat: "outfit", name: "Astronaut outfit", price: 3000, c: { jacket: "#eef1f7", pants: "#d9deea", shoes: "#9aa4b8" } },
  { id: "jungle", cat: "outfit", name: "Jungle explorer", price: 1500, c: { jacket: "#c2a15a", pants: "#7a6b3f", shoes: "#5a4326" } },
  { id: "winter", cat: "outfit", name: "Winter outfit", price: 1800, c: { jacket: "#5aa9ff", pants: "#e8f2ff", shoes: "#2d3b66" } },
  { id: "royal", cat: "outfit", name: "Royal outfit", price: null, c: { jacket: "#6a2fc0", pants: "#2a1a5e", shoes: "#ffd23a" } },
  { id: "golden", cat: "outfit", name: "Golden skin", price: null, c: { jacket: "#f2c230", pants: "#c99a12", shoes: "#fff2a8" } },
  { id: "lightning", cat: "shoes", name: "Lightning shoes", price: 1000, c: { shoes: "#ffe14a" } },
  { id: "gpack", cat: "pack", name: "Golden backpack", price: 1200, c: { pack: "#e9b400" } },
  { id: "gpk", cat: "pack", name: "Trail backpack", price: 600, c: { pack: "#3c8a4a" } },
  { id: "goggles", cat: "acc", name: "Goggles", price: 700, c: { acc: "goggles" } },
  { id: "star", cat: "acc", name: "Star headband", price: 900, c: { acc: "star" } },
  { id: "fire", cat: "trail", name: "Fire trail", price: 800, c: { trail: ["#ff7a1a", "#ffd23a"] } },
  { id: "rainbow", cat: "trail", name: "Rainbow trail", price: 1500, c: { trail: ["#ff4d4d", "#ffd23a", "#4dff88", "#4da6ff", "#b04dff"] } },
  { id: "bolt", cat: "trail", name: "Lightning trail", price: 2000, c: { trail: ["#7fe9ff", "#ffffff"] } },
];
const CATS = [["outfit", "Outfits"], ["shoes", "Shoes"], ["pack", "Backpacks"], ["acc", "Accessories"], ["trail", "Trails"]];
const UPG = [
  { id: "magnet", name: "Magnet", icon: "🧲", eff: (l) => `${6 + 2 * l} m pull range` },
  { id: "shield", name: "Shield", icon: "🛡️", eff: (l) => `${(6 + 1.5 * l).toFixed(1)} s duration` },
  { id: "energy", name: "Energy", icon: "⚡", eff: (l) => (l ? `Dash ${(0.35 + 0.07 * l).toFixed(2)} s, cooldown ${(7 - 0.5 * l).toFixed(1)} s${l >= 3 ? ", double jump" : ""}` : "Dash locked") },
  { id: "lucky", name: "Lucky", icon: "🍀", eff: (l) => `${6 + 2 * l}% chest chance per row` },
  { id: "recovery", name: "Recovery", icon: "💚", eff: (l) => `${(1.2 + 0.1 * l).toFixed(1)} s safe time after a hit` },
];
const UCOST = [500, 1000, 2000, 3500, 5000];
const WORLDS = [
  { id: "jungle", name: "Wild Jungle", icon: "🌴", bg: "linear-gradient(135deg,#1c7a45,#8fd35b)", need: "Available from the start", obs: "Rocks, logs, barricades, swinging beams, ruin walls, pits, rolling boulders, funny fruit" },
  { id: "lava", name: "Lava Land", icon: "🌋", bg: "linear-gradient(135deg,#7a1c10,#ff7a2a)", need: "Complete the Jungle missions and pay 2,000 coins", obs: "Lava rivers, falling rocks, fire traps, burning bridges" },
  { id: "frost", name: "Frost Peak", icon: "🏔️", bg: "linear-gradient(135deg,#2a6fb0,#bfe6ff)", need: "Complete the Lava Land missions", obs: "Ice, frozen rivers, snowstorms, slippery roads" },
  { id: "neon", name: "Neon City", icon: "🌆", bg: "linear-gradient(135deg,#2a0f5e,#e23bff)", need: "Complete the Frost Peak challenge", obs: "Traffic, robots, lasers, moving trains" },
  { id: "sky", name: "Sky Islands", icon: "☁️", bg: "linear-gradient(135deg,#3a8fe0,#e6f6ff)", need: "Defeat the Neon City boss", obs: "Floating islands, wind, broken bridges, flying obstacles" },
];
const MODES = [["Endless Run", true], ["Treasure Hunt", false], ["Chase Mode", false], ["Missions", false]];
const ACH = [
  { id: "first", name: "First Run", desc: "Finish a run", reward: 100, test: (n) => n.stats.runs >= 1 },
  { id: "coin1k", name: "Coin Hunter", desc: "Collect 1,000 coins", reward: 200, test: (n) => n.stats.coins >= 1000 },
  { id: "fearless", name: "Fearless", desc: "Dodge 10 obstacles", reward: 150, test: (n) => n.stats.dodges >= 10 },
  { id: "speed", name: "Speed Demon", desc: "Reach 2,000 metres", reward: 400, test: (n) => n.best.dist >= 2000 },
  { id: "chest", name: "Treasure Master", desc: "Find 10 chests", reward: 300, test: (n) => n.stats.chests >= 10 },
  { id: "legend", name: "Jungle Legend", desc: "Reach 5,000 metres in the Jungle", reward: 1000, test: (n) => n.best.dist >= 5000 },
  { id: "perfect", name: "Perfect Runner", desc: "100 perfect dodges", reward: 500, test: (n) => n.stats.perfect >= 100 },
  { id: "survivor", name: "Survivor", desc: "Survive 5 minutes in one run", reward: 600, test: (n) => n.stats.bestTime >= 300 },
];
const MPOOL = [
  { k: "coins", g: [40, 80, 120], t: (n) => `Collect ${n} coins` },
  { k: "dist", g: [500, 1000, 1500], t: (n) => `Travel ${fmt(n)} metres` },
  { k: "perfect", g: [3, 5, 8], t: (n) => `Perform ${n} perfect dodges` },
  { k: "jumps", g: [10, 20, 30], t: (n) => `Jump ${n} times` },
  { k: "slides", g: [8, 15, 22], t: (n) => `Slide ${n} times` },
  { k: "power", g: [1, 2, 3], t: (n) => (n === 1 ? "Collect a power-up" : `Collect ${n} power-ups`) },
  { k: "combo", g: [3, 5, 7], t: (n) => `Reach a x${n} combo` },
  { k: "chest", g: [1, 1, 2], t: (n) => (n === 1 ? "Find a treasure chest" : `Find ${n} treasure chests`) },
  { k: "flips", g: [3, 5, 8], t: (n) => `Perform ${n} flips (jump again in mid-air)` },
  { k: "clean", g: [300, 600, 1000], t: (n) => `Run ${fmt(n)} metres without damage` },
  { k: "rift", g: [1, 1, 2], t: (n) => (n === 1 ? "Take a Rift path" : `Take ${n} Rift paths`) },
];
const mText = (m) => (MPOOL.find((x) => x.k === m.k) || MPOOL[0]).t(m.goal);
function newMission(exclude) {
  const pool = MPOOL.filter((x) => !(exclude || []).includes(x.k));
  const d = pick(pool.length ? pool : MPOOL), tier = Math.floor(Math.random() * 3);
  return { id: uid(), k: d.k, goal: d.g[tier], reward: { coins: 100 + tier * 100, xp: 40 + tier * 30 } };
}
function ensureMissions(list) {
  const out = (Array.isArray(list) ? list : []).filter((m) => m && MPOOL.some((x) => x.k === m.k) && typeof m.goal === "number" && m.reward && typeof m.id === "string").slice(0, 3);
  while (out.length < 3) out.push(newMission(out.map((m) => m.k)));
  return out;
}

/* ---------------- quotes ({n} = player name) ---------------- */
const Q = {
  welcome: [["WELCOME, {n}!", "Your adventure starts here."]],
  funny: [
    ["{n}, ARE YOU RUNNING OR ARE YOU LATE?", "Asking for a friend."], ["YOUR LEGS CALLED", "They want a break."],
    ["{n}, DID YOU FORGET THE WAY HOME?", "Too late. Keep going!"], ["EVEN THE ROCKS ARE FASTER THAN YOU!", "Prove them wrong, {n}."],
    ["YOU CAN STOP RUNNING", "Oh wait... you can't!"], ["{n} VS GRAVITY: ROUND 17", "Fight!"], ["NICE SHOES", "Let's see if they can survive."],
  ],
  motivational: [
    ["ONE MORE STEP, {n}.", "Then one more after that."], ["YOUR BEST RUN IS STILL AHEAD", "Keep it going."], ["SMALL STEPS. BIG DISTANCES.", "You've got this, {n}."],
    ["DON'T STOP NOW", "The jungle believes in you."], ["YOU ARE FASTER THAN YESTERDAY", "Prove it, {n}."], ["KEEP GOING.", "The next milestone is yours, {n}."],
  ],
  challenge: [["CAN YOU GO HIT-FREE?", "Try it, {n}."], ["PERFECT DODGES PAY", "Chain them for a huge combo."], ["{n}, FIVE DODGES IN A ROW?", "Bet you can."], ["FASTER FROM HERE", "Stay sharp, {n}."]],
  coin: [["{n}, THE COINS ARE CALLING!", "Don't leave them behind!"], ["COINS AHEAD", "Grab every shiny one."], ["SHINY THINGS THIS WAY", "Left, right, jump!"]],
  milestone: [["{n} IS UNSTOPPABLE", "Another milestone down."]],
  achievement: [["{n}, YOU'RE BECOMING UNSTOPPABLE!", "Few runners get this far."], ["LEGS OF STEEL", "That's what they'll call you."]],
  record: [["NEW RECORD, {n}!", "Nobody has run this far. Ever."], ["PERSONAL BEST BROKEN!", "Look at you go, {n}."]],
  neardeath: [["DANGER AHEAD", "Stay sharp, {n}!"], ["ONE HEART LEFT, {n}!", "Make it count."], ["TRICKY STRETCH", "Eyes up, {n}."]],
  gameover: [["{n}, ONE MORE RUN?", "Your record is waiting."], ["THE JUNGLE WINS THIS ROUND", "But {n} will be back."], ["SO CLOSE, {n}!", "The next run is the one."]],
  shortcut: [["SHORTCUT THIS WAY", "Brave runners get coins, {n}."]],
};
const QH = {
  funny: [["COINS COLLECT KARNA", "Hawa nahi, {n}!"], ["{n} BHAI, RUKNA MAT", "Jungle tumhara hai!"]],
  coin: [["{n}, SIKKE BULA RAHE HAIN!", "Chhodna mat!"]],
  motivational: [["EK AUR STEP, {n}", "Record door nahi hai."]],
  gameover: [["{n}, EK AUR RUN?", "Record ka intezaar hai."]],
};
function quote(g, cat, env) {
  const pool = [...(Q[cat] || Q.funny), ...(env.set.lang === "hi" ? QH[cat] || [] : [])];
  let used = g.used[cat] || (g.used[cat] = []);
  let free = pool.filter((q) => !used.includes(q[0]));
  if (!free.length) { used.length = 0; free = pool; }
  const q = pick(free); used.push(q[0]);
  return { title: q[0].replace(/\{n\}/g, env.name.toUpperCase()), sub: q[1].replace(/\{n\}/g, env.name) };
}
const BASE_SIGNS = [
  { at: 12, type: "WELCOME", cat: "welcome" }, { at: 250, type: "FUNNY", cat: "funny" }, { at: 400, type: "DANGER", cat: "neardeath" },
  { at: 500, type: "MOTIVATION", cat: "motivational" }, { at: 750, type: "TREASURE", cat: "coin" }, { at: 1000, type: "MILESTONE", cat: "milestone" },
  { at: 1250, type: "SHORTCUT", cat: "shortcut" }, { at: 1500, type: "CHALLENGE", cat: "challenge" }, { at: 2000, type: "ACHIEVEMENT", cat: "achievement" },
  { at: 2500, type: "FUNNY", cat: "funny" }, { at: 3000, type: "MILESTONE", cat: "milestone" },
];
const CYCLE = [["FUNNY", "funny"], ["MOTIVATION", "motivational"], ["TREASURE", "coin"], ["CHALLENGE", "challenge"], ["MILESTONE", "milestone"]];
function planAt(i) {
  if (i < BASE_SIGNS.length) return BASE_SIGNS[i];
  const j = i - BASE_SIGNS.length, c = CYCLE[j % 5];
  return { at: 3500 + j * 500, type: c[0], cat: c[1] };
}

/* ---------------- save ---------------- */
const DEF = {
  name: "", named: false, char: "alex", chars: ["alex", "mia"], coins: 0, xp: 0,
  upg: { magnet: 0, shield: 0, energy: 0, lucky: 0, recovery: 0 }, missions: [], missionsDone: 0, ach: {}, owned: {},
  equip: { outfit: "", shoes: "", pack: "", acc: "", trail: "" }, best: { dist: 0, combo: 0, coins: 0 },
  stats: { runs: 0, dist: 0, jumps: 0, slides: 0, dodges: 0, perfect: 0, chests: 0, time: 0, coins: 0, bestTime: 0 },
  invite: { code: "", count: 0, claimed: {} },
  set: { music: 0.5, sfx: 0.7, vibe: true, controls: "both", sens: 1, quality: "high", fps: 60, shake: true, reduced: false, cb: false, lang: "en" },
};
function merge(d, s) {
  if (Array.isArray(d)) return Array.isArray(s) ? s : d;
  if (d && typeof d === "object") {
    if (!Object.keys(d).length) return s && typeof s === "object" && !Array.isArray(s) ? s : {};
    const o = {};
    for (const k in d) o[k] = merge(d[k], s && typeof s === "object" ? s[k] : undefined);
    return o;
  }
  return typeof s === typeof d && (typeof d !== "number" || Number.isFinite(s)) ? s : d;
}
function loadSave() {
  let raw = null;
  try {
  scene = createScene(canvas);
} catch (e) {
  console.error("ONE MORE RUN INITIALIZATION ERROR:", e);
  console.error("Canvas:", canvas);
  console.error("Canvas dimensions:", canvas?.width, canvas?.height);

  setErr(
    `3D Initialization Failed: ${e?.message || "Unknown error"}`
  );

  return undefined;
}
  const s = merge(DEF, raw);
  s.name = s.name ? safeName(s.name) : "";
  s.chars = [...new Set(["alex", "mia", ...s.chars.filter((c) => CHARS.some((x) => x.id === c))])];
  if (!s.chars.includes(s.char)) s.char = "alex";
  s.missions = ensureMissions(s.missions);
  s.coins = Math.max(0, Math.floor(s.coins));
  return s;
}
function loadGhost() {
  try { const g = JSON.parse(localStorage.getItem(GKEY)); if (g && Array.isArray(g.s) && g.s.length >= 80 && g.s.every((v) => Number.isFinite(v)) && Number.isFinite(g.dist)) return g; } catch (e) { /* ignore */ }
  return null;
}
function cosFor(s) {
  const o = {};
  Object.values(s.equip).forEach((id) => { const it = SHOP.find((x) => x.id === id); if (it) Object.assign(o, it.c); });
  return o;
}
function applyRun(s, run) {
  const n = JSON.parse(JSON.stringify(s)), dist = Math.floor(run.dist);
  const record = dist > n.best.dist && dist >= 50;
  n.coins += run.coins + run.bonusCoins; n.xp += run.xp;
  const st = n.stats, c = run.cnt;
  st.runs++; st.dist += dist; st.jumps += c.jumps; st.slides += c.slides; st.dodges += c.dodges; st.perfect += c.perfect; st.chests += c.chests;
  st.coins += run.coins; st.time += run.t; st.bestTime = Math.max(st.bestTime, run.t);
  n.best.dist = Math.max(n.best.dist, dist); n.best.combo = Math.max(n.best.combo, run.bestCombo); n.best.coins = Math.max(n.best.coins, run.coins);
  const doneIds = run.missions.filter((m) => m.done).map((m) => m.id);
  n.missionsDone += doneIds.length;
  n.missions = ensureMissions(n.missions.filter((m) => !doneIds.includes(m.id)));
  const newAch = [];
  ACH.forEach((a) => { if (!n.ach[a.id] && a.test(n)) { n.ach[a.id] = true; n.coins += a.reward; newAch.push(a); } });
  return { next: n, newAch, record, dist };
}

/* ---------------- audio ---------------- */
function makeAudio() {
  let c = null, mv = 0.5, sv = 0.7, timer = 0, i = 0;
  const ctx = () => {
    if (!c) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; try { c = new A(); } catch (e) { return null; } }
    if (c.state === "suspended") c.resume().catch(() => {});
    return c;
  };
  const tone = (f, d, ty, vol, to, dl, bus) => {
    const a = ctx(); if (!a) return;
    const v = (bus ? mv : sv) * vol; if (v < 0.002) return;
    const t = a.currentTime + (dl || 0), o = a.createOscillator(), g = a.createGain();
    o.type = ty || "sine"; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.05);
  };
  const arp = (fs, d, ty, v, gap) => fs.forEach((f, k) => tone(f, d, ty, v, 0, k * gap));
  const S = {
    coin: () => { tone(988, 0.08, "square", 0.1); tone(1319, 0.14, "square", 0.1, 0, 0.07); }, jump: () => tone(300, 0.18, "sine", 0.2, 700),
    slide: () => tone(500, 0.25, "sawtooth", 0.08, 120), dash: () => tone(200, 0.3, "sawtooth", 0.1, 900), shield: () => arp([523, 784], 0.18, "triangle", 0.2, 0.1),
    hit: () => tone(150, 0.3, "square", 0.2, 50), near: () => tone(900, 0.25, "sine", 0.18, 1500), combo: () => tone(660, 0.1, "triangle", 0.15, 990),
    treasure: () => arp([523, 659, 784, 1047], 0.15, "triangle", 0.18, 0.08), mission: () => arp([523, 659, 784], 0.2, "sine", 0.2, 0.1),
    unlock: () => arp([392, 523, 659, 784, 1047], 0.18, "triangle", 0.2, 0.07), over: () => arp([400, 300, 220, 150], 0.25, "triangle", 0.2, 0.14),
    lane: () => tone(420, 0.06, "sine", 0.06), step: () => tone(90 + Math.random() * 40, 0.05, "triangle", 0.07, 50), land: () => tone(110, 0.12, "sine", 0.2, 60), thunder: () => tone(70, 0.9, "sawtooth", 0.18, 30), pick: () => tone(700, 0.2, "triangle", 0.2, 1200),
  };
  const N = [262, 294, 330, 392, 440, 524, 440, 392];
  return {
    sfx: (n) => { if (S[n]) S[n](); }, vol: (m, s) => { mv = m; sv = s; }, unlock: ctx,
    music: (on) => {
      clearInterval(timer); timer = 0;
      if (on) timer = setInterval(() => {
        if (mv < 0.01 || !c || c.state !== "running") return;
        i++; if (Math.random() < 0.05) tone(2200 + Math.random() * 1000, 0.08, "sine", 0.05, 0, 0, 1); tone(N[i % 8] * (i % 32 < 16 ? 1 : 1.25), 0.22, "triangle", 0.07, 0, 0, 1);
        if (i % 4 === 0) tone(N[(i >> 2) % 4] / 2, 0.4, "sine", 0.09, 0, 0, 1);
      }, 240);
    },
    close: () => { clearInterval(timer); if (c) { c.close().catch(() => {}); c = null; } },
  };
}

/* ---------------- drawing helpers ---------------- */
function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function circ(c, x, y, r, f) { c.fillStyle = f; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, 7); c.fill(); }

function drawRunner(c, x, y, h, ch, st) {
  const u = h / 10.6, t = st.t || 0, front = st.front, k = st.cos || {};
  const jk = k.jacket || ch.jacket, pn = k.pants || ch.pants, sh = k.shoes || ch.shoes;
  const run = st.run && !st.air, sw = run ? Math.sin(t * 15) : 0, bob = run ? Math.abs(Math.cos(t * 15)) * 0.3 * u : Math.sin(t * 3) * 0.12 * u;
  c.save(); c.translate(x, y);
  if (st.fall) c.rotate(st.fall * 1.3);
  if (st.slide) c.scale(1.12, 0.6);
  if (st.hit) c.rotate(Math.sin(t * 38) * 0.1);
  c.translate(0, -bob);
  [[-0.9, 1], [0.9, -1]].forEach(([dx, ph]) => {
    c.save(); c.translate(dx * u, -4.1 * u); c.rotate(st.air ? (dx < 0 ? -0.55 : 0.45) : sw * ph * 0.75);
    c.fillStyle = pn; rr(c, -0.7 * u, 0, 1.4 * u, 3.4 * u, 0.6 * u); c.fill();
    c.fillStyle = sh; rr(c, -0.95 * u, 3 * u, 1.9 * u, 1.1 * u, 0.5 * u); c.fill(); c.restore();
  });
  const pack = () => { c.fillStyle = k.pack; rr(c, -1.8 * u, -7.4 * u, 3.6 * u, 3.4 * u, 0.8 * u); c.fill(); };
  if (front && k.pack) pack();
  c.fillStyle = jk; rr(c, -2 * u, -7.7 * u, 4 * u, 3.8 * u, 1.2 * u); c.fill();
  if (!front && k.pack) pack();
  [-1, 1].forEach((s) => {
    c.save(); c.translate(s * 2.1 * u, -7.2 * u); c.rotate(st.air ? -s * 2.6 : sw * s * 0.8);
    c.fillStyle = jk; rr(c, -0.55 * u, 0, 1.1 * u, 2.7 * u, 0.5 * u); c.fill(); circ(c, 0, 2.8 * u, 0.6 * u, ch.skin); c.restore();
  });
  const hy = -8.95 * u;
  if (ch.style === "pony") {
    if (front) circ(c, 1.9 * u + Math.sin(t * 4) * 0.2 * u, hy + 0.2 * u, 0.75 * u, ch.hair);
    else { c.fillStyle = ch.hair; c.beginPath(); c.ellipse(Math.sin(t * 10) * 0.4 * u, hy + 1.9 * u, 0.7 * u, 1.5 * u, 0, 0, 7); c.fill(); }
  }
  if (ch.style === "bob" && !front) { c.fillStyle = ch.hair; rr(c, -1.9 * u, hy - 1.8 * u, 3.8 * u, 3.5 * u, 1.4 * u); c.fill(); }
  if (front) {
    circ(c, 0, hy - 0.15 * u, 1.7 * u, ch.hair);
    c.fillStyle = ch.skin; c.beginPath(); c.ellipse(0, hy + 0.25 * u, 1.35 * u, 1.3 * u, 0, 0, 7); c.fill();
    if (ch.style === "bob") { c.fillStyle = ch.hair; rr(c, -1.85 * u, hy - 0.4 * u, 0.7 * u, 2.1 * u, 0.3 * u); c.fill(); rr(c, 1.15 * u, hy - 0.4 * u, 0.7 * u, 2.1 * u, 0.3 * u); c.fill(); }
    const ex = st.expr || "happy", big = ex === "shocked" || ex === "scared" ? 0.42 : 0.34;
    [-1, 1].forEach((s) => {
      if (ex === "tired") { c.strokeStyle = "#2a1a10"; c.lineWidth = 0.16 * u; c.beginPath(); c.moveTo(s * 0.55 * u - 0.3 * u, hy + 0.2 * u); c.lineTo(s * 0.55 * u + 0.3 * u, hy + 0.2 * u); c.stroke(); }
      else { circ(c, s * 0.55 * u, hy + 0.2 * u, big * u, "#fff"); circ(c, s * 0.55 * u, hy + 0.22 * u, 0.18 * u, "#2a1a10"); }
    });
    c.strokeStyle = "#2a1a10"; c.lineWidth = 0.18 * u; c.beginPath();
    if (ex === "shocked") circ(c, 0, hy + 0.85 * u, 0.28 * u, "#7a2230");
    else if (ex === "scared") { c.moveTo(-0.4 * u, hy + 0.95 * u); c.lineTo(-0.15 * u, hy + 0.8 * u); c.lineTo(0.15 * u, hy + 0.95 * u); c.lineTo(0.4 * u, hy + 0.8 * u); c.stroke(); }
    else if (ex === "excited") { c.fillStyle = "#7a2230"; c.arc(0, hy + 0.7 * u, 0.5 * u, 0, Math.PI); c.fill(); }
    else if (ex === "tired") { c.moveTo(-0.35 * u, hy + 0.9 * u); c.lineTo(0.35 * u, hy + 0.9 * u); c.stroke(); }
    else { c.arc(0, hy + 0.6 * u, 0.5 * u, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
  } else {
    circ(c, 0, hy, 1.65 * u, ch.hair);
    if (ch.style === "messy") { c.fillStyle = ch.hair; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 0.65 * u - 0.4 * u, hy - 1.2 * u); c.lineTo(i * 0.65 * u, hy - 2.2 * u - (i % 2 ? 0 : 0.3 * u)); c.lineTo(i * 0.65 * u + 0.4 * u, hy - 1.2 * u); c.fill(); } }
    if (ch.style === "curly") for (let i = 0; i < 6; i++) { const a = Math.PI + (i / 5) * Math.PI; circ(c, Math.cos(a) * 1.5 * u, hy + Math.sin(a) * 1.4 * u, 0.7 * u, ch.hair); }
  }
  if (k.acc === "goggles") { c.fillStyle = "#222"; rr(c, -1.75 * u, hy - 0.45 * u, 3.5 * u, 0.5 * u, 0.2 * u); c.fill(); if (front) [-1, 1].forEach((s) => circ(c, s * 0.55 * u, hy + 0.2 * u, 0.5 * u, "rgba(90,220,255,.6)")); }
  if (k.acc === "star") { c.font = `${1.8 * u}px sans-serif`; c.textAlign = "center"; c.fillStyle = "#ffd23a"; c.fillText("★", 0, hy - 1.7 * u); }
  c.restore();
}

/* ---------------- game engine: pure logic. World units are metres; sz = metres ahead of the player ---------------- */
const LANE_W = 2.2, UN = 1.6;
const KD = {
  rock: { t: "low", h: 0.55 }, log: { t: "low", h: 0.5 }, barricade: { t: "low", h: 0.6 }, melon: { t: "low", h: 0.55 }, mushroom: { t: "low", h: 0.6 },
  barrel: { t: "low", h: 0.7 }, duck: { t: "low", h: 0.45 }, banana: { t: "low", h: 0.4 }, chicken: { t: "low", h: 0.55 }, spikes: { t: "low", h: 0.45 },
  boar: { t: "low", h: 0.7 }, ftree: { t: "low", h: 0.7 }, beam: { t: "high", h: 0 }, wall: { t: "wall", h: 1.6 }, boulder: { t: "wall", h: 1.6 }, pit: { t: "pit", h: 0 },
  thicket: { t: "deco", h: 0 }, gate: { t: "deco", h: 0 }, cave: { t: "deco", h: 0 },
};
const PW = { magnet: ["🧲", "#e84a4a", "Coin Magnet"], shield: ["🛡️", "#3fa0ff", "Shield"], rocket: ["🚀", "#ff7a2a", "Rocket Boost"], speed: ["⚡", "#ffd23a", "Speed Boost"], heart: ["❤️", "#ff4d6d", "Heart"], mult: ["x2", "#9b59ff", "Coin x2"] };
const CV = { c: 1, g: 5, x: 20 };
const CCOL = { c: "#ffd23a", g: "#ff9a2a", x: "#5ad7ff" };

function newGame(env) {
  return {
    t: 0, dist: 0, speed: 14, lives: 3, coins: 0, bonusCoins: 0, xp: 0, score: 0, combo: 0, bestCombo: 0, over: false, paused: false, banked: false, dead: 0, deadKind: "",
    p: { lane: 0, tl: 0, prevLane: 0, laneT: 9, y: 0, vy: 0, jc: 0, slide: 0, slideQ: false, inv: 0, dash: 0, dashCd: 0, held: false, land: 0, flip: 0, phase: 0 },
    pw: { magnet: 0, shield: 0, rocket: 0, speed: 0, mult: 0 }, pwMax: { magnet: 8, shield: 8, rocket: 4.5, speed: 5, mult: 10 },
    obs: [], cn: [], pk: [], sc: [], sg: [], parts: [], warn: [], monkey: null, rift: null, riftNext: 600,
    nextRow: 30, nextScen: 0, signIdx: 0, used: {}, cnt: { jumps: 0, slides: 0, dodges: 0, perfect: 0, chests: 0, power: 0, flips: 0, rifts: 0, crystals: 0 },
    missions: env.missions.map((m) => ({ ...m, prog: 0, done: false })), shake: 0, zoom: 0, slow: 0, msg: null, event: null, nextEvent: 700, rainT: 0,
    wind: 0, windT: 2, flash: 0, flashT: 3, treasureUntil: 0, recShown: false, nearShown: false, night: 0, storm: 0, fog: 0, curve: 0, hudT: 0, trailT: 0,
    noHit: 0, rec: [], recT: 0, gh: null, ghost: env.ghost, cap: null, stepSeg: 0,
  };
}
function say(g, txt, col) { g.msg = { txt, col: col || "#fff", t: 1.3 }; }
function burst(g, x, y, z, col, n, sp) {
  for (let i = 0; i < n && g.parts.length < 180; i++) {
    const a = Math.random() * 6.28, b = Math.random() * 3.14;
    g.parts.push({ x, y, z, vx: Math.cos(a) * Math.sin(b) * sp, vy: Math.abs(Math.cos(b)) * sp * 0.8 + 1, vz: Math.sin(a) * Math.sin(b) * sp, life: rnd(0.35, 0.8), col });
  }
}
const inRift = (g) => !!g.rift && g.dist > g.rift.start - 1 && g.dist < g.rift.end + 3;
function perform(g, a, env) {
  const p = g.p, up = env.up, au = env.audio;
  if (g.paused || g.over || g.dead) return;
  if (a === "L" || a === "R") {
    const nt = clamp(p.tl + (a === "L" ? -1 : 1), -1, 1);
    if (inRift(g) && nt === 0) return;
    if (nt !== p.tl) { p.prevLane = p.tl; p.tl = nt; p.laneT = 0; au.sfx("lane"); }
  } else if (a === "J") {
    const max = up.energy >= 3 ? 2 : 1;
    if (p.jc < max) { p.vy = p.jc ? 5 : 5.7; p.y = Math.max(p.y, 0.02); p.jc++; p.slide = 0; g.cnt.jumps++; au.sfx("jump"); }
    else if (p.y > 0.3 && p.flip <= 0) { p.flip = 0.55; g.cnt.flips++; g.score += 50; say(g, "FLIP! +50", "#7fe9ff"); au.sfx("combo"); }
  } else if (a === "S") {
    if (p.y > 0.02) { p.vy = -10; p.slideQ = true; } else { p.slide = 0.6; g.cnt.slides++; au.sfx("slide"); }
  } else if (a === "D") {
    if (up.energy >= 1 && p.dashCd <= 0) { const dur = 0.35 + 0.07 * up.energy; p.dash = dur; p.dashCd = 7 - 0.5 * up.energy + dur; g.zoom = 0.6; au.sfx("dash"); }
  }
}
const mk = (lane, k, z) => ({ k, t: KD[k].t, h: KD[k].h, lane, base: lane, wz: z, done: false, mv: null });
const mkDeco = (k, lane, z) => ({ k, t: "deco", deco: true, lane, base: lane, wz: z, done: true, h: 0, mv: null });
const pickKind = (z) => (z > 100 && Math.random() < 0.35 ? pick(["melon", "mushroom", "barrel", "duck", "banana"]) : z > 180 && Math.random() < 0.15 ? "spikes" : pick(["rock", "log", "barricade"]));
const addCoin = (g, lane, wz, h, type) => g.cn.push({ lane, wz, h, type: type || "c", got: false });
const ctype = (z) => { const r = Math.random(); return z > 200 && r < 0.025 ? "x" : r < 0.1 ? "g" : "c"; };

function spawnRow(g, env) {
  const z = g.nextRow, d = clamp(z / 3500, 0, 1), v = Math.min(30, 14 + z * 0.0042), L = [-1, 0, 1];
  if (!g.rift && z >= g.riftNext) startRift(g, z);
  if (g.rift && z >= g.rift.start && z < g.rift.end) { riftRow(g, z); return; }
  const gap = v * (0.98 - 0.22 * d) + 3;
  if (z < 70) { g.nextRow = z + gap; return; }
  const one = () => { const R = Math.random(), l = pick(L); if (z > 140 && R < 0.14) return mk(l, "wall", z); if (z > 160 && R < 0.28) return mk(l, "beam", z); return mk(l, pickKind(z), z); };
  const r = Math.random(), row = []; let extra = 0;
  if (r < 0.45 || z < 160) row.push(one());
  else if (r < 0.74) { const a = pick(L), b = pick(L.filter((l) => l !== a)), o1 = one(), o2 = one(); o1.lane = o1.base = a; o2.lane = o2.base = b; row.push(o1, o2); }
  else if (r < 0.86 && z > 220) { L.slice().sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3)).forEach((l) => row.push(mk(l, "pit", z))); extra = v * 0.55; }
  else if (z > 320) {
    const m = mk(pick(L), Math.random() < 0.5 ? "chicken" : "boulder", z);
    if (m.k === "chicken") { m.mv = "sin"; m.amp = 0.9; m.f = 2.2; m.ph = rnd(0, 6.28); m.base = 0; } else { m.mv = "roll"; m.tgt = clamp(m.base + pick([-1, 1]), -1, 1); }
    row.push(m);
  } else row.push(one());
  g.obs.push(...row);
  const nz = z + gap + extra, room = nz - z, free = L.filter((l) => !row.some((o) => Math.abs(o.base - l) < 0.5 || o.mv === "sin"));
  const lows = row.filter((o) => o.t === "low" && !o.mv);
  if (lows.length && Math.random() < 0.6) { const o = pick(lows); for (let i = -3; i <= 3; i++) addCoin(g, o.base, z + i * 1.5, 0.35 + (1 - (i / 3) ** 2) * 0.95, i === 0 ? ctype(z) : "c"); }
  else if (Math.random() < 0.35) { const la = pick([-1, 0]); for (let i = 0; i < 6; i++) addCoin(g, Math.floor(i / 3) % 2 ? la : la + 1, z + 5 + i * 2.2, 0.35, "c"); }
  else if (free.length) { const lane = pick(free), n = Math.min(7, Math.floor((room - 8) / 1.9)); for (let i = 0; i < n; i++) addCoin(g, lane, z + 5 + i * 1.9, 0.35, i === 3 ? ctype(z) : "c"); }
  if (z < g.treasureUntil && free.length > 1) { const lane = free[1]; for (let i = 0; i < 5; i++) addCoin(g, lane, z + 6 + i * 1.9, 0.35, "c"); }
  if (z > 100 && Math.random() < 0.075) {
    const t = g.lives < 3 && Math.random() < 0.35 ? "heart" : pick(["magnet", "shield", "rocket", "speed", "mult", "shield"]);
    g.pk.push({ type: t, lane: pick(L), wz: z + room * 0.55, got: false });
  }
  if (z > 90 && Math.random() < 0.06 + 0.02 * env.up.lucky) g.pk.push({ type: "chest", lane: pick(L), wz: z + room * 0.75, got: false });
  g.nextRow = nz;
}
/* Rift choice: a real fork. The middle lane is walled off, left is the safe route, right is the risky route with better rewards. */
function startRift(g, z) {
  const kind = Math.random() < 0.5 ? "bridge" : "cave", start = z + 60, end = start + 96;
  g.rift = { kind, start, end, chosen: null, chest: false, done: false };
  g.riftNext = end + rnd(900, 1200);
  g.sg.push({ wz: z + 12, side: 1, type: "RIFT", title: "RIFT AHEAD!", sub: kind === "bridge" ? "Left: safe bridge. Right: broken bridge, more coins." : "Left: jungle road. Right: hidden cave, treasure." });
  g.obs.push(mkDeco("gate", 0, start - 2), mkDeco("gate", 0, end));
  say(g, "RIFT AHEAD: CHOOSE A SIDE", "#b79bff");
}
function riftRow(g, z) {
  const r = g.rift, idx = Math.round((z - r.start) / 6), first = z < r.start + 8, last = z > r.end - 14;
  g.obs.push(mkDeco("thicket", 0, z + 3));
  if (r.kind === "cave" && !first) g.obs.push(mkDeco("cave", 1, z + 3));
  if (!first && !last) {
    addCoin(g, -1, z + 1, 0.35, "c"); addCoin(g, -1, z + 3, 0.35, "c"); addCoin(g, -1, z + 5, 0.35, Math.random() < 0.2 ? "g" : "c");
    if (idx % 4 === 0) {
      const k = Math.random();
      if (r.kind === "bridge") {
        g.obs.push(mk(1, k < 0.55 ? "pit" : "beam", z + 3));
        if (k < 0.55) for (let i = -3; i <= 3; i++) addCoin(g, 1, z + 3 + i * 1.2, 0.4 + (1 - (i / 3) ** 2) * 1.0, i === 0 && Math.random() < 0.5 ? "x" : "g");
      } else {
        if (k < 0.45) g.obs.push(mk(1, pick(["rock", "spikes", "barricade"]), z + 3));
        for (let i = 0; i < 4; i++) addCoin(g, 1, z + i * 1.5, 0.4, "g");
      }
    } else for (let i = 0; i < 3; i++) addCoin(g, 1, z + i * 2, 0.4, "g");
  }
  if (last && !r.chest) { r.chest = true; g.pk.push({ type: "chest", lane: 1, wz: z + 4, got: false }); }
  g.nextRow = z + 6;
}
function spawnSign(g, env) {
  const e = planAt(g.signIdx), side = g.signIdx % 2 ? 1 : -1; g.signIdx++;
  let q = quote(g, e.cat, env);
  if (e.type === "MILESTONE") {
    if (e.at === 3000) q = { title: "3 KM! SPECIAL MILESTONE", sub: `${env.name} is a jungle runner now.` };
    else q = { title: `${e.at / 1000} KM COMPLETE!`, sub: `${env.name} has reached ${e.at / 1000} kilometres!` };
  }
  if (e.at === 5000) q = { title: "JUNGLE LEGEND UNLOCKED!", sub: `${env.name} conquered the Jungle.` };
  if (e.type === "TREASURE" || e.type === "SHORTCUT") g.treasureUntil = e.at + 260;
  g.sg.push({ wz: e.at, side, type: e.type, ...q });
}
function spawnScen(g) {
  [-1, 1].forEach((s) => {
    const r = Math.random();
    g.sc.push({ wz: g.nextScen + rnd(0, 3), side: s, off: rnd(2.2, 4.4), kind: r < 0.5 ? "tree" : r < 0.64 ? "bush" : r < 0.74 ? "rock" : r < 0.82 ? "ruin" : r < 0.9 ? "palm" : r < 0.95 ? "falls" : "temple", sc: rnd(0.9, 1.4), seed: Math.random() });
  });
  g.nextScen += rnd(5, 9);
}
function die(g, env, kind) {
  if (g.dead) return; g.dead = 0.001; g.deadKind = kind; env.audio.sfx("over"); g.combo = 0;
  if (env.set.vibe && navigator.vibrate) navigator.vibrate(120);
}
function hit(g, env, o) {
  const p = g.p, au = env.audio, X = p.lane * LANE_W;
  if (g.pw.rocket > 0) { o.smash = true; g.score += 50; burst(g, X, 1, -0.5, "#ffb347", 14, 7); g.shake = 0.5; au.sfx("hit"); return; }
  if (p.inv > 0) return;
  if (g.pw.shield > 0) { g.pw.shield = 0; p.inv = 0.7; say(g, "SHIELD!", "#7fd0ff"); burst(g, X, 1, 0, "#7fd0ff", 16, 6); au.sfx("shield"); return; }
  g.lives--; g.combo = 0; g.noHit = 0; p.inv = 1.2 + 0.1 * env.up.recovery; g.shake = 1; au.sfx("hit"); g.zoom = 0.3;
  if (o.t === "wall") { g.speed *= 0.55; g.shake = 1.3; }
  burst(g, X, 1, 0, "#ff5a4a", 12, 6);
  if (env.set.vibe && navigator.vibrate) navigator.vibrate(60);
  if (g.lives <= 0) die(g, env, "hp");
  else if (g.lives === 1 && !g.nearShown) { g.nearShown = true; g.sg.push({ wz: g.dist + 70, side: 1, type: "DANGER", ...quote(g, "neardeath", env) }); }
}
function dodge(g, env, close) {
  g.cnt.dodges++; g.cnt.perfect++; g.combo++; g.bestCombo = Math.max(g.bestCombo, g.combo);
  const pts = g.combo <= 4 ? 100 * 2 ** (g.combo - 1) : 1600 + (g.combo - 4) * 400; g.score += pts;
  if (close) { g.slow = 0.22; g.zoom = 0.5; say(g, `CLOSE CALL! +${pts}`, "#ffd23a"); env.audio.sfx("near"); }
  else if (g.combo > 1) { say(g, `COMBO x${g.combo}  +${pts}`, "#7fffb0"); env.audio.sfx("combo"); }
}
/* Living Jungle events. Every hazard event only picks a lane that is clear of other obstacles and is announced first. */
function startEvent(g, env) {
  const k = pick(["coinrain", "speed", "lowg", "night", "storm", "fog", "boar", "monkey", "ftree", "mystery"]);
  const free = (from, to) => [-1, 0, 1].filter((l) => !g.obs.some((o) => !o.deco && o.wz > from && o.wz < to && Math.abs(o.base - l) < 0.8));
  const dur = { coinrain: 5, speed: 6, lowg: 8, night: 12, storm: 14, fog: 10 }[k];
  if (dur) {
    g.event = { k, t: dur };
    say(g, { coinrain: "COIN RAIN!", speed: "SPEED ZONE!", lowg: "LOW GRAVITY!", night: "NIGHTFALL!", storm: "JUNGLE STORM! WIND AND LIGHTNING", fog: "FOG ROLLS IN" }[k], "#ffe14a");
    return;
  }
  g.nextEvent = g.dist + rnd(500, 800);
  if (k === "boar") {
    const f = free(g.dist + 8, g.dist + 85); if (!f.length) return;
    const lane = pick(f), o = mk(lane, "boar", g.dist + 75); o.vz = 13; g.obs.push(o); g.warn.push({ lane, rel: 24, t: 1.8 }); say(g, "ANGRY BOAR! JUMP OR DODGE", "#ff7a5a"); env.audio.sfx("near");
  } else if (k === "ftree") {
    const f = free(g.dist + 35, g.dist + 75); if (!f.length) return;
    const lane = pick(f), o = mk(lane, "ftree", g.dist + 62); g.obs.push(o); g.warn.push({ lane, wz: o.wz, t: 2.2 }); say(g, "FALLING TREE!", "#ffb347");
  } else if (k === "monkey") {
    const lane = pick([-1, 0, 1]), cs = [];
    for (let i = 0; i < 8; i++) { addCoin(g, lane, g.dist + 55 + i * 2, 0.4, "c"); cs.push(g.cn[g.cn.length - 1]); }
    g.monkey = { cs, t: 0.9, wz: g.dist + 70, lane }; say(g, "A MONKEY IS AFTER THE COINS!", "#ffd23a");
  } else if (k === "mystery") {
    g.pk.push({ type: "chest", lane: pick([-1, 0, 1]), wz: g.dist + 70, got: false, glow: true }); say(g, "MYSTERY TREASURE AHEAD!", "#ffd23a"); env.audio.sfx("treasure");
  }
}
function ghostAt(g) {
  const G = g.ghost; if (!G || !G.s || G.s.length < 80) return null;
  const S = G.s, n = Math.floor(S.length / 4), f = g.t * 10, i = Math.floor(f);
  if (i >= n - 1) { const a = (n - 1) * 4; return { d: S[a] / 10, lane: S[a + 1] / 10, y: S[a + 2] / 10, slide: S[a + 3], end: true }; }
  const a = i * 4, fr = f - i;
  return { d: lerp(S[a], S[a + 4], fr) / 10, lane: lerp(S[a + 1], S[a + 5], fr) / 10, y: lerp(S[a + 2], S[a + 6], fr) / 10, slide: S[a + 3], end: false };
}
function stepGame(g, dt, env) {
  const p = g.p, up = env.up, au = env.audio;
  if (g.slow > 0) { g.slow -= dt; dt *= 0.6; }
  g.t += dt; g.shake = Math.max(0, g.shake - dt * 2.2); g.zoom = Math.max(0, g.zoom - dt * 2); g.flash = Math.max(0, g.flash - dt * 3);
  if (g.msg) { g.msg.t -= dt; if (g.msg.t <= 0) g.msg = null; }
  for (const q of g.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.z += (q.vz + g.speed) * dt; q.vy -= 9 * dt; q.life -= dt; }
  g.parts = g.parts.filter((q) => q.life > 0 && q.y > -0.2);
  g.warn.forEach((w) => { w.t -= dt; }); g.warn = g.warn.filter((w) => w.t > 0);
  if (g.dead) { g.dead += dt; g.speed = Math.max(0, g.speed - dt * 30); g.dist += g.speed * dt; if (g.dead > 1.3) g.over = true; return; }
  const hadRocket = g.pw.rocket > 0;
  for (const k in g.pw) if (g.pw[k] > 0) g.pw[k] = Math.max(0, g.pw[k] - dt);
  if (hadRocket && g.pw.rocket <= 0) p.inv = Math.max(p.inv, 1);
  p.inv = Math.max(0, p.inv - dt); p.dashCd = Math.max(0, p.dashCd - dt); p.dash = Math.max(0, p.dash - dt); p.slide = Math.max(0, p.slide - dt); p.laneT += dt;
  p.land = Math.max(0, p.land - dt); p.flip = Math.max(0, p.flip - dt);
  const base = Math.min(30, 14 + g.dist * 0.0042);
  let mul = 1; if (g.pw.speed > 0) mul *= 1.25; if (g.pw.rocket > 0) mul *= 1.5; if (p.dash > 0) mul *= 1.7; if (g.event && g.event.k === "speed") mul *= 1.2;
  g.speed = lerp(g.speed, base * mul, Math.min(1, dt * 4)); g.dist += g.speed * dt; g.noHit += g.speed * dt;
  g.curve = (Math.sin(g.dist / 220) * 16 + Math.sin(g.dist / 97) * 4) * clamp(g.dist / 150, 0, 1);
  const ev = g.event ? g.event.k : "";
  g.night = lerp(g.night, ev === "night" ? 1 : 0, Math.min(1, dt * 0.8)); g.storm = lerp(g.storm, ev === "storm" ? 1 : 0, Math.min(1, dt * 0.9)); g.fog = lerp(g.fog, ev === "fog" ? 1 : 0, Math.min(1, dt * 0.7));
  if (ev === "storm") {
    g.windT -= dt; if (g.windT <= 0) { g.windT = rnd(2.5, 4); g.wind = pick([-1, 1]); say(g, g.wind > 0 ? "GUST FROM THE LEFT" : "GUST FROM THE RIGHT", "#cfe8ff"); }
    if (g.windT < 1.6) g.wind = 0;
    g.flashT -= dt; if (g.flashT <= 0) { g.flashT = rnd(2.5, 5); g.flash = 1; au.sfx("thunder"); }
  } else g.wind = 0;
  const dl = p.tl - p.lane, dur = (p.y > 0 ? 0.2 : 0.16) * (1 - 0.3 * g.wind * Math.sign(dl));
  if (Math.abs(dl) > 0.001) p.lane += Math.sign(dl) * Math.min(Math.abs(dl), dt / dur);
  if (p.y > 0 || p.vy > 0) {
    const gr = (ev === "lowg" ? 9 : 14) * (p.held && p.vy > 0 ? 0.7 : 1);
    p.vy -= gr * dt; p.y += p.vy * dt;
    if (p.y <= 0) { p.y = 0; p.vy = 0; p.jc = 0; p.land = 0.15; au.sfx("land"); if (p.slideQ) { p.slideQ = false; p.slide = 0.6; g.cnt.slides++; } }
  }
  p.phase += dt * (7.5 + g.speed * 0.26);
  const seg = Math.floor(p.phase / Math.PI); if (seg !== g.stepSeg) { g.stepSeg = seg; if (p.y <= 0 && p.slide <= 0) au.sfx("step"); }
  while (g.nextRow < g.dist + ZMAX) spawnRow(g, env);
  while (g.nextScen < g.dist + ZMAX) spawnScen(g);
  while (planAt(g.signIdx).at <= g.dist + ZMAX) spawnSign(g, env);
  if (!g.recShown && env.best >= 150 && g.dist > env.best) { g.recShown = true; g.sg.push({ wz: g.dist + 60, side: -1, type: "ACHIEVEMENT", ...quote(g, "record", env) }); au.sfx("treasure"); }
  const R = g.rift;
  if (R) {
    if (inRift(g) && Math.abs(p.tl) < 0.5) { p.prevLane = p.tl; p.tl = p.lane < 0 ? -1 : p.lane > 0 ? 1 : pick([-1, 1]); p.laneT = 0; say(g, `THE RIFT PULLS YOU ${p.tl < 0 ? "LEFT" : "RIGHT"}`, "#b79bff"); }
    if (!R.chosen && g.dist >= R.start + 2) { R.chosen = p.tl < 0 ? "safe" : "risky"; g.cnt.rifts++; say(g, R.chosen === "safe" ? "SAFE ROUTE" : "RISKY ROUTE: RARE LOOT", R.chosen === "safe" ? "#7fffb0" : "#ff9a5a"); }
    if (!R.done && g.dist > R.end + 2) { R.done = true; if (R.chosen === "safe") { g.bonusCoins += 30; say(g, "SAFE ROUTE BONUS +30", "#7fffb0"); au.sfx("mission"); } else if (R.chosen) { g.score += 400; say(g, "RISKY ROUTE CLEARED +400", "#ffd23a"); au.sfx("treasure"); } }
    if (g.dist > R.end + 8) g.rift = null;
  }
  if (!g.event && !g.rift && g.dist >= g.nextEvent) { g.nextEvent = g.dist + rnd(700, 1000); startEvent(g, env); }
  if (g.event) {
    g.event.t -= dt;
    if (g.event.k === "coinrain") { g.rainT -= dt; if (g.rainT <= 0) { g.rainT = 0.16; const lane = pick([-1, 0, 1]), wz = g.dist + 55; if (!g.obs.some((o) => Math.abs(o.wz - wz) < 5 && Math.abs(o.base - lane) < 0.8)) addCoin(g, lane, wz, 0.35, "c"); } }
    if (g.event.t <= 0) { g.event = null; g.nextEvent = g.dist + rnd(700, 1000); }
  }
  if (g.monkey) {
    const m = g.monkey; m.t -= dt;
    if (m.t <= 0) {
      m.t = 0.45; const left = m.cs.filter((c) => !c.got);
      if (!left.length) g.monkey = null;
      else { const c = left.reduce((a, b) => (b.wz > a.wz ? b : a)); c.got = true; m.wz = c.wz; m.lane = c.lane; burst(g, c.lane * LANE_W, 1.2, -(c.wz - g.dist), "#8a5a2b", 6, 4); }
    }
    if (g.monkey && m.wz - g.dist < -5) g.monkey = null;
  }
  for (const o of g.obs) {
    const sz = o.wz - g.dist;
    if (o.vz) o.wz -= o.vz * dt;
    if (o.mv === "sin") o.lane = o.base + Math.sin(g.t * o.f + o.ph) * o.amp;
    else if (o.mv === "roll") { const k = clamp(1 - sz / 38, 0, 1); o.lane = lerp(o.base, o.tgt, k * k * (3 - 2 * k)); }
    if (o.k === "ftree" && !o.fell && sz < 32) { o.fell = true; o.fellT = g.t; }
    const psz = o.psz; o.psz = sz;
    if (o.done || o.deco) continue;
    const inWin = Math.abs(sz) < 0.95 || (psz !== undefined && psz > 0.95 && sz < -0.95);
    if (inWin) {
      if (Math.abs(o.lane - p.lane) < 0.62 && (o.k !== "ftree" || o.fell)) {
        const need = (o.t === "low" && p.y < o.h) || (o.t === "high" && p.slide <= 0) || (o.t === "wall" && p.y < 1) || (o.t === "pit" && p.y < 0.08 && g.pw.rocket <= 0);
        if (need) { o.done = true; if (o.t === "pit") die(g, env, "fall"); else hit(g, env, o); }
      }
    } else if (sz < -1) {
      o.done = true; const dl2 = Math.abs(o.lane - p.lane);
      if (o.t === "pit" && g.pw.rocket > 0) continue;
      if (dl2 < 0.62) dodge(g, env, false);
      else if (Math.abs(o.lane - p.prevLane) < 0.62 && p.laneT < 0.8 && dl2 < 1.6) dodge(g, env, true);
    }
  }
  g.obs = g.obs.filter((o) => !o.smash && o.wz - g.dist > -8);
  const mr = g.pw.magnet > 0 ? 6 + 2 * up.magnet : 0;
  for (const c of g.cn) {
    if (c.got) continue; const sz = c.wz - g.dist;
    if (mr && sz < mr && sz > -1 && Math.abs(c.lane - p.lane) <= 2.1) { c.lane += (p.lane - c.lane) * Math.min(1, dt * 9); c.wz += (g.dist - c.wz) * Math.min(1, dt * 5); c.h += (p.y + 0.4 - c.h) * Math.min(1, dt * 6); }
    if (Math.abs(sz) < 1 && Math.abs(c.lane - p.lane) < 0.7 && Math.abs(c.h - (p.y + 0.4)) < 0.85) {
      c.got = true; g.coins += CV[c.type] * (g.pw.mult > 0 ? 2 : 1);
      if (c.type === "x") { g.cnt.crystals++; say(g, "RARE CRYSTAL +20", "#5ad7ff"); au.sfx("treasure"); } else au.sfx("coin");
      burst(g, c.lane * LANE_W, c.h * UN, -sz, CCOL[c.type], 4, 3);
    }
  }
  g.cn = g.cn.filter((c) => !c.got && c.wz - g.dist > -6);
  for (const k of g.pk) {
    if (k.got) continue; const sz = k.wz - g.dist;
    if (Math.abs(sz) < 1 && Math.abs(k.lane - p.lane) < 0.7 && p.y < 1.3) {
      k.got = true;
      if (k.type === "chest") { g.cnt.chests++; const n = Math.floor(rnd(40, 80)); g.coins += n; say(g, `TREASURE! +${n}`, "#ffd23a"); au.sfx("treasure"); burst(g, k.lane * LANE_W, 1, -sz, "#ffd23a", 18, 6); }
      else {
        g.cnt.power++; au.sfx("pick"); burst(g, k.lane * LANE_W, 1, -sz, PW[k.type][1], 10, 5);
        if (k.type === "heart") { if (g.lives < 3) g.lives++; else g.coins += 30; }
        else { const dd = k.type === "shield" ? 6 + 1.5 * up.shield : { magnet: 8, rocket: 4.5, speed: 5, mult: 10 }[k.type]; g.pw[k.type] = dd; g.pwMax[k.type] = dd; }
        say(g, PW[k.type][2].toUpperCase(), PW[k.type][1]);
      }
    }
  }
  g.pk = g.pk.filter((k) => !k.got && k.wz - g.dist > -6);
  g.sg = g.sg.filter((s) => s.wz - g.dist > -12); g.sc = g.sc.filter((s) => s.wz - g.dist > -8);
  const pv = { coins: g.coins, dist: Math.floor(g.dist), perfect: g.cnt.perfect, jumps: g.cnt.jumps, slides: g.cnt.slides, power: g.cnt.power, combo: g.bestCombo, chest: g.cnt.chests, flips: g.cnt.flips, clean: Math.floor(g.noHit), rift: g.cnt.rifts };
  g.missions.forEach((m) => {
    if (m.done) return; m.prog = Math.min(m.goal, pv[m.k] || 0);
    if (m.prog >= m.goal) { m.done = true; g.bonusCoins += m.reward.coins; g.xp += m.reward.xp; say(g, `MISSION COMPLETE +${m.reward.coins}`, "#7fffb0"); au.sfx("mission"); }
  });
  let cap = null;
  for (const s of g.sg) { const z = s.wz - g.dist; if (z > 6 && z < 75 && (!cap || z < cap.z)) cap = { z, s }; }
  g.cap = cap ? { title: cap.s.title, sub: cap.s.sub, a: clamp((75 - cap.z) / 12, 0, 1) * clamp((cap.z - 6) / 6, 0, 1) * 0.95 } : null;
  g.recT += dt;
  if (g.recT >= 0.1) { g.recT -= 0.1; if (g.rec.length < 12000) g.rec.push(Math.round(g.dist * 10), Math.round(p.lane * 10), Math.round(p.y * 10), p.slide > 0 ? 1 : 0); }
  g.gh = ghostAt(g);
  const tr = env.cos.trail; g.trailT -= dt;
  if (tr && g.trailT <= 0 && g.parts.length < 150) { g.trailT = 0.03; g.parts.push({ x: p.lane * LANE_W + rnd(-0.25, 0.25), y: p.y * UN + 0.15, z: 0.4, vx: rnd(-0.4, 0.4), vy: 0.3, vz: 0, life: 0.45, col: pick(tr) }); }
}

/* ---------------- components ---------------- */
function CharPreview({ ch, cos, w = 150, h = 190, still, expr = "happy" }) {
  const ref = useRef(null), key = JSON.stringify(cos || {});
  useEffect(() => {
    const cv = ref.current, c = cv.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = w * dpr; cv.height = h * dpr;
    let raf = 0; const t0 = performance.now();
    const loop = (now) => {
      const t = still ? 0 : (now - t0) / 1000; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      c.fillStyle = "rgba(0,0,0,.22)"; c.beginPath(); c.ellipse(w / 2, h - 14, w * 0.26, 7, 0, 0, 7); c.fill();
      drawRunner(c, w / 2, h - 16, h * 0.84, ch, { t, front: true, expr: !still && Math.floor(t / 2.2) % 3 === 0 ? "excited" : expr, cos: JSON.parse(key) });
      if (!still) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [ch, key, w, h, still, expr]);
  return <canvas ref={ref} className="omr-prev" style={{ width: w, height: h }} role="img" aria-label={`${ch.name}, ${ch.tag}`} />;
}
function Switch({ on, set, label }) {
  return <button type="button" role="switch" aria-checked={on} className={"omr-sw" + (on ? " on" : "")} onClick={() => set(!on)}><span />{label}</button>;
}
function Seg({ value, opts, set }) {
  return <div className="omr-seg">{opts.map(([v, l]) => <button key={v} type="button" className={value === v ? "on" : ""} onClick={() => set(v)}>{l}</button>)}</div>;
}
function Settings({ save, upd, compact, onReset }) {
  const s = save.set, [nm, setNm] = useState(save.name || ""), [conf, setConf] = useState(false), setK = (k, v) => upd((n) => { n.set[k] = v; return n; });
  const row = (l, el) => <div className="omr-row"><label>{l}</label>{el}</div>;
  const rng = (k, mn, mx, st) => <input type="range" min={mn} max={mx} step={st} value={s[k]} onChange={(e) => setK(k, Number(e.target.value))} />;
  return (
    <div className="omr-settings">
      {!compact && row("Runner name", <div className="omr-inl"><input className="omr-in" maxLength={12} value={nm} onChange={(e) => setNm(e.target.value)} /><button className="omr-btn sm" onClick={() => upd((n) => { n.name = safeName(nm); n.named = true; return n; })}>Save</button></div>)}
      {row("Music volume", rng("music", 0, 1, 0.05))}{row("Sound effects volume", rng("sfx", 0, 1, 0.05))}
      {row("Vibration", <Switch on={s.vibe} set={(v) => setK("vibe", v)} label={s.vibe ? "On" : "Off"} />)}
      {row("Controls", <Seg value={s.controls} set={(v) => setK("controls", v)} opts={[["swipe", "Swipe"], ["buttons", "Buttons"], ["both", "Both"]]} />)}
      {row("Swipe sensitivity", rng("sens", 0.5, 1.6, 0.1))}
      {row("Camera shake", <Switch on={s.shake} set={(v) => setK("shake", v)} label={s.shake ? "On" : "Off"} />)}
      {row("Reduced motion", <Switch on={s.reduced} set={(v) => setK("reduced", v)} label={s.reduced ? "On" : "Off"} />)}
      {row("Colour-blind markers", <Switch on={s.cb} set={(v) => setK("cb", v)} label={s.cb ? "On" : "Off"} />)}
      {!compact && <>
        {row("Graphics", <Seg value={s.quality} set={(v) => setK("quality", v)} opts={[["low", "Low"], ["high", "High"]]} />)}
        {row("Frame rate", <Seg value={s.fps} set={(v) => setK("fps", v)} opts={[[30, "30"], [60, "60"]]} />)}
        {row("Language", <Seg value={s.lang} set={(v) => setK("lang", v)} opts={[["en", "English"], ["hi", "Hinglish"]]} />)}
        {row("Progress", conf ? <div className="omr-inl"><button className="omr-btn sm danger" onClick={() => { onReset(); setConf(false); }}>Yes, erase everything</button><button className="omr-btn sm ghost" onClick={() => setConf(false)}>Cancel</button></div> : <button className="omr-btn sm danger" onClick={() => setConf(true)}>Reset progress</button>)}
      </>}
    </div>
  );
}

function Game({ saveRef, ghostRef, audio, commit, onHome, upd }) {
  const stage = useRef(null), cv = useRef(null), gRef = useRef(null);
  const [phase, setPhase] = useState("play"), [hud, setHud] = useState(null), [over, setOver] = useState(null), [pset, setPset] = useState(false), [err, setErr] = useState(""), [, force] = useState(0);
  const mkEnv = useCallback(() => {
    const s = saveRef.current;
    return { set: s.set, up: s.upg, name: safeName(s.name), best: s.best.dist, audio, cos: cosFor(s), char: CHARS.find((c) => c.id === s.char) || CHARS[0], missions: s.missions, ghost: ghostRef.current };
  }, [saveRef, ghostRef, audio]);
  const start = useCallback(() => { gRef.current = newGame(mkEnv()); setPhase("play"); setOver(null); setPset(false); setHud(null); }, [mkEnv]);
  const bank = useCallback(() => {
    const g = gRef.current; if (!g || g.banked) return null;
    if (g.t < 1 && !g.over) { g.banked = true; return null; }
    g.banked = true;
    return commit({ dist: g.dist, coins: g.coins, bonusCoins: g.bonusCoins, xp: Math.floor(g.dist / 10) + g.coins + Math.floor(g.score / 40) + g.xp, cnt: g.cnt, bestCombo: g.bestCombo, t: g.t, missions: g.missions, rec: g.rec });
  }, [commit]);
  const setPause = useCallback((v) => { const g = gRef.current; if (!g || g.over || g.dead) return; g.paused = v; setPhase(v ? "pause" : "play"); if (!v) setPset(false); }, []);
  const act = useCallback((a) => { if (gRef.current) perform(gRef.current, a, mkEnv()); }, [mkEnv]);

  useEffect(() => {
    start();
    const canvas = cv.current, el = stage.current; let scene = null;
    try { scene = createScene(canvas); } catch (e) { setErr("This browser could not start 3D graphics (WebGL). Try another browser or enable hardware acceleration."); return undefined; }
    let raf = 0, last = performance.now();
    const resize = () => { const r = el.getBoundingClientRect(); scene.resize(Math.max(240, r.width), Math.max(240, r.height), Math.min(window.devicePixelRatio || 1, 2)); };
    resize(); const ro = new ResizeObserver(resize); ro.observe(el);
    const frame = (now) => {
      raf = requestAnimationFrame(frame); const env = mkEnv(), g = gRef.current; if (!g) return;
      if (now - last < 1000 / env.set.fps - 2) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!g.paused && !g.over) stepGame(g, dt, env);
      scene.render(g, env, now);
      if (g.over && !g.fin) {
        g.fin = true; const res = bank();
        if (res) {
          const s = saveRef.current, q = quote(g, res.record ? "record" : "gameover", env);
          setOver({ ...res, coins: g.coins, bonus: g.bonusCoins, xp: Math.floor(g.dist / 10) + g.coins + Math.floor(g.score / 40) + g.xp, done: g.missions.filter((m) => m.done).length, bestDist: s.best.dist, bestCombo: s.best.combo, q });
        }
        setPhase("over");
      }
      g.hudT -= dt;
      if (g.hudT <= 0 && !g.over) {
        g.hudT = 0.1;
        setHud({
          lives: g.lives, coins: g.coins, dist: Math.floor(g.dist), combo: g.combo, pw: Object.keys(g.pw).filter((k) => g.pw[k] > 0).map((k) => [k, g.pw[k] / g.pwMax[k]]),
          miss: g.missions.map((m) => ({ t: mText(m), prog: m.prog, goal: m.goal, done: m.done })), dash: env.up.energy ? 1 - clamp(g.p.dashCd / (7 - 0.5 * env.up.energy), 0, 1) : -1,
          msg: g.msg ? { txt: g.msg.txt, col: g.msg.col, t: g.msg.t } : null, cap: g.cap, rival: g.gh ? Math.round(g.dist - g.gh.d) : null, rift: g.rift && g.dist < g.rift.end ? g.rift.kind : "",
        });
      }
    };
    raf = requestAnimationFrame(frame);
    const keys = { ArrowLeft: "L", KeyA: "L", ArrowRight: "R", KeyD: "R", ArrowUp: "J", KeyW: "J", Space: "J", ArrowDown: "S", KeyS: "S", ShiftLeft: "D", ShiftRight: "D" };
    const kd = (e) => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.code === "Escape") { e.preventDefault(); if (!e.repeat && gRef.current) setPause(!gRef.current.paused); return; }
      const a = keys[e.code]; if (!a) return; e.preventDefault(); if (e.repeat) return;
      if (a === "J" && gRef.current) gRef.current.p.held = true; act(a);
    };
    const ku = (e) => { if (keys[e.code] === "J" && gRef.current) gRef.current.p.held = false; };
    const vis = () => { if (document.hidden && gRef.current) setPause(true); };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku); document.addEventListener("visibilitychange", vis);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); document.removeEventListener("visibilitychange", vis); bank(); scene.dispose(); };
  }, [start, mkEnv, bank, setPause, act, saveRef]);

  const sw = useRef(null);
  const pd = (e) => { if (saveRef.current.set.controls === "buttons") return; sw.current = { x: e.clientX, y: e.clientY }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } };
  const pm = (e) => {
    const s = sw.current; if (!s) return; const dx = e.clientX - s.x, dy = e.clientY - s.y, th = 34 / saveRef.current.set.sens;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
    if (Math.abs(dx) > Math.abs(dy)) act(dx < 0 ? "L" : "R"); else act(dy < 0 ? "J" : "S");
    sw.current = { x: e.clientX, y: e.clientY };
  };
  const pu = () => { sw.current = null; };
  const set = saveRef.current.set, showBtn = set.controls !== "swipe";
  const btn = (a, label, cls) => (
    <button type="button" className={"omr-vb " + cls} aria-label={label} onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); if (a === "J" && gRef.current) gRef.current.p.held = true; act(a); }} onPointerUp={() => { if (a === "J" && gRef.current) gRef.current.p.held = false; }} onPointerCancel={() => { if (gRef.current) gRef.current.p.held = false; }}>{label}</button>
  );
  const name = safeName(saveRef.current.name);
  if (err) return <div className="omr-modal"><div className="omr-card"><h2>3D not available</h2><p>{err}</p><button className="omr-btn primary" onClick={onHome}>Back to menu</button></div></div>;
  return (
    <div className="omr-play" ref={stage} onPointerDown={pd} onPointerMove={pm} onPointerUp={pu} onPointerCancel={pu}>
      <canvas ref={cv} className="omr-canvas" />
      {hud && (
        <div className="omr-hud">
          <div className="omr-hud-top">
            <div className="omr-hearts" aria-label={`${hud.lives} hearts`}>{[0, 1, 2].map((i) => <span key={i} className={i < hud.lives ? "on" : ""}>♥</span>)}</div>
            <div className="omr-hud-mid"><b>{fmt(hud.dist)} m</b>{hud.combo > 1 && <i>x{hud.combo} combo</i>}<small>Jungle Rift{hud.rift ? ` · ${hud.rift === "bridge" ? "Left safe / Right broken bridge" : "Left road / Right hidden cave"}` : ""}</small></div>
            <div className="omr-hud-r"><span className="omr-coin-pill">● {fmt(hud.coins)}</span><button type="button" className="omr-pause" aria-label="Pause" onPointerDown={(e) => e.stopPropagation()} onClick={() => setPause(true)}>❚❚</button></div>
          </div>
          <ul className="omr-miss">{hud.miss.map((m, i) => <li key={i} className={m.done ? "done" : ""}><span>{m.t}</span><em>{m.done ? "Done" : `${fmt(m.prog)}/${fmt(m.goal)}`}</em><div style={{ width: `${(m.prog / m.goal) * 100}%` }} /></li>)}</ul>
          {hud.rival != null && <div className="omr-rival">Shadow Rival: you are {hud.rival >= 0 ? `${hud.rival} m ahead` : `${-hud.rival} m behind`}</div>}
          {hud.msg && <div className="omr-msg" style={{ color: hud.msg.col, opacity: clamp(hud.msg.t * 2, 0, 1) }}>{hud.msg.txt}</div>}
          {hud.cap && <div className="omr-cap" style={{ opacity: hud.cap.a }}><b>{hud.cap.title}</b><span>{hud.cap.sub}</span></div>}
          <div className="omr-pws">{hud.pw.map(([k, f]) => <div key={k} className="omr-pw" style={{ "--c": PW[k][1] }}><span>{PW[k][0]}</span><div><i style={{ width: `${f * 100}%` }} /></div></div>)}</div>
          {hud.dash >= 0 && <div className="omr-dashbar" title="Dash (Shift)"><i style={{ width: `${hud.dash * 100}%` }} /></div>}
        </div>
      )}
      {showBtn && phase === "play" && (
        <div className="omr-vbs">
          <div className="omr-vl">{btn("L", "◀", "")}{btn("R", "▶", "")}</div>
          <div className="omr-vr">{hud && hud.dash >= 0 && btn("D", "⚡", "dash")}{btn("S", "▼", "")}{btn("J", "▲", "jump")}</div>
        </div>
      )}
      {phase === "pause" && (
        <div className="omr-modal" role="dialog" aria-label="Paused" onPointerDown={(e) => e.stopPropagation()}>
          <div className="omr-card">
            <h2>Paused</h2>
            {pset ? <><Settings save={saveRef.current} upd={(f) => { upd(f); force((n) => n + 1); }} compact /><button className="omr-btn" onClick={() => setPset(false)}>Back</button></> : (
              <div className="omr-stack">
                <button className="omr-btn primary" autoFocus onClick={() => setPause(false)}>Resume</button>
                <button className="omr-btn" onClick={() => { bank(); start(); }}>Restart run</button>
                <button className="omr-btn" onClick={() => setPset(true)}>Settings</button>
                <button className="omr-btn ghost" onClick={() => { bank(); onHome(); }}>Quit to home</button>
              </div>
            )}
          </div>
        </div>
      )}
      {phase === "over" && over && (
        <div className="omr-modal" role="dialog" aria-label="Game over" onPointerDown={(e) => e.stopPropagation()}>
          <div className="omr-card over">
            {over.record ? <h2 className="rec">NEW RECORD, {name.toUpperCase()}!</h2> : <h2>Run over</h2>}
            <p className="omr-q"><b>{over.q.title}</b><br />{over.q.sub}</p>
            <div className="omr-grid">
              <div><small>Distance</small><b>{fmt(over.dist)} m</b></div><div><small>Coins</small><b>{fmt(over.coins)}{over.bonus ? ` +${fmt(over.bonus)}` : ""}</b></div>
              <div><small>XP</small><b>+{fmt(over.xp)}</b></div><div><small>Missions done</small><b>{over.done} / 3</b></div>
              <div><small>Best distance</small><b>{fmt(over.bestDist)} m</b></div><div><small>Best combo</small><b>x{over.bestCombo}</b></div>
            </div>
            <div className="omr-stack"><button className="omr-btn primary big" autoFocus onClick={start}>Retry</button><button className="omr-btn ghost" onClick={onHome}>Home</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Back({ onClick, title, coins }) {
  return <header className="omr-head"><button className="omr-btn sm ghost" onClick={onClick}>← Back</button><h2>{title}</h2><span className="omr-coin-pill">● {fmt(coins)}</span></header>;
}

export default function OneMoreRun({ onExit }) {
  const [save, setSave] = useState(loadSave), saveRef = useRef(save); saveRef.current = save;
  const [screen, setScreen] = useState(() => (save.named ? "menu" : "name"));
  const [toast, setToast] = useState(null), [nm, setNm] = useState(""), [shopCat, setShopCat] = useState("outfit"), [open, setOpen] = useState("");
  const audioRef = useRef(null); if (!audioRef.current) audioRef.current = makeAudio();
  const audio = audioRef.current;
  const ghostRef = useRef(undefined); if (ghostRef.current === undefined) ghostRef.current = loadGhost();
  const upd = useCallback((fn) => setSave((s) => { const n = fn(JSON.parse(JSON.stringify(s))); saveRef.current = n; return n; }), []);
  const notify = useCallback((m) => setToast({ m, id: Math.random() }), []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* storage full or blocked */ } }, [save]);
  useEffect(() => { audio.vol(save.set.music, save.set.sfx); }, [audio, save.set.music, save.set.sfx]);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(null), 2800); return () => clearTimeout(t); }, [toast]);
  useEffect(() => {
    const un = () => { audio.unlock(); audio.music(true); };
    window.addEventListener("pointerdown", un, { once: true }); window.addEventListener("keydown", un, { once: true });
    return () => { window.removeEventListener("pointerdown", un); window.removeEventListener("keydown", un); audio.close(); };
  }, [audio]);
  const commit = useCallback((run) => {
    const r = applyRun(saveRef.current, run); saveRef.current = r.next; setSave(r.next);
    if (r.record && run.rec && run.rec.length >= 80) { const gh = { dist: r.dist, s: run.rec }; ghostRef.current = gh; try { localStorage.setItem(GKEY, JSON.stringify(gh)); } catch (e) { /* storage full */ } }
    r.newAch.forEach((a) => notify(`Achievement: ${a.name} (+${a.reward} coins)`));
    return { dist: r.dist, record: r.record };
  }, [notify]);
  const name = save.name ? safeName(save.name) : "Runner", ch = CHARS.find((c) => c.id === save.char) || CHARS[0], cos = cosFor(save);
  const go = (s) => { audio.unlock(); setScreen(s); };
  const lang = save.set.lang === "hi";
  const L = { play: lang ? "Khelo" : "Play", characters: lang ? "Characters" : "Characters", worlds: "Worlds", upgrades: "Upgrades", missions: "Missions", shop: "Shop", invite: lang ? "Dost bulao" : "Invite Friends", stats: "Stats", ach: "Achievements", settings: lang ? "Settings" : "Settings" };
  const level = Math.floor(Math.sqrt(save.xp / 100)) + 1;
  const root = "omr" + (save.set.reduced ? " reduced" : "") + (save.set.cb ? " cb" : "");

  let body;
  if (screen === "play") body = <Game saveRef={saveRef} ghostRef={ghostRef} audio={audio} commit={commit} upd={upd} onHome={() => setScreen("menu")} />;
  else if (screen === "name") {
    const saveName = (then) => { upd((n) => { n.name = safeName(nm); n.named = true; return n; }); notify(`Welcome, ${safeName(nm)}!`); if (then) setScreen(then); };
    body = (
      <div className="omr-name">
        <div className="omr-logo sm">ONE MORE RUN</div>
        <CharPreview ch={CHARS[0]} cos={{}} w={140} h={170} />
        <h1>What's your name, Runner?</h1>
        <input className="omr-in big" autoFocus maxLength={12} placeholder="Runner" value={nm} aria-label="Runner name" onChange={(e) => setNm(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveName("menu"); }} />
        <div className="omr-inl"><button className="omr-btn" onClick={() => saveName("menu")}>Save</button><button className="omr-btn primary" onClick={() => saveName("play")}>Start</button></div>
        <small>Up to 12 characters. Leave it empty to be "Runner". You can change it later in Settings.</small>
      </div>
    );
  } else if (screen === "menu") {
    body = (
      <div className="omr-menu">
        <div className="omr-scene" aria-hidden="true">
          <div className="omr-sun" /><div className="omr-cloud c1" /><div className="omr-cloud c2" /><div className="omr-cloud c3" />
          <div className="omr-hill h1" /><div className="omr-hill h2" />
          {["🌴", "🌳", "🌴", "🌳"].map((t, i) => <span key={i} className={"omr-tree t" + i}>{t}</span>)}
          <div className="omr-portal"><i /><i /><i /></div>
          {[...Array(10)].map((_, i) => <b key={i} className="omr-fly" style={{ left: `${8 + i * 9}%`, animationDelay: `${i * 0.7}s` }} />)}
          <div className="omr-ground" />
          <div className="omr-hero"><CharPreview ch={ch} cos={cos} w={170} h={210} still={save.set.reduced} /></div>
        </div>
        <div className="omr-side">
          <div className="omr-top">
            {onExit && <button className="omr-btn sm ghost" onClick={onExit}>← Game Station</button>}
            <span className="omr-lvl">Level {level}</span><span className="omr-coin-pill">● {fmt(save.coins)}</span>
          </div>
          <div className="omr-logo">ONE MORE <em>RUN</em></div>
          <p className="omr-ed">JUNGLE RIFT</p>
          <p className="omr-tag">Run. Risk. Discover. Survive. Repeat.</p>
          <p className="omr-hi">{lang ? `Swagat hai, ${name}!` : `Welcome, ${name}!`}</p>
          <button className="omr-btn primary big" onClick={() => go("play")}>▶ {L.play}</button>
          <div className="omr-mgrid">
            {[["characters", "🧑‍🎤"], ["worlds", "🌍"], ["upgrades", "🔧"], ["missions", "🎯"], ["shop", "🛍️"], ["invite", "🎁"], ["stats", "📊"], ["ach", "🏆"], ["settings", "⚙️"]].map(([k, i]) => <button key={k} className="omr-btn" onClick={() => go(k)}><span aria-hidden="true">{i}</span> {L[k]}</button>)}
          </div>
        </div>
      </div>
    );
  } else if (screen === "characters") {
    body = (
      <div className="omr-page"><Back onClick={() => go("menu")} title="Characters" coins={save.coins} />
        <p className="omr-note">Every runner has identical stats. Pick the look you like.</p>
        <div className="omr-cards">{CHARS.map((c) => {
          const own = save.chars.includes(c.id), sel = save.char === c.id;
          return (
            <div key={c.id} className={"omr-ccard" + (sel ? " sel" : "") + (own ? "" : " locked")}>
              <CharPreview ch={c} cos={sel ? cos : {}} w={120} h={150} still expr={own ? "happy" : "tired"} />
              <h3>{c.name}</h3><p>{c.tag}</p>
              {own ? <button className="omr-btn sm" disabled={sel} onClick={() => upd((n) => { n.char = c.id; return n; })}>{sel ? "Selected" : "Select"}</button>
                : <button className="omr-btn sm primary" disabled={save.coins < c.price} onClick={() => { upd((n) => { n.coins -= c.price; n.chars.push(c.id); n.char = c.id; return n; }); audio.sfx("unlock"); notify(`${c.name} unlocked!`); }}>Unlock ● {fmt(c.price)}</button>}
            </div>
          );
        })}</div>
      </div>
    );
  } else if (screen === "worlds") {
    body = (
      <div className="omr-page"><Back onClick={() => go("menu")} title="Worlds" coins={save.coins} />
        <p className="omr-note">Wild Jungle is fully playable. The other worlds are previews: you can see how they unlock, but they are not playable yet.</p>
        <div className="omr-worlds">{WORLDS.map((w, i) => (
          <div key={w.id} className="omr-world" style={{ background: w.bg }}>
            <div className="omr-wi">{w.icon}</div>
            <div><h3>{w.name}</h3><p>{i === 0 ? "Playing now" : `Locked: ${w.need}`}</p>
              {i > 0 && <button className="omr-btn sm" onClick={() => setOpen(open === w.id ? "" : w.id)}>{open === w.id ? "Hide preview" : "Preview"}</button>}
              {open === w.id && <p className="omr-prev-t">Coming: {w.obs}. Not playable in this version.</p>}
              {i === 0 && <p className="omr-prev-t">{w.obs}</p>}
            </div>
          </div>))}
        </div>
        <h3 className="omr-sub">Game modes</h3>
        <div className="omr-modes">{MODES.map(([m, ok]) => <div key={m} className={ok ? "on" : ""}><b>{m}</b><small>{ok ? "Playable" : "Coming soon"}</small></div>)}</div>
      </div>
    );
  } else if (screen === "upgrades") {
    body = (
      <div className="omr-page"><Back onClick={() => go("menu")} title="Upgrade Lab" coins={save.coins} />
        <p className="omr-note">Upgrades help you, but skill still wins runs.</p>
        <div className="omr-ups">{UPG.map((u) => {
          const l = save.upg[u.id], cost = UCOST[l], max = l >= 5;
          return (
            <div key={u.id} className="omr-up"><span className="ic" aria-hidden="true">{u.icon}</span>
              <div><h3>{u.name} <small>Level {l}/5</small></h3><p>Now: {u.eff(l)}</p>{!max && <p>Next: {u.eff(l + 1)}</p>}
                <div className="omr-pips">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= l ? "on" : ""} />)}</div></div>
              <button className="omr-btn sm primary" disabled={max || save.coins < cost} onClick={() => { upd((n) => { n.coins -= cost; n.upg[u.id]++; return n; }); audio.sfx("unlock"); }}>{max ? "Maxed" : `Upgrade ● ${fmt(cost)}`}</button>
            </div>
          );
        })}</div>
      </div>
    );
  } else if (screen === "missions") {
    body = (
      <div className="omr-page"><Back onClick={() => go("menu")} title="Missions" coins={save.coins} />
        <p className="omr-note">These three missions are active in your next run. Complete one and it is replaced by a new one. Done so far: {save.missionsDone}.</p>
        <div className="omr-list">{save.missions.map((m) => <div key={m.id} className="omr-li"><b>{mText(m)}</b><span>Reward ● {m.reward.coins} + {m.reward.xp} XP</span></div>)}</div>
        <button className="omr-btn primary" onClick={() => go("play")}>▶ Start a run</button>
      </div>
    );
  } else if (screen === "shop") {
    const items = SHOP.filter((i) => i.cat === shopCat);
    body = (
      <div className="omr-page"><Back onClick={() => go("menu")} title="Shop" coins={save.coins} />
        <p className="omr-note">Cosmetics only. They never change how the game plays.</p>
        <Seg value={shopCat} set={setShopCat} opts={CATS} />
        <div className="omr-cards">{items.map((i) => {
          const own = !!save.owned[i.id], eq = save.equip[i.cat] === i.id;
          return (
            <div key={i.id} className={"omr-ccard" + (eq ? " sel" : "")}>
              <CharPreview ch={ch} cos={{ ...Object.assign({}, ...Object.values(save.equip).map((id) => (SHOP.find((x) => x.id === id) || {}).c)), ...i.c }} w={110} h={140} still />
              <h3>{i.name}</h3>
              {own ? <button className="omr-btn sm" onClick={() => upd((n) => { n.equip[i.cat] = eq ? "" : i.id; return n; })}>{eq ? "Unequip" : "Equip"}</button>
                : i.price == null ? <p>Invite reward</p>
                  : <button className="omr-btn sm primary" disabled={save.coins < i.price} onClick={() => { upd((n) => { n.coins -= i.price; n.owned[i.id] = true; n.equip[i.cat] = i.id; return n; }); audio.sfx("unlock"); }}>Buy ● {fmt(i.price)}</button>}
            </div>
          );
        })}</div>
      </div>
    );
  } else if (screen === "invite") {
    if (!save.invite.code) upd((n) => { n.invite.code = `${(safeName(n.name).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "RUNNER")}-${100 + Math.floor(Math.random() * 900)}`; return n; });
    const code = save.invite.code || "...", link = `${typeof location !== "undefined" ? location.origin + location.pathname : ""}?ref=${code}`;
    const TIERS = [[1, "500 coins", (n) => { n.coins += 500; }], [3, "2,000 bonus coins", (n) => { n.coins += 2000; }], [5, "Royal outfit", (n) => { n.owned.royal = true; }], [10, "Golden skin", (n) => { n.owned.golden = true; }]];
    const copy = async (t, msg) => { try { await navigator.clipboard.writeText(t); notify(msg); } catch (e) { notify("Copy failed. Select the text and copy it manually."); } };
    body = (
      <div className="omr-page"><Back onClick={() => go("menu")} title="Invite Friends" coins={save.coins} />
        <div className="omr-card flat">
          <p>Your invite code</p><div className="omr-code">{code}</div>
          <div className="omr-inl"><button className="omr-btn sm" onClick={() => copy(code, "Invite code copied")}>Copy code</button>
            <button className="omr-btn sm primary" onClick={async () => { if (navigator.share) { try { await navigator.share({ title: "ONE MORE RUN", text: `Join me in ONE MORE RUN! Code: ${code}`, url: link }); } catch (e) { /* cancelled */ } } else copy(link, "Invite link copied"); }}>Share invite</button></div>
          <p className="omr-warn">Demo only. Real invites cannot be verified without a backend, so clicking a link never awards anything. The button below only lets you test the reward screen on this device.</p>
          <div className="omr-prog"><i style={{ width: `${Math.min(100, save.invite.count * 10)}%` }} /></div>
          <p>{save.invite.count} / 10 demo invites</p>
          <button className="omr-btn sm" disabled={save.invite.count >= 10} onClick={() => upd((n) => { n.invite.count++; return n; })}>Simulate invite (demo)</button>
        </div>
        <div className="omr-list">{TIERS.map(([n, label, fn]) => {
          const done = save.invite.claimed[n], ok = save.invite.count >= n;
          return <div key={n} className="omr-li"><b>{n} invite{n > 1 ? "s" : ""}</b><span>{label}</span><button className="omr-btn sm" disabled={done || !ok} onClick={() => { upd((s) => { fn(s); s.invite.claimed[n] = true; return s; }); audio.sfx("unlock"); notify(`Demo reward claimed: ${label}`); }}>{done ? "Claimed" : ok ? "Claim (demo)" : "Locked"}</button></div>;
        })}</div>
      </div>
    );
  } else if (screen === "stats") {
    const st = save.stats;
    body = (
      <div className="omr-page"><Back onClick={() => go("menu")} title="Stats" coins={save.coins} />
        <div className="omr-grid">{[["Level", level], ["XP", fmt(save.xp)], ["Runs", st.runs], ["Best distance", `${fmt(save.best.dist)} m`], ["Best combo", `x${save.best.combo}`], ["Total distance", `${fmt(st.dist)} m`], ["Coins collected", fmt(st.coins)], ["Perfect dodges", st.perfect], ["Chests found", st.chests], ["Missions done", save.missionsDone]].map(([a, b]) => <div key={a}><small>{a}</small><b>{b}</b></div>)}</div>
        <h3 className="omr-sub">Achievements</h3>
        <div className="omr-list">{ACH.map((a) => <div key={a.id} className={"omr-li" + (save.ach[a.id] ? " ok" : "")}><b>{save.ach[a.id] ? "✓ " : ""}{a.name}</b><span>{a.desc} · ● {a.reward}</span></div>)}</div>
      </div>
    );
  } else if (screen === "ach") {
    body = (
      <div className="omr-page"><Back onClick={() => go("menu")} title="Achievements" coins={save.coins} />
        <div className="omr-list">{ACH.map((a) => <div key={a.id} className={"omr-li" + (save.ach[a.id] ? " ok" : "")}><b>{save.ach[a.id] ? "✓ " : ""}{a.name}</b><span>{a.desc} · ● {a.reward}</span></div>)}</div>
      </div>
    );
  } else if (screen === "settings") {
    body = (<div className="omr-page"><Back onClick={() => go("menu")} title="Settings" coins={save.coins} /><Settings save={save} upd={upd} onReset={() => { try { localStorage.removeItem(KEY); localStorage.removeItem(GKEY); ghostRef.current = null; } catch (e) { /* ignore */ } const f = loadSave(); saveRef.current = f; setSave(f); setNm(""); setScreen("name"); }} /></div>);
  }
  return (
    <div className={root}>
      {body}
      {toast && <div className="omr-toast" role="status" key={toast.id}>{toast.m}</div>}
    </div>
  );
}

/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './NinjaHillRide.css';

/* =====================================================================
   NINJA HILL RIDE  -  original 2D hill-climb racing game
   Single self-contained React component (canvas + DOM overlay).
   One requestAnimationFrame loop, one keyboard listener set, no deps.
   ===================================================================== */

/* ============================== CONSTANTS ============================== */
const SAVE_KEY = 'ninjaHillRide.save.v2';
const SPAWN_X = 300;          // world x where every run starts
const PX_PER_M = 50;          // world pixels per metre
const LEVEL_LEN = 15000;      // world px per level (300 m)
const MAX_LEVEL = 25;         // difficulty tops out at level 25
const GRAVITY = 1150;
const STEP = 1 / 120;         // fixed physics step
const MAX_PARTICLES = 320;
const MAX_WEATHER = 70;
const COIN_VALUE = 10;
const MAX_UPGRADE = 8;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const smooth01 = (t) => { const c = clamp(t, 0, 1); return c * c * (3 - 2 * c); };
const wrapAngle = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const fmt = (n) => Math.floor(Number.isFinite(n) ? n : 0).toLocaleString('en-US');
const rnd = (a, b) => a + Math.random() * (b - a);

/* ============================== DATA ============================== */
const VEHICLES = [
  { id: 'ninja', name: 'Ninja Bike', kind: 'bike', price: 0, color: '#e63946', accent: '#1d1d2b', desc: 'Light, nimble and easy to flip. The perfect starter.',
    maxSpeed: 760, accel: 820, weight: 0.8, jump: 520, ks: 38, stab: 0.9, fuel: 1.0, wb: 84, r: 19, L0: 12, travel: 30, drive: 'rear', dtq: 1.7, headX: -6, headY: -50, airT: 9.5 },
  { id: 'racer', name: 'Racing Car', kind: 'racer', price: 1000, color: '#ffb703', accent: '#23233a', desc: 'Fast and low with stiff suspension. Thirsty engine.',
    maxSpeed: 980, accel: 960, weight: 1.0, jump: 380, ks: 56, stab: 1.1, fuel: 0.85, wb: 98, r: 18, L0: 10, travel: 26, drive: 'all', dtq: 0.9, headX: -2, headY: -32, roofX: 28, roofY: -30, airT: 8 },
  { id: 'jeep', name: 'Jeep', kind: 'jeep', price: 2500, color: '#4f9d4a', accent: '#2f3b2d', desc: 'Sturdy all-rounder with soft, forgiving suspension.',
    maxSpeed: 740, accel: 780, weight: 1.4, jump: 450, ks: 34, stab: 1.2, fuel: 1.1, wb: 98, r: 23, L0: 14, travel: 34, drive: 'all', dtq: 1.0, headX: -12, headY: -46, roofX: 30, roofY: -44, airT: 8 },
  { id: 'truck', name: 'Truck', kind: 'truck', price: 5000, color: '#3a86ff', accent: '#1b2a49', desc: 'Heavy pickup. Slow to spin, huge fuel tank.',
    maxSpeed: 650, accel: 640, weight: 2.0, jump: 380, ks: 30, stab: 1.3, fuel: 1.5, wb: 114, r: 25, L0: 14, travel: 34, drive: 'all', dtq: 0.8, headX: 14, headY: -34, roofX: 30, roofY: -44, airT: 7 },
  { id: 'monster', name: 'Monster Truck', kind: 'monster', price: 8000, color: '#9b5de5', accent: '#2a1b4a', desc: 'Giant wheels, long travel, crushes small rocks.',
    maxSpeed: 700, accel: 830, weight: 2.4, jump: 540, ks: 22, stab: 1.0, fuel: 1.3, wb: 120, r: 36, L0: 22, travel: 46, drive: 'all', dtq: 0.9, headX: 12, headY: -58, roofX: 28, roofY: -72, airT: 7 },
  { id: 'quad', name: 'Quad Bike', kind: 'quad', price: 6000, color: '#f77f00', accent: '#2d2a32', desc: 'Four-wheel-drive grip and very stable in the air.',
    maxSpeed: 720, accel: 800, weight: 1.1, jump: 480, ks: 30, stab: 1.3, fuel: 1.0, wb: 80, r: 22, L0: 12, travel: 32, drive: 'all', dtq: 1.5, headX: -8, headY: -50, airT: 9 },
  { id: 'diesel', name: 'Super Diesel', kind: 'diesel', price: 10000, color: '#e5383b', accent: '#3b3b3b', desc: 'A smoke-belching beast with massive torque and fuel.',
    maxSpeed: 800, accel: 900, weight: 2.6, jump: 360, ks: 28, stab: 1.4, fuel: 1.7, wb: 124, r: 28, L0: 14, travel: 36, drive: 'all', dtq: 0.8, headX: -26, headY: -36, roofX: 26, roofY: -54, airT: 6.5 },
  { id: 'sport', name: 'Sports Bike', kind: 'sport', price: 15000, color: '#00b4d8', accent: '#14213d', desc: 'Fastest machine on two wheels. Twitchy and fragile.',
    maxSpeed: 1000, accel: 1060, weight: 0.7, jump: 500, ks: 48, stab: 0.75, fuel: 0.8, wb: 88, r: 18, L0: 11, travel: 28, drive: 'rear', dtq: 1.3, headX: -2, headY: -46, airT: 10 },
];

const ROADS = [
  { id: 'green', name: 'Green Hills', price: 0, diff: 'Easy', stars: 1, amp: 0.9, bump: 0.9, grip: 1,
    skyTop: '#3fb6f0', skyBot: '#dff6e4', far: '#8fd19e', mid: '#5aaf6e', top: '#5bbf4a', top2: '#8be36a', dirt1: '#8b5a2b', dirt2: '#5c3a1c', dust: '#b08457', deco: ['tree', 'pine', 'rock', 'bush', 'tree'] },
  { id: 'desert', name: 'Desert', price: 2000, diff: 'Medium', stars: 2, amp: 1.0, bump: 1.05, grip: 0.92,
    skyTop: '#f4a259', skyBot: '#fdecb5', far: '#eab676', mid: '#d99a4e', top: '#f3d27a', top2: '#ffe9a8', dirt1: '#d9a050', dirt2: '#a86f2c', dust: '#ecd09a', deco: ['cactus', 'rock', 'cactus', 'dryBush'] },
  { id: 'snow', name: 'Snow Mountains', price: 5000, diff: 'Hard', stars: 3, amp: 1.1, bump: 1.2, grip: 0.72,
    skyTop: '#6f9bd1', skyBot: '#eef6ff', far: '#b9cde6', mid: '#9db8da', top: '#ffffff', top2: '#dcebff', dirt1: '#8fb1d9', dirt2: '#5d7fae', dust: '#ffffff', deco: ['spine', 'srock', 'snowman', 'spine'] },
  { id: 'city', name: 'City Rush', price: 8000, diff: 'Hard', stars: 4, amp: 1.05, bump: 1.3, grip: 1,
    skyTop: '#2b2d6e', skyBot: '#ff9a76', far: '#3d3f80', mid: '#2a2c58', top: '#4a5062', top2: '#f4d03f', dirt1: '#5a6074', dirt2: '#2f3446', dust: '#a2a8b6', deco: ['lamp', 'cone', 'sign', 'ac'] },
  { id: 'volcano', name: 'Volcano', price: 12000, diff: 'Extreme', stars: 5, amp: 1.2, bump: 1.45, grip: 0.88,
    skyTop: '#220a0a', skyBot: '#c4361b', far: '#4a1a14', mid: '#2e100c', top: '#40302f', top2: '#ff7b2e', dirt1: '#3d2725', dirt2: '#1c0f0e', dust: '#6e5a58', deco: ['deadtree', 'hotrock', 'vent', 'fire'] },
];

const UPGRADES = [
  { key: 'engine', name: 'Engine', base: 300, desc: 'More acceleration', eff: (l) => `+${l * 7}% acceleration` },
  { key: 'speed', name: 'Top Speed', base: 300, desc: 'Higher maximum speed', eff: (l) => `+${(l * 4.5).toFixed(1)}% top speed` },
  { key: 'suspension', name: 'Suspension', base: 250, desc: 'Softer landings, better bump control', eff: (l) => `+${l * 6}% landing safety` },
  { key: 'nitro', name: 'Nitro', base: 300, desc: 'Bigger tank, faster recharge', eff: (l) => `+${l * 20}% capacity` },
  { key: 'fuel', name: 'Fuel Tank', base: 250, desc: 'Drive further per tank', eff: (l) => `+${l * 18}% fuel` },
  { key: 'stability', name: 'Stability', base: 300, desc: 'Steadier in the air, less damage', eff: (l) => `+${l * 7}% stability` },
];
const upgradePrice = (u, l) => Math.round((u.base * (1 + l * 0.85) * (1 + l * 0.08)) / 10) * 10;

const MISSIONS = [
  { id: 'm_coins50', title: 'Collect 50 coins', type: 'coins', target: 50, cum: true, coins: 200 },
  { id: 'm_dist1000', title: 'Travel 1,000 metres', type: 'dist', target: 1000, cum: true, coins: 300 },
  { id: 'm_flip3', title: 'Perform 3 flips', type: 'flips', target: 3, cum: true, coins: 150, gems: 1 },
  { id: 'm_nitro5', title: 'Use Nitro 5 times', type: 'nitro', target: 5, cum: true, coins: 200 },
  { id: 'm_clean', title: 'Clean run: 600 m without taking damage', type: 'clean', target: 600, cum: false, coins: 500 },
  { id: 'm_gems3', title: 'Collect 3 gems', type: 'gems', target: 3, cum: true, coins: 400, gems: 1 },
  { id: 'm_wheelie5', title: 'Hold 5 wheelies', type: 'wheelies', target: 5, cum: true, coins: 350 },
  { id: 'm_coins300', title: 'Collect 300 coins', type: 'coins', target: 300, cum: true, coins: 600 },
  { id: 'm_perfect5', title: 'Land 5 perfect landings', type: 'perfect', target: 5, cum: true, coins: 400, gems: 1 },
  { id: 'm_best1500', title: 'Reach 1,500 m in a single run', type: 'bestdist', target: 1500, cum: false, coins: 1500, gems: 2 },
  { id: 'm_flip25', title: 'Perform 25 flips', type: 'flips', target: 25, cum: true, coins: 800, gems: 2 },
  { id: 'm_dist5000', title: 'Travel 5,000 metres', type: 'dist', target: 5000, cum: true, coins: 1000, gems: 3 },
];

/* ============================== SAVE SYSTEM ============================== */
const defaultSave = () => ({
  coins: 0, gems: 0, vehicles: ['ninja'], roads: ['green'], vehicle: 'ninja', road: 'green',
  upgrades: {}, best: { distance: 0, score: 0 }, mp: {}, done: {}, daily: { last: '', streak: 0 },
  settings: { sfx: true, music: true, volume: 0.6, touch: true }, runs: 0,
});

function loadSave() {
  const d = defaultSave();
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return d;
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object') return d;
    const num = (v, f) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : f);
    const out = { ...d };
    out.coins = Math.floor(num(p.coins, 0));
    out.gems = Math.floor(num(p.gems, 0));
    const vIds = VEHICLES.map((v) => v.id);
    const rIds = ROADS.map((r) => r.id);
    out.vehicles = Array.from(new Set(['ninja', ...(Array.isArray(p.vehicles) ? p.vehicles : []).filter((x) => vIds.includes(x))]));
    out.roads = Array.from(new Set(['green', ...(Array.isArray(p.roads) ? p.roads : []).filter((x) => rIds.includes(x))]));
    out.vehicle = out.vehicles.includes(p.vehicle) ? p.vehicle : 'ninja';
    out.road = out.roads.includes(p.road) ? p.road : 'green';
    out.upgrades = {};
    if (p.upgrades && typeof p.upgrades === 'object') {
      vIds.forEach((id) => {
        const u = p.upgrades[id];
        if (u && typeof u === 'object') {
          out.upgrades[id] = {};
          UPGRADES.forEach((up) => { out.upgrades[id][up.key] = clamp(Math.floor(num(u[up.key], 0)), 0, MAX_UPGRADE); });
        }
      });
    }
    if (p.best && typeof p.best === 'object') out.best = { distance: num(p.best.distance, 0), score: num(p.best.score, 0) };
    if (p.mp && typeof p.mp === 'object') { out.mp = {}; Object.keys(p.mp).forEach((k) => { out.mp[k] = num(p.mp[k], 0); }); }
    if (p.done && typeof p.done === 'object') { out.done = {}; MISSIONS.forEach((m) => { if (p.done[m.id] === true) out.done[m.id] = true; }); }
    if (p.daily && typeof p.daily === 'object') out.daily = { last: typeof p.daily.last === 'string' ? p.daily.last : '', streak: Math.floor(num(p.daily.streak, 0)) };
    if (p.settings && typeof p.settings === 'object') {
      out.settings = {
        sfx: p.settings.sfx !== false, music: p.settings.music !== false,
        volume: clamp(typeof p.settings.volume === 'number' && Number.isFinite(p.settings.volume) ? p.settings.volume : 0.6, 0, 1),
        touch: p.settings.touch !== false,
      };
    }
    out.runs = Math.floor(num(p.runs, 0));
    return out;
  } catch (e) {
    return d;
  }
}

function persistSave(s) {
  try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* storage unavailable */ }
}

const pad2 = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const todayKey = () => dayKey(new Date());
const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };

/* ============================== AUDIO (WebAudio, no assets) ============================== */
function createAudio(getSettings) {
  let ctx = null; let master = null; let timer = null; let step = 0; let eng = null;
  const ensure = () => {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      master.gain.value = clamp(getSettings().volume, 0, 1);
      return true;
    } catch (e) { return false; }
  };
  const tone = (f, d, type, v, slide) => {
    if (!ctx) return;
    const t = ctx.currentTime; const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.03);
  };
  const noise = (d, v, fc) => {
    if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * d); const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = fc;
    const g = ctx.createGain(); g.gain.value = v;
    src.connect(fl); fl.connect(g); g.connect(master); src.start();
  };
  const sfx = (n) => {
    if (!ctx || !getSettings().sfx) return;
    switch (n) {
      case 'coin': tone(880, 0.09, 'square', 0.07); setTimeout(() => tone(1320, 0.12, 'square', 0.07), 60); break;
      case 'gem': tone(660, 0.12, 'triangle', 0.14); setTimeout(() => tone(990, 0.12, 'triangle', 0.14), 90); setTimeout(() => tone(1480, 0.2, 'triangle', 0.14), 180); break;
      case 'fuel': tone(300, 0.2, 'sawtooth', 0.08, 300); break;
      case 'jump': tone(280, 0.18, 'sine', 0.16, 320); break;
      case 'land': noise(0.16, 0.22, 500); break;
      case 'hit': noise(0.22, 0.3, 700); tone(120, 0.15, 'square', 0.1, -60); break;
      case 'crash': noise(0.7, 0.45, 900); tone(90, 0.5, 'sawtooth', 0.15, -50); break;
      case 'nitro': noise(0.5, 0.18, 2500); tone(200, 0.4, 'sawtooth', 0.05, 400); break;
      case 'combo': tone(520, 0.1, 'square', 0.07); setTimeout(() => tone(780, 0.14, 'square', 0.07), 80); break;
      case 'mission': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.14), i * 90)); break;
      case 'level': [392, 523, 659].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle', 0.12), i * 80)); break;
      case 'unlock': [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle', 0.14), i * 70)); break;
      case 'error': tone(180, 0.22, 'square', 0.1, -60); break;
      default: tone(600, 0.05, 'square', 0.05); break;
    }
  };
  const engine = (on, sp, th) => {
    if (!ctx) return;
    if (!on || !getSettings().sfx) { if (eng) eng.g.gain.setTargetAtTime(0, ctx.currentTime, 0.06); return; }
    if (!eng) {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 420;
      const g = ctx.createGain(); g.gain.value = 0;
      o.connect(fl); fl.connect(g); g.connect(master); o.start(); eng = { o, g };
    }
    const t = ctx.currentTime;
    eng.g.gain.setTargetAtTime(0.03 + 0.03 * th, t, 0.08);
    eng.o.frequency.setTargetAtTime(48 + sp * 85 + th * 22, t, 0.08);
  };
  const MEL = [523.3, 622.3, 784, 932.3, 784, 622.3, 698.5, 587.3];
  const BASS = [130.8, 130.8, 155.6, 116.5];
  const startMusic = () => {
    if (!ctx || timer) return;
    timer = setInterval(() => {
      if (!getSettings().music) return;
      const i = step++;
      tone(MEL[(i * 3 + (i >> 3)) % 8], 0.3, 'triangle', 0.045);
      if (i % 4 === 0) tone(BASS[(i >> 2) % 4], 0.7, 'sine', 0.08);
    }, 230);
  };
  const stopMusic = () => { if (timer) { clearInterval(timer); timer = null; } };
  const setVolume = (v) => { if (master) master.gain.value = clamp(v, 0, 1); };
  const dispose = () => {
    stopMusic();
    try { if (eng) eng.o.stop(); if (ctx) ctx.close(); } catch (e) { /* ignore */ }
    ctx = null; eng = null; master = null;
  };
  return { ensure, sfx, engine, startMusic, stopMusic, setVolume, dispose, ready: () => !!ctx };
}

/* ============================== VEHICLE PARAMETERS ============================== */
function buildParams(v, up) {
  const L = up || {};
  const e = L.engine || 0, s = L.speed || 0, su = L.suspension || 0, n = L.nitro || 0, f = L.fuel || 0, st = L.stability || 0;
  const ks = v.ks * (1 + 0.03 * su);
  const zeta = Math.min(0.9, 0.5 + 0.04 * su);
  const pts = [{ x: v.headX, y: v.headY, r: 9 }];
  if (v.roofX) { pts.push({ x: v.roofX, y: v.roofY, r: 5 }); pts.push({ x: -v.roofX, y: v.roofY, r: 5 }); }
  return {
    wb: v.wb, r: v.r, hubY: 12, L0: v.L0, travel: v.travel, drive: v.drive, dtq: v.dtq,
    accel: v.accel * (1 + 0.07 * e), maxSpeed: v.maxSpeed * (1 + 0.045 * s),
    ks, kd: zeta * Math.sqrt(2 * ks), weight: v.weight,
    rg2: Math.pow(0.4 * v.wb, 2) * (0.8 + 0.3 * v.weight),
    stab: v.stab * (1 + 0.07 * st), jump: v.jump, airT: v.airT,
    fuelMax: 100 * v.fuel * (1 + 0.18 * f), nitroMax: 100 * (1 + 0.2 * n), nitroRech: 8 * (1 + 0.15 * n), nitroUse: 26,
    safe: 820 + 55 * su, dmgMul: (0.8 + 0.25 * v.weight) * (1 - 0.05 * st),
    pts,
  };
}

/* ============================== TERRAIN ============================== */
function terrainY(x, ri) {
  const R = ROADS[ri];
  const d = clamp((x - SPAWN_X) / (LEVEL_LEN * 24), 0, 1);       // 0 at level 1 -> 1 at level 25
  const env = smooth01((x - SPAWN_X + 200) / 1600);               // flat start
  const amp = (0.4 + 0.6 * d) * R.amp * env;
  let h = (105 * Math.sin(x / 760 + 1.3) + 58 * Math.sin(x / 330 + 0.4) + 17 * Math.sin(x / 145 + 2.1)) * amp;
  const ck = Math.floor(x / 1700);
  for (let k = ck - 1; k <= ck + 1; k++) {
    const s = k * 13.37 + ri * 7.1;
    if (hash(s) < 0.3 + 0.45 * d) {
      const cx = (k + 0.15 + 0.7 * hash(s + 1)) * 1700;
      const w = 170 + 160 * hash(s + 2);
      const hg = Math.min((70 + 140 * hash(s + 3)) * (0.45 + 0.8 * d) * R.bump * env, w * 0.5);
      let u = (x - cx) / w; h += hg * Math.exp(-u * u);
      u = (x - cx - 2.4 * w) / (w * 0.9); h -= 0.6 * hg * Math.exp(-u * u);
    }
  }
  return -h;
}
const slopeAt = (x, ri) => (terrainY(x + 3, ri) - terrainY(x - 3, ri)) / 6;
const iceAt = (ice, x) => { for (let i = 0; i < ice.length; i++) if (x > ice[i].x0 && x < ice[i].x1) return true; return false; };

/* ============================== RUN STATE ============================== */
function makeRun(save, vehId, roadId) {
  const v = VEHICLES.find((q) => q.id === vehId) || VEHICLES[0];
  const ri = Math.max(0, ROADS.findIndex((r) => r.id === roadId));
  const P = buildParams(v, save.upgrades[v.id]);
  const gy = terrainY(SPAWN_X, ri);
  const parts = [];
  for (let i = 0; i < MAX_PARTICLES; i++) parts.push({ life: 0, max: 1, x: 0, y: 0, vx: 0, vy: 0, s: 2, c: '#fff', gr: 0, gv: 0, add: false });
  const weather = [];
  for (let i = 0; i < MAX_WEATHER; i++) weather.push({ u: Math.random(), v: Math.random(), s: Math.random(), ph: Math.random() * 6.28 });
  return {
    v, P, ri, road: ROADS[ri], t: 0, over: false, crashed: false, crashT: 0, reason: '', ended: false, paused: false,
    x: SPAWN_X, y: gy - P.r - P.hubY - P.L0 + 10, a: 0, w: 0, vx: 0, vy: 0,
    wa: 0, wspin: 0, cv: [0, 0], cvT: [0, 0], wg: [false, false], wp: [{ x: SPAWN_X, y: gy }, { x: SPAWN_X, y: gy }],
    air: 0, airRot: 0, airX: SPAWN_X, prevGround: true, jumpCd: 0, wheelieT: 0, flipT: 0, thr: false, brk: false, lean: 0,
    fuel: P.fuelMax, noFuelT: 0, nitro: P.nitroMax, nitroOn: false, nitroIdle: 0, nitroPrev: false,
    health: 100, hitT: 0, noDmgT: 0, damageTaken: 0,
    coins: 0, gems: 0, coinPickups: 0, gemPickups: 0, flips: 0, wheelies: 0, perfects: 0, longJumps: 0, nitroUses: 0,
    stuntScore: 0, combo: 0, comboT: 0, rewardCoins: 0, rewardGems: 0, doneNow: [], missionT: 0,
    maxX: SPAWN_X, dist: 0, level: 1,
    items: [], obst: [], fall: [], ice: [], genX: SPAWN_X + 900, nextFuelX: SPAWN_X + 8000, nextFall: 4, cleanT: 0,
    parts, pi: 0, weather, pops: [], ev: [], dustAcc: 0, smokeAcc: 0,
    camX: 0, camY: 0, zoom: 1, camInit: false, sc: 1, vw: 800, vh: 600, shake: 0, flash: 0, rider: null,
  };
}

const comboMul = (c) => (c >= 7 ? 5 : c >= 4 ? 3 : c >= 2 ? 2 : 1);
const scoreOf = (g) => Math.floor(g.dist) * 3 + g.coinPickups * 10 + g.gemPickups * 100 + g.stuntScore + g.doneNow.length * 250;

function emit(g, x, y, vx, vy, life, s, c, grow, grav, add) {
  const p = g.parts[g.pi]; g.pi = (g.pi + 1) % MAX_PARTICLES;
  p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.max = life; p.s = s; p.c = c; p.gr = grow || 0; p.gv = grav || 0; p.add = !!add;
}
function burst(g, x, y, n, c, sp, life, s, add, grav) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2; const v = rnd(sp * 0.3, sp);
    emit(g, x, y, Math.cos(a) * v, Math.sin(a) * v - sp * 0.2, life * rnd(0.6, 1.2), s * rnd(0.6, 1.2), c, 0, grav || 0, add);
  }
}
function pop(g, x, y, text, color, life) {
  if (g.pops.length > 18) g.pops.shift();
  g.pops.push({ x, y, text, color: color || '#fff', life: life || 1.1, max: life || 1.1 });
}
function awardStunt(g, name, pts) {
  g.combo += 1; g.comboT = 6;
  const m = comboMul(g.combo); const total = pts * m;
  g.stuntScore += total;
  pop(g, g.x, g.y - 90 - (g.pops.length % 3) * 22, `${name} +${total}${m > 1 ? ` x${m}` : ''}`, m >= 3 ? '#ff6b6b' : '#ffe066', 1.8);
  g.ev.push('combo');
}
function headPos(g) {
  const q = g.P.pts[0]; const c = Math.cos(g.a), s = Math.sin(g.a);
  return { x: g.x + q.x * c - q.y * s, y: g.y + q.x * s + q.y * c };
}
function crash(g, why) {
  if (g.crashed) return;
  g.crashed = true; g.crashT = 0; g.reason = why; g.nitroOn = false; g.ev.push('crash'); g.flash = 1; g.shake = 1.4;
  const h = headPos(g);
  g.rider = { x: h.x, y: h.y, vx: g.vx * 0.9 + 60, vy: g.vy - 380, a: g.a, va: rnd(-8, 8) };
  burst(g, g.x, g.y, 14, '#4a4a52', 240, 1.0, 8, false, -30);
  burst(g, g.x, g.y, 14, '#ffb703', 380, 0.5, 4, true, 600);
}
function damage(g, amt) {
  if (g.crashed || amt <= 0) return;
  const a = amt * g.P.dmgMul;
  g.health -= a; g.damageTaken += a; g.hitT = 0.45; g.noDmgT = 0; g.shake = Math.min(1.2, g.shake + 0.4); g.ev.push('hit');
  if (g.health <= 0) { g.health = 0; crash(g, 'crash'); }
}

/* Landing: stabilisation, damage and stunt scoring */
function handleLanding(g, impact, ang) {
  const P = g.P; const air = g.air; const rot = g.airRot; const dist = g.x - g.airX;
  g.w *= 1 - 0.35 * clamp(P.stab, 0, 1.2);
  g.shake = Math.max(g.shake, Math.min(0.8, impact / 1600));
  g.ev.push('land');
  for (let i = 0; i < 2; i++) if (g.wg[i]) burst(g, g.wp[i].x, g.wp[i].y + P.r * 0.8, 4, g.road.dust, 120, 0.6, 7, false, -10);
  let dmg = 0;
  if (impact > P.safe) dmg += (impact - P.safe) * 0.045;
  if (ang > 1.1) dmg += (ang - 1.1) * 40;
  if (dmg > 2) damage(g, dmg);
  if (g.crashed) return;
  const flips = Math.floor((Math.abs(rot) + 1.0) / (Math.PI * 2));
  if (flips >= 1 && ang < 1.4) {
    const back = rot < 0;
    g.flips += flips;
    awardStunt(g, `${flips > 1 ? (flips === 2 ? 'Double ' : 'Triple ') : ''}${back ? 'Backflip' : 'Frontflip'}`, (back ? 200 : 250) * flips);
  }
  if (air > 0.9 && dist > 800) { g.longJumps += 1; awardStunt(g, 'Long Jump', 100 + Math.floor(dist / 20)); }
  else if (air > 1.1) { const p = Math.floor(air * 60); g.stuntScore += p; pop(g, g.x, g.y - 70, `Big Air +${p}`, '#9bf6ff', 1.4); }
  if (air > 0.55 && ang < 0.2) { g.perfects += 1; awardStunt(g, 'Perfect Landing', 100); }
}

/* ============================== PHYSICS STEP ============================== */
function physStep(g, inp, dt) {
  const P = g.P; const alive = !g.crashed; const hasFuel = g.fuel > 0;
  const gas = alive && hasFuel && !!inp.gas;
  const brake = alive && !!inp.brake;
  const nitroOn = alive && hasFuel && !!inp.nitro && g.nitro > 0.5;
  g.thr = gas; g.brk = brake;
  if (nitroOn) {
    g.nitro = Math.max(0, g.nitro - P.nitroUse * dt); g.nitroIdle = 0;
    if (!g.nitroPrev) { g.nitroUses += 1; g.ev.push('nitro'); }
  } else {
    g.nitroIdle += dt;
    if (g.nitroIdle > 1.0) g.nitro = Math.min(P.nitroMax, g.nitro + P.nitroRech * dt);
  }
  g.nitroPrev = nitroOn; g.nitroOn = nitroOn;
  if (alive && hasFuel) g.fuel = Math.max(0, g.fuel - (0.8 + (gas ? 0.7 : 0) + (nitroOn ? 1.0 : 0)) * dt);

  const maxV = P.maxSpeed * (nitroOn ? 1.32 : 1);
  const accelBase = P.accel * (nitroOn ? 1.75 : 1);
  const roadGrip = g.road.grip;
  const driveW = P.drive === 'all' ? 2 : 1;
  const cosA = Math.cos(g.a), sinA = Math.sin(g.a);
  let ax = 0, ay = GRAVITY, torque = 0, grounded = 0, vtSum = 0, landImpact = 0, landAng = 0;

  for (let i = 0; i < 2; i++) {
    const lx = i === 0 ? -P.wb / 2 : P.wb / 2;
    const rx = lx * cosA - P.hubY * sinA, ry = lx * sinA + P.hubY * cosA;      // hub relative to centre of mass
    const wcx = rx - sinA * P.L0, wcy = ry + cosA * P.L0;                        // wheel centre (spring at rest length)
    const cx = g.x + wcx, cy = g.y + wcy;
    const gy = terrainY(cx, g.ri);
    const sl = (terrainY(cx + 3, g.ri) - terrainY(cx - 3, g.ri)) / 6;
    const inv = 1 / Math.sqrt(1 + sl * sl);
    const nx = sl * inv, ny = -inv, tx = inv, ty = sl * inv;                      // surface normal / tangent
    const pen = P.r - (gy - cy) * inv;
    const vpx = g.vx - g.w * wcy, vpy = g.vy + g.w * wcx;
    if (pen > 0) {
      grounded += 1;
      const vn = -(vpx * nx + vpy * ny);
      let fN = P.ks * pen + P.kd * vn;
      if (pen > P.travel) fN += P.ks * 6 * (pen - P.travel);                      // bump stop
      fN = clamp(fN, 0, 5000);
      const vt = vpx * tx + vpy * ty;
      vtSum += vt;
      const grip = roadGrip * (iceAt(g.ice, cx) ? 0.38 : 1);
      let drive = 0;
      if (gas && (P.drive === 'all' || i === 0)) drive += (accelBase / driveW) * clamp((maxV - vt) / (maxV * 0.25), 0, 1);
      if (brake) {
        if (vt > 40) drive -= 700;
        else drive -= ((P.accel * 0.55) / driveW) * clamp((300 + vt) / 300, 0, 1);
      }
      const kT = brake ? 0 : gas ? 0.5 : Math.abs(vt) < 60 ? 4 : 1.6;
      const mu = (brake ? 1.2 : 0.55) * grip;
      const fr = clamp(-vt * kT, -mu * fN, mu * fN);
      const tmax = grip * (fN * 1.1 + 300);
      drive = clamp(drive, -tmax, tmax);
      const ft = drive + fr;
      const sFx = nx * fN, sFy = ny * fN, tFx = tx * ft, tFy = ty * ft;
      ax += sFx + tFx; ay += sFy + tFy;
      torque += rx * sFy - ry * sFx + (ft > 0 ? P.dtq : 0.9) * (wcx * tFy - wcy * tFx);
      g.wg[i] = true; g.cvT[i] = Math.min(pen, P.travel + 6);
      g.wp[i].x = cx + nx * pen; g.wp[i].y = cy + ny * pen;
      if (!g.prevGround && g.air > 0.12 && vn > landImpact) { landImpact = vn; landAng = Math.abs(wrapAngle(g.a - Math.atan(sl))); }
    } else {
      g.wg[i] = false; g.cvT[i] = -5; g.wp[i].x = cx; g.wp[i].y = cy;
    }
  }

  const anyG = grounded > 0;
  if (anyG) {
    if (!g.prevGround && g.air > 0.12) handleLanding(g, landImpact, landAng);
    g.air = 0; g.airRot = 0; g.airX = g.x;
    g.wspin = vtSum / grounded / P.r;
  } else {
    g.air += dt; g.airRot += g.w * dt;
    const tgt = gas ? (P.maxSpeed / P.r) * 0.9 : brake ? 0 : g.wspin;
    g.wspin += (tgt - g.wspin) * Math.min(1, dt * 1.5);
  }
  g.wa += g.wspin * dt;
  g.prevGround = anyG;

  g.jumpCd = Math.max(0, g.jumpCd - dt);
  if (alive && inp.jump && anyG && g.jumpCd <= 0) {
    const sl = slopeAt(g.x, g.ri); const inv = 1 / Math.sqrt(1 + sl * sl);
    g.vx += sl * inv * P.jump * 0.9; g.vy -= inv * P.jump; g.jumpCd = 0.85; g.ev.push('jump');
    for (let i = 0; i < 2; i++) if (g.wg[i]) burst(g, g.wp[i].x, g.wp[i].y + P.r * 0.8, 3, g.road.dust, 100, 0.5, 6, false, -10);
  }

  let alpha = torque / P.rg2;
  if (alive) {
    if (!anyG) {
      const rot = (inp.brake ? 1 : 0) - (inp.gas ? 1 : 0);                        // gas = nose up, brake = nose down
      alpha += (rot * P.airT) / (0.7 + 0.35 * P.weight);
      if (inp.balance || inp.jump) {                                              // air balance / air control
        const k = inp.balance ? 1 : 0.5;
        const tgt = Math.atan(slopeAt(g.x + g.vx * 0.3, g.ri));
        alpha -= (wrapAngle(g.a - tgt) * 14 + g.w * 5) * k * P.stab;
      }
    } else if (grounded === 1) {                                                   // limit wheelies / nose dives
      const diff = wrapAngle(g.a - Math.atan(slopeAt(g.x, g.ri)));
      const ex = Math.abs(diff) - 0.5;
      if (ex > 0) alpha -= Math.sign(diff) * ex * (40 + (ex > 0.3 ? 160 * (ex - 0.3) : 0)) * P.stab;
    }
  }
  alpha -= g.w * (anyG ? 1.0 + 2.6 * P.stab : 0.28 + 0.12 * P.stab);            // rotation damping
  g.w = clamp(g.w + alpha * dt, -7.5, 7.5);                                       // angular velocity limit
  g.vx = clamp(g.vx + ax * dt, -1400, 1400);
  g.vy = clamp(g.vy + ay * dt, -1800, 1800);
  g.x += g.vx * dt; g.y += g.vy * dt; g.a += g.w * dt;
  if (g.x < SPAWN_X - 300 && g.vx < 0) { g.x = SPAWN_X - 300; g.vx = 0; }

  if (alive) {
    const c2 = Math.cos(g.a), s2 = Math.sin(g.a);
    for (let k = 0; k < P.pts.length; k++) {
      const q = P.pts[k];
      const px = g.x + q.x * c2 - q.y * s2, py = g.y + q.x * s2 + q.y * c2;
      if (py + q.r > terrainY(px, g.ri) + 3) { crash(g, 'crash'); break; }
    }
    if (!g.crashed && anyG && c2 < 0.4 && Math.cos(g.a - Math.atan(slopeAt(g.x, g.ri))) < -0.3) {
      g.flipT += dt; if (g.flipT > 0.8) crash(g, 'crash');
    } else if (!anyG || c2 >= 0.4) g.flipT = 0;
  }
}

/* ============================== WORLD GENERATION ============================== */
function addItem(g, k, x, y) { g.items.push({ k, x, y: Math.min(y, terrainY(x, g.ri) - 38), ph: Math.random() * 6.28, got: false }); }
function addObstacle(g, x) {
  const kinds = [['rock'], ['cactus', 'rock'], ['iceblock', 'rock'], ['barrier', 'cone', 'crate'], ['hotrock', 'fire']][g.ri];
  const k = kinds[Math.floor(Math.random() * kinds.length)];
  const r = { rock: rnd(18, 26), cactus: 17, iceblock: 22, barrier: 22, cone: 14, crate: 21, hotrock: 21, fire: 20 }[k];
  g.obst.push({ k, x, r, y: terrainY(x, g.ri) - r * 0.75, dead: false, ph: Math.random() * 6.28 });
}

function generate(g) {
  const ri = g.ri; const lim = g.x + 2800;
  const ty = (x) => terrainY(x, ri);
  while (g.genX < lim) {
    const x0 = g.genX; const d = clamp((x0 - SPAWN_X) / (LEVEL_LEN * 24), 0, 1);
    const r = Math.random(); let len = 600;
    const span = (n, st) => { let lo = 1e9, hi = -1e9; for (let i = 0; i < n; i++) { const y = ty(x0 + i * st); if (y < lo) lo = y; if (y > hi) hi = y; } return [lo, hi]; };
    if (r < 0.26) {                                              // straight trail
      const n = 6 + Math.floor(Math.random() * 5); const sp = span(n, 50);
      if (sp[1] - sp[0] < 90) { for (let i = 0; i < n; i++) addItem(g, 'coin', x0 + i * 50, sp[0] - 62); len = n * 50; }
      else { for (let i = 0; i < n; i++) { const x = x0 + i * 46; addItem(g, 'coin', x, ty(x) - 46); } len = n * 46; }
    } else if (r < 0.52) {                                       // hill-following trail
      const n = 8 + Math.floor(Math.random() * 7);
      for (let i = 0; i < n; i++) { const x = x0 + i * 46; addItem(g, 'coin', x, ty(x) - 46); }
      len = n * 46;
    } else if (r < 0.68) {                                       // jump arc
      const sp = span(9, 58);
      for (let i = 0; i < 9; i++) { const x = x0 + i * 58; const t = (i - 4) / 4; addItem(g, 'coin', x, sp[0] - 70 - 120 * (1 - t * t)); }
      len = 9 * 58;
    } else if (r < 0.82) {                                       // coin circle
      const cx = x0 + 90; const cy = ty(cx) - 175;
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; addItem(g, 'coin', cx + Math.cos(a) * 62, cy + Math.sin(a) * 62); }
      if (Math.random() < 0.3) addItem(g, 'gem', cx, cy);
      len = 260;
    } else {                                                     // bonus group
      const gemAt = Math.random() < 0.4 ? 7 : -1;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const x = x0 + i * 44; addItem(g, gemAt === i * 3 + j ? 'gem' : 'coin', x, ty(x) - 60 - j * 42); }
      len = 280;
    }
    if (Math.random() < 0.06 + 0.04 * d) addItem(g, 'gem', x0 + len * 0.5, ty(x0 + len * 0.5) - 90);
    if (x0 > SPAWN_X + 1100 && Math.random() < 0.16 + 0.5 * d) addObstacle(g, x0 + len + rnd(80, 300));
    if (ri === 2 && Math.random() < 0.34) { const ix = x0 + len + rnd(100, 300); g.ice.push({ x0: ix, x1: ix + rnd(420, 900) }); }
    g.genX = x0 + len + 260 + Math.random() * 420;
  }
  while (g.nextFuelX < lim) { addItem(g, 'fuel', g.nextFuelX, ty(g.nextFuelX) - 52); g.nextFuelX += 10500 + Math.random() * 3500; }
}

/* ============================== MISSIONS / SCORE HELPERS ============================== */
function runStat(g, type) {
  switch (type) {
    case 'coins': return g.coinPickups;
    case 'dist': return g.dist;
    case 'flips': return g.flips;
    case 'nitro': return g.nitroUses;
    case 'gems': return g.gemPickups;
    case 'perfect': return g.perfects;
    case 'wheelies': return g.wheelies;
    case 'clean': return g.damageTaken === 0 ? g.dist : 0;
    case 'bestdist': return g.dist;
    default: return 0;
  }
}
const missionValue = (g, save, m) => (m.cum ? (save.mp[m.type] || 0) : 0) + runStat(g, m.type);

/* ============================== PER-FRAME GAMEPLAY ============================== */
function gameplay(g, dt, save) {
  const P = g.P;
  g.t += dt;
  for (let i = 0; i < 2; i++) g.cv[i] += (g.cvT[i] - g.cv[i]) * Math.min(1, dt * 18);
  g.lean += ((g.thr ? 0.8 : g.brk ? -0.9 : 0) + clamp(-g.w * 0.08, -0.4, 0.4) - g.lean) * Math.min(1, dt * 5);
  g.hitT = Math.max(0, g.hitT - dt); g.noDmgT += dt; g.shake = Math.max(0, g.shake - dt * 3); g.flash = Math.max(0, g.flash - dt * 2);
  if (g.comboT > 0) { g.comboT -= dt; if (g.comboT <= 0) g.combo = 0; }

  if (!g.crashed) {
    if (g.noDmgT > 3 && g.health < 100) g.health = Math.min(100, g.health + 2.0 * dt);
    g.maxX = Math.max(g.maxX, g.x); g.dist = (g.maxX - SPAWN_X) / PX_PER_M;
    const lv = 1 + Math.floor(g.dist / 300);
    if (lv > g.level) {
      g.level = lv; g.fuel = Math.min(P.fuelMax, g.fuel + 15);
      const bonus = 20 * Math.min(lv, MAX_LEVEL); g.coins += bonus;
      pop(g, g.x, g.y - 120, `LEVEL ${lv}  +${bonus}`, '#4cc9f0', 2.2); g.ev.push('level');
    }
    // wheelie: rear wheel(s) down, front wheel up
    if (g.wg[0] && !g.wg[1] && g.vx > 120) {
      g.wheelieT += dt;
      if (g.wheelieT > 1.0) { g.wheelies += 1; g.wheelieT = -0.5; awardStunt(g, 'Wheelie', 60); }
    } else g.wheelieT = Math.min(0, g.wheelieT) + (g.wheelieT < 0 ? dt : 0);

    // pickups
    const pr = 48 + P.r * 0.6;
    for (let i = 0; i < g.items.length; i++) {
      const it = g.items[i];
      if (it.got || Math.abs(it.x - g.x) > 120) continue;
      const dx = it.x - g.x, dy = it.y - g.y;
      if (dx * dx + dy * dy < pr * pr) {
        it.got = true;
        if (it.k === 'coin') {
          g.coins += COIN_VALUE; g.coinPickups += 1; g.ev.push('coin');
          pop(g, it.x, it.y - 10, `+${COIN_VALUE}`, '#ffd60a', 0.8); burst(g, it.x, it.y, 7, '#ffd60a', 160, 0.45, 4, true, 200);
        } else if (it.k === 'gem') {
          g.gems += 1; g.gemPickups += 1; g.ev.push('gem');
          pop(g, it.x, it.y - 10, '+1 GEM', '#ff70a6', 1.3); burst(g, it.x, it.y, 12, '#ff70a6', 220, 0.6, 4, true, 100);
        } else {
          g.fuel = Math.min(P.fuelMax, g.fuel + 40); g.ev.push('fuel');
          pop(g, it.x, it.y - 10, '+FUEL', '#ff6b6b', 1.1); burst(g, it.x, it.y, 8, '#ff6b6b', 160, 0.5, 4, true, 100);
        }
      }
    }

    // obstacles
    const hp = headPos(g);
    for (let i = 0; i < g.obst.length; i++) {
      const o = g.obst[i];
      if (o.dead || Math.abs(o.x - g.x) > 140) continue;
      let hit = false, headHit = false;
      for (let k = 0; k < 2; k++) { const dx = g.wp[k].x - o.x, dy = g.wp[k].y - o.y; const rr2 = P.r + o.r * 0.85; if (dx * dx + dy * dy < rr2 * rr2) hit = true; }
      { const dx = hp.x - o.x, dy = hp.y - o.y; const rr2 = 9 + o.r * 0.8; if (dx * dx + dy * dy < rr2 * rr2) { hit = true; headHit = true; } }
      if (hit) {
        o.dead = true;
        const crush = P.weight > 2.2 ? 0.35 : P.weight > 1.8 ? 0.6 : 1;
        const fire = o.k === 'fire' || o.k === 'hotrock';
        const dmg = (headHit ? 20 : 5 + Math.min(5, Math.abs(g.vx) / 180)) * crush + (fire ? 3 : 0);
        g.vx *= 1 - 0.3 * crush; g.vy -= 220 * crush;
        burst(g, o.x, o.y, 10, fire ? '#ff7b2e' : o.k === 'iceblock' ? '#bde0fe' : o.k === 'cactus' ? '#4caf50' : '#8d8d96', 260, 0.7, 6, fire, 500);
        damage(g, dmg);
      }
    }

    // volcano: falling rocks
    if (g.ri === 4) {
      g.nextFall -= dt;
      if (g.nextFall <= 0) {
        const fx = g.x + 380 + Math.max(0, g.vx) * 0.9 + rnd(0, 250);
        g.fall.push({ x: fx, y: terrainY(fx, 4) - 800, vy: 0, r: 17, rot: 0, done: false });
        g.nextFall = Math.max(1.4, 4.2 - g.level * 0.08) + rnd(0, 1.6);
      }
    }
    for (let i = 0; i < g.fall.length; i++) {
      const f = g.fall[i];
      f.vy += 900 * dt; f.y += f.vy * dt; f.rot += dt * 4;
      const dx = f.x - g.x, dy = f.y - g.y;
      if (dx * dx + dy * dy < (f.r + 36) * (f.r + 36)) { damage(g, 16); g.vx *= 0.8; f.done = true; burst(g, f.x, f.y, 12, '#ff7b2e', 300, 0.6, 6, true, 400); }
      else if (f.y + f.r >= terrainY(f.x, 4)) { f.done = true; burst(g, f.x, f.y, 10, '#ff7b2e', 240, 0.6, 6, true, 400); burst(g, f.x, f.y, 5, '#55464a', 160, 0.9, 8, false, -20); }
    }
    if (g.fall.length && g.fall.some((f) => f.done)) g.fall = g.fall.filter((f) => !f.done);

    // missions
    g.missionT += dt;
    if (g.missionT > 0.4) {
      g.missionT = 0;
      for (let i = 0; i < MISSIONS.length; i++) {
        const m = MISSIONS[i];
        if (save.done[m.id] || g.doneNow.includes(m.id)) continue;
        if (missionValue(g, save, m) >= m.target) {
          g.doneNow.push(m.id); g.rewardCoins += m.coins || 0; g.rewardGems += m.gems || 0;
          pop(g, g.x, g.y - 140, 'MISSION COMPLETE!', '#80ed99', 2.4); g.ev.push('mission');
        }
      }
    }

    // out of fuel
    if (g.fuel <= 0) {
      g.noFuelT += dt;
      if (g.noFuelT > 3.5 || (g.noFuelT > 1.2 && Math.abs(g.vx) < 30)) { g.over = true; g.reason = 'fuel'; }
    }
  } else {
    g.crashT += dt;
    const r = g.rider;
    if (r) {
      r.vy += GRAVITY * dt; r.x += r.vx * dt; r.y += r.vy * dt; r.a += r.va * dt;
      const gy = terrainY(r.x, g.ri);
      if (r.y + 8 > gy) { r.y = gy - 8; r.vy *= -0.35; r.vx *= 0.7; r.va *= 0.7; }
    }
    if (g.crashT > 1.7) g.over = true;
  }

  // housekeeping
  g.cleanT += dt;
  if (g.cleanT > 1) {
    g.cleanT = 0;
    const back = g.x - 900;
    g.items = g.items.filter((it) => !it.got && it.x > back);
    g.obst = g.obst.filter((o) => !o.dead && o.x > back);
    if (g.ice.length) g.ice = g.ice.filter((z) => z.x1 > back);
  }
  generate(g);
}

/* Particles, weather and floating text (runs while playing and on the crash screen) */
function ambient(g, dt) {
  for (let i = 0; i < g.parts.length; i++) {
    const p = g.parts[i];
    if (p.life <= 0) continue;
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gv * dt; p.s += p.gr * dt;
    p.vx *= 1 - Math.min(1, dt * 1.2);
  }
  for (let i = g.pops.length - 1; i >= 0; i--) {
    const q = g.pops[i]; q.life -= dt; q.y -= 38 * dt;
    if (q.life <= 0) g.pops.splice(i, 1);
  }
  const ri = g.ri;
  if (ri === 1 || ri === 2 || ri === 4) {
    for (let i = 0; i < g.weather.length; i++) {
      const p = g.weather[i]; const vxs = g.crashed ? 0 : g.vx;
      if (ri === 2) { p.v += (0.1 + 0.12 * p.s) * dt; p.u += (-0.02 - vxs * 0.00005 + Math.sin(g.t + p.ph) * 0.01) * dt; }
      else if (ri === 1) { p.u += -(0.35 + 0.5 * p.s + vxs * 0.0003) * dt; p.v += Math.sin(g.t * 2 + p.ph) * 0.01 * dt; }
      else { p.v -= (0.06 + 0.1 * p.s) * dt; p.u += (Math.sin(g.t + p.ph) * 0.02 - vxs * 0.00004) * dt; }
      if (p.u < 0) p.u += 1; if (p.u > 1) p.u -= 1; if (p.v < 0) p.v += 1; if (p.v > 1) p.v -= 1;
    }
  }
}

/* Particle emission for the live game */
function effects(g, dt) {
  const P = g.P; const c = Math.cos(g.a), s = Math.sin(g.a);
  if (g.crashed) {
    g.smokeAcc += dt;
    while (g.smokeAcc > 0.05) {
      g.smokeAcc -= 0.05;
      emit(g, g.x + rnd(-14, 14), g.y + rnd(-10, 6), rnd(-20, 20), rnd(-90, -40), rnd(0.8, 1.5), rnd(7, 12), '#4b4b55', 18, 0, false);
      if (Math.random() < 0.3) emit(g, g.x + rnd(-14, 14), g.y, rnd(-60, 60), rnd(-160, -60), 0.4, 3, '#ff9f1c', 0, 300, true);
    }
    return;
  }
  const sp = Math.abs(g.vx);
  if (g.wg[0] && sp > 200) {
    g.dustAcc += dt * (sp / 60);
    const heavy = sp > 650;
    while (g.dustAcc >= 1) {
      g.dustAcc -= 1; const w = g.wp[0];
      emit(g, w.x - 8, w.y + P.r * 0.7, -g.vx * 0.15 + rnd(-30, 30), rnd(-90, -30) - (heavy ? 40 : 0), rnd(0.4, 0.8) * (heavy ? 1.3 : 1), rnd(5, 9) * (heavy ? 1.4 : 1), g.road.dust, 14, -20, false);
    }
  }
  if (g.nitroOn) {
    const ex = -P.wb / 2 - 20, ey = 6; const px = g.x + ex * c - ey * s, py = g.y + ex * s + ey * c;
    for (let k = 0; k < 3; k++) emit(g, px, py, -c * rnd(300, 520) + g.vx * 0.6 + rnd(-30, 30), -s * rnd(300, 520) + g.vy * 0.6 + rnd(-40, 40), rnd(0.15, 0.32), rnd(6, 10), Math.random() < 0.5 ? '#4cc9f0' : '#bdf2ff', -18, 0, true);
    if (Math.random() < 0.6) emit(g, px, py, -c * 160 + g.vx * 0.5, -s * 160 - 20, 0.7, 6, '#9aa8b8', 22, 0, false);
  }
  if (g.v.kind === 'diesel' && (g.thr || Math.random() < 0.15)) {
    const sx = 6, sy = -58; const px = g.x + sx * c - sy * s, py = g.y + sx * s + sy * c;
    emit(g, px, py, rnd(-40, -10) + g.vx * 0.3, rnd(-110, -60), rnd(0.6, 1.1), rnd(5, 8), '#585862', 16, 0, false);
  }
  if (g.hitT > 0.3 && Math.random() < 0.5) emit(g, g.x, g.y, rnd(-80, 80), rnd(-120, -40), 0.4, 3, '#ffd166', 0, 300, true);
}

function updateCamera(g, dt, W, H) {
  const base = Math.max(0.5, Math.min(H / 600, W / 820));
  const sp = Math.abs(g.vx);
  const zt = 1 - 0.1 * clamp(sp / 900, 0, 1) - (g.air > 0.4 ? 0.04 : 0);
  g.zoom += (zt - g.zoom) * Math.min(1, dt * 1.5);
  const sc = base * g.zoom; const vw = W / sc, vh = H / sc;
  const tx = g.x - vw * 0.3 + clamp(g.vx * 0.18, -60, 200); const ty = g.y - vh * 0.58;
  if (!g.camInit) { g.camX = tx; g.camY = ty; g.camInit = true; }
  else { g.camX += (tx - g.camX) * (1 - Math.exp(-6 * dt)); g.camY += (ty - g.camY) * (1 - Math.exp(-4 * dt)); }
  g.sc = sc; g.vw = vw; g.vh = vh;
}

function hudSnapshot(g, save) {
  const mm = MISSIONS.find((m) => !save.done[m.id] && !g.doneNow.includes(m.id));
  return {
    coins: save.coins + g.coins + g.rewardCoins, gems: save.gems + g.gems + g.rewardGems,
    dist: g.dist, score: scoreOf(g), fuel: g.fuel / g.P.fuelMax, nitro: g.nitro / g.P.nitroMax, health: g.health,
    speed: Math.hypot(g.vx, g.vy) * 0.1, level: g.level, combo: g.combo, mult: comboMul(g.combo), comboT: g.comboT,
    mission: mm ? { title: mm.title, cur: Math.min(mm.target, missionValue(g, save, mm)), target: mm.target } : null,
    nitroOn: g.nitroOn,
  };
}

function summaryOf(g, save) {
  return {
    reason: g.reason || 'crash', crashed: g.reason !== 'fuel', vehicle: g.v.id, road: g.road.name,
    distance: g.dist, score: scoreOf(g), coins: g.coins, gems: g.gems, bestDistance: save.best.distance, bestScore: save.best.score,
    newBest: g.dist > save.best.distance, rewardCoins: g.rewardCoins, rewardGems: g.rewardGems,
    missions: g.doneNow.map((id) => (MISSIONS.find((m) => m.id === id) || {}).title).filter(Boolean),
    flips: g.flips, wheelies: g.wheelies, level: g.level, coinPickups: g.coinPickups,
  };
}

/* =====================================================================
   RENDERING  -  drawing helpers and original vehicle illustrations
   (all vehicles are drawn in local space: origin = centre of mass, +x = forward)
   ===================================================================== */
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function fillRR(ctx, x, y, w, h, r, fill, stroke, lw) {
  rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function poly(ctx, pts, fill, stroke, lw) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function line(ctx, x1, y1, x2, y2, w, c) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.stroke();
}
function circ(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }

function drawWheel(ctx, x, y, r, ang, rim) {
  ctx.save(); ctx.translate(x, y);
  circ(ctx, 0, 0, r, '#14141b');
  ctx.rotate(ang);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
  ctx.lineWidth = r * 0.26; ctx.strokeStyle = '#363644'; ctx.setLineDash([r * 0.28, r * 0.34]); ctx.stroke(); ctx.setLineDash([]);
  circ(ctx, 0, 0, r * 0.56, rim);
  ctx.lineWidth = Math.max(2, r * 0.1); ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5); ctx.stroke(); }
  circ(ctx, 0, 0, r * 0.17, '#2b2b35'); circ(ctx, r * 0.2, -r * 0.02, r * 0.06, 'rgba(255,255,255,0.7)');
  ctx.restore();
}

const SKIN = '#f3c9a0';
function drawHeadHelmet(ctx, hx, hy, col, visor) {
  circ(ctx, hx, hy, 9.5, col);
  ctx.beginPath(); ctx.ellipse(hx + 4, hy + 1, 6, 4.2, 0, 0, Math.PI * 2); ctx.fillStyle = visor || '#1b2433'; ctx.fill();
  ctx.beginPath(); ctx.arc(hx - 2, hy - 3, 3, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
}
function drawNinjaHead(ctx, hx, hy, t, spd) {
  circ(ctx, hx, hy, 9.5, '#15151f');
  fillRR(ctx, hx - 1, hy - 3.5, 10, 5.5, 2.5, SKIN);
  circ(ctx, hx + 5, hy - 1, 1.6, '#fff'); circ(ctx, hx + 5.6, hy - 1, 0.8, '#111');
  line(ctx, hx - 9, hy - 5.5, hx + 9, hy - 5.5, 3.6, '#e63946');
  const fl = Math.sin(t * 24) * 3, ex = clamp(spd * 0.018, 3, 15);
  poly(ctx, [[hx - 9, hy - 7], [hx - 15 - ex, hy - 10 + fl], [hx - 12 - ex * 0.6, hy - 5 - fl * 0.5], [hx - 9, hy - 4]], '#e63946');
}
function drawRiderBike(ctx, v, o, sport) {
  const L = o.lean || 0; const ox = L * 7; const h = v.wb / 2;
  const suit = v.accent;
  const hip = [-18, -8]; const sh = sport ? [-4 + ox, -29] : [-8 + ox, -34];
  const head = [v.headX + ox, v.headY + (sport ? 3 : 0)];
  const hand = [h - 16, -22]; const knee = [4, -5]; const foot = [-2, 16];
  line(ctx, hip[0], hip[1], knee[0], knee[1], 10, suit); line(ctx, knee[0], knee[1], foot[0], foot[1], 8, suit);
  fillRR(ctx, foot[0] - 3, foot[1] - 1, 11, 6, 3, '#222');
  if (!sport) {
    const fl = Math.sin(o.t * 22) * 3, len = clamp(Math.abs(o.speed || 0) * 0.03, 6, 26);
    poly(ctx, [[sh[0] - 4, sh[1] - 2], [sh[0] - 8 - len, sh[1] + 2 + fl], [sh[0] - 6 - len * 0.6, sh[1] + 8 - fl], [sh[0] - 2, sh[1] + 6]], '#e63946');
  }
  line(ctx, hip[0], hip[1], sh[0], sh[1], 14, sport ? v.color : suit);
  const el = [(sh[0] + hand[0]) / 2 - 2, (sh[1] + hand[1]) / 2 + 7];
  line(ctx, sh[0], sh[1], el[0], el[1], 7, suit); line(ctx, el[0], el[1], hand[0], hand[1], 6, suit);
  circ(ctx, hand[0], hand[1], 4, '#222');
  if (sport) drawHeadHelmet(ctx, head[0], head[1], '#fff', '#14213d'); else drawNinjaHead(ctx, head[0], head[1], o.t, o.speed);
}

function drawBike(ctx, v, o) {
  const sport = v.kind === 'sport'; const h = v.wb / 2; const r = v.r; const cr = o.crashed;
  const x1 = h + (cr ? 10 : 0); const y0 = o.wy[0]; const y1 = o.wy[1] + (cr ? 8 : 0);
  const col = v.color; const acc = v.accent;
  drawWheel(ctx, -h, y0, r, o.wa, sport ? '#e9f7ff' : '#d8dce4');
  line(ctx, -h, y0, -8, 12, 6, '#454b59');
  line(ctx, -8, 16, -h - 6, y0 - 8, 6, '#9aa0ab');                   // exhaust
  line(ctx, -8, 12, h - 14, -14, 6, acc);                             // frame
  line(ctx, -8, 12, -24, -4, 6, acc);
  fillRR(ctx, -12, 2, 26, 20, 5, '#3a3f4c');
  circ(ctx, 1, 12, 4, '#6a7080');
  drawWheel(ctx, x1, y1, r, o.wa, sport ? '#e9f7ff' : '#d8dce4');
  line(ctx, h - 12, -18, x1, y1, 6, '#b8c0cc');                       // fork
  ctx.beginPath(); ctx.arc(x1, y1, r + 4, Math.PI * 1.15, Math.PI * 1.85); ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
  if (sport) {
    poly(ctx, [[-36, -8], [-20, -17], [-4, -16], [14, -8], [h - 6, -26], [h + 10, -12], [h + 8, 4], [h - 22, 6], [-8, 6]], col, acc, 2);
    line(ctx, -20, -8, h - 8, -8, 3, '#fff');
    poly(ctx, [[h - 18, -26], [h - 6, -34], [h - 2, -24]], 'rgba(190,235,255,0.8)');
    circ(ctx, h + 2, -10, 4, '#fff7c2');
  } else {
    poly(ctx, [[-26, -4], [-14, -15], [8, -15], [16, -4], [2, 5], [-24, 5]], col, '#8a1621', 2);
    fillRR(ctx, -32, -11, 24, 7, 3, acc);
    circ(ctx, h - 6, -12, 5, '#fff3b0');
  }
  line(ctx, h - 14, -20, h - 22, -26, 5, '#222');                     // handlebar
  if (o.rider) drawRiderBike(ctx, v, o, sport);
}

function drawQuad(ctx, v, o) {
  const h = v.wb / 2; const r = v.r; const cr = o.crashed; const col = v.color;
  const x1 = h + (cr ? 10 : 0); const y0 = o.wy[0]; const y1 = o.wy[1] + (cr ? 8 : 0);
  line(ctx, -h, y0, -18, 10, 8, '#555b66'); line(ctx, x1, y1, h - 16, 8, 8, '#555b66');
  poly(ctx, [[-36, -2], [-30, -14], [8, -16], [30, -8], [36, 4], [30, 17], [-30, 17]], col, '#8a4a00', 2);
  fillRR(ctx, -30, -22, 36, 9, 4, v.accent);
  drawWheel(ctx, -h, y0, r, o.wa, '#ffd166'); drawWheel(ctx, x1, y1, r, o.wa, '#ffd166');
  ctx.lineWidth = 7; ctx.strokeStyle = col; ctx.lineCap = 'round';
  [[-h, y0], [x1, y1]].forEach((w) => { ctx.beginPath(); ctx.arc(w[0], w[1], r + 5, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); });
  fillRR(ctx, -40, -14, 14, 6, 2, '#333');
  line(ctx, h - 22, -6, h - 26, -32, 5, '#333'); line(ctx, h - 32, -34, h - 18, -32, 5, '#222');
  circ(ctx, h - 4, -8, 5, '#fff3b0');
  if (o.rider) {
    const ox = (o.lean || 0) * 6; const hip = [-14, -18]; const sh = [-9 + ox, -38]; const hand = [h - 22, -32];
    line(ctx, hip[0], hip[1], 4, -6, 10, v.accent); line(ctx, 4, -6, 2, 14, 8, v.accent); fillRR(ctx, 0, 12, 12, 6, 3, '#222');
    line(ctx, hip[0], hip[1], sh[0], sh[1], 14, '#2a9d8f');
    line(ctx, sh[0], sh[1], (sh[0] + hand[0]) / 2, (sh[1] + hand[1]) / 2 + 6, 7, '#2a9d8f'); line(ctx, (sh[0] + hand[0]) / 2, (sh[1] + hand[1]) / 2 + 6, hand[0], hand[1], 6, '#2a9d8f');
    circ(ctx, hand[0], hand[1], 4, '#222');
    drawHeadHelmet(ctx, v.headX + ox, v.headY, '#ff4d6d', '#1b2433');
  }
}

function drawDriver(ctx, v, o, cap) {
  if (!o.rider) return;
  const hx = v.headX + (o.lean || 0) * 3; const hy = v.headY;
  line(ctx, hx - 1, hy + 8, hx - 3, hy + 24, 13, '#2a9d8f');
  if (cap) { circ(ctx, hx, hy, 8.5, SKIN); ctx.beginPath(); ctx.arc(hx, hy - 1, 9, Math.PI, Math.PI * 2); ctx.fillStyle = v.accent; ctx.fill(); fillRR(ctx, hx + 2, hy - 3, 11, 3.5, 1.5, v.accent); circ(ctx, hx + 4, hy + 1, 1.5, '#222'); }
  else drawHeadHelmet(ctx, hx, hy, '#fff', '#1b2433');
}
const GLASS = 'rgba(190,232,255,0.78)';

function drawRacer(ctx, v, o) {
  const h = v.wb / 2; const r = v.r; const cr = o.crashed; const col = v.color; const acc = v.accent;
  const x1 = h + (cr ? 10 : 0); const y0 = o.wy[0]; const y1 = o.wy[1] + (cr ? 8 : 0);
  line(ctx, -h - 6, 4, -h - 8, -20, 4, '#333');
  fillRR(ctx, -h - 24, -28, 34, 6, 3, acc);
  fillRR(ctx, -h - 24, -34, 4, 14, 2, col);
  poly(ctx, [[-h - 10, 14], [-h - 12, -2], [-h + 10, -8], [-10, -10], [10, -6], [h - 8, 2], [h + 16, 10], [h + 12, 16], [-h, 18]], col, '#9a6a00', 2);
  line(ctx, -h + 6, 5, h - 2, 5, 3, acc);
  ctx.beginPath(); ctx.ellipse(-4, -8, 17, 6, 0, 0, Math.PI * 2); ctx.fillStyle = '#1a1a26'; ctx.fill();
  circ(ctx, -26, 2, 7, '#fff'); circ(ctx, -26, 2, 4, acc);
  if (o.rider) { line(ctx, -5, -10, -4, -20, 11, '#d62839'); drawHeadHelmet(ctx, v.headX, v.headY + 4, '#d62839', '#1b2433'); }
  fillRR(ctx, h + 6, 12, 24, 5, 2, acc);
  drawWheel(ctx, -h, y0, r, o.wa, '#ffe08a'); drawWheel(ctx, x1, y1, r, o.wa, '#ffe08a');
  if (o.thr) poly(ctx, [[-h - 12, 4], [-h - 30 - Math.random() * 8, 7], [-h - 12, 10]], 'rgba(255,160,40,0.85)');
}

function drawJeep(ctx, v, o) {
  const h = v.wb / 2; const r = v.r; const cr = o.crashed; const col = v.color; const acc = v.accent;
  const x1 = h + (cr ? 10 : 0); const y0 = o.wy[0]; const y1 = o.wy[1] + (cr ? 8 : 0);
  circ(ctx, -h - 18, 2, 12, '#14141b'); circ(ctx, -h - 18, 2, 6, '#c9ced6');
  fillRR(ctx, -h - 14, -12, 126, 28, 7, col, '#2d5a2a', 2);
  poly(ctx, [[h - 20, -12], [h + 8, -12], [h + 16, 0], [h - 20, 0]], col);
  ctx.beginPath(); ctx.arc(-h, y0, r + 5, Math.PI, 0); ctx.fillStyle = '#17171e'; ctx.fill();
  ctx.beginPath(); ctx.arc(x1, y1, r + 5, Math.PI, 0); ctx.fill();
  drawDriver(ctx, v, o, true);
  line(ctx, -h + 4, -12, -h + 4, -44, 5, acc); line(ctx, -h + 4, -44, h - 40, -44, 5, acc); line(ctx, h - 40, -44, h - 36, -12, 5, acc);
  poly(ctx, [[h - 36, -14], [h - 38, -40], [h - 24, -38], [h - 18, -12]], GLASS, acc, 3);
  fillRR(ctx, h + 10, 4, 12, 7, 3, '#b8bfca'); circ(ctx, h + 12, -5, 5, '#fff3b0');
  line(ctx, -h + 10, 4, h + 8, 4, 3, acc);
  drawWheel(ctx, -h, y0, r, o.wa, '#cfd5dd'); drawWheel(ctx, x1, y1, r, o.wa, '#cfd5dd');
}

function drawTruck(ctx, v, o) {
  const h = v.wb / 2; const r = v.r; const cr = o.crashed; const col = v.color; const acc = v.accent;
  const x1 = h + (cr ? 10 : 0); const y0 = o.wy[0]; const y1 = o.wy[1] + (cr ? 8 : 0);
  fillRR(ctx, -h - 16, -10, 146, 26, 6, col, '#1d4fa5', 2);
  fillRR(ctx, -h - 14, -22, 62, 14, 3, acc);
  fillRR(ctx, -h - 6, -36, 22, 14, 3, '#c98a4b', '#7a4f22', 2); fillRR(ctx, -h + 20, -32, 18, 10, 3, '#d9a066', '#7a4f22', 2);
  poly(ctx, [[-6, -10], [-2, -42], [36, -44], [56, -26], [64, -10]], col, '#1d4fa5', 2);
  drawDriver(ctx, v, o, false);
  poly(ctx, [[2, -38], [34, -40], [50, -26], [2, -26]], GLASS, acc, 2.5);
  fillRR(ctx, h + 18, 6, 14, 8, 3, '#b8bfca'); circ(ctx, h + 22, -4, 5, '#fff3b0');
  ctx.beginPath(); ctx.arc(-h, y0, r + 5, Math.PI, 0); ctx.fillStyle = '#17171e'; ctx.fill();
  ctx.beginPath(); ctx.arc(x1, y1, r + 5, Math.PI, 0); ctx.fill();
  line(ctx, -h - 12, 14, -h - 22, 16, 5, '#9aa0ab');
  drawWheel(ctx, -h, y0, r, o.wa, '#d4d9e1'); drawWheel(ctx, x1, y1, r, o.wa, '#d4d9e1');
}

function drawMonster(ctx, v, o) {
  const h = v.wb / 2; const r = v.r; const cr = o.crashed; const col = v.color; const acc = v.accent;
  const x1 = h + (cr ? 10 : 0); const y0 = o.wy[0]; const y1 = o.wy[1] + (cr ? 8 : 0);
  [[-h + 2, y0, -h + 14], [x1 - 2, y1, h - 14]].forEach((s) => {
    line(ctx, s[0], s[1], s[2], -12, 7, '#7b818c');
    ctx.beginPath(); ctx.lineWidth = 3; ctx.strokeStyle = '#ffd166';
    for (let i = 0; i <= 8; i++) { const p = i / 8; const x = lerp(s[0], s[2], p) + (i % 2 ? 6 : -6); const y = lerp(s[1], -12, p); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
  });
  fillRR(ctx, -h - 6, -44, 128, 32, 11, col, '#5b2f99', 2);
  poly(ctx, [[-14, -44], [-8, -70], [34, -72], [52, -50], [58, -44]], col, '#5b2f99', 2);
  poly(ctx, [[-4, -66], [32, -68], [46, -50], [-6, -50]], GLASS, acc, 2.5);
  if (o.rider) drawHeadHelmet(ctx, v.headX, v.headY - 4, '#ffd166', '#1b2433');
  poly(ctx, [[-h + 6, -34], [-h + 30, -28], [-h + 6, -22]], '#ffb703'); poly(ctx, [[h - 40, -34], [h - 16, -28], [h - 40, -22]], '#ffb703');
  fillRR(ctx, h + 8, -30, 12, 9, 3, '#fff3b0'); fillRR(ctx, h + 4, -16, 18, 6, 3, '#b8bfca');
  drawWheel(ctx, -h, y0, r, o.wa, '#d6c3ff'); drawWheel(ctx, x1, y1, r, o.wa, '#d6c3ff');
}

function drawDiesel(ctx, v, o) {
  const h = v.wb / 2; const r = v.r; const cr = o.crashed; const col = v.color; const acc = v.accent;
  const x1 = h + (cr ? 10 : 0); const y0 = o.wy[0]; const y1 = o.wy[1] + (cr ? 8 : 0);
  fillRR(ctx, -h - 8, 6, 156, 10, 3, '#2d2d33');
  fillRR(ctx, -h + 2, 4, 40, 16, 8, '#c8ccd4', '#8f949e', 2);
  fillRR(ctx, 2, -18, 80, 30, 7, col, '#8f1d21', 2);
  fillRR(ctx, 76, -14, 9, 26, 3, '#d9dde3', '#7d838d', 2);
  for (let i = 0; i < 4; i++) line(ctx, 78, -8 + i * 6, 84, -8 + i * 6, 1.5, '#7d838d');
  fillRR(ctx, -54, -54, 58, 62, 7, col, '#8f1d21', 2);
  fillRR(ctx, -2, -52, 5, 36, 2, '#d9dde3'); fillRR(ctx, 8, -50, 5, 34, 2, '#d9dde3');
  drawDriver(ctx, v, o, true);
  fillRR(ctx, -46, -46, 38, 28, 5, GLASS, acc, 2.5);
  fillRR(ctx, 70, -4, 12, 7, 3, '#fff3b0');
  ctx.beginPath(); ctx.arc(-h, y0, r + 5, Math.PI, 0); ctx.fillStyle = '#17171e'; ctx.fill();
  ctx.beginPath(); ctx.arc(x1, y1, r + 5, Math.PI, 0); ctx.fill();
  drawWheel(ctx, -h, y0, r, o.wa, '#d4d9e1'); drawWheel(ctx, x1, y1, r, o.wa, '#d4d9e1');
  line(ctx, -h + 10, -20, -h + 10, -4, 3, acc);
}

function drawDamage(ctx, v) {
  const h = v.wb / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(20,20,24,0.4)'; ctx.beginPath(); ctx.ellipse(h - 10, -2, 18, 12, 0.3, 0, Math.PI * 2); ctx.fill();
  poly(ctx, [[h + 4, -10], [h + 24, -2], [h + 8, 8]], 'rgba(0,0,0,0.38)');
  ctx.strokeStyle = '#17171c'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-16, -12); ctx.lineTo(-8, -4); ctx.lineTo(-18, 2); ctx.lineTo(-6, 9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, -16); ctx.lineTo(18, -6); ctx.lineTo(8, 0); ctx.stroke();
  ctx.restore();
}

function drawVehicle(ctx, v, o) {
  ctx.save();
  switch (v.kind) {
    case 'bike': case 'sport': drawBike(ctx, v, o); break;
    case 'quad': drawQuad(ctx, v, o); break;
    case 'racer': drawRacer(ctx, v, o); break;
    case 'jeep': drawJeep(ctx, v, o); break;
    case 'truck': drawTruck(ctx, v, o); break;
    case 'monster': drawMonster(ctx, v, o); break;
    default: drawDiesel(ctx, v, o); break;
  }
  if (o.crashed) drawDamage(ctx, v);
  ctx.restore();
}

function drawRagdoll(ctx, r, v) {
  ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.a);
  const suit = v.kind === 'bike' ? v.accent : '#2a9d8f';
  line(ctx, 0, 6, -5, 22, 8, suit); line(ctx, 0, 6, 8, 20, 8, suit);
  line(ctx, 0, 6, 0, -8, 12, suit); line(ctx, 0, -6, -10, 4, 6, suit); line(ctx, 0, -6, 11, -2, 6, suit);
  circ(ctx, 0, -17, 9, v.kind === 'bike' ? '#15151f' : '#fff');
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(1, -20); ctx.lineTo(7, -14); ctx.moveTo(7, -20); ctx.lineTo(1, -14); ctx.stroke();
  ctx.restore();
}

/* =====================================================================
   RENDERING  -  worlds, terrain, collectibles, effects
   ===================================================================== */
function cloud(ctx, x, y, s, c) {
  ctx.fillStyle = c; ctx.beginPath();
  ctx.arc(x, y, 22 * s, 0, 6.3); ctx.arc(x + 26 * s, y - 9 * s, 28 * s, 0, 6.3); ctx.arc(x + 54 * s, y, 22 * s, 0, 6.3);
  ctx.rect(x, y - 2 * s, 54 * s, 22 * s); ctx.fill();
}
function ridge(ctx, W, H, sc, camX, f, baseY, fn, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H);
  for (let sx = 0; sx <= W + 20; sx += 18) ctx.lineTo(sx, baseY - fn(sx / sc + camX * f) * sc);
  ctx.lineTo(W + 20, H); ctx.closePath(); ctx.fill();
}
function peaks(ctx, W, sc, camX, f, baseY, color, cap, step, hMin, hVar, H) {
  const k0 = Math.floor((camX * f) / step) - 1; const k1 = k0 + Math.ceil(W / sc / step) + 3;
  for (let k = k0; k <= k1; k++) {
    const ax = (k * step + hash(k * 1.3) * step * 0.4 - camX * f) * sc; const ah = (hMin + hash(k * 2.9) * hVar) * sc; const hw = step * 0.62 * sc;
    poly(ctx, [[ax - hw, H], [ax - hw, baseY], [ax, baseY - ah], [ax + hw, baseY], [ax + hw, H]], color);
    if (cap) poly(ctx, [[ax - hw * 0.34, baseY - ah * 0.66], [ax, baseY - ah], [ax + hw * 0.34, baseY - ah * 0.66], [ax + hw * 0.1, baseY - ah * 0.72], [ax - hw * 0.1, baseY - ah * 0.6]], cap);
  }
}
function buildings(ctx, W, H, sc, camX, f, baseY, w, hMin, hVar, color, lit, seed) {
  const k0 = Math.floor((camX * f) / w) - 1; const k1 = k0 + Math.ceil(W / sc / w) + 3;
  for (let k = k0; k <= k1; k++) {
    const sx = (k * w - camX * f) * sc; const bh = (hMin + hash(k * 1.7 + seed) * hVar) * sc; const bw = w * sc * 0.92;
    ctx.fillStyle = color; ctx.fillRect(sx, baseY - bh, bw, H - baseY + bh);
    if (lit) {
      const cols = Math.max(2, Math.floor(w / 18)); const rows = Math.floor(bh / (16 * sc));
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        if (hash(k * 31.1 + j * 7.7 + i * 3.3 + seed) > 0.55) { ctx.fillStyle = 'rgba(255,214,120,0.8)'; ctx.fillRect(sx + (6 + i * 17) * sc * (w / 70), baseY - bh + (8 + j * 16) * sc, 7 * sc, 8 * sc); }
      }
    }
  }
}
function drawBackdrop(ctx, W, H, sc, camX, camY, ri, t) {
  const R = ROADS[ri];
  const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, R.skyTop); gr.addColorStop(1, R.skyBot);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  if (ri === 3 || ri === 4) for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + hash(i) * 0.5})`; ctx.fillRect(hash(i * 1.9) * W, hash(i * 4.1) * H * 0.4, 2, 2); }
  const sunX = W * (ri === 3 ? 0.7 : 0.8); const sunY = H * (ri === 3 ? 0.4 : 0.2);
  const glow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 110); glow.addColorStop(0, ri === 4 ? 'rgba(255,120,40,0.55)' : 'rgba(255,248,200,0.6)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(sunX - 120, sunY - 120, 240, 240);
  circ(ctx, sunX, sunY, ri === 4 ? 30 : 36, ri === 4 ? '#ffb38a' : ri === 3 ? '#ffd6a5' : '#fff3b0');
  const cc = ['rgba(255,255,255,0.85)', 'rgba(255,245,224,0.7)', 'rgba(255,255,255,0.92)', 'rgba(255,214,224,0.6)', 'rgba(58,26,26,0.75)'][ri];
  for (let i = 0; i < 7; i++) {
    let sx = ((i * 340 + hash(i * 3.1) * 140 - camX * 0.06 + t * 8) * sc) % (W + 500); if (sx < 0) sx += W + 500;
    cloud(ctx, sx - 250, H * 0.06 + hash(i * 5.3) * H * 0.26, (0.7 + hash(i * 7.7) * 0.8) * sc * 1.1, cc);
  }
  const o1 = -camY * sc * 0.04; const o2 = -camY * sc * 0.08;
  const b1 = H * 0.6 + o1; const b2 = H * 0.76 + o2;
  switch (ri) {
    case 0:
      ridge(ctx, W, H, sc, camX, 0.12, b1, (u) => 60 + 46 * Math.sin(u / 310 + 1) + 22 * Math.sin(u / 137 + 2), R.far);
      ridge(ctx, W, H, sc, camX, 0.26, b2, (u) => 40 + 34 * Math.sin(u / 200 + 3) + 14 * Math.sin(u / 83), R.mid); break;
    case 1:
      ridge(ctx, W, H, sc, camX, 0.12, b1, (u) => 50 + 60 * Math.abs(Math.sin(u / 420)), R.far);
      ridge(ctx, W, H, sc, camX, 0.26, b2, (u) => 30 + 50 * Math.abs(Math.sin(u / 260 + 1)), R.mid); break;
    case 2:
      peaks(ctx, W, sc, camX, 0.1, b1, R.far, '#ffffff', 360, 150, 100, H);
      ridge(ctx, W, H, sc, camX, 0.26, b2, (u) => 40 + 30 * Math.sin(u / 240) + 10 * Math.sin(u / 90), R.mid); break;
    case 3:
      buildings(ctx, W, H, sc, camX, 0.12, b1 + 20, 56, 80, 150, R.far, false, 1);
      buildings(ctx, W, H, sc, camX, 0.26, b2 + 10, 70, 60, 120, R.mid, true, 5); break;
    default:
      peaks(ctx, W, sc, camX, 0.1, b1 + 10, R.far, '#ff7b2e', 900, 220, 60, H);
      ridge(ctx, W, H, sc, camX, 0.26, b2, (u) => 40 + 34 * Math.abs(Math.sin(u / 130 + 1)) + 12 * Math.sin(u / 47), R.mid);
      ctx.fillStyle = 'rgba(255,90,20,0.12)'; ctx.fillRect(0, H * 0.55, W, H * 0.45); break;
  }
}

const TY = new Float32Array(600);
function drawDeco(ctx, k, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  switch (k) {
    case 'tree': fillRR(ctx, -5, -46, 10, 48, 3, '#7a4a21'); circ(ctx, 0, -62, 26, '#2f9e44'); circ(ctx, -16, -48, 17, '#37b24d'); circ(ctx, 16, -50, 18, '#2b8a3e'); break;
    case 'pine': fillRR(ctx, -4, -14, 8, 16, 2, '#6b4423'); poly(ctx, [[-26, -12], [0, -56], [26, -12]], '#2b8a3e'); poly(ctx, [[-20, -38], [0, -76], [20, -38]], '#37b24d'); break;
    case 'rock': poly(ctx, [[-22, 2], [-16, -16], [2, -22], [18, -12], [24, 2]], '#8d8d96', '#6b6b74', 2); poly(ctx, [[-8, -16], [2, -22], [10, -16]], '#b4b4bd'); break;
    case 'bush': circ(ctx, -12, -10, 12, '#2f9e44'); circ(ctx, 4, -14, 15, '#37b24d'); circ(ctx, 18, -8, 10, '#2b8a3e'); break;
    case 'cactus': fillRR(ctx, -7, -58, 14, 60, 7, '#3f9b4d', '#2d7a39', 2); fillRR(ctx, -24, -40, 9, 22, 4, '#3f9b4d'); fillRR(ctx, -24, -26, 18, 8, 4, '#3f9b4d'); fillRR(ctx, 15, -48, 9, 24, 4, '#3f9b4d'); fillRR(ctx, 6, -32, 18, 8, 4, '#3f9b4d'); break;
    case 'dryBush': ctx.strokeStyle = '#9a6b34'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(i * 5, -16, i * 9, -28 + Math.abs(i) * 3); ctx.stroke(); } break;
    case 'spine': fillRR(ctx, -4, -12, 8, 14, 2, '#5a3b22'); poly(ctx, [[-28, -10], [0, -52], [28, -10]], '#2f6f4f'); poly(ctx, [[-22, -34], [0, -76], [22, -34]], '#3a8a62'); poly(ctx, [[-10, -62], [0, -76], [10, -62]], '#fff'); poly(ctx, [[-16, -26], [0, -52], [16, -26], [6, -30], [-6, -24]], 'rgba(255,255,255,0.9)'); break;
    case 'srock': poly(ctx, [[-22, 2], [-16, -16], [2, -22], [18, -12], [24, 2]], '#7f93ad', '#5c6f89', 2); poly(ctx, [[-16, -16], [2, -22], [18, -12], [6, -14], [-6, -12]], '#fff'); break;
    case 'snowman': circ(ctx, 0, -14, 16, '#fff'); circ(ctx, 0, -38, 12, '#fff'); circ(ctx, -4, -40, 1.8, '#222'); circ(ctx, 4, -40, 1.8, '#222'); poly(ctx, [[0, -37], [12, -35], [0, -34]], '#f77f00'); fillRR(ctx, -9, -54, 18, 5, 2, '#e63946'); break;
    case 'lamp': fillRR(ctx, -3, -78, 6, 80, 2, '#3b4252'); fillRR(ctx, -3, -80, 22, 5, 2, '#3b4252'); circ(ctx, 16, -72, 5, '#ffe9a8'); { const g = ctx.createRadialGradient(16, -70, 2, 16, -70, 40); g.addColorStop(0, 'rgba(255,230,150,0.5)'); g.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = g; ctx.fillRect(-30, -110, 90, 90); } break;
    case 'cone': poly(ctx, [[-10, 0], [-4, -26], [4, -26], [10, 0]], '#ff7b2e'); line(ctx, -7, -12, 7, -12, 4, '#fff'); fillRR(ctx, -12, -2, 24, 5, 2, '#d65a12'); break;
    case 'sign': fillRR(ctx, -2, -50, 4, 52, 1, '#8d93a3'); fillRR(ctx, -20, -64, 40, 20, 4, '#2f80ed', '#fff', 2); line(ctx, -10, -54, 10, -54, 3, '#fff'); break;
    case 'ac': fillRR(ctx, -18, -26, 36, 26, 3, '#aab1c0', '#7d8596', 2); circ(ctx, 0, -13, 9, '#6c7488'); ctx.strokeStyle = '#d3d8e2'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-8, -13); ctx.lineTo(8, -13); ctx.moveTo(0, -21); ctx.lineTo(0, -5); ctx.stroke(); break;
    case 'deadtree': ctx.strokeStyle = '#2b1d1d'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -50); ctx.moveTo(0, -30); ctx.lineTo(-18, -52); ctx.moveTo(0, -40); ctx.lineTo(16, -62); ctx.moveTo(-12, -46); ctx.lineTo(-24, -48); ctx.stroke(); break;
    case 'hotrock': poly(ctx, [[-24, 2], [-18, -20], [2, -26], [20, -14], [26, 2]], '#2a1a1a', '#120b0b', 2); ctx.strokeStyle = `rgba(255,${110 + Math.sin(t * 4) * 40},30,0.9)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(0, -14); ctx.lineTo(8, -6); ctx.stroke(); break;
    case 'vent': poly(ctx, [[-22, 2], [-10, -14], [10, -14], [22, 2]], '#2a1a1a'); { const g = ctx.createRadialGradient(0, -14, 1, 0, -14, 22); g.addColorStop(0, 'rgba(255,140,40,0.9)'); g.addColorStop(1, 'rgba(255,60,20,0)'); ctx.fillStyle = g; ctx.fillRect(-24, -38, 48, 48); } break;
    default: { const fl = Math.sin(t * 9 + x) * 4; poly(ctx, [[-10, 2], [-12, -14 + fl], [-4, -26], [0, -16], [6, -34 - fl], [12, -12], [10, 2]], '#ff7b2e'); poly(ctx, [[-5, 2], [-4, -10], [0, -20], [5, -8], [5, 2]], '#ffd166'); }
  }
  ctx.restore();
}

function drawTerrain(ctx, ri, camX, camY, vw, vh, t, ice) {
  const R = ROADS[ri]; const x0 = camX - 24; const x1 = camX + vw + 24; const bottom = camY + vh + 80;
  let n = 0;
  for (let x = x0; x <= x1 && n < 599; x += 12) { TY[n++] = terrainY(x, ri); }
  const path = (off, wob) => { ctx.beginPath(); for (let i = 0; i < n; i++) { const x = x0 + i * 12; const y = TY[i] + off + (wob ? Math.sin(x / 60 + off) * 5 : 0); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } };
  ctx.beginPath(); ctx.moveTo(x0, bottom);
  for (let i = 0; i < n; i++) ctx.lineTo(x0 + i * 12, TY[i]);
  ctx.lineTo(x0 + (n - 1) * 12, bottom); ctx.closePath();
  const gr = ctx.createLinearGradient(0, camY, 0, camY + vh); gr.addColorStop(0, R.dirt1); gr.addColorStop(1, R.dirt2);
  ctx.fillStyle = gr; ctx.fill();
  ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
  if (ri === 3) {
    ctx.setLineDash([14, 26]); ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(255,214,120,0.3)';
    for (let k = 1; k <= 3; k++) { path(40 * k, false); ctx.stroke(); }
    ctx.setLineDash([]);
  } else {
    ctx.lineWidth = 6; ctx.strokeStyle = ri === 4 ? 'rgba(255,110,30,0.75)' : 'rgba(40,20,5,0.22)';
    if (ri === 4) ctx.setLineDash([30, 50]);
    for (let k = 1; k <= 3; k++) { path(k * 34, true); ctx.stroke(); }
    ctx.setLineDash([]);
  }
  path(5, false); ctx.lineWidth = ri === 2 ? 22 : 17; ctx.strokeStyle = R.top; ctx.stroke();
  if (ri === 3) { ctx.setLineDash([22, 18]); path(2, false); ctx.lineWidth = 3; ctx.strokeStyle = R.top2; ctx.stroke(); ctx.setLineDash([]); }
  else { path(-2, false); ctx.lineWidth = ri === 4 ? 3 : 5; ctx.strokeStyle = ri === 4 ? 'rgba(255,123,46,0.85)' : R.top2; ctx.stroke(); }
  if (ri === 0) { ctx.strokeStyle = '#3f9d35'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < n; i += 2) { const x = x0 + i * 12; ctx.moveTo(x, TY[i] - 3); ctx.lineTo(x - 2, TY[i] - 9); } ctx.stroke(); }
  if (ri === 2 && ice.length) {
    for (let z = 0; z < ice.length; z++) {
      const zz = ice[z]; if (zz.x1 < x0 || zz.x0 > x1) continue;
      ctx.beginPath(); let first = true;
      for (let x = Math.max(zz.x0, x0); x <= Math.min(zz.x1, x1); x += 12) { const y = terrainY(x, ri) - 4; if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); }
      ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(150,215,255,0.95)'; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.translate(0, -3); ctx.stroke(); ctx.translate(0, 3);
    }
  }
  const dk = R.deco; const i0 = Math.floor(x0 / 190); const i1 = Math.ceil(x1 / 190);
  for (let i = i0; i <= i1; i++) {
    if (hash(i * 1.7 + ri * 31.3) > 0.58) continue;
    const x = i * 190 + hash(i * 3.3) * 120; const kind = dk[Math.floor(hash(i * 5.1 + ri) * dk.length)];
    drawDeco(ctx, kind, x, terrainY(x, ri) + 3, 0.8 + hash(i * 9.1) * 0.6, t);
  }
}

function drawItems(ctx, g, t) {
  const x0 = g.camX - 50; const x1 = g.camX + g.vw + 50;
  for (let i = 0; i < g.items.length; i++) {
    const it = g.items[i]; if (it.got || it.x < x0 || it.x > x1) continue;
    const bob = Math.sin(t * 3 + it.ph) * 3;
    ctx.save(); ctx.translate(it.x, it.y + bob);
    if (it.k === 'coin') {
      ctx.scale(Math.max(0.18, Math.abs(Math.cos(t * 4 + it.ph))), 1);
      circ(ctx, 0, 0, 13, '#b8860b'); circ(ctx, 0, 0, 10.5, '#ffd60a');
      ctx.lineWidth = 2; ctx.strokeStyle = '#fff1a8'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 6.3); ctx.stroke();
    } else if (it.k === 'gem') {
      const g2 = ctx.createRadialGradient(0, 0, 2, 0, 0, 30); g2.addColorStop(0, 'rgba(255,112,166,0.6)'); g2.addColorStop(1, 'rgba(255,112,166,0)'); ctx.fillStyle = g2; ctx.fillRect(-30, -30, 60, 60);
      poly(ctx, [[0, -16], [14, -4], [0, 16], [-14, -4]], '#ff4d8d', '#fff', 2); poly(ctx, [[0, -16], [5, -4], [0, 16], [-5, -4]], '#ff9ec4');
      poly(ctx, [[-14, -4], [0, -16], [14, -4], [5, -4], [-5, -4]], '#ffc2da');
    } else {
      fillRR(ctx, -11, -14, 22, 28, 4, '#e63946', '#8a1621', 2); fillRR(ctx, -5, -19, 10, 7, 2, '#ffd166');
      poly(ctx, [[0, -8], [5, 0], [0, 6], [-5, 0]], '#fff');
    }
    ctx.restore();
  }
}

function drawObstacle(ctx, o, t) {
  const gy = o.y + o.r * 0.75;
  switch (o.k) {
    case 'iceblock': ctx.save(); ctx.translate(o.x, gy); poly(ctx, [[-22, 2], [-18, -26], [2, -34], [22, -20], [24, 2]], 'rgba(170,225,255,0.92)', '#e8f6ff', 2); poly(ctx, [[-10, -22], [2, -32], [8, -14]], 'rgba(255,255,255,0.75)'); ctx.restore(); break;
    case 'barrier': ctx.save(); ctx.translate(o.x, gy); fillRR(ctx, -22, -28, 44, 14, 3, '#fff', '#c1121f', 2); for (let i = -2; i <= 1; i++) poly(ctx, [[i * 10 + 2, -28], [i * 10 + 10, -28], [i * 10 + 4, -14], [i * 10 - 4, -14]], '#e63946'); fillRR(ctx, -18, -14, 4, 14, 1, '#555'); fillRR(ctx, 14, -14, 4, 14, 1, '#555'); ctx.restore(); break;
    case 'crate': ctx.save(); ctx.translate(o.x, gy); fillRR(ctx, -20, -40, 40, 40, 3, '#c98a4b', '#7a4f22', 3); line(ctx, -20, -40, 20, 0, 3, '#7a4f22'); line(ctx, 20, -40, -20, 0, 3, '#7a4f22'); ctx.restore(); break;
    case 'cactus': drawDeco(ctx, 'cactus', o.x, gy + 2, 0.6, t); break;
    case 'cone': drawDeco(ctx, 'cone', o.x, gy, 1.2, t); break;
    case 'hotrock': drawDeco(ctx, 'hotrock', o.x, gy + 2, 1, t); break;
    case 'fire': drawDeco(ctx, 'fire', o.x, gy, 1.4, t); break;
    default: drawDeco(ctx, 'rock', o.x, gy + 2, o.r / 22, t);
  }
}

function drawParticles(ctx, g) {
  for (let pass = 0; pass < 2; pass++) {
    ctx.globalCompositeOperation = pass ? 'lighter' : 'source-over';
    for (let i = 0; i < g.parts.length; i++) {
      const p = g.parts[i]; if (p.life <= 0 || p.add !== (pass === 1)) continue;
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1) * (pass ? 1 : 0.8);
      ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.s), 0, 6.3); ctx.fill();
    }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

function drawWeather(ctx, g, W, H, t) {
  const ri = g.ri; if (ri !== 1 && ri !== 2 && ri !== 4) return;
  for (let i = 0; i < g.weather.length; i++) {
    const p = g.weather[i]; const x = p.u * W; const y = p.v * H;
    if (ri === 2) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x, y, 1.4 + p.s * 2.2, 0, 6.3); ctx.fill(); }
    else if (ri === 1) { ctx.fillStyle = 'rgba(236,208,154,0.55)'; ctx.fillRect(x, y, 6 + p.s * 14, 1.6); }
    else { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,${120 + p.s * 80},40,0.85)`; ctx.beginPath(); ctx.arc(x, y, 1.2 + p.s * 2, 0, 6.3); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  }
}

function renderGame(ctx, g, W, H, dpr, t) {
  const sc = g.sc;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawBackdrop(ctx, W, H, sc, g.camX, g.camY, g.ri, t);
  const shx = g.shake > 0 ? (Math.random() - 0.5) * g.shake * 8 : 0; const shy = g.shake > 0 ? (Math.random() - 0.5) * g.shake * 8 : 0;
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, (-g.camX * sc + shx) * dpr, (-g.camY * sc + shy) * dpr);
  drawTerrain(ctx, g.ri, g.camX, g.camY, g.vw, g.vh, t, g.ice);
  drawItems(ctx, g, t);
  for (let i = 0; i < g.obst.length; i++) { const o = g.obst[i]; if (!o.dead && o.x > g.camX - 80 && o.x < g.camX + g.vw + 80) drawObstacle(ctx, o, t); }
  for (let i = 0; i < g.fall.length; i++) {
    const f = g.fall[i]; const gy = terrainY(f.x, g.ri);
    ctx.strokeStyle = `rgba(255,90,40,${0.4 + Math.sin(t * 14) * 0.2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(f.x, gy, 26, 7, 0, 0, 6.3); ctx.stroke();
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); poly(ctx, [[-17, 2], [-10, -16], [8, -17], [18, -2], [8, 15], [-10, 14]], '#2a1a1a', '#ff7b2e', 3); ctx.restore();
    ctx.globalCompositeOperation = 'lighter'; circ(ctx, f.x, f.y - 22, 9, 'rgba(255,140,40,0.6)'); ctx.globalCompositeOperation = 'source-over';
  }
  const P = g.P;
  if (!g.crashed || g.crashT < 99) {
    const gyb = terrainY(g.x, g.ri);
    if (g.wg[0] || g.wg[1]) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(g.x, gyb + 5, P.wb * 0.6, 5, 0, 0, 6.3); ctx.fill(); }
  }
  ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.a);
  const o = { wy: [P.hubY + P.L0 - g.cv[0], P.hubY + P.L0 - g.cv[1]], wa: g.wa, lean: g.lean, t, crashed: g.crashed, rider: !g.crashed, thr: g.thr, speed: g.vx };
  if (g.nitroOn) { ctx.globalCompositeOperation = 'lighter'; poly(ctx, [[-P.wb / 2 - 8, 2], [-P.wb / 2 - 40 - Math.random() * 22, 6], [-P.wb / 2 - 8, 12]], 'rgba(80,200,255,0.85)'); ctx.globalCompositeOperation = 'source-over'; }
  drawVehicle(ctx, g.v, o);
  if (g.hitT > 0) { ctx.globalAlpha = g.hitT; ctx.fillStyle = 'rgba(255,60,60,0.35)'; ctx.beginPath(); ctx.arc(0, -10, P.wb * 0.65, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
  if (g.rider) drawRagdoll(ctx, g.rider, g.v);
  drawParticles(ctx, g);
  ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  for (let i = 0; i < g.pops.length; i++) {
    const q = g.pops[i]; ctx.globalAlpha = clamp(q.life / Math.min(0.5, q.max), 0, 1);
    ctx.font = '900 20px "Trebuchet MS", "Segoe UI", sans-serif'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,20,40,0.85)'; ctx.strokeText(q.text, q.x, q.y); ctx.fillStyle = q.color; ctx.fillText(q.text, q.x, q.y);
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawWeather(ctx, g, W, H, t);
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (g.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${g.flash * 0.5})`; ctx.fillRect(0, 0, W, H); }
}

/* Attract-mode scene behind the menus */
function renderMenuScene(ctx, W, H, dpr, t, ri, v) {
  const R = ROADS[ri]; const sc = Math.max(0.5, Math.min(H / 600, W / 820)) * 0.95;
  const vw = W / sc, vh = H / sc; const camX = 400 + ((t * 150) % 40000);
  const carX = camX + vw * 0.3; const P = buildParams(v, null);
  const camY = terrainY(carX, ri) - vh * 0.64;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawBackdrop(ctx, W, H, sc, camX, camY, ri, t);
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, -camX * sc * dpr, -camY * sc * dpr);
  drawTerrain(ctx, ri, camX, camY, vw, vh, t, []);
  const yr = terrainY(carX - P.wb / 2, ri), yf = terrainY(carX + P.wb / 2, ri);
  ctx.save(); ctx.translate(carX, (yr + yf) / 2 - (P.r + P.hubY + P.L0 - 13)); ctx.rotate(Math.atan2(yf - yr, P.wb));
  drawVehicle(ctx, v, { wy: [P.hubY + P.L0 - 13, P.hubY + P.L0 - 13], wa: (t * 150) / P.r, lean: 0.4, t, crashed: false, rider: true, thr: true, speed: 300 });
  ctx.restore();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const vg = ctx.createLinearGradient(0, 0, 0, H); vg.addColorStop(0, 'rgba(10,14,40,0.55)'); vg.addColorStop(1, 'rgba(10,14,40,0.8)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  return R;
}

/* Static preview painters (used by cards, no animation loop) */
function paintVehiclePreview(canvas, v, crashed) {
  if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  const W = canvas.width, H = canvas.height; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  const sc = Math.min(W / (v.wb + v.r * 2 + 100), H / (v.r * 2 + 150));
  const wy = v.L0 + 12 - 6;
  ctx.translate(W / 2, H * 0.6); ctx.scale(sc, sc);
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(0, wy + v.r + 2, v.wb * 0.7, 7, 0, 0, 6.3); ctx.fill();
  if (crashed) {
    ctx.save(); ctx.translate(0, -8); ctx.rotate(2.75); drawVehicle(ctx, v, { wy: [wy, wy], wa: 0.7, lean: 0, t: 0, crashed: true, rider: false, thr: false, speed: 0 }); ctx.restore();
    drawRagdoll(ctx, { x: v.wb * 0.75, y: wy + v.r - 12, a: 1.45 }, v);
    [[-30, -50, 16], [-14, -76, 20], [8, -104, 24]].forEach((s) => circ(ctx, s[0], s[1], s[2], 'rgba(70,70,80,0.55)'));
    ctx.globalCompositeOperation = 'lighter'; [[-40, 10], [30, -6], [-10, 22]].forEach((s) => circ(ctx, s[0], s[1], 5, 'rgba(255,170,40,0.9)')); ctx.globalCompositeOperation = 'source-over';
  } else {
    drawVehicle(ctx, v, { wy: [wy, wy], wa: 0.4, lean: 0.3, t: 0.2, crashed: false, rider: true, thr: false, speed: 200 });
  }
}
function paintRoadPreview(canvas, ri) {
  if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  const W = canvas.width, H = canvas.height; const sc = H / 380; const vw = W / sc, vh = H / sc;
  const camX = 560; const camY = terrainY(camX + vw * 0.4, ri) - vh * 0.7;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawBackdrop(ctx, W, H, sc, camX, camY, ri, 0);
  ctx.setTransform(sc, 0, 0, sc, -camX * sc, -camY * sc);
  drawTerrain(ctx, ri, camX, camY, vw, vh, 0, ri === 2 ? [{ x0: camX + vw * 0.35, x1: camX + vw * 0.7 }] : []);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/* =====================================================================
   UI COMPONENTS
   ===================================================================== */
const vehStats = (v) => [
  ['Speed', v.maxSpeed / 1000], ['Acceleration', v.accel / 1060], ['Stability', v.stab / 1.4], ['Weight', v.weight / 2.6],
  ['Jump', v.jump / 540], ['Suspension', v.travel / 46], ['Fuel', v.fuel / 1.7],
];

function VehicleArt({ v, crashed, className }) {
  const ref = useRef(null);
  useEffect(() => { paintVehiclePreview(ref.current, v, !!crashed); }, [v, crashed]);
  return <canvas ref={ref} className={className || 'nhr-art'} width={360} height={210} aria-label={`${v.name} illustration`} />;
}
function RoadArt({ ri }) {
  const ref = useRef(null);
  useEffect(() => { paintRoadPreview(ref.current, ri); }, [ri]);
  return <canvas ref={ref} className="nhr-art nhr-road-art" width={420} height={220} aria-label={`${ROADS[ri].name} preview`} />;
}
function Bar({ label, pct, tone }) {
  return (
    <div className="nhr-stat">
      <span>{label}</span>
      <div className="nhr-bar"><b className={tone || ''} style={{ width: `${clamp(pct, 0, 1) * 100}%` }} /></div>
      <em>{Math.round(clamp(pct, 0, 1) * 100)}</em>
    </div>
  );
}
function TouchBtn({ id, label, cls, touchRef }) {
  const [on, setOn] = useState(false);
  const press = (e) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    touchRef.current[id] = true; setOn(true);
  };
  const release = () => { touchRef.current[id] = false; setOn(false); };
  return (
    <div role="button" aria-label={label} className={`nhr-tbtn nhr-${cls} ${on ? 'nhr-on' : ''}`}
      onPointerDown={press} onPointerUp={release} onPointerLeave={release} onPointerCancel={release}
      onLostPointerCapture={release} onContextMenu={(e) => e.preventDefault()}>
      <span>{label}</span>
    </div>
  );
}

/* =====================================================================
   MAIN COMPONENT
   ===================================================================== */
export default function NinjaHillRide() {
  const [save, setSave] = useState(loadSave);
  const [screen, setScreenState] = useState('menu');
  const [hud, setHud] = useState(null);
  const [paused, setPausedState] = useState(false);
  const [summary, setSummary] = useState(null);
  const [toast, setToast] = useState(null);
  const [garageVeh, setGarageVeh] = useState(() => loadSave().vehicle);
  const [confirmReset, setConfirmReset] = useState(false);

  const saveRef = useRef(save);
  const screenRef = useRef('menu');
  const gRef = useRef(null);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const sizeRef = useRef({ W: 800, H: 450, dpr: 1 });
  const keysRef = useRef(new Set());
  const touchRef = useRef({ gas: false, brake: false, jump: false, nitro: false });
  const audioRef = useRef(null);
  const toastTimer = useRef(0);
  const cbRef = useRef({});

  const getAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = createAudio(() => saveRef.current.settings);
    return audioRef.current;
  }, []);
  const ui = useCallback((n) => { const a = getAudio(); a.ensure(); a.sfx(n || 'ui'); }, []);
  const commit = useCallback((mut) => {
    const next = mut(saveRef.current); saveRef.current = next; setSave(next); persistSave(next);
  }, []);
  const setScreen = useCallback((s) => {
    screenRef.current = s; keysRef.current.clear();
    touchRef.current.gas = false; touchRef.current.brake = false; touchRef.current.jump = false; touchRef.current.nitro = false;
    setScreenState(s);
  }, []);
  const showToast = useCallback((msg, kind) => {
    setToast({ msg, kind: kind || 'info', id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  /* ---------- run lifecycle ---------- */
  const startRun = useCallback(() => {
    const s = saveRef.current; const g = makeRun(s, s.vehicle, s.road);
    gRef.current = g; setSummary(null); setPausedState(false);
    setHud(hudSnapshot(g, s)); setScreen('playing');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const a = getAudio(); a.ensure(); if (s.settings.music) a.startMusic();
  }, []);

  const finishRun = useCallback((g, showSummary) => {
    if (!g || g.ended) return;
    g.ended = true;
    const sm = summaryOf(g, saveRef.current);
    commit((s) => {
      const mp = { ...s.mp }; const add = (k, v) => { mp[k] = (mp[k] || 0) + v; };
      add('coins', g.coinPickups); add('dist', g.dist); add('flips', g.flips); add('nitro', g.nitroUses);
      add('gems', g.gemPickups); add('wheelies', g.wheelies); add('perfect', g.perfects);
      const done = { ...s.done }; g.doneNow.forEach((id) => { done[id] = true; });
      return {
        ...s, coins: s.coins + g.coins + g.rewardCoins, gems: s.gems + g.gems + g.rewardGems, mp, done, runs: s.runs + 1,
        best: { distance: Math.max(s.best.distance, g.dist), score: Math.max(s.best.score, scoreOf(g)) },
      };
    });
    if (showSummary) { setSummary(sm); setScreen('crashed'); } else setScreen('menu');
  }, []);

  const restart = useCallback(() => {
    const g = gRef.current;
    if (g && !g.ended) finishRun(g, false);
    startRun();
  }, []);
  const togglePause = useCallback(() => {
    const g = gRef.current;
    if (!g || screenRef.current !== 'playing' || g.over) return;
    g.paused = !g.paused; keysRef.current.clear(); setPausedState(g.paused);
  }, []);
  const goHome = useCallback(() => {
    const g = gRef.current;
    if (g && !g.ended) finishRun(g, false); else setScreen('menu');
  }, []);
  const goGarage = useCallback(() => { setGarageVeh(saveRef.current.vehicle); setScreen('garage'); }, []);

  cbRef.current = {
    togglePause, restart, finish: finishRun,
    autoPause: () => { const g = gRef.current; if (screenRef.current === 'playing' && g && !g.paused && !g.over) { g.paused = true; setPausedState(true); } },
    flush: () => { const g = gRef.current; if (screenRef.current === 'playing' && g && !g.ended) finishRun(g, false); },
  };

  /* ---------- shop actions ---------- */
  const unlockVehicle = (v) => {
    const s = saveRef.current;
    if (s.vehicles.includes(v.id)) return;
    if (s.coins < v.price) { showToast('Not enough coins!', 'bad'); ui('error'); return; }
    commit((q) => ({ ...q, coins: q.coins - v.price, vehicles: [...q.vehicles, v.id] }));
    showToast(`${v.name} unlocked!`, 'good'); ui('unlock');
  };
  const selectVehicle = (v) => {
    if (!saveRef.current.vehicles.includes(v.id)) { showToast('Unlock this vehicle first', 'bad'); ui('error'); return; }
    commit((q) => ({ ...q, vehicle: v.id })); setGarageVeh(v.id); ui('ui');
  };
  const unlockRoad = (r) => {
    const s = saveRef.current;
    if (s.roads.includes(r.id)) return;
    if (s.coins < r.price) { showToast('Not enough coins!', 'bad'); ui('error'); return; }
    commit((q) => ({ ...q, coins: q.coins - r.price, roads: [...q.roads, r.id] }));
    showToast(`${r.name} unlocked!`, 'good'); ui('unlock');
  };
  const selectRoad = (r) => {
    if (!saveRef.current.roads.includes(r.id)) { showToast('Unlock this road first', 'bad'); ui('error'); return; }
    commit((q) => ({ ...q, road: r.id })); ui('ui');
  };
  const buyUpgrade = (vid, u) => {
    const s = saveRef.current; const lvl = (s.upgrades[vid] && s.upgrades[vid][u.key]) || 0;
    if (lvl >= MAX_UPGRADE) return;
    const price = upgradePrice(u, lvl);
    if (s.coins < price) { showToast('Not enough coins!', 'bad'); ui('error'); return; }
    commit((q) => {
      const cur = { ...(q.upgrades[vid] || {}) }; cur[u.key] = lvl + 1;
      return { ...q, coins: q.coins - price, upgrades: { ...q.upgrades, [vid]: cur } };
    });
    showToast(`${u.name} upgraded to level ${lvl + 1}`, 'good'); ui('unlock');
  };
  const exchangeGem = () => {
    if (saveRef.current.gems < 1) { showToast('You have no gems', 'bad'); ui('error'); return; }
    commit((q) => ({ ...q, gems: q.gems - 1, coins: q.coins + 200 })); showToast('1 gem exchanged for 200 coins', 'good'); ui('coin');
  };
  const dailyInfo = () => {
    const d = saveRef.current.daily; const today = todayKey();
    const ready = d.last !== today;
    const next = d.last === yesterdayKey() ? d.streak + 1 : d.last === today ? d.streak : 1;
    return { ready, streak: next, coins: 150 + 100 * Math.min(next, 7), gems: next % 7 === 0 ? 3 : 0 };
  };
  const claimDaily = () => {
    const info = dailyInfo(); if (!info.ready) return;
    commit((q) => ({ ...q, coins: q.coins + info.coins, gems: q.gems + info.gems, daily: { last: todayKey(), streak: info.streak } }));
    showToast(`Daily reward: +${info.coins} coins${info.gems ? ` +${info.gems} gems` : ''}`, 'good'); ui('mission');
  };
  const setSetting = (patch) => {
    commit((q) => ({ ...q, settings: { ...q.settings, ...patch } }));
    const a = getAudio();
    if (patch.volume !== undefined) a.setVolume(patch.volume);
    if (patch.music === true) { a.ensure(); a.startMusic(); }
  };
  const resetProgress = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    const d = defaultSave(); saveRef.current = d; setSave(d); persistSave(d); setConfirmReset(false); setGarageVeh('ninja'); showToast('Progress reset', 'info');
  };

  /* ---------- canvas sizing ---------- */
  useEffect(() => {
    const wrap = wrapRef.current; const cvs = canvasRef.current;
    const resize = () => {
      const r = wrap.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.max(200, Math.floor(r.width)); const H = Math.max(200, Math.floor(r.height));
      sizeRef.current = { W, H, dpr };
      cvs.width = Math.floor(W * dpr); cvs.height = Math.floor(H * dpr);
      cvs.style.width = `${W}px`; cvs.style.height = `${H}px`;
    };
    resize();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(resize); ro.observe(wrap); }
    window.addEventListener('resize', resize);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', resize); };
  }, []);

  /* ---------- keyboard + lifecycle listeners (registered exactly once) ---------- */
  useEffect(() => {
    const GK = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS'];
    const clearInput = () => {
      keysRef.current.clear();
      const t = touchRef.current; t.gas = false; t.brake = false; t.jump = false; t.nitro = false;
    };
    const down = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const sc = screenRef.current; const code = e.code; const inGame = sc === 'playing' || sc === 'crashed';
      if (inGame && GK.includes(code)) e.preventDefault();
      if (code === 'KeyP' || code === 'Escape') { if (sc === 'playing' && !e.repeat) cbRef.current.togglePause(); return; }
      if (code === 'KeyR') { if (inGame) { e.preventDefault(); if (!e.repeat) cbRef.current.restart(); } return; }
      if (sc === 'playing' && GK.includes(code)) keysRef.current.add(code);
    };
    const up = (e) => {
      if (screenRef.current === 'playing' && GK.includes(e.code)) e.preventDefault();
      keysRef.current.delete(e.code);
    };
    const vis = () => { if (document.hidden) { clearInput(); cbRef.current.autoPause(); } };
    const blur = () => { clearInput(); cbRef.current.autoPause(); };
    const unlock = () => { const a = getAudio(); if (a.ensure() && saveRef.current.settings.music) a.startMusic(); };
    const hide = () => cbRef.current.flush();
    window.addEventListener('keydown', down, { passive: false });
    window.addEventListener('keyup', up, { passive: false });
    window.addEventListener('blur', blur);
    window.addEventListener('pagehide', hide);
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur); window.removeEventListener('pagehide', hide);
      window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);

  /* ---------- the single game loop ---------- */
  useEffect(() => {
    const cvs = canvasRef.current; const ctx = cvs.getContext('2d');
    let raf = 0; let last = performance.now(); let acc = 0; let hudT = 0; let clock = 0;
    const readInput = () => {
      const k = keysRef.current; const t = touchRef.current;
      return {
        gas: k.has('ArrowRight') || k.has('KeyD') || t.gas, brake: k.has('ArrowLeft') || k.has('KeyA') || t.brake,
        jump: k.has('ArrowUp') || k.has('KeyW') || t.jump, balance: k.has('ArrowDown') || k.has('KeyS'), nitro: k.has('Space') || t.nitro,
      };
    };
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (dt <= 0) return;
      clock += dt;
      const { W, H, dpr } = sizeRef.current; const sc = screenRef.current; const g = gRef.current; const save = saveRef.current; const audio = audioRef.current;
      if ((sc === 'playing' || sc === 'crashed') && g) {
        updateCamera(g, dt, W, H);
        if (sc === 'playing' && !g.paused) {
          const inp = readInput();
          acc += dt; let n = 0;
          while (acc >= STEP && n < 8) { physStep(g, inp, STEP); acc -= STEP; n++; }
          if (n >= 8) acc = 0;
          gameplay(g, dt, save); effects(g, dt); ambient(g, dt);
          if (audio) {
            for (let i = 0; i < g.ev.length; i++) audio.sfx(g.ev[i]);
            audio.engine(!g.crashed && g.fuel > 0, clamp(Math.abs(g.vx) / 1000, 0, 1), g.thr ? 1 : 0);
          }
          g.ev.length = 0;
          hudT += dt;
          if (hudT > 0.1) { hudT = 0; setHud(hudSnapshot(g, save)); }
          if (g.over && !g.ended) cbRef.current.finish(g, true);
        } else {
          if (audio) audio.engine(false, 0, 0);
          if (sc === 'crashed') { ambient(g, dt); if (g.crashed) effects(g, dt); }
          g.ev.length = 0;
        }
        renderGame(ctx, g, W, H, dpr, clock);
      } else {
        if (audio) audio.engine(false, 0, 0);
        const v = VEHICLES.find((q) => q.id === save.vehicle) || VEHICLES[0];
        const ri = Math.max(0, ROADS.findIndex((r) => r.id === save.road));
        renderMenuScene(ctx, W, H, dpr, clock, ri, v);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => () => {
    clearTimeout(toastTimer.current);
    if (audioRef.current) { audioRef.current.dispose(); audioRef.current = null; }
  }, []);

  /* =====================================================================
     RENDER
     ===================================================================== */
  const curVeh = VEHICLES.find((v) => v.id === save.vehicle) || VEHICLES[0];
  const curRoad = ROADS.find((r) => r.id === save.road) || ROADS[0];
  const daily = dailyInfo();
  const showMenuLayer = screen !== 'playing' && screen !== 'crashed';

  const header = (title) => (
    <div className="nhr-head">
      <button className="nhr-btn nhr-ghost" onClick={() => { ui('ui'); setConfirmReset(false); setScreen('menu'); }}>&lsaquo; Back</button>
      <h2>{title}</h2>
      <div className="nhr-wallet"><span className="nhr-chip nhr-coin"><i />{fmt(save.coins)}</span><span className="nhr-chip nhr-gem"><i />{fmt(save.gems)}</span></div>
    </div>
  );

  const renderMenu = () => (
    <div className="nhr-menu">
      <div className="nhr-title"><span>NINJA</span><b>HILL RIDE</b></div>
      <div className="nhr-wallet nhr-big">
        <span className="nhr-chip nhr-coin"><i />{fmt(save.coins)}</span>
        <span className="nhr-chip nhr-gem"><i />{fmt(save.gems)}</span>
        <span className="nhr-chip nhr-dist">Best {fmt(save.best.distance)} m</span>
      </div>
      <div className="nhr-selected">
        <VehicleArt v={curVeh} className="nhr-art nhr-small" />
        <div><small>Vehicle</small><strong>{curVeh.name}</strong><small>Road</small><strong>{curRoad.name}</strong></div>
      </div>
      <button className="nhr-btn nhr-play" onClick={() => { ui('unlock'); startRun(); }}>PLAY</button>
      <div className="nhr-menu-grid">
        <button className="nhr-btn" onClick={() => { ui('ui'); setScreen('vehicles'); }}>Vehicles</button>
        <button className="nhr-btn" onClick={() => { ui('ui'); setScreen('roads'); }}>Roads</button>
        <button className="nhr-btn" onClick={goGarage}>Garage</button>
        <button className="nhr-btn" onClick={() => { ui('ui'); setScreen('missions'); }}>Missions{daily.ready && <span className="nhr-dot" />}</button>
        <button className="nhr-btn nhr-wide" onClick={() => { ui('ui'); setScreen('settings'); }}>Settings</button>
      </div>
    </div>
  );

  const renderVehicles = () => (
    <div className="nhr-screen">
      {header('Vehicles')}
      <div className="nhr-grid">
        {VEHICLES.map((v) => {
          const owned = save.vehicles.includes(v.id); const sel = save.vehicle === v.id;
          return (
            <div key={v.id} className={`nhr-card ${sel ? 'nhr-sel' : ''} ${owned ? '' : 'nhr-locked'}`}>
              <VehicleArt v={v} />
              <h3>{v.name}</h3>
              <p className="nhr-desc">{v.desc}</p>
              <div className="nhr-stats">{vehStats(v).map((s) => <Bar key={s[0]} label={s[0]} pct={s[1]} />)}</div>
              <div className="nhr-price">{owned ? 'Unlocked' : v.price === 0 ? 'FREE' : `${fmt(v.price)} coins`}</div>
              {owned
                ? <button className="nhr-btn" disabled={sel} onClick={() => selectVehicle(v)}>{sel ? 'Selected' : 'Select'}</button>
                : <button className="nhr-btn nhr-buy" onClick={() => unlockVehicle(v)}>Unlock for {fmt(v.price)}</button>}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRoads = () => (
    <div className="nhr-screen">
      {header('Roads')}
      <div className="nhr-grid nhr-roads">
        {ROADS.map((r, i) => {
          const owned = save.roads.includes(r.id); const sel = save.road === r.id;
          return (
            <div key={r.id} className={`nhr-card ${sel ? 'nhr-sel' : ''} ${owned ? '' : 'nhr-locked'}`}>
              <RoadArt ri={i} />
              <h3>{r.name}</h3>
              <div className="nhr-diff"><span>Difficulty: {r.diff}</span><em>{'\u2605'.repeat(r.stars)}{'\u2606'.repeat(5 - r.stars)}</em></div>
              <div className="nhr-price">{owned ? 'Unlocked' : r.price === 0 ? 'FREE' : `${fmt(r.price)} coins`}</div>
              {owned
                ? <button className="nhr-btn" disabled={sel} onClick={() => selectRoad(r)}>{sel ? 'Selected' : 'Select'}</button>
                : <button className="nhr-btn nhr-buy" onClick={() => unlockRoad(r)}>Unlock for {fmt(r.price)}</button>}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderGarage = () => {
    const gv = VEHICLES.find((v) => v.id === garageVeh && save.vehicles.includes(v.id)) || curVeh;
    const up = save.upgrades[gv.id] || {};
    return (
      <div className="nhr-screen">
        {header('Garage')}
        <div className="nhr-tabs">
          {VEHICLES.filter((v) => save.vehicles.includes(v.id)).map((v) => (
            <button key={v.id} className={`nhr-tab ${v.id === gv.id ? 'nhr-on' : ''}`} onClick={() => { ui('ui'); setGarageVeh(v.id); }}>{v.name}</button>
          ))}
        </div>
        <div className="nhr-garage">
          <div className="nhr-garage-car">
            <VehicleArt v={gv} />
            <h3>{gv.name}</h3>
            {save.vehicle === gv.id ? <span className="nhr-tag">Active vehicle</span> : <button className="nhr-btn" onClick={() => selectVehicle(gv)}>Use this vehicle</button>}
            <button className="nhr-btn nhr-gemx" onClick={exchangeGem}>Exchange 1 gem for 200 coins</button>
          </div>
          <div className="nhr-upgrades">
            {UPGRADES.map((u) => {
              const lvl = up[u.key] || 0; const maxed = lvl >= MAX_UPGRADE; const price = upgradePrice(u, lvl);
              return (
                <div key={u.key} className="nhr-up">
                  <div className="nhr-up-top"><strong>{u.name}</strong><span>Level {lvl} / {MAX_UPGRADE}</span></div>
                  <div className="nhr-pips">{Array.from({ length: MAX_UPGRADE }, (_, i) => <i key={i} className={i < lvl ? 'nhr-on' : ''} />)}</div>
                  <div className="nhr-up-eff">{u.desc}: now {u.eff(lvl)}{maxed ? '' : `, next ${u.eff(lvl + 1)}`}</div>
                  <button className="nhr-btn nhr-buy" disabled={maxed} onClick={() => buyUpgrade(gv.id, u)}>{maxed ? 'Max level' : `Upgrade ${fmt(price)}`}</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMissions = () => (
    <div className="nhr-screen">
      {header('Missions')}
      <div className="nhr-daily">
        <div>
          <strong>Daily reward</strong>
          <span>Day {daily.streak}: {fmt(daily.coins)} coins{daily.gems ? ` + ${daily.gems} gems` : ''}</span>
        </div>
        <button className="nhr-btn nhr-buy" disabled={!daily.ready} onClick={claimDaily}>{daily.ready ? 'Claim' : 'Come back tomorrow'}</button>
      </div>
      <div className="nhr-missions">
        {MISSIONS.map((m) => {
          const done = !!save.done[m.id];
          const cur = done ? m.target : Math.min(m.target, m.cum ? (save.mp[m.type] || 0) : 0);
          return (
            <div key={m.id} className={`nhr-mission ${done ? 'nhr-done' : ''}`}>
              <div className="nhr-m-top"><strong>{m.title}</strong><span>{done ? 'Complete' : `${fmt(cur)} / ${fmt(m.target)}`}</span></div>
              <div className="nhr-bar"><b className="nhr-gold" style={{ width: `${(cur / m.target) * 100}%` }} /></div>
              <small>Reward: {fmt(m.coins || 0)} coins{m.gems ? ` + ${m.gems} gem${m.gems > 1 ? 's' : ''}` : ''}</small>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="nhr-screen">
      {header('Settings')}
      <div className="nhr-settings">
        <div className="nhr-row"><span>Sound effects</span><button className={`nhr-switch ${save.settings.sfx ? 'nhr-on' : ''}`} onClick={() => setSetting({ sfx: !save.settings.sfx })}>{save.settings.sfx ? 'On' : 'Off'}</button></div>
        <div className="nhr-row"><span>Background music</span><button className={`nhr-switch ${save.settings.music ? 'nhr-on' : ''}`} onClick={() => setSetting({ music: !save.settings.music })}>{save.settings.music ? 'On' : 'Off'}</button></div>
        <div className="nhr-row"><span>Volume</span><input type="range" min="0" max="1" step="0.05" value={save.settings.volume} onChange={(e) => setSetting({ volume: parseFloat(e.target.value) })} /></div>
        <div className="nhr-row"><span>On-screen touch buttons</span><button className={`nhr-switch ${save.settings.touch ? 'nhr-on' : ''}`} onClick={() => setSetting({ touch: !save.settings.touch })}>{save.settings.touch ? 'Shown' : 'Hidden'}</button></div>
        <div className="nhr-help">
          <strong>Controls</strong>
          <p>Accelerate: Right arrow / D. Brake and reverse: Left arrow / A.</p>
          <p>Jump (on the ground) and air control (in the air): Up arrow / W.</p>
          <p>Air balance: Down arrow / S. Nitro: Space. Pause: P. Restart: R.</p>
          <p>In the air, accelerate tilts the nose up and brake tilts it down.</p>
        </div>
        <button className="nhr-btn nhr-danger" onClick={resetProgress}>{confirmReset ? 'Tap again to erase all progress' : 'Reset progress'}</button>
      </div>
    </div>
  );

  const renderHud = () => {
    if (!hud) return null;
    return (
      <div className="nhr-hud">
        <div className="nhr-hud-tl">
          <span className="nhr-chip nhr-coin"><i />{fmt(hud.coins)}</span>
          <span className="nhr-chip nhr-gem"><i />{fmt(hud.gems)}</span>
          <span className="nhr-chip nhr-plain">{fmt(hud.dist)} m</span>
          <span className="nhr-chip nhr-plain">Score {fmt(hud.score)}</span>
        </div>
        <div className="nhr-hud-tc">
          <span className="nhr-level">Level {hud.level}</span>
          {hud.combo >= 2 && <span className={`nhr-combo nhr-m${hud.mult}`}>{hud.mult}x combo</span>}
          {hud.mission && (
            <div className="nhr-mprog"><span>{hud.mission.title}</span><div className="nhr-bar"><b className="nhr-gold" style={{ width: `${(hud.mission.cur / hud.mission.target) * 100}%` }} /></div></div>
          )}
        </div>
        <div className="nhr-hud-tr">
          <button className="nhr-pause" aria-label="Pause" onClick={(e) => { e.currentTarget.blur(); togglePause(); }}>II</button>
          <div className="nhr-meter nhr-fuel"><label>Fuel</label><div className="nhr-bar"><b className={hud.fuel < 0.25 ? 'nhr-low' : 'nhr-fuel'} style={{ width: `${clamp(hud.fuel, 0, 1) * 100}%` }} /></div></div>
        </div>
        <div className="nhr-hud-bc">
          <div className="nhr-speed">{Math.round(hud.speed)}<small>km/h</small></div>
          <div className="nhr-meter"><label>Nitro</label><div className="nhr-bar"><b className={hud.nitroOn ? 'nhr-nitro nhr-on' : 'nhr-nitro'} style={{ width: `${clamp(hud.nitro, 0, 1) * 100}%` }} /></div></div>
          <div className="nhr-meter"><label>Health</label><div className="nhr-bar"><b className={hud.health < 30 ? 'nhr-low' : 'nhr-hp'} style={{ width: `${clamp(hud.health, 0, 100)}%` }} /></div></div>
        </div>
        {save.settings.touch && (
          <>
            <div className="nhr-ctl nhr-left"><TouchBtn id="brake" label="Brake" cls="brake" touchRef={touchRef} /></div>
            <div className="nhr-ctl nhr-right">
              <TouchBtn id="nitro" label="Nitro" cls="nitro" touchRef={touchRef} />
              <TouchBtn id="jump" label="Jump" cls="jump" touchRef={touchRef} />
              <TouchBtn id="gas" label="Gas" cls="gas" touchRef={touchRef} />
            </div>
          </>
        )}
        {paused && (
          <div className="nhr-modal">
            <div className="nhr-panel">
              <h2>Paused</h2>
              <button className="nhr-btn nhr-play nhr-small" onClick={togglePause}>Resume</button>
              <button className="nhr-btn" onClick={restart}>Restart</button>
              <button className="nhr-btn" onClick={goHome}>Home</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCrash = () => {
    if (!summary) return null;
    const v = VEHICLES.find((q) => q.id === summary.vehicle) || curVeh;
    return (
      <div className="nhr-modal">
        <div className="nhr-panel nhr-crash">
          <h2>{summary.crashed ? 'Crashed!' : 'Out of fuel!'}</h2>
          <VehicleArt v={v} crashed={summary.crashed} className="nhr-art nhr-crashart" />
          <div className="nhr-sum">
            <div><span>Distance</span><b>{fmt(summary.distance)} m</b></div>
            <div><span>Score</span><b>{fmt(summary.score)}</b></div>
            <div><span>Coins collected</span><b>{fmt(summary.coins)}</b></div>
            <div><span>Gems collected</span><b>{fmt(summary.gems)}</b></div>
            <div><span>Best distance</span><b>{fmt(Math.max(summary.bestDistance, summary.distance))} m{summary.newBest ? ' (new!)' : ''}</b></div>
            <div><span>Flips / wheelies</span><b>{summary.flips} / {summary.wheelies}</b></div>
          </div>
          <div className="nhr-rewards">
            <strong>Rewards earned</strong>
            <span>+{fmt(summary.coins + summary.rewardCoins)} coins{summary.gems + summary.rewardGems > 0 ? `, +${summary.gems + summary.rewardGems} gems` : ''}</span>
            {summary.missions.map((m) => <em key={m}>Mission complete: {m}</em>)}
          </div>
          <div className="nhr-crash-btns">
            <button className="nhr-btn nhr-play nhr-small" onClick={() => { ui('unlock'); startRun(); }}>Restart</button>
            <button className="nhr-btn" onClick={() => { ui('ui'); setScreen('menu'); }}>Home</button>
            <button className="nhr-btn" onClick={() => { ui('ui'); goGarage(); }}>Garage</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="nhr-root" ref={wrapRef}>
      <canvas ref={canvasRef} className="nhr-canvas" />
      {showMenuLayer && (
        <div className="nhr-layer">
          {screen === 'menu' && renderMenu()}
          {screen === 'vehicles' && renderVehicles()}
          {screen === 'roads' && renderRoads()}
          {screen === 'garage' && renderGarage()}
          {screen === 'missions' && renderMissions()}
          {screen === 'settings' && renderSettings()}
        </div>
      )}
      {screen === 'playing' && renderHud()}
      {screen === 'crashed' && renderCrash()}
      {toast && <div key={toast.id} className={`nhr-toast nhr-t-${toast.kind}`} role="status">{toast.msg}</div>}
    </div>
  );
}

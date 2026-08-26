'use strict';

/* =========================================================
   1분 던전 - 게임 로직 전체
   구성: 데이터 → 저장 → 사운드 → 상태 → 화면전환 →
         던전 진행 → 전투 → 보물/이벤트 → 보스 → 결과 → 업그레이드
========================================================= */

/* ---------------- 1. 게임 데이터 ---------------- */

const ENEMIES = [
  { key: 'rat',      name: '거대 쥐',    emoji: '🐀', tier: 'normal', hp: 18, atk: 4,  def: 0, gold: 5  },
  { key: 'goblin',   name: '고블린',     emoji: '👺', tier: 'normal', hp: 25, atk: 5,  def: 1, gold: 8  },
  { key: 'bat',      name: '동굴 박쥐',  emoji: '🦇', tier: 'normal', hp: 15, atk: 6,  def: 0, gold: 6, dodge: 0.15 },
  { key: 'skeleton', name: '해골 전사',  emoji: '💀', tier: 'normal', hp: 30, atk: 6,  def: 3, gold: 10, guard: 0.2 },
  { key: 'zombie',   name: '좀비',       emoji: '🧟', tier: 'strong', hp: 42, atk: 4,  def: 2, gold: 9,  regen: 3 },
  { key: 'spider',   name: '독거미',     emoji: '🕷️', tier: 'strong', hp: 24, atk: 5,  def: 1, gold: 9,  poison: 0.35 },
  { key: 'orc',      name: '오크',       emoji: '👹', tier: 'strong', hp: 46, atk: 8,  def: 3, gold: 14, strongHit: 0.25 },
  { key: 'knight',   name: '지옥의 기사', emoji: '🔥', tier: 'strong', hp: 55, atk: 10, def: 4, gold: 20, crit: 0.2 },
];

const BOSSES = [
  { key: 'dragon', name: '고대 드래곤',  emoji: '🐉', hp: 130, atk: 14, def: 5, gold: 60 },
  { key: 'demon',  name: '마왕의 기사',  emoji: '👿', hp: 110, atk: 16, def: 6, gold: 55 },
  { key: 'death',  name: '죽음의 군주',  emoji: '💀', hp: 95,  atk: 13, def: 4, gold: 50 },
];

/* --- SD(데포르메)풍 캐릭터 SVG 아트: 외부 이미지 없이 코드로 직접 그림 --- */
const CHAR_ART = {
  hero: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="82" rx="17" ry="6" fill="#000" opacity="0.15"/><ellipse cx="50" cy="80" rx="20" ry="14" fill="#3a5fc8"/><circle cx="50" cy="44" r="28" fill="#f4c99b"/><circle cx="34" cy="50" r="4" fill="#ffb3c1" opacity="0.6"/><circle cx="66" cy="50" r="4" fill="#ffb3c1" opacity="0.6"/><path d="M22 78 Q50 92 78 78 L78 66 Q50 78 22 66 Z" fill="#2a46a8"/><path d="M28 40 Q50 8 72 40 Q68 20 50 16 Q32 20 28 40 Z" fill="#6b4226"/><circle cx="41" cy="46" r="4" fill="#1a1a2e"/><circle cx="59" cy="46" r="4" fill="#1a1a2e"/><circle cx="39.7" cy="44.7" r="1.1" fill="#fff"/><circle cx="57.7" cy="44.7" r="1.1" fill="#fff"/><path d="M45 55 Q50 58 55 55" stroke="#7a4a30" stroke-width="1.6" fill="none" stroke-linecap="round"/><rect x="70" y="50" width="4" height="28" rx="2" fill="#d4d4d4" transform="rotate(18 72 64)"/><rect x="66" y="46" width="11" height="6" rx="2" fill="#d4af37" transform="rotate(18 72 49)"/><path d="M18 40 Q10 20 26 10 Q22 26 30 38 Z" fill="#d4af37" opacity="0.9"/></svg>',
  rat: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M70 78 Q90 74 92 84 Q80 86 70 82 Z" fill="#8a8a92"/><ellipse cx="50" cy="80" rx="20" ry="14" fill="#8a8a92"/><circle cx="50" cy="44" r="28" fill="#a8a8b0"/><circle cx="34" cy="50" r="4" fill="#ffb3c1" opacity="0.6"/><circle cx="66" cy="50" r="4" fill="#ffb3c1" opacity="0.6"/><circle cx="26" cy="26" r="10" fill="#a8a8b0"/><circle cx="74" cy="26" r="10" fill="#a8a8b0"/><circle cx="26" cy="26" r="5" fill="#ffb3c1"/><circle cx="74" cy="26" r="5" fill="#ffb3c1"/><circle cx="40" cy="42" r="4.2" fill="#1a1a2e"/><circle cx="60" cy="42" r="4.2" fill="#1a1a2e"/><circle cx="38.7" cy="40.7" r="1.1" fill="#fff"/><circle cx="58.7" cy="40.7" r="1.1" fill="#fff"/><ellipse cx="50" cy="54" rx="4" ry="3" fill="#4a4a4a"/><path d="M30 55 L14 52 M30 58 L14 60" stroke="#4a4a4a" stroke-width="1" stroke-linecap="round"/><path d="M70 55 L86 52 M70 58 L86 60" stroke="#4a4a4a" stroke-width="1" stroke-linecap="round"/><path d="M42 58 Q50 62 58 58" stroke="#4a4a4a" stroke-width="1.4" fill="none" stroke-linecap="round"/><rect x="45" y="58" width="2.4" height="4" fill="#fff"/><rect x="52.6" y="58" width="2.4" height="4" fill="#fff"/></svg>',
  goblin: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="80" rx="20" ry="14" fill="#4a7a3a"/><circle cx="50" cy="44" r="28" fill="#7bb661"/><circle cx="34" cy="50" r="4" fill="#ffb3c1" opacity="0.6"/><circle cx="66" cy="50" r="4" fill="#ffb3c1" opacity="0.6"/><path d="M18 44 L6 30 L22 34 Z" fill="#6aa350"/><path d="M82 44 L94 30 L78 34 Z" fill="#6aa350"/><circle cx="40" cy="44" r="4.6" fill="#c9302c"/><circle cx="60" cy="44" r="4.6" fill="#c9302c"/><circle cx="38.7" cy="42.7" r="1.1" fill="#fff"/><circle cx="58.7" cy="42.7" r="1.1" fill="#fff"/><path d="M43 56 Q50 60 57 56" stroke="#2f4a24" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M46 57 L45 61 L48 58 Z" fill="#fff"/><path d="M54 57 L55 61 L52 58 Z" fill="#fff"/><path d="M30 80 Q50 88 70 80 L70 72 Q50 80 30 72 Z" fill="#8a6a42"/></svg>',
  bat: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M30 40 Q0 20 2 54 Q4 66 20 58 Q28 52 32 44 Z" fill="#5b4a7a"/><path d="M70 40 Q100 20 98 54 Q96 66 80 58 Q72 52 68 44 Z" fill="#5b4a7a"/><ellipse cx="50" cy="80" rx="20" ry="14" fill="#5b4a7a"/><circle cx="50" cy="44" r="28" fill="#6b5a92"/><circle cx="34" cy="50" r="4" fill="#ffb3c1" opacity="0.6"/><circle cx="66" cy="50" r="4" fill="#ffb3c1" opacity="0.6"/><path d="M38 20 L34 8 L44 18 Z" fill="#5b4a7a"/><path d="M62 20 L66 8 L56 18 Z" fill="#5b4a7a"/><circle cx="40" cy="44" r="4.6" fill="#e6394a"/><circle cx="60" cy="44" r="4.6" fill="#e6394a"/><path d="M40 54 Q50 64 60 54 Q50 60 40 54 Z" fill="#2a1f3d"/><path d="M44 55 L43 61 L47 56 Z" fill="#fff"/><path d="M56 55 L57 61 L53 56 Z" fill="#fff"/></svg>',
  skeleton: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="80" rx="20" ry="14" fill="#c9c4b4"/><circle cx="50" cy="44" r="28" fill="#e8e4d8"/><circle cx="34" cy="50" r="4" fill="#e0a0a0" opacity="0.6"/><circle cx="66" cy="50" r="4" fill="#e0a0a0" opacity="0.6"/><circle cx="40" cy="45" r="6" fill="#1a1a2e"/><circle cx="60" cy="45" r="6" fill="#1a1a2e"/><path d="M46 58 L50 62 L54 58 M45 60 L55 60" stroke="#8a8578" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M38 60 L36 66 M44 60 L44 67 M50 60 L50 68 M56 60 L56 67 M62 60 L64 66" stroke="#8a8578" stroke-width="1.2"/><rect x="76" y="46" width="4" height="30" rx="2" fill="#c9c4b4"/><rect x="72" y="42" width="12" height="6" rx="2" fill="#8a8578"/></svg>',
  zombie: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="80" rx="20" ry="14" fill="#5f7a4a"/><circle cx="50" cy="44" r="28" fill="#8fae6b"/><circle cx="34" cy="50" r="4" fill="#6a8a50" opacity="0.6"/><circle cx="66" cy="50" r="4" fill="#6a8a50" opacity="0.6"/><path d="M26 64 Q8 58 4 70 Q6 78 16 76 Q24 74 28 68 Z" fill="#6f8f52"/><path d="M74 64 Q92 58 96 70 Q94 78 84 76 Q76 74 72 68 Z" fill="#6f8f52"/><circle cx="40" cy="46" r="4.2" fill="#1a1a2e"/><circle cx="61" cy="49" r="4.2" fill="#1a1a2e"/><path d="M37 43 L43 49 M43 43 L37 49" stroke="#3a4a2a" stroke-width="1"/><path d="M44 58 Q50 63 56 59 Q50 66 44 58 Z" fill="#2a1a1a"/><path d="M20 22 Q50 6 80 22 Q76 14 50 12 Q24 14 20 22 Z" fill="#4a5a3a" opacity="0.7"/></svg>',
  spider: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g stroke="#2a1a3a" stroke-width="2.4" stroke-linecap="round"><path d="M32 70 L10 60 M32 76 L8 76 M32 82 L10 92"/><path d="M68 70 L90 60 M68 76 L92 76 M68 82 L90 92"/></g><ellipse cx="50" cy="78" rx="18" ry="14" fill="#3a2a52"/><circle cx="50" cy="46" r="24" fill="#4a3566"/><circle cx="38" cy="42" r="4" fill="#e6394a"/><circle cx="62" cy="42" r="4" fill="#e6394a"/><circle cx="46" cy="50" r="2" fill="#e6394a"/><circle cx="54" cy="50" r="2" fill="#e6394a"/><path d="M44 58 L40 64 M56 58 L60 64" stroke="#1a1128" stroke-width="1.8" stroke-linecap="round"/></svg>',
  orc: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="84" rx="24" ry="14" fill="#3f6b2e"/><circle cx="50" cy="44" r="30" fill="#568a3e"/><path d="M16 42 L4 24 L22 30 Z" fill="#4a7a34"/><path d="M84 42 L96 24 L78 30 Z" fill="#4a7a34"/><circle cx="39" cy="42" r="4.6" fill="#c9302c"/><circle cx="61" cy="42" r="4.6" fill="#c9302c"/><circle cx="37.7" cy="40.7" r="1.1" fill="#fff"/><circle cx="59.7" cy="40.7" r="1.1" fill="#fff"/><path d="M30 62 Q50 74 70 62 L70 56 Q50 66 30 56 Z" fill="#2f4a22"/><path d="M39 60 L36 71 L44 62 Z" fill="#f0ead6"/><path d="M61 60 L64 71 L56 62 Z" fill="#f0ead6"/><path d="M20 20 Q50 4 80 20" stroke="#c9302c" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/></svg>',
  knight: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="84" rx="20" ry="6" fill="#ff6a2a" opacity="0.35"/><ellipse cx="50" cy="80" rx="22" ry="16" fill="#2a1414"/><circle cx="50" cy="42" r="28" fill="#3a1a1a"/><path d="M26 30 L14 6 L34 22 Z" fill="#1a0a0a"/><path d="M74 30 L86 6 L66 22 Z" fill="#1a0a0a"/><circle cx="40" cy="42" r="4.4" fill="#ff9a3c"/><circle cx="60" cy="42" r="4.4" fill="#ff9a3c"/><path d="M30 60 Q50 70 70 60" stroke="#ff6a2a" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7"/><rect x="74" y="54" width="5" height="30" rx="2" fill="#6a6a72"/><rect x="70" y="50" width="13" height="7" rx="2" fill="#c9302c"/></svg>',
  dragon: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M20 50 Q0 30 10 10 Q26 22 32 46 Z" fill="#2e7d4f"/><path d="M80 50 Q100 30 90 10 Q74 22 68 46 Z" fill="#2e7d4f"/><ellipse cx="50" cy="82" rx="24" ry="14" fill="#256a42"/><circle cx="50" cy="44" r="28" fill="#34a05f"/><path d="M32 24 L26 8 L38 20 Z" fill="#256a42"/><path d="M68 24 L74 8 L62 20 Z" fill="#256a42"/><circle cx="39" cy="42" r="4.6" fill="#ffd23c"/><circle cx="61" cy="42" r="4.6" fill="#ffd23c"/><circle cx="39" cy="42" r="1.6" fill="#1a1a2e"/><circle cx="61" cy="42" r="1.6" fill="#1a1a2e"/><path d="M40 56 Q50 62 60 56 L58 62 Q50 68 42 62 Z" fill="#1a3a24"/><path d="M46 20 Q50 6 54 20" stroke="#d4af37" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  demon: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M14 60 Q6 90 26 92 Q22 74 30 62 Z" fill="#3a1a52"/><path d="M86 60 Q94 90 74 92 Q78 74 70 62 Z" fill="#3a1a52"/><ellipse cx="50" cy="82" rx="22" ry="15" fill="#1a1024"/><circle cx="50" cy="43" r="27" fill="#241533"/><path d="M30 26 L20 4 L38 18 Z" fill="#120a1a"/><path d="M70 26 L80 4 L62 18 Z" fill="#120a1a"/><circle cx="40" cy="43" r="4.2" fill="#a259ff"/><circle cx="60" cy="43" r="4.2" fill="#a259ff"/><path d="M32 58 Q50 66 68 58" stroke="#a259ff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.8"/><rect x="73" y="50" width="5" height="32" rx="2" fill="#c9c4b4"/><rect x="69" y="46" width="13" height="7" rx="2" fill="#4a2a6a"/></svg>',
  death: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M18 92 Q10 60 30 44 Q26 70 34 90 Z" fill="#241a33"/><path d="M82 92 Q90 60 70 44 Q74 70 66 90 Z" fill="#241a33"/><ellipse cx="50" cy="82" rx="22" ry="15" fill="#2e2440"/><circle cx="50" cy="43" r="27" fill="#e8e4d8"/><path d="M18 40 Q50 20 82 40 Q70 26 50 24 Q30 26 18 40 Z" fill="#1a1224"/><circle cx="40" cy="45" r="6" fill="#0a0a12"/><circle cx="60" cy="45" r="6" fill="#0a0a12"/><circle cx="40" cy="45" r="2" fill="#a259ff"/><circle cx="60" cy="45" r="2" fill="#a259ff"/><path d="M45 58 L50 62 L55 58 M44 60 L56 60" stroke="#8a8578" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M78 30 L84 8 M78 30 L72 12" stroke="#6a6a72" stroke-width="3" stroke-linecap="round"/></svg>',
};

const EQUIPMENT_POOL = {
  weapon: [
    { name: '낡은 검',     grade: '일반', atk: 3 },
    { name: '강철 검',     grade: '고급', atk: 8 },
    { name: '기사의 대검', grade: '희귀', atk: 12, crit: 3 },
    { name: '용사의 검',   grade: '영웅', atk: 15, crit: 5 },
    { name: '전설의 명검', grade: '전설', atk: 22, crit: 8 },
  ],
  armor: [
    { name: '가죽 갑옷',     grade: '일반', def: 2 },
    { name: '사슬 갑옷',     grade: '고급', def: 5 },
    { name: '기사단 갑옷',   grade: '희귀', def: 8,  hp: 10 },
    { name: '수호자의 갑옷', grade: '영웅', def: 12, hp: 20 },
    { name: '전설의 갑옷',   grade: '전설', def: 18, hp: 30 },
  ],
  ring: [
    { name: '낡은 반지',   grade: '일반', luck: 1 },
    { name: '은반지',      grade: '고급', luck: 2, gold: 5 },
    { name: '마력의 반지', grade: '희귀', luck: 3, crit: 3 },
    { name: '현자의 반지', grade: '영웅', luck: 5, crit: 5 },
    { name: '전설의 인장', grade: '전설', luck: 8, crit: 8, gold: 10 },
  ],
};
const GRADE_WEIGHTS = [50, 25, 15, 7, 3]; // 일반~전설

const UPGRADE_DEFS = [
  { key: 'atk',  name: '⚔️ 공격력 강화', desc: '공격력 +2', base: 100 },
  { key: 'def',  name: '🛡️ 방어력 강화', desc: '방어력 +1', base: 100 },
  { key: 'hp',   name: '❤️ 최대 HP 강화', desc: '최대 HP +10', base: 120 },
  { key: 'gold', name: '💰 골드 획득량 강화', desc: '골드 획득 +10%', base: 150 },
  { key: 'luck', name: '🍀 행운 강화', desc: '치명타 확률 +1%', base: 130 },
];

const EVENTS = [
  {
    text: '수상한 상인을 만났습니다.',
    choices: [
      { label: '30골드 주고 물약 구매', action: (r) => {
          if (r.gold >= 30) { r.gold -= 30; r.potions += 1; return '물약을 얻었습니다! 🧪'; }
          return '골드가 부족합니다.';
        } },
      { label: '무시한다', action: () => '상인을 지나쳤습니다.' },
    ],
  },
  {
    text: '낡은 제단을 발견했습니다.',
    choices: [
      { label: 'HP 20 희생하고 공격력 +10', action: (r) => {
          if (r.hp <= 20) return '너무 위험해서 포기했습니다.';
          r.hp -= 20; r.atk += 10; return '힘이 솟아오릅니다! 공격력 +10';
        } },
      { label: '그냥 지나간다', action: () => '제단을 지나쳤습니다.' },
    ],
  },
  {
    text: '작은 요정이 나타나 소원을 들어주겠다고 합니다.',
    choices: [
      { label: '골드를 원한다', action: (r) => { const g = rand(15, 35); r.gold += g; return `골드 +${g} 💰`; } },
      { label: '체력을 원한다', action: (r) => { const h = Math.min(20, r.maxHp - r.hp); r.hp += h; return `HP +${h} 회복`; } },
    ],
  },
];

/* ---------------- 2. 저장 데이터 ---------------- */

const SAVE_KEY = 'omd_save_v1';
const RUN_KEY = 'omd_run_v1';

function defaultSave() {
  return {
    bestFloor: 0,
    totalGold: 0,
    playCount: 0,
    clearCount: 0,
    upgrades: { atk: 0, def: 0, hp: 0, gold: 0, luck: 0 },
    inventory: [],
    equipped: { weapon: null, armor: null, ring: null },
    settings: { sound: true },
  };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    const def = defaultSave();
    return { ...def, ...parsed, upgrades: { ...def.upgrades, ...(parsed.upgrades || {}) }, settings: { ...def.settings, ...(parsed.settings || {}) } };
  } catch (e) {
    return defaultSave();
  }
}

function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* 저장 실패 무시 */ }
}

function saveRun() {
  try { localStorage.setItem(RUN_KEY, JSON.stringify(run)); } catch (e) { /* 저장 실패 무시 */ }
}
function clearRunSave() {
  try { localStorage.removeItem(RUN_KEY); } catch (e) { /* 무시 */ }
}
function loadRun() {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

let save = loadSave();

/* ---------------- 3. 사운드 (Web Audio) ---------------- */

let audioCtx = null;
function ensureAudio() {
  if (!audioCtx && save.settings.sound) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* 미지원 */ }
  }
}
function tone(freq, dur, type = 'square', vol = 0.08) {
  if (!save.settings.sound || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain).connect(audioCtx.destination);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.start(); osc.stop(audioCtx.currentTime + dur);
}
const sfx = {
  attack: () => tone(220, 0.08, 'square'),
  hit:    () => tone(120, 0.12, 'sawtooth'),
  crit:   () => { tone(500, 0.08, 'square'); tone(700, 0.1, 'square', 0.06); },
  gold:   () => { tone(880, 0.06, 'sine'); tone(1200, 0.08, 'sine', 0.05); },
  button: () => tone(300, 0.05, 'triangle', 0.05),
  boss:   () => { tone(80, 0.4, 'sawtooth', 0.1); },
  clear:  () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'sine', 0.07), i * 120)); },
  over:   () => { tone(160, 0.5, 'sawtooth', 0.08); },
};

/* --- 배경음악: 외부 음원 없이 짧은 음계를 반복해 절차적으로 생성 --- */
const BGM_PATTERNS = {
  title:   { notes: [392, 440, 523, 440, 392, 349, 392, 440], step: 480, wave: 'sine',     vol: 0.03 },
  dungeon: { notes: [261, 329, 392, 329, 293, 349, 392, 349], step: 380, wave: 'triangle', vol: 0.035 },
  battle:  { notes: [220, 220, 261, 220, 246, 220, 196, 220], step: 220, wave: 'square',   vol: 0.04 },
  boss:    { notes: [130, 146, 164, 146, 110, 130, 98, 110],  step: 200, wave: 'sawtooth', vol: 0.045 },
};
let bgmTheme = null;
let bgmTimer = null;

function stopBgm() {
  if (bgmTimer) clearTimeout(bgmTimer);
  bgmTimer = null;
  bgmTheme = null;
}
function playBgm(theme) {
  if (bgmTheme === theme) return;
  stopBgm();
  bgmTheme = theme;
  if (!save.settings.sound) return;
  ensureAudio();
  const pattern = BGM_PATTERNS[theme];
  let i = 0;
  (function loop() {
    if (bgmTheme !== theme) return;
    tone(pattern.notes[i % pattern.notes.length], (pattern.step / 1000) * 0.85, pattern.wave, pattern.vol);
    i += 1;
    bgmTimer = setTimeout(loop, pattern.step);
  })();
}

/* ---------------- 4. 유틸 ---------------- */

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function weightedRoomType() {
  const table = [['normal', 50], ['strong', 20], ['treasure', 10], ['heal', 10], ['event', 10]];
  let r = Math.random() * 100;
  for (const [type, w] of table) { if (r < w) return type; r -= w; }
  return 'normal';
}
function weightedGrade() {
  const total = GRADE_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < GRADE_WEIGHTS.length; i++) { if (r < GRADE_WEIGHTS[i]) return i; r -= GRADE_WEIGHTS[i]; }
  return 0;
}

/* ---------------- 5. 스탯 계산 ---------------- */

function baseStats() {
  const u = save.upgrades;
  return {
    maxHp: 50 + u.hp * 10,
    atk: 5 + u.atk * 2,
    def: 2 + u.def * 1,
    goldMult: 1 + u.gold * 0.1,
    critChance: 0.10 + u.luck * 0.01,
  };
}
function equippedBonus() {
  const bonus = { atk: 0, def: 0, hp: 0, crit: 0, gold: 0 };
  Object.values(save.equipped).forEach((item) => {
    if (!item) return;
    bonus.atk += item.atk || 0; bonus.def += item.def || 0; bonus.hp += item.hp || 0;
    bonus.crit += item.crit || 0; bonus.gold += item.gold || 0;
  });
  return bonus;
}
function upgradeCost(key, level) {
  return Math.round(UPGRADE_DEFS.find(u => u.key === key).base * Math.pow(2, level));
}

/* ---------------- 6. 던전 실행 상태 ---------------- */

let run = null;

function newRun() {
  const bs = baseStats();
  const eq = equippedBonus();
  return {
    hp: bs.maxHp + eq.hp,
    maxHp: bs.maxHp + eq.hp,
    atk: bs.atk + eq.atk,
    def: bs.def + eq.def,
    critChance: bs.critChance + eq.crit / 100,
    goldMult: bs.goldMult + eq.gold / 100,
    gold: 0,
    room: 1,
    kills: 0,
    potions: 2,
    itemsGained: [],
    roomTypes: buildRoomSequence(),
    combat: null, // { enemy, enemyHp, enemyHpMax, isBoss, poisonTurns, guardActive }
    startTime: Date.now(),
  };
}

function buildRoomSequence() {
  const seq = [];
  for (let i = 1; i <= 9; i++) seq.push(weightedRoomType());
  seq.push('boss');
  return seq;
}

/* ---------------- 7. 화면 전환 ---------------- */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ---------------- 8. 던전 진행 ---------------- */

function startRun(resumed) {
  ensureAudio();
  if (!resumed) {
    run = newRun();
    save.playCount += 1;
    saveGame();
  }
  showScreen('screen-game');
  enterRoom();
}

function enterRoom() {
  document.getElementById('event-panel').classList.add('hidden');
  document.getElementById('event-panel').innerHTML = '';
  restoreActionBar();
  updateHud();

  const type = run.roomTypes[run.room - 1];
  document.getElementById('room-number').textContent = run.room;

  if (type === 'boss') {
    const boss = { ...pick(BOSSES) };
    run.combat = { enemy: boss, enemyHp: boss.hp, enemyHpMax: boss.hp, isBoss: true, poisonTurns: 0, guardActive: false };
    sfx.boss();
    playBgm('boss');
    flashScreen('boss', 600);
    renderCombat(true);
    setLog(`${boss.name}이(가) 앞을 가로막습니다!`);
  } else if (type === 'normal' || type === 'strong') {
    const pool = ENEMIES.filter(e => e.tier === type);
    const enemy = { ...pick(pool) };
    run.combat = { enemy, enemyHp: enemy.hp, enemyHpMax: enemy.hp, isBoss: false, poisonTurns: 0, guardActive: false };
    playBgm('battle');
    renderCombat(false);
    setLog(`${enemy.name}이(가) 나타났습니다!`);
  } else if (type === 'treasure') {
    run.combat = null;
    playBgm('dungeon');
    renderNonCombat('💰', '보물 상자', '반짝이는 상자를 발견했습니다.');
    resolveTreasure();
  } else if (type === 'heal') {
    run.combat = null;
    playBgm('dungeon');
    renderNonCombat('✨', '휴식의 샘', '맑은 샘물이 흐르고 있습니다.');
    resolveHeal();
  } else if (type === 'event') {
    run.combat = null;
    playBgm('dungeon');
    renderNonCombat('❓', '???', '무언가 이상한 기운이 느껴집니다.');
    resolveEvent();
  }
  saveRun();
}

function renderCombat(isBoss) {
  const c = run.combat;
  const art = CHAR_ART[c.enemy.key];
  document.getElementById('enemy-emoji').innerHTML = art || c.enemy.emoji;
  document.getElementById('enemy-emoji').className = 'enemy-emoji' + (isBoss ? ' boss-enter' : '');
  document.getElementById('enemy-name').textContent = c.enemy.name;
  document.getElementById('enemy-hp').textContent = c.enemyHp;
  document.getElementById('enemy-hp-max').textContent = c.enemyHpMax;
  document.getElementById('enemy-hp-fill').style.width = '100%';
  document.getElementById('room-badge').classList.remove('hidden');
  updatePotionButton();
  document.getElementById('btn-flee').disabled = isBoss;
}

function renderNonCombat(emoji, name, msg) {
  document.getElementById('enemy-emoji').textContent = emoji;
  document.getElementById('enemy-emoji').className = 'enemy-emoji';
  document.getElementById('enemy-name').textContent = name;
  document.getElementById('enemy-hp').textContent = '-';
  document.getElementById('enemy-hp-max').textContent = '-';
  document.getElementById('enemy-hp-fill').style.width = '0%';
  setLog(msg);
}

function updateHud() {
  document.getElementById('hud-hp').textContent = Math.max(0, run.hp);
  document.getElementById('hud-hp-max').textContent = run.maxHp;
  document.getElementById('hud-atk').textContent = run.atk;
  document.getElementById('hud-def').textContent = run.def;
  document.getElementById('hud-gold').textContent = run.gold;
  document.getElementById('hud-room').textContent = run.room;
  updateLowHpVignette();
}

function setLog(msg) { document.getElementById('battle-log').textContent = msg; }

function updatePotionButton() {
  document.getElementById('potion-count').textContent = run.potions;
  document.getElementById('btn-heal').disabled = run.potions <= 0;
}

function showDamageFloat(text, cls) {
  const card = document.getElementById('encounter-card');
  const el = document.createElement('div');
  el.className = 'dmg-float' + (cls ? ' ' + cls : '');
  el.textContent = text;
  el.style.left = (45 + rand(-8, 8)) + '%';
  card.appendChild(el);
  setTimeout(() => el.remove(), 850);
}

function shakeScreen() {
  const card = document.getElementById('encounter-card');
  card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
}
function hitEnemyAnim() {
  const em = document.getElementById('enemy-emoji');
  em.classList.remove('hit'); void em.offsetWidth; em.classList.add('hit');
}

function flashScreen(type, dur) {
  const el = document.getElementById('fx-flash');
  el.className = 'fx-flash ' + type;
  setTimeout(() => { el.className = 'fx-flash'; }, dur || 500);
}

function spawnSparkles(emoji, count) {
  const card = document.getElementById('encounter-card');
  for (let i = 0; i < (count || 6); i++) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.textContent = emoji;
    s.style.left = (30 + rand(0, 40)) + '%';
    s.style.top = (35 + rand(0, 20)) + '%';
    s.style.setProperty('--dx', rand(-40, 40) + 'px');
    card.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}

function updateLowHpVignette() {
  const vignette = document.getElementById('fx-vignette');
  const isLow = run && run.hp > 0 && run.hp / run.maxHp <= 0.3;
  vignette.classList.toggle('low-hp', !!isLow);
}

/* --- 화면 장식용 파티클: 반딧불 / 컨페티 / 균열 --- */
function spawnFireflies() {
  const layer = document.getElementById('fireflies');
  if (!layer || layer.childElementCount > 0) return;
  for (let i = 0; i < 14; i++) {
    const f = document.createElement('span');
    f.className = 'firefly';
    f.style.left = rand(0, 100) + '%';
    f.style.bottom = rand(-10, 40) + '%';
    f.style.setProperty('--fx', rand(-40, 40) + 'px');
    f.style.animationDuration = rand(6, 12) + 's';
    f.style.animationDelay = rand(0, 8) + 's';
    layer.appendChild(f);
  }
}

function spawnConfetti() {
  const layer = document.getElementById('confetti-layer');
  if (!layer) return;
  layer.innerHTML = '';
  const colors = ['#f0c95a', '#d4af37', '#7c5cff', '#e33d3d', '#4ade80'];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-piece';
    p.style.left = rand(0, 100) + '%';
    p.style.background = pick(colors);
    p.style.animationDuration = rand(1800, 3200) + 'ms';
    p.style.animationDelay = rand(0, 500) + 'ms';
    layer.appendChild(p);
  }
}

function spawnCrack() {
  const el = document.getElementById('crack-overlay');
  if (!el) return;
  const lines = Array.from({ length: 5 }, () => {
    const x1 = rand(30, 70), y1 = rand(30, 60);
    const x2 = x1 + rand(-30, 30), y2 = y1 + rand(20, 45);
    return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#e33d3d" stroke-width="0.6" fill="none" opacity="0.55"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${lines}</svg>`;
  el.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/* ---------------- 9. 전투 ---------------- */

document.addEventListener('DOMContentLoaded', init);

function setActionsLocked(locked) {
  ['btn-attack', 'btn-heal', 'btn-flee'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = locked || (id === 'btn-heal' && run && run.potions <= 0);
  });
}

function playerAttack() {
  if (!run || !run.combat) return;
  const c = run.combat;
  setActionsLocked(true);
  sfx.attack();
  const isCrit = Math.random() < run.critChance;
  let dmg = Math.max(1, run.atk + rand(-2, 3) - c.enemy.def);
  if (isCrit) dmg = Math.round(dmg * 1.8);

  if (c.enemy.dodge && Math.random() < c.enemy.dodge) {
    setLog(`${c.enemy.name}이(가) 공격을 회피했습니다!`);
  } else if (c.guardActive) {
    dmg = Math.round(dmg * 0.4);
    c.guardActive = false;
    c.enemyHp = Math.max(0, c.enemyHp - dmg);
    setLog(`${c.enemy.name}이(가) 방어했습니다! ${dmg} 데미지`);
    hitEnemyAnim(); showDamageFloat('-' + dmg, isCrit ? 'crit' : '');
  } else {
    c.enemyHp = Math.max(0, c.enemyHp - dmg);
    hitEnemyAnim(); showDamageFloat('-' + dmg, isCrit ? 'crit' : '');
    if (isCrit) { sfx.crit(); flashScreen('crit', 350); setLog(`치명타! ${c.enemy.name}에게 ${dmg} 데미지!`); }
    else setLog(`${c.enemy.name}에게 ${dmg} 데미지!`);
  }
  updateEnemyHpBar();

  if (c.enemyHp <= 0) { onEnemyDefeated(); return; }
  setTimeout(enemyTurn, 500);
}

function updateEnemyHpBar() {
  const c = run.combat;
  document.getElementById('enemy-hp').textContent = c.enemyHp;
  document.getElementById('enemy-hp-fill').style.width = Math.max(0, (c.enemyHp / c.enemyHpMax) * 100) + '%';
}

function enemyTurn() {
  if (!run || !run.combat) return;
  const c = run.combat;
  const e = c.enemy;

  // 특수 능력 처리
  if (e.regen && c.enemyHp > 0 && c.enemyHp < c.enemyHpMax) {
    c.enemyHp = Math.min(c.enemyHpMax, c.enemyHp + e.regen);
  }
  if (e.guard && Math.random() < e.guard) {
    c.guardActive = true;
    setLog(`${e.name}이(가) 방어 태세를 취합니다.`);
    updateEnemyHpBar();
    setActionsLocked(false);
    return;
  }

  let dmg = Math.max(1, e.atk + rand(-2, 2) - run.def);
  let crit = false;
  if (e.crit && Math.random() < e.crit) { dmg = Math.round(dmg * 1.8); crit = true; flashScreen('crit', 350); }
  if (e.strongHit && Math.random() < e.strongHit) { dmg = Math.round(dmg * 1.5); }

  run.hp = Math.max(0, run.hp - dmg);
  sfx.hit(); shakeScreen();
  showDamageFloat('-' + dmg, crit ? 'crit' : '');
  setLog(crit ? `${e.name}의 치명타! ${dmg} 데미지를 받았습니다.` : `${e.name}의 공격! ${dmg} 데미지를 받았습니다.`);

  if (e.poison && Math.random() < e.poison) { c.poisonTurns = 3; setLog(setLogSuffix(`${e.name}의 독에 중독되었습니다!`)); }
  if (c.poisonTurns > 0) {
    const pdmg = 3;
    run.hp = Math.max(0, run.hp - pdmg);
    c.poisonTurns -= 1;
    showDamageFloat('-' + pdmg, 'poison');
  }

  updateHud();
  saveRun();
  if (run.hp <= 0) { onPlayerDefeated(); return; }
  setActionsLocked(false);
}
function setLogSuffix(msg) { return msg; }

function playerHeal() {
  if (!run || !run.combat || run.potions <= 0) return;
  setActionsLocked(true);
  sfx.button();
  run.potions -= 1;
  const heal = Math.round(run.maxHp * 0.3);
  const before = run.hp;
  run.hp = Math.min(run.maxHp, run.hp + heal);
  showDamageFloat('+' + (run.hp - before), 'heal-float');
  flashScreen('heal', 350);
  setLog(`물약을 사용해 HP를 ${run.hp - before} 회복했습니다.`);
  updateHud(); updatePotionButton(); saveRun();
  setTimeout(enemyTurn, 400);
}

function playerFlee() {
  if (!run || !run.combat || run.combat.isBoss) return;
  setActionsLocked(true);
  sfx.button();
  const success = Math.random() < 0.6;
  if (success) {
    setLog('도망에 성공했습니다!');
    run.combat = null;
    setTimeout(showNextRoomButton, 500);
  } else {
    setLog('도망에 실패했습니다!');
    setTimeout(enemyTurn, 400);
  }
}

function onEnemyDefeated() {
  const c = run.combat;
  const goldGain = Math.round(c.enemy.gold * run.goldMult);
  run.gold += goldGain;
  run.kills += 1;
  sfx.gold();
  spawnSparkles('💰', 6);
  flashScreen('gain', 400);
  setLog(`${c.enemy.name}을(를) 처치! 골드 +${goldGain} 💰`);
  document.getElementById('enemy-hp-fill').style.width = '0%';
  run.combat = null;
  updateHud();

  if (c.isBoss) { setTimeout(() => finishRun(true), 700); return; }
  setTimeout(showNextRoomButton, 700);
}

function onPlayerDefeated() {
  stopBgm();
  sfx.over();
  finishRun(false);
}

/* ---------------- 10. 비전투 방 ---------------- */

function resolveTreasure() {
  const rewards = [
    { label: '골드 +30', apply: (r) => { r.gold += Math.round(30 * r.goldMult); } },
    { label: '최대 HP +10', apply: (r) => { r.maxHp += 10; r.hp += 10; } },
    { label: '공격력 +5', apply: (r) => { r.atk += 5; } },
    { label: '방어력 +3', apply: (r) => { r.def += 3; } },
    { label: 'HP 완전 회복', apply: (r) => { r.hp = r.maxHp; } },
  ];
  setTimeout(() => {
    let resultMsg;
    if (Math.random() < 0.3) {
      const slot = pick(['weapon', 'armor', 'ring']);
      const gradeIdx = weightedGrade();
      const item = { ...EQUIPMENT_POOL[slot][gradeIdx], slot, id: Date.now() + '' + rand(0, 999) };
      save.inventory.push(item);
      const curTotal = itemScore(save.equipped[slot]);
      if (!save.equipped[slot] || itemScore(item) > curTotal) save.equipped[slot] = item;
      run.itemsGained.push(item);
      applyEquipToRun();
      resultMsg = `${item.grade} 등급 장비 [${item.name}]을(를) 획득했습니다!`;
      spawnSparkles('✨', 8);
    } else {
      const reward = pick(rewards);
      reward.apply(run);
      resultMsg = reward.label + ' 획득!';
      spawnSparkles('💰', 6);
    }
    sfx.gold();
    flashScreen('gain', 400);
    setLog(resultMsg);
    updateHud();
    showNextRoomButton();
  }, 500);
}

function itemScore(item) {
  if (!item) return 0;
  return (item.atk || 0) + (item.def || 0) + (item.hp || 0) / 2 + (item.crit || 0) + (item.gold || 0);
}
function applyEquipToRun() {
  // 장비 변경 시 현재 런 스탯에 즉시 반영(간단화를 위해 재계산하지 않고 유지)
}

function resolveHeal() {
  setTimeout(() => {
    const before = run.hp;
    run.hp = run.maxHp;
    const bonusGold = Math.round(5 * run.goldMult);
    run.gold += bonusGold;
    flashScreen('heal', 400);
    spawnSparkles('✨', 6);
    setLog(`HP를 모두 회복했습니다! (+${run.hp - before}) 골드 +${bonusGold}`);
    updateHud();
    showNextRoomButton();
  }, 500);
}

function resolveEvent() {
  const ev = pick(EVENTS);
  const panel = document.getElementById('event-panel');
  panel.classList.remove('hidden');
  panel.innerHTML = `<p>${ev.text}</p>`;
  ev.choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.textContent = choice.label;
    btn.addEventListener('click', () => {
      sfx.button();
      const resultMsg = choice.action(run);
      setLog(resultMsg);
      panel.classList.add('hidden');
      panel.innerHTML = '';
      updateHud(); updatePotionButton();
      showNextRoomButton();
    });
    panel.appendChild(btn);
  });
  document.getElementById('action-bar').classList.add('hidden');
}

function showNextRoomButton() {
  const bar = document.getElementById('action-bar');
  bar.classList.remove('hidden');
  const isLast = run.room >= 10;
  bar.innerHTML = `<button id="btn-next-room" class="btn btn-action btn-attack" style="flex:1">${isLast ? '결과 보기' : '다음 방으로 →'}</button>`;
  document.getElementById('btn-next-room').addEventListener('click', () => {
    sfx.button();
    if (isLast) return;
    run.room += 1;
    restoreActionBar();
    enterRoom();
  });
}

function restoreActionBar() {
  const bar = document.getElementById('action-bar');
  bar.classList.remove('hidden');
  bar.innerHTML = `
    <button id="btn-attack" class="btn btn-action btn-attack">⚔️ 공격</button>
    <button id="btn-heal" class="btn btn-action btn-heal">🧪 회복(<span id="potion-count">${run.potions}</span>)</button>
    <button id="btn-flee" class="btn btn-action btn-flee">🏃 도망</button>`;
  document.getElementById('btn-attack').addEventListener('click', playerAttack);
  document.getElementById('btn-heal').addEventListener('click', playerHeal);
  document.getElementById('btn-flee').addEventListener('click', playerFlee);
  updatePotionButton();
}

/* ---------------- 11. 결과 처리 ---------------- */

function finishRun(victory) {
  clearRunSave();
  const goldEarned = run.gold;
  save.totalGold += goldEarned;
  save.bestFloor = Math.max(save.bestFloor, run.room);
  if (victory) save.clearCount += 1;
  saveGame();

  const itemNames = run.itemsGained.length ? run.itemsGained.map(i => `${i.name}(${i.grade})`).join(', ') : '없음';

  if (victory) {
    stopBgm();
    const bonus = Math.round(30 * run.goldMult);
    save.totalGold += bonus;
    saveGame();
    sfx.clear();
    document.getElementById('clear-time').textContent = Math.round((Date.now() - run.startTime) / 1000) + '초';
    document.getElementById('clear-gold').textContent = goldEarned + bonus;
    document.getElementById('clear-items').textContent = itemNames;
    document.getElementById('clear-kills').textContent = run.kills;
    showScreen('screen-clear');
    spawnConfetti();
  } else {
    document.getElementById('over-room').textContent = run.room;
    document.getElementById('over-kills').textContent = run.kills;
    document.getElementById('over-gold').textContent = goldEarned;
    document.getElementById('over-items').textContent = itemNames;
    showScreen('screen-gameover');
    spawnCrack();
  }
  run = null;
}

/* ---------------- 12. 업그레이드 화면 ---------------- */

function renderUpgradeScreen() {
  document.getElementById('upgrade-gold').textContent = save.totalGold;
  const list = document.getElementById('upgrade-list');
  list.innerHTML = '';
  UPGRADE_DEFS.forEach((def) => {
    const level = save.upgrades[def.key];
    const cost = upgradeCost(def.key, level);
    const pipCount = Math.min(level, 10);
    const pips = Array.from({ length: 10 }, (_, i) => {
      const cls = i < pipCount ? (level > 10 ? 'filled overflow' : 'filled') : '';
      return `<span class="upgrade-pip ${cls}"></span>`;
    }).join('');
    const row = document.createElement('div');
    row.className = 'upgrade-item';
    row.innerHTML = `
      <div class="upgrade-info">
        <div class="upgrade-name">${def.name}</div>
        <div class="upgrade-level">Lv.${level} · ${def.desc}</div>
        <div class="upgrade-pips">${pips}</div>
      </div>
      <button class="btn upgrade-buy" ${save.totalGold < cost ? 'disabled' : ''}>${cost} 💰</button>`;
    row.querySelector('button').addEventListener('click', () => buyUpgrade(def.key));
    list.appendChild(row);
  });
}

function buyUpgrade(key) {
  const level = save.upgrades[key];
  const cost = upgradeCost(key, level);
  if (save.totalGold < cost) return;
  sfx.gold();
  save.totalGold -= cost;
  save.upgrades[key] += 1;
  saveGame();
  renderUpgradeScreen();
}

/* ---------------- 13. 타이틀 화면 갱신 ---------------- */

function renderTitleStats() {
  document.getElementById('hero-portrait').innerHTML = CHAR_ART.hero;
  spawnFireflies();
  document.getElementById('stat-best-floor').textContent = save.bestFloor;
  document.getElementById('stat-total-gold').textContent = save.totalGold;
  document.getElementById('stat-play-count').textContent = save.playCount;
  document.getElementById('btn-sound-toggle').textContent = save.settings.sound ? '🔊' : '🔇';
}

/* ---------------- 14. 초기화 & 이벤트 바인딩 ---------------- */

function init() {
  renderTitleStats();

  document.getElementById('btn-enter-dungeon').addEventListener('click', () => { sfx.button(); startRun(false); });
  document.getElementById('btn-open-upgrade').addEventListener('click', () => { sfx.button(); stopBgm(); renderUpgradeScreen(); showScreen('screen-upgrade'); });
  document.getElementById('btn-upgrade-back').addEventListener('click', () => { sfx.button(); renderTitleStats(); showScreen('screen-title'); playBgm('title'); });
  document.getElementById('btn-over-upgrade').addEventListener('click', () => { sfx.button(); stopBgm(); renderUpgradeScreen(); showScreen('screen-upgrade'); });
  document.getElementById('btn-clear-upgrade').addEventListener('click', () => { sfx.button(); stopBgm(); renderUpgradeScreen(); showScreen('screen-upgrade'); });
  document.getElementById('btn-retry').addEventListener('click', () => { sfx.button(); startRun(false); });
  document.getElementById('btn-next-dungeon').addEventListener('click', () => { sfx.button(); startRun(false); });

  document.getElementById('btn-sound-toggle').addEventListener('click', () => {
    save.settings.sound = !save.settings.sound;
    saveGame();
    renderTitleStats();
    if (save.settings.sound) {
      ensureAudio();
      const theme = document.getElementById('screen-title').classList.contains('active') ? 'title' : bgmTheme;
      if (theme) { bgmTheme = null; playBgm(theme); }
    } else {
      stopBgm();
    }
  });

  // 브라우저 자동재생 제한 대응: 첫 상호작용 이후에만 오디오 활성화
  document.addEventListener('pointerdown', function firstInteract() {
    ensureAudio();
    if (document.getElementById('screen-title').classList.contains('active')) playBgm('title');
    document.removeEventListener('pointerdown', firstInteract);
  }, { once: true });

  // 새로고침 시 진행 중이던 던전 복원
  const savedRun = loadRun();
  if (savedRun) {
    run = savedRun;
    startRun(true);
  }
}

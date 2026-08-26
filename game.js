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
    renderCombat(true);
    setLog(`${boss.name}이(가) 앞을 가로막습니다!`);
  } else if (type === 'normal' || type === 'strong') {
    const pool = ENEMIES.filter(e => e.tier === type);
    const enemy = { ...pick(pool) };
    run.combat = { enemy, enemyHp: enemy.hp, enemyHpMax: enemy.hp, isBoss: false, poisonTurns: 0, guardActive: false };
    renderCombat(false);
    setLog(`${enemy.name}이(가) 나타났습니다!`);
  } else if (type === 'treasure') {
    run.combat = null;
    renderNonCombat('💰', '보물 상자', '반짝이는 상자를 발견했습니다.');
    resolveTreasure();
  } else if (type === 'heal') {
    run.combat = null;
    renderNonCombat('✨', '휴식의 샘', '맑은 샘물이 흐르고 있습니다.');
    resolveHeal();
  } else if (type === 'event') {
    run.combat = null;
    renderNonCombat('❓', '???', '무언가 이상한 기운이 느껴집니다.');
    resolveEvent();
  }
  saveRun();
}

function renderCombat(isBoss) {
  const c = run.combat;
  document.getElementById('enemy-emoji').textContent = c.enemy.emoji;
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
    if (isCrit) { sfx.crit(); setLog(`치명타! ${c.enemy.name}에게 ${dmg} 데미지!`); }
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
  if (e.crit && Math.random() < e.crit) { dmg = Math.round(dmg * 1.8); crit = true; }
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
  setLog(`${c.enemy.name}을(를) 처치! 골드 +${goldGain} 💰`);
  document.getElementById('enemy-hp-fill').style.width = '0%';
  run.combat = null;
  updateHud();

  if (c.isBoss) { setTimeout(() => finishRun(true), 700); return; }
  setTimeout(showNextRoomButton, 700);
}

function onPlayerDefeated() {
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
    } else {
      const reward = pick(rewards);
      reward.apply(run);
      resultMsg = reward.label + ' 획득!';
    }
    sfx.gold();
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
    const bonus = Math.round(30 * run.goldMult);
    save.totalGold += bonus;
    saveGame();
    sfx.clear();
    document.getElementById('clear-time').textContent = Math.round((Date.now() - run.startTime) / 1000) + '초';
    document.getElementById('clear-gold').textContent = goldEarned + bonus;
    document.getElementById('clear-items').textContent = itemNames;
    document.getElementById('clear-kills').textContent = run.kills;
    showScreen('screen-clear');
  } else {
    document.getElementById('over-room').textContent = run.room;
    document.getElementById('over-kills').textContent = run.kills;
    document.getElementById('over-gold').textContent = goldEarned;
    document.getElementById('over-items').textContent = itemNames;
    showScreen('screen-gameover');
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
    const row = document.createElement('div');
    row.className = 'upgrade-item';
    row.innerHTML = `
      <div class="upgrade-info">
        <div class="upgrade-name">${def.name}</div>
        <div class="upgrade-level">Lv.${level} · ${def.desc}</div>
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
  document.getElementById('stat-best-floor').textContent = save.bestFloor;
  document.getElementById('stat-total-gold').textContent = save.totalGold;
  document.getElementById('stat-play-count').textContent = save.playCount;
  document.getElementById('btn-sound-toggle').textContent = save.settings.sound ? '🔊' : '🔇';
}

/* ---------------- 14. 초기화 & 이벤트 바인딩 ---------------- */

function init() {
  renderTitleStats();

  document.getElementById('btn-enter-dungeon').addEventListener('click', () => { sfx.button(); startRun(false); });
  document.getElementById('btn-open-upgrade').addEventListener('click', () => { sfx.button(); renderUpgradeScreen(); showScreen('screen-upgrade'); });
  document.getElementById('btn-upgrade-back').addEventListener('click', () => { sfx.button(); renderTitleStats(); showScreen('screen-title'); });
  document.getElementById('btn-over-upgrade').addEventListener('click', () => { sfx.button(); renderUpgradeScreen(); showScreen('screen-upgrade'); });
  document.getElementById('btn-clear-upgrade').addEventListener('click', () => { sfx.button(); renderUpgradeScreen(); showScreen('screen-upgrade'); });
  document.getElementById('btn-retry').addEventListener('click', () => { sfx.button(); startRun(false); });
  document.getElementById('btn-next-dungeon').addEventListener('click', () => { sfx.button(); startRun(false); });

  document.getElementById('btn-sound-toggle').addEventListener('click', () => {
    save.settings.sound = !save.settings.sound;
    if (save.settings.sound) ensureAudio();
    saveGame();
    renderTitleStats();
  });

  // 새로고침 시 진행 중이던 던전 복원
  const savedRun = loadRun();
  if (savedRun) {
    run = savedRun;
    startRun(true);
  }
}

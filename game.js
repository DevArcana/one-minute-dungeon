'use strict';

/* =========================================================
   1분 던전 - 게임 로직 전체
   구성: 데이터 → 저장 → 사운드 → 상태 → 화면전환 →
         던전 진행 → 전투 → 보물/이벤트 → 보스 → 결과 → 업그레이드
========================================================= */

/* --- 던전 모디파이어: 런 시작 시 랜덤으로 하나가 적용되는 이번 던전 전용 특성 --- */
const DUNGEON_MODIFIERS = [
  { key: 'twilight', name: '🌆 황혼의 던전', desc: '골드 획득 +30%, 대신 최대 HP -10', apply: (r) => { r.goldMult += 0.3; r.maxHp = Math.max(20, r.maxHp - 10); r.hp = Math.min(r.hp, r.maxHp); } },
  { key: 'blessed', name: '🙏 축복받은 던전', desc: '최대 HP +20, 대신 공격력 -3', apply: (r) => { r.maxHp += 20; r.hp += 20; r.atk = Math.max(1, r.atk - 3); } },
  { key: 'cursed', name: '☠️ 저주받은 던전', desc: '공격력 +8, 대신 치명타 확률 -6%', apply: (r) => { r.atk += 8; r.critChance = Math.max(0.02, r.critChance - 0.06); } },
  { key: 'fortune', name: '🍀 행운의 던전', desc: '치명타 확률 +10%, 대신 골드 -15%', apply: (r) => { r.critChance += 0.10; r.goldMult = Math.max(0.2, r.goldMult - 0.15); } },
  { key: 'iron', name: '🛡️ 철벽의 던전', desc: '방어력 +6, 대신 골드 -10%', apply: (r) => { r.def += 6; r.goldMult = Math.max(0.2, r.goldMult - 0.1); } },
];

/* --- 시작 클래스: 타이틀 화면에서 선택, 던전 진입 시 고유 패시브 적용 --- */
const CLASSES = [
  { key: 'warrior', name: '⚔️ 전사', desc: '방어력 +2', apply: (r) => { r.def += 2; } },
  { key: 'rogue', name: '🗡️ 도적', desc: '치명타 확률 +8%', apply: (r) => { r.critChance += 0.08; } },
  { key: 'mage', name: '🔮 마법사', desc: '물약 회복량 +15%p', apply: (r) => { r.healPenalty = (r.healPenalty || 0) - 0.15; } },
];

/* ---------------- 1. 게임 데이터 ---------------- */

const ENEMIES = [
  { key: 'rat',      name: '거대 쥐',    emoji: '🐀', tier: 'normal', hp: 21, atk: 5,  def: 0, gold: 5  },
  { key: 'goblin',   name: '고블린',     emoji: '👺', tier: 'normal', hp: 29, atk: 6,  def: 1, gold: 8  },
  { key: 'bat',      name: '동굴 박쥐',  emoji: '🦇', tier: 'normal', hp: 18, atk: 7,  def: 0, gold: 6, dodge: 0.18, stun: 0.12 },
  { key: 'skeleton', name: '해골 전사',  emoji: '💀', tier: 'normal', hp: 35, atk: 7,  def: 3, gold: 10, guard: 0.24 },
  { key: 'zombie',   name: '좀비',       emoji: '🧟', tier: 'strong', hp: 51, atk: 5,  def: 2, gold: 9,  regen: 4, poison: 0.3 },
  { key: 'spider',   name: '독거미',     emoji: '🕷️', tier: 'strong', hp: 29, atk: 6,  def: 1, gold: 9,  poison: 0.42 },
  { key: 'orc',      name: '오크',       emoji: '👹', tier: 'strong', hp: 56, atk: 10, def: 3, gold: 14, strongHit: 0.32 },
  { key: 'knight',   name: '지옥의 기사', emoji: '🔥', tier: 'strong', hp: 67, atk: 12, def: 4, gold: 20, crit: 0.26, burn: 0.35 },
];

const BOSSES = [
  { key: 'dragon', name: '고대 드래곤',  emoji: '🐉', hp: 166, atk: 18, def: 6, gold: 60, regen: 7,  strongHit: 0.28, burn: 0.3 },
  { key: 'demon',  name: '마왕의 기사',  emoji: '👿', hp: 141, atk: 20, def: 7, gold: 55, guard: 0.26, strongHit: 0.3, stun: 0.15 },
  { key: 'death',  name: '죽음의 군주',  emoji: '💀', hp: 122, atk: 16, def: 5, gold: 50, crit: 0.18, freeze: 0.35 },
];

/* --- 미니보스: 5번째 방에 고정 등장, 최종 보스보다는 약하지만 일반 몬스터보다 강함 --- */
const MINIBOSSES = [
  { key: 'ogre_chief', name: '오크 족장', emoji: '👑', hp: 75, atk: 11, def: 4, gold: 25, strongHit: 0.3, guard: 0.15 },
  { key: 'wraith',     name: '망령 기사', emoji: '👻', hp: 70, atk: 13, def: 3, gold: 25, crit: 0.2, freeze: 0.2 },
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
const GRADE_COLORS = { '일반': '#9ca3af', '고급': '#4ade80', '희귀': '#60a5fa', '영웅': '#a259ff', '전설': '#f0c95a', '레전더리': '#ff7a3c' };

/* --- 레전더리 무기: 보스 처치 시 낮은 확률로 드롭되는 고유 특수효과 무기 --- */
const LEGENDARY_WEAPONS = [
  { name: "흡혈검 '카르페인'", grade: '레전더리', slot: 'weapon', atk: 14, special: 'lifesteal', specialText: '가한 피해의 15%만큼 HP 흡수' },
  { name: "처형자의 도끼 '단두대'", grade: '레전더리', slot: 'weapon', atk: 18, special: 'execute', specialText: '적 HP 25% 이하일 때 피해 +60%' },
  { name: "폭풍의 쌍검 '질풍'", grade: '레전더리', slot: 'weapon', atk: 12, crit: 8, special: 'doubleStrike', specialText: '30% 확률로 추가 타격 발동' },
];

const ABILITY_TEXT = {
  dodge: '가끔 공격을 회피합니다',
  guard: '가끔 방어 태세로 피해를 줄입니다',
  regen: '매 턴 체력을 조금씩 회복합니다',
  poison: '공격 시 확률로 중독시킵니다 (지속 피해)',
  strongHit: '가끔 강력한 일격을 가합니다',
  crit: '낮은 확률로 치명타를 가합니다',
  burn: '공격 시 확률로 화상을 입힙니다 (긴 지속 피해)',
  freeze: '공격 시 확률로 빙결시켜 다음 공격력을 약화시킵니다',
  stun: '낮은 확률로 기절시켜 다음 턴 행동을 막습니다',
};
function abilityText(m) {
  const found = Object.keys(ABILITY_TEXT).filter((k) => m[k]);
  return found.length ? found.map((k) => ABILITY_TEXT[k]).join(' · ') : '강력한 힘을 가진 몬스터입니다';
}

const UPGRADE_DEFS = [
  { key: 'atk',  name: '⚔️ 공격력 강화', desc: '공격력 +2', base: 130 },
  { key: 'def',  name: '🛡️ 방어력 강화', desc: '방어력 +1', base: 130 },
  { key: 'hp',   name: '❤️ 최대 HP 강화', desc: '최대 HP +10', base: 150 },
  { key: 'gold', name: '💰 골드 획득량 강화', desc: '골드 획득 +10%', base: 180 },
  { key: 'luck', name: '🍀 행운 강화', desc: '치명타 확률 +1%', base: 160 },
  { key: 'firstCrit', name: '🎯 선제 필살', desc: '매 전투 첫 공격 100% 치명타 (최대 Lv.1)', base: 500, maxLevel: 1 },
];

/* --- 카드 뽑기: 확률이 공개된 상태에서 카드를 뽑아 즉시 효과를 받는다 --- */
const CARD_POOL = [
  { label: '골드 +25', chance: 45, apply: (r) => { r.gold += Math.round(25 * r.goldMult); } },
  { label: '공격력 +4', chance: 25, apply: (r) => { r.atk += 4; } },
  { label: '방어력 +3', chance: 15, apply: (r) => { r.def += 3; } },
  { label: 'HP 15 회복', chance: 10, apply: (r) => { r.hp = Math.min(r.maxHp, r.hp + 15); } },
  { label: '함정! HP -10', chance: 5, apply: (r) => { r.hp = Math.max(1, r.hp - 10); } },
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
  {
    text: '저주받은 제단이 피의 계약을 제안합니다.',
    choices: [
      { label: '계약한다 (이번 던전 골드 2배, 회복 불가)', action: (r) => {
          r.goldMult *= 2; r.cursedNoHeal = true; return '피의 계약을 맺었습니다! 골드 2배, 대신 더 이상 회복할 수 없습니다.';
        } },
      { label: '거절한다', action: () => '불길한 기운을 피해 지나갔습니다.' },
    ],
  },
  {
    text: '해골이 산 자의 활력을 탐냅니다.',
    choices: [
      { label: '최대 HP 15 넘기고 공격력+8 방어력+4', action: (r) => {
          if (r.maxHp <= 15) return '너무 위험해서 포기했습니다.';
          r.maxHp -= 15; r.hp = Math.min(r.hp, r.maxHp); r.atk += 8; r.def += 4;
          return '생명력이 힘으로 바뀌었습니다. 공격력 +8, 방어력 +4';
        } },
      { label: '거절한다', action: () => '해골을 무시하고 지나갔습니다.' },
    ],
  },
  {
    text: '방랑 상인이 낡은 무기를 감정해주겠다고 합니다.',
    choices: [
      { label: '30골드 주고 무기 강화 시도 (성공 확률 50%)', action: (r) => {
          if (r.gold < 30) return '골드가 부족합니다.';
          const w = save.equipped.weapon;
          if (!w || !w.grade || w.grade === '레전더리') return '강화할 수 있는 무기가 없습니다.';
          const idx = EQUIPMENT_POOL.weapon.findIndex((x) => x.grade === w.grade);
          if (idx < 0 || idx >= EQUIPMENT_POOL.weapon.length - 1) return '이미 최고 등급의 무기입니다.';
          r.gold -= 30;
          if (Math.random() < 0.5) {
            const upgraded = { ...EQUIPMENT_POOL.weapon[idx + 1], slot: 'weapon', id: 'forge-' + Date.now() };
            save.inventory.push(upgraded);
            save.equipped.weapon = upgraded;
            return `강화 성공! [${upgraded.name}]으로 업그레이드되었습니다!`;
          }
          return '강화에 실패했습니다... 무기는 그대로입니다.';
        } },
      { label: '거절한다', action: () => '상인을 지나쳤습니다.' },
    ],
  },
  {
    text: '쓰러진 모험가를 발견했습니다.',
    choices: [
      { label: '물약을 나눠준다 (물약 1개 소모)', action: (r) => {
          if (r.potions <= 0) return '나눠줄 물약이 없습니다.';
          r.potions -= 1;
          r.storyFlags.savedAdventurer = true;
          return '모험가가 고마워하며 떠났습니다. 나중에 도움이 될지도 모릅니다...';
        } },
      { label: '무시한다', action: () => '모험가를 지나쳤습니다.' },
    ],
  },
];

/* --- 유물: 방 4, 방 7에서 하나를 선택해 이번 던전에만 적용되는 특성을 얻는다 --- */
const RELICS = [
  { name: '피의 반지', desc: '치명타 확률 +12%, 대신 최대 HP -15', apply: (r) => { r.critChance += 0.12; r.maxHp = Math.max(10, r.maxHp - 15); r.hp = Math.min(r.hp, r.maxHp); } },
  { name: '전사의 각오', desc: '공격력 +6, 대신 방어력 -2', apply: (r) => { r.atk += 6; r.def = Math.max(0, r.def - 2); } },
  { name: '수호의 부적', desc: '방어력 +5, 대신 공격력 -3', apply: (r) => { r.def += 5; r.atk = Math.max(1, r.atk - 3); } },
  { name: '탐욕의 인장', desc: '골드 획득 +25%, 대신 물약 회복량 -10%p', apply: (r) => { r.goldMult += 0.25; r.healPenalty = (r.healPenalty || 0) + 0.1; } },
  { name: '거인의 심장', desc: '최대 HP +25, 대신 치명타 확률 -5%', apply: (r) => { r.maxHp += 25; r.hp += 25; r.critChance = Math.max(0.02, r.critChance - 0.05); } },
  { name: '민첩의 깃털', desc: '도망 성공 시 이탈 피해 없음, 대신 공격력 -2', apply: (r) => { r.fleeSafe = true; r.atk = Math.max(1, r.atk - 2); } },
];

/* --- 유물 시너지: 특정 유물 조합을 함께 보유하면 추가 효과가 발동한다 --- */
const RELIC_SYNERGIES = [
  { pair: ['피의 반지', '거인의 심장'], name: '불사의 의지', desc: 'HP 완전 회복', apply: (r) => { r.hp = r.maxHp; } },
  { pair: ['전사의 각오', '수호의 부적'], name: '전투의 달인', desc: '공격력 +3, 방어력 +2 추가 획득', apply: (r) => { r.atk += 3; r.def += 2; } },
  { pair: ['탐욕의 인장', '민첩의 깃털'], name: '그림자 상인', desc: '골드 +20 즉시 획득', apply: (r) => { r.gold += Math.round(20 * r.goldMult); } },
];

/* --- 장비 세트 효과: 무기/갑옷/반지가 모두 같은 등급이면 추가 보너스 --- */
const SET_BONUS_BY_GRADE = {
  '일반': { atk: 1, def: 1 },
  '고급': { atk: 2, def: 2, hp: 5 },
  '희귀': { atk: 4, def: 3, hp: 8, crit: 2 },
  '영웅': { atk: 6, def: 5, hp: 12, crit: 3 },
  '전설': { atk: 10, def: 7, hp: 20, crit: 5 },
};

/* --- 업적: 조건 충족 시 1회 해금, 보너스 골드 지급 --- */
/* --- 업적: 마일스톤 생성 헬퍼로 대량 생성해 코드량을 최소화한다 --- */
function totalKills(s) { return Object.values(s.killCounts || {}).reduce((a, b) => a + b, 0); }
function milestones(prefix, name, descFn, values, bonusFn, checkFn) {
  return values.map((v, i) => ({
    id: `${prefix}_${v}`, name: `${name} ${v}`, desc: descFn(v),
    bonus: bonusFn(i), check: (s, res) => checkFn(s, res, v),
  }));
}

const ACHIEVEMENTS = [
  { id: 'first_clear',  name: '첫 승리',      desc: '던전을 처음으로 클리어한다',       bonus: 50,  check: (s, res) => res.victory },
  { id: 'no_potion',    name: '무병장수',      desc: '물약을 한 번도 쓰지 않고 클리어한다', bonus: 80,  check: (s, res) => res.victory && !res.usedPotion },
  { id: 'bestiary_full', name: '박물학자',     desc: '몬스터 도감을 모두 채운다',         bonus: 150, check: (s) => s.bestiary.length >= 11 },
  { id: 'clear_x3',     name: '베테랑 모험가', desc: '던전을 3회 클리어한다',            bonus: 100, check: (s) => s.clearCount >= 3 },
  { id: 'rich',         name: '거부',          desc: '누적 골드 1000을 달성한다',        bonus: 100, check: (s) => s.totalGold >= 1000 },
  { id: 'flawless',     name: '완벽한 승리',   desc: 'HP 절반 이하로 떨어지지 않고 클리어한다', bonus: 120, check: (s, res) => res.victory && !res.wasLowHp },

  ...milestones('clear', '던전 클리어', (v) => `던전을 ${v}회 클리어한다`,
    [1, 3, 5, 10, 15, 20, 30, 50, 75, 100], (i) => 30 + i * 25, (s, r, v) => s.clearCount >= v),

  ...milestones('kills', '몬스터 사냥꾼', (v) => `몬스터를 누적 ${v}마리 처치한다`,
    [10, 25, 50, 100, 200, 300, 500, 750, 1000, 1500], (i) => 20 + i * 20, (s, r, v) => totalKills(s) >= v),

  ...milestones('gold', '재산가', (v) => `누적 골드 ${v}를 달성한다`,
    [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000], (i) => 15 + i * 20, (s, r, v) => s.totalGold >= v),

  ...ENEMIES.map((m) => ({
    id: `mon_${m.key}`, name: `첫 만남: ${m.name}`, desc: `${m.name}을(를) 처음 처치한다`,
    bonus: 15, check: (s) => s.bestiary.includes(m.key),
  })),
  ...BOSSES.map((b) => ({
    id: `boss_${b.key}`, name: `보스 격파: ${b.name}`, desc: `${b.name}을(를) 처음 처치한다`,
    bonus: 60, check: (s) => s.bestiary.includes(b.key),
  })),
  ...MINIBOSSES.map((m) => ({
    id: `miniboss_${m.key}`, name: `미니보스 격파: ${m.name}`, desc: `${m.name}을(를) 처음 처치한다`,
    bonus: 40, check: (s) => s.bestiary.includes(m.key),
  })),

  ...UPGRADE_DEFS.filter((u) => u.key !== 'firstCrit').flatMap((u) => [
    { id: `up_${u.key}_5`, name: `${u.name} Lv.5`, desc: `${u.name}을(를) Lv.5까지 올린다`, bonus: 40, check: (s) => s.upgrades[u.key] >= 5 },
    { id: `up_${u.key}_10`, name: `${u.name} Lv.10`, desc: `${u.name}을(를) Lv.10까지 올린다`, bonus: 80, check: (s) => s.upgrades[u.key] >= 10 },
  ]),

  ...['일반', '고급', '희귀', '영웅', '전설'].map((grade, i) => ({
    id: `grade_${grade}`, name: `${grade} 등급 장비`, desc: `${grade} 등급 장비를 보유한다`,
    bonus: 15 + i * 15, check: (s) => s.inventory.some((it) => it.grade === grade),
  })),

  ...milestones('relic', '유물 수집가', (v) => `서로 다른 유물 ${v}종을 만난다`,
    [1, 3, 6], (i) => 30 + i * 30, (s, r, v) => s.relicsSeen.length >= v),

  { id: 'pet_owned',   name: '첫 동료',      desc: '펫을 하나 이상 보유한다', bonus: 30, check: (s) => !!s.pet },
  { id: 'pet_max',     name: '완숙한 동료',  desc: '펫을 Lv.10까지 강화한다', bonus: 80, check: (s) => s.pet && s.pet.level >= 10 },
  { id: 'pet_evolved', name: '전설의 동료',  desc: '펫을 진화시킨다(Lv.10 도달)', bonus: 80, check: (s) => s.pet && s.pet.level >= 10 },

  ...milestones('hardcore', '하드코어 정복자', (v) => `하드코어 모드로 ${v}회 클리어한다`,
    [1, 5, 10], (i) => 100 + i * 80, (s, r, v) => (s.hardcoreClears || 0) >= v),

  ...milestones('bossrush', '보스 러시 챔피언', (v) => `보스 러시를 ${v}회 클리어한다`,
    [1, 5, 10], (i) => 60 + i * 60, (s, r, v) => (s.bossRushClears || 0) >= v),

  ...milestones('elite', '엘리트 헌터', (v) => `엘리트 몬스터를 ${v}마리 처치한다`,
    [1, 10, 50], (i) => 30 + i * 40, (s, r, v) => (s.eliteKills || 0) >= v),

  ...milestones('golden', '황금 사냥꾼', (v) => `황금 몬스터를 ${v}마리 처치한다`,
    [1, 10, 50], (i) => 30 + i * 40, (s, r, v) => (s.goldenKills || 0) >= v),

  ...milestones('flee', '재빠른 발놀림', (v) => `도망에 ${v}회 성공한다`,
    [1, 20, 100], (i) => 15 + i * 25, (s, r, v) => (s.fleeSuccessCount || 0) >= v),

  ...milestones('daily', '성실한 모험가', (v) => `일일 퀘스트를 누적 ${v}개 완료한다`,
    [10, 50, 150], (i) => 40 + i * 40, (s, r, v) => (s.dailyQuestsClaimedTotal || 0) >= v),

  ...milestones('weekly', '주간 도전자', (v) => `주간 도전과제를 누적 ${v}개 완료한다`,
    [1, 5, 15], (i) => 60 + i * 60, (s, r, v) => (s.weeklyQuestsClaimedTotal || 0) >= v),

  ...milestones('play', '던전 단골', (v) => `던전에 ${v}회 입장한다`,
    [10, 25, 50, 100, 200], (i) => 15 + i * 20, (s, r, v) => s.playCount >= v),

  ...milestones('floor', '깊은 곳까지', (v) => `${v}번째 방까지 도달한다`,
    [3, 5, 7, 9, 10], (i) => 15 + i * 15, (s, r, v) => s.bestFloor >= v),

  ...milestones('speed', '스피드러너', (v) => `클리어 기록 ${v}초 이내를 달성한다`,
    [60, 45, 30], (i) => 60 + i * 40, (s, r, v) => s.bestClearTime !== null && s.bestClearTime <= v),
];

/* --- 일일 퀘스트: 매일 날짜가 바뀌면 3개가 새로 주어지고, 달성하면 보상을 받는다 --- */
const QUEST_POOL = [
  { id: 'kills',    type: 'kills',    target: 10, desc: '몬스터 10마리 처치', reward: 50 },
  { id: 'rooms',    type: 'rooms',    target: 15, desc: '방 15개 통과',       reward: 45 },
  { id: 'clears',   type: 'clears',   target: 1,  desc: '던전 1회 클리어',    reward: 70 },
  { id: 'treasure', type: 'treasure', target: 3,  desc: '보물방 3번 방문',    reward: 40 },
  { id: 'relics',   type: 'relics',   target: 2,  desc: '유물 2개 선택',      reward: 45 },
  { id: 'boss',     type: 'boss',     target: 1,  desc: '보스 1마리 처치',    reward: 60 },
];

/* --- 주간 도전과제: 일주일마다 큰 목표 하나가 배정되어 큰 골드 보상을 준다 --- */
const WEEKLY_QUEST_POOL = [
  { id: 'w_boss',  type: 'boss',       target: 10,  desc: '이번 주 보스 10마리 처치',  reward: 200 },
  { id: 'w_clear', type: 'clears',     target: 5,   desc: '이번 주 던전 5회 클리어',   reward: 250 },
  { id: 'w_kill',  type: 'kills',      target: 100, desc: '이번 주 몬스터 100마리 처치', reward: 200 },
  { id: 'w_gold',  type: 'goldEarned', target: 500, desc: '이번 주 골드 500 획득',      reward: 180 },
];

/* --- 상점에서 구매 가능한 펫: 매 전투 자동으로 약간의 피해를 추가로 준다 --- */
const PET_POOL = [
  { key: 'sprite', name: '🧚 꼬마 요정', atk: 2, price: 120, evolvedName: '🧚‍♀️ 요정 여왕', evolvedBonus: 4 },
  { key: 'wolfcub', name: '🐺 새끼 늑대', atk: 4, price: 220, evolvedName: '🐺 은빛 늑대왕', evolvedBonus: 6 },
  { key: 'hatchling', name: '🐲 아기 드래곤', atk: 7, price: 380, evolvedName: '🐉 성체 드래곤', evolvedBonus: 10 },
];
const PET_MAX_LEVEL = 10;
const PET_ATK_PER_LEVEL = 2;

function petBaseAtk(key) {
  const def = PET_POOL.find((p) => p.key === key);
  return def ? def.atk : 0;
}
function petEffectiveAtk(pet) {
  if (!pet) return 0;
  const level = pet.level || 1;
  const def = PET_POOL.find((p) => p.key === pet.key);
  const evolvedBonus = (def && level >= PET_MAX_LEVEL) ? def.evolvedBonus : 0;
  return petBaseAtk(pet.key) + (level - 1) * PET_ATK_PER_LEVEL + evolvedBonus;
}
function petUpgradeCost(level) {
  return Math.round(60 * Math.pow(1.35, level - 1));
}

/* ---------------- 2. 저장 데이터 ---------------- */

const SAVE_KEY = 'omd_save_v1';
const RUN_KEY = 'omd_run_v1';

function defaultSave() {
  return {
    bestFloor: 0,
    totalGold: 0,
    playCount: 0,
    clearCount: 0,
    bestClearTime: null,
    upgrades: { atk: 0, def: 0, hp: 0, gold: 0, luck: 0, firstCrit: 0 },
    inventory: [],
    equipped: { weapon: null, armor: null, ring: null },
    bestiary: [],
    achievements: [],
    pet: null,
    shopOffers: null,
    dailyQuests: null,
    weeklyQuest: null,
    killCounts: {},
    huntsClaimed: [],
    lastSeen: null,
    idleGold: { accumulated: 0, lastTick: Date.now() },
    lastClass: 'warrior',
    relicsSeen: [],
    eliteKills: 0,
    goldenKills: 0,
    fleeSuccessCount: 0,
    hardcoreClears: 0,
    bossRushClears: 0,
    dailyQuestsClaimedTotal: 0,
    weeklyQuestsClaimedTotal: 0,
    settings: { sound: true, hardcore: false },
  };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    const def = defaultSave();
    return {
      ...def, ...parsed,
      upgrades: { ...def.upgrades, ...(parsed.upgrades || {}) },
      settings: { ...def.settings, ...(parsed.settings || {}) },
      equipped: { ...def.equipped, ...(parsed.equipped || {}) },
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      bestiary: Array.isArray(parsed.bestiary) ? parsed.bestiary : [],
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      pet: parsed.pet || null,
      shopOffers: Array.isArray(parsed.shopOffers) ? parsed.shopOffers : null,
      dailyQuests: parsed.dailyQuests || null,
      weeklyQuest: parsed.weeklyQuest || null,
      killCounts: (parsed.killCounts && typeof parsed.killCounts === 'object') ? parsed.killCounts : {},
      huntsClaimed: Array.isArray(parsed.huntsClaimed) ? parsed.huntsClaimed : [],
      lastSeen: parsed.lastSeen || null,
      idleGold: (parsed.idleGold && typeof parsed.idleGold === 'object')
        ? { accumulated: parsed.idleGold.accumulated || 0, lastTick: parsed.idleGold.lastTick || Date.now() }
        : def.idleGold,
      lastClass: CLASSES.some((c) => c.key === parsed.lastClass) ? parsed.lastClass : 'warrior',
      relicsSeen: Array.isArray(parsed.relicsSeen) ? parsed.relicsSeen : [],
    };
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
  const table = [['normal', 33], ['strong', 30], ['treasure', 7], ['heal', 6], ['event', 8], ['ambush', 8], ['cards', 8]];
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
  const bestiaryBonus = save.bestiary.length >= 11 ? 0.05 : 0;
  return {
    maxHp: 50 + u.hp * 10,
    atk: 5 + Math.round(u.atk * 1.5),
    def: 2 + u.def * 1,
    goldMult: 1 + u.gold * 0.1 + bestiaryBonus,
    critChance: 0.10 + u.luck * 0.01,
  };
}

/* 클리어를 거듭할수록 몬스터도 함께 강해져서, 업그레이드로 인한
   일방적인 공격력 우위(2방컷)를 방지한다. */
function enemyScaleMult() {
  return 1 + Math.min(1.2, save.clearCount * 0.14 + Math.floor(save.playCount / 4) * 0.05);
}
function equippedBonus() {
  const bonus = { atk: 0, def: 0, hp: 0, crit: 0, gold: 0 };
  const { weapon, armor, ring } = save.equipped;
  Object.values(save.equipped).forEach((item) => {
    if (!item) return;
    bonus.atk += item.atk || 0; bonus.def += item.def || 0; bonus.hp += item.hp || 0;
    bonus.crit += item.crit || 0; bonus.gold += item.gold || 0;
  });
  if (weapon && armor && ring && weapon.grade === armor.grade && armor.grade === ring.grade) {
    const set = SET_BONUS_BY_GRADE[weapon.grade];
    if (set) {
      bonus.atk += set.atk || 0; bonus.def += set.def || 0; bonus.hp += set.hp || 0;
      bonus.crit += set.crit || 0;
    }
  }
  return bonus;
}
function upgradeCost(key, level) {
  return Math.round(UPGRADE_DEFS.find(u => u.key === key).base * Math.pow(2, level));
}

/* ---------------- 6. 던전 실행 상태 ---------------- */

let run = null;

function newRun(bossRush) {
  const bs = baseStats();
  const eq = equippedBonus();
  const run = {
    hp: bs.maxHp + eq.hp,
    maxHp: bs.maxHp + eq.hp,
    atk: bs.atk + eq.atk,
    def: bs.def + eq.def,
    critChance: bs.critChance + eq.crit / 100,
    goldMult: bs.goldMult + eq.gold / 100,
    gold: 0,
    room: 1,
    kills: 0,
    potions: 1,
    usedPotion: false,
    wasLowHp: false,
    cursedNoHeal: false,
    healPenalty: 0,
    fleeSafe: false,
    combo: 0,
    autoBattle: false,
    relics: [],
    synergiesApplied: [],
    storyFlags: {},
    itemsGained: [],
    bossRush: !!bossRush,
    roomTypes: bossRush ? ['boss', 'boss', 'boss'] : buildRoomSequence(),
    bossQueue: bossRush ? [...BOSSES].sort(() => Math.random() - 0.5) : null,
    combat: null, // { enemy, enemyHp, enemyHpMax, isBoss, poisonTurns, guardActive }
    startTime: Date.now(),
  };
  const cls = CLASSES.find((c) => c.key === save.lastClass) || CLASSES[0];
  cls.apply(run);
  run.classKey = cls.key;
  if (!bossRush) {
    const mod = pick(DUNGEON_MODIFIERS);
    mod.apply(run);
    run.modifierKey = mod.key;
    run.modifierName = mod.name;
    run.modifierDesc = mod.desc;
  }
  run.hp = Math.min(run.hp, run.maxHp);
  return run;
}

function buildRoomSequence() {
  const seq = [];
  for (let i = 1; i <= 9; i++) seq.push(weightedRoomType());
  seq[3] = 'relic'; // 방 4: 유물 선택
  seq[4] = 'miniboss'; // 방 5: 미니보스
  seq[6] = 'relic'; // 방 7: 유물 선택
  seq.push('boss');
  return seq;
}

/* ---------------- 7. 화면 전환 ---------------- */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ---------------- 8. 던전 진행 ---------------- */

function startRun(resumed, bossRush) {
  ensureAudio();
  stopAutoBattleLoop();
  if (!resumed) {
    run = newRun(bossRush);
    save.playCount += 1;
    saveGame();
    logHistory = [];
  }
  showScreen('screen-game');
  enterRoom();
}

function makeCombat(enemyBase, isBoss, fleeLeft) {
  const golden = !isBoss && Math.random() < 0.05;
  const elite = !isBoss && !golden && Math.random() < 0.04;
  const mult = enemyScaleMult();
  const eliteMult = elite ? 1.5 : 1;
  const enemy = {
    ...enemyBase,
    hp: Math.round(enemyBase.hp * mult * eliteMult),
    atk: Math.round(enemyBase.atk * (1 + (mult - 1) * 0.5) * (elite ? 1.3 : 1)),
  };
  return {
    enemy, enemyHp: enemy.hp, enemyHpMax: enemy.hp, isBoss,
    poisonTurns: 0, burnTurns: 0, frozenNext: false, stunNext: false,
    guardActive: false, fleeLeft, golden, elite, queue: [],
  };
}

const SCENE_BY_TYPE = {
  normal: 'scene-battle', strong: 'scene-battle',
  ambush: 'scene-ambush',
  boss: 'scene-boss', miniboss: 'scene-boss',
  treasure: 'scene-treasure',
  heal: 'scene-heal',
  relic: 'scene-relic', cards: 'scene-relic',
  event: 'scene-event',
};
function setSceneByType(type) {
  const card = document.getElementById('encounter-card');
  card.className = 'encounter-card' + (SCENE_BY_TYPE[type] ? ' ' + SCENE_BY_TYPE[type] : '');
}

function enterRoom() {
  document.getElementById('event-panel').classList.add('hidden');
  document.getElementById('event-panel').innerHTML = '';
  restoreActionBar();
  updateHud();

  const type = run.roomTypes[run.room - 1];
  document.getElementById('room-number').textContent = run.room;
  setSceneByType(type);

  if (type === 'boss') {
    const boss = { ...(run.bossQueue ? run.bossQueue[run.room - 1] : pick(BOSSES)) };
    run.combat = makeCombat(boss, true, 0);
    sfx.boss();
    playBgm('boss');
    flashScreen('boss', 600);
    renderCombat(true);
    if (run.storyFlags.savedAdventurer && !run.storyFlags.adventurerHelped) {
      const strike = Math.round(run.combat.enemyHpMax * 0.1);
      run.combat.enemyHp = Math.max(1, run.combat.enemyHp - strike);
      run.storyFlags.adventurerHelped = true;
      updateEnemyHpBar();
      setLog(`${boss.name}이(가) 앞을 가로막습니다! 구했던 모험가가 나타나 선제공격으로 ${strike}의 피해를 입혔습니다!`);
    } else {
      setLog(`${boss.name}이(가) 앞을 가로막습니다!`);
    }
  } else if (type === 'miniboss') {
    const mini = { ...pick(MINIBOSSES) };
    run.combat = makeCombat(mini, false, 1);
    run.combat.golden = false;
    sfx.boss();
    playBgm('boss');
    flashScreen('boss', 500);
    renderCombat(false);
    setLog(`👑 미니보스 ${mini.name}이(가) 나타났습니다!`);
  } else if (type === 'normal' || type === 'strong') {
    const pool = ENEMIES.filter(e => e.tier === type);
    const enemy = { ...pick(pool) };
    run.combat = makeCombat(enemy, false, 2);
    playBgm('battle');
    renderCombat(false);
    setLog(run.combat.golden ? `✨ 황금빛 ${enemy.name}이(가) 나타났습니다! 골드 3배!`
      : run.combat.elite ? `💢 강화된 ${enemy.name}이(가) 나타났습니다! 처치 시 장비 확정 획득!`
      : `${enemy.name}이(가) 나타났습니다!`);
  } else if (type === 'ambush') {
    const pool = ENEMIES.filter(e => e.tier === 'normal');
    const first = { ...pick(pool) };
    const second = { ...pick(pool) };
    run.combat = makeCombat(first, false, 2);
    run.combat.queue = [second];
    playBgm('battle');
    renderCombat(false);
    setLog(`매복이다! ${first.name}과(와) ${second.name}이(가) 동시에 나타났습니다!`);
  } else if (type === 'relic') {
    run.combat = null;
    playBgm('dungeon');
    renderNonCombat('🔮', '고대의 제단', '유물 하나를 선택할 수 있습니다.');
    resolveRelic();
  } else if (type === 'cards') {
    run.combat = null;
    playBgm('dungeon');
    renderNonCombat('🎴', '신비한 카드 뭉치', '카드를 뽑으면 확률에 따라 효과가 적용됩니다.');
    resolveCards();
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
  document.getElementById('enemy-emoji').className = 'enemy-emoji' + (isBoss ? ' boss-enter' : '') + (c.golden ? ' golden' : '') + (c.elite ? ' elite' : '');
  document.getElementById('enemy-name').textContent = c.enemy.name + (c.golden ? ' ✨' : '') + (c.elite ? ' 💢 엘리트' : '');
  document.getElementById('enemy-hp').textContent = c.enemyHp;
  document.getElementById('enemy-hp-max').textContent = c.enemyHpMax;
  document.getElementById('enemy-hp-fill').style.width = '100%';
  document.getElementById('room-badge').classList.remove('hidden');
  updatePotionButton();
  updateFleeButton();
  updateComboUI();
  updateAutoBattleButton();
}

function updateFleeButton() {
  const btn = document.getElementById('btn-flee');
  if (!btn || !run || !run.combat) return;
  const c = run.combat;
  btn.disabled = c.isBoss || c.fleeLeft <= 0;
  btn.textContent = c.isBoss ? '🏃 도망 불가' : `🏃 도망(${c.fleeLeft})`;
}

const COMBO_MAX = 5;
function updateComboUI() {
  const btn = document.getElementById('btn-ultimate');
  if (!btn || !run) return;
  const inCombat = !!run.combat;
  btn.classList.toggle('hidden', !inCombat);
  if (!inCombat) return;
  const ready = run.combo >= COMBO_MAX;
  btn.disabled = !ready;
  btn.textContent = ready ? '💥 필살기 발동!' : `💥 필살기(${run.combo}/${COMBO_MAX})`;
}

function renderNonCombat(emoji, name, msg) {
  document.getElementById('enemy-emoji').textContent = emoji;
  document.getElementById('enemy-emoji').className = 'enemy-emoji';
  document.getElementById('enemy-name').textContent = name;
  document.getElementById('enemy-hp').textContent = '-';
  document.getElementById('enemy-hp-max').textContent = '-';
  document.getElementById('enemy-hp-fill').style.width = '0%';
  document.getElementById('action-bar').classList.add('hidden');
  setLog(msg);
}

function updateHud() {
  document.getElementById('hud-hp').textContent = Math.max(0, run.hp);
  document.getElementById('hud-hp-max').textContent = run.maxHp;
  document.getElementById('hud-atk').textContent = run.atk;
  document.getElementById('hud-def').textContent = run.def;
  document.getElementById('hud-gold').textContent = run.gold;
  document.getElementById('hud-room').textContent = run.room;
  document.getElementById('hud-room-total').textContent = run.roomTypes.length;
  document.getElementById('room-total').textContent = run.roomTypes.length;
  const modBadge = document.getElementById('hud-modifier');
  modBadge.textContent = run.modifierName ? `${run.modifierName}` : '';
  modBadge.title = run.modifierDesc || '';
  document.getElementById('hud-modifier-row').classList.toggle('hidden', !run.modifierName);
  if (run.hp / run.maxHp <= 0.5) run.wasLowHp = true;
  updateLowHpVignette();
}

let logHistory = [];
function setLog(msg) {
  document.getElementById('battle-log').textContent = msg;
  logHistory.push(msg);
  if (logHistory.length > 40) logHistory.shift();
  const panel = document.getElementById('log-history-panel');
  if (panel && !panel.classList.contains('hidden')) renderLogHistory();
}
function renderLogHistory() {
  const list = document.getElementById('log-history-list');
  list.innerHTML = logHistory.length
    ? logHistory.slice().reverse().map((m) => `<p>${m}</p>`).join('')
    : '<p>기록이 없습니다.</p>';
}

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
    if (!el) return;
    if (id === 'btn-heal') { el.disabled = locked || (run && run.potions <= 0); return; }
    if (id === 'btn-flee') { el.disabled = locked || !run || !run.combat || run.combat.isBoss || run.combat.fleeLeft <= 0; return; }
    el.disabled = locked;
  });
}

function playerAttack() {
  if (!run || !run.combat) return;
  const c = run.combat;
  setActionsLocked(true);

  if (c.stunNext) {
    c.stunNext = false;
    setLog('기절해서 움직일 수 없습니다! 💫');
    setTimeout(enemyTurn, 500);
    return;
  }

  sfx.attack();
  const weapon = save.equipped.weapon;
  const special = weapon && weapon.special;
  const guaranteedCrit = save.upgrades.firstCrit >= 1 && !c.firstAttackDone;
  c.firstAttackDone = true;
  const isCrit = guaranteedCrit || Math.random() < run.critChance;
  let dmg = Math.max(1, run.atk + rand(-2, 3) - c.enemy.def);
  if (isCrit) dmg = Math.round(dmg * 1.8);
  let frozeMsg = '';
  if (c.frozenNext) {
    dmg = Math.max(1, Math.round(dmg * 0.6));
    c.frozenNext = false;
    frozeMsg = '(빙결로 위력 약화) ';
  }
  let executeMsg = '';
  if (special === 'execute' && c.enemyHp <= c.enemyHpMax * 0.25) {
    dmg = Math.round(dmg * 1.6);
    executeMsg = '처형! ';
  }

  let hitLanded = false;
  let dealtDmg = 0;
  if (c.enemy.dodge && Math.random() < c.enemy.dodge) {
    setLog(`${c.enemy.name}이(가) 공격을 회피했습니다!`);
  } else if (c.guardActive) {
    dmg = Math.round(dmg * 0.4);
    c.guardActive = false;
    c.enemyHp = Math.max(0, c.enemyHp - dmg);
    setLog(`${c.enemy.name}이(가) 방어했습니다! ${dmg} 데미지`);
    hitEnemyAnim(); showDamageFloat('-' + dmg, isCrit ? 'crit' : '');
    run.combo = Math.min(COMBO_MAX, run.combo + 1);
    hitLanded = true; dealtDmg = dmg;
  } else {
    c.enemyHp = Math.max(0, c.enemyHp - dmg);
    hitEnemyAnim(); showDamageFloat('-' + dmg, isCrit ? 'crit' : '');
    if (isCrit) { sfx.crit(); flashScreen('crit', 350); setLog(`${guaranteedCrit ? '선제 필살! ' : ''}${executeMsg}${frozeMsg}치명타! ${c.enemy.name}에게 ${dmg} 데미지!`); }
    else setLog(`${executeMsg}${frozeMsg}${c.enemy.name}에게 ${dmg} 데미지!`);
    run.combo = Math.min(COMBO_MAX, run.combo + 1);
    hitLanded = true; dealtDmg = dmg;
  }

  if (hitLanded && special === 'lifesteal' && dealtDmg > 0) {
    const heal = Math.max(1, Math.round(dealtDmg * 0.15));
    run.hp = Math.min(run.maxHp, run.hp + heal);
    showDamageFloat('+' + heal, 'heal-float');
  }
  if (hitLanded && special === 'doubleStrike' && c.enemyHp > 0 && Math.random() < 0.3) {
    const extraDmg = Math.max(1, Math.round(dealtDmg * 0.5));
    c.enemyHp = Math.max(0, c.enemyHp - extraDmg);
    showDamageFloat('-' + extraDmg, '');
    setLog(`🌪️ 질풍의 추가 타격! ${extraDmg} 데미지 추가!`);
    hitEnemyAnim();
  }

  applyPetDamage();
  updateEnemyHpBar();
  updateComboUI();
  updateHud();

  if (c.enemyHp <= 0) { onEnemyDefeated(); return; }
  setTimeout(enemyTurn, 500);
}

function applyPetDamage() {
  if (!save.pet || !run || !run.combat || run.combat.enemyHp <= 0) return;
  const c = run.combat;
  const dmg = petEffectiveAtk(save.pet);
  c.enemyHp = Math.max(0, c.enemyHp - dmg);
  showDamageFloat('-' + dmg, 'pet');
}

function playerUltimate() {
  if (!run || !run.combat || run.combo < COMBO_MAX) return;
  const c = run.combat;
  setActionsLocked(true);
  sfx.crit();
  flashScreen('crit', 400);
  const dmg = Math.max(1, Math.round((run.atk * 3 + rand(0, 6)) - c.enemy.def * 0.5));
  c.enemyHp = Math.max(0, c.enemyHp - dmg);
  c.guardActive = false;
  run.combo = 0;
  hitEnemyAnim(); shakeScreen();
  showDamageFloat('-' + dmg, 'crit');
  setLog(`💥 필살기 작렬! ${c.enemy.name}에게 ${dmg}의 폭발적인 피해!`);
  applyPetDamage();
  updateEnemyHpBar();
  updateComboUI();
  if (c.enemyHp <= 0) { onEnemyDefeated(); return; }
  setTimeout(enemyTurn, 500);
}

/* --- 자동 전투: 연타 피로도를 줄이기 위한 자동 공격 --- */
let autoBattleTimer = null;
function stopAutoBattleLoop() {
  if (autoBattleTimer) clearInterval(autoBattleTimer);
  autoBattleTimer = null;
}
function updateAutoBattleButton() {
  const btn = document.getElementById('btn-autobattle');
  if (!btn || !run) return;
  btn.classList.toggle('active', run.autoBattle);
  btn.textContent = run.autoBattle ? '🔁 자동전투 ON' : '🔁 자동전투 OFF';
}
function toggleAutoBattle() {
  if (!run) return;
  sfx.button();
  run.autoBattle = !run.autoBattle;
  updateAutoBattleButton();
  if (run.autoBattle) {
    stopAutoBattleLoop();
    autoBattleTimer = setInterval(autoBattleTick, 700);
  } else {
    stopAutoBattleLoop();
  }
}
function autoBattleTick() {
  if (!run || !run.autoBattle) { stopAutoBattleLoop(); return; }
  if (!run.combat) return; // 방 사이 대기 중에는 아무것도 하지 않음
  const lowHp = run.hp / run.maxHp < 0.35;
  const healBtn = document.getElementById('btn-heal');
  if (lowHp && run.potions > 0 && healBtn && !healBtn.disabled) { playerHeal(); return; }
  if (lowHp && run.potions <= 0) {
    run.autoBattle = false;
    updateAutoBattleButton();
    stopAutoBattleLoop();
    setLog('⚠️ HP가 위험해서 자동 전투를 멈췄습니다.');
    return;
  }
  const attackBtn = document.getElementById('btn-attack');
  if (attackBtn && !attackBtn.disabled) playerAttack();
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
    updateFleeButton();
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

  if (e.burn && Math.random() < e.burn) { c.burnTurns = 4; setLog(`${e.name}의 공격에 화상을 입었습니다! 🔥`); }
  if (c.burnTurns > 0) {
    const bdmg = 2;
    run.hp = Math.max(0, run.hp - bdmg);
    c.burnTurns -= 1;
    showDamageFloat('-' + bdmg, 'burn');
  }

  if (e.freeze && Math.random() < e.freeze) {
    c.frozenNext = true;
    setLog(`${e.name}의 냉기에 얼어붙었습니다! 🧊 다음 공격이 약해집니다.`);
  }
  if (e.stun && Math.random() < e.stun) {
    c.stunNext = true;
    setLog(`${e.name}의 일격에 기절했습니다! 💫 다음 턴 행동이 불가능합니다.`);
  }

  updateHud();
  saveRun();
  if (run.hp <= 0) { onPlayerDefeated(); return; }
  setActionsLocked(false);
  updateFleeButton();
}
function setLogSuffix(msg) { return msg; }

function playerHeal() {
  if (!run || !run.combat || run.potions <= 0) return;
  if (run.cursedNoHeal) { setLog('저주 때문에 회복할 수 없습니다!'); return; }
  setActionsLocked(true);
  if (run.combat.stunNext) {
    run.combat.stunNext = false;
    setLog('기절해서 움직일 수 없습니다! 💫');
    setTimeout(enemyTurn, 500);
    return;
  }
  sfx.button();
  run.potions -= 1;
  run.usedPotion = true;
  const heal = Math.round(run.maxHp * Math.max(0.05, 0.25 - (run.healPenalty || 0)));
  const before = run.hp;
  run.hp = Math.min(run.maxHp, run.hp + heal);
  showDamageFloat('+' + (run.hp - before), 'heal-float');
  flashScreen('heal', 350);
  setLog(`물약을 사용해 HP를 ${run.hp - before} 회복했습니다.`);
  updateHud(); updatePotionButton(); saveRun();
  setTimeout(enemyTurn, 400);
}

function playerFlee() {
  if (!run || !run.combat || run.combat.isBoss || run.combat.fleeLeft <= 0) return;
  const c = run.combat;
  setActionsLocked(true);
  if (c.stunNext) {
    c.stunNext = false;
    setLog('기절해서 움직일 수 없습니다! 💫');
    setTimeout(enemyTurn, 500);
    return;
  }
  sfx.button();
  c.fleeLeft -= 1;
  const success = Math.random() < 0.6;
  if (success) {
    save.fleeSuccessCount = (save.fleeSuccessCount || 0) + 1;
    const parting = run.fleeSafe ? 0 : Math.max(1, Math.round(c.enemy.atk * 0.35) - Math.round(run.def * 0.3));
    run.hp = Math.max(0, run.hp - parting);
    if (parting > 0) showDamageFloat('-' + parting, '');
    setLog(parting > 0 ? `도망에 성공했지만 등을 스쳐 ${parting}의 피해를 입었습니다.` : '깃털처럼 가볍게 도망에 성공했습니다!');
    updateHud();
    run.combat = null;
    updateComboUI();
    saveRun();
    if (run.hp <= 0) { onPlayerDefeated(); return; }
    setTimeout(showNextRoomButton, 500);
  } else {
    updateFleeButton();
    setLog(run.combat.fleeLeft > 0 ? '도망에 실패했습니다!' : '도망에 실패했습니다! 더 이상 도망칠 수 없습니다.');
    setTimeout(enemyTurn, 400);
  }
}

function onEnemyDefeated() {
  const c = run.combat;
  const goldGain = Math.round(c.enemy.gold * run.goldMult * (c.golden ? 3 : 1));
  run.gold += goldGain;
  run.kills += 1;
  if (!save.bestiary.includes(c.enemy.key)) { save.bestiary.push(c.enemy.key); saveGame(); }
  if (c.elite) { save.eliteKills = (save.eliteKills || 0) + 1; }
  if (c.golden) { save.goldenKills = (save.goldenKills || 0) + 1; }
  addQuestProgress('kills', 1);
  if (c.isBoss) addQuestProgress('boss', 1);
  trackKillAndChallenge(c.enemy.key);
  sfx.gold();
  spawnSparkles('💰', c.golden ? 12 : 6);
  flashScreen('gain', 400);
  let defeatMsg = `${c.enemy.name}을(를) 처치! 골드 +${goldGain} 💰`;
  if (c.elite) {
    const slot = pick(['weapon', 'armor', 'ring']);
    const gradeIdx = weightedGrade();
    const item = { ...EQUIPMENT_POOL[slot][gradeIdx], slot, id: 'elite-' + Date.now() + '-' + rand(0, 999) };
    save.inventory.push(item);
    run.itemsGained.push(item);
    const curScore = itemScore(save.equipped[slot]);
    if (!save.equipped[slot] || itemScore(item) > curScore) save.equipped[slot] = item;
    saveGame();
    defeatMsg += ` 💢 엘리트 보상: [${item.name}] 획득!`;
    spawnSparkles('✨', 6);
  }
  setLog(defeatMsg);
  document.getElementById('enemy-hp-fill').style.width = '0%';

  if (c.queue && c.queue.length) {
    const next = c.queue.shift();
    const nextCombat = makeCombat(next, false, c.fleeLeft);
    nextCombat.queue = c.queue;
    run.combat = nextCombat;
    updateHud();
    setActionsLocked(true);
    setTimeout(() => {
      if (!run || !run.combat) return;
      renderCombat(false);
      setLog(`이어서 ${next.name}이(가) 달려듭니다!`);
      restoreActionBar();
    }, 700);
    return;
  }

  run.combat = null;
  updateHud();
  updateComboUI();

  if (c.isBoss) {
    rollLegendaryDrop();
    setTimeout(() => finishRun(true), 700);
    return;
  }
  setTimeout(showNextRoomButton, 700);
}

function rollLegendaryDrop() {
  if (Math.random() >= 0.12) return;
  const owned = save.inventory.map((i) => i.name);
  const candidates = LEGENDARY_WEAPONS.filter((w) => !owned.includes(w.name));
  if (!candidates.length) return;
  const weapon = { ...pick(candidates), id: 'legend-' + Date.now() + '-' + rand(0, 999) };
  save.inventory.push(weapon);
  run.itemsGained.push(weapon);
  const curScore = itemScore(save.equipped.weapon);
  if (!save.equipped.weapon || itemScore(weapon) > curScore) save.equipped.weapon = weapon;
  saveGame();
  setLog(`🌟 전설의 무기 [${weapon.name}]을(를) 획득했습니다!`);
  spawnSparkles('🌟', 10);
  flashScreen('gain', 500);
}

function onPlayerDefeated() {
  stopBgm();
  sfx.over();
  finishRun(false);
}

/* ---------------- 10. 비전투 방 ---------------- */

function resolveTreasure() {
  addQuestProgress('treasure', 1);
  const rewards = [
    { label: '골드 +24', apply: (r) => { r.gold += Math.round(24 * r.goldMult); } },
    { label: '최대 HP +10', apply: (r) => { r.maxHp += 10; r.hp += 10; } },
    { label: '공격력 +5', apply: (r) => { r.atk += 5; } },
    { label: '방어력 +3', apply: (r) => { r.def += 3; } },
    { label: 'HP 완전 회복', apply: (r) => { r.hp = r.maxHp; } },
  ];
  setTimeout(() => {
    if (!run) return;
    let resultMsg;
    if (Math.random() < 0.12) {
      const lucky = Math.random() < 0.5;
      if (lucky) {
        const g = Math.round(48 * run.goldMult);
        run.gold += g;
        resultMsg = `🎲 수상한 상자를 열었습니다! 대박! 골드 +${g}`;
        spawnSparkles('💰', 10);
      } else {
        const dmg = Math.max(5, Math.round(run.maxHp * 0.15));
        run.hp = Math.max(1, run.hp - dmg);
        showDamageFloat('-' + dmg, '');
        resultMsg = `🎲 수상한 상자를 열었습니다! 함정이었다! HP -${dmg}`;
      }
    } else if (Math.random() < 0.3) {
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
  return (item.atk || 0) + (item.def || 0) + (item.hp || 0) / 2 + (item.crit || 0) + (item.gold || 0) + (item.special ? 12 : 0);
}
function applyEquipToRun() {
  // 장비 변경 시 현재 런 스탯에 즉시 반영(간단화를 위해 재계산하지 않고 유지)
}

function resolveHeal() {
  setTimeout(() => {
    if (!run) return;
    const bonusGold = Math.round(5 * run.goldMult);
    run.gold += bonusGold;
    flashScreen('heal', 400);
    spawnSparkles('✨', 6);
    if (run.cursedNoHeal) {
      setLog(`저주 때문에 회복하지 못했습니다. 대신 골드 +${bonusGold}`);
    } else {
      const before = run.hp;
      run.hp = run.maxHp;
      setLog(`HP를 모두 회복했습니다! (+${run.hp - before}) 골드 +${bonusGold}`);
    }
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

function resolveRelic() {
  const choiceCount = save.relicsSeen.length >= RELICS.length ? 4 : 3;
  const pool = [...RELICS].sort(() => Math.random() - 0.5).slice(0, choiceCount);
  const panel = document.getElementById('event-panel');
  panel.classList.remove('hidden');
  panel.innerHTML = '<p>이번 던전에만 적용되는 유물을 하나 선택하세요.</p>';
  pool.forEach((relic) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.innerHTML = `<b>${relic.name}</b><br><span style="font-size:11px;color:var(--text-dim)">${relic.desc}</span>`;
    btn.addEventListener('click', () => {
      sfx.gold();
      relic.apply(run);
      run.relics.push(relic.name);
      addQuestProgress('relics', 1);
      if (!save.relicsSeen.includes(relic.name)) { save.relicsSeen.push(relic.name); saveGame(); }
      let msg = `유물 [${relic.name}] 획득!`;
      const synergy = RELIC_SYNERGIES.find((s) =>
        !run.synergiesApplied.includes(s.name) && s.pair.every((n) => run.relics.includes(n)));
      if (synergy) {
        synergy.apply(run);
        run.synergiesApplied.push(synergy.name);
        msg += ` ✨ 시너지 발동! [${synergy.name}] - ${synergy.desc}`;
        flashScreen('gain', 500);
        spawnSparkles('✨', 8);
      }
      setLog(msg);
      panel.classList.add('hidden');
      panel.innerHTML = '';
      updateHud();
      showNextRoomButton();
    });
    panel.appendChild(btn);
  });
  document.getElementById('action-bar').classList.add('hidden');
}

function resolveCards() {
  const panel = document.getElementById('event-panel');
  panel.classList.remove('hidden');
  const oddsHtml = CARD_POOL.map((c) => `<div class="card-odds-row"><span>${c.label}</span><span>${c.chance}%</span></div>`).join('');
  panel.innerHTML = `
    <p>카드를 뽑으면 아래 확률대로 효과가 적용됩니다.</p>
    <div class="card-odds-list">${oddsHtml}</div>
    <button id="btn-draw-card" class="btn btn-secondary">🎴 카드 뽑기</button>`;
  document.getElementById('btn-draw-card').addEventListener('click', () => {
    sfx.gold();
    let r = Math.random() * 100;
    let drawn = CARD_POOL[CARD_POOL.length - 1];
    for (const c of CARD_POOL) { if (r < c.chance) { drawn = c; break; } r -= c.chance; }
    drawn.apply(run);
    setLog(`🎴 [${drawn.label}] 카드를 뽑았습니다! (확률 ${drawn.chance}%)`);
    flashScreen(drawn.chance <= 10 ? (drawn.label.includes('함정') ? 'heal' : 'gain') : 'gain', 400);
    spawnSparkles(drawn.label.includes('함정') ? '💥' : '✨', 6);
    panel.classList.add('hidden');
    panel.innerHTML = '';
    updateHud();
    showNextRoomButton();
  });
  document.getElementById('action-bar').classList.add('hidden');
}

function showNextRoomButton() {
  const bar = document.getElementById('action-bar');
  bar.classList.remove('hidden');
  const isLast = run.room >= run.roomTypes.length;
  bar.innerHTML = `<button id="btn-next-room" class="btn btn-action btn-attack" style="flex:1">${isLast ? '결과 보기' : '다음 방으로 →'}</button>`;
  document.getElementById('btn-next-room').addEventListener('click', () => {
    sfx.button();
    if (isLast) return;
    addQuestProgress('rooms', 1);
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
  stopAutoBattleLoop();
  save.shopOffers = null; // 던전을 한 판 다녀오면 상점이 새로 재입고된다
  const goldEarned = run.gold;
  save.totalGold += goldEarned;
  if (goldEarned > 0) addQuestProgress('goldEarned', goldEarned);
  if (!run.bossRush) save.bestFloor = Math.max(save.bestFloor, run.room);
  if (victory) {
    save.clearCount += 1;
    if (save.settings.hardcore) save.hardcoreClears = (save.hardcoreClears || 0) + 1;
    if (run.bossRush) save.bossRushClears = (save.bossRushClears || 0) + 1;
  }
  saveGame();

  if (victory) { addQuestProgress('clears', 1); addQuestProgress('rooms', 1); }

  const itemNames = run.itemsGained.length ? run.itemsGained.map(i => `${i.name}(${i.grade})`).join(', ') : '없음';
  const newlyUnlocked = checkAchievements({ victory, usedPotion: run.usedPotion, wasLowHp: run.wasLowHp });

  if (victory) {
    stopBgm();
    let bonus = Math.round(30 * run.goldMult);
    if (run.bossRush) bonus += 80; // 👑 보스 러시 클리어 보너스
    save.totalGold += bonus;
    const clearSeconds = Math.round((Date.now() - run.startTime) / 1000);
    const isNewRecord = !run.bossRush && (save.bestClearTime === null || clearSeconds < save.bestClearTime);
    if (isNewRecord) save.bestClearTime = clearSeconds;
    saveGame();
    sfx.clear();
    document.getElementById('clear-time').textContent = clearSeconds + '초' + (isNewRecord ? ' 🏆 신기록!' : run.bossRush ? '' : ` (최고 기록: ${save.bestClearTime}초)`);
    document.getElementById('clear-gold').textContent = goldEarned + bonus;
    document.getElementById('clear-items').textContent = itemNames;
    document.getElementById('clear-kills').textContent = run.kills;
    document.getElementById('clear-achievements').textContent = newlyUnlocked.length ? newlyUnlocked.join(', ') : '없음';
    showScreen('screen-clear');
    spawnConfetti();
  } else {
    const hardcore = save.settings.hardcore;
    if (hardcore) {
      const kept = { settings: save.settings };
      save = { ...defaultSave(), ...kept };
      saveGame();
    }
    document.getElementById('over-room').textContent = run.room;
    document.getElementById('over-room-total').textContent = run.roomTypes.length;
    document.getElementById('over-kills').textContent = run.kills;
    document.getElementById('over-gold').textContent = hardcore ? 0 : goldEarned;
    document.getElementById('over-items').textContent = itemNames;
    document.getElementById('over-hardcore').textContent = hardcore ? '💀 하드코어 모드: 모든 기록이 초기화되었습니다.' : '';
    document.getElementById('over-hardcore').classList.toggle('hidden', !hardcore);
    showScreen('screen-gameover');
    spawnCrack();
  }
  run = null;
}

function checkAchievements(result) {
  const unlocked = [];
  ACHIEVEMENTS.forEach((a) => {
    if (save.achievements.includes(a.id)) return;
    if (a.check(save, result)) {
      save.achievements.push(a.id);
      save.totalGold += a.bonus;
      unlocked.push(`${a.name} (+${a.bonus}💰)`);
    }
  });
  if (unlocked.length) saveGame();
  return unlocked;
}

/* --- 헌터 챌린지: 몬스터를 10마리 처치할 때마다 도감에서 골드 보상 --- */
const HUNTER_TARGET = 10;
const HUNTER_REWARD = 30;
function trackKillAndChallenge(key) {
  save.killCounts[key] = (save.killCounts[key] || 0) + 1;
  if (save.killCounts[key] === HUNTER_TARGET && !save.huntsClaimed.includes(key)) {
    save.huntsClaimed.push(key);
    save.totalGold += HUNTER_REWARD;
    const mon = [...ENEMIES, ...MINIBOSSES, ...BOSSES].find((m) => m.key === key);
    setLog(`🏹 헌터 챌린지 달성! ${mon ? mon.name : ''} ${HUNTER_TARGET}마리 처치 (+${HUNTER_REWARD}💰)`);
    flashScreen('gain', 400);
  }
  saveGame();
}

/* ---------------- 11-1. 일일 퀘스트 ---------------- */

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function weekKey() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function ensureDailyQuests() {
  const today = todayKey();
  if (save.dailyQuests && save.dailyQuests.date === today) return;
  const picked = [...QUEST_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
  save.dailyQuests = {
    date: today,
    quests: picked.map((q) => ({ id: q.id, progress: 0, claimed: false })),
  };
  saveGame();
}

function ensureWeeklyQuest() {
  const wk = weekKey();
  if (save.weeklyQuest && save.weeklyQuest.week === wk) return;
  const def = pick(WEEKLY_QUEST_POOL);
  save.weeklyQuest = { week: wk, id: def.id, progress: 0, claimed: false };
  saveGame();
}

function addQuestProgress(type, amount) {
  ensureDailyQuests();
  ensureWeeklyQuest();
  let changed = false;
  save.dailyQuests.quests.forEach((q) => {
    const def = QUEST_POOL.find((p) => p.id === q.id);
    if (def && def.type === type && !q.claimed && q.progress < def.target) {
      q.progress = Math.min(def.target, q.progress + amount);
      changed = true;
    }
  });
  const wq = save.weeklyQuest;
  const wdef = WEEKLY_QUEST_POOL.find((p) => p.id === wq.id);
  if (wdef && wdef.type === type && !wq.claimed && wq.progress < wdef.target) {
    wq.progress = Math.min(wdef.target, wq.progress + amount);
    changed = true;
  }
  if (changed) saveGame();
}

function claimWeeklyQuestReward() {
  ensureWeeklyQuest();
  const wq = save.weeklyQuest;
  const def = WEEKLY_QUEST_POOL.find((p) => p.id === wq.id);
  if (!def || wq.claimed || wq.progress < def.target) return;
  wq.claimed = true;
  save.totalGold += def.reward;
  save.weeklyQuestsClaimedTotal = (save.weeklyQuestsClaimedTotal || 0) + 1;
  sfx.gold();
  saveGame();
  renderQuests();
}

function claimQuestReward(id) {
  ensureDailyQuests();
  const q = save.dailyQuests.quests.find((x) => x.id === id);
  const def = QUEST_POOL.find((p) => p.id === id);
  if (!q || !def || q.claimed || q.progress < def.target) return;
  q.claimed = true;
  save.totalGold += def.reward;
  save.dailyQuestsClaimedTotal = (save.dailyQuestsClaimedTotal || 0) + 1;
  sfx.gold();
  saveGame();
  renderQuests();
}

function renderQuests() {
  ensureDailyQuests();
  ensureWeeklyQuest();
  const weeklyList = document.getElementById('weekly-quest-list');
  weeklyList.innerHTML = '';
  const wq = save.weeklyQuest;
  const wdef = WEEKLY_QUEST_POOL.find((p) => p.id === wq.id);
  if (wdef) {
    const wdone = wq.progress >= wdef.target;
    const wrow = document.createElement('div');
    wrow.className = 'upgrade-item' + (wq.claimed ? ' equipped' : '');
    wrow.innerHTML = `
      <div class="upgrade-info">
        <div class="upgrade-name">${wdef.desc}</div>
        <div class="upgrade-level">진행도 ${Math.min(wq.progress, wdef.target)} / ${wdef.target} · 보상 ${wdef.reward}💰</div>
      </div>
      <button class="btn upgrade-buy" ${wq.claimed || !wdone ? 'disabled' : ''}>${wq.claimed ? '완료' : wdone ? '보상 받기' : '진행중'}</button>`;
    if (wdone && !wq.claimed) wrow.querySelector('button').addEventListener('click', claimWeeklyQuestReward);
    weeklyList.appendChild(wrow);
  }

  const list = document.getElementById('quests-list');
  list.innerHTML = '';
  save.dailyQuests.quests.forEach((q) => {
    const def = QUEST_POOL.find((p) => p.id === q.id);
    if (!def) return;
    const done = q.progress >= def.target;
    const row = document.createElement('div');
    row.className = 'upgrade-item' + (q.claimed ? ' equipped' : '');
    row.innerHTML = `
      <div class="upgrade-info">
        <div class="upgrade-name">${def.desc}</div>
        <div class="upgrade-level">진행도 ${Math.min(q.progress, def.target)} / ${def.target} · 보상 ${def.reward}💰</div>
      </div>
      <button class="btn upgrade-buy" ${q.claimed || !done ? 'disabled' : ''}>${q.claimed ? '완료' : done ? '보상 받기' : '진행중'}</button>`;
    if (done && !q.claimed) row.querySelector('button').addEventListener('click', () => claimQuestReward(q.id));
    list.appendChild(row);
  });
  const resetNote = document.getElementById('quests-reset-note');
  if (resetNote) resetNote.textContent = '매일 자정에 새로운 퀘스트 3개로 초기화됩니다.';
}

/* ---------------- 12. 업그레이드 화면 ---------------- */

function renderUpgradeScreen() {
  document.getElementById('upgrade-gold').textContent = save.totalGold;
  const list = document.getElementById('upgrade-list');
  list.innerHTML = '';
  UPGRADE_DEFS.forEach((def) => {
    const level = save.upgrades[def.key];
    const maxed = def.maxLevel && level >= def.maxLevel;
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
      <button class="btn upgrade-buy" ${maxed || save.totalGold < cost ? 'disabled' : ''}>${maxed ? 'MAX' : cost + ' 💰'}</button>`;
    row.querySelector('button').addEventListener('click', () => buyUpgrade(def.key));
    list.appendChild(row);
  });
}

function buyUpgrade(key) {
  const def = UPGRADE_DEFS.find(u => u.key === key);
  const level = save.upgrades[key];
  if (def.maxLevel && level >= def.maxLevel) return;
  const cost = upgradeCost(key, level);
  if (save.totalGold < cost) return;
  sfx.gold();
  save.totalGold -= cost;
  save.upgrades[key] += 1;
  saveGame();
  renderUpgradeScreen();
}

/* ---------------- 12-1. 인벤토리 / 장비 화면 ---------------- */

function itemStatsText(item) {
  const parts = [];
  if (item.atk) parts.push(`공격력 +${item.atk}`);
  if (item.def) parts.push(`방어력 +${item.def}`);
  if (item.hp) parts.push(`HP +${item.hp}`);
  if (item.crit) parts.push(`치명타 +${item.crit}%`);
  if (item.gold) parts.push(`골드 +${item.gold}%`);
  if (item.specialText) parts.push(`✨ ${item.specialText}`);
  return parts.join(' · ') || '보너스 없음';
}

const SLOT_LABEL = { weapon: '⚔️ 무기', armor: '🛡️ 갑옷', ring: '💍 반지' };

function renderInventory() {
  const list = document.getElementById('inventory-list');
  list.innerHTML = '';
  ['weapon', 'armor', 'ring'].forEach((slot) => {
    const header = document.createElement('p');
    header.className = 'inventory-slot-header';
    header.textContent = SLOT_LABEL[slot];
    list.appendChild(header);

    const items = save.inventory.filter((i) => i.slot === slot);
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'inventory-empty';
      empty.textContent = '보유한 장비가 없습니다. 상점이나 보물방에서 찾아보세요.';
      list.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const equipped = save.equipped[slot] && save.equipped[slot].id === item.id;
      const row = document.createElement('div');
      row.className = 'upgrade-item' + (equipped ? ' equipped' : '');
      row.style.borderColor = GRADE_COLORS[item.grade];
      row.innerHTML = `
        <div class="upgrade-info">
          <div class="upgrade-name">${item.name} <span class="grade-tag${item.grade === '레전더리' ? ' legendary' : ''}" style="color:${GRADE_COLORS[item.grade]}">${item.grade}</span></div>
          <div class="upgrade-level">${itemStatsText(item)}</div>
        </div>
        <button class="btn upgrade-buy">${equipped ? '해제' : '장착'}</button>`;
      row.querySelector('button').addEventListener('click', () => {
        sfx.button();
        save.equipped[slot] = equipped ? null : item;
        saveGame();
        renderInventory();
      });
      list.appendChild(row);
    });
  });
}

/* ---------------- 12-2. 상점 화면 ---------------- */

function generateShopOffers() {
  const slots = ['weapon', 'armor', 'ring'];
  return Array.from({ length: 3 }, () => {
    const slot = pick(slots);
    const gradeIdx = weightedGrade();
    const item = { ...EQUIPMENT_POOL[slot][gradeIdx], slot, id: 'shop-' + Date.now() + '-' + rand(0, 9999) };
    const price = (gradeIdx + 1) * 45 + rand(0, 25);
    return { item, price };
  });
}

function ensureShopOffers() {
  if (!save.shopOffers) {
    save.shopOffers = generateShopOffers();
    saveGame();
  }
}

function renderShop() {
  ensureShopOffers();
  document.getElementById('shop-gold').textContent = save.totalGold;
  const list = document.getElementById('shop-list');
  list.innerHTML = '';
  const offers = save.shopOffers;
  if (offers.every((o) => !o)) {
    const p = document.createElement('p');
    p.className = 'inventory-empty';
    p.textContent = '오늘의 물건을 모두 구매했습니다. 던전을 다녀오면 새 물건이 들어옵니다!';
    list.appendChild(p);
  } else {
    offers.forEach((offer, idx) => {
      if (!offer) return;
      const row = document.createElement('div');
      row.className = 'upgrade-item';
      row.style.borderColor = GRADE_COLORS[offer.item.grade];
      row.innerHTML = `
        <div class="upgrade-info">
          <div class="upgrade-name">${offer.item.name} <span class="grade-tag" style="color:${GRADE_COLORS[offer.item.grade]}">${offer.item.grade}</span></div>
          <div class="upgrade-level">${itemStatsText(offer.item)}</div>
        </div>
        <button class="btn upgrade-buy" ${save.totalGold < offer.price ? 'disabled' : ''}>${offer.price} 💰</button>`;
      row.querySelector('button').addEventListener('click', () => {
        if (save.totalGold < offer.price) return;
        sfx.gold();
        save.totalGold -= offer.price;
        save.inventory.push(offer.item);
        save.shopOffers[idx] = null;
        saveGame();
        renderShop();
      });
      list.appendChild(row);
    });
  }
  renderRoulette();
  renderPetShop();
}

const ROULETTE_COST = 80;
function renderRoulette() {
  const btn = document.getElementById('btn-roulette-roll');
  btn.disabled = save.totalGold < ROULETTE_COST;
}

function rollRoulette() {
  if (save.totalGold < ROULETTE_COST) return;
  sfx.button();
  save.totalGold -= ROULETTE_COST;
  const resultBox = document.getElementById('roulette-result');
  resultBox.className = 'roulette-result spinning';
  resultBox.textContent = '🎰';
  document.getElementById('shop-gold').textContent = save.totalGold;
  renderRoulette();
  setTimeout(() => {
    const slot = pick(['weapon', 'armor', 'ring']);
    const gradeIdx = weightedGrade();
    const item = { ...EQUIPMENT_POOL[slot][gradeIdx], slot, id: 'roulette-' + Date.now() + '-' + rand(0, 999) };
    save.inventory.push(item);
    const curScore = itemScore(save.equipped[slot]);
    const equipped = !save.equipped[slot] || itemScore(item) > curScore;
    if (equipped) save.equipped[slot] = item;
    saveGame();
    sfx.gold();
    spawnSparkles('✨', item.grade === '전설' ? 12 : 6);
    resultBox.className = 'roulette-result';
    resultBox.style.borderColor = GRADE_COLORS[item.grade];
    resultBox.innerHTML = `
      <div class="upgrade-name">${SLOT_LABEL[slot]} · ${item.name} <span class="grade-tag" style="color:${GRADE_COLORS[item.grade]}">${item.grade}</span></div>
      <div class="upgrade-level">${itemStatsText(item)}${equipped ? ' · 자동 장착됨' : ''}</div>`;
    renderRoulette();
  }, 700);
}

function renderPetShop() {
  const list = document.getElementById('shop-pet-list');
  list.innerHTML = '';
  PET_POOL.forEach((pet) => {
    const owned = save.pet && save.pet.key === pet.key;
    const row = document.createElement('div');
    row.className = 'upgrade-item' + (owned ? ' equipped' : '');

    if (owned) {
      const level = save.pet.level || 1;
      const maxed = level >= PET_MAX_LEVEL;
      const cost = petUpgradeCost(level);
      row.innerHTML = `
        <div class="upgrade-info">
          <div class="upgrade-name">${pet.name} <span class="grade-tag" style="color:var(--gold-bright)">Lv.${level}</span></div>
          <div class="upgrade-level">전투마다 자동으로 ${petEffectiveAtk(save.pet)} 피해 추가</div>
        </div>
        <button class="btn upgrade-buy" ${maxed || save.totalGold < cost ? 'disabled' : ''}>${maxed ? 'MAX' : `강화 ${cost} 💰`}</button>`;
      row.querySelector('button').addEventListener('click', () => {
        if (maxed || save.totalGold < cost) return;
        sfx.gold();
        save.totalGold -= cost;
        save.pet.level = level + 1;
        saveGame();
        renderPetShop();
        document.getElementById('shop-gold').textContent = save.totalGold;
      });
    } else {
      row.innerHTML = `
        <div class="upgrade-info">
          <div class="upgrade-name">${pet.name}</div>
          <div class="upgrade-level">전투마다 자동으로 ${pet.atk} 피해 추가</div>
        </div>
        <button class="btn upgrade-buy" ${save.totalGold < pet.price ? 'disabled' : ''}>${pet.price} 💰</button>`;
      row.querySelector('button').addEventListener('click', () => {
        if (save.totalGold < pet.price) return;
        sfx.gold();
        save.totalGold -= pet.price;
        save.pet = { key: pet.key, name: pet.name, level: 1 };
        saveGame();
        renderPetShop();
        document.getElementById('shop-gold').textContent = save.totalGold;
      });
    }
    list.appendChild(row);
  });
}

/* ---------------- 12-3. 몬스터 도감 화면 ---------------- */

function renderBestiary() {
  const grid = document.getElementById('bestiary-grid');
  grid.innerHTML = '';
  [...ENEMIES, ...MINIBOSSES, ...BOSSES].forEach((m) => {
    const discovered = save.bestiary.includes(m.key);
    const kills = save.killCounts[m.key] || 0;
    const claimed = save.huntsClaimed.includes(m.key);
    const huntText = claimed ? `🏹 헌터 챌린지 완료 (${kills}마리)` : `🏹 처치: ${Math.min(kills, HUNTER_TARGET)} / ${HUNTER_TARGET}`;
    const cell = document.createElement('div');
    cell.className = 'bestiary-cell' + (discovered ? '' : ' locked');
    cell.innerHTML = discovered
      ? `<div class="bestiary-art">${CHAR_ART[m.key] || m.emoji}</div>
         <div class="bestiary-name">${m.name}</div>
         <div class="bestiary-stats">HP ${m.hp} · ATK ${m.atk} · DEF ${m.def}</div>
         <div class="bestiary-ability">${abilityText(m)}</div>
         <div class="bestiary-hunt">${huntText}</div>`
      : `<div class="bestiary-art locked-art">❔</div><div class="bestiary-name">???</div>`;
    grid.appendChild(cell);
  });
  renderRelicCompendium();
}

function renderRelicCompendium() {
  const grid = document.getElementById('relic-grid');
  grid.innerHTML = '';
  RELICS.forEach((relic) => {
    const discovered = save.relicsSeen.includes(relic.name);
    const cell = document.createElement('div');
    cell.className = 'bestiary-cell' + (discovered ? '' : ' locked');
    cell.innerHTML = discovered
      ? `<div class="bestiary-name">${relic.name}</div><div class="bestiary-ability">${relic.desc}</div>`
      : `<div class="bestiary-art locked-art">❔</div><div class="bestiary-name">???</div>`;
    grid.appendChild(cell);
  });
  const title = document.getElementById('relic-compendium-title');
  const complete = save.relicsSeen.length >= RELICS.length;
  title.textContent = `📜 유물 도감 (${save.relicsSeen.length}/${RELICS.length})${complete ? ' — 완성! 유물 선택지 +1' : ''}`;
}

/* ---------------- 12-4. 업적 화면 ---------------- */

let achievementsFilter = 'all'; // 'all' | 'done' | 'todo'

function renderAchievements() {
  const done = ACHIEVEMENTS.filter((a) => save.achievements.includes(a.id)).length;
  document.getElementById('achievements-progress').textContent = `${done} / ${ACHIEVEMENTS.length} 달성`;
  const list = document.getElementById('achievements-list');
  list.innerHTML = '';
  const shown = ACHIEVEMENTS.filter((a) => {
    const unlocked = save.achievements.includes(a.id);
    if (achievementsFilter === 'done') return unlocked;
    if (achievementsFilter === 'todo') return !unlocked;
    return true;
  });
  shown.forEach((a) => {
    const unlocked = save.achievements.includes(a.id);
    const row = document.createElement('div');
    row.className = 'upgrade-item' + (unlocked ? ' equipped' : '');
    row.innerHTML = `
      <div class="upgrade-info">
        <div class="upgrade-name">${unlocked ? '🏅' : '🔒'} ${a.name}</div>
        <div class="upgrade-level">${a.desc} · 보상 ${a.bonus}💰</div>
      </div>`;
    list.appendChild(row);
  });
  document.querySelectorAll('.achv-filter-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === achievementsFilter);
  });
}

/* ---------------- 12-5. 웰컴백 보상 ---------------- */

function checkWelcomeBackReward() {
  const now = Date.now();
  const last = save.lastSeen;
  save.lastSeen = now;
  if (last) {
    const hoursAway = (now - last) / 3600000;
    if (hoursAway >= 6) {
      const petBonus = save.pet ? petEffectiveAtk(save.pet) : 0;
      const reward = Math.min(120, Math.round(hoursAway * 4) + petBonus * 2);
      if (reward > 0) {
        save.totalGold += reward;
        const panel = document.getElementById('welcome-back-panel');
        document.getElementById('welcome-back-text').textContent =
          `그동안 자리를 비운 사이${save.pet ? ' ' + save.pet.name + '가' : ''} 골드 ${reward}를 모아왔어요!`;
        panel.classList.remove('hidden');
      }
    }
  }
  saveGame();
}

/* ---------------- 12-6. 방치형 골드 적립함 ---------------- */
const IDLE_GOLD_PER_MIN = 1;
const IDLE_GOLD_CAP = 240;

function tickIdleGold() {
  const now = Date.now();
  const vault = save.idleGold;
  const minutesPassed = (now - vault.lastTick) / 60000;
  if (minutesPassed > 0 && vault.accumulated < IDLE_GOLD_CAP) {
    vault.accumulated = Math.min(IDLE_GOLD_CAP, vault.accumulated + minutesPassed * IDLE_GOLD_PER_MIN);
  }
  vault.lastTick = now;
  saveGame();
  renderIdleVault();
}

function renderIdleVault() {
  const btn = document.getElementById('btn-idle-vault');
  const amount = Math.floor(save.idleGold.accumulated);
  document.getElementById('idle-vault-amount').textContent = amount;
  btn.classList.toggle('hidden', amount <= 0);
}

function claimIdleGold() {
  const amount = Math.floor(save.idleGold.accumulated);
  if (amount <= 0) return;
  sfx.gold();
  save.totalGold += amount;
  save.idleGold.accumulated = 0;
  save.idleGold.lastTick = Date.now();
  saveGame();
  renderTitleStats();
  renderIdleVault();
}



function renderTitleStats() {
  document.getElementById('hero-portrait').innerHTML = CHAR_ART.hero;
  spawnFireflies();
  document.getElementById('stat-best-floor').textContent = save.bestFloor;
  document.getElementById('stat-total-gold').textContent = save.totalGold;
  document.getElementById('stat-play-count').textContent = save.playCount;
  document.getElementById('btn-sound-toggle').textContent = save.settings.sound ? '🔊' : '🔇';
  const hcBtn = document.getElementById('btn-hardcore-toggle');
  hcBtn.textContent = `☠️ 하드코어 모드: ${save.settings.hardcore ? 'ON' : 'OFF'}`;
  hcBtn.classList.toggle('active', save.settings.hardcore);
  document.querySelectorAll('.class-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.class === save.lastClass);
  });
  document.getElementById('btn-boss-rush').classList.toggle('hidden', save.clearCount <= 0);
}

/* --- 클리커: 타이틀 화면에서 탭해서 소량의 골드를 채굴 --- */
let clickerLocked = false;
let clickerPenalizedUntil = 0;
let clickerHistory = []; // 최근 클릭 시각(ms) 기록 - 속도/패턴 감지용

function isLikelyAutoClicker(now) {
  // 최근 1분간 25회 초과 클릭 시 과도한 속도로 판단
  clickerHistory = clickerHistory.filter((t) => now - t < 60000);
  if (clickerHistory.length >= 25) return 'rate';

  // 최근 6회 클릭 간격의 표준편차가 비정상적으로 작으면(기계처럼 일정) 오토클리커로 판단
  if (clickerHistory.length >= 6) {
    const recent = clickerHistory.slice(-6);
    const intervals = [];
    for (let i = 1; i < recent.length; i++) intervals.push(recent[i] - recent[i - 1]);
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + (b - avg) ** 2, 0) / intervals.length;
    const stdev = Math.sqrt(variance);
    if (avg < 500 && stdev < 12) return 'pattern';
  }
  return null;
}

function handleClickerTap() {
  const now = Date.now();
  if (clickerLocked) return;
  if (now < clickerPenalizedUntil) return;

  const reason = isLikelyAutoClicker(now);
  if (reason) {
    clickerPenalizedUntil = now + 5000;
    const coin = document.getElementById('btn-clicker');
    coin.classList.remove('shake'); void coin.offsetWidth; coin.classList.add('shake');
    const hint = document.getElementById('clicker-hint');
    hint.classList.add('warn');
    hint.textContent = reason === 'pattern' ? '🤖 너무 일정한 속도예요! 5초 후 다시 시도해주세요.' : '⏳ 채굴 속도가 너무 빨라요! 5초 후 다시 시도해주세요.';
    setTimeout(() => {
      hint.classList.remove('warn');
      hint.textContent = '탭해서 골드 채굴하기';
    }, 5000);
    return;
  }

  clickerLocked = true;
  setTimeout(() => { clickerLocked = false; }, 320);
  clickerHistory.push(now);

  sfx.gold();
  const gain = rand(1, 3);
  save.totalGold += gain;
  saveGame();
  document.getElementById('stat-total-gold').textContent = save.totalGold;

  const coin = document.getElementById('btn-clicker');
  coin.classList.remove('bounce'); void coin.offsetWidth; coin.classList.add('bounce');

  const popup = document.createElement('span');
  popup.className = 'clicker-popup';
  popup.textContent = '+' + gain;
  popup.style.left = (40 + rand(-15, 15)) + '%';
  popup.style.top = rand(0, 10) + 'px';
  coin.parentElement.appendChild(popup);
  setTimeout(() => popup.remove(), 700);
}

/* ---------------- 14. 초기화 & 이벤트 바인딩 ---------------- */

function init() {
  ensureDailyQuests();
  checkWelcomeBackReward();
  tickIdleGold();
  renderTitleStats();
  setInterval(tickIdleGold, 10000);

  document.getElementById('btn-idle-vault').addEventListener('click', claimIdleGold);

  document.getElementById('btn-welcome-back-close').addEventListener('click', () => {
    sfx.gold();
    document.getElementById('welcome-back-panel').classList.add('hidden');
    renderTitleStats();
  });

  document.getElementById('btn-ultimate').addEventListener('click', playerUltimate);
  document.getElementById('btn-autobattle').addEventListener('click', toggleAutoBattle);
  document.getElementById('btn-log-history').addEventListener('click', () => {
    sfx.button();
    const panel = document.getElementById('log-history-panel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) renderLogHistory();
  });
  document.getElementById('btn-log-history-close').addEventListener('click', () => {
    document.getElementById('log-history-panel').classList.add('hidden');
  });
  document.querySelectorAll('.class-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      sfx.button();
      save.lastClass = btn.dataset.class;
      saveGame();
      renderTitleStats();
    });
  });
  document.getElementById('btn-boss-rush').addEventListener('click', () => { sfx.button(); startRun(false, true); });
  document.getElementById('btn-enter-dungeon').addEventListener('click', () => { sfx.button(); startRun(false); });
  document.getElementById('btn-open-upgrade').addEventListener('click', () => { sfx.button(); stopBgm(); renderUpgradeScreen(); showScreen('screen-upgrade'); });
  document.getElementById('btn-upgrade-back').addEventListener('click', () => { sfx.button(); renderTitleStats(); showScreen('screen-title'); playBgm('title'); });
  document.getElementById('btn-over-upgrade').addEventListener('click', () => { sfx.button(); stopBgm(); renderUpgradeScreen(); showScreen('screen-upgrade'); });
  document.getElementById('btn-clear-upgrade').addEventListener('click', () => { sfx.button(); stopBgm(); renderUpgradeScreen(); showScreen('screen-upgrade'); });
  document.getElementById('btn-retry').addEventListener('click', () => { sfx.button(); startRun(false); });
  document.getElementById('btn-next-dungeon').addEventListener('click', () => { sfx.button(); startRun(false); });

  document.getElementById('btn-open-inventory').addEventListener('click', () => { sfx.button(); stopBgm(); renderInventory(); showScreen('screen-inventory'); });
  document.getElementById('btn-inventory-back').addEventListener('click', () => { sfx.button(); renderTitleStats(); showScreen('screen-title'); playBgm('title'); });

  document.getElementById('btn-open-shop').addEventListener('click', () => { sfx.button(); stopBgm(); renderShop(); showScreen('screen-shop'); });
  document.getElementById('btn-roulette-roll').addEventListener('click', rollRoulette);
  document.getElementById('btn-shop-back').addEventListener('click', () => { sfx.button(); renderTitleStats(); showScreen('screen-title'); playBgm('title'); });

  document.getElementById('btn-open-bestiary').addEventListener('click', () => { sfx.button(); stopBgm(); renderBestiary(); showScreen('screen-bestiary'); });
  document.getElementById('btn-bestiary-back').addEventListener('click', () => { sfx.button(); renderTitleStats(); showScreen('screen-title'); playBgm('title'); });

  document.getElementById('btn-open-achievements').addEventListener('click', () => { sfx.button(); stopBgm(); renderAchievements(); showScreen('screen-achievements'); });
  document.querySelectorAll('.achv-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => { sfx.button(); achievementsFilter = btn.dataset.filter; renderAchievements(); });
  });
  document.getElementById('btn-achievements-back').addEventListener('click', () => { sfx.button(); renderTitleStats(); showScreen('screen-title'); playBgm('title'); });

  document.getElementById('btn-open-quests').addEventListener('click', () => { sfx.button(); stopBgm(); renderQuests(); showScreen('screen-quests'); });
  document.getElementById('btn-quests-back').addEventListener('click', () => { sfx.button(); renderTitleStats(); showScreen('screen-title'); playBgm('title'); });

  document.getElementById('btn-hardcore-toggle').addEventListener('click', () => {
    sfx.button();
    save.settings.hardcore = !save.settings.hardcore;
    saveGame();
    renderTitleStats();
  });

  document.getElementById('btn-clicker').addEventListener('click', handleClickerTap);

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

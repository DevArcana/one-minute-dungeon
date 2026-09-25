export const CLASSES = {
 warrior: {name:'전사', title:'서약의 수호자', role:'방어 · 반격', desc:'방어하면 다음 공격이 강화됩니다. 강공격을 막고 반격하세요.', hp:110, atk:13, def:3, crit:.08, maxEnergy:4, skill:'방패 강타', skillDesc:'공격력 180% 피해 + 이번 턴 피해 40% 감소', cost:2,skillMultiplier:1.8,skillReduction:.4},
 rogue: {name:'도적', title:'그림자의 방랑자', role:'독 · 치명타', desc:'독을 쌓고 치명타를 노리세요. 방어는 피해를 줄이고 다음 타격을 강화합니다.', hp:98, atk:14, def:2, crit:.25, maxEnergy:4, skill:'맹독 쌍검', skillDesc:'공격력 170% 피해 + 독 3턴', cost:2,skillMultiplier:1.7},
 mage: {name:'마법사', title:'별빛의 기록자', role:'마나 · 화상', desc:'화염을 남기고 다시 점화하세요. 방어하면 마나를 2 회복합니다.', hp:90, atk:12, def:2, crit:.1, maxEnergy:6, skill:'별불꽃', skillDesc:'공격력 210% 피해 + 화상 3턴. 이미 화상인 적에게 추가 피해', cost:3,skillMultiplier:2.1},
};
export const ENEMIES = {
 goblin:{name:'잿빛 고블린',art:'goblin',hp:46,atk:10,def:1,pattern:['attack','heavy','recover'],desc:'일격을 준비한 뒤 숨을 고릅니다.'},
 skeleton:{name:'잊힌 파수병',art:'skeleton',hp:56,atk:11,def:2,pattern:['guard','attack','heavy'],desc:'방패를 세우면 공격 피해가 줄어듭니다.'},
 chief:{name:'고블린 대장',art:'goblin',hp:85,atk:14,def:2,pattern:['attack','heavy','recover','poison'],desc:'독과 강공격을 번갈아 사용합니다.'},
 sentinel:{name:'왕릉의 수문장',art:'skeleton',hp:115,atk:15,def:3,pattern:['guard','heavy','attack','recover'],desc:'성문을 지키는 정예. 방어 후 강타를 예고합니다.'},
 dragon:{name:'잔불의 군주, 이그니스',art:'dragon',hp:230,atk:18,def:3,pattern:['attack','charge','inferno','recover'],desc:'숨을 모은 다음 화염을 뿜습니다. HP 50% 이하에서는 격노합니다.'},
};
export const ROOMS={
 battle:{name:'전투',symbol:'Ⅰ',desc:'적 처치 · 골드 +18',tone:'normal'},
 elite:{name:'정예',symbol:'Ⅱ',desc:'강한 적 · 장비 + 골드 32',tone:'danger'},
 treasure:{name:'보물',symbol:'◇',desc:'장비 1개 · 골드 +12',tone:'gold'},
 rest:{name:'쉼터',symbol:'✦',desc:'HP 40% 회복 또는 물약',tone:'safe'},
 event:{name:'제단',symbol:'?',desc:'체력을 대가로 힘을 얻는 선택',tone:'mystic'},
 shop:{name:'상점',symbol:'G',desc:'탐험 골드로 물약·장비 구입',tone:'gold'},
 relic:{name:'유물',symbol:'◈',desc:'이번 탐험을 바꾸는 유물 선택',tone:'mystic'},
 boss:{name:'보스',symbol:'Ⅸ',desc:'잔불의 군주 · 클리어 보상',tone:'danger'},
};
export const RELICS={
 ember:{name:'잔불의 심장',tag:'점화',desc:'스킬 피해 +4. 화상 피해 +2.',rarity:'희귀'},
 thorn:{name:'가시의 서약',tag:'반격',desc:'방어한 턴에 적에게 6 반격 피해.',rarity:'희귀'},
 venom:{name:'녹빛 송곳니',tag:'맹독',desc:'일반 공격도 독 2턴 부여. 독 피해 +2.',rarity:'희귀'},
 moon:{name:'월광의 잔',tag:'회복',desc:'전투 승리 시 HP 10 회복.',rarity:'희귀'},
 lens:{name:'별의 렌즈',tag:'집중',desc:'스킬 소모 자원 -1. 잔불의 심장과 함께면 스킬 피해 +6.',rarity:'영웅'},
 edge:{name:'유리 칼날',tag:'위험',desc:'모든 타격 +5. 받는 피해 +2.',rarity:'영웅'},
};
export const ITEMS={
 iron:{name:'문지기의 검',slot:'weapon',rarity:'일반',atk:2,desc:'공격력 +2'},
 fang:{name:'독니 단검',slot:'weapon',rarity:'희귀',atk:4,crit:5,desc:'공격력 +4 · 치명타 +5%'},
 star:{name:'별빛 지팡이',slot:'weapon',rarity:'희귀',atk:5,desc:'공격력 +5'},
 plate:{name:'서약의 갑옷',slot:'armor',rarity:'일반',def:1,hp:8,desc:'방어 +1 · 최대 HP +8'},
 dusk:{name:'황혼의 망토',slot:'armor',rarity:'희귀',def:2,hp:12,desc:'방어 +2 · 최대 HP +12'},
 seal:{name:'새벽의 인장',slot:'ring',rarity:'희귀',crit:8,gold:10,desc:'치명타 +8% · 획득 골드 +10%'},
 crown:{name:'잔불의 왕관',slot:'ring',rarity:'영웅',atk:3,hp:15,desc:'공격력 +3 · 최대 HP +15'},
};
export const UPGRADES={
 atk:{name:'칼날 연마',desc:'공격력 +1',base:60,max:15},
 hp:{name:'생명의 서약',desc:'최대 HP +6',base:50,max:15},
 def:{name:'견고한 갑주',desc:'방어력 +1',base:90,max:8},
 luck:{name:'별의 가호',desc:'치명타 +1%',base:70,max:15},
 gold:{name:'탐험가의 감각',desc:'획득 골드 +5%',base:80,max:10},
 firstCrit:{name:'선제 필살',desc:'매 전투 첫 타격은 치명타',base:350,max:1},
};
export const SLOT_NAMES={weapon:'무기',armor:'갑옷',ring:'반지'};
export const ACHIEVEMENTS=[
 {id:'re_first',name:'첫 발걸음',desc:'탐험 한 번 완료',test:s=>s.playCount>0},
 {id:'re_clear',name:'꺼지지 않는 불',desc:'보스 첫 처치',test:s=>s.clearCount>0},
 {id:'re_hunter',name:'깊은 곳의 사냥꾼',desc:'적 30마리 처치',test:s=>Object.values(s.killCounts).reduce((a,b)=>a+b,0)>=30},
 {id:'re_collector',name:'유물 수집가',desc:'새 유물 4종 발견',test:s=>Object.keys(RELICS).filter(k=>s.relicsSeen.includes(k)).length>=4},
];

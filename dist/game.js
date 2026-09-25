'use strict';
(()=>{
// data/content
const CLASSES = {
 warrior: {name:'전사', title:'서약의 수호자', role:'방어 · 반격', desc:'방어하면 다음 공격이 강화됩니다. 강공격을 막고 반격하세요.', hp:110, atk:13, def:3, crit:.08, maxEnergy:4, skill:'방패 강타', skillDesc:'공격력 180% 피해 + 이번 턴 피해 40% 감소', cost:2,skillMultiplier:1.8,skillReduction:.4},
 rogue: {name:'도적', title:'그림자의 방랑자', role:'독 · 치명타', desc:'독을 쌓고 치명타를 노리세요. 방어는 피해를 줄이고 다음 타격을 강화합니다.', hp:98, atk:14, def:2, crit:.25, maxEnergy:4, skill:'맹독 쌍검', skillDesc:'공격력 170% 피해 + 독 3턴', cost:2,skillMultiplier:1.7},
 mage: {name:'마법사', title:'별빛의 기록자', role:'마나 · 화상', desc:'화염을 남기고 다시 점화하세요. 방어하면 마나를 2 회복합니다.', hp:90, atk:12, def:2, crit:.1, maxEnergy:6, skill:'별불꽃', skillDesc:'공격력 210% 피해 + 화상 3턴. 이미 화상인 적에게 추가 피해', cost:3,skillMultiplier:2.1},
};
const ENEMIES = {
 goblin:{name:'잿빛 고블린',art:'goblin',hp:46,atk:10,def:1,pattern:['attack','heavy','recover'],desc:'일격을 준비한 뒤 숨을 고릅니다.'},
 skeleton:{name:'잊힌 파수병',art:'skeleton',hp:56,atk:11,def:2,pattern:['guard','attack','heavy'],desc:'방패를 세우면 공격 피해가 줄어듭니다.'},
 chief:{name:'고블린 대장',art:'goblin',hp:85,atk:14,def:2,pattern:['attack','heavy','recover','poison'],desc:'독과 강공격을 번갈아 사용합니다.'},
 sentinel:{name:'왕릉의 수문장',art:'skeleton',hp:115,atk:15,def:3,pattern:['guard','heavy','attack','recover'],desc:'성문을 지키는 정예. 방어 후 강타를 예고합니다.'},
 dragon:{name:'잔불의 군주, 이그니스',art:'dragon',hp:230,atk:18,def:3,pattern:['attack','charge','inferno','recover'],desc:'숨을 모은 다음 화염을 뿜습니다. HP 50% 이하에서는 격노합니다.'},
};
const ROOMS={
 battle:{name:'전투',symbol:'Ⅰ',desc:'적 처치 · 골드 +18',tone:'normal'},
 elite:{name:'정예',symbol:'Ⅱ',desc:'강한 적 · 장비 + 골드 32',tone:'danger'},
 treasure:{name:'보물',symbol:'◇',desc:'장비 1개 · 골드 +12',tone:'gold'},
 rest:{name:'쉼터',symbol:'✦',desc:'HP 40% 회복 또는 물약',tone:'safe'},
 event:{name:'제단',symbol:'?',desc:'체력을 대가로 힘을 얻는 선택',tone:'mystic'},
 shop:{name:'상점',symbol:'G',desc:'탐험 골드로 물약·장비 구입',tone:'gold'},
 relic:{name:'유물',symbol:'◈',desc:'이번 탐험을 바꾸는 유물 선택',tone:'mystic'},
 boss:{name:'보스',symbol:'Ⅸ',desc:'잔불의 군주 · 클리어 보상',tone:'danger'},
};
const RELICS={
 ember:{name:'잔불의 심장',tag:'점화',desc:'스킬 피해 +4. 화상 피해 +2.',rarity:'희귀'},
 thorn:{name:'가시의 서약',tag:'반격',desc:'방어한 턴에 적에게 6 반격 피해.',rarity:'희귀'},
 venom:{name:'녹빛 송곳니',tag:'맹독',desc:'일반 공격도 독 2턴 부여. 독 피해 +2.',rarity:'희귀'},
 moon:{name:'월광의 잔',tag:'회복',desc:'전투 승리 시 HP 10 회복.',rarity:'희귀'},
 lens:{name:'별의 렌즈',tag:'집중',desc:'스킬 소모 자원 -1. 잔불의 심장과 함께면 스킬 피해 +6.',rarity:'영웅'},
 edge:{name:'유리 칼날',tag:'위험',desc:'모든 타격 +5. 받는 피해 +2.',rarity:'영웅'},
};
const ITEMS={
 iron:{name:'문지기의 검',slot:'weapon',rarity:'일반',atk:2,desc:'공격력 +2'},
 fang:{name:'독니 단검',slot:'weapon',rarity:'희귀',atk:4,crit:5,desc:'공격력 +4 · 치명타 +5%'},
 star:{name:'별빛 지팡이',slot:'weapon',rarity:'희귀',atk:5,desc:'공격력 +5'},
 plate:{name:'서약의 갑옷',slot:'armor',rarity:'일반',def:1,hp:8,desc:'방어 +1 · 최대 HP +8'},
 dusk:{name:'황혼의 망토',slot:'armor',rarity:'희귀',def:2,hp:12,desc:'방어 +2 · 최대 HP +12'},
 seal:{name:'새벽의 인장',slot:'ring',rarity:'희귀',crit:8,gold:10,desc:'치명타 +8% · 획득 골드 +10%'},
 crown:{name:'잔불의 왕관',slot:'ring',rarity:'영웅',atk:3,hp:15,desc:'공격력 +3 · 최대 HP +15'},
};
const UPGRADES={
 atk:{name:'칼날 연마',desc:'공격력 +1',base:60,max:15},
 hp:{name:'생명의 서약',desc:'최대 HP +6',base:50,max:15},
 def:{name:'견고한 갑주',desc:'방어력 +1',base:90,max:8},
 luck:{name:'별의 가호',desc:'치명타 +1%',base:70,max:15},
 gold:{name:'탐험가의 감각',desc:'획득 골드 +5%',base:80,max:10},
 firstCrit:{name:'선제 필살',desc:'매 전투 첫 타격은 치명타',base:350,max:1},
};
const SLOT_NAMES={weapon:'무기',armor:'갑옷',ring:'반지'};
const ACHIEVEMENTS=[
 {id:'re_first',name:'첫 발걸음',desc:'탐험 한 번 완료',test:s=>s.playCount>0},
 {id:'re_clear',name:'꺼지지 않는 불',desc:'보스 첫 처치',test:s=>s.clearCount>0},
 {id:'re_hunter',name:'깊은 곳의 사냥꾼',desc:'적 30마리 처치',test:s=>Object.values(s.killCounts).reduce((a,b)=>a+b,0)>=30},
 {id:'re_collector',name:'유물 수집가',desc:'새 유물 4종 발견',test:s=>Object.keys(RELICS).filter(k=>s.relicsSeen.includes(k)).length>=4},
];

// systems/random
// A saved seed makes refreshes deterministic, including loot and critical hits.
function random(run) { let x=run.seed|0; x^=x<<13; x^=x>>>17; x^=x<<5; run.seed=x>>>0; return run.seed/4294967296; }
function pick(run,list){return list[Math.floor(random(run)*list.length)];}
function sample(run,list,count){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random(run)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,count);}

// systems/progression
function item(id){return ITEMS[id]||null;}
function stats(save,run=null){
 const c=CLASSES[run?.classKey||save.lastClass],u=save.upgrades;
 const s={maxHp:c.hp+u.hp*6,atk:c.atk+u.atk,def:c.def+u.def,crit:c.crit+u.luck*.01,gold:1+u.gold*.05};
 for(const id of Object.values(save.equipped)){const e=item(id);if(!e)continue;s.maxHp+=e.hp||0;s.atk+=e.atk||0;s.def+=e.def||0;s.crit+=(e.crit||0)/100;s.gold+=(e.gold||0)/100;}
 if(run){s.atk+=run.bonusAtk||0;}
 s.crit=Math.min(.65,s.crit);return s;
}
function upgradeCost(save,key){return Math.round(UPGRADES[key].base*Math.pow(1.45,save.upgrades[key]));}
function buyUpgrade(save,key){const d=UPGRADES[key];if(!d||save.run||save.upgrades[key]>=d.max)return false;const cost=upgradeCost(save,key);if(save.totalGold<cost)return false;save.totalGold-=cost;save.upgrades[key]++;return true;}
function equip(save,id){const e=item(id);if(!e||!save.inventory.includes(id))return false;const before=stats(save,save.run).maxHp;save.equipped[e.slot]=save.equipped[e.slot]===id?null:id;if(save.run){const after=stats(save,save.run).maxHp;save.run.hp=Math.max(1,Math.min(after,save.run.hp+after-before));}return true;}
function grantItem(save,id){if(!ITEMS[id])return; if(!save.inventory.includes(id))save.inventory.push(id);if(!save.equipped[ITEMS[id].slot])save.equipped[ITEMS[id].slot]=id;}
function settle(save,victory,reason=''){
 const r=save.run;if(!r||r.phase==='result')return;
 r.phase='result';r.victory=victory;r.reason=reason;r.earned=r.gold+(victory?90:15);r.elapsed=Math.max(0,Math.floor((Date.now()-r.startedAt)/1000));
 save.totalGold+=r.earned;save.playCount++;save.bestFloor=Math.max(save.bestFloor,r.depth+1);
 if(victory){save.clearCount++;grantItem(save,'crown');save.bestClearTime=save.bestClearTime===null?r.elapsed:Math.min(save.bestClearTime,r.elapsed);}
 r.newAchievements=[];
 for(const a of ACHIEVEMENTS)if(!save.achievements.includes(a.id)&&a.test(save)){save.achievements.push(a.id);r.newAchievements.push(a.name);}
}

// systems/combat
function log(r,text){r.log.unshift(text);r.log=r.log.slice(0,30);}
function skillCost(r){return Math.max(1,CLASSES[r.classKey].cost-(r.relics.includes('lens')?1:0));}
function spawn(save,key,type){
 const r=save.run,e=ENEMIES[key],scale=1+r.difficulty*.18+(type==='boss'?0:r.depth*.055);
 r.enemy={key,type,hp:Math.round(e.hp*scale),maxHp:Math.round(e.hp*scale),atk:Math.round(e.atk*scale),def:e.def,turn:0,poison:0,burn:0,phase:1,first:true};
 r.phase='combat';r.energy=CLASSES[r.classKey].maxEnergy;r.poison=0;r.burn=0;r.focus=false;
 log(r,e.name+' 등장. 다음 행동을 확인하세요.');
}
function intent(r){
 const e=r.enemy,d=ENEMIES[e.key],type=d.pattern[e.turn%d.pattern.length];
 const power=Math.round(e.atk*(e.phase===2?1.25:1));
 const entries={
 attack:{type,label:'공격',damage:power,hint:'일반 공격'},
 heavy:{type,label:'강타',damage:Math.round(power*1.9),hint:'큰 피해 · 방어 권장'},
 charge:{type,label:'숨 고르기',damage:0,hint:'다음 턴 화염 폭풍 · 지금 공격 기회'},
 inferno:{type,label:'화염 폭풍',damage:Math.round(power*2.2),hint:'큰 피해 + 화상 · 방어 시 화상 차단'},
 guard:{type,label:'방패 태세',damage:0,hint:'받는 타격 피해 55% 감소'},
 recover:{type,label:'빈틈',damage:0,hint:'이번 턴 공격하지 않음'},
 poison:{type,label:'독 칼날',damage:power,hint:'피해 + 독 · 방어 시 독 차단'},
 };return entries[type];
}
function act(save,action){
 const r=save.run;if(!r||r.phase!=='combat'||!['attack','skill','guard','potion'].includes(action))return null;
 const e=r.enemy,c=CLASSES[r.classKey],s=stats(save,r),has=k=>r.relics.includes(k);
 if(action==='skill'&&r.energy<skillCost(r))return null;
 if(action==='potion'&&(r.potions<1||r.hp>=s.maxHp))return null;
 const move=intent(r),fx={action,dealt:0,taken:0,heal:0,crit:false},guard=action==='guard'||action==='skill'&&r.classKey==='warrior';
 if(action==='potion'){r.potions--;fx.heal=Math.min(s.maxHp-r.hp,Math.round(s.maxHp*.4));r.hp+=fx.heal;r.poison=0;r.burn=0;log(r,'물약: HP +'+fx.heal+' · 상태이상 해제');}
 if(action==='guard'){r.energy=Math.min(c.maxEnergy,r.energy+(r.classKey==='mage'?2:1));log(r,'방어 태세 · 자원 회복');}
 if(action==='attack'||action==='skill'){
  fx.crit=e.first&&save.upgrades.firstCrit>0||random(r)<s.crit;
  let damage=s.atk+(has('edge')?5:0)+(r.focus?(r.classKey==='warrior'?9:6):0);
  if(action==='skill'){
   r.energy-=skillCost(r);
   damage*=c.skillMultiplier;
   if(has('ember'))damage+=4;if(has('ember')&&has('lens'))damage+=6;
   if(r.classKey==='mage'){if(e.burn>0)damage+=9;e.burn=3;}
   if(r.classKey==='rogue')e.poison=3;
  }else{r.energy=Math.min(c.maxEnergy,r.energy+1);if(has('venom'))e.poison=Math.max(e.poison,2);}
  damage=Math.max(1,Math.round((damage-e.def)*(fx.crit?1.7:1)*(move.type==='guard'?.45:1)));
  fx.dealt=damage;e.hp=Math.max(0,e.hp-damage);r.focus=false;e.first=false;
  log(r,(action==='skill'?c.skill:'공격')+(fx.crit?' · 치명타':'')+' '+damage+' 피해');
 }
 for(const key of ['poison','burn'])if(e[key]>0&&e.hp>0){const n=(key==='poison'?4:5)+(has(key==='poison'?'venom':'ember')?2:0);e.hp=Math.max(0,e.hp-n);e[key]--;log(r,(key==='poison'?'독':'화상')+' '+n+' 피해');}
 if(e.hp<=0){win(save);return fx;}
 if(move.damage>0){
  let damage=Math.max(1,move.damage-s.def+(has('edge')?2:0));
  damage=Math.round(damage*(guard?(action==='guard'?.25:1-c.skillReduction):1));r.hp=Math.max(0,r.hp-damage);fx.taken=damage;log(r,move.label+' · '+damage+' 피해'+(guard?' (방어)':''));
  if(!guard&&move.type==='poison')r.poison=3;
  if(!guard&&move.type==='inferno')r.burn=3;
  if(guard&&has('thorn')){e.hp=Math.max(0,e.hp-6);log(r,'가시 반격 · 6 피해');}
 }else log(r,move.label+' · 공격 기회');
 if(guard){r.focus=action==='guard';r.poison=0;r.burn=0;}
 for(const key of ['poison','burn'])if(r[key]>0){r.hp=Math.max(0,r.hp-3);r[key]--;log(r,(key==='poison'?'중독':'화상')+' · HP -3');}
 e.turn++;
 if(e.key==='dragon'&&e.hp<=e.maxHp*.5&&e.phase===1){e.phase=2;log(r,'격노! 보스의 공격이 25% 강해집니다.');}
 if(r.hp<=0)settle(save,false,'던전에서 쓰러졌습니다.');
 else if(e.hp<=0)win(save);
 return fx;
}
function win(save){
 const r=save.run,e=r.enemy,key=e.key;
 r.kills++;save.killCounts[key]=(save.killCounts[key]||0)+1;if(!save.bestiary.includes(key))save.bestiary.push(key);
 const gain=Math.round((e.type==='boss'?65:e.type==='elite'?32:18)*stats(save,r).gold);r.gold+=gain;
 log(r,'전투 승리 · '+gain+' G');
 if(r.relics.includes('moon'))r.hp=Math.min(stats(save,r).maxHp,r.hp+10);
 if(e.type==='elite'){const id=pick(r,['fang','star','dusk','seal']);grantItem(save,id);r.loot=id;}
 if(e.type==='boss')settle(save,true);
 else r.phase='reward';
}

// systems/dungeon
function start(save,seed=(Date.now()>>>0)||1){
 if(save.run&&save.run.phase!=='result')return false;
 const r={seed:seed||1,classKey:save.lastClass,difficulty:save.difficulty,depth:-1,phase:'map',hp:stats(save).maxHp,energy:CLASSES[save.lastClass].maxEnergy,potions:2,gold:0,kills:0,bonusAtk:0,relics:[],map:[],path:[],enemy:null,choices:[],log:[],startedAt:Date.now(),poison:0,burn:0,focus:false};
 for(let i=0;i<9;i++){
  const types=i===0?['battle']:i===3||i===6?['relic']:i===8?['boss']:i===7?['rest','elite']:i===4?['elite','battle']:sample(r,['battle','treasure','event','shop','rest'],2);
  r.map.push(types);
 }
 save.run=r;log(r,'잔불의 성소에 발을 들였습니다.');return true;
}
function enter(save,index){
 const r=save.run;if(!r||r.phase!=='map'||!Number.isInteger(index))return false;
 const row=r.map[r.depth+1];if(!row||!row[index])return false;
 r.depth++;r.path.push(index);r.room=row[index];r.loot=null;r.choices=[];
 if(['battle','elite','boss'].includes(r.room)){spawn(save,r.room==='boss'?'dragon':r.room==='elite'?pick(r,['chief','sentinel']):pick(r,['goblin','skeleton']),r.room);}
 else if(r.room==='relic'){r.phase='room';r.choices=sample(r,Object.keys(RELICS).filter(k=>!r.relics.includes(k)),3);}
 else if(r.room==='treasure'){r.phase='reward';const id=pick(r,['iron','fang','plate','star','seal','dusk']);grantItem(save,id);r.loot=id;r.gold+=12;log(r,'보물 발견 · 장비와 12 G');}
 else r.phase='room';
 return true;
}
function next(save){const r=save.run;if(!r||r.phase!=='reward')return false;r.phase='map';r.enemy=null;return true;}
function choose(save,id){
 const r=save.run;if(!r||r.phase!=='room')return false;
 if(r.room==='relic'){
  if(!r.choices.includes(id))return false;r.relics.push(id);if(!save.relicsSeen.includes(id))save.relicsSeen.push(id);log(r,RELICS[id].name+' 획득');
 }else if(r.room==='rest'){
  if(!['heal','potion'].includes(id))return false;
  if(id==='heal'){r.hp=Math.min(stats(save,r).maxHp,r.hp+Math.round(stats(save,r).maxHp*.4));log(r,'쉼터 · HP 40% 회복');}else {r.potions++;log(r,'여행 물약 +1');}
 }else if(r.room==='event'){
  if(!['sacrifice','leave'].includes(id))return false;
  if(id==='sacrifice'){if(r.hp<=18)return false;r.hp-=18;r.bonusAtk+=3;log(r,'제단의 계약 · HP -18 / 공격력 +3');}else log(r,'제단을 조용히 지나쳤습니다.');
 }else if(r.room==='shop'){
  if(id==='leave'){r.phase='reward';return true;}
  if(id==='dusk'&&save.inventory.includes(id))return false;const cost=id==='potion'?25:id==='dusk'?45:Infinity;if(r.gold<cost)return false;
  r.gold-=cost;if(id==='potion'){r.potions++;log(r,'물약 구매 · 25 G');}else{grantItem(save,id);log(r,'황혼의 망토 구매 · 45 G');}
  return true;
 }else return false;
 r.phase='reward';return true;
}
function abandon(save){if(save.run&&save.run.phase!=='result')settle(save,false,'탐험에서 귀환했습니다.');}

// systems/save
const SAVE_KEY='omd_save_v2',OLD_KEY='omd_save_v1';
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const num=(v,max=1e9)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
const list=v=>Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string').map(x=>x.slice(0,200)))]:[];
const owns=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k);
function fresh(){return {version:2,totalGold:0,playCount:0,clearCount:0,bestFloor:0,bestClearTime:null,lastClass:'warrior',difficulty:0,upgrades:Object.fromEntries(Object.keys(UPGRADES).map(k=>[k,0])),inventory:[],equipped:{weapon:null,armor:null,ring:null},bestiary:[],achievements:[],killCounts:{},relicsSeen:[],settings:{sound:true},legacy:null,run:null};}
function normalize(v){
 const s=fresh();if(!obj(v))return s;
 for(const k of ['totalGold','playCount','clearCount','bestFloor'])s[k]=num(v[k]);
 s.bestClearTime=typeof v.bestClearTime==='number'&&Number.isFinite(v.bestClearTime)&&v.bestClearTime>=0?num(v.bestClearTime):null;
 if(owns(CLASSES,v.lastClass))s.lastClass=v.lastClass;s.difficulty=num(v.difficulty,3);
 for(const k of Object.keys(UPGRADES))s.upgrades[k]=num(v.upgrades?.[k],UPGRADES[k].max);
 s.inventory=list(v.inventory).filter(k=>owns(ITEMS,k));
 for(const k of ['weapon','armor','ring'])if(s.inventory.includes(v.equipped?.[k])&&ITEMS[v.equipped[k]].slot===k)s.equipped[k]=v.equipped[k];
 for(const k of ['bestiary','achievements','relicsSeen'])s[k]=list(v[k]);
 if(obj(v.killCounts))for(const [k,n] of Object.entries(v.killCounts))if(/^[a-z0-9_]+$/.test(k)&&k!=='__proto__')s.killCounts[k]=num(n);
 s.settings.sound=v.settings?.sound!==false;s.legacy=obj(v.legacy)?v.legacy:null;
 s.run=validRun(v.run)?structuredClone(v.run):null;return s;
}
function validRun(r){
 if(!obj(r)||!owns(CLASSES,r.classKey)||!['map','room','combat','reward','result'].includes(r.phase))return false;
 const range=(k,a,b)=>Number.isInteger(r[k])&&r[k]>=a&&r[k]<=b;
 if(!range('depth',-1,8)||!range('seed',1,4294967295)||!range('hp',0,10000)||!range('energy',0,CLASSES[r.classKey].maxEnergy)||!range('potions',0,1000)||!range('gold',0,1e7)||!range('kills',0,50)||!range('bonusAtk',0,1000)||!range('difficulty',0,3))return false;
 if(!Number.isFinite(r.startedAt)||r.startedAt<0||typeof r.focus!=='boolean')return false;
 for(const k of ['poison','burn'])if(!range(k,0,10))return false;
 if(!Array.isArray(r.map)||r.map.length!==9||!r.map.every(row=>Array.isArray(row)&&row.length>=1&&row.length<=2&&row.every(k=>owns(ROOMS,k))))return false;
 if(r.map[0].join()!=='battle'||r.map[3].join()!=='relic'||r.map[6].join()!=='relic'||r.map[8].join()!=='boss')return false;
 if(!Array.isArray(r.path)||r.path.length!==r.depth+1||!r.path.every((x,i)=>Number.isInteger(x)&&x>=0&&x<r.map[i].length))return false;
 if(r.depth>=0&&r.room!==r.map[r.depth][r.path[r.depth]])return false;
 if(r.phase==='map'&&r.depth>=8)return false;
 if(!Array.isArray(r.relics)||new Set(r.relics).size!==r.relics.length||!r.relics.every(k=>owns(RELICS,k)))return false;
 if(!Array.isArray(r.choices)||!r.choices.every(k=>owns(RELICS,k)))return false;
 if(!Array.isArray(r.log)||r.log.length>30||!r.log.every(x=>typeof x==='string'&&x.length<500))return false;
 if(r.phase==='room'&&!['relic','rest','shop','event'].includes(r.room))return false;
 if(r.phase==='room'&&r.room==='relic'&&(r.choices.length<1||r.choices.some(k=>r.relics.includes(k))))return false;
 if(r.phase==='combat'){
  const e=r.enemy;if(!obj(e)||!owns(ENEMIES,e.key)||!['battle','elite','boss'].includes(e.type)||e.type!==r.room)return false;
  for(const k of ['hp','maxHp','atk','def','turn','poison','burn'])if(!Number.isInteger(e[k])||e[k]<0||e[k]>10000)return false;
  if(e.hp<=0||e.hp>e.maxHp||r.hp<=0||![1,2].includes(e.phase)||typeof e.first!=='boolean')return false;
 }
 if(r.phase==='result'&&(typeof r.victory!=='boolean'||!Number.isFinite(r.earned)||!Number.isFinite(r.elapsed)||!Array.isArray(r.newAchievements)))return false;
 return true;
}
function legacyItem(e){
 if(!obj(e))return null;
 const strong=['희귀','영웅','전설','레전더리'].includes(e.grade);
 return e.slot==='weapon'?(strong?'fang':'iron'):e.slot==='armor'?(strong?'dusk':'plate'):e.slot==='ring'?'seal':null;
}
function migrate(v){
 const s=normalize({...v,inventory:[],equipped:{},run:null});
 if(!obj(v))return s;
 let credit=0;for(const k of Object.keys(UPGRADES))credit+=Math.max(0,num(v.upgrades?.[k],1000)-UPGRADES[k].max)*50;
 s.totalGold=Math.min(1e9,s.totalGold+credit);
 for(const e of Array.isArray(v.inventory)?v.inventory:[]){const id=legacyItem(e);if(id&&!s.inventory.includes(id))s.inventory.push(id);}
 for(const slot of ['weapon','armor','ring']){const id=legacyItem({...v.equipped?.[slot],slot});if(v.equipped?.[slot]&&id){if(!s.inventory.includes(id))s.inventory.push(id);s.equipped[slot]=id;}}
 s.legacy={source:OLD_KEY,migratedAt:Date.now(),credit,snapshot:v};
 return s;
}
function load(storage){
 let raw;try{raw=storage.getItem(SAVE_KEY);}catch{return {save:fresh(),notice:'브라우저 저장소를 사용할 수 없습니다. 이번 플레이는 임시로 진행됩니다.',readOnly:true};}
 if(raw){
  try{
   const p=JSON.parse(raw);
   if(p?.version>2)return {save:fresh(),notice:'더 새로운 버전의 세이브가 있어 덮어쓰지 않습니다. 임시 플레이입니다.',readOnly:true};
   if(!obj(p)||p.version!==2)throw Error('schema');
   const save=normalize(p);
   if(p.run&&!save.run){const backed=backup(storage,raw);return {save,readOnly:!backed,notice:backed?'손상된 탐험은 복원하지 않았습니다. 영구 진행과 원본 백업은 보존했습니다.':'백업 공간이 부족합니다. 원본을 보존하며 임시로 진행합니다.'};}
   return {save,notice:''};
  }catch{const backed=backup(storage,raw);return {save:fresh(),readOnly:!backed,notice:backed?'손상된 세이브를 백업하고 새 게임을 준비했습니다.':'백업 공간이 부족합니다. 원본을 보존하며 임시로 진행합니다.'};}
 }
 try{const old=storage.getItem(OLD_KEY);if(old){const p=JSON.parse(old);if(obj(p))return {save:migrate(p),notice:'기존 기록을 가져왔습니다. 원본 세이브와 미지원 콘텐츠는 보존됩니다. 진행 중이던 구버전 탐험은 새로 시작합니다.'};}}catch{}
 return {save:fresh(),notice:''};
}
function backup(storage,raw){try{if(!storage.getItem(SAVE_KEY+'_recovery'))storage.setItem(SAVE_KEY+'_recovery',raw);return true;}catch{return false;}}
function persist(storage,save){try{storage.setItem(SAVE_KEY,JSON.stringify(save));return true;}catch{return false;}}

const IMPORT_BACKUP_KEY=SAVE_KEY+'_before_import',MAX_IMPORT_BYTES=5*1024*1024;
function parseImport(raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>MAX_IMPORT_BYTES)throw Error('5MB 이하의 세이브 JSON 파일을 선택하세요.');
 let parsed;try{parsed=JSON.parse(raw.replace(/^\uFEFF/,''));}catch{throw Error('JSON 파일을 읽을 수 없습니다. 내려받은 백업 파일을 선택하세요.');}
 if(!obj(parsed)||parsed.version!==2)throw Error('이 게임에서 내려받은 V2 백업만 가져올 수 있습니다.');
 const candidate=normalize(parsed);
 const same=(a,b)=>{
  if(a===b)return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
  const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));
 };
 if(!same(candidate,parsed))throw Error('백업의 데이터가 손상되었거나 지원하지 않는 형식입니다. 현재 기록은 변경하지 않았습니다.');
 return candidate;
}
function restoreImport(storage,candidate,current,{readOnly=false}={}){
 if(readOnly)throw Error('현재 저장소를 보호 중이므로 백업을 가져올 수 없습니다.');
 const restored=parseImport(JSON.stringify(candidate));
 try{
  const previous=storage.getItem(SAVE_KEY)??JSON.stringify(current);
  storage.setItem(IMPORT_BACKUP_KEY,previous);
  storage.setItem(SAVE_KEY,JSON.stringify(restored));
 }catch{throw Error('저장 공간이 부족하거나 저장소가 차단되어 복원하지 못했습니다. 현재 기록은 유지됩니다.');}
 return restored;
}

// systems/session

// All cooperating tabs use the same exclusive lock for read/check/change/write.
// Without Web Locks, comparison still catches stale saves, but is not atomic.
function createSaveSession(storage,locks){
 let expected=null,tracked=false,queue=Promise.resolve();
 return {
  capture(){expected=storage.getItem(SAVE_KEY);tracked=true;},
  remember(raw){expected=raw;tracked=true;},
  isCurrent(){return !tracked||storage.getItem(SAVE_KEY)===expected;},
  run(task){
   const next=queue.then(()=>locks?.request?locks.request(SAVE_KEY,{mode:'exclusive'},task):task());
   queue=next.catch(()=>{});return next;
  }
 };
}

// systems/audio
// Procedural feedback, unlocked only by a user gesture. No timers/BGM loop.
let context;
const tones={button:[330],attack:[180,130],hit:[100,75],crit:[550,880],skill:[440,660,990],reward:[660,880],level:[523,659,784],boss:[90,80,65],victory:[523,659,784,1047],defeat:[220,165,110],guard:[250,400]};
function sound(key,enabled){
 if(!enabled)return;
 try{context??=new (window.AudioContext||window.webkitAudioContext)();if(context.state==='suspended')context.resume().catch(()=>{});
 (tones[key]||tones.button).forEach((f,i)=>{const osc=context.createOscillator(),gain=context.createGain(),t=context.currentTime+i*.075;osc.type=['hit','boss'].includes(key)?'triangle':'sine';osc.frequency.value=f;gain.gain.setValueAtTime(.045,t);gain.gain.exponentialRampToValueAtTime(.001,t+.16);osc.connect(gain).connect(context.destination);osc.start(t);osc.stop(t+.18);osc.onended=()=>{osc.disconnect();gain.disconnect();};});
 }catch{}
}

// ui/screens
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(label,action,value='',cls='',disabled=false)=>'<button class="'+cls+'" data-action="'+action+'" data-value="'+esc(value)+'" '+(disabled?'disabled':'')+'>'+label+'</button>';
const art=(key,label,cls='',lazy=false)=>'<img class="art '+cls+'" src="./assets/'+key+'.webp" alt="'+esc(label)+'" '+(lazy?'loading="lazy"':'')+' draggable="false">';
const bar=(value,max,label,cls='')=>'<div class="meter '+cls+'" role="progressbar" aria-label="'+label+'" aria-valuenow="'+value+'" aria-valuemax="'+max+'" aria-valuemin="0"><i style="width:'+Math.min(100,Math.max(0,value/max*100))+'%"></i></div>';
const small=(a,b)=>'<span class="eyebrow">'+a+'</span><h2>'+b+'</h2>';
function header(s){return '<header class="topbar"><button class="brand" data-action="home" aria-label="타이틀로 이동"><span class="brand-mark">D</span><span>ONE MINUTE <b>DUNGEON <em>RE</em></b></span></button><div class="top-tools"><span class="wallet">'+s.totalGold.toLocaleString()+' <small>G</small></span>'+btn('도움말','modal','help','quiet')+btn(s.settings.sound?'소리 켜짐':'소리 꺼짐','sound','','quiet')+'</div></header>';}
function title(s){
 const c=CLASSES[s.lastClass],active=s.run&&s.run.phase!=='result';
 return '<main class="title-screen"><section class="title-art"><div class="title-copy"><p class="eyebrow">A LITTLE ADVENTURE. A NEW BEGINNING.</p><h1>ONE MINUTE<br><strong>DUNGEON</strong><span class="re-stamp">RE</span></h1><p class="tagline">다시, 던전의 문 앞에서.</p></div><div class="hero-display">'+art(s.lastClass,c.name,'title-hero')+'<div class="hero-caption"><span>THE EMBER SANCTUARY</span><b>잔불의 성소</b></div></div><div class="title-foot"><span>짧은 탐험, 깊은 선택.</span><span>한 판 약 3–5분</span></div></section><section class="title-panel">'+small('CHOOSE YOUR ADVENTURER','누구의 이야기를 시작할까요?')+'<div class="class-grid">'+Object.entries(CLASSES).map(([k,v])=>'<button class="class-card '+(s.lastClass===k?'selected':'')+'" data-action="class" data-value="'+k+'" aria-pressed="'+(s.lastClass===k)+'" '+(active?'disabled':'')+'>'+art(k,v.name,'',k!==s.lastClass)+'<strong>'+v.name+'</strong><small>'+v.role+'</small></button>').join('')+'</div><div class="class-detail"><span class="eyebrow">'+c.title+'</span><h3>'+c.skill+'</h3><p>'+c.desc+'</p><div class="stat-line"><span>HP <b>'+stats(s).maxHp+'</b></span><span>공격 <b>'+stats(s).atk+'</b></span><span>방어 <b>'+stats(s).def+'</b></span></div></div><label class="difficulty">탐험 난도<select id="difficulty" '+(active?'disabled':'')+'>'+[0,1,2,3].map(n=>'<option value="'+n+'" '+(s.difficulty===n?'selected':'')+'>'+['첫 번째 불꽃','깊어진 어둠 · 적 +18%','잿빛 시련 · 적 +36%','심연 · 적 +54%'][n]+'</option>').join('')+'</select></label>'+btn(active?'탐험 이어하기 <span>→</span>':'던전 입장 <span>→</span>',active?'resume':'start','','primary enter')+'<p class="subtle center">적의 다음 행동을 읽고, 나만의 길을 선택하세요.</p><nav class="meta-nav">'+btn('영구 성장','modal','upgrades')+btn('장비','modal','inventory')+btn('도감·업적','modal','collection')+'</nav><div class="records"><div><b>'+s.playCount+'</b><span>완료한 탐험</span></div><div><b>'+s.clearCount+'</b><span>클리어</span></div><div><b>'+(s.bestClearTime===null?'—':s.bestClearTime+'s')+'</b><span>최단 기록</span></div></div></section></main>';
}
function mapMarkup(r,compact=false){
 return '<div class="dungeon-map '+(compact?'compact':'')+'">'+r.map.map((row,i)=>'<div class="map-row '+(i<=r.depth?'visited':'')+'"><span class="floor">'+String(i+1).padStart(2,'0')+'</span><div class="nodes">'+row.map((type,j)=>{const d=ROOMS[type],current=i===r.depth+1&&r.phase==='map',selected=r.path[i]===j;return '<button class="node '+d.tone+' '+(selected?'chosen':'')+' '+(current?'available':'')+'" data-action="room" data-value="'+j+'" '+(!current?'disabled':'')+' aria-label="'+(i+1)+'구간 '+d.name+(selected?' 방문함':'')+'"><span>'+d.symbol+'</span><b>'+d.name+'</b>'+(compact?'':'<small>'+d.desc+'</small>')+(selected?'<i>✓</i>':'')+'</button>';}).join('')+'</div></div>').join('')+'</div>';
}
function playerPanel(s){
 const r=s.run,c=CLASSES[r.classKey],st=stats(s,r);
 return '<aside class="player-panel"><p class="eyebrow">ADVENTURER</p><div class="player-identity">'+art(r.classKey,c.name)+'<div><small>'+c.title+'</small><h2>'+c.name+'</h2></div></div><div class="stat-line"><span>공격 <b>'+st.atk+'</b></span><span>방어 <b>'+st.def+'</b></span><span>치명 <b>'+Math.round(st.crit*100)+'%</b></span></div><h3 class="section-label">장비</h3>'+Object.entries(s.equipped).map(([slot,id])=>'<button class="equip-slot" data-action="modal" data-value="inventory"><span>'+SLOT_NAMES[slot]+'</span><b>'+(ITEMS[id]?.name||'미장착')+'</b></button>').join('')+'<h3 class="section-label">클래스 스킬</h3><p class="skill-name">'+c.skill+'</p><p class="subtle">'+c.skillDesc+'</p><div class="field-notes"><p class="eyebrow">FIELD NOTES</p><p>강공격 전에는 방어.<br>빈틈이 보이면 스킬.<br>살아남는 것도 하나의 선택.</p></div>'+btn('탐험 귀환','modal','abandon','quiet')+'</aside>';
}
function buildPanel(r){return '<aside class="build-panel"><div class="section-heading"><span class="eyebrow">EXPEDITION</span><b>'+Math.max(1,r.depth+1)+' / 9</b></div>'+mapMarkup(r,true)+'<h3 class="section-label">이번 탐험의 유물 <span>'+r.relics.length+'</span></h3><div class="relic-list">'+(r.relics.length?r.relics.map(k=>'<div><b>'+RELICS[k].name+'</b><small>'+RELICS[k].desc+'</small></div>').join(''):'<p class="subtle">4·7구간에서 유물을 선택합니다.</p>')+'</div>'+(r.relics.includes('ember')&&r.relics.includes('lens')?'<p class="synergy">별불꽃 공명 · 스킬 +6</p>':'')+'</aside>';}
function hud(s){
 const r=s.run,st=stats(s,r),c=CLASSES[r.classKey];
 return '<div class="player-hud"><div class="resource"><div><b>HP</b><span>'+r.hp+' / '+st.maxHp+'</span></div>'+bar(r.hp,st.maxHp,'플레이어 HP',r.hp/st.maxHp<.3?'low':'health')+'</div><div class="resource energy"><div><b>'+(r.classKey==='mage'?'마나':'기력')+'</b><span>'+r.energy+' / '+c.maxEnergy+'</span></div>'+bar(r.energy,c.maxEnergy,'행동 자원','mana')+'</div><div class="run-gold">'+r.gold+' <small>G</small></div></div>';
}
function combat(s,busy){
 const r=s.run,e=r.enemy,d=ENEMIES[e.key],m=intent(r),c=CLASSES[r.classKey];
 return '<div class="arena '+(e.type==='boss'?'boss-arena '+(e.turn===0?'boss-enter':''):'')+'"><div class="enemy-info"><span class="eyebrow">'+(e.type==='boss'?'BOSS · '+(e.phase===2?'격노':'잔불의 군주'):e.type==='elite'?'ELITE ENCOUNTER':'ENCOUNTER')+'</span><h2>'+d.name+'</h2>'+bar(e.hp,e.maxHp,'적 HP','enemy-health')+'<small>'+e.hp+' / '+e.maxHp+' HP</small><div class="status-tags">'+(e.poison?'<span>독 '+e.poison+'턴</span>':'')+(e.burn?'<span>화상 '+e.burn+'턴</span>':'')+'</div></div><div class="intent '+(m.damage>25?'danger':'')+'"><b>다음 행동 · '+m.label+(m.damage?' '+m.damage:'')+'</b><small>'+m.hint+'</small></div><div class="fighter enemy-fighter" id="enemy-art">'+art(d.art,d.name)+'<span class="damage-anchor"></span></div><div class="fighter player-fighter" id="player-art">'+art(r.classKey,c.name)+'<span class="damage-anchor"></span></div><span class="turn-counter">TURN '+(e.turn+1)+'</span><div class="player-status">'+(r.focus?'<span>반격 준비</span>':'')+(r.poison?'<span>중독 '+r.poison+'턴</span>':'')+(r.burn?'<span>화상 '+r.burn+'턴</span>':'')+'</div></div>'+hud(s)+'<div class="combat-actions">'+btn('<kbd>1</kbd><b>공격</b><small>자원 +1</small>','act','attack','attack',busy)+btn('<kbd>2</kbd><b>'+c.skill+'</b><small>자원 '+skillCost(r)+' 소모</small>','act','skill','skill',busy||r.energy<skillCost(r))+btn('<kbd>3</kbd><b>방어</b><small>피해 75% 감소</small>','act','guard','guard',busy)+btn('<kbd>4</kbd><b>물약 ×'+r.potions+'</b><small>HP 40% · 정화</small>','act','potion','potion',busy||!r.potions||r.hp>=stats(s,r).maxHp)+'</div><p class="action-help">방어는 상태이상을 해제하고 자원을 회복합니다. 물약도 한 턴을 사용합니다.</p>';
}
function roomView(s){
 const r=s.run,meta=ROOMS[r.room];
 if(r.phase==='map')return '<div class="map-view">'+small('CHOOSE YOUR PATH','어떤 길을 택할까요?')+'<p class="subtle">빛나는 다음 구간을 선택하세요. 선택하지 않은 길은 지나칩니다.</p>'+mapMarkup(r)+'</div>'+hud(s);
 if(r.phase==='reward')return '<div class="room-view reward-view"><span class="room-sigil">◇</span>'+small('A MOMENT OF TRIUMPH',r.room==='treasure'?'잊힌 보물을 찾았습니다':'한 걸음 더 깊은 곳으로')+'<p>'+esc(r.log[0])+'</p>'+(r.loot?itemCard(r.loot,s,true):'')+btn('다음 길 선택 <span>→</span>','next','','primary')+'</div>'+hud(s);
 let choices='';
 if(r.room==='relic')choices=r.choices.map(k=>btn('<span class="eyebrow">'+RELICS[k].rarity+' · '+RELICS[k].tag+'</span><b>'+RELICS[k].name+'</b><small>'+RELICS[k].desc+'</small>','choose',k,'choice-card')).join('');
 if(r.room==='rest')choices=btn('<b>불가에서 쉬기</b><small>최대 HP의 40% 회복</small>','choose','heal','choice-card')+btn('<b>물약 챙기기</b><small>회복 물약 +1</small>','choose','potion','choice-card');
 if(r.room==='event')choices=btn('<b>제단과 계약하기</b><small>HP 18 소모 · 이번 판 공격력 +3</small>','choose','sacrifice','choice-card',r.hp<=18)+btn('<b>지나치기</b><small>체력을 지키고 다음 길로</small>','choose','leave','choice-card');
 if(r.room==='shop')choices=btn('<b>회복 물약</b><small>25 G · 현재 '+r.potions+'개</small>','choose','potion','choice-card',r.gold<25)+btn('<b>황혼의 망토</b><small>45 G · 방어 +2 / HP +12</small>','choose','dusk','choice-card',r.gold<45||s.inventory.includes('dusk'))+btn('상점 나가기','choose','leave','quiet');
 return '<div class="room-view"><span class="room-sigil">'+meta.symbol+'</span>'+small('THE EMBER SANCTUARY',meta.name)+'<p class="subtle">'+meta.desc+'</p><div class="choices">'+choices+'</div></div>'+hud(s);
}
function game(s,busy){
 const r=s.run;
 if(r.phase==='result')return result(s);
 return '<main class="game-layout">'+playerPanel(s)+'<section class="game-center"><div class="chapter-bar"><span>잔불의 성소 <small> / '+(r.difficulty+1)+'단계</small></span><b>'+String(Math.max(1,r.depth+1)).padStart(2,'0')+' <small>/ 09</small></b></div>'+(r.phase==='combat'?combat(s,busy):roomView(s))+'<div class="mobile-tools">'+btn('장비·가방','modal','inventory')+btn('유물','modal','relics')+btn('전투 기록','modal','log')+'</div><div class="battle-log" aria-label="최근 기록">'+r.log.slice(0,3).map((x,i)=>'<p class="'+(i===0?'latest':'')+'">'+esc(x)+'</p>').join('')+'</div></section>'+buildPanel(r)+'</main>';
}
function result(s){const r=s.run;return '<main class="result-screen '+(r.victory?'victory':'')+'"><p class="eyebrow">'+(r.victory?'THE FLAME LIVES ON':'EVERY END IS A BEGINNING')+'</p><h1>'+(r.victory?'잔불은 꺼지지 않는다.':'다음엔, 더 깊은 곳으로.')+'</h1><p>'+(r.victory?'성소의 군주를 쓰러뜨렸습니다.':esc(r.reason))+'</p>'+art(r.classKey,CLASSES[r.classKey].name)+'<div class="result-stats"><div><span>획득 골드</span><b>+'+r.earned+' G</b></div><div><span>도달 구간</span><b>'+(r.depth+1)+' / 9</b></div><div><span>처치</span><b>'+r.kills+'</b></div><div><span>탐험 시간</span><b>'+Math.floor(r.elapsed/60)+'분 '+r.elapsed%60+'초</b></div></div>'+(r.victory?'<p class="synergy">영웅 장비 · 잔불의 왕관 획득</p>':'')+(r.newAchievements.length?'<p>새 업적 · '+r.newAchievements.map(esc).join(' / ')+'</p>':'')+'<div class="result-actions">'+btn('다시 도전','start','','primary')+btn('성장하고 준비하기','home','','secondary')+'</div><p class="subtle">획득한 장비와 골드는 다음 모험에도 남습니다.</p></main>';}
function itemCard(id,s,compact=false){const d=ITEMS[id];if(!d)return '';const equipped=s.equipped[d.slot]===id;return '<article class="item-card '+(equipped?'equipped':'')+'"><span class="eyebrow">'+d.rarity+' · '+SLOT_NAMES[d.slot]+'</span><h3>'+d.name+'</h3><p>'+d.desc+'</p>'+btn(equipped?'장착 중 · 해제':'장착','equip',id,compact?'quiet':'secondary')+'</article>';}
function modalContent(name,s){
 const r=s.run;
 if(name==='inventory')return {title:'장비와 가방',body:'<p class="subtle">장비는 영구 보관됩니다. 장착 변경은 현재 탐험에도 적용됩니다.</p><div class="card-grid">'+(s.inventory.length?s.inventory.map(k=>itemCard(k,s)).join(''):'<p>보물방과 정예 전투에서 장비를 얻으세요.</p>')+'</div>'};
 if(name==='upgrades')return {title:'영구 성장',body:'<p class="wallet">보유 '+s.totalGold+' G</p><p class="subtle">성장은 다음 탐험부터 적용됩니다.</p><div class="card-grid">'+Object.entries(UPGRADES).map(([k,d])=>'<article class="item-card"><span class="eyebrow">LEVEL '+s.upgrades[k]+' / '+d.max+'</span><h3>'+d.name+'</h3><p>'+d.desc+'</p>'+btn(s.upgrades[k]>=d.max?'최대 레벨':upgradeCost(s,k)+' G · 강화','upgrade',k,'secondary',!!r||s.upgrades[k]>=d.max||s.totalGold<upgradeCost(s,k))+'</article>').join('')+'</div>'};
 if(name==='collection')return {title:'모험의 기록',body:'<h3>도감</h3><div class="card-grid">'+Object.entries(ENEMIES).map(([k,d])=>'<article class="item-card">'+(s.bestiary.includes(k)?art(d.art,d.name,'codex-art',true)+'<h3>'+d.name+'</h3><p>'+d.desc+'</p><small>처치 '+(s.killCounts[k]||0)+'회</small>':'<h3>미발견</h3><p>던전에서 이 적을 처치하세요.</p>')+'</article>').join('')+'</div><h3>업적</h3>'+ACHIEVEMENTS.map(a=>'<p class="achievement">'+(s.achievements.includes(a.id)?'✓':'○')+' <b>'+a.name+'</b> · '+a.desc+'</p>').join('')+(s.legacy?'<p class="subtle">구버전 업적·펫·퀘스트·장비 원본은 이전 기록으로 안전하게 보관 중입니다.</p>':'')};
 if(name==='relics')return {title:'이번 탐험의 유물',body:r?.relics.length?r.relics.map(k=>'<article class="item-card"><h3>'+RELICS[k].name+'</h3><p>'+RELICS[k].desc+'</p></article>').join(''):'<p>4·7구간에서 유물을 선택하세요.</p>'};
 if(name==='log')return {title:'전투 기록',body:r?.log.map(x=>'<p>'+esc(x)+'</p>').join('')||'<p>아직 기록이 없습니다.</p>'};
 if(name==='abandon')return {title:'이번 탐험에서 귀환할까요?',body:'<p>진행 중인 탐험을 종료하고 지금까지 얻은 골드와 장비를 가져갑니다.</p>'+btn('귀환하고 보상 받기','abandon','','primary')};
 return {title:'탐험 안내',body:'<p>9개 구간을 지나 잔불의 군주를 쓰러뜨리세요. 4·7구간에서는 이번 판에만 적용되는 유물을 얻습니다.</p><p><b>공격</b>은 자원을 1 회복합니다. <b>스킬</b>은 클래스마다 다릅니다. <b>방어</b>는 피해를 75% 줄이고 상태이상을 정화하며 다음 공격을 강화합니다.</p><p>적의 의도에 표시된 피해는 방어력 적용 전 수치입니다. 적이 강타·화염 폭풍을 준비하면 방어하세요.</p><p><b>키보드 1 / 2 / 3 / 4</b>로 공격·스킬·방어·물약을 사용합니다. Tab으로 이동하고 Enter로 선택합니다. Esc로 창을 닫습니다.</p><p>행동마다 자동 저장됩니다. 타이틀로 돌아가거나 새로고침해도 이어할 수 있습니다. 전투 중 나가도 시간은 흐르지만 적은 행동하지 않습니다. 다른 탭에서 기록이 바뀌면 진행을 멈추며, 최신 기록 불러오기로 이어갈 수 있습니다.</p>'+btn('세이브 백업 내려받기','export','','secondary')+'<h3>백업 가져오기</h3><p>이 게임에서 내려받은 V2 JSON 파일(최대 5MB)을 선택하세요. 복원 전 내용을 확인할 수 있습니다.</p><label for="save-import">세이브 JSON 파일</label><input id="save-import" type="file" accept=".json,application/json" aria-describedby="import-status"><p id="import-status" role="status" aria-live="polite"></p>'+btn('복원 전 기록 내려받기','export-previous','','secondary')};
}

// ui/effects
// Presentation only: combat and saving finish before effects run.
function combatFeedback(fx,classKey){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const arena=document.querySelector('.arena');
 const animate=(el,frames,duration=300,delay=0)=>{if(el&&!reduced)el.animate(frames,{duration,delay,easing:'cubic-bezier(.16,1,.3,1)'});};
 const effect=(parent,kind,delay=0)=>{
  if(!parent||reduced)return;
  const el=document.createElement('span');el.className='combat-fx fx-'+kind;el.setAttribute('aria-hidden','true');
  el.style.animationDelay=delay+'ms';parent.append(el);setTimeout(()=>el.remove(),900+delay);
 };
 const number=(target,n,kind,delay=0)=>{
  const anchor=target?.querySelector('.damage-anchor');if(!anchor||!n)return;
  const el=document.createElement('span');el.className='damage-number '+kind;el.textContent=(kind==='healing'?'+':'−')+n;
  el.setAttribute('aria-hidden','true');el.style.animationDelay=delay+'ms';if(kind==='healing')el.style.left='-32px';
  anchor.append(el);setTimeout(()=>el.remove(),1000+delay);
 };
 if(!arena){animate(document.querySelector('.reward-view, .result-screen'),[{opacity:.55,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],420);return;}
 const player=arena.querySelector('#player-art'),enemy=arena.querySelector('#enemy-art');
 const skill=fx.action==='skill',guard=fx.action==='guard'||skill&&classKey==='warrior';
 const impact=skill?classKey==='mage'?'arcane':classKey==='rogue'?'venom':'cleave':'slash';
 if(fx.dealt){
  animate(player,[{transform:'translateX(0)'},{transform:'translateX(-5px)',offset:.2},{transform:'translateX(26px)',offset:.5},{transform:'translateX(0)'}],200);
  animate(enemy,[{filter:'brightness(1)',transform:'translateX(0)'},{filter:'brightness(1.8)',transform:'translateX(9px)',offset:.2},{filter:'brightness(1)',transform:'translateX(0)'}],250,80);
  effect(enemy,impact,60);effect(enemy,'impact',80);
  if(fx.crit){effect(enemy,'critical',80);animate(arena,[{transform:'translateX(0)'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}],180,80);}
  number(enemy,fx.dealt,fx.crit?'critical':'',80);
 }
 if(guard)effect(player,'shield');
 if(fx.heal){effect(player,'heal');number(player,fx.heal,'healing');}
 if(fx.taken){
  const delay=fx.dealt||fx.heal?210:60;
  animate(player,[{transform:'translateX(0)',filter:'brightness(1)'},{transform:'translateX(-7px)',filter:'brightness(1.5)',offset:.25},{transform:'translateX(0)',filter:'brightness(1)'}],260,delay);
  effect(player,guard?'block':'hurt',delay);number(player,fx.taken,'incoming',delay);
 }
}

// main
let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('unavailable');}};}
let lockManager;try{lockManager=navigator.locks;}catch{}
const session=createSaveSession(storage,lockManager);
function boot(){
try{session.capture();}catch{}
const loaded=load(storage),save=loaded.save;
let stale=false;
const safeActions=new Set(['modal','close','export','export-previous','reload-save']);
let notice=loaded.notice,view=save.run?.phase==='result'?'game':'title',busy=false,modalName='',returnFocus=null;
let pendingImport=null,importMessage='',importRequest=0;
const app=document.getElementById('app'),dialog=document.getElementById('modal'),announce=document.getElementById('announce');
function write(){
 if(loaded.readOnly)return;
 if(!checkFresh())return;
 if(persist(storage,save))session.remember(JSON.stringify(save));
 else notice='저장 공간이 부족하거나 차단되어 저장하지 못했습니다. 도움말에서 백업을 내려받으세요.';
}
function markStale(message='다른 탭에서 기록이 변경되었습니다. 최신 기록을 불러온 뒤 계속하세요.'){
 if(stale)return;
 stale=true;notice=message;pendingImport=null;importRequest++;
 if(dialog.open)closeModal();
 render();announce.textContent=message;
}
function checkFresh(){
 if(stale)return false;
 try{if(session.isCurrent())return true;markStale();}
 catch{if(loaded.readOnly)return true;markStale('저장소를 확인할 수 없어 진행을 멈췄습니다. 현재 탭 기록을 백업한 뒤 다시 불러오세요.');}
 return false;
}
function dispatch(action,value){
 if(action==='reload-save'){window.location.reload();return;}
 if(action==='resume'){if(checkFresh())perform(action,value);return;}
 if(safeActions.has(action)){perform(action,value);return;}
 session.run(()=>{if(checkFresh())perform(action,value);}).catch(()=>markStale('저장 작업을 시작할 수 없습니다. 현재 탭 기록을 백업한 뒤 다시 불러오세요.'));
}
function render(focus=false){
 const active=document.activeElement;const key=active?.dataset.action;const value=active?.dataset.value;
 app.innerHTML=header(save)+(notice?'<div class="notice" role="status">'+esc(notice)+(stale?'<div class="save-conflict-actions">'+btn('최신 기록 불러오기','reload-save','','primary')+btn('현재 탭 기록 백업','export','','secondary')+'</div>':'')+'</div>':'')+(view==='game'&&save.run?game(save,busy):title(save))+'<footer class="site-footer"><span>ONE MINUTE DUNGEON RE</span><span>죽을수록 강해진다.</span></footer>';
 if(stale){app.querySelectorAll('button[data-action]').forEach(b=>{if(!safeActions.has(b.dataset.action))b.disabled=true;});const difficulty=app.querySelector('#difficulty');if(difficulty)difficulty.disabled=true;}
 if(focus){const h=app.querySelector('main h1, main h2');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
 else if(key&&!dialog.open){app.querySelector('[data-action="'+CSS.escape(key)+'"][data-value="'+CSS.escape(value||'')+'"]')?.focus({preventScroll:true});}
}
function openModal(name){returnFocus=document.activeElement;modalName=name;pendingImport=null;importMessage='';importRequest++;renderModal();if(!dialog.open)dialog.showModal();}
function renderModal(){const content=modalContent(modalName,save),active=document.activeElement;const key=active?.dataset.action,value=active?.dataset.value;
 dialog.innerHTML='<div class="modal-header"><h2 id="modal-title">'+content.title+'</h2>'+btn('닫기 ×','close','','quiet')+'</div><div class="modal-body">'+content.body+'</div>';
 if(modalName==='help'){
  const status=dialog.querySelector('#import-status');status.textContent=importMessage;
  dialog.querySelector('#save-import').disabled=!!loaded.readOnly||stale;
  if(loaded.readOnly)status.textContent='현재 저장소를 보호 중이므로 백업 가져오기를 사용할 수 없습니다.';
  if(pendingImport){const preview=document.createElement('div');preview.className='item-card';preview.innerHTML='<h3>복원할 기록</h3><p>'+CLASSES[pendingImport.lastClass].name+' · '+pendingImport.totalGold+' G · 완료 '+pendingImport.playCount+'회 · 클리어 '+pendingImport.clearCount+'회</p><p>'+(pendingImport.run?(pendingImport.run.phase==='result'?'완료한 탐험 결과 포함':'진행 중인 탐험 포함 · '+Math.max(1,pendingImport.run.depth+1)+'구간'):'진행 중인 탐험 없음')+'</p><p>현재 기록과 탐험을 이 백업으로 교체합니다. 교체 전 기록은 별도로 보관합니다.</p>'+btn('이 백업으로 복원','import-confirm','','primary');status.after(preview);}
 }
 if(stale){dialog.querySelectorAll('button[data-action]').forEach(b=>{if(!safeActions.has(b.dataset.action))b.disabled=true;});if(modalName==='help')dialog.querySelector('#import-status').textContent='최신 기록을 불러온 뒤 백업을 가져올 수 있습니다.';}
 if(key)dialog.querySelector('[data-action="'+CSS.escape(key)+'"][data-value="'+CSS.escape(value||'')+'"]')?.focus();
}
function closeModal(){dialog.close();modalName='';pendingImport=null;importRequest++;if(returnFocus?.isConnected)returnFocus.focus();else app.querySelector('[data-action="modal"]')?.focus();}
function downloadSave(raw,name){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function perform(action,value){
 if(busy&&action!=='close')return;
 if(action==='modal'){openModal(value);sound('button',save.settings.sound);return;}
 if(action==='close'){closeModal();return;}
 if(action==='sound'){save.settings.sound=!save.settings.sound;write();render();sound('button',save.settings.sound);return;}
 if(action==='export'){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(save,null,2)],{type:'application/json'}));a.href=url;a.download='dungeon-re-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
 if(action==='export-previous'){try{const raw=storage.getItem(IMPORT_BACKUP_KEY);if(!raw)throw Error('아직 복원 전 기록이 없습니다.');downloadSave(raw,'dungeon-re-before-import.json');}catch(e){importMessage=e.message;renderModal();}return;}
 if(action==='import-confirm'){
  if(!pendingImport||modalName!=='help')return;
  try{const restored=restoreImport(storage,pendingImport,save,loaded);session.remember(JSON.stringify(restored));Object.assign(save,restored);closeModal();view=save.run?.phase==='result'?'game':'title';notice='백업을 복원했습니다. 복원 전 기록은 도움말에서 내려받을 수 있습니다.';render(true);}
  catch(e){importMessage=e.message;renderModal();}return;
 }
 let focus=false,changed=false,tone='button',fx=null;
 switch(action){
 case 'difficulty':if(save.run)return;save.difficulty=Math.max(0,Math.min(3,Number(value)));changed=true;break;
 case 'class':if(save.run&&save.run.phase!=='result')return;if(!Object.hasOwn(CLASSES,value))return;save.lastClass=value;changed=true;break;
 case 'start':changed=start(save);if(changed){view='game';focus=true;}break;
 case 'resume':if(!save.run)return;view='game';focus=true;break;
 case 'home':if(save.run?.phase==='result'){save.run=null;changed=true;}view='title';focus=true;break;
 case 'room':changed=enter(save,Number(value));focus=changed;tone=save.run?.room==='boss'?'boss':'button';break;
 case 'next':changed=next(save);focus=changed;break;
 case 'choose':changed=choose(save,value);tone='reward';focus=changed;break;
 case 'act':fx=act(save,value);changed=!!fx;if(fx){busy=true;tone=save.run.phase==='result'?(save.run.victory?'victory':'defeat'):save.run.phase==='reward'?'reward':fx.crit?'crit':value==='potion'?'reward':value==='attack'?'attack':value==='guard'?'guard':'skill';focus=save.run.phase!=='combat';}break;
 case 'equip':changed=equip(save,value);break;
 case 'upgrade':changed=buyUpgrade(save,value);tone='level';break;
 case 'abandon':abandon(save);changed=true;view='game';focus=true;closeModal();tone='defeat';break;
 default:return;
 }
 if(changed)write();render(focus);if(dialog.open)renderModal();sound(tone,save.settings.sound);
 if(changed&&save.run)announce.textContent=save.run.log.slice(0,3).join(' ');
 if(fx){combatFeedback(fx,save.run.classKey);if(fx.taken&&save.run?.phase==='combat')setTimeout(()=>sound('hit',save.settings.sound),fx.dealt||fx.heal?210:60);setTimeout(()=>{busy=false;const r=save.run;if(!stale&&r?.phase==='combat')app.querySelectorAll('[data-action=act]').forEach(b=>{b.disabled=b.dataset.value==='skill'?r.energy<skillCost(r):b.dataset.value==='potion'?r.potions<1||r.hp>=stats(save,r).maxHp:false;});},340);}
}
document.addEventListener('click',event=>{const b=event.target.closest('button[data-action]');if(b&&!b.disabled)dispatch(b.dataset.action,b.dataset.value);});
document.addEventListener('change',event=>{if(event.target.id==='difficulty')dispatch('difficulty',event.target.value);});
document.addEventListener('change',async event=>{
 if(event.target.id!=='save-import'||loaded.readOnly||stale)return;
 const file=event.target.files?.[0],request=++importRequest;pendingImport=null;if(!file)return;
 importMessage='백업을 확인하고 있습니다.';renderModal();
 try{
  if(file.size>MAX_IMPORT_BYTES)throw Error('5MB 이하의 세이브 JSON 파일을 선택하세요.');
  const raw=await file.text();if(request!==importRequest||modalName!=='help')return;
  pendingImport=parseImport(raw);importMessage='파일을 확인했습니다. 아래 기록을 확인하고 복원하세요.';
 }catch(e){if(request!==importRequest||modalName!=='help')return;importMessage=e.message;}
 renderModal();dialog.querySelector('[data-action="import-confirm"]')?.focus();
});
document.addEventListener('keydown',event=>{if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||dialog.open||view!=='game'||save.run?.phase!=='combat'||['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;const a={'1':'attack','2':'skill','3':'guard','4':'potion'}[event.key];if(a){event.preventDefault();dispatch('act',a);}});
dialog.addEventListener('cancel',event=>{event.preventDefault();closeModal();});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();}});
document.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement){const img=event.target;const fallback=document.createElement('span');fallback.className='art-fallback';fallback.textContent=img.alt||'모험가';img.replaceWith(fallback);}},true);
window.addEventListener('storage',event=>{if(event.storageArea===storage&&(event.key===SAVE_KEY||event.key===null))checkFresh();});
window.addEventListener('pageshow',()=>checkFresh());
window.addEventListener('focus',()=>checkFresh());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkFresh();});
write();render();
}
session.run(boot).catch(()=>{
 document.getElementById('app').textContent='저장 작업을 시작할 수 없습니다. 페이지를 새로고침해 주세요.';
});

})();

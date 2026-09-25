import {CLASSES,RELICS} from '../data/content.js';
import {stats,grantItem,settle} from './progression.js';
import {pick,sample} from './random.js';
import {spawn,log} from './combat.js';
export function start(save,seed=(Date.now()>>>0)||1){
 if(save.run&&save.run.phase!=='result')return false;
 const r={seed:seed||1,classKey:save.lastClass,difficulty:save.difficulty,depth:-1,phase:'map',hp:stats(save).maxHp,energy:CLASSES[save.lastClass].maxEnergy,potions:2,gold:0,kills:0,bonusAtk:0,relics:[],map:[],path:[],enemy:null,choices:[],log:[],startedAt:Date.now(),poison:0,burn:0,focus:false};
 for(let i=0;i<9;i++){
  const types=i===0?['battle']:i===3||i===6?['relic']:i===8?['boss']:i===7?['rest','elite']:i===4?['elite','battle']:sample(r,['battle','treasure','event','shop','rest'],2);
  r.map.push(types);
 }
 save.run=r;log(r,'잔불의 성소에 발을 들였습니다.');return true;
}
export function enter(save,index){
 const r=save.run;if(!r||r.phase!=='map'||!Number.isInteger(index))return false;
 const row=r.map[r.depth+1];if(!row||!row[index])return false;
 r.depth++;r.path.push(index);r.room=row[index];r.loot=null;r.choices=[];
 if(['battle','elite','boss'].includes(r.room)){spawn(save,r.room==='boss'?'dragon':r.room==='elite'?pick(r,['chief','sentinel']):pick(r,['goblin','skeleton']),r.room);}
 else if(r.room==='relic'){r.phase='room';r.choices=sample(r,Object.keys(RELICS).filter(k=>!r.relics.includes(k)),3);}
 else if(r.room==='treasure'){r.phase='reward';const id=pick(r,['iron','fang','plate','star','seal','dusk']);grantItem(save,id);r.loot=id;r.gold+=12;log(r,'보물 발견 · 장비와 12 G');}
 else r.phase='room';
 return true;
}
export function next(save){const r=save.run;if(!r||r.phase!=='reward')return false;r.phase='map';r.enemy=null;return true;}
export function choose(save,id){
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
export function abandon(save){if(save.run&&save.run.phase!=='result')settle(save,false,'탐험에서 귀환했습니다.');}

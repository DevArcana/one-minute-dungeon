import {CLASSES,ENEMIES} from '../data/content.js';
import {stats,settle,grantItem} from './progression.js';
import {random,pick} from './random.js';
export function log(r,text){r.log.unshift(text);r.log=r.log.slice(0,30);}
export function skillCost(r){return Math.max(1,CLASSES[r.classKey].cost-(r.relics.includes('lens')?1:0));}
export function spawn(save,key,type){
 const r=save.run,e=ENEMIES[key],scale=1+r.difficulty*.18+(type==='boss'?0:r.depth*.055);
 r.enemy={key,type,hp:Math.round(e.hp*scale),maxHp:Math.round(e.hp*scale),atk:Math.round(e.atk*scale),def:e.def,turn:0,poison:0,burn:0,phase:1,first:true};
 r.phase='combat';r.energy=CLASSES[r.classKey].maxEnergy;r.poison=0;r.burn=0;r.focus=false;
 log(r,e.name+' 등장. 다음 행동을 확인하세요.');
}
export function intent(r){
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
export function act(save,action){
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

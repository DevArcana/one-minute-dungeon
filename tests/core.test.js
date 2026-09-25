import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASSES,ITEMS,RELICS} from '../src/data/content.js';
import {fresh,load,migrate,normalize,persist,SAVE_KEY,OLD_KEY,validRun} from '../src/systems/save.js';
import {start,enter,next,choose} from '../src/systems/dungeon.js';
import {act,intent,spawn,skillCost} from '../src/systems/combat.js';
import {stats,equip,grantItem,buyUpgrade,settle} from '../src/systems/progression.js';
class Memory {constructor(data={}){this.data={...data};}getItem(k){return this.data[k]??null;}setItem(k,v){this.data[k]=v;}}
test('fresh save and run, invalid actions have no effect',()=>{
 const s=fresh();assert.equal(start(s,41),true);assert.equal(validRun(s.run),true);const before=JSON.stringify(s);assert.equal(enter(s,7),false);assert.equal(act(s,'attack'),null);assert.equal(JSON.stringify(s),before);assert.equal(start(s,5),false);
 enter(s,0);const after=JSON.stringify(s);assert.equal(enter(s,0),false);assert.equal(JSON.stringify(s),after);assert.equal(validRun(s.run),true);
});
test('V1 migration preserves original data and compatible progress once',()=>{
 const old={totalGold:431,upgrades:{atk:2,hp:3,firstCrit:1},lastClass:'mage',playCount:12,clearCount:3,inventory:[{slot:'weapon',name:'old sword',grade:'전설'}],equipped:{weapon:{grade:'전설'}},bestiary:['rat'],achievements:['clear1'],pet:{key:'fox',level:9},killCounts:{rat:21},relicsSeen:['old']};
 const storage=new Memory({[OLD_KEY]:JSON.stringify(old),omd_run_v1:'{"room":5}'}),s=load(storage).save;
 assert.equal(s.totalGold,431);assert.equal(s.lastClass,'mage');assert.equal(s.equipped.weapon,'fang');assert.equal(s.upgrades.atk,2);assert.deepEqual(s.legacy.snapshot,old);assert.equal(s.run,null);
 persist(storage,s);assert.equal(load(storage).save.totalGold,431);assert.equal(storage.getItem(OLD_KEY),JSON.stringify(old));assert.equal(storage.getItem('omd_run_v1'),'{"room":5}');
});
test('corruption and unavailable storage never throw',()=>{
 for(const raw of ['broken','null','[]','{"version":2,"totalGold":"bad","upgrades":null,"inventory":[null,"__proto__"],"run":{}}']){
  const st=new Memory({[SAVE_KEY]:raw});const s=load(st).save;assert.equal(s.totalGold,0);assert.equal(s.run,null);assert.doesNotThrow(()=>start(s,1));
 }
 const denied={getItem(){throw Error('blocked');},setItem(){throw Error('quota');}};assert.equal(load(denied).readOnly,true);assert.equal(persist(denied,fresh()),false);
 const future=new Memory({[SAVE_KEY]:'{"version":99}'});assert.equal(load(future).readOnly,true);assert.equal(future.getItem(SAVE_KEY),'{"version":99}');
});
test('save/refresh preserves exact enemy HP, turn, RNG, route and reward; no double payment',()=>{
 const s=fresh();start(s,987);enter(s,0);act(s,'attack');const st=new Memory();persist(st,s);const restored=load(st).save;assert.deepEqual(restored,s);
 assert.deepEqual(act(restored,'skill'),act(s,'skill'));assert.deepEqual(restored,s);
 s.run.gold=85;settle(s,true);const gold=s.totalGold;persist(st,s);const end=load(st).save;settle(end,true);assert.equal(end.totalGold,gold);assert.equal(end.clearCount,1);assert.equal(end.run.phase,'result');
});
test('boss tells, phase change and defense counter flame',()=>{
 const s=fresh();start(s,18);s.run.depth=8;s.run.room='boss';s.run.path=s.run.map.map(()=>0);spawn(s,'dragon','boss');
 s.run.enemy.turn=2;assert.equal(intent(s.run).type,'inferno');
 const raw=intent(s.run).damage,hp=s.run.hp;act(s,'guard');assert.ok(hp-s.run.hp<raw*.3);assert.equal(s.run.burn,0);
 s.run.enemy.hp=100;act(s,'attack');assert.equal(s.run.enemy.phase,2);
});
test('classes have distinct skill effects and unavailable resources are rejected',()=>{
 for(const key of Object.keys(CLASSES)){
  const s=fresh();s.lastClass=key;start(s,12);enter(s,0);s.run.enemy.hp=s.run.enemy.maxHp=1000;const before=s.run.energy;act(s,'skill');
  assert.equal(s.run.energy,before-CLASSES[key].cost);
  if(key==='rogue')assert.ok(s.run.enemy.poison>0);if(key==='mage')assert.ok(s.run.enemy.burn>0);if(key==='warrior')assert.ok(s.run.hp>=stats(s,s.run).maxHp-6);
  s.run.energy=0;const raw=JSON.stringify(s);assert.equal(act(s,'skill'),null);assert.equal(JSON.stringify(s),raw);
 }
});
test('equipment stats, HP deltas, upgrades and duplicate loot are safe',()=>{
 const s=fresh();grantItem(s,'iron');grantItem(s,'iron');assert.equal(s.inventory.length,1);assert.equal(stats(s).atk,15);
 start(s,3);const hp=s.run.hp;grantItem(s,'dusk');equip(s,'dusk');equip(s,'dusk');assert.ok(s.run.hp<=stats(s,s.run).maxHp);assert.ok(s.run.hp>=hp);
 s.totalGold=1000;assert.equal(buyUpgrade(s,'atk'),false);s.run=null;assert.equal(buyUpgrade(s,'atk'),true);
 const before=s.totalGold;assert.equal(buyUpgrade(s,'unknown'),false);assert.equal(s.totalGold,before);
});
test('relic selection and all noncombat choices persist exactly once',()=>{
 const s=fresh();start(s,78);s.run.map[1]=['event'];enter(s,0);s.run.phase='reward';next(s);enter(s,0);const hp=s.run.hp;assert.equal(choose(s,'sacrifice'),true);assert.equal(s.run.hp,hp-18);assert.equal(choose(s,'sacrifice'),false);
 s.run.depth=2;s.run.path=[0,0,0];s.run.phase='map';enter(s,0);const id=s.run.choices[0];choose(s,id);assert.equal(s.run.relics.length,1);assert.equal(choose(s,id),false);assert.ok(s.relicsSeen.includes(id));
});
test('status damage can kill and results award only once',()=>{
 const s=fresh();start(s,12);enter(s,0);s.run.hp=1;s.run.enemy.hp=999;s.run.enemy.maxHp=999;s.run.enemy.turn=0;act(s,'attack');assert.equal(s.run.phase,'result');assert.equal(s.run.victory,false);
 const gold=s.totalGold;act(s,'attack');settle(s,false);assert.equal(s.totalGold,gold);
});
test('600 seeded runs terminate; all classes can clear; every checkpoint restores',()=>{
 const counts={};let turns=0;
 for(const key of Object.keys(CLASSES)){counts[key]={wins:0,losses:0,turns:0};
 for(let seed=1;seed<=200;seed++){
  let s=fresh();s.lastClass=key;start(s,seed*127);let steps=0;
  while(s.run.phase!=='result'&&steps++<300){
   const r=s.run;
   if(r.phase==='map'){const row=r.map[r.depth+1];const priority=['rest','treasure','battle','relic','boss','event','shop','elite'];enter(s,[...row.keys()].sort((a,b)=>priority.indexOf(row[a])-priority.indexOf(row[b]))[0]);}
   else if(r.phase==='combat'){
    const m=intent(r);let a=m.damage>=Math.round(r.enemy.atk*1.7)?'guard':r.hp<stats(s,r).maxHp*.45&&r.potions?'potion':r.energy>=skillCost(r)&&m.type!=='guard'?'skill':'attack';act(s,a);counts[key].turns++;
   }else if(r.phase==='reward')next(s);
   else if(r.room==='relic')choose(s,r.choices.includes('moon')?'moon':r.choices.includes('thorn')?'thorn':r.choices[0]);
   else choose(s,r.room==='rest'?'heal':'leave');
   assert.equal(validRun(s.run),true,'checkpoint '+key+' '+seed+' '+s.run.phase);
   const restored=normalize(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored,s);s=restored;
  }
  assert.ok(steps<300,'must terminate');counts[key][s.run.victory?'wins':'losses']++;
 }
 assert.ok(counts[key].wins>0,'class must be able to clear');turns+=counts[key].turns;
 }
 console.log('BALANCE '+JSON.stringify(counts)+' total combat turns='+turns);
});



test('backup failure preserves original save rather than overwriting it',()=>{
 const raw='{damaged';const st={getItem(k){return k===SAVE_KEY?raw:null;},setItem(){throw Error('full');}};
 const loaded=load(st);assert.equal(loaded.readOnly,true);assert.equal(st.getItem(SAVE_KEY),raw);assert.equal(loaded.save.totalGold,0);
});
test('shop affordability and repeat purchases do not duplicate equipment',()=>{
 const s=fresh();start(s,8);enter(s,0);s.run.phase='reward';next(s);s.run.map[1]=['shop'];enter(s,0);
 const before=JSON.stringify(s);assert.equal(choose(s,'dusk'),false);assert.equal(JSON.stringify(s),before);
 s.run.gold=100;assert.equal(choose(s,'dusk'),true);assert.equal(s.run.gold,55);assert.equal(s.equipped.armor,'dusk');
 assert.equal(choose(s,'dusk'),false);assert.equal(s.run.gold,55);assert.equal(choose(s,'potion'),true);assert.equal(s.run.gold,30);assert.equal(s.run.potions,3);
});

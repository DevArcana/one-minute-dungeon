import {fresh} from '../src/systems/save.js';
import {start,enter,next,choose} from '../src/systems/dungeon.js';
import {act,intent,skillCost} from '../src/systems/combat.js';
import {stats,upgradeCost} from '../src/systems/progression.js';
import {CLASSES} from '../src/data/content.js';

export const PROFILES=[
 {id:'new',name:'초기',levels:[0,0,0,0,0,0],gear:[]},
 {id:'early',name:'초반 성장',levels:[2,2,1,1,0,0],gear:['iron','plate']},
 {id:'mid',name:'중반 성장',levels:[5,5,3,4,2,1],gear:['fang','dusk','seal']},
 {id:'late',name:'후반 성장',levels:[10,10,6,10,5,1],gear:['star','dusk','crown']},
 {id:'max',name:'최대 성장',levels:[15,15,8,15,10,1],gear:['star','dusk','crown']}
];
const upgradeKeys=['atk','hp','def','luck','gold','firstCrit'];
export function profileSave(profile,classKey,difficulty,gear=true){
 const s=fresh();s.lastClass=classKey;s.difficulty=difficulty;
 upgradeKeys.forEach((k,i)=>s.upgrades[k]=profile.levels[i]);
 if(gear){s.inventory=[...profile.gear];s.equipped={weapon:profile.gear[0]??null,armor:profile.gear[1]??null,ring:profile.gear[2]??null};}
 return s;
}
export function profileCost(profile){
 const s=fresh();let cost=0;upgradeKeys.forEach((k,i)=>{for(let n=0;n<profile.levels[i];n++){cost+=upgradeCost(s,k);s.upgrades[k]++;}});return cost;
}
export function simulate(profile,classKey,difficulty,policy,seed,{gear=true,route='safe'}={}){
 const s=profileSave(profile,classKey,difficulty,gear);start(s,seed*127);let steps=0,turns=0,potions=0;
 const actions={attack:0,skill:0,guard:0,potion:0};
 while(s.run.phase!=='result'&&steps++<300){
  const r=s.run;
  if(r.phase==='map'){
   const priorities=route==='elite'?['elite','battle','treasure','rest','relic','boss','event','shop']:['rest','treasure','battle','relic','boss','event','shop','elite'];
   enter(s,r.map[r.depth+1].map((x,i)=>({x,i})).sort((a,b)=>priorities.indexOf(a.x)-priorities.indexOf(b.x))[0].i);
  }else if(r.phase==='reward')next(s);
  else if(r.phase==='room')choose(s,r.room==='relic'?(r.choices.includes('moon')?'moon':r.choices[0]):r.room==='rest'?'heal':'leave');
  else{
   const m=intent(r);let action=r.hp<stats(s,r).maxHp*.4&&r.potions?'potion':'attack';
   if(policy==='tactical'){if(m.type==='heavy'||m.type==='inferno')action='guard';else if(action==='attack'&&r.energy>=skillCost(r)&&m.type!=='guard')action='skill';}
   if(!act(s,action))throw Error('Rejected simulation action');
   actions[action]++;turns++;if(action==='potion')potions++;
  }
 }
 if(s.run.phase!=='result')throw Error('Simulation did not terminate');
 return {win:s.run.victory,turns,potions,hpRatio:s.run.hp/stats(s,s.run).maxHp,depth:s.run.depth+1,actions};
}
export function matrix({samples=200,seedStart=1,gear=true,route='safe'}={}){
 const rows=[];
 for(const profile of PROFILES)for(const difficulty of [0,1,2,3])for(const policy of ['attack','tactical'])for(const classKey of Object.keys(CLASSES)){
  let wins=0,turns=0,winTurns=0,hp=0,potions=0,deathDepth=0;const actions={attack:0,skill:0,guard:0,potion:0};
  for(let i=0;i<samples;i++){
   const r=simulate(profile,classKey,difficulty,policy,seedStart+i,{gear,route});
   turns+=r.turns;potions+=r.potions;for(const k of Object.keys(actions))actions[k]+=r.actions[k];
   if(r.win){wins++;winTurns+=r.turns;hp+=r.hpRatio;}else deathDepth+=r.depth;
  }
  const round=n=>Math.round(n*100)/100;
  rows.push({profile:profile.id,difficulty,policy,classKey,wins,samples,winRate:round(wins/samples*100),avgTurns:round(turns/samples),winTurns:wins?round(winTurns/wins):null,winHpPercent:wins?round(hp/wins*100):null,avgPotions:round(potions/samples),deathDepth:wins<samples?round(deathDepth/(samples-wins)):null,actions});
 }
 return {balance:structuredClone(CLASSES),samples,seedStart,gear,route,totalRuns:rows.length*samples,profiles:PROFILES.map(p=>({...p,upgradeGold:profileCost(p),upgrades:Object.fromEntries(upgradeKeys.map((k,i)=>[k,p.levels[i]]))})),rows};
}

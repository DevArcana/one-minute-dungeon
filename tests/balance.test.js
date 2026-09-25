import test from 'node:test';
import assert from 'node:assert/strict';
import {PROFILES,simulate} from '../tools/balance-sim.js';
const classes=['warrior','rogue','mage'];
function rate(profile,key,difficulty,policy='tactical',route='safe',samples=200,seedStart=1001){
 let wins=0;for(let n=0;n<samples;n++)wins+=Number(simulate(profile,key,difficulty,policy,seedStart+n,{route}).win);
 return wins/samples;
}
test('growth preserves baseline clearability and all classes benefit across five stages',()=>{
 for(const key of classes)for(const difficulty of [0,1,2,3]){
  let previous=0;
  for(const profile of PROFILES){
   const win=rate(profile,key,difficulty,'tactical','safe',64,2001);
   assert.ok(win>=previous-.1,key+' growth regression at '+profile.id+' D'+difficulty);
   if(difficulty===0||profile.id==='max')assert.ok(win>=.95,key+' must reliably clear '+profile.id+' D'+difficulty);
   previous=win;
  }
 }
});
test('early safe and mid elite routes keep class clear rates close on holdout seeds',()=>{
 for(const [profile,route] of [[PROFILES[1],'safe'],[PROFILES[2],'elite']]){
  const rates=classes.map(key=>rate(profile,key,3,'tactical',route));
  assert.ok(Math.min(...rates)>=.9,'all classes should clear '+profile.id+' '+route);
  assert.ok(Math.max(...rates)-Math.min(...rates)<=.1,'class spread exceeds 10 percentage points');
 }
});
test('early high difficulty still rewards guarding and class skills over attack spam',()=>{
 for(const key of classes){
  const tactical=rate(PROFILES[1],key,3,'tactical','safe',100);
  const attack=rate(PROFILES[1],key,3,'attack','safe',100);
  assert.ok(tactical-attack>=.7,key+' must reward tactical actions');
 }
});

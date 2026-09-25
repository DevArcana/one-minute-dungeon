import {CLASSES,ITEMS,UPGRADES,ACHIEVEMENTS} from '../data/content.js';
export function item(id){return ITEMS[id]||null;}
export function stats(save,run=null){
 const c=CLASSES[run?.classKey||save.lastClass],u=save.upgrades;
 const s={maxHp:c.hp+u.hp*6,atk:c.atk+u.atk,def:c.def+u.def,crit:c.crit+u.luck*.01,gold:1+u.gold*.05};
 for(const id of Object.values(save.equipped)){const e=item(id);if(!e)continue;s.maxHp+=e.hp||0;s.atk+=e.atk||0;s.def+=e.def||0;s.crit+=(e.crit||0)/100;s.gold+=(e.gold||0)/100;}
 if(run){s.atk+=run.bonusAtk||0;}
 s.crit=Math.min(.65,s.crit);return s;
}
export function upgradeCost(save,key){return Math.round(UPGRADES[key].base*Math.pow(1.45,save.upgrades[key]));}
export function buyUpgrade(save,key){const d=UPGRADES[key];if(!d||save.run||save.upgrades[key]>=d.max)return false;const cost=upgradeCost(save,key);if(save.totalGold<cost)return false;save.totalGold-=cost;save.upgrades[key]++;return true;}
export function equip(save,id){const e=item(id);if(!e||!save.inventory.includes(id))return false;const before=stats(save,save.run).maxHp;save.equipped[e.slot]=save.equipped[e.slot]===id?null:id;if(save.run){const after=stats(save,save.run).maxHp;save.run.hp=Math.max(1,Math.min(after,save.run.hp+after-before));}return true;}
export function grantItem(save,id){if(!ITEMS[id])return; if(!save.inventory.includes(id))save.inventory.push(id);if(!save.equipped[ITEMS[id].slot])save.equipped[ITEMS[id].slot]=id;}
export function settle(save,victory,reason=''){
 const r=save.run;if(!r||r.phase==='result')return;
 r.phase='result';r.victory=victory;r.reason=reason;r.earned=r.gold+(victory?90:15);r.elapsed=Math.max(0,Math.floor((Date.now()-r.startedAt)/1000));
 save.totalGold+=r.earned;save.playCount++;save.bestFloor=Math.max(save.bestFloor,r.depth+1);
 if(victory){save.clearCount++;grantItem(save,'crown');save.bestClearTime=save.bestClearTime===null?r.elapsed:Math.min(save.bestClearTime,r.elapsed);}
 r.newAchievements=[];
 for(const a of ACHIEVEMENTS)if(!save.achievements.includes(a.id)&&a.test(save)){save.achievements.push(a.id);r.newAchievements.push(a.name);}
}

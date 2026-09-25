import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {fresh,SAVE_KEY} from '../../src/systems/save.js';
import {start,enter,choose} from '../../src/systems/dungeon.js';
import {fileURLToPath} from 'node:url';
const state=page=>page.evaluate(async()=>{const read=()=>JSON.parse(localStorage.getItem('omd_save_v2'));return navigator.locks? navigator.locks.request('omd_save_v2',read):read();});
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();});
test('desktop art, class selection, modal focus, combat and exact reload',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await expect(page.getByRole('button',{name:/던전 입장/})).toBeVisible();
 await page.locator('[data-action="class"][data-value="rogue"]').click();
 await expect(page.locator('.class-card.selected')).toContainText('도적');
 await page.getByRole('button',{name:'장비',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.locator('[data-action="class"][data-value="warrior"]').click();
 await page.evaluate(()=>Promise.all(Array.from(document.images).map(img=>img.decode().catch(()=>{}))));
 await mkdir('test-results/screenshots',{recursive:true});
 await page.screenshot({path:'test-results/screenshots/title-desktop.png',fullPage:true});
 await page.getByRole('button',{name:/던전 입장/}).click();
 await page.locator('.game-center .node.available').first().click();
 await page.keyboard.press('1');
 await page.waitForTimeout(400);
 const before=await state(page);await page.reload();
 await page.getByRole('button',{name:/탐험 이어하기/}).click();
 const after=await state(page);expect(after.run).toEqual(before.run);
 await page.screenshot({path:'test-results/screenshots/combat-desktop.png',fullPage:true});
 expect(errors).toEqual([]);
 expect(await page.locator('img').evaluateAll(imgs=>imgs.every(x=>x.complete&&x.naturalWidth>0))).toBe(true);
});
test('mobile portrait, landscape, tablet, reduced motion and art failure',async({page})=>{
 await mkdir('test-results/screenshots',{recursive:true});
 for(const [name,width,height] of [['mobile',390,844],['small',320,640],['landscape',844,390],['tablet',820,1180]]){
  await page.setViewportSize({width,height});await page.reload();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/screenshots/title-'+name+'.png',fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:/던전 입장/}).click();await page.locator('.game-center .node.available').first().click();
 await expect(page.locator('.combat-actions')).toBeVisible();
 expect(await page.locator('.combat-actions button').evaluateAll(bs=>bs.every(b=>b.getBoundingClientRect().height>=48))).toBe(true);
 await page.screenshot({path:'test-results/screenshots/combat-mobile.png',fullPage:true});
 await page.route('**/assets/**',route=>route.abort());await page.reload();await page.getByRole('button',{name:/탐험 이어하기/}).click();
 await expect(page.locator('.game-center .art-fallback').first()).toBeVisible();await page.keyboard.press('1');
 expect((await state(page)).run.enemy.turn).toBe(1);
});
test('real UI full run, rewards, equipment, relic, boss, result and refresh',async({page})=>{
 const s=fresh();start(s,127);await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:SAVE_KEY,s});await page.reload();
 await page.getByRole('button',{name:/탐험 이어하기/}).click();let step=0;
 while(step++<150){
  const s=await state(page),r=s.run;if(r.phase==='result')break;
  if(r.phase==='map'){
   const order=['rest','treasure','battle','relic','boss','event','shop','elite'],row=r.map[r.depth+1];
   const index=row.map((x,i)=>({x,i})).sort((a,b)=>order.indexOf(a.x)-order.indexOf(b.x))[0].i;
   await page.locator('.game-center .node.available[data-value="'+index+'"]').click();
  }else if(r.phase==='reward'){await page.locator('[data-action="next"]').click();}
  else if(r.phase==='room'){
   const id=r.room==='relic'?(r.choices.includes('moon')?'moon':r.choices[0]):r.room==='rest'?'heal':'leave';
   await page.locator('[data-action="choose"][data-value="'+id+'"]').click();
  }else{
   const tell=await page.locator('.intent b').textContent();const skill=page.locator('[data-action="act"][data-value="skill"]'),potion=page.locator('[data-action="act"][data-value="potion"]');
   await page.waitForTimeout(360);
   let action=/강타|화염 폭풍/.test(tell)?'guard':r.hp<50&&await potion.isEnabled()?'potion':await skill.isEnabled()&&!tell.includes('방패')?'skill':'attack';
   await page.locator('[data-action="act"][data-value="'+action+'"]').click();
  }
 }
 const end=await state(page);expect(step).toBeLessThan(150);expect(end.run.victory).toBe(true);expect(end.run.relics).toHaveLength(2);expect(end.inventory).toContain('crown');
 await page.waitForTimeout(400);await page.screenshot({path:'test-results/screenshots/result-desktop.png',fullPage:true});
 await page.reload();await expect(page.locator('.result-screen')).toBeVisible();expect((await state(page)).totalGold).toBe(end.totalGold);
 await page.getByRole('button',{name:'성장하고 준비하기'}).click();await page.getByRole('button',{name:'영구 성장',exact:true}).click();await page.locator('[data-action="upgrade"][data-value="hp"]').click();expect((await state(page)).upgrades.hp).toBe(1);
});
test('browser V1 migration and damaged save recovery',async({page})=>{
 await page.evaluate(()=>{localStorage.clear();localStorage.setItem('omd_save_v1',JSON.stringify({totalGold:555,lastClass:'mage',pet:{key:'fox'}}));});await page.reload();
 const migrated=await state(page);expect(migrated.totalGold).toBe(555);expect(migrated.legacy.snapshot.pet.key).toBe('fox');
 await page.evaluate(()=>localStorage.setItem('omd_save_v2','{broken'));await page.reload();expect((await state(page)).totalGold).toBe(0);await expect(page.locator('.notice')).toContainText('손상');
 expect(await page.evaluate(()=>localStorage.getItem('omd_save_v2_recovery'))).toBe('{broken');
});
test('static file launch without server or modules',async({page})=>{
 await page.goto(fileURLToPath(new URL('../../index.html',import.meta.url)));
 await expect(page.getByRole('button',{name:/던전 입장|탐험 이어하기/})).toBeVisible();
});



test('shop and equipment controls, boss presentation, defeat result',async({page})=>{
 const s=fresh();start(s,819);enter(s,0);s.run.phase='reward';s.run.depth=1;s.run.path=[0,0];s.run.map[1]=['shop'];s.run.room='shop';s.run.phase='room';s.run.gold=100;
 await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:SAVE_KEY,s});await page.reload();await page.getByRole('button',{name:/탐험 이어하기/}).click();
 await page.locator('[data-action="choose"][data-value="potion"]').click();await page.locator('[data-action="choose"][data-value="dusk"]').click();
 expect((await state(page)).run.gold).toBe(30);await page.locator('.equip-slot').first().click();
 await page.locator('[data-action="equip"][data-value="dusk"]').click();expect((await state(page)).equipped.armor).toBe(null);
 await page.locator('[data-action="equip"][data-value="dusk"]').click();expect((await state(page)).equipped.armor).toBe('dusk');await page.keyboard.press('Escape');
 await page.screenshot({path:'test-results/screenshots/shop-desktop.png',fullPage:true});
 const boss=fresh();start(boss,22);boss.run.depth=7;boss.run.path=boss.run.map.slice(0,8).map(()=>0);boss.run.room=boss.run.map[7][0];enter(boss,0);
 await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:SAVE_KEY,s:boss});await page.reload();await page.getByRole('button',{name:/탐험 이어하기/}).click();
 await expect(page.locator('.boss-arena')).toBeVisible();await page.screenshot({path:'test-results/screenshots/boss-desktop.png',fullPage:true});
 boss.run.hp=1;await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:SAVE_KEY,s:boss});await page.reload();await page.getByRole('button',{name:/탐험 이어하기/}).click();
 await page.keyboard.press('1');await expect(page.locator('.result-screen')).toBeVisible();expect((await state(page)).run.victory).toBe(false);
});

test('combat effects show class skills, healing and incoming damage with cleanup',async({page})=>{
 for(const classKey of ['warrior','rogue','mage']){
  const s=fresh();s.lastClass=classKey;start(s,127);enter(s,0);s.run.enemy.hp=999;s.run.enemy.maxHp=999;s.run.hp=40;
  await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:SAVE_KEY,s});await page.reload();await page.getByRole('button',{name:/탐험 이어하기/}).click();
  await page.locator('[data-action="act"][data-value="skill"]').click();
  await expect(page.locator('.fx-'+({warrior:'cleave',rogue:'venom',mage:'arcane'}[classKey]))).toHaveCount(1);
  await page.locator('.arena').evaluate(el=>el.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=180;}));
  await page.screenshot({path:'test-results/screenshots/effect-'+classKey+'.png'});
  await page.locator('.arena').evaluate(el=>el.getAnimations({subtree:true}).forEach(a=>a.play()));
  await expect(page.locator('.combat-fx')).toHaveCount(0);
 }
 const s=fresh();start(s,127);enter(s,0);s.run.hp=40;
 await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:SAVE_KEY,s});await page.reload();await page.getByRole('button',{name:/탐험 이어하기/}).click();
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('[data-action="act"][data-value="potion"]').click();
 await expect(page.locator('.damage-number.healing')).toBeVisible();await expect(page.locator('.damage-number.incoming')).toBeVisible();
 await expect(page.locator('.combat-fx')).toHaveCount(0);
 await expect(page.locator('.damage-number')).toHaveCount(0);
});

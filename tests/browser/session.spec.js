import {test,expect} from '@playwright/test';
import {fresh,SAVE_KEY} from '../../src/systems/save.js';
import {start,enter} from '../../src/systems/dungeon.js';
const stored=page=>page.evaluate(async key=>{const read=()=>localStorage.getItem(key);return navigator.locks?navigator.locks.request(key,read):read();},SAVE_KEY);
const latest=page=>page.getByRole('button',{name:'최신 기록 불러오기',exact:true});
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();});
test('another tab freezes combat and pending import, preserves backup, and reload resumes exact state',async({page,context})=>{
 const initial=fresh();start(initial,127);enter(initial,0);
 await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:SAVE_KEY,value:initial});await page.reload();
 const other=await context.newPage();await other.goto('/');
 await page.getByRole('button',{name:/탐험 이어하기/}).click();await other.getByRole('button',{name:/탐험 이어하기/}).click();
 await other.getByRole('button',{name:'도움말',exact:true}).click();
 await other.locator('#save-import').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fresh()))});
 await expect(other.getByRole('button',{name:'이 백업으로 복원',exact:true})).toBeVisible();
 await page.keyboard.press('1');const changed=await stored(page);
 await expect(latest(other)).toBeVisible();await expect(other.getByRole('dialog')).not.toBeVisible();
 await expect(other.locator('[data-action="act"][data-value="attack"]')).toBeDisabled();
 await other.keyboard.press('1');expect(await stored(other)).toBe(changed);
 const download=other.waitForEvent('download');await other.getByRole('button',{name:'현재 탭 기록 백업',exact:true}).click();
 expect((await download).suggestedFilename()).toBe('dungeon-re-save.json');
 await latest(other).click();await other.getByRole('button',{name:/탐험 이어하기/}).click();
 expect(await stored(other)).toBe(changed);await expect(latest(other)).toHaveCount(0);
 await other.keyboard.press('3');await expect(latest(page)).toBeVisible();
});
test('simultaneous mutations under a held lock admit only one stale baseline',async({page,context})=>{
 const other=await context.newPage();await other.goto('/');
 await expect(other.locator('[data-action="class"][data-value="mage"]')).toBeVisible();
 await page.evaluate(()=>{window.lockHeld=false;navigator.locks.request('omd_save_v2',()=>new Promise(resolve=>{window.releaseSaveLock=resolve;window.lockHeld=true;}));});
 await expect.poll(()=>page.evaluate(()=>window.lockHeld)).toBe(true);
 await Promise.all([
  page.locator('[data-action="class"][data-value="rogue"]').evaluate(el=>el.click()),
  other.locator('[data-action="class"][data-value="mage"]').evaluate(el=>el.click())
 ]);
 await page.evaluate(()=>window.releaseSaveLock());
 await expect.poll(async()=>Number(await latest(page).count())+Number(await latest(other).count())).toBe(1);
 const result=JSON.parse(await stored(page));expect(['rogue','mage']).toContain(result.lastClass);
 const stalePage=await latest(page).count()?page:other;
 await stalePage.locator('[data-action="sound"]').evaluate(el=>el.click());
 expect(JSON.parse(await stored(page))).toEqual(result);
});
test('missing storage events still block stale action; removal and clear cannot resurrect progress',async({page,context})=>{
 const other=await context.newPage();
 await other.addInitScript(()=>{for(const type of ['storage','focus','pageshow'])window.addEventListener(type,e=>e.stopImmediatePropagation());document.addEventListener('visibilitychange',e=>e.stopImmediatePropagation());});
 await other.goto('/');
 await page.locator('[data-action="class"][data-value="rogue"]').click();const changed=await stored(page);
 await other.locator('[data-action="class"][data-value="mage"]').click();
 await expect(latest(other)).toBeVisible();expect(await stored(page)).toBe(changed);
 await latest(other).click();await expect(other.locator('.class-card.selected')).toContainText('도적');
 await page.evaluate(key=>localStorage.removeItem(key),SAVE_KEY);
 await other.locator('[data-action="sound"]').click();await expect(latest(other)).toBeVisible();expect(await stored(other)).toBe(null);
 await latest(other).click();await expect(other.getByRole('button',{name:/던전 입장/})).toBeVisible();
 await page.evaluate(()=>localStorage.clear());
 await other.getByRole('button',{name:/던전 입장/}).click();await expect(latest(other)).toBeVisible();expect(await stored(other)).toBe(null);
});
test('fallback without Web Locks detects remote changes and narrow conflict controls fit',async({page,context})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined,configurable:true}));await page.reload();
 await page.setViewportSize({width:320,height:640});
 const other=await context.newPage();await other.goto('/');await other.locator('[data-action="class"][data-value="mage"]').click();
 await expect(latest(page)).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/screenshots/save-conflict-mobile.png',fullPage:true});
 await latest(page).click();await expect(page.locator('.class-card.selected')).toContainText('마법사');
});

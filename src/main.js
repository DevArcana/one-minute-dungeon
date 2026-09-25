import {createSaveSession} from './systems/session.js';
import {SAVE_KEY} from './systems/save.js';
import {CLASSES} from './data/content.js';
import {load,persist,parseImport,restoreImport,IMPORT_BACKUP_KEY,MAX_IMPORT_BYTES} from './systems/save.js';
import {start,enter,next,choose,abandon} from './systems/dungeon.js';
import {act,skillCost} from './systems/combat.js';
import {buyUpgrade,equip,stats} from './systems/progression.js';
import {sound} from './systems/audio.js';
import {combatFeedback} from './ui/effects.js';
import {header,title,game,modalContent,esc,btn} from './ui/screens.js';
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

import {SAVE_KEY} from './save.js';

// All cooperating tabs use the same exclusive lock for read/check/change/write.
// Without Web Locks, comparison still catches stale saves, but is not atomic.
export function createSaveSession(storage,locks){
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

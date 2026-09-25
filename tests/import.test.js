import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,parseImport,restoreImport,SAVE_KEY,IMPORT_BACKUP_KEY,MAX_IMPORT_BYTES} from '../src/systems/save.js';
import {start,enter} from '../src/systems/dungeon.js';
import {act} from '../src/systems/combat.js';
const memory=raw=>({data:{[SAVE_KEY]:raw},getItem(k){return this.data[k]??null;},setItem(k,v){this.data[k]=v;}});
test('backup import preserves combat and accepts reordered fields and BOM',()=>{
 const original=fresh();original.totalGold=987;start(original,127);enter(original,0);act(original,'attack');
 const reordered=Object.fromEntries(Object.entries(original).reverse());
 const parsed=parseImport('\uFEFF'+JSON.stringify(reordered));assert.deepEqual(parsed,original);
 const current=fresh(),raw=JSON.stringify(current),storage=memory(raw);
 assert.deepEqual(restoreImport(storage,parsed,current),original);
 assert.equal(storage.getItem(IMPORT_BACKUP_KEY),raw);
 assert.deepEqual(JSON.parse(storage.getItem(SAVE_KEY)),original);
 assert.deepEqual(current,fresh());
 assert.deepEqual(act(parsed,'guard'),act(original,'guard'));
});
test('invalid, incomplete, future and oversized imports are rejected without writes',()=>{
 const damaged=fresh();start(damaged,42);damaged.run.hp=-1;
 const samples=['{bad','null','[]','{"version":99}','{"version":2}',JSON.stringify({...fresh(),totalGold:-1}),JSON.stringify(damaged),' '.repeat(MAX_IMPORT_BYTES+1)];
 for(const raw of samples)assert.throws(()=>parseImport(raw));
 const storage=memory('original');assert.throws(()=>restoreImport(storage,damaged,fresh()));assert.deepEqual(storage.data,{[SAVE_KEY]:'original'});
});
test('read-only, backup failure and final write failure preserve active save',()=>{
 for(const failKey of [IMPORT_BACKUP_KEY,SAVE_KEY]){
  const storage=memory('original');
  storage.setItem=function(k,v){if(k===failKey)throw Error('quota');this.data[k]=v;};
  assert.throws(()=>restoreImport(storage,fresh(),fresh()));
  assert.equal(storage.getItem(SAVE_KEY),'original');
  if(failKey===SAVE_KEY)assert.equal(storage.getItem(IMPORT_BACKUP_KEY),'original');
 }
 const storage=memory('{"version":99}');
 assert.throws(()=>restoreImport(storage,fresh(),fresh(),{readOnly:true}));
 assert.deepEqual(storage.data,{[SAVE_KEY]:'{"version":99}'});
});

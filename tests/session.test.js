import test from 'node:test';
import assert from 'node:assert/strict';
import {createSaveSession} from '../src/systems/session.js';
import {SAVE_KEY} from '../src/systems/save.js';
test('sessions detect changed, removed and cleared records without accepting them',()=>{
 const storage={raw:'first',getItem(key){assert.equal(key,SAVE_KEY);return this.raw;}};
 const a=createSaveSession(storage),b=createSaveSession(storage);a.capture();b.capture();
 storage.raw='second';a.remember('second');assert.equal(a.isCurrent(),true);assert.equal(b.isCurrent(),false);
 assert.equal(b.isCurrent(),false);b.capture();assert.equal(b.isCurrent(),true);
 storage.raw=null;assert.equal(a.isCurrent(),false);assert.equal(b.isCurrent(),false);
});
test('failed reads preserve checkpoint and a rejected operation does not poison queue',async()=>{
 let denied=false;const storage={getItem(){if(denied)throw Error('blocked');return 'save';}};
 const session=createSaveSession(storage);session.capture();denied=true;assert.throws(()=>session.isCurrent());
 denied=false;assert.equal(session.isCurrent(),true);
 await assert.rejects(session.run(()=>{throw Error('failed');}));
 assert.equal(await session.run(()=>42),42);
});

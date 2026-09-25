import {readFile,mkdir,writeFile} from 'node:fs/promises';
const modules=['data/content','systems/random','systems/progression','systems/combat','systems/dungeon','systems/save','systems/session','systems/audio','ui/screens','ui/effects','main'];
const sources=await Promise.all(modules.map(name=>readFile('src/'+name+'.js','utf8')));
const bundled=sources.map((s,i)=>'// '+modules[i]+'\n'+s.trimStart().replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'')).join('\n');
await mkdir('dist',{recursive:true});
await writeFile('dist/game.js',"'use strict';\n(()=>{\n"+bundled+"\n})();\n");
console.log('Built dist/game.js: '+Buffer.byteLength(bundled)+' bytes');

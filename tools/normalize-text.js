import {readFile,writeFile,readdir} from 'node:fs/promises';
const files=['README.md','PROJECT_HANDOFF.md','index.html','style.css','package.json','package-lock.json','playwright.config.js','.gitignore'];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())await walk(p);else if(/\.(js|md|ps1)$/.test(p))files.push(p);}}
for(const dir of ['src','docs','tests','tools','dist'])await walk(dir);
for(const file of files){const source=await readFile(file,'utf8');const normalized=source.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').split('\n').map(line=>line.replace(/[\t ]+$/,'')).join('\n').trimEnd()+'\n';if(source!==normalized)await writeFile(file,normalized);}
console.log('Normalized '+files.length+' text files.');

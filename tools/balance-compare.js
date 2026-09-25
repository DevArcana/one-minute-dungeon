import {readFile,writeFile} from 'node:fs/promises';
import {CLASSES} from '../src/data/content.js';
import {matrix} from './balance-sim.js';
const before=JSON.parse(await readFile('docs/balance-before.json','utf8')).balance;
const after=structuredClone(CLASSES),report={seedStart:1001,samples:200,results:[]};
try{
 for(const route of ['safe','elite'])for(const [label,values] of [['before',before],['after',after]]){
  for(const key of Object.keys(CLASSES))Object.assign(CLASSES[key],values[key]);
  const result=matrix({seedStart:report.seedStart,samples:report.samples,route});
  report.results.push({label,...result});
  console.log(label+' '+route+': '+result.totalRuns+' runs');
 }
}finally{for(const key of Object.keys(CLASSES))Object.assign(CLASSES[key],after[key]);}
await writeFile('docs/balance-validation.json',JSON.stringify(report,null,2)+'\n');

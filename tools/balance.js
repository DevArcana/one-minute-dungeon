import {writeFile} from 'node:fs/promises';
import {matrix} from './balance-sim.js';
const args=process.argv.slice(2),get=(name,fallback)=>args.find(x=>x.startsWith('--'+name+'='))?.split('=').slice(1).join('=')??fallback;
const samples=Number(get('samples',200)),seedStart=Number(get('seed-start',1)),route=get('route','safe');
if(!Number.isInteger(samples)||samples<1||samples>10000||!Number.isInteger(seedStart)||seedStart<1||seedStart+samples>10000000||!['safe','elite'].includes(route))throw Error('Invalid simulation arguments');
const result=matrix({samples,seedStart,route,gear:get('gear','all')!=='none'});
const output=get('output','');if(output)await writeFile(output,JSON.stringify(result,null,2)+'\n');
for(const profile of result.profiles){
 console.log(profile.id+' (upgrade gold '+profile.upgradeGold+')');
 for(const difficulty of [0,1,2,3])console.log('  D'+difficulty+' '+['attack','tactical'].map(policy=>policy+': '+result.rows.filter(r=>r.profile===profile.id&&r.difficulty===difficulty&&r.policy===policy).map(r=>r.classKey+' '+r.winRate+'% / '+r.avgTurns+'t').join(', ')).join(' | '));
}
console.log(result.totalRuns+' runs; seeds '+seedStart+'..'+(seedStart+samples-1)+'; gear='+result.gear+'; route='+route);

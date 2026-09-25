// A saved seed makes refreshes deterministic, including loot and critical hits.
export function random(run) { let x=run.seed|0; x^=x<<13; x^=x>>>17; x^=x<<5; run.seed=x>>>0; return run.seed/4294967296; }
export function pick(run,list){return list[Math.floor(random(run)*list.length)];}
export function sample(run,list,count){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random(run)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,count);}

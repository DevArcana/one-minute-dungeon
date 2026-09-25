import {CLASSES,ITEMS,ENEMIES,ROOMS,RELICS,UPGRADES} from '../data/content.js';
export const SAVE_KEY='omd_save_v2',OLD_KEY='omd_save_v1';
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const num=(v,max=1e9)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
const list=v=>Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string').map(x=>x.slice(0,200)))]:[];
const owns=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k);
export function fresh(){return {version:2,totalGold:0,playCount:0,clearCount:0,bestFloor:0,bestClearTime:null,lastClass:'warrior',difficulty:0,upgrades:Object.fromEntries(Object.keys(UPGRADES).map(k=>[k,0])),inventory:[],equipped:{weapon:null,armor:null,ring:null},bestiary:[],achievements:[],killCounts:{},relicsSeen:[],settings:{sound:true},legacy:null,run:null};}
export function normalize(v){
 const s=fresh();if(!obj(v))return s;
 for(const k of ['totalGold','playCount','clearCount','bestFloor'])s[k]=num(v[k]);
 s.bestClearTime=typeof v.bestClearTime==='number'&&Number.isFinite(v.bestClearTime)&&v.bestClearTime>=0?num(v.bestClearTime):null;
 if(owns(CLASSES,v.lastClass))s.lastClass=v.lastClass;s.difficulty=num(v.difficulty,3);
 for(const k of Object.keys(UPGRADES))s.upgrades[k]=num(v.upgrades?.[k],UPGRADES[k].max);
 s.inventory=list(v.inventory).filter(k=>owns(ITEMS,k));
 for(const k of ['weapon','armor','ring'])if(s.inventory.includes(v.equipped?.[k])&&ITEMS[v.equipped[k]].slot===k)s.equipped[k]=v.equipped[k];
 for(const k of ['bestiary','achievements','relicsSeen'])s[k]=list(v[k]);
 if(obj(v.killCounts))for(const [k,n] of Object.entries(v.killCounts))if(/^[a-z0-9_]+$/.test(k)&&k!=='__proto__')s.killCounts[k]=num(n);
 s.settings.sound=v.settings?.sound!==false;s.legacy=obj(v.legacy)?v.legacy:null;
 s.run=validRun(v.run)?structuredClone(v.run):null;return s;
}
export function validRun(r){
 if(!obj(r)||!owns(CLASSES,r.classKey)||!['map','room','combat','reward','result'].includes(r.phase))return false;
 const range=(k,a,b)=>Number.isInteger(r[k])&&r[k]>=a&&r[k]<=b;
 if(!range('depth',-1,8)||!range('seed',1,4294967295)||!range('hp',0,10000)||!range('energy',0,CLASSES[r.classKey].maxEnergy)||!range('potions',0,1000)||!range('gold',0,1e7)||!range('kills',0,50)||!range('bonusAtk',0,1000)||!range('difficulty',0,3))return false;
 if(!Number.isFinite(r.startedAt)||r.startedAt<0||typeof r.focus!=='boolean')return false;
 for(const k of ['poison','burn'])if(!range(k,0,10))return false;
 if(!Array.isArray(r.map)||r.map.length!==9||!r.map.every(row=>Array.isArray(row)&&row.length>=1&&row.length<=2&&row.every(k=>owns(ROOMS,k))))return false;
 if(r.map[0].join()!=='battle'||r.map[3].join()!=='relic'||r.map[6].join()!=='relic'||r.map[8].join()!=='boss')return false;
 if(!Array.isArray(r.path)||r.path.length!==r.depth+1||!r.path.every((x,i)=>Number.isInteger(x)&&x>=0&&x<r.map[i].length))return false;
 if(r.depth>=0&&r.room!==r.map[r.depth][r.path[r.depth]])return false;
 if(r.phase==='map'&&r.depth>=8)return false;
 if(!Array.isArray(r.relics)||new Set(r.relics).size!==r.relics.length||!r.relics.every(k=>owns(RELICS,k)))return false;
 if(!Array.isArray(r.choices)||!r.choices.every(k=>owns(RELICS,k)))return false;
 if(!Array.isArray(r.log)||r.log.length>30||!r.log.every(x=>typeof x==='string'&&x.length<500))return false;
 if(r.phase==='room'&&!['relic','rest','shop','event'].includes(r.room))return false;
 if(r.phase==='room'&&r.room==='relic'&&(r.choices.length<1||r.choices.some(k=>r.relics.includes(k))))return false;
 if(r.phase==='combat'){
  const e=r.enemy;if(!obj(e)||!owns(ENEMIES,e.key)||!['battle','elite','boss'].includes(e.type)||e.type!==r.room)return false;
  for(const k of ['hp','maxHp','atk','def','turn','poison','burn'])if(!Number.isInteger(e[k])||e[k]<0||e[k]>10000)return false;
  if(e.hp<=0||e.hp>e.maxHp||r.hp<=0||![1,2].includes(e.phase)||typeof e.first!=='boolean')return false;
 }
 if(r.phase==='result'&&(typeof r.victory!=='boolean'||!Number.isFinite(r.earned)||!Number.isFinite(r.elapsed)||!Array.isArray(r.newAchievements)))return false;
 return true;
}
function legacyItem(e){
 if(!obj(e))return null;
 const strong=['희귀','영웅','전설','레전더리'].includes(e.grade);
 return e.slot==='weapon'?(strong?'fang':'iron'):e.slot==='armor'?(strong?'dusk':'plate'):e.slot==='ring'?'seal':null;
}
export function migrate(v){
 const s=normalize({...v,inventory:[],equipped:{},run:null});
 if(!obj(v))return s;
 let credit=0;for(const k of Object.keys(UPGRADES))credit+=Math.max(0,num(v.upgrades?.[k],1000)-UPGRADES[k].max)*50;
 s.totalGold=Math.min(1e9,s.totalGold+credit);
 for(const e of Array.isArray(v.inventory)?v.inventory:[]){const id=legacyItem(e);if(id&&!s.inventory.includes(id))s.inventory.push(id);}
 for(const slot of ['weapon','armor','ring']){const id=legacyItem({...v.equipped?.[slot],slot});if(v.equipped?.[slot]&&id){if(!s.inventory.includes(id))s.inventory.push(id);s.equipped[slot]=id;}}
 s.legacy={source:OLD_KEY,migratedAt:Date.now(),credit,snapshot:v};
 return s;
}
export function load(storage){
 let raw;try{raw=storage.getItem(SAVE_KEY);}catch{return {save:fresh(),notice:'브라우저 저장소를 사용할 수 없습니다. 이번 플레이는 임시로 진행됩니다.',readOnly:true};}
 if(raw){
  try{
   const p=JSON.parse(raw);
   if(p?.version>2)return {save:fresh(),notice:'더 새로운 버전의 세이브가 있어 덮어쓰지 않습니다. 임시 플레이입니다.',readOnly:true};
   if(!obj(p)||p.version!==2)throw Error('schema');
   const save=normalize(p);
   if(p.run&&!save.run){const backed=backup(storage,raw);return {save,readOnly:!backed,notice:backed?'손상된 탐험은 복원하지 않았습니다. 영구 진행과 원본 백업은 보존했습니다.':'백업 공간이 부족합니다. 원본을 보존하며 임시로 진행합니다.'};}
   return {save,notice:''};
  }catch{const backed=backup(storage,raw);return {save:fresh(),readOnly:!backed,notice:backed?'손상된 세이브를 백업하고 새 게임을 준비했습니다.':'백업 공간이 부족합니다. 원본을 보존하며 임시로 진행합니다.'};}
 }
 try{const old=storage.getItem(OLD_KEY);if(old){const p=JSON.parse(old);if(obj(p))return {save:migrate(p),notice:'기존 기록을 가져왔습니다. 원본 세이브와 미지원 콘텐츠는 보존됩니다. 진행 중이던 구버전 탐험은 새로 시작합니다.'};}}catch{}
 return {save:fresh(),notice:''};
}
function backup(storage,raw){try{if(!storage.getItem(SAVE_KEY+'_recovery'))storage.setItem(SAVE_KEY+'_recovery',raw);return true;}catch{return false;}}
export function persist(storage,save){try{storage.setItem(SAVE_KEY,JSON.stringify(save));return true;}catch{return false;}}

export const IMPORT_BACKUP_KEY=SAVE_KEY+'_before_import',MAX_IMPORT_BYTES=5*1024*1024;
export function parseImport(raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>MAX_IMPORT_BYTES)throw Error('5MB 이하의 세이브 JSON 파일을 선택하세요.');
 let parsed;try{parsed=JSON.parse(raw.replace(/^\uFEFF/,''));}catch{throw Error('JSON 파일을 읽을 수 없습니다. 내려받은 백업 파일을 선택하세요.');}
 if(!obj(parsed)||parsed.version!==2)throw Error('이 게임에서 내려받은 V2 백업만 가져올 수 있습니다.');
 const candidate=normalize(parsed);
 const same=(a,b)=>{
  if(a===b)return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
  const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));
 };
 if(!same(candidate,parsed))throw Error('백업의 데이터가 손상되었거나 지원하지 않는 형식입니다. 현재 기록은 변경하지 않았습니다.');
 return candidate;
}
export function restoreImport(storage,candidate,current,{readOnly=false}={}){
 if(readOnly)throw Error('현재 저장소를 보호 중이므로 백업을 가져올 수 없습니다.');
 const restored=parseImport(JSON.stringify(candidate));
 try{
  const previous=storage.getItem(SAVE_KEY)??JSON.stringify(current);
  storage.setItem(IMPORT_BACKUP_KEY,previous);
  storage.setItem(SAVE_KEY,JSON.stringify(restored));
 }catch{throw Error('저장 공간이 부족하거나 저장소가 차단되어 복원하지 못했습니다. 현재 기록은 유지됩니다.');}
 return restored;
}

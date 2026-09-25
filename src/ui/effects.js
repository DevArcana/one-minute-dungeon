// Presentation only: combat and saving finish before effects run.
export function combatFeedback(fx,classKey){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const arena=document.querySelector('.arena');
 const animate=(el,frames,duration=300,delay=0)=>{if(el&&!reduced)el.animate(frames,{duration,delay,easing:'cubic-bezier(.16,1,.3,1)'});};
 const effect=(parent,kind,delay=0)=>{
  if(!parent||reduced)return;
  const el=document.createElement('span');el.className='combat-fx fx-'+kind;el.setAttribute('aria-hidden','true');
  el.style.animationDelay=delay+'ms';parent.append(el);setTimeout(()=>el.remove(),900+delay);
 };
 const number=(target,n,kind,delay=0)=>{
  const anchor=target?.querySelector('.damage-anchor');if(!anchor||!n)return;
  const el=document.createElement('span');el.className='damage-number '+kind;el.textContent=(kind==='healing'?'+':'−')+n;
  el.setAttribute('aria-hidden','true');el.style.animationDelay=delay+'ms';if(kind==='healing')el.style.left='-32px';
  anchor.append(el);setTimeout(()=>el.remove(),1000+delay);
 };
 if(!arena){animate(document.querySelector('.reward-view, .result-screen'),[{opacity:.55,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],420);return;}
 const player=arena.querySelector('#player-art'),enemy=arena.querySelector('#enemy-art');
 const skill=fx.action==='skill',guard=fx.action==='guard'||skill&&classKey==='warrior';
 const impact=skill?classKey==='mage'?'arcane':classKey==='rogue'?'venom':'cleave':'slash';
 if(fx.dealt){
  animate(player,[{transform:'translateX(0)'},{transform:'translateX(-5px)',offset:.2},{transform:'translateX(26px)',offset:.5},{transform:'translateX(0)'}],200);
  animate(enemy,[{filter:'brightness(1)',transform:'translateX(0)'},{filter:'brightness(1.8)',transform:'translateX(9px)',offset:.2},{filter:'brightness(1)',transform:'translateX(0)'}],250,80);
  effect(enemy,impact,60);effect(enemy,'impact',80);
  if(fx.crit){effect(enemy,'critical',80);animate(arena,[{transform:'translateX(0)'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}],180,80);}
  number(enemy,fx.dealt,fx.crit?'critical':'',80);
 }
 if(guard)effect(player,'shield');
 if(fx.heal){effect(player,'heal');number(player,fx.heal,'healing');}
 if(fx.taken){
  const delay=fx.dealt||fx.heal?210:60;
  animate(player,[{transform:'translateX(0)',filter:'brightness(1)'},{transform:'translateX(-7px)',filter:'brightness(1.5)',offset:.25},{transform:'translateX(0)',filter:'brightness(1)'}],260,delay);
  effect(player,guard?'block':'hurt',delay);number(player,fx.taken,'incoming',delay);
 }
}

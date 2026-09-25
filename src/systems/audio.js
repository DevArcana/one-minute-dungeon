// Procedural feedback, unlocked only by a user gesture. No timers/BGM loop.
let context;
const tones={button:[330],attack:[180,130],hit:[100,75],crit:[550,880],skill:[440,660,990],reward:[660,880],level:[523,659,784],boss:[90,80,65],victory:[523,659,784,1047],defeat:[220,165,110],guard:[250,400]};
export function sound(key,enabled){
 if(!enabled)return;
 try{context??=new (window.AudioContext||window.webkitAudioContext)();if(context.state==='suspended')context.resume().catch(()=>{});
 (tones[key]||tones.button).forEach((f,i)=>{const osc=context.createOscillator(),gain=context.createGain(),t=context.currentTime+i*.075;osc.type=['hit','boss'].includes(key)?'triangle':'sine';osc.frequency.value=f;gain.gain.setValueAtTime(.045,t);gain.gain.exponentialRampToValueAtTime(.001,t+.16);osc.connect(gain).connect(context.destination);osc.start(t);osc.stop(t+.18);osc.onended=()=>{osc.disconnect();gain.disconnect();};});
 }catch{}
}

import sharp from 'sharp';
import {stat} from 'node:fs/promises';
for(const key of ['warrior','rogue','mage','goblin','skeleton','dragon','dungeon']){
 const output='assets/'+key+'.webp';
 await sharp('assets/'+key+'.png').webp({quality:84,alphaQuality:92}).toFile(output);
 console.log(key+': '+(await stat(output)).size+' bytes');
}

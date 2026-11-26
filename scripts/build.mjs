import {readdir,readFile,mkdir,copyFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');const dist=resolve(root,'dist');await mkdir(dist,{recursive:true});await mkdir(resolve(dist,'knowledge'),{recursive:true});
for(const name of await readdir(resolve(root,'site')))await copyFile(resolve(root,'site',name),resolve(dist,name));
const documents=[];for(const name of (await readdir(resolve(root,'knowledge'))).filter(n=>n.endsWith('.md')).sort()){const text=await readFile(resolve(root,'knowledge',name),'utf8');const [heading,...body]=text.trim().split('\n');documents.push({id:name.replace('.md',''),title:heading.replace(/^#\s*/,''),text:body.join('\n').trim(),href:'knowledge/'+name});await copyFile(resolve(root,'knowledge',name),resolve(dist,'knowledge',name));}
await writeFile(resolve(dist,'corpus.json'),JSON.stringify({name:'Fictional Atlas Learning Lab handbook',documents},null,2));console.log(`Built ${documents.length} public knowledge documents and application assets.`);

export const STOP = new Set('a an and are as at be before by can do does for from how i in is it its may of on or our should that the their these this to use uses using what when where which who why with would you your'.split(' '));
export function tokenize(text){return (text.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g)||[]).filter(x=>!STOP.has(x));}
export function chunkDocuments(documents,{size=80,overlap=12}={}){
 if(!Number.isInteger(size)||!Number.isInteger(overlap)||size<1||overlap<0||overlap>=size)throw Error('Invalid chunk configuration');
 return documents.flatMap(doc=>{const words=doc.text.trim().split(/\s+/);const out=[];for(let start=0;start<words.length;start+=size-overlap){out.push({id:doc.id+'-'+(out.length+1),documentId:doc.id,title:doc.title,href:doc.href,text:words.slice(start,start+size).join(' ')});if(start+size>=words.length)break;}return out;});
}
export function buildIndex(documents){const chunks=chunkDocuments(documents);const terms=chunks.map(c=>tokenize(c.title+' '+c.text));const frequencies=terms.map(t=>{const m=new Map();for(const w of t)m.set(w,(m.get(w)||0)+1);return m;});const df=new Map();for(const m of frequencies)for(const w of m.keys())df.set(w,(df.get(w)||0)+1);return {chunks,terms,frequencies,df,averageLength:terms.reduce((s,t)=>s+t.length,0)/terms.length};}
export function retrieve(question,index,{topK=2,minCoverage=.5}={}){
 const query=[...new Set(tokenize(question))];if(!query.length)return [];
 return index.chunks.map((chunk,i)=>{let score=0,matched=0;for(const w of query){const tf=index.frequencies[i].get(w)||0;if(!tf)continue;matched++;const idf=Math.log(1+(index.chunks.length-(index.df.get(w)||0)+.5)/((index.df.get(w)||0)+.5));score+=idf*(tf*2.5)/(tf+1.5*(.25+.75*index.terms[i].length/index.averageLength));}return {...chunk,score,coverage:matched/query.length};}).filter(h=>h.score>0&&h.coverage>=minCoverage).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,topK);
}
export function createPrompt(question,hits){if(question.length>300)throw Error('Question exceeds 300 characters');if(!hits.length)throw Error('No retrieved evidence');return 'Context: '+hits.map(h=>h.text).join('\n\n')+'\n\nBased on the context, '+question;}

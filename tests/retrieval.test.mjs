import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {buildIndex,chunkDocuments,retrieve,createPrompt} from '../site/retrieval.js';
const documents=[];for(const name of (await readdir(new URL('../knowledge/',import.meta.url))).sort()){const content=await readFile(new URL('../knowledge/'+name,import.meta.url),'utf8');const [heading,...rest]=content.trim().split('\n');documents.push({id:name.slice(0,-3),title:heading.replace(/^#\s*/,''),text:rest.join('\n').trim(),href:'knowledge/'+name});}
const index=buildIndex(documents);
const cases=[
 ['What are the library opening hours?','01-library'],
 ['How do I reserve a workstation?','02-workstations'],
 ['What is the support desk reference code?','03-support'],
 ['How long can I borrow an adapter?','07-checkout'],
 ['How long can the walkthrough video be?','04-project-delivery'],
 ['What data can I publish in a public repository?','05-data-policy'],
];
const actual=cases.map(([question,expected])=>({question,expected,top:retrieve(question,index)[0]?.documentId}));
test('retrieval identifies the expected document for six handbook questions',()=>{for(const r of actual)assert.equal(r.top,r.expected,r.question);});
test('unrelated questions abstain before invoking the generator',()=>{for(const q of ['Who won the football world cup in 1978?','What is the capital of France?','Calculate the square root of 81.'])assert.deepEqual(retrieve(q,index),[],q);});
test('empty and stopword-only input has no evidence',()=>{assert.deepEqual(retrieve('',index),[]);assert.deepEqual(retrieve('what is the',index),[]);});
test('long documents are bounded and overlapping',()=>{const words=Array.from({length:201},(_,i)=>'word'+i);const c=chunkDocuments([{id:'x',title:'x',text:words.join(' ')}]);assert.equal(c.length,3);assert.equal(c[0].text.split(' ').length,80);assert.equal(c[1].text.split(' ')[0],'word68');assert.equal(c.at(-1).text.split(' ').at(-1),'word200');});
test('invalid overlap configurations fail rather than loop',()=>{assert.throws(()=>chunkDocuments(documents,{size:10,overlap:10}));});
test('prompt contains retrieved evidence and the actual question',()=>{const q=cases[2][0],h=retrieve(q,index),p=createPrompt(q,h);assert.ok(p.includes('ORBIT-42'));assert.ok(p.includes(q));assert.ok(p.includes('Based on the context'));assert.throws(()=>createPrompt(q,[]));assert.throws(()=>createPrompt('a'.repeat(301),h));});
test('retrieval scores are finite and deterministically ordered',()=>{const a=retrieve(cases[0][0],index);assert.ok(a.length<=2);assert.ok(a.every(h=>Number.isFinite(h.score)&&h.coverage>=.5));assert.deepEqual(a,retrieve(cases[0][0],index));});
await mkdir(new URL('../evidence/',import.meta.url),{recursive:true});await writeFile(new URL('../evidence/retrieval-evaluation.json',import.meta.url),JSON.stringify({corpus_documents:documents.length,chunks:index.chunks.length,questions:actual,top1_accuracy:actual.filter(r=>r.top===r.expected).length/actual.length,note:'Small handcrafted retrieval set, not a generation-quality benchmark.'},null,2));

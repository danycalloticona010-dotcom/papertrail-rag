import {pipeline,env} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
env.allowLocalModels=false;
env.backends.onnx.wasm.numThreads=1;
const MODEL='Xenova/flan-t5-small';
const REVISION='311454e83bc784267fd7eef5940ee854144abbec';
let generator;
self.onmessage=async({data})=>{
 try{
  if(!generator){self.postMessage({type:'status',message:'Downloading model files from Hugging Face…'});generator=await pipeline('text2text-generation',MODEL,{device:'wasm',dtype:'q8',revision:REVISION,progress_callback:p=>{if(p.status==='progress')self.postMessage({type:'progress',file:p.file,progress:Math.round(p.progress||0)});}});}
  self.postMessage({type:'status',message:'Generating an answer locally…'});
  const encoded=await generator.tokenizer(data.prompt);const inputTokens=encoded.input_ids.dims.at(-1);if(inputTokens>480)throw Error('Context exceeds the 480-token application budget. Please shorten the question.');
  const start=performance.now();const output=await generator(data.prompt,{max_new_tokens:80,do_sample:false,num_beams:1,repetition_penalty:1.1});
  self.postMessage({type:'answer',answer:output[0].generated_text,inputTokens,milliseconds:Math.round(performance.now()-start),model:MODEL,revision:REVISION});
 }catch(error){self.postMessage({type:'error',message:String(error.message||error)});}
};

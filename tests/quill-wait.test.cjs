// Verify long-running inference and explicit cancellation against the real client.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('async function quillRequest('),end=html.indexOf('async function quillTest(',start);
let elapsed=0;const timers=[];
const context=vm.createContext({AbortController,Response,Error,quillNetworkOptions:async()=>({}),location:{origin:'https://example.test'},setTimeout:(fn,delay)=>{const timer={fn,due:elapsed+delay};timers.push(timer);return timer},clearTimeout:timer=>{const i=timers.indexOf(timer);if(i>=0)timers.splice(i,1)}});
vm.runInContext(html.slice(start,end)+'\nglobalThis.request=quillRequest;',context);
function advance(ms){elapsed+=ms;for(const timer of [...timers])if(timer.due<=elapsed){timers.splice(timers.indexOf(timer),1);timer.fn()}}
(async()=>{
 let complete;
 const controller=new AbortController();
 context.fetch=(_url,{signal})=>new Promise((resolve,reject)=>{complete=()=>resolve(Response.json({choices:[{message:{content:'Slow reply'}}]}));signal.addEventListener('abort',()=>reject(Error('Aborted')),{once:true})});
 const pending=context.request('https://server/api','test','/chat/completions',{model:'slow',messages:[]},controller);
 await new Promise(setImmediate);
 advance(15*60*1000);
 assert.equal(controller.signal.aborted,false,'Inference must remain active after fifteen simulated minutes');
 complete();assert.equal((await pending).choices[0].message.content,'Slow reply');
 assert.equal(timers.length,0,'The client must not schedule an abort deadline');

 const cancelled=new AbortController();
 const wait=context.request('https://server/api','test','/chat/completions',{},cancelled);
 await new Promise(setImmediate);cancelled.abort();
 await assert.rejects(wait,/Request stopped/);

 let reading;
 const cancelledBody=new AbortController();
 context.fetch=async()=>({ok:true,json:()=>new Promise((_resolve,reject)=>{reading=true;cancelledBody.signal.addEventListener('abort',()=>reject(Error('Aborted')),{once:true})})});
 const body=context.request('https://server/api','test','/chat/completions',{},cancelledBody);
 await new Promise(setImmediate);
 assert.equal(reading,true);cancelledBody.abort();await assert.rejects(body,/Request stopped/);
 console.log('PASS: no automatic deadline after 15 simulated minutes; Stop cancels inference and response reading.');
})().catch(error=>{console.error(error);process.exitCode=1});

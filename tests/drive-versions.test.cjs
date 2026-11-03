const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const project=(text,date)=>({Id:'series',Title:'Test series',ModifiedAtUtc:date,Books:[{Id:'b',Title:'Book'}],Chapters:[{Id:'c',BookId:'b',Title:'Chapter',Paragraphs:[{Id:'p',Text:text,ThreadIds:[]}]}],Threads:[],History:[],Reviews:[]});
function harness(local,remote){
 let remoteProject=structuredClone(remote),revision=1,writes=0,dialog=null,failed=false,serial=0;
 const metadata=()=>({id:'file',name:'Test.novel.json',version:String(revision),md5Checksum:'hash'+revision,modifiedTime:'2026-11-03T12:00:00Z',size:JSON.stringify(remoteProject).length});
 const store=new Map(),timers=new Map(),client={requestAccessToken(){client.callback({access_token:'test-token',expires_in:3600})}};
 const S={project:structuredClone(local),editSession:new Map(),reader:{},customWords:new Set(),dirty:false};
 const context=vm.createContext({S,URL,URLSearchParams,Response,Headers,Blob,console,Date,structuredClone,location:{protocol:'https:',hostname:'example.test',origin:'https://example.test'},navigator:{onLine:true},window:{google:{accounts:{oauth2:{initTokenClient:()=>client,hasGrantedAllScopes:()=>true}}}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},setTimeout:(fn)=>{timers.set(++serial,fn);return serial},clearTimeout:t=>timers.delete(t),$:()=>null,h:s=>String(s).replace(/</g,'&lt;'),now:()=>new Date().toISOString(),id:()=>String(++serial),wc:s=>s.trim()?s.trim().split(/\s+/).length:0,flushAllEdits(){},saveLocal:async()=>{},scheduleSave(){},listenStop(){},swapChapter(){},render(){},toast(){},closeModal(){dialog=null},modal:(title,body,buttons,callback)=>{dialog={title,body,buttons,callback}},confirmAction(){throw Error('Unexpected confirmation')},fetch:async(url,opts={})=>{
  if(failed)throw Error('Network unavailable');
  if(opts.method==='PATCH'){writes++;remoteProject=JSON.parse(opts.body);revision++;return Response.json(metadata())}
  return Response.json(String(url).includes('alt=media')?remoteProject:metadata());
 }});
 const clean=html.slice(html.indexOf('function cleanProject('),html.indexOf('function locate('));
 const cover=html.slice(html.indexOf('function cleanCover('),html.indexOf('function bookCovers('));
 const drive=html.slice(html.indexOf('const DRIVE_SCOPE='),html.indexOf('function renderMore('));
 vm.runInContext(cover+clean+drive+'\nglobalThis.api={driveState,driveConnect,driveAutoSync,driveSave,driveCompareVersions,driveResolveVersion,driveProjectEditedAt,driveVersionLabel,driveRevision};',context);
 const api=context.api;api.driveState.settings.clientId='test-client';api.driveState.link={fileId:'file',projectId:local.Id,name:'Test.novel.json',revision:api.driveRevision(metadata())};api.driveState.auto.pending=true;
 return {...api,S,get writes(){return writes},get dialog(){return dialog},get remote(){return remoteProject},changeRemote(p){remoteProject=structuredClone(p);revision++},fail(){failed=true},async choose(choice){assert(dialog);dialog.callback(choice);await new Promise(setImmediate);await new Promise(setImmediate)}};
}
(async()=>{
 const local=project('Local work with more words','2026-11-03T10:00:00Z'),remote=project('Remote version','2026-11-03T11:00:00Z');
 let t=harness(local,remote);await t.driveAutoSync();assert.equal(t.writes,0,'No startup auto-upload before reconciliation');await t.driveConnect(true);assert(t.dialog.body.includes('Google Drive has the more recent recorded edit'));assert(t.dialog.body.includes('Drive file saved'));assert.equal(t.writes,0);await t.choose('cancel');await t.driveAutoSync();assert.equal(t.writes,0);assert.equal(t.driveState.reconcileRequired,true,'Cancel must keep sync paused');await t.driveSave();assert.equal(t.writes,0,'Manual save also waits for a choice');await t.choose('drive');assert.equal(t.S.project.Chapters[0].Paragraphs[0].Text,'Remote version');assert.equal(t.S.project.ModifiedAtUtc,remote.ModifiedAtUtc);assert.equal(t.driveState.auto.pending,false);assert.equal(t.writes,0,'Use Drive must never upload the older local copy');
 t=harness(local,remote);await t.driveConnect(true);await t.choose('local');assert.equal(t.writes,1);assert.equal(t.remote.Chapters[0].Paragraphs[0].Text,local.Chapters[0].Paragraphs[0].Text);assert.equal(t.driveState.reconcileRequired,false);
 t=harness(local,remote);await t.driveConnect(true);t.changeRemote(project('Changed while deciding','2026-11-03T12:00:00Z'));await t.choose('local');assert.equal(t.writes,0,'A changed Drive revision requires a fresh choice');assert.equal(t.driveState.reconcileRequired,true);assert(t.dialog);
 t=harness(local,remote);await t.driveConnect(true);t.S.project.Chapters[0].Paragraphs[0].Text='Edited while deciding';await t.choose('drive');assert.equal(t.S.project.Chapters[0].Paragraphs[0].Text,'Edited while deciding');assert.equal(t.driveState.reconcileRequired,true);
 t=harness(local,local);await t.driveConnect(true);assert.equal(t.dialog,null);assert.equal(t.driveState.reconcileRequired,false);assert.equal(t.driveState.auto.pending,false);assert.equal(t.writes,0,'Identical copies resume without overwriting');
 t=harness(local,local);await t.driveConnect(true);t.driveState.auto.pending=true;t.changeRemote(remote);await t.driveAutoSync();assert.equal(t.writes,0,'Remote edits during a session also pause auto-sync');assert.equal(t.driveState.reconcileRequired,true);assert(t.dialog);
 t=harness(local,remote);t.fail();await assert.rejects(t.driveConnect(true),/Network unavailable/);assert.equal(t.driveState.reconcileRequired,true);await t.driveAutoSync();assert.equal(t.writes,0);
 assert.equal(t.driveProjectEditedAt({...local,ModifiedAtUtc:null,History:[]}),null);assert.match(t.driveVersionLabel(null,remote.ModifiedAtUtc),/cannot be determined/);
 assert.equal(t.driveProjectEditedAt({...local,ModifiedAtUtc:null,History:[{ChangedAtUtc:'2026-10-28T12:00:00Z'},{ChangedAtUtc:'2026-10-29T12:00:00Z'}]}),'2026-10-29T12:00:00Z');
 console.log('PASS: reconnect blocks uploads, version dates/counts, cancel, local/Drive choice, stale choices, identical copies, network failures, and legacy dates.');
})().catch(e=>{console.error(e);process.exitCode=1});

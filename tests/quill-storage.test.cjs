// Exercise saved credentials across separate page/tab sessions using the real client.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('// Optional Open WebUI client.'),html.indexOf('// UI event delegation preserves'));
const KEY='novelweaver.quill.openwebui.key',SETTINGS='novelweaver.quill.openwebui.v2';
const storage=(data=new Map())=>({data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)});
function page(localStorage,sessionStorage=storage()){
 const elements=new Map(),$=s=>{if(!elements.has(s))elements.set(s,{value:'',checked:false,textContent:'',innerHTML:'',hidden:false});return elements.get(s)};
 const project={Id:'manuscript',Title:'A book',Books:[],Chapters:[],Threads:[]};
 const context=vm.createContext({URL,console,localStorage,sessionStorage,$,document:{addEventListener(){}},location:{protocol:'https:',origin:'https://example.test'},S:{project},h:String});
 vm.runInContext(source+'\nglobalThis.api={quill,quillRead,quillSaveSettings,quillForgetConnection};',context);
 const api=context.api;api.quillRead();
 return {...api,$,project,sessionStorage,save(remember=true,key='test-only-key'){$('#quill-url').value='https://llm.example';$('#quill-model').value='model';$('#quill-key').value=key;$('#quill-remember').checked=remember;$('#quill-enabled').checked=true;api.quillSaveSettings()}};
}
const local=storage();let p=page(local);
assert.equal(p.quill.remember,true,'New connections default to remembering on this device');
const manuscript=JSON.stringify(p.project);p.save();
assert.equal(local.getItem(KEY),'test-only-key');assert.equal(p.sessionStorage.getItem(KEY),null);
assert.equal(JSON.stringify(p.project),manuscript,'Saving a key must not change exported manuscript data');
p=page(local);assert.equal(p.quill.key,'test-only-key','A fresh tab with empty session storage restores the key');
assert.equal(p.quill.settings.url,'https://llm.example/api');assert.equal(p.quill.settings.model,'model');
p.save(true,'replacement-key');assert.equal(page(local).quill.key,'replacement-key','Updated keys persist');
p.sessionStorage.setItem(KEY,'old-session-key');p.save(false);
assert.equal(p.quill.key,'test-only-key','Opting out still allows the current page to use the entered key');
assert.equal(local.getItem(KEY),null);assert.equal(p.sessionStorage.getItem(KEY),null);
assert.equal(page(local).quill.key,'');assert.equal(page(local).quill.remember,false,'The opt-out preference survives reload');

const legacyLocal=storage(),legacySession=storage();legacySession.setItem(KEY,'legacy-test-key');
p=page(legacyLocal,legacySession);assert.equal(p.quill.key,'legacy-test-key');assert.equal(legacySession.getItem(KEY),null);
assert.equal(page(legacyLocal).quill.key,'legacy-test-key','Previously remembered session keys migrate to device storage');
p.sessionStorage.setItem(KEY,'stale-copy');p.quill.tab='settings';p.quillForgetConnection();
assert.equal(legacyLocal.getItem(KEY),null);assert.equal(legacyLocal.getItem(SETTINGS),null);assert.equal(legacySession.getItem(KEY),null);assert.equal(p.quill.key,'');assert.equal(page(legacyLocal).quill.key,'');

const unavailable={getItem(){throw Error('Blocked')},setItem(){throw Error('Blocked')},removeItem(){throw Error('Blocked')}};
p=page(unavailable);p.save();assert.equal(p.quill.key,'test-only-key');assert.match(p.$('#quill-status').textContent,/storage could not be updated/,'Storage failures are reported instead of claiming persistence');
console.log('PASS: fresh-session persistence, key replacement, opt-out, legacy migration, Forget connection, export isolation, and blocked storage.');

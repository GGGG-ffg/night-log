const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('restored scenes render finite Canvas geometry and stop or restart without orphaned frames',()=>{
 const tasks=new Map(),events=new Map();let id=0,calls=0;
 const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})}, {
  get(target,key){if(key in target)return target[key];return(...args)=>{calls++;for(const n of args)if(typeof n==='number')assert(Number.isFinite(n),key+' received non-finite input');};},
  set(target,key,value){target[key]=value;return true;}
 });
 const canvas={getContext:()=>ctx};
 const sandbox={Night:{},innerWidth:1280,innerHeight:720,devicePixelRatio:1,performance:{now:()=>0},
  window:{addEventListener:(type,fn)=>events.set(type,fn),removeEventListener:type=>events.delete(type)},
  requestAnimationFrame(fn){const key=++id;tasks.set(key,fn);return key;},cancelAnimationFrame:key=>tasks.delete(key)};
 vm.createContext(sandbox);
 for(const file of ['channels.js','transit.js'])vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../dist/js',file),'utf8'),sandbox);
 const renderer=sandbox.Night.transit.create(canvas);
 function frame(time){const [key,fn]=tasks.entries().next().value;tasks.delete(key);fn(time);}
 for(const route of ['home','journal','post','projects','about','gallery','contact','terminal','settings','reader']){
  let progress=0;renderer.start(3400,p=>progress=p,route);
  for(const time of [0,850,1500,2750,3400])frame(time);
  assert.equal(progress,1);assert.equal(tasks.size,0);renderer.stop();assert.equal(events.size,0);
 }
 renderer.start(3400);renderer.start(3400);assert.equal(tasks.size,1);assert.equal(events.size,1);
 renderer.stop();assert.equal(tasks.size,0);assert.equal(events.size,0);assert(calls>1000);
});

const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function harness(){
 const nodes=new Map(),frames=new Map(),timers=new Map();let id=0;
 const gate={dataset:{},querySelector(s){if(!nodes.has(s))nodes.set(s,{textContent:'',style:{}});return nodes.get(s);}};
 const Night={store:{available:true}};
 const c=vm.createContext({Night,performance:{now:()=>0},requestAnimationFrame:f=>{const key=++id;frames.set(key,f);return key;},cancelAnimationFrame:i=>frames.delete(i),setTimeout:f=>{const key=++id;timers.set(key,f);return key;},clearTimeout:i=>timers.delete(i)});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/js/boot.js'),'utf8'),c);
 const boot=Night.boot.create(gate);
 return {Night,boot,gate,nodes,frames,timers,frame(p){const [key,fn]=frames.entries().next().value;frames.delete(key);fn(p*Night.boot.duration);},finish(){for(const [key,fn]of [...timers]){timers.delete(key);fn();}}};
}
test('boot follows logo, red loader, hex stream, then ready',()=>{const h=harness();let done=0;h.boot.start(()=>done++);assert.equal(h.gate.dataset.boot,'logo');h.frame(.25);assert.equal(h.gate.dataset.boot,'boot');h.frame(.7);assert.equal(h.gate.dataset.boot,'dump');assert.match(h.nodes.get('#boot-hex').textContent,/[0-9A-F]{8}/);h.frame(.95);assert.equal(h.gate.dataset.boot,'ready');h.finish();assert.equal(done,1);assert.equal(h.frames.size,0);});
test('skipping boot cancels rendering and never fires a stale completion',()=>{const h=harness();let done=0;h.boot.start(()=>done++);h.frame(.3);h.boot.stop();h.finish();assert.equal(done,0);assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);});
test('replay clears the old boot before starting a new completion',()=>{const h=harness();const done=[];h.boot.start(()=>done.push('old'));h.frame(.7);h.boot.reset();assert.equal(h.gate.dataset.boot,'idle');assert.equal(h.nodes.get('#boot-hex').textContent,'');h.boot.start(()=>done.push('new'));h.finish();assert.deepEqual(done,['new']);});

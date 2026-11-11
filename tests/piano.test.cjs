const {test}=require('node:test');
const assert=require('node:assert/strict');
const piano=require('../dist/js/piano-model.js');
const synth=require('../dist/js/piano-audio.js');

test('physical keyboard maps consecutive semitones and exact A440 without duplicate bindings',()=>{
  assert.equal(piano.notes.length,17);assert.equal(piano.byCode.size,17);
  assert.deepEqual(piano.notes.map(n=>n.midi),Array.from({length:17},(_,i)=>60+i));
  assert.equal(piano.byCode.get('KeyH').frequency,440);assert.equal(piano.byCode.get('Semicolon').midi,76);
  assert.equal(piano.notes.filter(n=>n.black).length,7);
});
test('all three arrangements use playable notes, positive durations and complete four-beat measures',()=>{
  for(const song of piano.songs){assert(song.events.length>20);for(const bar of song.bars){assert.equal(bar.reduce((sum,e)=>sum+e.beats,0)%4,0);for(const e of bar){assert(piano.byMidi.has(e.midi));assert(e.beats>0);}}}
  assert.deepEqual(piano.songs[0].events.slice(0,7).map(e=>e.midi),[60,60,67,67,69,69,67]);
});
test('repeated keydown and a second input owner cannot consume repeated score notes',()=>{
  const m=piano.create();assert(m.press(60,'key').advanced);assert.equal(m.press(60,'key'),null);
  assert.equal(m.press(60,'mouse').start,false);assert.equal(m.snapshot().cursor,1);
  assert.equal(m.release('key').stop,false);assert.equal(m.release('mouse').stop,true);
  assert(m.press(60,'key').advanced);assert.equal(m.snapshot().cursor,2);
});
test('wrong notes wait, correct notes complete once, and free mode leaves score untouched',()=>{
  const m=piano.create();assert.equal(m.press(61,'bad').correct,false);m.release('bad');assert.equal(m.snapshot().cursor,0);
  for(const e of piano.songs[0].events){assert(m.press(e.midi,'key').advanced);m.release('key');}
  assert.equal(m.snapshot().target,null);assert.equal(m.press(60,'extra').advanced,false);
  m.setMode('free');assert.equal(m.press(60,'chord-a').correct,null);m.press(64,'chord-b');m.press(67,'chord-c');
  assert.deepEqual(m.snapshot().held,[60,64,67]);assert.equal(m.snapshot().cursor,0);
});
test('reset and input clearing release ownership while song switches reset the expected note',()=>{
  const m=piano.create();m.press(60,'key');m.clear();assert.equal(m.snapshot().held.length,0);assert.equal(m.snapshot().cursor,1);
  m.reset(piano.songs[2]);assert.equal(m.snapshot().cursor,0);assert.equal(m.snapshot().target,64);assert.equal(m.snapshot().mistakes,0);
  assert.equal(m.press(999,'invalid'),null);assert.equal(m.release('missing'),null);
});
function contextFactory(suspended=false){
  const instances=[];let unblock;
  class Context{
    constructor(){this.state=suspended?'suspended':'running';this.currentTime=0;this.destination={};this.oscs=[];instances.push(this);}
    createGain(){const param={value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}};return{gain:param,connect(next){return next;},disconnect(){}};}
    createDynamicsCompressor(){return{threshold:{},knee:{},ratio:{},attack:{},release:{},connect(next){return next;}};}
    createOscillator(){const osc={frequency:{value:0},started:false,stopped:false,connect(next){return next;},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;this.onended?.();}};this.oscs.push(osc);return osc;}
    resume(){return new Promise(resolve=>{unblock=()=>{this.state='running';resolve();};});}
    close(){this.state='closed';return Promise.resolve();}
  }
  return{Context,instances,resume:()=>unblock()};
}
test('audio is lazy, supports independent notes and silences or closes the complete instrument',async()=>{
  const f=contextFactory(),a=synth.create(f.Context);assert.equal(f.instances.length,0);
  assert(await a.start(60,261.63));assert(await a.start(64,329.63));assert.equal(a.count,2);
  assert.equal(await a.start(60,261.63),false);assert.equal(f.instances[0].oscs.length,8);
  a.stop(60);assert.equal(a.count,1);assert(f.instances[0].oscs.slice(0,4).every(o=>o.stopped));
  a.silence();assert.equal(a.count,0);assert(f.instances[0].oscs.every(o=>o.stopped));
  a.dispose();assert.equal(f.instances[0].state,'closed');assert.equal(await a.start(67,392),false);
});
test('released notes cannot start late after asynchronous audio unlock',async()=>{
  const f=contextFactory(true),a=synth.create(f.Context);const pending=a.start(60,261.63);a.stop(60);f.resume();
  assert.equal(await pending,false);assert.equal(a.count,0);assert.equal(f.instances[0].oscs.length,0);a.dispose();
});
test('closing during audio unlock cancels playback and unavailable audio reports failure',async()=>{
  const f=contextFactory(true),a=synth.create(f.Context);const pending=a.start(60,261.63);a.dispose();f.resume();assert.equal(await pending,false);assert.equal(f.instances[0].oscs.length,0);
  let errors=0;const broken=synth.create(undefined,()=>errors++);assert.equal(await broken.start(60,261.63),false);assert.equal(errors,1);assert.equal(broken.count,0);broken.dispose();
});

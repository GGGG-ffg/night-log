const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function harness(preference = 'full') {
  const elements = new Map(), listeners = {}, timers = new Map();
  let timerId = 0, now = 0, starts = 0, stops = 0, frame, soundStarts=0, soundStops=0;const soundPhases=[];
  const make = selector => {
    const classes = new Set(), events = {}, attrs = new Map();
    const node = {dataset:{}, textContent:'', inert:false, isConnected:true, events, attrs,
      style:{setProperty(){}},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},
      setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),getAttribute:k=>attrs.get(k),
      addEventListener:(k,f)=>events[k]=f,focus(){document.activeElement=node;},querySelector(){return null;}};
    elements.set(selector,node); return node;
  };
  const document = {hidden:false,activeElement:null,documentElement:make('html'),
    querySelector:s=>elements.get(s) || make(s), querySelectorAll:s=>s.startsWith('body >') ? background : [],
    addEventListener:(k,f)=>listeners[k]=f};
  const background = [make('header'),make('#main-content'),make('#night-radio')];
  const media = {matches:false,addEventListener(){}};
  const Night = {audio:{beginTransit(){soundStarts++;return{phase:p=>soundPhases.push(p),stop:()=>soundStops++};}},store:{read:()=>preference,write:()=>true,available:true},toast(){},
    transit:{create:()=>({start(ms,cb){starts++;frame=cb;},stop(){stops++;}})}};
  const context = vm.createContext({Night,document,location:{hash:'#/journal'},matchMedia:()=>media,
    window:{dispatchEvent(){},addEventListener(){}},Event:class {},
    setTimeout(fn,delay){const id=++timerId;timers.set(id,{fn,time:now+delay});return id;},clearTimeout:id=>timers.delete(id)});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/js/channels.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/js/motion.js'),'utf8'),context);
  function tick(ms) {
    const end=now+ms;
    while(true) { const next=[...timers].filter(([,t])=>t.time<=end).sort((a,b)=>a[1].time-b[1].time)[0]; if(!next)break; now=next[1].time;timers.delete(next[0]);next[1].fn(); }
    now=end;
  }
  return {motion:Night.motion,Night,elements,document,background,listeners,media,location:context.location,tick,counts:()=>({starts,stops}),soundCounts:()=>({starts:soundStarts,stops:soundStops,phases:soundPhases}),frame:p=>frame(p)};
}

test('home and subsequent routes use the restored 3.4-second timeline',async()=>{
 const h=harness();let swaps=0;h.location.hash='#/home';const first=h.motion.transition('首页',()=>swaps++);h.tick(3200);assert.equal(swaps,0);h.tick(200);assert.equal(await first,true);assert.equal(swaps,1);h.location.hash='#/projects';const next=h.motion.transition('作品',()=>swaps++);h.tick(3400);assert.equal(await next,true);assert.equal(swaps,2);
});

test('skip commits the destination once and preserves existing inert state', async () => {
  const h=harness(); let swaps=0; h.background[2].inert=true;
  const result=h.motion.transition('接入 / 日志',()=>swaps++);
  assert.ok(h.background.every(e=>e.inert));
  h.elements.get('#transition-skip').events.click();
  h.tick(5000);
  assert.equal(await result,true);assert.equal(swaps,1);
  assert.deepEqual(h.background.map(e=>e.inert),[false,false,true]);
  assert.equal(h.counts().stops,1);
});

test('a newer route cancels the prior destination and its scheduled swaps', async () => {
  const h=harness(), destinations=[];
  const first=h.motion.transition('first',()=>destinations.push('first'));
  h.tick(600);
  const second=h.motion.transition('second',()=>destinations.push('second'));
  h.tick(4000);
  assert.equal(await first,false);assert.equal(await second,true);
  assert.deepEqual(destinations,['second']);assert.equal(h.counts().stops,2);
});

test('reduced motion and an open entry gate swap immediately without flight', async () => {
  for(const mode of ['reduced','off']) {
    const h=harness(mode);let swapped=false;
    assert.equal(await h.motion.transition('target',()=>swapped=true),true);
    assert.ok(swapped);assert.equal(h.counts().starts,0);
  }
  const h=harness(); h.Night.experience={isOpen:()=>true};
  await h.motion.transition('home',()=>{});assert.equal(h.counts().starts,0);
});

test('changing motion during flight finishes and stops the active renderer', async () => {
  const h=harness();let swaps=0;const result=h.motion.transition('target',()=>swaps++);
  h.motion.set('off');h.tick(5000);
  assert.equal(await result,true);assert.equal(swaps,1);assert.equal(h.counts().stops,1);
});

test('a hidden tab finishes the route and clears keyboard blocking', async () => {
  const h=harness();let swaps=0;const result=h.motion.transition('target',()=>swaps++);
  h.document.hidden=true;h.listeners.visibilitychange();h.tick(5000);
  assert.equal(await result,true);assert.equal(swaps,1);
  assert.ok(!h.document.documentElement.classList.contains('is-routing'));
});

test('an interrupted dialog transition never opens a stale modal', async () => {
  const h=harness();let opened=0;
  const dialog={getAttribute:()=>null,open:false,showModal:()=>opened++};
  const pending=h.motion.openDialog(dialog);
  const route=h.motion.transition('route',()=>{});h.tick(4000);
  await pending;await route;assert.equal(opened,0);
});

test('all main routes use distinct transition narratives and scene identifiers', () => {
  const h=harness(),routes=['home','journal','projects','about','contact','post','gallery'];
  const words=routes.map(route=>h.Night.channels.get(route).words[1]);
  assert.equal(new Set(words).size,routes.length);
  for(const route of routes) {const profile=h.Night.channels.get(route);assert.equal(profile.key,route);assert.equal(profile.stages.length,3);assert.match(profile.accent,/^#[0-9a-f]{6}$/i);}
  assert.equal(h.Night.channels.get('__proto__').key,'home');assert.equal(h.Night.channels.get('constructor').key,'home');
});

test('dialog variants override the route and drive their own transition text', async () => {
  const h=harness();const result=h.motion.transition('terminal',()=>{},{dialog:true,variant:'terminal'});
  assert.equal(h.elements.get('#route-transition').dataset.channel,'terminal');
  h.frame(.4);assert.equal(h.elements.get('#transit-word').textContent,'SHELL LINK');
  h.tick(2500);assert.equal(await result,true);
});

test('three stage cues occur once and skipping or replacing a route cancels its soundtrack',async()=>{
 const h=harness(),first=h.motion.transition('one',()=>{});h.frame(0);h.frame(.1);h.frame(.3);h.frame(.5);h.frame(.8);h.frame(.9);
 assert.deepEqual(h.soundCounts().phases,['cut','dive','lock']);
 h.elements.get('#transition-skip').events.click();assert.equal(await first,true);assert.equal(h.soundCounts().stops,1);
 const second=h.motion.transition('two',()=>{}),third=h.motion.transition('three',()=>{});h.tick(4000);
 assert.equal(await second,false);assert.equal(await third,true);assert.equal(h.soundCounts().starts,3);assert.equal(h.soundCounts().stops,3);
});

test('reduced and disabled motion never start the impact soundtrack',async()=>{
 for(const mode of ['reduced','off']){const h=harness(mode);await h.motion.transition('target',()=>{});assert.equal(h.soundCounts().starts,0);}
});

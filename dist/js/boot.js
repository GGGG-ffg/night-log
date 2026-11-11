/* Original, bounded black/red web boot sequence. */
Night.boot = (() => {
  const duration=6800;
  const phaseAt=p=>p<.13?'logo':p<.58?'boot':p<.9?'dump':'ready';
  function create(gate){
    const $=s=>gate.querySelector(s);let frame=0,timer=0,started=0,last=-100,running=false,phase='';
    const lines=['NIGHT.OS / PERSONAL WEB TERMINAL','ROUTE INDEX ................. MOUNTED','LOCAL ARCHIVE ............... '+(Night.store.available?'AVAILABLE':'SESSION ONLY'),'INTERFACE ENGINE ............ READY','AUDIO CHANNEL ............... USER CONTROL','ZERO DIVISION / NΞON ......... CONNECTED'];
    function stop(){running=false;cancelAnimationFrame(frame);clearTimeout(timer);frame=timer=0;}
    function reset(){stop();phase='';gate.dataset.boot='idle';$('#boot-percent').textContent='000%';$('#boot-fill').style.transform='scaleX(0)';$('#boot-lines').textContent='';$('#boot-hex').textContent='';}
    function render(p){
      const next=phaseAt(p);$('#boot-percent').textContent=String(Math.min(100,Math.floor(p*100))).padStart(3,'0')+'%';$('#boot-fill').style.transform=`scaleX(${Math.min(1,p/.85)})`;
      const count=Math.max(0,Math.min(lines.length,Math.floor((p-.13)/.45*lines.length)+1));$('#boot-lines').textContent=lines.slice(0,count).join('\n')+(count?'\n// ▌':'');
      if(next==='dump'){const tick=Math.floor(p*60),rows=[],columns=Math.max(3,Math.min(10,Math.floor((gate.clientWidth||390)/140))); for(let i=0;i<38;i++){if(i%6===0){rows.push('//--/--/'.repeat(columns*2));continue;}rows.push(Array.from({length:columns},(_,c)=>((Math.imul(i+tick+17,2654435761)^Math.imul(c+91,1597334677))>>>0).toString(16).toUpperCase().padStart(8,'0')).join('   '));}$('#boot-hex').textContent=rows.join('\n');}
      if(next===phase)return;phase=next;gate.dataset.boot=next;$('#entry-status').textContent={logo:'LOGO ONLINE / 三刃信号已接入',boot:'BOOTING / 正在启动个人终端',dump:'DATA STREAM / 正在同步界面',ready:'SYSTEM READY / 即将进入零界'}[next];
    }
    function start(finish){reset();running=true;started=performance.now();last=-100;render(0);function tick(now){if(!running)return;const p=Math.min(1,(now-started)/duration);if(now-last>=65){last=now;render(p);}if(p<1)frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);timer=setTimeout(()=>{if(!running)return;render(1);stop();finish();},duration);}
    return{start,stop,reset};
  }
  return{duration,phaseAt,create};
})();

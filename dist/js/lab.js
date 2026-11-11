/* Desktop piano: free play, guided score and cancellable demonstrations. */
Night.lab=(()=>{
  let scope=null,disposeAudio=()=>{};
  function close(){scope?.abort();scope=null;disposeAudio();disposeAudio=()=>{};document.querySelector('#reader')?.classList.remove('piano-view');}
  async function show(){
    close();const own=new AbortController();scope=own;
    const api=Night.pianoModel,dialog=document.querySelector('#reader');let song=api.songs[0],model=api.create(song),demo=false,demoIndex=-1,epoch=0,failed=false;
    const timers=new Set(),pointers=new Map();
    const $=s=>dialog.querySelector(s),on=(n,t,fn)=>n.addEventListener(t,fn,{signal:own.signal});
    dialog.classList.add('piano-view');$('#reader-label').textContent='NEON KEYS / DESKTOP INSTRUMENT';
    $('#reader-content').innerHTML=`<section class="piano-shell" aria-label="零界键盘钢琴"><header class="piano-heading"><div><p class="eyebrow">PROJECT 002 / PLAY SOMETHING REAL</p><h2>零界<span>键盘钢琴</span></h2><p>把键盘，变成旋律。不会读谱，也能从第一首开始。</p></div><div class="piano-live"><span>LIVE NOTE / 当前音符</span><strong id="piano-current">—</strong><small id="piano-voicing">17 KEYS · C4—E5</small></div></header><div class="piano-toolbar"><div class="piano-modes" role="group" aria-label="钢琴模式"><button id="piano-learn" aria-pressed="true">01 / 新手跟弹</button><button id="piano-free" aria-pressed="false">02 / 自由弹奏</button></div><label>琴音音量 <input id="piano-volume" aria-label="琴音音量" type="range" min="0" max="70" value="38"><output id="piano-volume-value">38%</output></label><button id="piano-silence" class="small-button">停止所有琴音</button></div><div class="piano-instrument"><div class="piano-rail"><span>ZERO DIVISION / POLYPHONIC SYNTH</span><span>● KEYBOARD CONNECTED</span></div><div class="piano-keyboard" role="group" aria-label="钢琴琴键，白键 A S D F G H J K L 分号，黑键 W E T Y U O P">${api.notes.map(n=>`<button class="piano-key ${n.black?'is-black':'is-white'}" data-midi="${n.midi}" style="--position:${n.position}" aria-label="${n.name} 琴键 ${n.key}" aria-pressed="false"><span class="piano-degree">${n.degree}</span><kbd>${n.key}</kbd><small>${n.name}</small></button>`).join('')}</div><div class="piano-map"><span>白键 <b>A S D F G H J K L ;</b></span><span>黑键 <b>W E T Y U O P</b></span><span>可同时按键弹和弦</span></div></div><p class="piano-tip">先切换英文输入法，再按字母键或点击琴键。长按延音、松开收音；练习模式只看音符顺序，不考节奏。</p><div class="piano-feedback"><p id="piano-status" role="status">按 A 弹出第一个音，跟着高亮谱子慢慢来。</p><span id="piano-progress">0 / ${song.events.length}</span></div><div class="piano-score-head"><div><p class="eyebrow">START SMALL / 入门键盘谱</p><h3>选一首，照着字母弹。</h3></div><div class="piano-demo-controls"><label>试听速度 <input id="piano-tempo" aria-label="试听速度" type="range" min="50" max="120" step="5" value="80"><output id="piano-tempo-value">80 BPM</output></label><button class="small-button" id="piano-reset">从头练习 ↺</button><button class="button primary" id="piano-demo">听一遍 ▷</button></div></div><div class="piano-songs" role="group" aria-label="选择入门曲谱">${api.songs.map((s,i)=>`<button data-song="${s.id}" aria-pressed="${i===0}"><small>0${i+1} / ${s.events.length} NOTES</small><strong>${s.name}</strong><span>${s.subtitle} ↗</span></button>`).join('')}</div><div class="piano-score-meta"><span id="piano-song-credit"></span><span>每格：键盘字母 / 简谱 / 时值　│ = 分句</span></div><div class="piano-score" id="piano-score" aria-label="键盘字母谱"></div><div class="piano-bottom"><span>长音标有拍数；试听中会同步高亮谱子。</span><span>WEB AUDIO / 本地合成类钢琴音色</span></div></section>`;
    const audio=Night.pianoAudio.create(window.AudioContext||window.webkitAudioContext,()=>{failed=true;status('当前浏览器无法播放琴音；可以继续看谱。请检查声音权限后重新打开作品。');});
    const setTimer=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);if(!own.signal.aborted)fn();},ms);timers.add(id);return id;};
    function status(message){$('#piano-status').textContent=failed?'当前浏览器无法播放琴音；可以继续看谱。请检查声音权限后重新打开作品。':message;}
    function renderScore(){let i=0;$('#piano-score').innerHTML=song.bars.map((bar,b)=>`<div class="piano-bar" role="group" aria-label="第${b+1}乐句"><small>${String(b+1).padStart(2,'0')}</small><div>${bar.map(event=>{const n=api.byMidi.get(event.midi);return`<span class="piano-step" data-step="${i++}"><kbd>${n.key}</kbd><span>${n.degree}</span><small>${event.beats===1?'1拍':event.beats+'拍'}</small></span>`;}).join('')}</div></div>`).join('');$('#piano-song-credit').textContent=song.credit;paint();}
    function paint(){
      const s=model.snapshot(),target=demo?song.events[demoIndex]?.midi:s.mode==='learn'?s.target:null;
      dialog.querySelectorAll('[data-midi]').forEach(key=>{const midi=Number(key.dataset.midi),active=model.active(midi)||(demo&&midi===song.events[demoIndex]?.midi);key.classList.toggle('is-down',active);key.classList.toggle('is-next',midi===target);key.setAttribute('aria-pressed',String(active));});
      dialog.querySelectorAll('[data-step]').forEach(step=>{const i=Number(step.dataset.step);step.classList.toggle('is-current',i===(demo?demoIndex:s.mode==='learn'?s.cursor:-1));step.classList.toggle('is-done',!demo&&s.mode==='learn'&&i<s.cursor);});
      $('#piano-progress').textContent=demo?`试听 ${demoIndex+1} / ${s.total}`:s.mode==='learn'?`${s.cursor} / ${s.total}`:'FREE PLAY / 自由弹奏';
      $('#piano-learn').setAttribute('aria-pressed',String(s.mode==='learn'));$('#piano-free').setAttribute('aria-pressed',String(s.mode==='free'));
      const last=s.held.at(-1)??(demo?song.events[demoIndex]?.midi:null);$('#piano-current').textContent=api.byMidi.get(last)?.name||'—';$('#piano-voicing').textContent=s.held.length>1?`${s.held.length} NOTES / 和弦`:'17 KEYS · C4—E5';
    }
    function releaseAll(){model.clear();pointers.clear();audio.silence();paint();}
    function stopDemo(){demo=false;demoIndex=-1;epoch++;for(const id of timers)clearTimeout(id);timers.clear();audio.silence();$('#piano-demo').textContent='听一遍 ▷';paint();}
    function reset(){stopDemo();releaseAll();model.reset(song);paint();status(model.snapshot().mode==='learn'?'已回到开头，按高亮琴键开始。':'自由弹奏：随意组合音符，也可以同时按住多个键。');}
    function press(midi,source){
      if(demo)stopDemo();const result=model.press(midi,source);if(!result)return;
      const note=api.byMidi.get(midi);if(result.start)audio.start(midi,note.frequency);
      paint();if(failed)return;
      if(result.finished&&result.advanced)status(`这首弹完了！完成 ${song.events.length} 个音符。点击「从头练习」再来一遍。`);
      else if(result.correct===false)status(`刚才是 ${note.name}；再试试 ${api.byMidi.get(model.snapshot().target).key}，谱子会等你。`);
      else if(result.advanced)status(`弹对了 · 下一键 ${api.byMidi.get(model.snapshot().target).key}。重复音需要先松开，再按一次。`);
      else status(`正在弹 ${note.name} / ${note.key}，松开即可收音。`);
    }
    function release(source){const result=model.release(source);if(result?.stop)audio.stop(result.midi);paint();}
    disposeAudio=()=>{epoch++;for(const id of timers)clearTimeout(id);timers.clear();audio.dispose();};
    const opened=await Night.motion.openDialog(dialog);if(!opened||scope!==own||own.signal.aborted){if(scope===own)close();return;}
    renderScore();
    const editing=target=>target?.closest('input,select,textarea,[contenteditable="true"]');
    on(document,'keydown',e=>{if(!dialog.open||editing(e.target)||e.isComposing||e.altKey||e.ctrlKey||e.metaKey)return;const note=api.byCode.get(e.code);if(!note)return;e.preventDefault();if(!e.repeat)press(note.midi,'key:'+e.code);});
    on(document,'keyup',e=>{if(api.byCode.has(e.code))release('key:'+e.code);});
    on(dialog,'pointerdown',e=>{const key=e.target.closest('[data-midi]');if(!key||e.button!==0)return;e.preventDefault();key.focus({preventScroll:true});key.setPointerCapture(e.pointerId);const source='pointer:'+e.pointerId;pointers.set(e.pointerId,source);press(Number(key.dataset.midi),source);});
    const pointerUp=e=>{const source=pointers.get(e.pointerId);if(source){pointers.delete(e.pointerId);release(source);}};
    on(dialog,'pointerup',pointerUp);on(dialog,'pointercancel',pointerUp);on(dialog,'lostpointercapture',pointerUp);
    dialog.querySelectorAll('[data-midi]').forEach(key=>on(key,'click',e=>{if(e.detail!==0)return;const source='activate:'+key.dataset.midi;press(Number(key.dataset.midi),source);setTimer(()=>release(source),240);}));
    on(window,'blur',()=>{stopDemo();releaseAll();status('窗口已失焦，所有琴音已停止。回来后可继续弹。');});
    on(document,'visibilitychange',()=>{if(document.hidden){stopDemo();releaseAll();status('页面已切至后台，试听和琴音已停止。');}});
    on($('#piano-reset'),'click',reset);on($('#piano-silence'),'click',()=>{stopDemo();releaseAll();status('所有琴音已停止。按任一琴键继续。');});
    for(const mode of ['learn','free'])on($('#piano-'+mode),'click',()=>{stopDemo();releaseAll();model.setMode(mode);paint();status(mode==='learn'?'跟弹模式：谱子会等你，按高亮的字母键。':'自由模式：没有对错，试试自己的旋律与和弦。');});
    dialog.querySelectorAll('[data-song]').forEach(button=>on(button,'click',()=>{song=api.songs.find(s=>s.id===button.dataset.song);reset();renderScore();dialog.querySelectorAll('[data-song]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
    on($('#piano-volume'),'input',e=>{audio.setVolume(Number(e.target.value)/100);$('#piano-volume-value').value=e.target.value+'%';});
    on($('#piano-tempo'),'input',e=>{if(demo){stopDemo();status('速度已调整，点击「听一遍」重新试听。');}$('#piano-tempo-value').value=e.target.value+' BPM';});
    on($('#piano-demo'),'click',()=>{
      if(demo){stopDemo();status('试听已停止，可以继续跟弹。');return;}
      releaseAll();demo=true;demoIndex=-1;const token=++epoch,beat=60000/Number($('#piano-tempo').value);$('#piano-demo').textContent='停止试听 □';
      function next(){if(token!==epoch||!demo)return;demoIndex++;if(demoIndex>=song.events.length){stopDemo();status('试听结束。轮到你了，跟弹进度保持不变。');return;}const event=song.events[demoIndex],note=api.byMidi.get(event.midi);audio.start(note.midi,note.frequency);paint();status(`试听中 / ${song.name} · ${note.key} / ${note.name}`);setTimer(()=>audio.stop(note.midi),event.beats*beat*.82);setTimer(next,event.beats*beat);}
      next();
    });
    on(dialog,'close',close);
  }
  return{show,close};
})();

/* Original UI synthesizer; official streamed music stays in its visible player. */
Night.audio = (() => {
  const $ = s => document.querySelector(s);
  let enabled = Night.store.read('sfx', true) !== false;
  const clamp = (v, fallback) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : fallback;
  let volume = clamp(Night.store.read('sfx-volume', 32), 32);
  let musicVolume = clamp(Night.store.read('music-volume', 35), 35);
  let context, master, player, apiLoading = false, ready = false, timeout, fileURL, source = 'none';
  const header = document.createElement('button');
  header.id = 'radio-trigger'; header.textContent = '♫ 电台'; header.setAttribute('aria-expanded', 'false'); header.setAttribute('aria-controls', 'night-radio');
  $('.header-actions').prepend(header);
  const panel = document.createElement('aside'); panel.id = 'night-radio'; panel.hidden = true; panel.setAttribute('aria-label', '零界电台');
  panel.innerHTML = `<div class="radio-top"><span>98.7 / ZERO RADIO</span><button id="radio-close" aria-label="关闭电台并停止音乐">×</button></div><p class="radio-kicker">EDGERUNNERS / ROSA WALTON</p><h2>I Really Want to<br>Stay at Your House</h2><p class="radio-status" id="music-status" role="status">按下连接，给这座城市一点声音。</p><div class="radio-player" id="radio-player" hidden><div id="official-player"></div></div><audio id="local-music" controls loop hidden></audio><div class="radio-actions"><button id="music-connect" class="small-button">▶ 连接官方音乐</button><button id="music-stop" class="small-button">■ 停止</button></div><label class="radio-range">音乐音量 <input id="music-volume" type="range" min="0" max="100" value="${musicVolume}"><output id="music-volume-value">${musicVolume}%</output></label><a class="radio-source" href="https://www.youtube.com/watch?v=KvMY1uzSC1E" target="_blank" rel="noopener noreferrer">在官方频道收听 ↗</a><details><summary>本地音乐 / 离线演示</summary><p>也可以选择你设备上的音频。仅在本机播放，刷新后需要重新选择。</p><label class="radio-file">选择音频文件<input id="music-file" type="file" accept="audio/*"></label><p id="local-track"></p></details>`;
  document.body.append(panel);
  const section = document.createElement('fieldset'); section.className = 'sound-settings';
  section.innerHTML = `<legend>声音 / AUDIO CHANNEL</legend><label><input id="sfx-enabled" type="checkbox" ${enabled ? 'checked' : ''}>界面音效 <small>点击、接入、切页与提示；在首次操作后启用</small></label><label class="radio-range">音效音量 <input id="sfx-volume" type="range" min="0" max="100" value="${volume}"><output id="sfx-volume-value">${volume}%</output></label><button class="small-button" id="sfx-test">试听接入音效 ↗</button><button class="small-button" id="settings-radio">打开音乐电台 ↗</button>`;
  $('#settings .settings-body').append(section);
  const gateOption = document.createElement('label'); gateOption.className = 'entry-sound';
  gateOption.innerHTML = `<input id="entry-sfx" type="checkbox" ${enabled ? 'checked' : ''}> 接入音效 <span>音乐可在进入后的「♫ 电台」开启</span>`;
  $('#entry-connect').after(gateOption);
  function unlock() {
    if (!enabled || !volume) return false;
    try {
      if (!context) { context = new (window.AudioContext || window.webkitAudioContext)(); master = context.createGain(); master.connect(context.destination); }
      master.gain.value = volume / 100 * .28;
      if (context.state === 'suspended') context.resume().catch(() => {});
      return true;
    } catch { return false; }
  }
  function sound(kind = 'click') {
    if (!unlock()) return;
    const t = context.currentTime;
    const presets = {click:[[900,520,.055,0]], enter:[[130,65,.5,0],[420,840,.23,.12],[840,1260,.28,.32]], route:[[180,600,.2,0],[900,500,.12,.12]], notice:[[660,880,.13,0],[990,1100,.16,.12]]};
    for (const [from,to,duration,delay] of presets[kind] || presets.click) {
      const osc = context.createOscillator(), gain = context.createGain();
      osc.type = kind === 'click' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(from,t+delay); osc.frequency.exponentialRampToValueAtTime(to,t+delay+duration);
      gain.gain.setValueAtTime(.001,t+delay); gain.gain.exponentialRampToValueAtTime(.6,t+delay+.008); gain.gain.exponentialRampToValueAtTime(.001,t+delay+duration);
      osc.connect(gain); gain.connect(master); osc.start(t+delay); osc.stop(t+delay+duration+.01);
      osc.onended = () => {osc.disconnect(); gain.disconnect();};
    }
  }
  function beginTransit() {
    let stopped=false;const played=new Set(),voices=new Set();
    function phase(name){
      if(stopped||played.has(name)||!unlock())return;played.add(name);
      const presets={cut:[[180,34,.7,.13],[900,1600,.6,.05]],dive:[[95,27,.75,.65],[2200,130,.28,.18]],lock:[[180,540,.45,.14],[960,720,.35,.07]]};
      for(const [from,to,duration,level] of presets[name]||[]){const t=context.currentTime,osc=context.createOscillator(),gain=context.createGain();osc.type=name==='dive'?'triangle':'sine';osc.frequency.setValueAtTime(from,t);osc.frequency.exponentialRampToValueAtTime(to,t+duration);gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(level,t+.012);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain).connect(master);const voice={osc,gain};voices.add(voice);osc.onended=()=>{voices.delete(voice);osc.disconnect();gain.disconnect();};osc.start(t);osc.stop(t+duration+.02);}
    }
    return{phase,stop(){stopped=true;for(const {osc,gain} of voices){try{gain.gain.cancelScheduledValues(context.currentTime);gain.gain.setTargetAtTime(.0001,context.currentTime,.012);osc.stop(context.currentTime+.05);}catch{}}voices.clear();}};
  }
  function setEnabled(value) {
    enabled = value; Night.store.write('sfx', enabled);
    $('#sfx-enabled').checked = $('#entry-sfx').checked = enabled;
    if (master) master.gain.value = enabled ? volume / 100 * .28 : 0;
    if (enabled) sound('notice');
  }
  $('#sfx-enabled').onchange = e => setEnabled(e.target.checked);
  $('#entry-sfx').onchange = e => setEnabled(e.target.checked);
  $('#sfx-volume').oninput = e => { volume = Number(e.target.value); $('#sfx-volume-value').value = volume+'%'; Night.store.write('sfx-volume',volume); if(master) master.gain.value = enabled ? volume / 100 * .28 : 0; };
  $('#sfx-volume').onchange = () => sound('click');
  $('#sfx-test').onclick = () => { if(!enabled) Night.toast('请先打开界面音效'); else sound('enter'); };
  document.addEventListener('click', e => {
    if (!e.isTrusted) return;
    const target = e.target.closest('button,a'); if (!target || target.disabled || target.id === 'sfx-test' || target.closest('.piano-shell')) return;
    sound(target.id === 'entry-connect' ? 'enter' : target.matches('a[href^="#/"]') ? 'route' : 'click');
  }, true);
  document.addEventListener('submit', e => {if(e.isTrusted) sound('notice');}, true);
  const status = message => $('#music-status').textContent = message;
  function stop() {
    source = 'none'; clearTimeout(timeout); if (ready) player.stopVideo();
    const local = $('#local-music'); local.pause(); local.currentTime = 0;
    panel.classList.remove('playing'); status('音乐已停止。点击连接或使用播放器继续。');
  }
  function open() { panel.hidden = false; header.setAttribute('aria-expanded','true'); $('#radio-close').focus(); }
  function close() { stop(); panel.hidden = true; header.setAttribute('aria-expanded','false'); header.focus(); }
  header.onclick = () => panel.hidden ? open() : close(); $('#radio-close').onclick = close; $('#music-stop').onclick = stop;
  $('#settings-radio').onclick = () => { $('#settings').close(); open(); };
  panel.addEventListener('keydown', e => {if(e.key === 'Escape') {e.stopPropagation(); close();}});
  function createPlayer() {
    if (player || panel.hidden) return;
    player = new YT.Player('official-player', {width:'100%', height:'220', videoId:'KvMY1uzSC1E', playerVars:{playsinline:1,loop:1,playlist:'KvMY1uzSC1E',origin:location.origin}, events:{
      onReady: e => {clearTimeout(timeout); ready = true; e.target.setVolume(musicVolume); if(source === 'official') status('播放器已连接，点击视频中的播放按钮开始。');},
      onStateChange: e => {if(source !== 'official') {if(e.data === 1 && !panel.hidden && !$('#radio-player').hidden) source = 'official'; else {if(e.data === 1) e.target.stopVideo(); return;}} clearTimeout(timeout); panel.classList.toggle('playing',e.data === 1); status(({1:'正在播放 / ROSA WALTON',2:'音乐已暂停',3:'正在缓冲…',0:'本曲结束',5:'已就绪，点击播放器开始'})[e.data] || '尚未开始播放。如提示登录或网络受限，可打开官方频道或选择本地音频。');},
      onError: () => {if(source !== 'official') return; clearTimeout(timeout); panel.classList.remove('playing'); status('官方视频暂时无法播放，可打开官方频道或选择本地音频。');},
      onAutoplayBlocked: () => status('请点击视频内的播放按钮。')
    }});
  }
  $('#music-connect').onclick = () => {
    $('#local-music').pause(); source = 'official'; $('#local-music').hidden = true; $('#radio-player').hidden = false;
    if (ready) {player.playVideo(); status('已请求播放，请在需要时点击视频内的播放按钮。'); return;}
    status('正在连接官方播放器…');
    clearTimeout(timeout); timeout = setTimeout(() => status('连接超时：请打开官方频道，或选择本地音频进行离线播放。'),12000);
    if (window.YT?.Player) createPlayer();
    else if (!apiLoading) {apiLoading = true; window.onYouTubeIframeAPIReady = createPlayer; const script = document.createElement('script'); script.src = 'https://www.youtube.com/iframe_api'; script.onerror = () => {apiLoading = false; clearTimeout(timeout); status('当前网络无法连接 YouTube，可选择本地音频。');}; document.head.append(script);}
  };
  $('#music-volume').oninput = e => { musicVolume = Number(e.target.value); Night.store.write('music-volume',musicVolume); $('#music-volume-value').value = musicVolume+'%'; $('#local-music').volume = musicVolume/100; if(ready) player.setVolume(musicVolume); };
  $('#music-file').onchange = async e => {
    const file = e.target.files[0]; if(!file) return;
    stop(); source = 'local'; if(fileURL) URL.revokeObjectURL(fileURL); fileURL = URL.createObjectURL(file);
    $('#radio-player').hidden = true; const local = $('#local-music'); local.hidden = false; local.src = fileURL; local.volume = musicVolume/100;
    $('#local-track').textContent = file.name;
    try {await local.play();} catch {status('音频未能播放，请使用音频控件重试，或选择其他格式。');}
  };
  $('#local-music').onplay = () => {source = 'local'; panel.classList.add('playing'); status('正在播放本地音频 / 仅本机');};
  $('#local-music').onpause = () => {if(source !== 'local') return; panel.classList.remove('playing'); status('本地音频已暂停');};
  $('#local-music').onerror = () => {panel.classList.remove('playing'); status('无法解码此音频，请选择 MP3、WAV 或其他受支持格式。');};
  return {sound,beginTransit};
})();

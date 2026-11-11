/* Shared full-screen transition controller. One active task prevents stale swaps. */
Night.motion = (() => {
  const system = matchMedia('(prefers-reduced-motion: reduce)');
  let preference = Night.store.read('motion', 'full');
  if (!['full', 'reduced', 'off'].includes(preference)) preference = 'full';
  let active = null;
  const layer = document.querySelector('#route-transition');
  layer.setAttribute('aria-hidden', 'true');
  layer.setAttribute('aria-label', '界面接入过渡');
  layer.innerHTML = `<canvas id="transit-city" aria-hidden="true"></canvas><div class="transit-shade" aria-hidden="true"></div><div class="transit-slices" aria-hidden="true"><i></i><i></i><i></i></div><div class="transit-letterbox transit-letterbox-top" aria-hidden="true"></div><div class="transit-letterbox transit-letterbox-bottom" aria-hidden="true"></div><div class="cinema-noise" aria-hidden="true"></div><div class="cinema-top"><span><img src="assets/zero-mark.svg" alt=""> ZERO DIVISION <b>NEURAL TRANSIT / 2077</b></span><button id="transition-skip" type="button">跳过动画 ESC ↗</button></div><div class="transit-reticle" aria-hidden="true"><i></i><i></i><i></i><i></i><span>TARGET LOCKED</span></div><div class="transit-coordinate" aria-hidden="true">NC / SECTOR 07<br>35° 41′ N / 139° 41′ E<br><span>UPLINK ESTABLISHED</span></div><div class="transit-chapter" aria-hidden="true">CHAPTER <span id="transit-chapter">02</span></div><div class="transit-copy"><p class="cinema-kicker">SIGNAL LOST / 信号中断</p><div class="transit-word" id="transit-word" aria-hidden="true" data-echo="JACK IN">JACK IN</div><div class="transit-destination"><span>DESTINATION / 目标界面</span><strong id="transition-label">构建日志</strong></div><div class="transit-readout" aria-hidden="true"><span id="transit-log">RELEASING PREVIOUS SESSION</span><span id="transit-percent">000%</span></div><div class="cinema-meter" aria-hidden="true"><i></i></div><div class="transit-stages" aria-hidden="true"><span>01 / DISCONNECT</span><span>02 / DEEP DIVE</span><span>03 / CONNECT</span></div></div><div class="cinema-bottom"><span id="transit-code">NL—2077 / LINK 0001</span><span>个人终端接入演出 · Esc 可随时跳过</span></div>`;
  const flight = Night.transit.create(document.querySelector('#transit-city'));
  let sequence = 0;
  const level = () => system.matches ? (preference === 'off' ? 'off' : 'reduced') : preference;
  function apply() {
    document.documentElement.dataset.motion = level();
    document.querySelectorAll('[name="motion"]').forEach(r => r.checked = r.value === preference);
    document.querySelector('#system-motion').textContent = system.matches ? '系统已启用减少动态效果，背景和全屏动画将自动静止或缩短。' : '系统允许完整动画。可随时切换为轻量或关闭。';
    document.querySelector('#storage-status').textContent = Night.store.available ? '设置保存在当前浏览器。' : '浏览器存储受限，设置可能无法保存。';
    window.dispatchEvent(new Event('night:motion'));
    if (active && level() !== 'full') active.finish();
  }
  function set(value) {
    preference = value;
    const saved = Night.store.write('motion', value);
    apply();
    Night.toast(saved ? '动效偏好已保存' : '设置已生效，但浏览器无法保存偏好');
  }
  function transition(label, swap, options = {}) {
    if (active) active.cancel();
    // The opening gate already owns the whole screen: render the initial route beneath it.
    if (Night.experience?.isOpen() || level() !== 'full') {
      swap();
      return Promise.resolve(true);
    }
    return new Promise(resolve => {
      let swapped = false, done = false;
      const soundTrack=Night.audio?.beginTransit?.();
      const timers = [];
      const duration = options.dialog ? 2400 : 3400;
      const previousFocus = document.activeElement;
      const backgroundElements = [...document.querySelectorAll('body > .header, body > main, body > footer, #night-radio')].map(element => ({element, inert:element.inert}));
      backgroundElements.forEach(({element}) => element.inert = true);
      const task = {
        cancel() { settle(false); },
        finish() { if (done) return; performSwap(); settle(true); }
      };
      function performSwap() {
        if (swapped || done) return;
        swapped = true;
        try { swap(); } catch (error) { settle(false); throw error; }
      }
      function settle(result) {
        if (done) return;
        done = true;
        timers.forEach(clearTimeout);
        if (active === task) {
          flight.stop();
          soundTrack?.stop();
          layer.classList.remove('running');
          layer.setAttribute('aria-hidden', 'true');
          document.documentElement.classList.remove('is-routing');
          backgroundElements.forEach(({element,inert}) => element.inert = inert);
          active = null;
          if (document.activeElement === document.querySelector('#transition-skip')) {
            const target = options.dialog && previousFocus?.isConnected ? previousFocus : document.querySelector('dialog[open] .close') || document.querySelector('#main-content');
            target?.focus({preventScroll: true});
          }
        }
        resolve(result);
      }
      active = task;
      const profile = Night.channels.get(options.variant || (options.dialog ? 'reader' : location.hash.split('/')[1] || 'home'));
      layer.dataset.channel = profile.key;
      layer.style.setProperty('--transit-accent',profile.accent);
      document.querySelector('#transition-label').textContent = label.replace(/^(接入|打开)\s*\/\s*/, '');
      const code = String(++sequence).padStart(4,'0');
      document.querySelector('#transit-code').textContent = profile.code + ' / LINK ' + code;
      const chapters = {home:'01',journal:'02',post:'02',projects:'03',about:'04',contact:'05',gallery:'06'};
      document.querySelector('#transit-chapter').textContent = options.dialog ? 'SYS' : chapters[location.hash.split('/')[1]] || '00';
      const word = document.querySelector('#transit-word');
      word.textContent = word.dataset.echo = profile.words[0];
      const kicker = document.querySelector('.cinema-kicker');
      kicker.textContent = profile.stages[0];
      document.querySelectorAll('.transit-stages>span').forEach((span,index)=>span.textContent=String(index+1).padStart(2,'0')+' / '+profile.words[index]);
      layer.dataset.phase = 'cut';
      layer.style.setProperty('--sequence-ms', duration + 'ms');
      layer.classList.remove('running');
      layer.setAttribute('aria-hidden', 'false');
      void layer.offsetWidth;
      layer.classList.add('running');
      document.documentElement.classList.add('is-routing');
      document.querySelector('#transition-skip').focus({preventScroll:true});
      let phase = '';
      flight.start(duration, progress => {
        const next = progress < .18 ? 'cut' : progress < .7 ? 'dive' : 'lock';
        document.querySelector('#transit-percent').textContent = String(Math.floor(progress*100)).padStart(3,'0') + '%';
        if(next === phase) return;
        phase = next; layer.dataset.phase = next;soundTrack?.phase(next);
        const index = {cut:0,dive:1,lock:2}[next];
        word.textContent = word.dataset.echo = profile.words[index];
        kicker.textContent = profile.stages[index];
        document.querySelector('#transit-log').textContent = profile.logs[index];
      }, profile.key);
      // Show the target only at the end, so dialogs cannot jump above the cinematic layer early.
      timers.push(setTimeout(performSwap, duration - 110));
      timers.push(setTimeout(() => settle(true), duration));
    });
  }
  async function openDialog(dialog) {
    const result = await transition('打开 / ' + (dialog.getAttribute('aria-labelledby') ? document.getElementById(dialog.getAttribute('aria-labelledby'))?.textContent : '交互窗口'), () => {}, {dialog: true, variant:dialog.id==='photo-viewer'?'gallery':dialog.id});
    if (!result) return;
    if (!dialog.open) dialog.showModal();
    if (level() !== 'off') {
      dialog.classList.remove('dialog-enter');
      void dialog.offsetWidth;
      dialog.classList.add('dialog-enter');
    }
    dialog.querySelector('#cancel-clear')?.focus();
    return true;
  }
  document.querySelector('#transition-skip').addEventListener('click', () => active?.finish());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) { event.preventDefault(); active.finish(); }
    if (event.key === 'Tab' && active) { event.preventDefault(); document.querySelector('#transition-skip').focus(); }
  });
  document.addEventListener('pointerdown', event => {
    const target = event.target.closest('button,a');
    if (!target || level() !== 'full' || target.disabled) return;
    const bounds = target.getBoundingClientRect(), spark = document.createElement('span');
    spark.className = 'click-pulse';
    spark.style.left = (event.clientX - bounds.left) + 'px';
    spark.style.top = (event.clientY - bounds.top) + 'px';
    spark.setAttribute('aria-hidden', 'true');
    target.append(spark);
    setTimeout(() => spark.remove(), 600);
  });
  system.addEventListener('change', apply);
  document.addEventListener('visibilitychange', () => { if(document.hidden && active) active.finish(); });
  apply();
  return {level, apply, set, transition, openDialog};
})();

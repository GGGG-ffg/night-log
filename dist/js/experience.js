/* Original Canvas scenery and click-to-enter gate; no media downloads or runtime dependencies. */
Night.experience = (() => {
  const scenery=Night.scenery;
  let enabled=scenery.enabled();
  const settings=document.querySelector('#settings .settings-body');
  const options=document.createElement('div');options.className='experience-options';
  options.innerHTML=`<label class="background-toggle"><input type="checkbox" id="background-toggle" ${enabled?'checked':''}>背景动态叠层 <small>图片上叠加雨线与粒子；关闭后保留静态图片</small></label><button class="small-button" id="replay-intro" type="button">重播开场 / REPLAY INTRO ↗</button>`;
  settings.append(options);
  const pointerOption=document.createElement('label');pointerOption.className='background-toggle';pointerOption.innerHTML='<input type="checkbox" id="pointer-background-toggle" '+(scenery.interactiveEnabled()?'checked':'')+'>鼠标互动背景 <small>移动鼠标推动粒子与城市景深；空白处点击产生扫描波纹</small>';options.prepend(pointerOption);
  pointerOption.querySelector('input').addEventListener('change',e=>Night.toast(scenery.setInteractive(e.target.checked)?'鼠标互动设置已保存':'设置已生效，但浏览器无法保存'));
  document.querySelector('#background-toggle').addEventListener('change',e=>{enabled=e.target.checked;scenery.setEnabled(enabled);Night.toast(Night.store.write('background',enabled)?'背景设置已保存':'设置已生效，但浏览器无法保存');});

  const gate=document.createElement('dialog');gate.id='entry-gate';gate.className='terminal-boot';gate.setAttribute('aria-labelledby','entry-title');
  gate.innerHTML=`<div class="entry-grain" aria-hidden="true"></div><div class="entry-top"><a class="entry-brand" href="#">NIGHT.LOG <span>/ ZERO DIVISION</span></a><button id="entry-skip" type="button">跳过开场 ESC ↗</button></div><div class="entry-body"><div class="entry-editorial"><p class="entry-eyebrow"><i></i> INDEPENDENT NETWORK / EST. 2026</p><div class="entry-wordmark" aria-hidden="true">NΞON<span>零界</span></div><div class="entry-rule"><span>PERSONAL TERMINAL</span><span>NO. 0001 / V6</span></div><h1 id="entry-title">启动个人终端</h1><p class="entry-description" id="entry-status" role="status">SIGNAL STANDBY / 等待接入</p><button class="entry-connect" id="entry-connect" type="button"><span class="connect-main">进入零界<span class="connect-en">JACK IN / START YOUR RUN</span></span><span class="connect-arrow" aria-hidden="true">↗</span></button><p class="entry-footnote">NΞON // 零界 · 个人博客与前端实验档案</p></div><div class="entry-insignia"><div class="insignia-label"><span>ZERO DIVISION</span><span>零 界 製 造</span></div><div class="insignia-frame"><div class="insignia-mark"><svg class="rift-emblem" viewBox="0 0 200 190" aria-hidden="true"><path class="emblem-left" d="M16 24h54l27 48-25 24-22-39H34z"/><path class="emblem-right" d="M130 24h54l-18 33h-17l-25 45-25-25z"/><path class="emblem-bottom" d="M74 111l26-25 27 25-14 54H87z"/><path class="emblem-cut" d="M98 37h8l-6 23h-7z"/></svg></div><span class="insignia-index">01—N</span></div><div class="insignia-caption"><strong>OWN YOUR<br>NEXT CHAPTER.</strong><span>THIS CITY IS<br>YOUR CANVAS_</span></div></div><div class="entry-bootstamp" aria-hidden="true"><span>BREAK THE SYSTEM</span><strong>ACCESS<br>GRANTED</strong></div><div class="entry-sequence" aria-hidden="true"><i></i><span>ZERO DIVISION / BOOT SEQUENCE</span></div></div><div class="entry-bottom"><span>NO GODS. JUST CODE.</span><span>MADE TO CREATE / NOT TO CONFORM</span><span>NIGHT CITY / SECTOR 07</span></div>`;
  const mark=gate.querySelector('.rift-emblem').outerHTML;
  gate.querySelector('.entry-insignia').innerHTML='<div class="insignia-mark">'+mark+'</div><span>ZERO DIVISION / N—0001</span>';
  gate.append(gate.querySelector('.entry-insignia'));
  gate.insertAdjacentHTML('beforeend',`<div class="boot-scanlines" aria-hidden="true"></div><div class="boot-glitch" aria-hidden="true"><i></i><i></i><i></i></div><section class="boot-console" aria-label="启动演出" aria-hidden="true"><div class="boot-console-heading">NIGHT.LOG<br>ZERO DIVISION / 2077<br>//_</div><div class="boot-progress"><i id="boot-fill"></i><span>BOOTING_</span><b id="boot-percent">000%</b></div><p class="boot-subheading">PERSONAL TERMINAL • INITIALIZE</p><pre id="boot-lines"></pre><p class="boot-demo-label">VISUAL BOOT SEQUENCE / 演出进度</p></section><pre class="boot-hex" id="boot-hex" aria-hidden="true"></pre><div class="boot-ready" aria-hidden="true"><span>SYSTEM READY</span><strong>WELCOME<br>TO ZERO.</strong><small>NΞON / NIGHT.LOG</small></div>`);
  document.body.append(gate);
  const boot=Night.boot.create(gate);
  const previewButton=document.createElement('button');previewButton.type='button';previewButton.className='small-button';previewButton.id='preview-transit';previewButton.textContent='预览当前页过场 ↗';options.append(previewButton);
  previewButton.addEventListener('click',()=>{document.querySelector('#settings').close();if(Night.motion.level()!=='full'){Night.toast('当前为轻量或关闭动效；选择完整动效后可预览。');return;}Night.motion.transition('当前页过场预览',()=>{});});
  let timers=[],closed=true,launching=false;
  function clearTimers(){timers.forEach(clearTimeout);timers=[];boot.stop();}
  function finish(){if(closed)return;closed=true;launching=false;clearTimers();gate.classList.remove('launching','gate-reveal');gate.close();scenery.detach();document.documentElement.classList.remove('entry-open');document.querySelector('#main-content')?.focus({preventScroll:true});}
  function launch(){if(launching||closed)return;if(Night.motion.level()!=='full'){finish();return;}launching=true;gate.classList.add('launching');document.querySelector('#entry-connect').disabled=true;boot.start(finish);}
  function replay(){if(gate.open)return;document.querySelectorAll('dialog[open]').forEach(d=>d.close());clearTimers();boot.reset();closed=false;launching=false;gate.classList.remove('launching','gate-reveal');document.querySelector('#entry-title').innerHTML='启动个人终端';document.querySelector('#entry-status').textContent='SIGNAL STANDBY / 等待接入';document.querySelector('#entry-connect').disabled=false;document.documentElement.classList.add('entry-open');gate.showModal();document.querySelector('#entry-connect').focus();}
  gate.addEventListener('cancel',e=>{e.preventDefault();finish();});
  gate.addEventListener('close',()=>{scenery.detach();closed=true;launching=false;clearTimers();document.documentElement.classList.remove('entry-open');});
  document.querySelector('#entry-connect').addEventListener('click',launch);
  document.querySelector('#entry-skip').addEventListener('click',finish);
  gate.querySelector('.entry-brand').addEventListener('click',e=>{e.preventDefault();finish();});
  document.querySelector('#replay-intro').addEventListener('click',replay);
  window.addEventListener('night:motion',()=>{if(launching&&Night.motion.level()!=='full')finish();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&launching)finish();});
  const impactNote=document.createElement('p');impactNote.className='subtle';impactNote.textContent='已恢复改钢琴前的过场：夜城穿梭、档案扫描、线框蓝图、身份扫描与信号波纹；相册沿用同风格胶片动画。Esc可跳过。';previewButton.before(impactNote);
  scenery.refresh();
  const api={isOpen:()=>!closed,replay,finish};
  // Open before the route controller renders. The content underneath stays keyboard-inert.
  replay();
  return api;
})();

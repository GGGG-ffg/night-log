/* Transparent rain/pointer overlay for route images; cached skyline is only for an attached host. */
Night.scenery = (() => {
  const canvas=document.createElement('canvas');canvas.id='ambient-scene';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
  const ctx=canvas.getContext('2d');
  let width=0,height=0,frame=0,last=0,on=Night.store.read('background',true)!==false,host=null;
  let layers=[],field=null,interactive=Night.store.read('pointer-background',true)!==false,lastDraw=0;
  function canInteract(){return on&&interactive&&!host&&!document.hidden&&Night.motion.level()==='full'&&!document.querySelector('dialog[open]')&&!document.documentElement.classList.contains('is-routing');}
  function drawField(state){
    if(state.opacity<.015)return;
    const a=state.opacity;
    ctx.save();ctx.globalCompositeOperation='screen';
    const glow=ctx.createRadialGradient(state.x,state.y,0,state.x,state.y,85);
    glow.addColorStop(0,'#65e9ed14');glow.addColorStop(.45,'#2b8bac08');glow.addColorStop(1,'#62e9e900');ctx.globalAlpha=a;ctx.fillStyle=glow;ctx.fillRect(state.x-85,state.y-85,170,170);
    for(let i=1;i<state.trail.length;i++){const p=state.trail[i],prev=state.trail[i-1];ctx.strokeStyle='#91fff1';ctx.globalAlpha=p.life*.6*a;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);ctx.stroke();}
    const near=state.nodes.filter(n=>Math.hypot(n.x-state.x,n.y-state.y)<240);
    for(const n of near){
      const distance=Math.hypot(n.x-state.x,n.y-state.y),opacity=Math.pow(1-distance/240,.55)*a;
      ctx.strokeStyle='#83f7f0';ctx.lineWidth=1.15;ctx.globalAlpha=opacity*.68;ctx.beginPath();ctx.moveTo(state.x,state.y);ctx.lineTo(n.x,n.y);ctx.stroke();
      ctx.fillStyle='#65e9ed';ctx.globalAlpha=opacity*.18;ctx.fillRect(n.x-n.size,n.y-n.size,n.size*3,n.size*3);
      ctx.fillStyle='#d5fff8';ctx.globalAlpha=opacity;ctx.fillRect(n.x-n.size/2,n.y-n.size/2,n.size,n.size);
    }
    for(let i=0;i<near.length;i++)for(let j=i+1;j<near.length;j++){const n=near[i],m=near[j],d=Math.hypot(n.x-m.x,n.y-m.y);if(d>115)continue;ctx.globalAlpha=(1-d/115)*.6*a;ctx.strokeStyle='#80f3ed';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(m.x,m.y);ctx.stroke();}
    for(const r of state.rings){ctx.strokeStyle='#d3ff38';ctx.lineWidth=1.2;ctx.globalAlpha=(1-r.age/.9)*.55;ctx.beginPath();ctx.arc(r.x,r.y,12+r.age*85,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  const rand=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  function makeLayer(depth){
    const c=document.createElement('canvas');c.width=width+100;c.height=height;const g=c.getContext('2d');if(!g)return c;
    const base=height*(.9+depth*.04),unit=width<700?40:66;
    for(let x=-30,i=0;x<width+100;i++){
      const seed=i+depth*39,w=unit*(.6+rand(seed)*1.3),h=height*(.12+rand(seed+17)*(.2+depth*.06));
      const y=base-h;
      g.fillStyle=['#161328','#10151f','#050a11'][depth];g.fillRect(x,y,w,h+height*.15);
      g.strokeStyle=['#ed345923','#64e9ed25','#caff2625'][depth];g.lineWidth=1;g.strokeRect(x,y,w,h);
      if(i%4===0){g.fillStyle='#0a0d15';g.fillRect(x+w*.25,y-16,w*.5,17);g.strokeStyle='#ff385b55';g.beginPath();g.moveTo(x+w*.5,y-16);g.lineTo(x+w*.5,y-46);g.stroke();g.fillStyle='#ff4b65';g.fillRect(x+w*.5-1,y-48,3,3);}
      for(let row=0;row<Math.floor(h/17);row++)for(let col=0;col<Math.floor(w/11);col++){
        if(rand(seed*21+row*3+col*7)<.55)continue;
        g.fillStyle=['#fb466258','#6eefff52','#d2ed7270'][(i+col)%3];g.fillRect(x+5+col*11,y+9+row*17,3,5);
      }
      if(depth===1&&i%5===1){
        const signX=x+w*.67,signY=y+h*.13,signH=Math.min(110,h*.55);
        g.fillStyle='#fd3652';g.fillRect(signX,signY,20,signH);g.fillStyle='#0a0710';g.font='bold 12px Microsoft YaHei';
        ['零','界','製','造'].forEach((s,j)=>{if(j*20+20<signH)g.fillText(s,signX+4,signY+18+j*20);});
      }
      if(depth===2&&i%6===2){g.fillStyle='#70e9e4';g.fillRect(x-8,y+h*.3,w*.9,23);g.fillStyle='#081215';g.font='bold 9px monospace';g.fillText('NO SIGNAL',x-3,y+h*.3+15);}
      x+=w+4+rand(seed+8)*10;
    }
    return c;
  }
  function render(time){
    if(!ctx)return;ctx.clearRect(0,0,width,height);
    const moving=on&&Night.motion.level()==='full'&&!document.hidden,t=moving?time/1000:0;
    const linked=canInteract();if(!linked)field?.leave();
    const state=field?.step(moving?Math.min(.05,(time-lastDraw)/1000):0);lastDraw=time;
    const p=moving&&interactive&&linked?(state.x/Math.max(1,width)-.5)*48:0;
    const py=moving&&interactive&&linked?(state.y/Math.max(1,height)-.5)*22:0;
    document.documentElement.classList.toggle('pointer-linked',linked&&state.active);
    document.documentElement.style.setProperty('--wall-x',p*.28+'px');document.documentElement.style.setProperty('--wall-y',py*.28+'px');
    if(host){
    const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#080911');sky.addColorStop(.55,'#201326');sky.addColorStop(1,'#060a12');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
    const sunX=width*.76+p*.3,sunY=height*.35+py*.3,r=height*.21;
    const halo=ctx.createRadialGradient(sunX,sunY,r*.3,sunX,sunY,r*2.4);halo.addColorStop(0,'#ff264728');halo.addColorStop(.55,'#c61a3820');halo.addColorStop(1,'#ff264700');ctx.fillStyle=halo;ctx.fillRect(0,0,width,height);
    ctx.save();ctx.beginPath();ctx.arc(sunX,sunY,r,0,Math.PI*2);ctx.clip();ctx.fillStyle='#f4344b2b';ctx.fillRect(sunX-r,sunY-r,r*2,r*2);
    ctx.fillStyle='#080b1366';for(let i=0;i<10;i++)ctx.fillRect(sunX-r,sunY+r*.1+i*11,r*2,2+i*.5);ctx.restore();
    // Far traffic crosses behind the cached buildings.
    for(let i=0;i<4;i++){const x=((t*(18+i*6)+rand(i+40)*width)%(width+180))-90,y=height*(.35+i*.065);ctx.strokeStyle=i%2?'#c9fc6566':'#60e8ef70';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+35,y);ctx.stroke();ctx.fillStyle=i%2?'#d6ff66':'#93ffff';ctx.fillRect(x+34,y-1,3,2);}
    layers.forEach((layer,i)=>{ctx.globalAlpha=host ? .94 : .6;ctx.drawImage(layer,-50+p*(i+1)*.57,Math.sin(t*.12+i)*2+py*(i+1)*.32);});ctx.globalAlpha=1;
    const mist=ctx.createLinearGradient(0,height*.65,0,height);mist.addColorStop(0,'#080d1100');mist.addColorStop(1,'#07121b');ctx.fillStyle=mist;ctx.fillRect(0,height*.65,width,height*.35);
    }
    // Rain uses deterministic positions, bounded count, and depth-dependent velocity.
    const count=width<700?65:150;
    for(let i=0;i<count;i++){const z=.35+rand(i+700),x=((rand(i+16)*width-t*34*z)%(width+80)+width+80)%(width+80)-40,y=(rand(i+83)*height+t*(180+z*290))%(height+50)-25;ctx.strokeStyle=i%9===0?'#f8799a35':'#9ed5f329';ctx.lineWidth=z>.9?1:.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4*z,y+18*z);ctx.stroke();}
    for(let i=0;i<15;i++){const x=rand(i+901)*width,y=height*(.84+rand(i+13)*.16),w=20+rand(i+4)*100;ctx.fillStyle=i%2?'#5cddf420':'#fa375c25';ctx.fillRect(x+Math.sin(t*.8+i)*5,y,w,1+rand(i+77)*2);}
    // Infrequent chromatic streaks at the edges add motion without flashing the text area.
    const rush=(t%10)/10;if(rush<.18){ctx.globalAlpha=(1-rush/.18)*.2;ctx.fillStyle='#caff33';const x=width*(rush/.18);ctx.beginPath();ctx.moveTo(x-200,height*.5);ctx.lineTo(x,height*.45);ctx.lineTo(x-60,height*.49);ctx.lineTo(x-260,height*.54);ctx.fill();ctx.globalAlpha=1;}
    if(moving&&interactive&&linked)drawField(state);
    const feed=document.querySelector('#city-feed');
    const caption=document.querySelector('.hero-art .art-bottom>span:first-child');
    if(caption){const text=!on?'CITY FRAME / STATIC':Night.motion.level()!=='full'?'STATIC / REDUCED MOTION':!interactive?'CITY FRAME / RAIN OVERLAY':linked&&state.active?'MOUSE LINK / CONNECTED':'MOUSE LINK / MOVE TO INTERACT';if(caption.textContent!==text)caption.textContent=text;}
    if(feed&&!host&&!Night.wallpapers){const fw=Math.round(feed.clientWidth*1.2),fh=Math.round(feed.clientHeight*1.2);if(fw&&fh){if(feed.width!==fw||feed.height!==fh){feed.width=fw;feed.height=fh;}feed.getContext('2d')?.drawImage(canvas,0,0,canvas.width,canvas.height,0,0,fw,fh);}}
    if(!on&&!host)ctx.clearRect(0,0,width,height);
  }
  function tick(time){if(document.hidden||!on||Night.motion.level()!=='full'){frame=0;return;}if(time-last>32){render(time);last=time;}frame=requestAnimationFrame(tick);}
  function refresh(){cancelAnimationFrame(frame);frame=0;last=0;lastDraw=performance.now();field?.reset();render(performance.now());document.documentElement.dataset.background=on?'on':'off';document.documentElement.dataset.pointerBackground=interactive?'on':'off';if(on&&!document.hidden&&Night.motion.level()==='full')frame=requestAnimationFrame(tick);}
  function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.35);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';ctx?.setTransform(dpr,0,0,dpr,0,0);layers=[0,1,2].map(makeLayer);field=Night.pointerField.create(width,height,width<700?30:64);refresh();}
  window.addEventListener('resize',resize);window.addEventListener('night:motion',refresh);document.addEventListener('visibilitychange',refresh);
  window.addEventListener('pointermove',e=>{if(canInteract()&&(e.pointerType==='mouse'||e.pointerType==='pen'))field.move(e.clientX,e.clientY);},{passive:true});
  window.addEventListener('pointerdown',e=>{if(!canInteract()||e.pointerType!=='mouse'||e.target.closest('a,button,input,textarea,select,label,dialog'))return;field.pulse(e.clientX,e.clientY);},{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>field?.leave());window.addEventListener('blur',()=>field?.leave());
  resize();
  return{enabled:()=>on,interactiveEnabled:()=>interactive,setInteractive(value){interactive=!!value;refresh();return Night.store.write('pointer-background',interactive);},setEnabled(value){on=value;refresh();},refresh,attach(dialog){host=dialog;dialog.prepend(canvas);refresh();},detach(){host=null;document.body.prepend(canvas);refresh();}};
})();

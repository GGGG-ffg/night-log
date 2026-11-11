/* Code-drawn pixel characters and city; no external sprites or game assets. */
Night.runnerPaint = (ctx,canvas,s) => {
  if(!ctx)return;
  const w=s.width,h=s.height,p=s.player,t=s.time;
  ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);ctx.clearRect(0,0,w,h);
  const accent=['#68eee7','#d3ff38','#ff7085','#bd9cff'][(s.level-1)%4];
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#080c1c');sky.addColorStop(1,'#29192f');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#ff335332';ctx.beginPath();ctx.arc(w*.79,96,57,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#151027';for(let i=0;i<7;i++)ctx.fillRect(w*.79-60,65+i*10,120,3);
  for(let layer=0;layer<2;layer++)for(let i=0;i<20;i++){const x=((i*71-s.distance*(layer?.23:.1))%(w+110)+w+110)%(w+110)-80,bh=35+i*37%105;ctx.fillStyle=layer?'#101b29':'#101323';ctx.fillRect(x,s.ground-bh,53,bh);ctx.fillStyle=(i%3===0?'#ff5475':accent)+(layer?'55':'25');for(let j=0;j<4;j++)for(let k=0;k<3;k++)ctx.fillRect(x+8+j*10,s.ground-bh+12+k*19,3,5);if(layer&&i%4===0){ctx.fillStyle='#ff5475';ctx.fillRect(x+8,s.ground-bh+10,6,32);}}
  ctx.strokeStyle='#77d8d51c';ctx.lineWidth=1;for(let i=0;i<16;i++){const x=(i*83-t*75)%(w+80);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-30,50);ctx.stroke();}
  ctx.fillStyle='#080f1b';ctx.fillRect(0,s.ground,w,h-s.ground);ctx.fillStyle=accent;ctx.fillRect(0,s.ground,w,2);
  ctx.fillStyle=accent+'70';for(let i=0;i<25;i++){const x=((i*61-s.distance)%(w+80)+w+80)%(w+80)-50;ctx.fillRect(x,s.ground+22,24,2);}
  ctx.fillStyle='#152a34';ctx.fillRect(0,310,w,10);
  function rect(x,y,rw,rh,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),rw,rh);}
  if(s.arena){
    rect(0,0,w,s.ground,'#07111ec4');
    const industrial=s.arena==='anvil',c=industrial?'#ffb34f':'#bd9cff';
    if(industrial){
      for(let i=0;i<6;i++){const x=38+i*w/5;rect(x,35,8,230,'#233442');rect(x+2,35,2,230,'#61707855');rect(x-15,68,38,7,'#3c4651');}
      rect(0,38,w,12,'#263440');for(let i=0;i<w;i+=42){rect(i,39,21,4,'#ffb34f70');rect(i+13,43,21,4,'#111b2b');}
      for(let i=0;i<3;i++){rect(w*.1+i*w*.32,113,80,62,'#172635');rect(w*.1+5+i*w*.32,119,70,48,'#0e1927');for(let j=0;j<4;j++)rect(w*.1+13+j*15+i*w*.32,126,5,31,'#ff875f35');}
    }else{
      ctx.strokeStyle='#bd9cff35';ctx.lineWidth=1;for(let r=70;r<230;r+=39){ctx.beginPath();ctx.arc(w*.7,136,r,0,Math.PI*2);ctx.stroke();}
      for(let i=0;i<w;i+=54){rect(i,32,2,15,'#bd9cff70');rect(i+19,42,2,48,'#394963');}
      rect(22,75,82,16,'#182943');ctx.font='9px monospace';ctx.fillStyle='#bd9cff';ctx.fillText('IRIS / OPTICS',29,86);
    }
    rect(0,s.ground+3,w,46,'#101e2b');for(let i=0;i<w;i+=24)rect(i,s.ground+10,12,2,c+'55');rect(0,s.ground,w,2,c);
    for(const p of s.platforms){
      const color=p.active?(p.armed&&p.left<.85?'#ff5475':'#68eee7'):'#466277',label=p.active?(p.armed?p.left.toFixed(1)+'s':'3s READY'):'↻ '+p.cooldown.toFixed(1)+'s';
      ctx.globalAlpha=p.active?1:.35;rect(p.x,p.y,p.w,p.h,'#1b3c4b');rect(p.x,p.y,p.w,2,color);for(let i=0;i<p.w;i+=16)rect(p.x+i+3,p.y+3,8,3,color+'90');
      ctx.strokeStyle=color;ctx.strokeRect(p.x,p.y,p.w,p.h);ctx.globalAlpha=1;
      if(p.active&&p.armed)rect(p.x,p.y+10,p.w*p.left/3,2,color);
      ctx.fillStyle=color;ctx.font='9px monospace';ctx.fillText(p.id+' / '+label,p.x+3,p.y-6);
      rect(p.x+7,p.y+p.h+2,4,4,color+'60');rect(p.x+p.w-11,p.y+p.h+2,4,4,color+'60');
    }
  }
  function label(e,color){ctx.font='8px monospace';const text=Night.runnerModel.factions[e.faction].tag;const tw=ctx.measureText(text).width;rect(e.x+e.w/2-tw/2-4,e.y-19,tw+8,12,'#080d1cdd');ctx.fillStyle=color;ctx.fillText(text,e.x+e.w/2-tw/2,e.y-10);if(e.windup>0){rect(e.x+e.w/2-4,e.y-32,8,8,'#ff5475');}if(e.maxHp>1){rect(e.x,e.y-4,e.w,2,'#493245');rect(e.x,e.y-4,e.w*e.hp/e.maxHp,2,color);}}
  for(const e of s.enemies){
    const c=Night.runnerModel.factions[e.faction].color,x=e.x,y=e.y,step=Math.sin(t*18+e.phase)*5;
    // Long exhaust trails show opposing movement before the silhouette reaches the player.
    rect(x+e.w,y+e.h*.7,26,2,c+'60');
    if(e.kind==='drone'){
      rect(x+4,y+9,44,13,'#352c55');rect(x+16,y+4,20,22,c);rect(x+20,y+9,12,10,'#100e25');rect(x+22,y+12,8,4,'#ff5475');
      rect(x,y+3,12,4,c);rect(x+40,y+3,12,4,c);rect(x-5,y-1,22,2,'#dfcaff');rect(x+35,y-1,22,2,'#dfcaff');
      rect(x+5,y+23,3,6,'#85f3ed');rect(x+44,y+23,3,6,'#85f3ed');
    }else{
      const heavy=e.kind==='sentry',head=heavy?13:10;
      rect(x+9,y,head+4,head,c);rect(x+5,y+head,e.w-10,e.h-head-10,heavy?'#503252':'#27313b');
      rect(x+9,y+head+2,e.w-18,12,c);rect(x+3,y+head+5,7,16,c);rect(x+e.w-9,y+head+4,7,17,c);
      rect(x+7,y+e.h-10,8,10+step,c);rect(x+e.w-15,y+e.h-10,8,10-step,c);
      rect(x+11,y+4,head,4,'#090b17');
      if(e.kind==='cyborg'){for(let i=0;i<3;i++)rect(x+10+i*5,y+4,3,3,'#ff315f');rect(x-5,y+19,11,5,'#ff5475');}
      else{rect(x+11,y+4,6,3,e.kind==='scav'?'#fff1a5':'#ff5475');rect(x-4,y+e.h*.53,16,5,'#98a6ba');}
      if(heavy){rect(x,y+14,9,13,c);rect(x+e.w-9,y+14,9,13,c);}
    }
    label(e,c);
  }
  // Boss windups mark the exact lane / locked position before damage becomes active.
  const boss=s.boss;
  if(boss&&boss.state==='telegraph'){
    const pulse=.13+Math.sin(t*18)*.05;ctx.fillStyle='rgba(255,70,110,'+pulse+')';ctx.strokeStyle='#ff5475';ctx.lineWidth=1;
    if(boss.pattern==='wave'||boss.pattern==='sweep'){ctx.fillRect(0,s.ground-26,boss.x,26);ctx.beginPath();ctx.moveTo(0,s.ground-26);ctx.lineTo(boss.x,s.ground-26);ctx.stroke();}
    if(boss.pattern==='column'){ctx.fillRect(boss.markX-20,0,40,s.ground);ctx.strokeRect(boss.markX-20,0,40,s.ground);}
    if(boss.pattern==='rain'){const n=boss.phase===2?5:3;for(let i=0;i<n;i++){const x=w*.12+i*w*.16;ctx.fillRect(x-8,0,16,s.ground);}}
    if(boss.pattern==='mines'||boss.pattern==='mortar'){const n=boss.pattern==='mines'?(boss.phase===2?5:3):(boss.phase===2?3:2),gap=boss.pattern==='mines'?65:95;for(let i=0;i<n;i++){const x=Math.max(boss.pattern==='mines'?12:20,Math.min(boss.x-(boss.pattern==='mines'?50:25),boss.markX+(i-(n-1)/2)*gap));ctx.fillRect(x-20,s.ground-42,40,42);ctx.strokeRect(x-20,s.ground-42,40,42);}}
    if(boss.pattern==='highbeam'||boss.pattern==='cross'){ctx.fillRect(0,boss.markY-7,boss.x,14);ctx.strokeRect(0,boss.markY-7,boss.x,14);if(boss.pattern==='cross'){ctx.fillRect(boss.markX-15,0,30,s.ground);ctx.strokeRect(boss.markX-15,0,30,s.ground);}}
    if(boss.pattern==='ring'){const n=boss.phase===2?12:8;ctx.strokeStyle='#bd9cff88';for(let i=0;i<n;i++){const a=i/n*Math.PI*2+.13;ctx.beginPath();ctx.moveTo(boss.x+boss.w/2+Math.cos(a)*52,boss.y+44+Math.sin(a)*52);ctx.lineTo(boss.x+boss.w/2+Math.cos(a)*105,boss.y+44+Math.sin(a)*105);ctx.stroke();}}
    if(boss.pattern==='curtain'){const n=boss.phase===2?7:5;for(let i=0;i<n;i++){const x=w*.08+i*(boss.x-w*.12)/(n-1);ctx.fillRect(x-6,25,12,s.ground-25);}}
    if(boss.pattern==='fan'){const a=Math.atan2(boss.aimY-(boss.y+44),boss.aimX-boss.x),n=boss.phase===2?5:3;ctx.setLineDash([5,7]);for(let i=0;i<n;i++){const r=a+(i-(n-1)/2)*.24;ctx.beginPath();ctx.moveTo(boss.x,boss.y+44);ctx.lineTo(boss.x+Math.cos(r)*w,boss.y+44+Math.sin(r)*w);ctx.stroke();}ctx.setLineDash([]);}
  }
  for(const a of s.hazards){ctx.fillStyle=a.color+(a.warmup>0?'25':'a0');ctx.fillRect(a.x,a.y,a.w,a.h);ctx.strokeStyle=a.warmup>0?a.color:'#fff5fb';ctx.setLineDash(a.warmup>0?[4,4]:[]);ctx.strokeRect(a.x,a.y,a.w,a.h);ctx.setLineDash([]);if(a.warmup>0){ctx.font='9px monospace';ctx.fillStyle=a.color;ctx.fillText(a.warmup.toFixed(1),a.x+6,a.y-5);}}
  if(boss){
    const x=boss.x,y=boss.y,c=boss.flash>0?'#fff3e0':boss.phase===2?'#ff5475':boss.kind==='anvil'?'#ffb34f':'#bd9cff';
    if(boss.kind==='anvil'){
      rect(x+13,y+80,29,39,'#263744');rect(x+67,y+80,29,39,'#263744');rect(x+9,y+115,39,15,c);rect(x+62,y+115,41,15,c);
      for(let i=0;i<3;i++){rect(x+18,y+86+i*8,20,3,'#8a9ba5');rect(x+71,y+86+i*8,20,3,'#8a9ba5');}
      rect(x+13,y+25,84,62,'#273641');rect(x+22,y+19,66,56,'#56616b');rect(x+25,y+26,60,44,'#172131');
      rect(x-12,y+29,30,24,c);rect(x+91,y+25,30,27,c);rect(x-18,y+52,22,36,'#6b747f');rect(x+107,y+46,22,37,'#6b747f');rect(x-25,y+75,37,16,c);rect(x+99,y+74,35,17,c);
      rect(x+33,y,46,22,c);rect(x+39,y+7,32,10,'#0b1022');rect(x+42,y+10,25,3,'#ff5475');
      ctx.strokeStyle=c;ctx.lineWidth=4;ctx.beginPath();ctx.arc(x+56,y+49,15,0,Math.PI*2);ctx.stroke();rect(x+50,y+43,12,12,c);
      for(let i=0;i<4;i++){rect(x+27+i*14,y+77,8,5,c);rect(x+20+i*19,y+31,4,3,'#b7c4c8');}
    }else{
      ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x+49,y+44,49,35,0,0,Math.PI*2);ctx.stroke();
      rect(x+4,y+29,90,31,'#3e3458');rect(x+17,y+15,64,58,'#5b5071');rect(x+22,y+21,54,46,'#121a2d');
      ctx.fillStyle='#f3e7fa';ctx.beginPath();ctx.ellipse(x+49,y+44,24,15,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=c;ctx.beginPath();ctx.arc(x+46+Math.sin(t)*4,y+44,12,0,Math.PI*2);ctx.fill();rect(x+44,y+36,6,16,'#11152b');
      for(let i=0;i<3;i++){const a=t*1.2+i*Math.PI*2/3,ax=x+49+Math.cos(a)*63,ay=y+44+Math.sin(a)*46;rect(ax-6,ay-5,12,10,c);rect(ax-3,ay-2,6,4,'#f3e7fa');}
      rect(x+25,y+79,9,9,c);rect(x+62,y+79,9,9,c);rect(x+29,y+88,3,6,'#68eee7');rect(x+65,y+88,3,6,'#68eee7');
    }
    ctx.font='9px monospace';ctx.fillStyle=c;ctx.textAlign='center';ctx.fillText(boss.phase===2?'PHASE II / ENRAGED':'RESTRICTED / BOSS',x+boss.w/2,y-12);ctx.textAlign='left';
  }
  // Layered original courier: hood, visor, skin, scarf, coat, joints, armor and weapon posture.
  const px=p.x,py=p.y;
  if(s.dashLeft>0){for(let i=3;i>0;i--){ctx.globalAlpha=.12;rect(px-i*10*s.dashDir+6,py+1,22,14,'#68eee7');rect(px-i*10*s.dashDir+2,py+16,28,27,'#68eee7');}ctx.globalAlpha=1;}
  if((s.invulnerable<=0&&!s.dashProtected)||Math.floor(t*20)%2===0){
    const stride=s.mode==='running'&&p.vy===0?Math.sin(t*18)*5:0,coat=Math.sin(t*10)*3,air=p.y<s.ground-p.h-.1;
    ctx.fillStyle='#162935';ctx.beginPath();ctx.moveTo(px+3,py+18);ctx.lineTo(px+23,py+24);ctx.lineTo(px+29,py+42);ctx.lineTo(px-8+coat,py+39);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#68eee7';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px-8+coat,py+39);ctx.lineTo(px+3,py+18);ctx.stroke();
    rect(px-3,py+17,7,18,'#aa3454');rect(px-2,py+20,4,5,'#ff5475');
    rect(px+5,py+29,10,12,'#1b253a');rect(px+20,py+29,9,12,'#172536');
    rect(px+6,py+37+(air?-3:stride),7,9,'#617987');rect(px+21,py+37+(air?0:-stride),7,9,'#4b6373');
    rect(px+5,py+38+(air?-3:stride),8,3,'#68eee7');rect(px+20,py+38+(air?0:-stride),8,3,'#b0c7cd');
    rect(px+4,py+45+(air?-3:stride),11,4,'#0b1220');rect(px+20,py+45+(air?0:-stride),12,4,'#0b1220');
    rect(px+4,py+13,24,19,'#335264');rect(px+8,py+15,13,13,'#64808a');rect(px+8,py+15,3,12,'#9ee7db');rect(px+16,py+16,5,8,'#172b3b');
    rect(px+4,py+30,25,4,'#111a29');for(let i=0;i<4;i++)rect(px+8+i*4,py+30,2,4,'#bd9a5b');
    rect(px+5,py+1,24,14,'#122c3b');rect(px+8,py-1,17,4,'#355162');rect(px+7,py+1,3,9,'#68eee7');
    rect(px+18,py+4,12,9,'#d3a792');rect(px+15,py+4,16,5,'#071321');rect(px+18,py+5,12,2,'#a6fff0');rect(px+21,py+11,8,3,'#826d73');
    rect(px+3,py+12,24,4,'#c63e62');rect(px-8-Math.sin(t*11)*3,py+14,17,3,'#ff5475');
    rect(px+1,py+18,7,10,'#203b50');rect(px+2,py+25,7,5,'#81969d');
    const gun=Night.runnerModel.weapons[s.weapon],reload=s.reloadLeft>0;
    rect(px+22,py+17,8,10,'#243b50');rect(px+26,py+21,11,5,'#a3b2b7');
    if(reload){rect(px+29,py+24,7,15,'#20313e');rect(px+32,py+28,5,8,gun.color);rect(px+16,py+27,13,4,'#d3a792');}
    else{if(gun.id==='lobber'){rect(px+34,py+25,13,12,gun.color);rect(px+41,py+16,19,13,'#738996');rect(px+47,py+18,12,8,'#152436');}if(gun.id==='trident'){for(let i=0;i<3;i++)rect(px+38,py+14+i*5,22,3,gun.color);}if(gun.id==='ricochet'){ctx.strokeStyle=gun.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(px+48,py+22,10,0,Math.PI*2);ctx.stroke();}rect(px+30,py+19,gun.id==='rail'?30:gun.id==='rifle'?27:gun.id==='scatter'?22:16,7,'#627b8a');rect(px+34,py+18,gun.id==='rail'?23:14,3,gun.color);rect(px+34,py+26,5,6,'#1b283a');rect(px+30,py+22,4,4,'#d3a792');}
    if(s.jumpHeld&&p.vy<0){rect(px+5,py+45,4,7,'#68eee7');rect(px+23,py+45,4,5,'#ffb34f');}
    if(s.invulnerable>0||s.dashProtected){ctx.strokeStyle='#68eee7b0';ctx.strokeRect(px-8,py-5,48,59);}
  }
  for(const a of s.hostiles){
    if(a.delay>0){rect(a.x-2,18,15,3,a.color);continue;}
    ctx.fillStyle=a.color;ctx.strokeStyle='#ffe4ee';ctx.lineWidth=1;
    if(a.kind==='wave'){ctx.beginPath();ctx.moveTo(a.x,a.y+a.h);ctx.lineTo(a.x+7,a.y+5);ctx.lineTo(a.x+14,a.y+12);ctx.lineTo(a.x+20,a.y);ctx.lineTo(a.x+24,a.y+a.h);ctx.closePath();ctx.fill();}
    else{ctx.beginPath();ctx.arc(a.x+a.w/2,a.y+a.h/2,a.w/2,0,Math.PI*2);ctx.fill();ctx.stroke();}
  }
  for(const b of s.bullets){if(b.kind==='grenade'||b.kind==='ricochet'){ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x+5,b.y+3,b.kind==='grenade'?6:4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f2e9d9';ctx.lineWidth=1;ctx.stroke();}ctx.strokeStyle=b.color||'#d3ff38';ctx.lineWidth=b.w>20?4:2;ctx.beginPath();ctx.moveTo(b.x-b.vx*.014,b.y-b.vy*.014);ctx.lineTo(b.x+7,b.y);ctx.stroke();rect(b.x+5,b.y-2,6,4,b.color||'#f4ffd2');}
  for(const e of s.effects){ctx.globalAlpha=Math.max(0,e.life/e.maxLife);rect(e.x,e.y,3,3,e.color);}ctx.globalAlpha=1;
  ctx.font='10px monospace';ctx.fillStyle='#8caaa9';ctx.fillText('SECTOR '+String(s.level).padStart(2,'0')+' / '+(s.practice?'PRACTICE · NO RECORD':s.stage==='boss'?'BOSS LOCKDOWN':'ROGUE PROTOCOL'),18,23);
  const incoming=s.enemies.find(e=>e.x>w-160);if(incoming){const f=Night.runnerModel.factions[incoming.faction];ctx.textAlign='right';ctx.fillStyle=f.color;ctx.fillText((incoming.kind==='drone'?'AIR':'GROUND')+' ◀ '+f.tag,w-18,23);ctx.textAlign='left';}
  if(s.noticeTime>0){ctx.font='bold 12px monospace';const tw=ctx.measureText(s.notice).width;rect(w/2-tw/2-12,40,tw+24,27,'#090f20e8');ctx.fillStyle=s.hp<=1?'#ff5475':accent;ctx.textAlign='center';ctx.fillText(s.notice,w/2,58);ctx.textAlign='left';}
};

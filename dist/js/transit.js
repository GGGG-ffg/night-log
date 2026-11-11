/* Original perspective city flight. Allocates and animates only while a sequence runs. */
Night.transit = {
  create(canvas) {
    const ctx = canvas.getContext('2d');
    let frame = 0, started = 0, duration = 3400, last = -100, update = () => {}, width = 0, height = 0, scene = 'home';
    const blocks = Array.from({length: 64}, (_, i) => ({
      side: i % 2 ? 1 : -1, x: 280 + (i * 137 % 790), z: 100 + (i * 293 % 3400),
      w: 65 + (i * 47 % 140), h: 120 + (i * 71 % 590), d: 60 + (i * 31 % 130)
    }));
    function size() {
      width = innerWidth; height = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.4);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function stop() { cancelAnimationFrame(frame); frame = 0; window.removeEventListener('resize', size); }
    function alternate(p) {
      const w=width,h=height,t=p*8,cx=w*.72,cy=h*.44,s=Math.min(w,h)*.28;
      const accent=Night.channels.get(scene).accent;
      ctx.globalAlpha=1;ctx.fillStyle='#060a12';ctx.fillRect(0,0,w,h);
      const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,w*.7);glow.addColorStop(0,accent+'25');glow.addColorStop(1,'#06081000');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
      const line=(x1,y1,x2,y2,a=.3)=>{ctx.strokeStyle=accent;ctx.globalAlpha=a;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
      const rect=(x,y,rw,rh,a=.3)=>{ctx.globalAlpha=a;ctx.strokeStyle=accent;ctx.strokeRect(x,y,rw,rh);};
      if(scene==='journal'||scene==='post'||scene==='terminal') {
        ctx.font='11px monospace';
        for(let x=0;x<w;x+=38)for(let i=0;i<8;i++) {const y=(i*83+x*7+t*(scene==='post'?-42:65))%h;ctx.globalAlpha=.09+i*.017;ctx.fillStyle=accent;ctx.fillText(((x+i*73)%255).toString(16).padStart(2,'0').toUpperCase(),x,y);}
        for(let i=0;i<7;i++) {const q=((p*1.4+i/7)%1),rw=s*(.4+q*1.6),rh=rw*1.3,x=cx-rw/2+(i-3)*18,y=cy-rh/2;rect(x,y,rw,rh,.15+q*.35);for(let n=0;n<5;n++)line(x+rw*.15,y+rh*(.25+n*.12),x+rw*.8,y+rh*(.25+n*.12),.12+q*.2);}
        const y=(p*2%1)*h;line(0,y,w,y,.65);ctx.globalAlpha=.04;ctx.fillStyle=accent;ctx.fillRect(0,y-40,w,40);
      } else if(scene==='projects'||scene==='reader') {
        for(let x=0;x<w;x+=48)line(x,0,x,h,.06);for(let y=0;y<h;y+=48)line(0,y,w,y,.06);
        const points=[];
        for(const z of [-1,1])for(const y of [-1,1])for(const x of [-1,1]) {const angle=t*.5,xx=x*Math.cos(angle)-z*Math.sin(angle),zz=x*Math.sin(angle)+z*Math.cos(angle);const yy=y*Math.cos(.35)-zz*Math.sin(.35),depth=zz*Math.cos(.35)+y*Math.sin(.35);const scale=s/(3.7+depth);points.push([cx+xx*scale,cy+yy*scale]);}
        for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)if([1,2,4].includes(i^j))line(...points[i],...points[j],.8);
        for(let i=0;i<4;i++){const off=(1-p)*80+i*13;rect(cx-s*.75-off,cy-s*.75-off,s*1.5,s*1.5,.15);}
        for(let i=0;i<8;i++){const x=cx+Math.cos(i*.9+t*.2)*s*1.35,y=cy+Math.sin(i*.9+t*.2)*s;line(x,y,cx,cy,.12);rect(x-4,y-4,8,8,.7);}
      } else if(scene==='about') {
        // A stylized wireframe portrait, not a biometric sensor.
        for(let i=0;i<20;i++){const y=-1+i/10,rx=Math.sqrt(Math.max(0,1-y*y))*s*.48;ctx.globalAlpha=.25;ctx.strokeStyle=accent;ctx.beginPath();ctx.ellipse(cx,cy+y*s*.65,rx,Math.max(1,rx*.12),0,0,Math.PI*2);ctx.stroke();}
        for(let i=0;i<9;i++){const a=i/8*Math.PI;ctx.globalAlpha=.2;ctx.beginPath();ctx.ellipse(cx,cy,Math.max(1,Math.sin(a)*s*.48),s*.65,0,0,Math.PI*2);ctx.stroke();}
        const y=cy-s+p*2*s;line(cx-s,y,cx+s,y,.8);rect(cx-s*.8,cy-s,s*1.6,s*2,.2);
        for(let i=0;i<25;i++){const y0=cy-s+i*s/12,x1=cx+Math.sin(i*.4+t)*s*.82,x2=cx-Math.sin(i*.4+t)*s*.82;line(x1,y0,x2,y0,.15);ctx.globalAlpha=.7;ctx.fillStyle=accent;ctx.fillRect(x1,y0,3,3);ctx.fillRect(x2,y0,3,3);}
      } else if(scene==='gallery') {
        for(let i=0;i<7;i++){const x=cx+(i-3)*s*.72-(p*2%1)*s*.72,y=cy-s*.55+Math.sin(i+t*.1)*s*.12;rect(x,y,s*.62,s*1.1,.4);for(let j=0;j<6;j++){rect(x+s*.03,y+j*s*.18+s*.03,s*.04,s*.07,.5);rect(x+s*.55,y+j*s*.18+s*.03,s*.04,s*.07,.5);}rect(x+s*.12,y+s*.15,s*.37,s*.63,.2);}
        ctx.strokeStyle=accent;ctx.globalAlpha=.65;ctx.beginPath();for(let i=0;i<=6;i++){const a=i*Math.PI/3+p*.4;const x=cx+Math.cos(a)*s*.48,y=cy+Math.sin(a)*s*.48;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();line(0,cy-s+p*s*2,w,cy-s+p*s*2,.3);
      } else if(scene==='contact') {
        for(let r=0;r<6;r++){const radius=((p*2+r/6)%1)*s*1.8;ctx.strokeStyle=accent;ctx.globalAlpha=(1-radius/(s*1.8))*.35;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();}
        for(let j=0;j<3;j++){ctx.globalAlpha=.25+j*.15;ctx.beginPath();for(let x=0;x<=w;x+=5){const y=cy+Math.sin(x/w*13-t+j)*s*.13*(j+1);x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
        for(let i=0;i<24;i++){const q=(p*2+i/24)%1,x=w*q,y=cy+Math.sin(q*13-t)*s*.2;ctx.globalAlpha=.7;ctx.fillStyle=accent;ctx.fillRect(x,y,5+q*8,3);}
        line(cx,cy-s*.4,cx,cy+s*.55,.7);line(cx,cy-s*.4,cx-s*.12,cy-s*.15,.7);line(cx,cy-s*.4,cx+s*.12,cy-s*.15,.7);
      } else {
        for(let i=0;i<6;i++){ctx.globalAlpha=.3;ctx.strokeStyle=accent;ctx.beginPath();ctx.arc(cx,cy,s*(.3+i*.14),t+i,t+i+Math.PI*1.5);ctx.stroke();}line(cx-s,cy,cx+s,cy,.4);line(cx,cy-s,cx,cy+s,.4);
      }
      ctx.globalAlpha=1;const veil=ctx.createLinearGradient(0,0,w,0);veil.addColorStop(0,'#04070ee0');veil.addColorStop(.65,'#04070e30');veil.addColorStop(1,'#04070e00');ctx.fillStyle=veil;ctx.fillRect(0,0,w,h);
    }
    function draw(time) {
      if (!ctx) return;
      const p = Math.min(1, Math.max(0, (time - started) / duration));
      if (time - last >= 32) {
        last = time; update(p);
        if(scene !== 'home') alternate(p);
        else {
        const w = width, h = height, f = Math.min(w, h) * .87;
        const cx = w * .53 + Math.sin(p * 4) * w * .035, cy = h * .46;
        const travel = 4700 * (p * p * .45 + p * .55);
        const project = (x, y, z) => [cx + x * f / z, cy + (135 - y) * f / z];
        const line = (a, b, color, weight = 1) => {ctx.strokeStyle = color; ctx.lineWidth = weight; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();};
        ctx.fillStyle = '#070910'; ctx.fillRect(0, 0, w, h);
        const sky = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * .8);
        sky.addColorStop(0, '#44212f'); sky.addColorStop(.45, '#101324'); sky.addColorStop(1, '#06080d'); ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#ff385629'; ctx.beginPath(); ctx.arc(cx, cy - h * .09, Math.min(w,h)*.15,0,Math.PI*2); ctx.fill();
        // Projected road, converging power lines and moving ground markers.
        for (let x = -2000; x <= 2000; x += 200) line(project(x,0,80),project(x,0,3600),'#ff35532b');
        for (let i = 0; i < 23; i++) {
          const z = 90 + ((i * 163 - travel * .6) % 3500 + 3500) % 3500;
          line(project(-2000,0,z),project(2000,0,z),'#ff355328');
          line(project(-12,1,z),project(-12,1,z+55),'#d3ff3880',2);
          line(project(12,1,z),project(12,1,z+55),'#d3ff3880',2);
        }
        const visible = blocks.slice(0,w < 650 ? 38 : 64).map(b => ({...b, depth: 90 + ((b.z - travel) % 3400 + 3400) % 3400})).sort((a,b) => b.depth - a.depth);
        for (const b of visible) {
          const x = b.side * b.x, z = b.depth;
          const a = project(x,0,z), c = project(x+b.side*b.w,0,z), d = project(x+b.side*b.w,b.h,z), e = project(x,b.h,z);
          const back = project(x,b.h,z+b.d), groundBack = project(x,0,z+b.d);
          const color = b.side < 0 ? '#65e7e6' : '#ff4565';
          ctx.globalAlpha = Math.min(1,2400/z);
          ctx.fillStyle = '#090c14'; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...c); ctx.lineTo(...d); ctx.lineTo(...e); ctx.closePath(); ctx.fill();
          line(a,e,color+'a0'); line(e,d,color+'65'); line(d,c,color+'38'); line(e,back,color+'6a'); line(back,groundBack,color+'30'); line(groundBack,a,color+'30');
          for(let y=30;y<b.h-10;y+=46) {
            line(project(x+b.side*10,y,z-1),project(x+b.side*(b.w-10),y,z-1),color+'37',Math.max(1,f/z*3));
          }
          if (b.w > 125) {
            ctx.save(); const sign = project(x+b.side*12,b.h*.7,z-2); ctx.translate(...sign); const scale = Math.min(3,f/z); ctx.scale(scale,scale); ctx.fillStyle = b.side < 0 ? '#caff4d' : '#ff4565'; ctx.font = 'bold 26px monospace'; ctx.fillText(b.side < 0 ? 'NEON' : '零界',0,0); ctx.restore();
          }
        }
        ctx.globalAlpha = 1;
        // Radial tracer paths intensify during the middle flight, without full-screen flashes.
        for(let i=0;i<44;i++) {
          const angle = i * 2.39996, radius = ((i * 57 + travel*.6) % (w*.8));
          const length = 15 + p * 75;
          line([cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius*.65],[cx+Math.cos(angle)*(radius+length),cy+Math.sin(angle)*(radius+length)*.65],i%4 ? '#68eee729' : '#d3ff3865');
        }
        const shade = ctx.createRadialGradient(w*.5,h*.5,h*.12,w*.5,h*.5,w*.68);
        shade.addColorStop(0,'#02030a00'); shade.addColorStop(1,'#02030aeb'); ctx.fillStyle=shade; ctx.fillRect(0,0,w,h);
        }
      }
      if (p < 1) frame = requestAnimationFrame(draw); else frame = 0;
    }
    return {
      start(ms, onFrame = () => {}, variant = 'home') { stop(); if(!ctx) return; scene=variant; duration=ms; update=onFrame; started=performance.now(); last=-100; size(); window.addEventListener('resize',size); frame=requestAnimationFrame(draw); },
      stop
    };
  }
};

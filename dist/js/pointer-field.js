/* Small bounded spring field: view-independent math, no DOM or external dependencies. */
Night.pointerField = {
  create(width,height,count=58) {
    const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
    const random=i=>{const x=Math.sin(i*127.1+47.3)*43758.5453;return x-Math.floor(x);};
    const nodes=Array.from({length:Math.min(64,Math.max(12,count))},(_,i)=>({
      homeX:random(i+3)*width,homeY:random(i+81)*height,
      x:random(i+3)*width,y:random(i+81)*height,vx:0,vy:0,size:2+random(i+150)*1.8
    }));
    const state={x:width/2,y:height/2,targetX:width/2,targetY:height/2,active:false,opacity:0,nodes,trail:[],rings:[]};
    function move(x,y){state.targetX=clamp(x,0,width);state.targetY=clamp(y,0,height);state.active=true;state.trail.push({x:state.targetX,y:state.targetY,life:1});if(state.trail.length>18)state.trail.shift();}
    function leave(){state.active=false;state.targetX=width/2;state.targetY=height/2;}
    function reset(){leave();state.x=width/2;state.y=height/2;state.opacity=0;state.trail=[];state.rings=[];nodes.forEach(n=>{n.x=n.homeX;n.y=n.homeY;n.vx=n.vy=0;});}
    function pulse(x,y){move(x,y);state.rings.push({x:clamp(x,0,width),y:clamp(y,0,height),age:0});if(state.rings.length>4)state.rings.shift();}
    function step(seconds){
      const dt=clamp(Number.isFinite(seconds)?seconds:0,0,.05),k=dt*60;
      state.x+=(state.targetX-state.x)*(1-Math.exp(-dt*7));state.y+=(state.targetY-state.y)*(1-Math.exp(-dt*7));
      state.opacity+=((state.active?1:0)-state.opacity)*(1-Math.exp(-dt*5));
      for(const n of nodes){
        let fx=(n.homeX-n.x)*.015,fy=(n.homeY-n.y)*.015;
        if(state.active){const dx=n.x-state.x,dy=n.y-state.y,d=Math.hypot(dx,dy);if(d<155){const strength=(1-d/155)*.8;fx+=(d>.1?dx/d:1)*strength;fy+=(d>.1?dy/d:0)*strength;}}
        n.vx=(n.vx+fx*k)*Math.pow(.88,k);n.vy=(n.vy+fy*k)*Math.pow(.88,k);
        n.x=clamp(n.x+n.vx*k,-24,width+24);n.y=clamp(n.y+n.vy*k,-24,height+24);
      }
      state.trail=state.trail.filter(p=>{p.life-=dt*1.8;return p.life>0;});
      state.rings=state.rings.filter(r=>{r.age+=dt;return r.age<.9;});
      return state;
    }
    return {move,leave,pulse,reset,step,state};
  }
};

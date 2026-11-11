/* Original run-and-gun simulation: fixed steps, straight projectiles and gated boss stages. */
Night.runnerModel = (() => {
  const valid=n=>Number.isSafeInteger(n)&&n>=0;
  const factions={scav:{name:'清道夫',tag:'SCAV',color:'#ffb34f'},maelstrom:{name:'漩涡帮',tag:'MAELSTROM',color:'#ff5475'},corpo:{name:'公司安保',tag:'CORPO',color:'#bd9cff'}};
  const weapons=[
    {id:'pistol',name:'脉冲手枪',level:1,mag:8,reload:1.15,interval:.28,damage:1,speed:900,life:1.1,pellets:1,spread:0,pierce:0,color:'#d3ff38'},
    {id:'scatter',name:'破门散弹',level:3,mag:4,reload:1.65,interval:.6,damage:1,speed:760,life:.82,pellets:5,spread:.11,pierce:0,color:'#ffb34f'},
    {id:'rifle',name:'蜂刺步枪',level:6,mag:18,reload:1.5,interval:.115,damage:1,speed:1000,life:1.05,pellets:1,spread:0,pierce:0,color:'#68eee7'},
    {id:'rail',name:'裂隙轨道枪',level:9,mag:3,reload:1.95,interval:.72,damage:5,speed:1180,life:1.05,pellets:1,spread:0,pierce:2,color:'#bd9cff'},
    {id:'lobber',name:'磁爆榴弹',level:5,mag:4,reload:1.8,interval:.7,damage:4,speed:430,life:2.1,pellets:1,spread:0,pierce:0,color:'#ff875f',kind:'grenade',gravity:650,lob:-260,splash:90},
    {id:'trident',name:'三叉脉冲',level:8,mag:18,reload:1.7,interval:.4,damage:1.25,speed:920,life:1.1,pellets:3,spread:.055,pierce:0,color:'#f69ee8',cost:3},
    {id:'ricochet',name:'折光弹射器',level:12,mag:6,reload:1.5,interval:.34,damage:1.8,speed:720,life:1.7,pellets:1,spread:0,pierce:2,color:'#84baff',kind:'ricochet',angle:.42,bounces:3}
  ];
  const perks=[
    {id:'damage',name:'超频弹芯',type:'武器',desc:'所有武器伤害 +25%，可叠加。',max:4},
    {id:'mag',name:'扩容弹匣',type:'武器',desc:'每把武器弹匣 +2，并补入这 2 发。',max:4},
    {id:'reload',name:'快拆机构',type:'武器',desc:'换弹耗时 ×0.8，最低为基础的一半。',max:3},
    {id:'armor',name:'皮下护甲',type:'人物',desc:'护盾上限 +1，同时恢复 1 格。',max:4},
    {id:'airjump',name:'空中踏板',type:'人物',desc:'松开再按跳跃，可在空中再跳一次。',max:1},
    {id:'dash',name:'相位加速',type:'人物',desc:'冲刺冷却缩短 20%，最低 1.2 秒。',max:3},
    {id:'pierce',name:'贯穿回路',type:'武器',desc:'子弹可额外穿透一个目标。',max:2},
    {id:'supply',name:'战地补给',type:'人物',desc:'修复针、EMP 各 +1（最多3），恢复 1 格。',max:5}
  ];
  const overlap=(a,b,pad=0)=>a.x+a.w-pad>b.x+2&&a.x+pad<b.x+b.w-2&&a.y+a.h-pad>b.y+2&&a.y+pad<b.y+b.h-2;
  function cleanRecords(raw){const d=raw&&typeof raw==='object'?raw:{};const runs=Array.isArray(d.runs)?d.runs.filter(r=>r&&typeof r.id==='string'&&valid(r.score)&&Number.isSafeInteger(r.level)&&r.level>=1&&typeof r.date==='string'&&Number.isFinite(Date.parse(r.date))).slice(0,10).map(r=>({id:r.id,score:r.score,level:r.level,date:r.date,kills:valid(r.kills)?r.kills:0,bosses:valid(r.bosses)?r.bosses:0,rules:['v7','v8'].includes(r.rules)?r.rules:'legacy'})):[];return {best:Math.max(valid(d.best)?d.best:0,...runs.map(r=>r.score)),runs};}
  function addRecord(raw,run){const d=cleanRecords(raw),r=cleanRecords({runs:[run]}).runs[0];return r?{best:Math.max(d.best,r.score),runs:[r,...d.runs.filter(a=>a.id!==r.id)].slice(0,10)}:d;}
  function create({width=960,random=Math.random}={}){
    const ground=270,player={x:88,y:222,w:30,h:48,vy:0,jumps:0,support:'ground'};
    const state={mode:'ready',stage:'run',width:Math.max(560,width),height:320,ground,player,enemies:[],bullets:[],hostiles:[],effects:[],hazards:[],platforms:[],arena:null,boss:null,choices:[],chosen:[],ranks:{},level:1,progress:0,distance:0,score:0,kills:0,bossKills:0,hp:4,maxHp:4,speed:340,invulnerable:0,dashLeft:0,dashDir:1,dashProtected:false,ignorePlatforms:0,dashCooldown:0,move:0,jumpHeld:false,fireHeld:false,holdTime:0,cooldown:0,weapon:0,magazines:[],reloadLeft:0,reloadTotal:0,meds:0,emps:0,shots:0,time:0,reason:'',notice:'',noticeTime:0,practice:false};
    let spawnIn=1,serial=0,emptyNotice=0;
    const rng=()=>{const n=random();return Number.isFinite(n)?Math.max(0,Math.min(.999999,n)):.5;};
    const weapon=()=>weapons[state.weapon];
    const capacity=(index=state.weapon)=>weapons[index].mag+2*(state.ranks.mag||0);
    const reloadTime=()=>weapon().reload*Math.max(.5,.8**(state.ranks.reload||0));
    function notice(text,seconds=2){state.notice=text;state.noticeTime=seconds;}
    function burst(x,y,color,n=8,life=.35){for(let i=0;i<n;i++){const a=i/n*Math.PI*2;state.effects.push({x,y,vx:Math.cos(a)*110,vy:Math.sin(a)*90,color,life,maxLife:life});}if(state.effects.length>96)state.effects.splice(0,state.effects.length-96);}
    function releaseJump(){state.jumpHeld=false;if(player.vy< -480)player.vy=-480;}
    function releaseInputs(){releaseJump();state.fireHeld=false;state.move=0;}
    function unlock(oldLevel){if(oldLevel<2&&state.level>=2)state.meds=Math.min(3,state.meds+1);if(oldLevel<4&&state.level>=4)state.emps=Math.min(3,state.emps+1);const w=weapons.find(w=>w.level>oldLevel&&w.level<=state.level);if(w)notice(w.name+' 已解锁 / Q 切换');}
    function enterLevel(level){const old=state.level;state.level=level;state.progress=0;state.speed=Math.min(620,340+(level-1)*17);spawnIn=.8;state.stage='run';state.platforms=[];state.arena=null;player.support=null;unlock(old);if(level%5===0)spawnBoss();else notice('SECTOR '+String(level).padStart(2,'0')+' / 敌方装甲升级');}
    function start({practice=false,startLevel=3,previewUpgrade=false}={}){
      const level=practice&&[3,5,10,15].includes(startLevel)?startLevel:practice?3:1;
      Object.assign(state,{mode:'running',stage:'run',enemies:[],bullets:[],hostiles:[],effects:[],hazards:[],platforms:[],arena:null,boss:null,choices:[],chosen:[],ranks:{},level,progress:0,distance:0,score:0,kills:0,bossKills:0,hp:4,maxHp:4,speed:Math.min(620,340+(level-1)*17),invulnerable:0,dashLeft:0,dashDir:1,dashProtected:false,ignorePlatforms:0,dashCooldown:0,move:0,jumpHeld:false,fireHeld:false,holdTime:0,cooldown:0,weapon:0,magazines:weapons.map(w=>w.mag),reloadLeft:0,reloadTotal:0,meds:level>=2?1:0,emps:level>=4?1:0,shots:0,time:0,reason:'',notice:'',noticeTime:0,practice});
      Object.assign(player,{x:88,y:ground-player.h,vy:0,jumps:0,support:'ground'});serial=0;spawnIn=.9;emptyNotice=0;
      notice(practice?'演练 / 不写入成绩':'直线弹道 / R 换弹 · K 冲刺',2.5);if(level%5===0){player.x=state.width*.25;spawnBoss();}if(practice&&previewUpgrade){state.boss=null;state.level=5;state.stage='boss';reward();notice('构筑演练 / 不计成绩');}
    }
    function jump(){const limit=state.ranks.airjump?2:1;if(state.mode!=='running'||state.jumpHeld||player.jumps>=limit)return false;player.jumps++;state.jumpHeld=true;state.holdTime=0;player.vy=-600;player.support=null;return true;}
    function setMove(value){state.move=state.mode==='running'?Math.max(-1,Math.min(1,value)):0;}
    function pause(){if(state.mode==='running'){state.mode='paused';releaseInputs();}}
    function resume(){if(state.mode==='paused')state.mode='running';}
    function finish(reason='主动结束'){if(!['running','paused','upgrade'].includes(state.mode))return false;state.mode='over';state.reason=reason;releaseInputs();return true;}
    function reload(){if(state.mode!=='running'||state.reloadLeft>0||state.magazines[state.weapon]>=capacity())return false;state.reloadLeft=state.reloadTotal=reloadTime();notice('换弹中 / 保持移动与冲刺',1);return true;}
    function switchWeapon(index){if(state.mode!=='running'||state.reloadLeft>0)return false;const next=Number.isInteger(index)?index:(state.weapon+1)%weapons.length;if(next<0||next>=weapons.length||weapons[next].level>state.level)return false;state.weapon=next;state.cooldown=Math.max(state.cooldown,.18);notice(weapon().name+' / 弹匣独立保留',1);return true;}
    function cycleWeapon(){const available=weapons.map((w,i)=>({w,i})).filter(a=>a.w.level<=state.level).sort((a,b)=>a.w.level-b.w.level).map(a=>a.i);return switchWeapon(available[(available.indexOf(state.weapon)+1)%available.length]);}
    function shoot(){
      if(state.mode!=='running'||state.reloadLeft>0||state.cooldown>0||state.bullets.length>90)return false;
      if(state.magazines[state.weapon]<=0){if(state.time>emptyNotice){notice('空弹匣 / 按 R 换弹',1);emptyNotice=state.time+1;}return false;}
      const w=weapon(),rounds=w.cost||1;if(state.magazines[state.weapon]<rounds){notice('余弹不足本次齐射 / R 换弹',1);return false;}state.magazines[state.weapon]-=rounds;state.cooldown=w.interval;state.shots++;
      for(let i=0;i<w.pellets;i++){const a=(w.angle||0)+(i-(w.pellets-1)/2)*w.spread;state.bullets.push({x:player.x+player.w+7,y:player.y+23,w:w.id==='rail'?28:12,h:w.id==='rail'?7:4,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed+(w.lob||0),gravity:w.gravity||0,kind:w.kind||'bullet',bounces:w.bounces||0,splash:w.splash||0,life:w.life,damage:w.damage*(1+.25*(state.ranks.damage||0)),pierce:w.pierce+(state.ranks.pierce||0),hit:[],color:w.color});}
      burst(player.x+player.w+10,player.y+23,w.color,3,.12);return true;
    }
    function setFiring(value){state.fireHeld=!!value&&state.mode==='running';if(state.fireHeld)shoot();}
    function dash(){if(state.mode!=='running'||state.dashCooldown>0)return false;state.dashLeft=.35;state.dashDir=state.move<0?-1:1;state.dashProtected=false;state.dashCooldown=Math.max(1.2,2.6*.8**(state.ranks.dash||0));notice('PHASE DASH / 中段0.25秒无敌',.6);return true;}
    function drop(){if(state.mode!=='running'||!state.platforms.some(p=>p.active&&p.id===player.support))return false;player.support=null;player.jumps=Math.max(1,player.jumps);player.vy=80;state.ignorePlatforms=.22;return true;}
    function heal(){if(state.mode!=='running'||state.level<2||state.meds<=0||state.hp>=state.maxHp)return false;state.meds--;state.hp=Math.min(state.maxHp,state.hp+2);burst(player.x+15,player.y+20,'#68eee7',14);notice('修复针 / 护盾恢复');return true;}
    function emp(){if(state.mode!=='running'||state.level<4||state.emps<=0)return false;state.emps--;state.hostiles=[];state.hazards=[];for(const e of state.enemies)hitEnemy(e,3);if(state.boss&&state.boss.state!=='intro')hitBoss(6);burst(player.x+15,player.y+20,'#68eee7',32,.65);notice('EMP / 清除弹幕并造成伤害');return true;}
    function hurt(){if(state.mode!=='running'||state.invulnerable>0||state.dashProtected)return;state.hp--;state.invulnerable=.8;burst(player.x+15,player.y+24,'#ff5475',12);notice('护盾受损 / 剩余 '+state.hp,.8);if(state.hp<=0)finish('护盾耗尽');}
    function score(){state.score=Math.floor(state.distance/16+1e-7)+state.kills*25+state.bossKills*350;}
    function hitEnemy(e,damage){if(e.dead)return;e.hp-=damage;burst(e.x+e.w/2,e.y+e.h/2,factions[e.faction].color,5);if(e.hp<=0){e.dead=true;state.kills++;score();burst(e.x+e.w/2,e.y+e.h/2,factions[e.faction].color,12);}}
    function spawn(){
      if(state.enemies.length>=6){spawnIn=.3;return;}serial++;const r=rng(),fly=state.level>=2&&(serial%3===0||r<.25),armor=state.level>=4&&!fly&&r>.68,kind=fly?'drone':armor?'sentry':state.level>=2&&serial%2===0?'cyborg':'scav';
      const h=fly?28:armor?64:kind==='cyborg'?52:42,w=fly?52:armor?40:32,y=fly?(serial%2?140:188):ground-h,scale=Math.min(10,Math.floor((state.level-1)/3)),hp=(armor?3:1)+scale;
      state.enemies.push({id:serial,x:state.width+30,y,baseY:y,w,h,kind,faction:fly||armor?'corpo':kind==='cyborg'?'maelstrom':'scav',hp,maxHp:hp,charge:Math.min(160,65+state.level*6),dead:false,phase:r*Math.PI*2,attackIn:.55,windup:0});
      spawnIn=Math.max(.82,1.65-state.level*.035)+rng()*.35;
    }
    function projectile(x,y,vx,vy,color='#ff5475',size=9,kind='orb',extra={}){if(state.hostiles.length>=64)return;state.hostiles.push({x,y,vx,vy,w:size,h:size,life:5,color,kind,...extra});}
    function aimed(x,y,count,speed){const angle=Math.atan2(player.y+player.h/2-y,player.x+player.w/2-x);for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.22;projectile(x,y,Math.cos(a)*speed,Math.sin(a)*speed);}}
    function spawnBoss(){
      state.stage='boss';state.progress=0;state.enemies=[];state.hostiles=[];state.hazards=[];state.bullets=[];
      const round=state.level/5,kind=round%2===1?'anvil':'iris',hp=kind==='anvil'?28+Math.floor((round-1)*9):40+Math.floor((round-2)*9);
      state.boss={kind,name:kind==='anvil'?'砧塔 ANVIL':'血眼 IRIS',x:state.width-152,y:kind==='anvil'?140:130,baseY:kind==='anvil'?140:130,w:kind==='anvil'?112:98,h:kind==='anvil'?130:92,hp,maxHp:hp,phase:1,state:'intro',timer:1.6,attack:0,pattern:kind==='anvil'?'wave':'fan',markX:0,aimX:0,aimY:0,flash:0};
      state.arena=kind;const pw=Math.min(112,state.width*.18);state.platforms=[{id:'A',x:state.width*.16,y:222,w:pw,h:8},{id:'B',x:state.width*.35,y:166,w:pw,h:8},{id:'C',x:state.width*.54,y:208,w:pw,h:8}].map(p=>({...p,active:true,armed:false,left:3,cooldown:0}));
      notice('警告 / 首领封锁 · 浮台踩踏后3秒崩解',2.5);
    }
    function prepareAttack(b){const patterns=b.kind==='anvil'?['wave','fan','mines','sweep','mortar','highbeam']:['fan','column','ring','rain','cross','curtain'];b.pattern=patterns[b.attack%patterns.length];b.attack++;b.state='telegraph';b.timer=b.phase===2?.82:1.05;b.markX=player.x+player.w/2;b.markY=Math.max(65,Math.min(245,player.y+player.h/2));b.aimX=b.markX;b.aimY=player.y+player.h/2;}
    function bossAttack(b){
      b.state='attack';b.timer=.42;
      if(b.pattern==='wave'){projectile(b.x,ground-23,-(b.phase===2?440:350),0,'#ffb34f',24,'wave');if(b.phase===2)projectile(b.x+120,ground-23,-440,0,'#ffb34f',24,'wave');}
      if(b.pattern==='fan'){const angle=Math.atan2(b.aimY-(b.y+44),b.aimX-b.x),count=b.phase===2?5:3;for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.24;projectile(b.x,b.y+44,Math.cos(a)*270,Math.sin(a)*270,'#ff5475',10);}}
      if(b.pattern==='sweep')state.hazards.push({x:0,y:ground-20,w:b.x,h:17,life:.22,color:'#ff5475'});
      if(b.pattern==='column')state.hazards.push({x:b.markX-20,y:0,w:40,h:ground,life:.24,color:'#bd9cff'});
      if(b.pattern==='rain'){const count=b.phase===2?5:3;for(let i=0;i<count;i++)projectile(state.width*.12+i*state.width*.16,40,0,220+i*12,'#bd9cff',12);}
      if(b.pattern==='mines'){b.timer=1.3;const n=b.phase===2?5:3;for(let i=0;i<n;i++){const x=Math.max(12,Math.min(b.x-50,b.markX+(i-(n-1)/2)*65));state.hazards.push({x:x-20,y:ground-42,w:40,h:42,warmup:1,life:.3,color:'#ff875f'});}}
      if(b.pattern==='mortar'){b.timer=.65;const n=b.phase===2?3:2;for(let i=0;i<n;i++){const target=Math.max(20,Math.min(b.x-25,b.markX+(i-(n-1)/2)*95)),flight=1.2;projectile(b.x,b.y+30,(target-b.x)/flight,(ground-10-(b.y+30)-.5*500*flight*flight)/flight,'#ff875f',14,'shell',{gravity:500});}}
      if(b.pattern==='highbeam')state.hazards.push({x:0,y:b.markY-7,w:b.x,h:14,life:.2,color:'#ffb34f'});
      if(b.pattern==='ring'){const n=b.phase===2?12:8;for(let i=0;i<n;i++){const a=i/n*Math.PI*2+.13;projectile(b.x+b.w/2,b.y+44,Math.cos(a)*(b.phase===2?210:170),Math.sin(a)*(b.phase===2?210:170),'#bd9cff',10);}}
      if(b.pattern==='cross'){state.hazards.push({x:b.markX-15,y:0,w:30,h:ground,life:.18,color:'#bd9cff'},{x:0,y:b.markY-7,w:b.x,h:14,life:.18,color:'#bd9cff'});}
      if(b.pattern==='curtain'){b.timer=1.1;const n=b.phase===2?7:5;for(let i=0;i<n;i++)projectile(state.width*.08+i*(b.x-state.width*.12)/(n-1),30,0,265,'#84baff',11,'orb',{delay:i*.16});}
    }
    function updateBoss(dt){const b=state.boss;if(!b)return;b.flash=Math.max(0,b.flash-dt);if(b.kind==='iris')b.y=b.baseY+Math.sin(state.time*1.5)*24;b.timer-=dt;if(b.timer>0)return;
      if(b.state==='intro'||b.state==='recover')prepareAttack(b);else if(b.state==='telegraph')bossAttack(b);else if(b.state==='attack'){b.state='recover';b.timer=b.phase===2?.75:1.05;}
    }
    function hitBoss(damage){const b=state.boss;if(!b||b.state==='intro'||state.mode!=='running')return;b.hp=Math.max(0,b.hp-damage);b.flash=.08;burst(b.x+b.w*.35,b.y+b.h*.5,'#ffb34f',4);
      if(b.hp<=0){state.bossKills++;score();state.boss=null;state.platforms=[];player.support=null;state.hostiles=[];state.hazards=[];state.bullets=[];state.hp=Math.min(state.maxHp,state.hp+1);state.meds=Math.min(3,state.meds+1);state.emps=Math.min(3,state.emps+1);reward();}
      else if(b.phase===1&&b.hp<=b.maxHp*.5){b.phase=2;b.state='recover';b.timer=1;state.hostiles=[];state.hazards=[];notice('第二阶段 / 观察预警再冲刺',2);}
    }
    function reward(){state.mode='upgrade';state.dashLeft=0;state.dashProtected=false;releaseInputs();const pool=perks.filter(p=>(state.ranks[p.id]||0)<p.max);for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}state.choices=pool.slice(0,3);if(!state.choices.length){state.choices=[{id:'recovery',name:'应急修复',type:'人物',desc:'护盾恢复至上限。'}];}notice('BOSS 已击败 / 三选一强化');}
    function choosePerk(id){if(state.mode!=='upgrade'||!state.choices.some(p=>p.id===id))return false;const p=state.choices.find(p=>p.id===id);state.ranks[id]=(state.ranks[id]||0)+1;state.chosen.push({id,name:p.name,level:state.level});
      if(id==='armor'){state.maxHp++;state.hp++;}if(id==='mag')state.magazines=state.magazines.map(a=>a+2);if(id==='supply'){state.meds=Math.min(3,state.meds+1);state.emps=Math.min(3,state.emps+1);state.hp=Math.min(state.maxHp,state.hp+1);}if(id==='recovery')state.hp=state.maxHp;
      state.choices=[];state.mode='running';state.reloadLeft=0;releaseInputs();enterLevel(state.level+1);return true;
    }
    function updatePlatforms(dt){for(const p of state.platforms){if(p.active&&p.armed){p.left=Math.max(0,p.left-dt);if(p.left<=0){p.active=false;p.cooldown=5;}}else if(!p.active){p.cooldown=Math.max(0,p.cooldown-dt);if(p.cooldown<=0){p.active=true;p.armed=false;p.left=3;}}}}
    function physics(dt){
      const oldFoot=player.y+player.h,dashStep=Math.min(dt,state.dashLeft),maxX=state.stage==='boss'?state.width-205:state.width*.58;
      player.x=Math.max(28,Math.min(maxX,player.x+state.dashDir*500*dashStep+state.move*260*(dt-dashStep)));
      state.dashLeft=Math.max(0,state.dashLeft-dashStep);const elapsed=.35-state.dashLeft;state.dashProtected=state.dashLeft>0&&elapsed>=.05-1e-8&&elapsed<.30-1e-8;
      state.ignorePlatforms=Math.max(0,state.ignorePlatforms-dt);
      if(player.support&&player.support!=='ground'&&!state.platforms.some(p=>p.active&&p.id===player.support&&player.x+player.w>p.x+2&&player.x<p.x+p.w-2)){player.support=null;player.jumps=Math.max(1,player.jumps);}
      state.holdTime+=dt;player.vy+=(state.jumpHeld&&state.holdTime<.24&&player.vy<0?900:2200)*dt;let nextY=player.y+player.vy*dt;
      let landing=null;if(player.vy>=0&&state.ignorePlatforms<=0)for(const p of state.platforms){if(p.active&&oldFoot<=p.y+.01&&nextY+player.h>=p.y&&player.x+player.w>p.x+2&&player.x<p.x+p.w-2&&(!landing||p.y<landing.y))landing=p;}
      if(landing){nextY=landing.y-player.h;player.vy=0;player.jumps=0;player.support=landing.id;if(!landing.armed){landing.armed=true;landing.left=3;}}
      else if(nextY>=ground-player.h){nextY=ground-player.h;player.vy=0;player.jumps=0;player.support='ground';}else player.support=null;
      player.y=nextY;
    }
    function radialHit(x,y,radius,target){const cx=Math.max(target.x,Math.min(x,target.x+target.w)),cy=Math.max(target.y,Math.min(y,target.y+target.h));return Math.hypot(x-cx,y-cy)<=radius;}
    function explode(b){if(b.exploded)return;b.exploded=true;b.life=0;burst(b.x,b.y,b.color||'#ff875f',24,.5);for(const e of state.enemies)if(!e.dead&&radialHit(b.x,b.y,b.splash,e))hitEnemy(e,b.damage);if(state.boss&&radialHit(b.x,b.y,b.splash,state.boss))hitBoss(b.damage);}
    function advance(dt){
      state.time+=dt;state.noticeTime=Math.max(0,state.noticeTime-dt);state.cooldown=Math.max(0,state.cooldown-dt);state.invulnerable=Math.max(0,state.invulnerable-dt);state.dashCooldown=Math.max(0,state.dashCooldown-dt);updatePlatforms(dt);
      if(state.reloadLeft>0){state.reloadLeft=Math.max(0,state.reloadLeft-dt);if(state.reloadLeft===0){state.magazines[state.weapon]=capacity();notice('换弹完成 / '+weapon().name,1);}}
      if(state.fireHeld)shoot();physics(dt);
      if(state.stage==='run'){
        const moved=state.speed*dt;state.distance+=moved;state.progress+=moved;if(state.progress>=2400){enterLevel(state.level+1);}
        if(state.stage==='run'){spawnIn-=dt;if(spawnIn<=0)spawn();}
      }else updateBoss(dt);
      for(const e of state.enemies){e.x-=(state.speed+e.charge)*dt;if(e.kind==='drone')e.y=e.baseY+Math.sin(state.time*4+e.phase)*5;
        if(e.windup>0){e.windup-=dt;if(e.windup<=0)aimed(e.x,e.y+15,state.level>=9?3:1,245);}else if(state.level>=4&&e.x<state.width-25&&e.x>player.x+90){e.attackIn-=dt;if(e.attackIn<=0){e.windup=.65;e.attackIn=2.6;}}
      }
      for(const b of state.bullets){
        if(state.mode!=='running')break;const oldY=b.y;b.vy+=(b.gravity||0)*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
        let surface=ground;for(const p of state.platforms)if(p.active&&b.vy>0&&oldY+b.h<=p.y+.1&&b.y+b.h>=p.y&&b.x+b.w>p.x&&b.x<p.x+p.w)surface=Math.min(surface,p.y);
        if(b.kind==='ricochet'&&(b.y<32||b.y+b.h>=surface)){if(b.bounces>0){b.bounces--;if(b.y<32){b.y=32;b.vy=Math.abs(b.vy);}else{b.y=surface-b.h;b.vy=-Math.abs(b.vy);}burst(b.x,b.y,b.color,3,.12);}else b.life=0;}
        if(b.kind==='grenade'&&(b.y+b.h>=surface||b.life<=0)){b.y=Math.min(b.y,surface-b.h);explode(b);} 
        for(const e of state.enemies){if(b.life<=0)break;if(!e.dead&&!b.hit.includes(e.id)&&overlap(b,e)){if(b.kind==='grenade')explode(b);else{hitEnemy(e,b.damage);b.hit.push(e.id);if(b.pierce--<=0)b.life=0;}}}
        const boss=state.boss;if(b.life>0&&boss&&!b.hit.includes('boss')&&overlap(b,boss)){b.hit.push('boss');if(b.kind==='grenade')explode(b);else hitBoss(b.damage);b.life=0;}
      }
      if(state.mode==='running'){
        for(const e of state.enemies){if(!e.dead&&overlap(player,e,5)){hurt();e.dead=true;}}
        const boss=state.boss;if(boss&&overlap(player,boss,5))hurt();
        for(const a of state.hostiles){if(a.delay>0){a.delay=Math.max(0,a.delay-dt);continue;}a.vy+=(a.gravity||0)*dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.life-=dt;if(a.kind==='shell'&&a.y+a.h>=ground){a.life=0;state.hazards.push({x:a.x-25,y:ground-45,w:60,h:45,life:.2,color:'#ff875f'});burst(a.x,ground,'#ff875f',12);}if(overlap(player,a,4)){hurt();a.life=0;}}
        for(const a of state.hazards){if(a.warmup>0){a.warmup=Math.max(0,a.warmup-dt);continue;}a.life-=dt;if(overlap(player,a,4))hurt();}
      }
      state.enemies=state.enemies.filter(e=>!e.dead&&e.x+e.w>-30);state.bullets=state.bullets.filter(b=>b.life>0&&b.x<state.width+40&&b.y>-30&&b.y<state.height+20);state.hostiles=state.hostiles.filter(b=>b.life>0&&b.x>-40&&b.x<state.width+160&&b.y>-60&&b.y<state.height+40);state.hazards=state.hazards.filter(a=>a.life>0);
      for(const e of state.effects){e.x+=e.vx*dt;e.y+=e.vy*dt;e.life-=dt;}state.effects=state.effects.filter(e=>e.life>0);
      state.score=Math.floor(state.distance/16+1e-7)+state.kills*25+state.bossKills*350;
    }
    function step(seconds){if(state.mode!=='running')return;let left=Math.max(0,Math.min(.05,Number.isFinite(seconds)?seconds:0));while(left>1e-9&&state.mode==='running'){const dt=Math.min(left,1/120);advance(dt);left-=dt;}}
    return {state,start,jump,releaseJump,releaseInputs,setMove,pause,resume,finish,reload,switchWeapon,cycleWeapon,shoot,setFiring,dash,drop,heal,emp,choosePerk,step,capacity,reloadTime};
  }
  return {create,cleanRecords,addRecord,factions,weapons,perks};
})();

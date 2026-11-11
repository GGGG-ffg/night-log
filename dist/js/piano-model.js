/* Original keyboard layout and public-domain melody arrangements. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Night.pianoModel=api;})(typeof window==='object'?window:globalThis,()=>{
  const layout=[['A','KeyA','C4',60,0],['W','KeyW','C♯4',61,.65],['S','KeyS','D4',62,1],['E','KeyE','D♯4',63,1.65],['D','KeyD','E4',64,2],['F','KeyF','F4',65,3],['T','KeyT','F♯4',66,3.65],['G','KeyG','G4',67,4],['Y','KeyY','G♯4',68,4.65],['H','KeyH','A4',69,5],['U','KeyU','A♯4',70,5.65],['J','KeyJ','B4',71,6],['K','KeyK','C5',72,7],['O','KeyO','C♯5',73,7.65],['L','KeyL','D5',74,8],['P','KeyP','D♯5',75,8.65],[';','Semicolon','E5',76,9]];
  const degrees={60:'1',62:'2',64:'3',65:'4',67:'5',69:'6',71:'7',72:'1′',74:'2′',76:'3′'};
  const notes=layout.map(([key,code,name,midi,position])=>Object.freeze({key,code,name,midi,position,black:name.includes('♯'),degree:degrees[midi]||'♯',frequency:440*2**((midi-69)/12)}));
  const byCode=new Map(notes.map(n=>[n.code,n])),byMidi=new Map(notes.map(n=>[n.midi,n]));
  const sequence=text=>text.split('|').map(bar=>bar.trim().split(/\s+/).map(token=>{const [key,length]=token.split(':');return Object.freeze({midi:notes.find(n=>n.key===key).midi,beats:Number(length)||1});}));
  const songs=[
    {id:'star',name:'小星星',subtitle:'从第一个 A 开始',credit:'法国传统旋律 · 本站入门编配',bars:sequence('A A G G H H G:2 | F F D D S S A:2 | G G F F D D S:2 | G G F F D D S:2 | A A G G H H G:2 | F F D D S S A:2')},
    {id:'tiger',name:'两只老虎',subtitle:'四个音也有旋律',credit:'法国传统轮唱旋律 · 本站入门编配',bars:sequence('A S D A | A S D A | D F G:2 | D F G:2 | G:.5 H:.5 G:.5 F:.5 D A | G:.5 H:.5 G:.5 F:.5 D A | A G A:2 | A G A:2')},
    {id:'joy',name:'欢乐颂',subtitle:'试试有长短的节奏',credit:'贝多芬旋律 · 本站入门片段编配',bars:sequence('D D F G | G F D S | A A S D | D:1.5 S:.5 S:2 | D D F G | G F D S | A A S D | S:1.5 A:.5 A:2')}
  ].map(s=>Object.freeze({...s,events:Object.freeze(s.bars.flat())}));
  function create(song=songs[0]){
    let cursor=0,mistakes=0,mode='learn';const held=new Map();
    const active=midi=>[...held.values()].includes(midi);
    function press(midi,source){if(!byMidi.has(midi)||held.has(source))return null;const start=!active(midi);held.set(source,midi);let correct=null,advanced=false;if(start&&mode==='learn'&&cursor<song.events.length){correct=song.events[cursor].midi===midi;if(correct){cursor++;advanced=true;}else mistakes++;}return{midi,start,correct,advanced,finished:cursor===song.events.length};}
    function release(source){const midi=held.get(source);if(midi===undefined)return null;held.delete(source);return{midi,stop:!active(midi)};}
    return {press,release,active,clear(){held.clear();},reset(next=song){song=next;cursor=mistakes=0;held.clear();},setMode(value){if(!['learn','free'].includes(value))return;mode=value;cursor=mistakes=0;held.clear();},snapshot(){return{cursor,mistakes,mode,total:song.events.length,target:song.events[cursor]?.midi??null,held:[...new Set(held.values())]};}};
  }
  return{notes:Object.freeze(notes),songs:Object.freeze(songs),byCode,byMidi,create};
});

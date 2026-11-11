const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function load(storage){const sandbox={window:{},localStorage:storage,document:{querySelector:()=>({})},setTimeout,clearTimeout};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/js/data.js'),'utf8').replace('window.Night =','Night ='),sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/js/store.js'),'utf8'),sandbox);return sandbox.Night;}
test('denied storage never reports a successful write',()=>{const n=load({getItem(){throw Error('Denied');},setItem(){throw Error('Denied');}});assert.equal(n.store.write('messages',[]),false);assert.equal(n.store.read('draft','fallback'),'fallback');});
test('corrupted JSON falls back without breaking the page',()=>{const n=load({getItem:()=>'{broken',setItem(){}});assert.equal(n.store.read('motion','full'),'full');});
test('favorites reject unknown article IDs and invalid shapes',()=>{const n=load({getItem:()=>JSON.stringify(['visual-system','missing']),setItem(){}});assert.equal(n.favoriteIds().join(','),'visual-system');const wrong=load({getItem:()=>JSON.stringify({wrong:true}),setItem(){}});assert.equal(wrong.favoriteIds().length,0);});
test('message archive removes invalid entries and bounds record count',()=>{const entries=[null,{},...Array.from({length:70},()=>({name:'访客',text:'留言内容',topic:'设计反馈'}))];const n=load({getItem:()=>JSON.stringify(entries),setItem(){}});assert.equal(n.messages().length,50);});
test('user text is escaped before use in trusted templates',()=>{const n=load({getItem:()=>null,setItem(){}});assert.equal(n.escape('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');});
test('all article IDs are unique and valid for direct hash links',()=>{const n=load({getItem:()=>null,setItem(){}});const ids=n.posts.map(p=>p.id);assert.equal(new Set(ids).size,ids.length);assert(ids.every(id=>/^[a-z0-9-]+$/.test(id)));});

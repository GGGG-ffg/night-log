// Static assets are the deliverable; build validates without rewriting them.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../dist');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css|svg))"/g)){
 const file=path.resolve(root,match[1]);
 if(!fs.existsSync(file))throw Error('Missing local resource: '+match[1]);
 if(file.endsWith('.js'))new vm.Script(fs.readFileSync(file,'utf8'),{filename:match[1]});
}
console.log('Static resource paths and JavaScript syntax verified. Output: dist/');

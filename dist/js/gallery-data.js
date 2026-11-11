/* Public archive data: no personal media or metadata. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Night.galleryData=api;})(typeof window==='object'?window:globalThis,()=>{
 const categories=['全部','日落与夜空','山水之间','旅行片段'];
 const photos=[];
 const select=category=>photos.filter(p=>category==='全部'||p.category===category);
 function move(list,id,delta){if(!list.length)return null;const i=list.findIndex(p=>p.id===id);return list[((i<0?0:i)+delta%list.length+list.length)%list.length];}
 return{photos:Object.freeze(photos),categories:Object.freeze(categories),select,move};
});

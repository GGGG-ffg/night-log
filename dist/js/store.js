/* Keep storage failures visible. A success message must mean persistence succeeded. */
Night.store = {
  available: true,
  read(key, fallback) {
    try { const raw = localStorage.getItem('night.v2.' + key); return raw === null ? fallback : JSON.parse(raw); }
    catch { this.available = false; return fallback; }
  },
  write(key, value) {
    try { localStorage.setItem('night.v2.' + key, JSON.stringify(value)); this.available = true; return true; }
    catch { this.available = false; return false; }
  }
};
Night.escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
Night.favoriteIds = () => { const ids = Night.store.read('favorites', []); return Array.isArray(ids) ? ids.filter(id => Night.posts.some(p => p.id === id)) : []; };
Night.messages = () => {const list=Night.store.read('messages',[]);return Array.isArray(list)?list.filter(m=>m&&typeof m.name==='string'&&typeof m.text==='string'&&typeof m.topic==='string').slice(-50):[];};
Night.toast = function(message) { const el=document.querySelector('#toast'); el.textContent=message; el.classList.add('visible');clearTimeout(Night.toastTimer);Night.toastTimer=setTimeout(()=>el.classList.remove('visible'),3200); };

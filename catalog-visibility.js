/* Shared catalog show/hide panel — wizard + listing.
 * Persists to localStorage; falls back to redhorse-db.js config default. */
(function(){
  const esc = s => String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');

  if(!document.getElementById('cv-style')){
    const st=document.createElement('style');
    st.id='cv-style';
    st.textContent=`
.cv-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;margin-bottom:14px}
.cv-lbl{font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
.cv-chips{display:flex;gap:8px;flex-wrap:wrap;flex:1}
.cv-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1.5px solid #e2e8f0;border-radius:20px;background:#f8fafc;cursor:pointer;font-size:12.5px;font-weight:600;color:#64748b;transition:all .12s;font-family:inherit}
.cv-chip:hover{border-color:#c4b5fd;color:#334155}
.cv-chip.on{background:#ede9fe;border-color:#7c3aed;color:#5b21b6}
.cv-chip .cv-ic{font-size:15px}
.cv-chip .cv-ct{font-size:10.5px;color:#94a3b8;font-weight:700}
.cv-chip.on .cv-ct{color:#7c3aed}
.cv-chip .cv-sw{font-size:9px;font-weight:800;letter-spacing:.04em;padding:1px 6px;border-radius:10px;background:#e2e8f0;color:#64748b}
.cv-chip.on .cv-sw{background:#7c3aed;color:#fff}
.cv-reset{font-size:11.5px;font-weight:700;padding:5px 11px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;color:#64748b;white-space:nowrap}
.cv-reset:hover{background:#f8fafc;border-color:#c4b5fd;color:#5b21b6}`;
    document.head.appendChild(st);
  }

  window.RH_CATALOG_VIS = {
    _cb: null,

    toggle(id){
      const cur = RH_HELPERS.visibleCatalogIds();
      let next;
      if(cur.includes(id)){
        next = cur.filter(x=>x!==id);
        if(!next.length) return cur;
      } else {
        next = [...cur, id];
      }
      RH_HELPERS.setVisibleCatalogIds(next);
      return next;
    },

    reset(){
      RH_HELPERS.resetVisibleCatalogs();
    },

    render(mountId, onChange){
      RH_CATALOG_VIS._cb = onChange;
      const el = document.getElementById(mountId);
      if(!el) return;
      const visible = new Set(RH_HELPERS.visibleCatalogIds());
      const chips = RH_DB.catalogs.map(c=>{
        const n = RH_HELPERS.templateCount(c.id);
        const on = visible.has(c.id);
        return `<button type="button" class="cv-chip ${on?'on':''}" onclick="RH_CATALOG_VIS._toggle('${esc(c.id)}')">
          <span class="cv-ic">${c.icon}</span><span>${esc(c.id)}</span>
          <span class="cv-ct">${n} range${n!==1?'s':''}</span>
          <span class="cv-sw">${on?'ON':'OFF'}</span>
        </button>`;
      }).join('');
      el.innerHTML = `<div class="cv-bar">
        <span class="cv-lbl">Show catalogs</span>
        <div class="cv-chips">${chips}</div>
        <button type="button" class="cv-reset" onclick="RH_CATALOG_VIS._reset()">Reset default</button>
      </div>`;
    },

    _toggle(id){
      RH_CATALOG_VIS.toggle(id);
      RH_CATALOG_VIS.render('cat-vis', RH_CATALOG_VIS._cb);
      if(RH_CATALOG_VIS._cb) RH_CATALOG_VIS._cb();
    },

    _reset(){
      RH_CATALOG_VIS.reset();
      RH_CATALOG_VIS.render('cat-vis', RH_CATALOG_VIS._cb);
      if(RH_CATALOG_VIS._cb) RH_CATALOG_VIS._cb();
    }
  };
})();

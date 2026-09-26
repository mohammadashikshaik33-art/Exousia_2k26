import"./style-BfnsTj4u.js";const C={"CLUE'D UP":{day:"DAY 1 — SEPTEMBER 30",date:"SEPTEMBER 30",time:"9:30 AM – 3:00 PM",venue:"Loyalty – 3 Block (C-Block)"},"HAWKINS TRAP":{day:"DAY 1 — SEPTEMBER 30",date:"SEPTEMBER 30",time:"9:30 AM – 3:00 PM",venue:"Loyalty – 3 Block (C-Block)"},"DARK PROTOCOL":{day:"DAY 2 — OCTOBER 1",date:"OCTOBER 1",time:"9:00 AM – 1:00 PM",venue:"Loyalty – 3 Block (C-Block)"},GENOVA:{day:"DAY 2 — OCTOBER 1",date:"OCTOBER 1",time:"9:00 AM – 1:00 PM",venue:"Computer Lab"}};let s="CLUE'D UP",c=null;function L(){const n=document.getElementById("coord-key-input");if(n&&n.value.trim().length>0){const o=n.value.trim();return sessionStorage.setItem("exousia_coord_key",o),o}return sessionStorage.getItem("exousia_coord_key")||""}async function l(){const n=document.getElementById("coord-event-select"),o=document.getElementById("coord-search-input"),t=document.getElementById("coord-table-body"),e=document.getElementById("stat-total-count"),i=document.getElementById("stat-event-name"),p=document.getElementById("stat-event-date"),E=document.getElementById("stat-event-time"),x=document.getElementById("stat-event-venue"),a=document.getElementById("table-record-count");n&&(s=n.value||"CLUE'D UP");const v=L(),g=o?o.value.trim():"",y=C[s]||C["CLUE'D UP"];if(i&&(i.textContent=s),p&&(p.textContent=y.date),E&&(E.textContent=y.time),x&&(x.textContent=y.venue.toUpperCase()),!v){t&&(t.innerHTML=`
        <tr>
          <td colspan="7" class="py-8 text-center text-amber-400 font-bold">
            [ 401 UNAUTHORIZED ]: Please enter your coordinator secret key in the header input to unlock ${s} records.
          </td>
        </tr>
      `),e&&(e.textContent="0"),a&&(a.textContent="0");return}t&&(t.innerHTML=`
      <tr>
        <td colspan="7" class="py-8 text-center text-on-surface-variant">
          <div class="flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-primary animate-spin">sync</span> Authorizing and loading records for ${s}...
          </div>
        </td>
      </tr>
    `);try{const d=new URLSearchParams;d.set("event",s),g&&d.set("search",g);const u=await fetch(`/api/coordinator/registrations?${d.toString()}`,{headers:{Authorization:`Bearer ${v}`}}),m=await u.json().catch(()=>({}));if(u.status===401){t&&(t.innerHTML=`
          <tr>
            <td colspan="7" class="py-8 text-center text-red-400 font-bold">
              [ 401 UNAUTHORIZED ]: Invalid coordinator secret key. Access denied.
            </td>
          </tr>
        `),e&&(e.textContent="0"),a&&(a.textContent="0");return}if(u.status===403){t&&(t.innerHTML=`
          <tr>
            <td colspan="7" class="py-8 text-center text-red-400 font-bold">
              [ 403 FORBIDDEN ]: Your coordinator key is NOT authorized to access ${s} registrations.
            </td>
          </tr>
        `),e&&(e.textContent="0"),a&&(a.textContent="0");return}if(u.ok&&m.success){const f=m.records||[],T=m.totalCount||f.length;if(e&&(e.textContent=T),a&&(a.textContent=f.length),f.length===0){t&&(t.innerHTML=`
            <tr>
              <td colspan="7" class="py-8 text-center text-on-surface-variant">
                No participant registrations found matching the current search criteria.
              </td>
            </tr>
          `);return}t&&(t.innerHTML=f.map((r,h)=>{const I=r.created_at?new Date(r.created_at).toLocaleDateString("en-US",{month:"short",day:"2-digit"}):"SEPT 30";return`
            <tr class="hover:bg-surface-container/40 transition-colors">
              <td class="py-3 px-3 text-on-surface-variant font-bold">${h+1}</td>
              <td class="py-3 px-3 text-primary font-bold select-text">${r.registration_id||"EX-2026"}</td>
              <td class="py-3 px-3 font-bold text-on-surface uppercase">${r.full_name||"Participant"}</td>
              <td class="py-3 px-3 text-on-surface-variant">${r.college||"Institution"}</td>
              <td class="py-3 px-3 text-on-surface-variant select-text">${r.email||"-"}</td>
              <td class="py-3 px-3 text-on-surface-variant">${I}</td>
              <td class="py-3 px-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  ${r.status||"CONFIRMED"}
                </span>
              </td>
            </tr>
          `}).join(""))}else t&&(t.innerHTML=`
          <tr>
            <td colspan="7" class="py-8 text-center text-red-400">
              [ ERROR ]: Failed to retrieve coordinator records. ${m.message||""}
            </td>
          </tr>
        `)}catch(d){console.error("Coordinator Load Error:",d),t&&(t.innerHTML=`
        <tr>
          <td colspan="7" class="py-8 text-center text-red-400">
            [ ERROR ]: Connection failed. Please check network connection.
          </td>
        </tr>
      `)}}function B(){const n=document.getElementById("coord-event-select"),o=document.getElementById("coord-search-input"),t=document.getElementById("coord-key-input"),e=document.getElementById("coord-refresh-btn"),i=sessionStorage.getItem("exousia_coord_key");i&&t&&(t.value=i),t&&t.addEventListener("input",()=>{c&&clearTimeout(c),c=setTimeout(l,400)}),n&&n.addEventListener("change",()=>{l()}),o&&o.addEventListener("input",()=>{c&&clearTimeout(c),c=setTimeout(l,300)}),e&&e.addEventListener("click",()=>{l()}),l()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",B):B();

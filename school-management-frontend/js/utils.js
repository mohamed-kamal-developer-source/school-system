function showLoading(){document.getElementById('loading').style.display='flex'}
function hideLoading(){document.getElementById('loading').style.display='none'}
function goBack(){window.history.back()}
class Toast{static show(m,t='info',d=3000){const c=document.getElementById('toast-container');const e=document.createElement('div');e.className=`toast toast-${t}`;const i={'success':'✓','error':'✕','info':'ℹ'}[t]||'ℹ';e.innerHTML=`<span class="toast-icon">${i}</span><span class="toast-message">${m}</span>`;c.appendChild(e);setTimeout(()=>{e.classList.add('toast-fade-out');setTimeout(()=>e.remove(),300)},d)}}
class Modal{static show(t,c,f=''){const o=document.getElementById('modal-overlay');document.getElementById('modalTitle').textContent=t;document.getElementById('modalBody').innerHTML=c;document.getElementById('modalFooter').innerHTML=f;o.style.display='flex';document.getElementById('modalClose').onclick=()=>this.close();o.onclick=(e)=>{if(e.target===o)this.close()}}
static close(){document.getElementById('modal-overlay').style.display='none'}
static confirm(t,m,cb){const f=`<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" id="confirmBtn">Confirm</button>`;this.show(t,`<p>${m}</p>`,f);document.getElementById('confirmBtn').onclick=()=>{cb();this.close()}}}
if(typeof window!=='undefined'){window.Toast=Toast;window.Modal=Modal;window.showLoading=showLoading;window.hideLoading=hideLoading;window.goBack=goBack}

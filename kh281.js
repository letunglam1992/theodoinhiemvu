(function(){
 'use strict';
 const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const date=v=>v?v.slice(8)+'/'+v.slice(5,7)+'/'+v.slice(0,4):'Chưa nêu ngày cụ thể';
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 let tasks=[],reports=[],periods=[],loaded=false,stamp='',busy=false,current=null;
 const theme=()=>{try{document.documentElement.dataset.theme=JSON.parse(localStorage.getItem('task_dashboard_review_v2_theme'))||'light';}catch{}};
 theme();window.addEventListener('storage',theme);
 if(new URLSearchParams(location.search).has('embed'))document.body.classList.add('embedded');
 function message(text,warn=false){$('connection').textContent=text;$('connection').classList.toggle('warn',warn);}
 function options(){const currentPeriod=$('period').value,currentUnit=$('unit').value;$('period').innerHTML=periods.map(p=>`<option>${esc(p.name)}</option>`).join('');if(periods.some(p=>p.name===currentPeriod))$('period').value=currentPeriod;const units=[...new Set(tasks.map(t=>t.unit))];$('unit').innerHTML='<option value="">Tất cả đơn vị</option>'+units.map(u=>`<option>${esc(u)}</option>`).join('');if(units.includes(currentUnit))$('unit').value=currentUnit;}
 function render(){
  current=KH281.build(tasks,reports,$('period').value,today());
  const selected=$('unit').value,q=$('search').value.toLocaleLowerCase('vi'),status=$('status').value;
  const filtered=current.rows.filter(t=>(!selected||t.unit===selected)&&(!q||[t.id,t.title,t.unit,t.report?.owner,t.report?.result].join(' ').toLocaleLowerCase('vi').includes(q))&&(!status||(status==='Thiếu hồ sơ'?t.quality!=='Đủ dữ liệu':status==='Chậm tiến độ'?t.late:(t.report?.status||'Chưa cập nhật')===status)));
  $('total').textContent=current.total;$('updated').textContent=loaded?current.updated:'—';$('done').textContent=loaded?current.done:'—';$('missing').textContent=loaded?current.missing:'—';
  $('stamp').textContent=loaded?'Lần tải: '+stamp:'Danh mục khởi tạo từ công văn; chưa có kết quả thực tế';
  const p=periods.find(p=>p.name===$('period').value);
  $('deadline').innerHTML=p?`<b>${esc(p.name)}</b> · Đơn vị gửi: <b>${esc(p.original)}</b> (ngày cuối ${date(p.unit_due)}).<br>KHTC tổng hợp: ${esc(p.coordinator_original)}${p.coordinator_due?' (ngày cuối '+date(p.coordinator_due)+')':''}.${loaded&&p.unit_due&&p.unit_due<today()&&current.missing?' <strong>Còn '+current.missing+' phần việc chưa đủ hồ sơ khi đã qua hạn gửi.</strong>':''}`:'';
  $('units').innerHTML=current.units.map(u=>`<tr><td>${esc(u.unit)}</td><td>${u.total}</td>${[u.updated,u.done,u.late,u.complete,u.missing].map(n=>'<td>'+(loaded?n:'—')+'</td>').join('')}</tr>`).join('');
  $('result-count').textContent=filtered.length+' / '+tasks.length+' phần việc';
  $('tasks').innerHTML=filtered.map(t=>{
   const r=t.report;const tone=t.late?'bad':t.quality!=='Đủ dữ liệu'?'warn':'';
   return `<tr><td><b>${esc(t.id)}</b><small>${esc(t.unit)}</small><small>${esc(t.ref)}${t.stt?' · STT '+esc(t.stt)+' KH 281':''} · ${esc(t.role)}</small></td><td><b>${esc(t.title)}</b><details><summary>Sản phẩm, phối hợp và kết quả</summary><div class="body"><p><b>Sản phẩm theo công văn:</b> ${esc(t.product||'Chưa quy định riêng; đơn vị đăng ký')}</p><p><b>Phối hợp:</b> ${esc(t.partners||'Chưa nêu riêng')}</p>${r?['goal','product','leader','owner','solution','resources','result','difficulty','responsibility','remedy','request','review'].map((key,i)=>r[key]?'<p><b>'+['Mục tiêu','Sản phẩm đăng ký','Lãnh đạo','Cá nhân phụ trách','Giải pháp','Nguồn lực','Kết quả','Khó khăn / nguyên nhân','Trách nhiệm','Khắc phục','Kiến nghị','Ý kiến KHTC'][i]+':</b> '+esc(r[key])+'</p>':'').join(''):''}${r?.remedyDue?'<p><b>Hạn khắc phục:</b> '+date(r.remedyDue)+'</p>':''}</div></details></td><td>${esc(t.horizon||'Chưa nêu riêng trong công văn')}${r?.due?'<small>Đơn vị đăng ký: '+date(r.due)+'</small>':''}</td><td><span class="pill ${tone}">${esc(loaded?(t.duplicate?'Trùng dòng, cần xử lý':r?.status||'Chưa cập nhật'):'Chưa tải kết quả')}</span>${r?.progress!=null?'<small>'+r.progress+'%</small>':''}${t.late?'<small>Cần đôn đốc tiến độ</small>':''}</td><td><span class="pill ${tone}">${esc(loaded?t.quality:'Chưa tải kết quả')}</span>${r?.proof?'<small>'+esc(r.proof)+'</small>':''}${r?.updatedAt?'<small>'+date(r.updatedAt)+' · '+esc(r.updatedBy)+'</small>':''}</td></tr>`;
  }).join('')||'<tr><td colspan="5" class="error-empty">Không có nhiệm vụ phù hợp bộ lọc.</td></tr>';
  $('export').disabled=!loaded;
  if(loaded&&current.warnings.length)message('Đã tải dữ liệu nhưng cần kiểm tra: '+current.warnings.join('; '),true);
 }
 async function sync(){
  if(busy)return;
  let cfg;try{cfg=JSON.parse(localStorage.getItem('task_dashboard_review_v2_sheet_sync')||'{}');}catch{cfg={};}
  if(!cfg.webAppUrl||!cfg.webAppSecret){message('Danh mục 21 phần việc đã sẵn sàng. Để tải kết quả thật, lưu URL Web App và mã bí mật trong “Đồng bộ Google Sheet → Kết nối” của dashboard chính; xem hướng dẫn bên dưới.',true);return;}
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(cfg.webAppUrl)){message('URL Web App cần là địa chỉ https://script.google.com/macros/s/…/exec.',true);return;}
  busy=true;$('refresh').disabled=true;message('Đang tải biểu chuyên đề từ Apps Script…');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
  try{
   const resp=await fetch(cfg.webAppUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},credentials:'omit',redirect:'follow',cache:'no-store',body:JSON.stringify({secret:cfg.webAppSecret,action:'kh281Data'}),signal:controller.signal});
   let j;try{j=JSON.parse(await resp.text());}catch{throw Error('Web App chưa trả JSON; kiểm tra triển khai và quyền truy cập.');}
   if(!j.ok){const msgs={unauthorized:'Mã bí mật chưa khớp. Giữ mã cũ giống nhau trên dashboard và Apps Script.',secret_not_configured:'Apps Script chưa đặt mã bí mật; thay giá trị mặc định bằng mã đang dùng rồi triển khai lại.',unknown_action:'Cần cập nhật Apps Script phiên bản 6 trong dashboard và triển khai Phiên bản mới.'};throw Error(msgs[j.error]||j.message||j.error||'Không tải được biểu.');}
   const next=KH281.fromSheet(j);tasks=next.tasks;reports=next.reports;periods=next.periods;loaded=true;stamp=new Date().toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});options();render();
   if(j.truncated)message('Biểu có trên 999 dòng cập nhật; chưa thể tổng hợp đầy đủ. KHTC cần mở rộng giới hạn trước khi dùng kết quả.',true);
   else if(!current.warnings.length)message('Đã tải kết quả từ biểu chuyên đề. Tự tải lại mỗi 60 giây khi mục này đang hiển thị; có thể bấm “Tải kết quả từ Sheet” để lấy ngay.');
  }catch(e){message((loaded?'Giữ kết quả của lần tải trước. ':'')+(e.name==='AbortError'?'Web App chưa phản hồi sau 45 giây; thử tải lại.':e.message),true);}
  finally{clearTimeout(timer);busy=false;$('refresh').disabled=false;}
 }
 let isVisible=true;new IntersectionObserver(entries=>{isVisible=entries[0]?.isIntersecting??true;}).observe(document.body);
 setInterval(()=>{if(loaded&&isVisible&&document.visibilityState==='visible')sync();},60000);
 for(const id of ['period','unit','status'])$(id).addEventListener('change',render);$('search').addEventListener('input',render);
 $('mine').addEventListener('click',()=>{$('unit').value='Phòng Kế hoạch - Tài chính';render();});$('refresh').addEventListener('click',sync);
 $('export').addEventListener('click',()=>{if(!loaded)return;const selected=$('unit').value;const rows=current.rows.filter(t=>!selected||t.unit===selected);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([KH281.csv(rows)],{type:'text/csv;charset=utf-8'}));a.download='Tong_hop_KH281_'+$('period').value.replace(/[^\p{L}\p{N}]/gu,'_')+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
 new ResizeObserver(()=>{if(parent!==window)parent.postMessage({type:'kh281-height',height:Math.ceil(document.body.getBoundingClientRect().height)},location.origin);}).observe(document.body);
 (async()=>{try{const [source,pp,config]=await Promise.all(['kh281-data.json','kh281-periods.json','kh281-config.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error('Không tải được '+url);return r.json();}));tasks=source.tasks;periods=pp;$('open-sheet').href=config.spreadsheetUrl+'#gid='+config.inputSheetId;options();render();await sync();}catch(e){message(e.message,true);}})();
})();

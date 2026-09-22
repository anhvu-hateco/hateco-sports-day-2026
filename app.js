const API_URL='https://script.google.com/macros/s/AKfycbz9kntIYYsvnHiAHGQK_555mkeAJkzvsu07RKhuYL0duKf4JOi8WE6fdTXhd9Olf9On/exec';
const SPORTS={M01:'Bóng bàn',M02:'Pickleball đôi nam nữ',M03:'Pickleball đôi nam',M04:'Chạy 100m nam',M05:'Chạy 100m nữ',M06:'Chạy tiếp sức 2500m',M07:'Bóng đá',M08:'Kéo co'};
let rows=[]; const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function csvParse(t){let a=[],r=[],v='',q=false;for(let i=0;i<t.length;i++){let c=t[i],n=t[i+1];if(q){if(c==='"'&&n==='"'){v+='"';i++}else if(c==='"')q=false;else v+=c}else if(c==='"')q=true;else if(c===','){r.push(v);v=''}else if(c==='\n'){r.push(v.replace(/\r$/,''));a.push(r);r=[];v=''}else v+=c}if(v||r.length){r.push(v);a.push(r)}return a}
async function load(){
 if(!API_URL.startsWith('https://script.google.com/')) throw Error('Chưa cấu hình URL Google Apps Script trong app.js');
 const res=await fetch(`${API_URL}?sheet=05_Ket_qua&t=${Date.now()}`,{cache:'no-store'});
 if(!res.ok) throw Error(`API trả về lỗi HTTP ${res.status}`);
 const data=await res.json();
 if(!data.ok) throw Error(data.error||'Google Apps Script không trả về dữ liệu');
 rows=(data.rows||[]).filter(r=>r.Match_ID);
 $('#live').textContent='● Dữ liệu trực tuyến • v15';
 buildNav(); show('home');
}
function buildNav(){let n=$('#nav');n.innerHTML=`<button data-id="home">Tổng quan</button>`+Object.entries(SPORTS).map(([id,n])=>`<button data-id="${id}">${n}</button>`).join('');n.onclick=e=>{if(e.target.dataset.id)show(e.target.dataset.id)}}
function num(v){let n=parseFloat(String(v??'').trim().replace(',','.'));return Number.isFinite(n)?n:null}
function setScore(r){let a=0,b=0,pfA=0,pfB=0;for(let i=1;i<=5;i++){let x=num(r[`BB Set ${i} - A`]),y=num(r[`BB Set ${i} - B`]);if(x!==null&&y!==null){pfA+=x;pfB+=y;if(x>y)a++;else if(y>x)b++}}return {a,b,pfA,pfB}}
function winner(r){if(r.Mon_ID==='M01'){let s=setScore(r);return s.a>=3?'A':s.b>=3?'B':null}let a=num(r['BTC nhập / Hệ thống tính A']),b=num(r['BTC nhập / Hệ thống tính B']);if(a===null||b===null||a===b)return null;return a>b?'A':'B'}
function played(r){if(r.Mon_ID==='M01')return !!winner(r);let a=num(r['BTC nhập / Hệ thống tính A']),b=num(r['BTC nhập / Hệ thống tính B']);if(['M04','M05','M06'].includes(r.Mon_ID))return a!==null;return a!==null&&b!==null&&!!winner(r)}
function groups(mid){return [...new Set(rows.filter(r=>r.Mon_ID===mid&&r['Vòng']==='Vòng bảng').map(r=>r['Bảng/Lượt']).filter(Boolean))]}
function participants(ms){let m={};for(let r of ms)for(let s of ['A','B']){let n=r[s==='A'?'Đối tượng A':'Đối tượng B'],lq=r[s==='A'?'LQ_A':'LQ_B'];if(n&&!m[n])m[n]={name:n,lq,w:0,l:0,pf:0,pa:0,sf:0,sa:0}}return m}
function statsFor(mid,ms){let map=participants(ms);for(let r of ms){let w=winner(r);if(!w)continue;let A=map[r['Đối tượng A']],B=map[r['Đối tượng B']];if(!A||!B)continue;if(w==='A'){A.w++;B.l++}else{B.w++;A.l++}if(mid==='M01'){let s=setScore(r);A.sf+=s.a;A.sa+=s.b;B.sf+=s.b;B.sa+=s.a;A.pf+=s.pfA;A.pa+=s.pfB;B.pf+=s.pfB;B.pa+=s.pfA}else{let x=num(r['BTC nhập / Hệ thống tính A']),y=num(r['BTC nhập / Hệ thống tính B']);A.pf+=x;A.pa+=y;B.pf+=y;B.pa+=x}}return map}
function headToHeadWins(names,ms){let h=Object.fromEntries(names.map(n=>[n,0]));for(let r of ms){if(!names.includes(r['Đối tượng A'])||!names.includes(r['Đối tượng B']))continue;let w=winner(r);if(w)h[w==='A'?r['Đối tượng A']:r['Đối tượng B']]++}return h}
function standings(mid,group){let ms=rows.filter(r=>r.Mon_ID===mid&&r['Vòng']==='Vòng bảng'&&r['Bảng/Lượt']===group),map=statsFor(mid,ms),arr=Object.values(map);
 // Quy tắc: thắng -> đối đầu trực tiếp -> HS set (BB) -> HS điểm -> điểm thắng.
 arr.sort((a,b)=>b.w-a.w||a.name.localeCompare(b.name,'vi'));
 let out=[];for(let i=0;i<arr.length;){let j=i+1;while(j<arr.length&&arr[j].w===arr[i].w)j++;let tie=arr.slice(i,j);if(tie.length>1){let h=headToHeadWins(tie.map(x=>x.name),ms);tie.sort((a,b)=>h[b.name]-h[a.name]||(mid==='M01'?((b.sf-b.sa)-(a.sf-a.sa)):0)||((b.pf-b.pa)-(a.pf-a.pa))||b.pf-a.pf||a.name.localeCompare(b.name,'vi'))}out.push(...tie);i=j}return out}
function adjustedRunner(mid,group,runner){let st=standings(mid,group),ms=rows.filter(r=>r.Mon_ID===mid&&r['Vòng']==='Vòng bảng'&&r['Bảng/Lượt']===group),use=ms;
 // So sánh Nhì xuất sắc giữa bảng khác quy mô: bảng 4 người bỏ kết quả gặp người hạng 4.
 if(st.length===4&&st[3])use=ms.filter(r=>r['Đối tượng A']!==st[3].name&&r['Đối tượng B']!==st[3].name);
 let m=statsFor(mid,use)[runner.name]||runner;return {...m,group,original:runner}}
function groupComplete(mid,group){
 const ms=rows.filter(r=>r.Mon_ID===mid&&r['Vòng']==='Vòng bảng'&&r['Bảng/Lượt']===group);
 return ms.length>0 && ms.every(r=>played(r));
}
function groupStageComplete(mid){
 const gs=groups(mid);
 return gs.length>0 && gs.every(g=>groupComplete(mid,g));
}
function bestRunners(mid){if(!groupStageComplete(mid))return [];let a=[];for(let g of groups(mid)){let st=standings(mid,g);if(st[1])a.push(adjustedRunner(mid,g,st[1]))}a.sort((x,y)=>y.w-x.w||((y.pf-y.pa)-(x.pf-x.pa))||y.pf-x.pf||x.name.localeCompare(y.name,'vi'));return a.slice(0,2)}
function runnerAssignments(mid){let ru=bestRunners(mid);if(ru.length<2)return {ru1:ru[0]||null,ru2:ru[1]||null,qf1:ru[1]||null,qf4:ru[0]||null};let q1=ru[1],q4=ru[0];if((q1.group==='Bảng A'||q4.group==='Bảng F')&&ru[0].group!=='Bảng A'&&ru[1].group!=='Bảng F'){q1=ru[0];q4=ru[1]}return {ru1:ru[0],ru2:ru[1],qf1:q1,qf4:q4}}
function findMatch(id){return rows.find(r=>r.Match_ID===id)}
function sideObj(r,side){if(!r)return null;let n=r[side==='A'?'Đối tượng A':'Đối tượng B'],lq=r[side==='A'?'LQ_A':'LQ_B'];return n?{name:n,lq}:null}
function winObj(id){
 let r=findMatch(id),w=winner(r);
 if(!r||!w)return null;
 // Quan trọng: trận vòng trong chứa placeholder (Nhất bảng..., Thắng Tứ kết...).
 // Người thắng phải kế thừa VĐV/đội thực đã được resolve từ slot của chính trận đó.
 return resolvedSide(r,w);
}
function groupRankObj(mid,g,rank){let s=standings(mid,g)[rank-1];return s?{name:s.name,lq:s.lq,group:g}:null}
function resolveCode(code,mid){if(!code)return null;if(code.startsWith('WIN_'))return winObj(code.slice(4));let m=code.match(/^M0[123]_G([A-F])_R1$/);if(m){const g=`Bảng ${m[1]}`;return groupComplete(mid,g)?groupRankObj(mid,g,1):null;}if(code.includes('BEST_RU1')){let x=runnerAssignments(mid).ru1;return x?{name:x.name,lq:x.lq,group:x.group}:null}if(code.includes('BEST_RU2')){let x=runnerAssignments(mid).ru2;return x?{name:x.name,lq:x.lq,group:x.group}:null}if(code.includes('BEST_RU2_NOT_GA')){let x=runnerAssignments(mid).qf1;return x?{name:x.name,lq:x.lq,group:x.group}:null}if(code.includes('BEST_RU1_NOT_GF')){let x=runnerAssignments(mid).qf4;return x?{name:x.name,lq:x.lq,group:x.group}:null}if(code.startsWith('M04_HEAT_RANK_')){let qrows=rows.filter(r=>r.Mon_ID==='M04'&&r['Vòng']==='Vòng loại');if(!qrows.length||!qrows.every(r=>num(r['BTC nhập / Hệ thống tính A'])!==null))return null;let rank=+code.split('_').pop(),x=runningQualifiers()[rank-1];return x?{name:x.name,lq:x.lq}:null}return null}
function resolvedSide(r,side){
 let code=r[side==='A'?'Slot_A_Code':'Slot_B_Code'];
 let o=resolveCode(code,r.Mon_ID);
 if(code) return o; // Có slot kỹ thuật: chưa đủ dữ liệu thì phải để trống/chờ xác định.
 return sideObj(r,side);
}
function runningQualifiers(){return rows.filter(r=>r.Mon_ID==='M04'&&r['Vòng']==='Vòng loại'&&num(r['BTC nhập / Hệ thống tính A'])!==null).map(r=>({name:r['Đối tượng A'],lq:r.LQ_A,t:num(r['BTC nhập / Hệ thống tính A'])})).sort((a,b)=>a.t-b.t).slice(0,4)}
function score(r){if(r.Mon_ID==='M01'){let s=setScore(r);return s.a||s.b?`${s.a} – ${s.b}`:'—'}let a=r['BTC nhập / Hệ thống tính A'],b=r['BTC nhập / Hệ thống tính B'];return a!==''&&b!==''?`${esc(a)} – ${esc(b)}`:a!==''?esc(a):'—'}
function recent(){return rows.filter(r=>played(r)).slice(-6).reverse()}
function medalAdd(m,lq,i,n=1){if(lq&&m[lq])m[lq][i]+=n}
function medals(){
 let m={LQ1:[0,0,0],LQ2:[0,0,0],LQ3:[0,0,0],LQ4:[0,0,0]};
 // Các môn loại trực tiếp: CK cho Vàng/Bạc, hai người/đội thua BK đồng Huy chương Đồng.
 for(let mid of ['M01','M02','M03','M07','M08']){let rs=rows.filter(r=>r.Mon_ID===mid),final=rs.find(r=>r['Vòng']==='Chung kết'),semis=rs.filter(r=>String(r['Vòng']).startsWith('Bán kết'));if(final&&winner(final)){let w=winner(final),wo=resolvedSide(final,w),lo=resolvedSide(final,w==='A'?'B':'A');medalAdd(m,wo?.lq,0);medalAdd(m,lo?.lq,1)}for(let s of semis){let w=winner(s);if(w){let lo=resolvedSide(s,w==='A'?'B':'A');medalAdd(m,lo?.lq,2)}}}
 // Chạy: lấy thứ hạng từ thành tích hợp lệ.
 let men=rows.filter(r=>r.Mon_ID==='M04'&&r['Vòng']==='Chung kết'&&num(r['BTC nhập / Hệ thống tính A'])!==null).map(r=>({lq:resolvedSide(r,'A')?.lq||r.LQ_A,t:num(r['BTC nhập / Hệ thống tính A'])})).sort((a,b)=>a.t-b.t);
 let women=rows.filter(r=>r.Mon_ID==='M05'&&r['Vòng']==='Vòng loại'&&num(r['BTC nhập / Hệ thống tính A'])!==null).map(r=>({lq:r.LQ_A,t:num(r['BTC nhập / Hệ thống tính A'])})).sort((a,b)=>a.t-b.t);
 let relay=rows.filter(r=>r.Mon_ID==='M06'&&num(r['BTC nhập / Hệ thống tính A'])!==null).map(r=>({lq:r.LQ_A,t:num(r['BTC nhập / Hệ thống tính A'])})).sort((a,b)=>a.t-b.t);
 for(let a of [men,women,relay])for(let i=0;i<Math.min(3,a.length);i++)medalAdd(m,a[i].lq,i);
 return m
}

function lqNo(lq){let m=String(lq||'').match(/(\d+)/);return m?+m[1]:0}
function lqLabel(lq){let n=lqNo(lq);return n?`Liên quân ${n}`:(lq||'')}
function lqPill(lq){let n=lqNo(lq);return `<span class="lq-pill lq-pill-${n}">${esc(lqLabel(lq))}</span>`}
function lqDot(lq){let n=lqNo(lq);return n?`<span class="lq-dot lq-dot-${n}" title="${esc(lqLabel(lq))}"></span>`:''}
function medalMark(type){
 const label={gold:'HCV',silver:'HCB',bronze:'HCĐ'}[type]||'';
 return `<span class="medal-badge medal-${type}">${label}</span>`;
}
function medalSummary(){
 const out={};
 for(const [mid,name] of Object.entries(SPORTS)) out[mid]={name,gold:null,silver:null,bronze:[]};
 for(let mid of ['M01','M02','M03','M07','M08']){
   let rs=rows.filter(r=>r.Mon_ID===mid),f=rs.find(r=>r['Vòng']==='Chung kết'),semis=rs.filter(r=>String(r['Vòng']).startsWith('Bán kết'));
   if(f&&winner(f)){let w=winner(f);out[mid].gold=resolvedSide(f,w);out[mid].silver=resolvedSide(f,w==='A'?'B':'A')}
   for(let sf of semis){let w=winner(sf);if(w){let lo=resolvedSide(sf,w==='A'?'B':'A');if(lo)out[mid].bronze.push(lo)}}
 }
 const rankRun=(mid,filterFn)=>{
   let a=rows.filter(r=>r.Mon_ID===mid&&filterFn(r)&&num(r['BTC nhập / Hệ thống tính A'])!==null)
    .map(r=>({name:resolvedSide(r,'A')?.name||r['Đối tượng A'],lq:resolvedSide(r,'A')?.lq||r.LQ_A,t:num(r['BTC nhập / Hệ thống tính A'])}))
    .sort((a,b)=>a.t-b.t);
   if(a[0])out[mid].gold=a[0]; if(a[1])out[mid].silver=a[1]; if(a[2])out[mid].bronze=[a[2]];
 };
 rankRun('M04',r=>r['Vòng']==='Chung kết');
 rankRun('M05',r=>r['Vòng']==='Vòng loại');
 rankRun('M06',r=>true);
 return out;
}
function medalPerson(o,kind){
 const mark=medalMark(kind);
 return o
  ? `<div class="medal-person medal-team-only">${mark}${lqDot(o.lq)}<span class="medal-lq">${esc(lqLabel(o.lq))}</span></div>`
  : `<div class="medal-person muted">${mark}<span>Chưa xác định</span></div>`;
}
function overviewMedals(){
 const sm=medalSummary();
 return `<div class="section-title"><h2>Huy chương theo nội dung</h2><span>Cập nhật tự động từ kết quả thi đấu</span></div>
 <div class="sport-medal-grid">${Object.entries(sm).map(([mid,x])=>`<div class="sport-medal-card">
   <div class="sport-medal-title">${esc(x.name)}</div>
   ${medalPerson(x.gold,'gold')}${medalPerson(x.silver,'silver')}
   ${x.bronze.length?x.bronze.map(o=>medalPerson(o,'bronze')).join(''):`<div class="medal-person muted">${medalMark('bronze')}<span>Chưa xác định</span></div>`}
 </div>`).join('')}</div>`;
}
function groupTable(mid,g){
 let st=standings(mid,g);
 return `<div class="group-card"><h3>${esc(g)}</h3><div class="table-wrap compact"><table><thead><tr><th>#</th><th>VĐV/Đội</th><th>LQ</th><th>Thắng</th><th>Thua</th>${mid==='M01'?'<th>HS set</th>':''}<th>HS điểm</th></tr></thead><tbody>${st.map((x,i)=>`<tr class="${i<2?'q':''}"><td class="rank">${i+1}</td><td>${esc(x.name)}</td><td>${lqDot(x.lq)}</td><td>${x.w}</td><td>${x.l}</td>${mid==='M01'?`<td>${x.sf-x.sa}</td>`:''}<td>${x.pf-x.pa}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function allRunners(mid){
 if(!groupStageComplete(mid)) return [];
 let a=[];
 for(let g of groups(mid)){let st=standings(mid,g);if(st[1])a.push(adjustedRunner(mid,g,st[1]))}
 a.sort((x,y)=>y.w-x.w||((y.pf-y.pa)-(x.pf-x.pa))||y.pf-x.pf||x.name.localeCompare(y.name,'vi'));
 return a;
}
function runnersAllBlock(mid){
 let a=allRunners(mid);
 if(!a.length)return `<div class="notice">Chờ hoàn thành toàn bộ vòng bảng để so sánh các VĐV/đội Nhì bảng.</div>`;
 return `<h3>So sánh các Nhì bảng</h3><div class="table-wrap"><table><thead><tr><th>#</th><th>VĐV/Đội</th><th>Bảng</th><th>LQ</th><th>Thắng</th><th>HS điểm</th><th>Tổng điểm thắng</th><th>Kết quả</th></tr></thead><tbody>${a.map((x,i)=>`<tr class="${i<2?'q':''}"><td class="rank">${i+1}</td><td>${esc(x.name)}</td><td>${esc(x.group)}</td><td>${lqDot(x.lq)}</td><td>${x.w}</td><td>${x.pf-x.pa}</td><td>${x.pf}</td><td>${i<2?'<b>✅ Vào Tứ kết</b>':'—'}</td></tr>`).join('')}</tbody></table></div><div class="notice">Bảng 4 VĐV/đội: khi so sánh Nhì xuất sắc, hệ thống loại kết quả gặp người/đội xếp thứ 4.</div>`;
}


function show(id){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.id===id));id==='home'?home():sport(id);scrollTo({top:0,behavior:'smooth'})}
function sportMeta(mid){
 const cfg={
  M01:['23 VĐV','6 bảng vòng tròn','8 VĐV vào Tứ kết','BO5'],
  M02:['21 cặp đôi','6 bảng vòng tròn','8 cặp vào Tứ kết','Loại trực tiếp'],
  M03:['22 cặp đôi','6 bảng vòng tròn','8 cặp vào Tứ kết','Loại trực tiếp'],
  M04:['28 VĐV','7 lượt vòng loại','Top 4 vào Chung kết','100m nam'],
  M05:['10 VĐV','3 lượt chạy','Xếp hạng toàn giải','100m nữ'],
  M06:['9 đội','Tiếp sức 2.500m','Top 3 nhận huy chương','Xếp hạng thời gian'],
  M07:['4 đội','2 trận Bán kết','Chung kết','70 phút'],
  M08:['4 đội','2 trận Bán kết','Chung kết','BO3']
 }; return cfg[mid]||[];
}
function sportIcon(mid){return {M01:'◉',M02:'◉',M03:'◉',M04:'⌁',M05:'⌁',M06:'⇢',M07:'⚽',M08:'⇆'}[mid]||'◆'}
function home(){
 let md=medals();
 $('#app').innerHTML=`
 <section class="home-banner">
   <div class="home-banner-copy"><div class="kicker">HATECO GROUP • SPORTS DAY 2026</div><h2>HỘI THAO HATECO 2026</h2><p>Thi đấu hết mình • Kết nối đồng đội • Bứt phá giới hạn</p>
   <div class="hero-stats"><span><b>8</b> nội dung</span><span><b>4</b> liên quân</span><span><b>LIVE</b> kết quả trực tuyến</span></div></div>
   <div class="home-banner-mark">26</div>
 </section>
 <div class="section-title"><h2>Bảng tổng huy chương</h2><span>Cập nhật tự động theo kết quả chính thức</span></div>
 <div class="grid team-medals">${['LQ1','LQ2','LQ3','LQ4'].map((q,i)=>`<div class="team lq${i+1}"><h3>Liên quân ${i+1}</h3><div class="medal-counts"><span>${medalMark('gold')} <b>${md[q][0]}</b></span><span>${medalMark('silver')} <b>${md[q][1]}</b></span><span>${medalMark('bronze')} <b>${md[q][2]}</b></span></div></div>`).join('')}</div>
 ${overviewMedals()}
 <div class="section-title"><h2>8 nội dung thi đấu</h2><span>Chọn nội dung để xem bảng xếp hạng và kết quả</span></div>
 <div class="sport-overview-grid">${Object.entries(SPORTS).map(([id,n])=>`<button class="sport-overview-card" onclick="show('${id}')"><div class="sport-icon">${sportIcon(id)}</div><div><h3>${esc(n)}</h3><p>${sportMeta(id).slice(0,3).join(' • ')}</p></div><span class="arrow">→</span></button>`).join('')}</div>`;
}
function dateText(r){return r['Ngày']||''}
function placeText(r){return r['Địa điểm']||''}
function setDetails(r){
 if(r.Mon_ID!=='M01')return '';
 let sets=[]; for(let i=1;i<=5;i++){let a=num(r[`BB Set ${i} - A`]),b=num(r[`BB Set ${i} - B`]);if(a!==null&&b!==null)sets.push(`<span>Ván ${i}: <b>${a}–${b}</b></span>`)}
 return sets.length?`<details class="set-details"><summary>Xem tỷ số từng ván</summary><div>${sets.join('')}</div></details>`:'';
}
function resultCard(r){
 let A=resolvedSide(r,'A'),B=resolvedSide(r,'B'),w=winner(r),parts=score(r).split('–');
 let nameA=A?.name||r['Đối tượng A']||'Chờ xác định', nameB=B?.name||r['Đối tượng B']||'';
 return `<article class="result-card" data-round="${esc(r['Vòng'])}" data-group="${esc(r['Bảng/Lượt'])}" data-lqa="${esc(A?.lq||r.LQ_A)}" data-lqb="${esc(B?.lq||r.LQ_B)}" data-search="${esc((nameA+' '+nameB).toLowerCase())}">
   <div class="result-meta"><span>${esc(r['Vòng']||'Thi đấu')}</span>${r['Bảng/Lượt']?`<span>${esc(r['Bảng/Lượt'])}</span>`:''}${dateText(r)?`<span>📅 ${esc(dateText(r))}</span>`:''}${placeText(r)?`<span>📍 ${esc(placeText(r))}</span>`:''}<b>Đã thi đấu</b></div>
   <div class="result-versus">
    <div class="result-player ${w==='A'?'win':''}">${lqDot(A?.lq||r.LQ_A)}<strong>${esc(nameA)}</strong></div>
    <div class="result-score">${esc(parts[0]||'')} <i>:</i> ${esc(parts[1]||'')}</div>
    <div class="result-player right ${w==='B'?'win':''}"><strong>${esc(nameB)}</strong>${lqDot(B?.lq||r.LQ_B)}</div>
   </div>${setDetails(r)}
 </article>`;
}
function resultFilters(mid,rs){
 let rounds=[...new Set(rs.map(r=>r['Vòng']).filter(Boolean))], gr=[...new Set(rs.map(r=>r['Bảng/Lượt']).filter(Boolean))];
 return `<div class="result-filters"><label class="searchbox">⌕ <input id="resultSearch" placeholder="Tìm theo tên VĐV / cặp đấu..." oninput="filterResults()"></label>
 <select id="roundFilter" onchange="filterResults()"><option value="">Tất cả vòng đấu</option>${rounds.map(x=>`<option>${esc(x)}</option>`).join('')}</select>
 <select id="groupFilter" onchange="filterResults()"><option value="">Tất cả các bảng</option>${gr.map(x=>`<option>${esc(x)}</option>`).join('')}</select>
 <select id="teamFilter" onchange="filterResults()"><option value="">Tất cả liên quân</option><option value="LQ1">🔴 Liên quân 1</option><option value="LQ2">🟢 Liên quân 2</option><option value="LQ3">🟡 Liên quân 3</option><option value="LQ4">🔵 Liên quân 4</option></select></div>`;
}
function filterResults(){
 let q=($('#resultSearch')?.value||'').toLowerCase().trim(),rv=$('#roundFilter')?.value||'',gv=$('#groupFilter')?.value||'',tv=$('#teamFilter')?.value||'';
 document.querySelectorAll('.result-card').forEach(el=>{let ok=(!q||el.dataset.search.includes(q))&&(!rv||el.dataset.round===rv)&&(!gv||el.dataset.group===gv)&&(!tv||el.dataset.lqa===tv||el.dataset.lqb===tv);el.hidden=!ok});
 let n=[...document.querySelectorAll('.result-card')].filter(x=>!x.hidden).length;let c=$('#resultCount');if(c)c.textContent=`${n} trận đấu`;
}
function resultList(mid,rs){
 let done=rs.filter(r=>played(r));
 return `${resultFilters(mid,done)}<div id="resultCount" class="result-count">${done.length} trận đấu</div><div class="result-list">${done.map(resultCard).join('')||'<div class="empty-card">Chưa có kết quả.</div>'}</div>`;
}
function podium(a){
 if(!a.length)return '';
 let order=[a[1],a[0],a[2]].filter(Boolean), types=['silver','gold','bronze'];
 return `<div class="podium">${order.map((x,i)=>`<div class="podium-card place-${i===1?1:i===0?2:3}"><div class="podium-medal">${medalMark(types[i])}</div><strong>${esc(x.name)}</strong><div>${lqDot(x.lq)}</div><b>${x.t}s</b></div>`).join('')}</div>`;
}
function runTableV11(a,title,mark,medal){
 return `<div class="section-title small"><h2>${title}</h2></div><div class="table-wrap pro-table"><table><thead><tr><th>Hạng</th><th>VĐV/Đội</th><th>Liên quân</th><th>Thời gian chạy</th><th>Huy chương</th></tr></thead><tbody>${a.map((x,i)=>`<tr class="${i<mark?'q':''}"><td class="rank">${i+1}</td><td><b>${esc(x.name)}</b></td><td>${lqDot(x.lq)}</td><td><b>${x.t}s</b></td><td>${medal&&i<3?[medalMark('gold'),medalMark('silver'),medalMark('bronze')][i]:'—'}</td></tr>`).join('')||'<tr><td colspan="5">Chưa có thành tích.</td></tr>'}</tbody></table></div>`;
}
function heatResults(mid,rs){
 let active=rs.filter(r=>r.Slot_A_Code!=='DISABLED'&&!String(r['Ghi chú']).startsWith('KHÔNG SỬ DỤNG')&&num(r['BTC nhập / Hệ thống tính A'])!==null);
 let heatRows=mid==='M04'?active.filter(r=>r['Vòng']==='Vòng loại'):active;
 let all=heatRows.map(r=>({id:r.Match_ID,name:r['Đối tượng A'],lq:r.LQ_A,t:num(r['BTC nhập / Hệ thống tính A']),heat:r['Bảng/Lượt']})).sort((x,y)=>x.t-y.t);
 let globalRank=new Map(all.map((x,i)=>[x.id,i+1]));
 let hs=[...new Set(heatRows.map(r=>r['Bảng/Lượt']).filter(Boolean))];
 return `<div class="section-title"><h2>Kết quả các lượt chạy</h2><span>Xếp hạng tổng thể ${all.length} VĐV theo thành tích vòng loại</span></div>
 <div class="heat-grid">${hs.map(h=>{let a=heatRows.filter(r=>r['Bảng/Lượt']===h).map(r=>({id:r.Match_ID,name:r['Đối tượng A'],lq:r.LQ_A,t:num(r['BTC nhập / Hệ thống tính A'])})).sort((x,y)=>x.t-y.t);
 return `<div class="heat-card"><h3>${esc(h)}</h3><table><thead><tr><th>Hạng</th><th>VĐV/Đội</th><th>LQ</th><th>Thời gian chạy</th></tr></thead><tbody>${a.map(x=>`<tr><td><b>${globalRank.get(x.id)}</b></td><td>${esc(x.name)}</td><td>${lqDot(x.lq)}</td><td><b>${x.t}s</b></td></tr>`).join('')}</tbody></table></div>`}).join('')}</div>`;
}
function runningV11(mid,rs){
 let active=rs.filter(r=>r.Slot_A_Code!=='DISABLED'&&!String(r['Ghi chú']).startsWith('KHÔNG SỬ DỤNG'));
 let final=[];
 if(mid==='M04') final=active.filter(r=>r['Vòng']==='Chung kết').map(r=>{let o=resolvedSide(r,'A');return {name:o?.name||r['Đối tượng A'],lq:o?.lq||r.LQ_A,t:num(r['BTC nhập / Hệ thống tính A'])}}).filter(x=>x.t!==null).sort((a,b)=>a.t-b.t);
 else final=active.filter(r=>num(r['BTC nhập / Hệ thống tính A'])!==null).map(r=>({name:r['Đối tượng A'],lq:r.LQ_A,t:num(r['BTC nhập / Hệ thống tính A'])})).sort((a,b)=>a.t-b.t);
 let heats = mid==='M04' ? heatResults(mid,rs) : '';
 return `<div class="championship-block"><div class="section-title"><h2>Bảng xếp hạng chung cuộc</h2><span>Thành tích chính thức</span></div>${podium(final.slice(0,3))}${runTableV11(final,'Xếp hạng',mid==='M04'?4:3,true)}</div>${heats}`;
}
function knockoutV11(mid,rs){
 let ks=rs.filter(r=>!['Vòng bảng','Vòng loại'].includes(r['Vòng'])&&!String(r['Ghi chú']).startsWith('KHÔNG SỬ DỤNG')), order=[...new Set(ks.map(r=>r['Vòng']))];
 const gd=!['M01','M02','M03'].includes(mid)||groupStageComplete(mid);
 return `<div class="section-title"><h2>${['M07','M08'].includes(mid)?'Kết quả thi đấu':'Vòng đấu loại trực tiếp'}</h2></div><div class="bracket pro-bracket">${order.map(v=>`<div class="round"><h3>${esc(v)}</h3>${ks.filter(r=>r['Vòng']===v).map(r=>{let A=gd?resolvedSide(r,'A'):null,B=gd?resolvedSide(r,'B'):null,w=gd?winner(r):null,sc=gd&&played(r)?score(r).split('–'):['',''];return `<div class="match"><div class="line ${w?(w==='A'?'side-win':'side-lose'):''}">${lqDot(A?.lq)}<span>${esc(A?.name||(gd?'Chờ kết quả vòng trước':'Chờ vòng bảng'))}</span><b>${sc[0]||''}</b></div><div class="line ${w?(w==='B'?'side-win':'side-lose'):''}">${lqDot(B?.lq)}<span>${esc(B?.name||(gd?'Chờ kết quả vòng trước':'Chờ vòng bảng'))}</span><b>${sc[1]||''}</b></div></div>`}).join('')}</div>`).join('')}</div>`;
}
function finalRankingTeams(mid,rs){
 let f=rs.find(r=>r['Vòng']==='Chung kết'), out=[];
 if(f&&winner(f)){let w=winner(f),a=resolvedSide(f,w),b=resolvedSide(f,w==='A'?'B':'A');if(a)out.push({...a,medal:`${medalMark('gold')} HCV`});if(b)out.push({...b,medal:`${medalMark('silver')} HCB`})}
 rs.filter(r=>String(r['Vòng']).startsWith('Bán kết')).forEach(r=>{let w=winner(r);if(w){let o=resolvedSide(r,w==='A'?'B':'A');if(o)out.push({...o,medal:`${medalMark('bronze')} HCĐ`})}});
 return `<div class="section-title"><h2>Kết quả chung cuộc</h2></div><div class="final-team-grid">${out.map((x,i)=>`<div class="final-team-card rank-${i+1}"><span>${x.medal}</span>${lqDot(x.lq)}<strong>${esc(x.name)}</strong></div>`).join('')||'<div class="empty-card">Chưa xác định kết quả chung cuộc.</div>'}</div>`;
}
function sport(mid,tab='ranking'){
 let rs=rows.filter(r=>r.Mon_ID===mid);
 let html=`<section class="sport-title"><div class="sport-title-icon">${sportIcon(mid)}</div><div><div class="crumb">Hội thao 2026 › ${esc(SPORTS[mid])}</div><h1>${esc(SPORTS[mid])}</h1><div class="sport-chips">${sportMeta(mid).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></section>`;
 if(['M01','M02','M03'].includes(mid)){
   html+=`<div class="subtabs"><button class="${tab==='ranking'?'active':''}" onclick="sport('${mid}','ranking')">Bảng xếp hạng</button><button class="${tab==='results'?'active':''}" onclick="sport('${mid}','results')">Kết quả trận đấu</button></div>`;
   if(tab==='ranking'){
     html+=`<div class="section-title"><h2>Vòng bảng</h2></div><div class="group-grid">${groups(mid).map(g=>groupTable(mid,g)).join('')}</div>${runnersAllBlock(mid)}${knockoutV11(mid,rs)}`;
   }else html+=resultList(mid,rs);
 }else if(['M04','M05','M06'].includes(mid)){
   html+=runningV11(mid,rs);
 }else{
   html+=finalRankingTeams(mid,rs)+knockoutV11(mid,rs);
 }
 $('#app').innerHTML=html;
}
// Kiểm thử nhanh engine ngay trên trình duyệt (không sửa dữ liệu thật).
window.HATECO_ENGINE={standings,bestRunners,runnerAssignments,resolveCode,resolvedSide,winObj,winner,medals,medalSummary,runningQualifiers};
load().catch(e=>{$('#live').textContent='● Chưa kết nối';$('#app').innerHTML=`<div class="empty"><h2>Chưa đọc được dữ liệu Google Sheets</h2><p>${esc(e.message)}</p><p>Kiểm tra URL Web App trong app.js và quyền triển khai Apps Script.</p></div>`});

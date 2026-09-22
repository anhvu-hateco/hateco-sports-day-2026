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
 $('#live').textContent='● Dữ liệu trực tuyến • v8';
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
function winObj(id){let r=findMatch(id),w=winner(r);return w?sideObj(r,w):null}
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
function lqDot(lq){let n=lqNo(lq);return `<span class="lq-dot lq-dot-${n}" title="${esc(lqLabel(lq))}"></span>`}
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
function medalPerson(o,kind){return o?`<div class="medal-person">${kind} ${lqPill(o.lq)}<span>${esc(o.name)}</span></div>`:`<div class="medal-person muted">— Chưa xác định</div>`}
function overviewMedals(){
 const sm=medalSummary();
 return `<div class="section-title"><h2>Huy chương theo nội dung</h2><span>Cập nhật tự động từ kết quả thi đấu</span></div>
 <div class="sport-medal-grid">${Object.entries(sm).map(([mid,x])=>`<div class="sport-medal-card">
   <div class="sport-medal-title">${esc(x.name)}</div>
   ${medalPerson(x.gold,'🥇')}${medalPerson(x.silver,'🥈')}
   ${x.bronze.length?x.bronze.map(o=>medalPerson(o,'🥉')).join(''):`<div class="medal-person muted">🥉 Chưa xác định</div>`}
 </div>`).join('')}</div>`;
}
function groupTable(mid,g){
 let st=standings(mid,g);
 return `<div class="group-card"><h3>${esc(g)}</h3><div class="table-wrap compact"><table><thead><tr><th>#</th><th>VĐV/Đội</th><th>LQ</th><th>Thắng</th><th>Thua</th>${mid==='M01'?'<th>HS set</th>':''}<th>HS điểm</th></tr></thead><tbody>${st.map((x,i)=>`<tr class="${i<2?'q':''}"><td class="rank">${i+1}</td><td>${esc(x.name)}</td><td>${lqPill(x.lq)}</td><td>${x.w}</td><td>${x.l}</td>${mid==='M01'?`<td>${x.sf-x.sa}</td>`:''}<td>${x.pf-x.pa}</td></tr>`).join('')}</tbody></table></div></div>`;
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
 return `<h3>So sánh các Nhì bảng</h3><div class="table-wrap"><table><thead><tr><th>#</th><th>VĐV/Đội</th><th>Bảng</th><th>LQ</th><th>Thắng</th><th>HS điểm</th><th>Tổng điểm thắng</th><th>Kết quả</th></tr></thead><tbody>${a.map((x,i)=>`<tr class="${i<2?'q':''}"><td class="rank">${i+1}</td><td>${esc(x.name)}</td><td>${esc(x.group)}</td><td>${lqPill(x.lq)}</td><td>${x.w}</td><td>${x.pf-x.pa}</td><td>${x.pf}</td><td>${i<2?'<b>✅ Vào Tứ kết</b>':'—'}</td></tr>`).join('')}</tbody></table></div><div class="notice">Bảng 4 VĐV/đội: khi so sánh Nhì xuất sắc, hệ thống loại kết quả gặp người/đội xếp thứ 4.</div>`;
}

function show(id){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.id===id));id==='home'?home():sport(id);scrollTo({top:0,behavior:'smooth'})}
function home(){
 let md=medals();
 $('#app').innerHTML=`<div class="grid">${['LQ1','LQ2','LQ3','LQ4'].map((q,i)=>`<div class="team lq${i+1}"><h3>Liên quân ${i+1}</h3><div class="num">${md[q][0]} 🥇</div><div>🥈 ${md[q][1]} &nbsp; 🥉 ${md[q][2]}</div></div>`).join('')}</div>
 ${overviewMedals()}
 <div class="section-title"><h2>8 nội dung thi đấu</h2></div><div class="cards">${Object.entries(SPORTS).map(([id,n])=>`<div class="card sport-card"><div class="team-stripe"></div><div class="sport">${n}</div><div class="meta">${rows.filter(r=>r.Mon_ID===id).length} lượt/trận trong dữ liệu</div><p><button onclick="show('${id}')">Xem kết quả →</button></p></div>`).join('')}</div>`}
function matchCard(r){
 let A=resolvedSide(r,'A'),B=resolvedSide(r,'B'),w=winner(r),sc=score(r),parts=sc.split('–');
 return `<div class="card match-card"><div class="match-top"><span class="badge">${esc(r['Vòng']||'Thi đấu')}</span><span class="meta">${esc(r['Bảng/Lượt']||'')}</span></div>
 <div class="competitor ${w==='A'?'winner':''}"><span class="who">${lqDot(A?.lq||r.LQ_A)}<b>${esc(A?.name||r['Đối tượng A']||'Chờ xác định')}</b></span><span class="match-score">${esc(parts[0]||'')}</span></div>
 ${(r['Đối tượng B']||B)?`<div class="competitor ${w==='B'?'winner':''}"><span class="who">${lqDot(B?.lq||r.LQ_B)}<b>${esc(B?.name||r['Đối tượng B']||'Chờ xác định')}</b></span><span class="match-score">${esc(parts[1]||'')}</span></div>`:''}</div>`;
}

function runnersBlock(mid){let r=bestRunners(mid);if(!r.length)return'';return `<h3>Nhì bảng xuất sắc</h3><div class="table-wrap"><table><thead><tr><th>#</th><th>VĐV/Đội</th><th>Bảng</th><th>LQ</th><th>Thắng</th><th>HS điểm</th><th>Điểm thắng</th></tr></thead><tbody>${r.map((x,i)=>`<tr class="q"><td class="rank">${i+1}</td><td>${esc(x.name)}</td><td>${esc(x.group)}</td><td>${esc(x.lq)}</td><td>${x.w}</td><td>${x.pf-x.pa}</td><td>${x.pf}</td></tr>`).join('')}</tbody></table></div><div class="notice">Với bảng 4 VĐV/đội, khi so sánh Nhì xuất sắc hệ thống loại kết quả gặp người/đội xếp thứ 4.</div>`}
function sport(mid,tab='ranking'){
 let rs=rows.filter(r=>r.Mon_ID===mid);
 let html=`<div class="sport-head"><div><div class="crumb">Tổng quan › ${esc(SPORTS[mid])}</div><h2>${esc(SPORTS[mid])}</h2></div><span>${rs.length} lượt/trận</span></div>`;
 if(['M01','M02','M03'].includes(mid)){
   html+=`<div class="subtabs"><button class="${tab==='ranking'?'active':''}" onclick="sport('${mid}','ranking')">Bảng xếp hạng</button><button class="${tab==='results'?'active':''}" onclick="sport('${mid}','results')">Kết quả trận đấu</button></div>`;
   if(tab==='ranking'){
     html+=`<h3>Vòng bảng</h3><div class="group-grid">${groups(mid).map(g=>groupTable(mid,g)).join('')}</div>`;
     html+=runnersAllBlock(mid);
     html+=knockout(mid,rs);
   }else{
     html+=`<div class="section-title"><h2>Kết quả trận đấu</h2><span>Điểm số theo từng trận</span></div><div class="cards">${rs.filter(r=>played(r)).map(matchCard).join('')||'<div class="card">Chưa có kết quả.</div>'}</div>`;
   }
 }else if(['M04','M05','M06'].includes(mid)){
   html+=running(mid,rs);
   html+=`<div class="section-title"><h2>Kết quả chi tiết</h2></div><div class="cards">${rs.filter(r=>played(r)).map(matchCard).join('')||'<div class="card">Chưa có kết quả.</div>'}</div>`;
 }else{
   html+=knockout(mid,rs);
   html+=`<div class="section-title"><h2>Kết quả chi tiết</h2></div><div class="cards">${rs.filter(r=>played(r)).map(matchCard).join('')||'<div class="card">Chưa có kết quả.</div>'}</div>`;
 }
 $('#app').innerHTML=html;
}function knockout(mid,rs){
 let ks=rs.filter(r=>!['Vòng bảng','Vòng loại'].includes(r['Vòng'])&&!String(r['Ghi chú']).startsWith('KHÔNG SỬ DỤNG'));
 if(!ks.length)return'';
 let order=[...new Set(ks.map(r=>r['Vòng']))];
 const isGroupSport=['M01','M02','M03'].includes(mid);
 const groupsDone=!isGroupSport || groupStageComplete(mid);
 return `<div class="section-title"><h2>Vòng đấu loại trực tiếp</h2></div>
 ${isGroupSport&&!groupsDone?'<div class="notice"><b>Vòng bảng chưa hoàn thành.</b> Danh sách Tứ kết sẽ chỉ xuất hiện sau khi toàn bộ kết quả vòng bảng được nhập đầy đủ.</div>':''}
 <div class="bracket">${order.map(v=>`<div class="round"><h3>${esc(v)}</h3>${ks.filter(r=>r['Vòng']===v).map(r=>{
   let A=null,B=null;
   // Khóa cứng toàn bộ nhánh knockout của BB/Pickleball cho tới khi vòng bảng hoàn tất.
   if(groupsDone){A=resolvedSide(r,'A');B=resolvedSide(r,'B')}
   let sc=(groupsDone&&played(r))?score(r).split('–'):['',''];
   let wait=isGroupSport&&!groupsDone?'Chờ hoàn thành vòng bảng':'Chờ kết quả vòng trước';
   return `<div class="match"><div class="line"><span>${lqDot(A?.lq)} ${esc(A?.name||wait)}</span><b>${sc[0]||''}</b></div><div class="line"><span>${lqDot(B?.lq)} ${esc(B?.name||wait)}</span><b>${sc[1]||''}</b></div></div>`
 }).join('')}</div>`).join('')}</div>`}
function running(mid,rs){let active=rs.filter(r=>r.Slot_A_Code!=='DISABLED'&&!String(r['Ghi chú']).startsWith('KHÔNG SỬ DỤNG'));if(mid==='M04'){let heats=active.filter(r=>r['Vòng']==='Vòng loại'&&num(r['BTC nhập / Hệ thống tính A'])!==null).map(r=>({name:r['Đối tượng A'],lq:r.LQ_A,t:num(r['BTC nhập / Hệ thống tính A'])})).sort((a,b)=>a.t-b.t), finals=active.filter(r=>r['Vòng']==='Chung kết').map(r=>{let o=resolvedSide(r,'A');return {name:o?.name||'Chờ xác định',lq:o?.lq||'',t:num(r['BTC nhập / Hệ thống tính A'])}}).filter(x=>x.t!==null).sort((a,b)=>a.t-b.t);return `<div class="notice">4 VĐV có thời gian vòng loại nhanh nhất được hệ thống tự xác định vào Chung kết.</div>${runTable(heats,'Xếp hạng vòng loại',4,false)}${runTable(finals,'Chung kết',3,true)}`}let vals=active.filter(r=>num(r['BTC nhập / Hệ thống tính A'])!==null).map(r=>({name:r['Đối tượng A'],lq:r.LQ_A,t:num(r['BTC nhập / Hệ thống tính A'])})).sort((a,b)=>a.t-b.t);return runTable(vals,'Xếp hạng thành tích',3,true)}
function runTable(a,title,mark,medal){return `<h3>${title}</h3><div class="table-wrap"><table><thead><tr><th>#</th><th>VĐV/Đội</th><th>LQ</th><th>Thành tích</th></tr></thead><tbody>${a.map((x,i)=>`<tr class="${i<mark?'q':''}"><td class="rank">${i+1}${medal&&i<3?' '+['🥇','🥈','🥉'][i]:''}</td><td>${esc(x.name)}</td><td>${esc(x.lq)}</td><td><b>${x.t}</b></td></tr>`).join('')||'<tr><td colspan="4">Chưa có thành tích.</td></tr>'}</tbody></table></div>`}
// Kiểm thử nhanh engine ngay trên trình duyệt (không sửa dữ liệu thật).
window.HATECO_ENGINE={standings,bestRunners,runnerAssignments,resolveCode,winner,medals,runningQualifiers};
load().catch(e=>{$('#live').textContent='● Chưa kết nối';$('#app').innerHTML=`<div class="empty"><h2>Chưa đọc được dữ liệu Google Sheets</h2><p>${esc(e.message)}</p><p>Kiểm tra URL Web App trong app.js và quyền triển khai Apps Script.</p></div>`});

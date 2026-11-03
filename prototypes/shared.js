/* Stripe Fundraisers prototype: shared data, store and views. Concept only: fictional data, no backend. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
/* ───────── Format ───────── */
const m2=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const m0=n=>'$'+Math.round(n).toLocaleString('en-US');
const fmtD=s=>new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
const daysLeft=s=>Math.round((new Date(s+'T12:00:00')-TODAY)/864e5);
const pctS=x=>Math.round(x*100)+'%';

/* ───────── Icons (one outline set) ───────── */
const P={home:'M3 11l9-7 9 7v9h-6v-6H9v6H3z',bal:'M3 7h18v12H3zM3 11h18M7 15h4',tx:'M4 8h13l-3-3M20 16H7l3 3',cust:'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c1-4 4-6 8-6s7 2 8 6',cat:'M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10',conn:'M9 12a3 3 0 106 0 3 3 0 00-6 0M12 3v6M12 15v6M3 12h6M15 12h6',pay:'M3 6h18v12H3zM3 10h18',bill:'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',rep:'M4 20V10M10 20V4M16 20v-7M21 20H3',more:'M5 12h.01M12 12h.01M19 12h.01',heart:'M12 20s-8-5-8-11a4.5 4.5 0 018-3 4.5 4.5 0 018 3c0 6-8 11-8 11z',search:'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5',gear:'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1-1-3-2 .4-1.5-1.5L17 5l-3-1-1 2h-2L10 4 7 5l.4 2L6 8.500 4 8l-1 3 2 1v1l-2 1 1 3 2-.4L7.500 18 7 20l3 1 1-2h2l1 2 3-1-.4-2 1.500-1.500 2 .4 1-3-2-1z',bell:'M6 16V10a6 6 0 0112 0v6l2 2H4zM10 21h4',help:'M12 21a9 9 0 100-18 9 9 0 000 18zM9.500 9a2.500 2.500 0 114 2c-1 .7-1.500 1.200-1.500 2.500M12 17h.01',chev:'M7 10l5 5 5-5',chevr:'M9 6l6 6-6 6',check:'M5 12l5 5 9-10',x:'M6 6l12 12M18 6L6 18',pin:'M12 21s7-6 7-12a7 7 0 10-14 0c0 6 7 12 7 12zM12 11a2 2 0 100-4 2 2 0 000 4z',plus:'M12 5v14M5 12h14',cal:'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4'};
const I=(k,s=16,w=1.6)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[k]}"/></svg>`;


const EM={
 pantry:'M6 9h12l-1 11H7zM9 9V7a3 3 0 016 0v2',
 scholars:'M2 9l10-5 10 5-10 5zM6 11v5c3 2.500 9 2.500 12 0v-5',
 creek:'M12 3s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11z',
 tenant:'M4 11l8-7 8 7M6 10v10h12V10M10 20v-6h4v6',
 solar:'M12 16a4 4 0 100-8 4 4 0 000 8zM12 3v2M12 19v2M3 12h2M19 12h2M5.600 5.600l1.400 1.400M17 17l1.400 1.400M5.600 18.400L7 17M17 7l1.400-1.400',
 bike:'M6 18a3.500 3.500 0 100-7 3.500 3.500 0 000 7zM18 18a3.500 3.500 0 100-7 3.500 3.500 0 000 7zM6 14.500l4-6h5l3 6M10 8.500h-2M15 8.500l-1-3h2',
 reading:'M12 7c-2-2-5-2-8-1v13c3-1 6-1 8 1 2-2 5-2 8-1V6c-3-1-6-1-8 1zM12 7v13',
 arts:'M12 3a9 9 0 100 18c1.500 0 2-1 1.500-2s0-2.500 1.500-2.500h2.500A3.500 3.500 0 0021 13c0-5-4-10-9-10zM7.500 11h.01M10 7h.01M15 7.500h.01',
 savoy:'M4 11h16a8 8 0 01-16 0zM9 7c0-1 1-1 1-2M14 7c0-1 1-1 1-2M8 20h8'};
const logo=(o,s=40)=>`<div class="logo" style="width:${s}px;height:${s}px;background:${o.fg}" role="img" aria-label="${esc(o.org)} profile picture"><svg width="${s*.58}" height="${s*.58}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"><path d="${EM[o.em]||EM.pantry}"/></svg></div>`;
/* Placeholder covers: one flat style, swap for each organization's own photo */
function cover(id){
 const r=(x,y,w,h,f,rx=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" rx="${rx}"/>`;
 const c=(x,y,R,f)=>`<circle cx="${x}" cy="${y}" r="${R}" fill="${f}"/>`;
 const A={
 pantry:()=>{const sh=[86,152,218],cols=['#d9534f','#e8a33d','#6aa84f','#3d85c6','#c27ba0','#f1c232','#7f6000','#45818e'];let o=r(0,0,400,225,'#f4e8d3');sh.forEach((y,k)=>{let x=26+k*14,i=k*3;while(x<360){const w=20+((i*7)%18),h=26+((i*11)%26);o+=r(x,y-h,w,h,cols[i%8],i%3?3:9)+r(x+3,y-h+h*.35,w-6,h*.3,'#fff8');x+=w+7;i++}o+=r(0,y,400,8,'#a9744a')});return o},
 scholars:()=>r(0,0,400,225,'#fde2cc')+r(40,28,120,92,'#fff6ec',4)+r(98,28,4,92,'#e6b892')+r(40,72,120,4,'#e6b892')+r(0,190,400,35,'#c98a5e')+r(160,164,190,26,'#3d6db5',3)+r(176,140,160,24,'#e0564a',3)+r(168,116,172,24,'#f0b43c',3)+r(186,94,140,22,'#4b9e6b',3)+`<path d="M256 48l62 26-62 26-62-26z" fill="#22304a"/><path d="M224 88v18c20 12 44 12 64 0V88l-32 13z" fill="#31425f"/>`+r(316,74,3,34,'#f0b43c'),
 creek:()=>r(0,0,400,225,'#cfe8f3')+c(338,44,24,'#fbd46d')+r(0,96,400,129,'#8fc47a')+`<path d="M170 96c-30 34 60 40 26 74s-70 26-90 55h130c34-30 66-34 50-70s-70-30-74-59z" fill="#5aa6d6"/>`+[[56,96,30],[112,84,24],[340,100,34],[292,90,22]].map(([x,y,R])=>r(x-4,y,8,36,'#7a5a3a')+c(x,y,R,'#4f9a5b')).join('')+r(66,168,34,40,'#2e3a4a',8)+r(76,160,14,12,'#2e3a4a',3)+r(318,172,30,8,'#f0b43c',3)+r(326,160,8,20,'#f0b43c',3),
 tenant:()=>{const H=[['#c9a0dc',26,70,'#7a4ea3'],['#f2b8a0',118,50,'#b85f3f'],['#9fc5e8',210,82,'#3d6d9e'],['#b6d7a8',302,60,'#5a8a48']];return r(0,0,400,225,'#efe4f7')+H.map(([f,x,y,rf])=>`<path d="M${x-6} ${y}l50-34 50 34z" fill="${rf}"/>`+r(x,y,88,205-y,f)+[0,1].map(a=>[0,1,2].map(b=>y+14+b*40<170?r(x+12+a*38,y+14+b*40,26,26,'#fff3b0',2):'').join('')).join('')+r(x+32,180,24,25,'#5a3b6b')).join('')+r(0,205,400,20,'#8c7a96')},
 solar:()=>r(0,0,400,225,'#fdeab0')+c(320,52,34,'#f6b93b')+`<path d="M0 118c70-14 130-10 200 0s130 6 200-6v113H0z" fill="#d6bf5e"/>`+r(0,172,400,53,'#4c5566')+[20,100,180,260,340].map(x=>r(x,196,44,4,'#f1f1f1')).join('')+`<path d="M78 172c24-40 214-44 246 0z" fill="#1f3a68"/>`+[120,150,180,210,240,270].map(x=>`<path d="M${x} 146v26" stroke="#7fa6e0" stroke-width="2"/>`).join('')+`<path d="M92 160h216" stroke="#7fa6e0" stroke-width="2"/>`+r(186,132,40,14,'#a9d3f5',7)+c(128,178,11,'#111a2a')+c(276,178,11,'#111a2a'),
 bike:()=>{let d='';for(let x=20;x<400;x+=36)for(let y=20;y<160;y+=36)d+=c(x,y,2,'#b4c1ea');return r(0,0,400,225,'#dde5fb')+d+r(0,192,400,33,'#8d98b8')+`<g fill="none" stroke="#22304a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><circle cx="122" cy="146" r="44"/><circle cx="278" cy="146" r="44"/></g><g fill="none" stroke="#d9534f" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M122 146l54-66h74l28 66M176 80l32 66h-86M208 146l42-66"/><path d="M250 80l-8-24h26M176 80l-8-18M154 60h30"/></g><g stroke="#55607a" stroke-width="9" stroke-linecap="round"><path d="M330 40l34 34"/><path d="M36 42v50"/></g>`},
 reading:()=>r(0,0,400,225,'#fbdfe3')+c(70,50,8,'#f6b93b')+c(330,40,6,'#f6b93b')+c(358,92,9,'#f6b93b')+c(40,112,5,'#f6b93b')+`<path d="M200 74c-34-22-84-24-126-14v122c42-10 92-8 126 14 34-22 84-24 126-14V60c-42-10-92-8-126 14z" fill="#fff"/><path d="M200 74v122" stroke="#d9b3b9" stroke-width="3"/>`+[0,1,2,3].map(i=>r(96,84+i*22,84,6,'#e9a7b2',3)+r(220,84+i*22,84,6,'#e9a7b2',3)).join('')+`<path d="M74 182c42-10 92-8 126 14 34-22 84-24 126-14v14c-42-10-92-8-126 14-34-22-84-24-126-14z" fill="#b5475b"/>`,
 arts:()=>r(0,0,400,225,'#e6dffb')+r(0,172,400,18,'#a897c9')+r(0,190,400,35,'#8a78b0')+`<path d="M150 208l44-176M250 208l-44-176" stroke="#6b4a2f" stroke-width="8" stroke-linecap="round"/>`+r(126,40,148,110,'#fff',2)+c(170,84,22,'#f2a65a')+c(222,104,28,'#635bff')+`<path d="M134 142c30-30 60-24 80-8s36 10 52-6v18H134z" fill="#4fae7d"/>`+r(116,150,168,8,'#6b4a2f')+`<ellipse cx="336" cy="172" rx="40" ry="24" fill="#d9b58a"/>`+c(322,164,6,'#e0564a')+c(342,160,6,'#f0b43c')+c(358,172,6,'#3d85c6'),
 savoy:()=>r(0,0,400,225,'#e5efda')+r(0,178,400,47,'#7f8f6a')+`<path d="M170 72c-10-14 10-20 0-34M205 66c-10-14 10-20 0-34M240 72c-10-14 10-20 0-34" fill="none" stroke="#aebc99" stroke-width="6" stroke-linecap="round"/>`+r(116,84,168,16,'#3e4d3a',8)+r(126,96,148,82,'#55684f',8)+r(96,108,30,10,'#3e4d3a',5)+r(274,108,30,10,'#3e4d3a',5)+`<path d="M24 150h76c0 22-16 34-38 34s-38-12-38-34zM300 150h76c0 22-16 34-38 34s-38-12-38-34z" fill="#e0854f"/>`,
 garden:()=>r(0,0,400,225,'#dcefe2')+c(66,48,26,'#f6c945')+r(0,176,400,49,'#8a6a48')+[[34,'#6db06a'],[148,'#4f9a5b'],[262,'#7cc06e']].map(([x,g])=>[14,38,62,86].map(d=>`<path d="M${x+d} 136c-14-16-14-34 0-46 14 12 14 30 0 46z" fill="${g}"/>`).join('')+r(x-4,132,108,52,'#b78a5a',3)+r(x-4,150,108,4,'#9b7247')).join('')
 };
 return `<svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${A[id]()}</svg>`;
}

function localMap(items,{w=372,h=292,mi=62,feat=null,labels=true,flabel=true}={}){
 const cx=w*(labels&&flabel?.42:.5),cy=h/2,k=mi/62;
 const pos=o=>{let x=cx+o.d*mi*Math.sin(o.b*Math.PI/180),y=cy-o.d*mi*Math.cos(o.b*Math.PI/180),off=false;
  if(y>h-16){x=cx+(x-cx)*((h-16-cy)/(y-cy));y=h-16;off=true} return{x,y,off}};
 const line=(x1,y1,x2,y2,wd)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="${wd}"/>`;
 const txt=(x,y,t,a='start',c='#596171',fw=400,sz=11,rot=0)=>`<text x="${x}" y="${y}" text-anchor="${a}" font-size="${sz}" font-weight="${fw}" fill="${c}" stroke="#eef1f5" stroke-width="3" paint-order="stroke" ${rot?`transform="rotate(${rot} ${x} ${y})"`:''}>${t}</text>`;
 const minor=[];const st=40*k;
 for(let y=cy%st;y<h;y+=st)minor.push(line(0,y,w,y,1.5));
 for(let x=cx%st;x<w;x+=st)minor.push(line(x,0,x,h,1.5));
 const f=feat&&items.find(o=>o.id===feat),rest=items.filter(o=>o!==f),fp=f&&pos(f);
 const label=f?esc(f.camp):'';
 return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display:block" role="img" aria-label="Map of nearby fundraisers">
  <rect width="${w}" height="${h}" fill="#eef1f5"/>
  ${minor.join('')}
  <g transform="translate(${cx} ${cy}) scale(${k})"><rect x="-58" y="-34" width="36" height="28" fill="#dcecd3"/><rect x="120" y="22" width="46" height="34" fill="#dcecd3"/><rect x="-156" y="66" width="44" height="32" fill="#dcecd3"/>
   <path d="M-520 -60C-300 -40 -200 -100 -100 -70C-40 -50 20 -44 60 -62S170 -96 260 -74S440 -60 620 -84" fill="none" stroke="#bcd6ee" stroke-width="5"/></g>
  ${line(0,cy-46*k,w,cy-46*k,6)}${line(0,cy+9*k,w,cy+9*k,6)}${line(cx-74*k,0,cx-74*k,h,6)}${line(cx+102*k,0,cx+102*k,h,6)}
  ${labels?txt(12,cy-46*k-6,'University Ave')+txt(12,cy+9*k-6,'Green St')
   +txt(16,24,'Champaign','start','#414552',600,13)+txt(w-16,24,'Urbana','end','#414552',600,13):''}
  <circle cx="${cx}" cy="${cy}" r="${mi}" fill="rgba(99,91,255,.07)" stroke="#a9a5ff" stroke-dasharray="3 3"/>
  ${labels?`<circle cx="${cx}" cy="${cy}" r="${mi*2}" fill="none" stroke="#a9a5ff" stroke-dasharray="3 3"/>`+txt(cx,cy-mi+14,'1 mi','middle','#533afd')+txt(cx,cy-mi*2+14,'2 mi','middle','#533afd'):''}
  ${rest.map(o=>{const p=pos(o);return `<g data-act="pin" data-id="${o.id}" style="cursor:pointer" tabindex="0" role="button" aria-label="${esc(o.org)}, ${o.d} miles away"><title>${esc(o.org)}, ${o.d} mi</title><circle cx="${p.x}" cy="${p.y}" r="14" fill="transparent"/><circle cx="${p.x}" cy="${p.y}" r="7" fill="#635bff" stroke="#fff" stroke-width="2"/>${p.off?txt(p.x+12,p.y+4,o.org.split(' ')[0]+', '+o.d+' mi','start','#414552'):''}</g>`}).join('')}
  <rect x="${cx-6}" y="${cy-6}" width="12" height="12" rx="2" fill="#1a1b25" stroke="#fff" stroke-width="2"/>
  ${labels&&flabel?txt(cx-11,cy+4,'Your shop','end','#1a1b25',600,12):''}
  ${f?`<g><title>${esc(f.org)}, ${f.d} mi</title><circle cx="${fp.x}" cy="${fp.y}" r="${labels?22:15}" fill="#635bff" opacity=".18"/><circle cx="${fp.x}" cy="${fp.y}" r="${labels?11:8}" fill="#635bff" stroke="#fff" stroke-width="3"/>${labels&&flabel?txt(fp.x+26,fp.y+5,label,'start','#1a1b25',600,14):''}</g>`:''}
 </svg>`;
}

const ME={id:'boneyard',name:'Boneyard Coffee',addr:'412 E Green St, Champaign',daily:1400,txDaily:280,optIn:.34,avgRound:.46};
const RU_DAILY=ME.txDaily*ME.optIn*ME.avgRound;
const SEED_F=[
 {id:'pantry',org:'Green Street Pantry Collective',camp:'Winter Pantry Restock',type:'Student org',cat:'Food & basic needs',d:.3,b:80,goal:8000,others:5240,ends:'2026-12-18',otherPartners:4,fg:'#2b6312',organizer:'Priya Raman, president',founded:2019,
  blurb:'Free groceries for students and Campustown neighbors, run by 38 student volunteers.',about:'Our shelves run lowest between finals and the start of spring semester, when dining halls close and part-time hours drop. This campaign stocks the pantry through winter break.',impact:[[12.5,'Fills one grocery bag for a household'],[40,'Buys a week of fresh produce for one family'],[250,'Covers one Saturday pantry shift']],unit:[12.5,'grocery bags']},
 {id:'scholars',org:'First Gen Scholars Circle',camp:'Spring Textbook Fund',type:'Student org',cat:'Education',d:.4,b:200,goal:5000,others:1350,ends:'2026-12-04',otherPartners:0,fg:'#8a4310',organizer:'Marcus Bell, treasurer',founded:2021,
  blurb:'Helping first-generation students afford their spring textbooks.',about:'A single semester of books can cost more than a month of groceries. We buy and lend textbooks to first-generation students who would otherwise go without.',impact:[[45,'Buys one used textbook'],[120,'Covers a full course pack'],[400,'Equips one student for a semester']],unit:[45,'textbooks']},
 {id:'creek',org:'Boneyard Creek Cleanup Crew',camp:'100 Cleanup Kits',type:'Grassroots',cat:'Environment',d:.6,b:320,goal:3500,others:515.78,ends:'2027-01-15',otherPartners:1,fg:'#0f5a6b',organizer:'Dana Whitfield, organizer',founded:2022,
  blurb:'Neighbors clearing trash from Boneyard Creek, one Saturday at a time.',about:'Volunteers turn out every month, but we run short of gloves, grabbers and bags. Each kit lets one more neighbor join a cleanup.',impact:[[18,'Builds one cleanup kit'],[75,'Rents a trash trailer for a day'],[300,'Funds a full season of bags']],unit:[18,'cleanup kits']},
 {id:'tenant',org:'Champaign Tenant Help Desk',camp:'Free Lease Clinic',type:'Student org',cat:'Community',d:.9,b:260,goal:4500,others:2025,ends:'2027-01-29',otherPartners:2,fg:'#7a2877',organizer:'Lena Ortiz, co-director',founded:2020,
  blurb:'Law students helping renters read leases and get deposits back.',about:'Lease season hits campus every winter. Our clinic gives renters a free review before they sign, supervised by a volunteer attorney.',impact:[[30,'Pays for one lease review'],[150,'Runs one clinic night'],[500,'Prints a year of renter guides']],unit:[30,'lease reviews']},
 {id:'solar',org:'Prairie Solar Racing',camp:'New Array for the 2027 Race',type:'Student org',cat:'STEM',d:1.1,b:150,goal:12000,others:7466,ends:'2027-02-26',otherPartners:5,fg:'#755a00',organizer:'Theo Nguyen, team lead',founded:2016,
  blurb:'Undergrads building a solar car to race across the country.',about:'Our team designs, builds and drives a solar car entirely on student labor. A new array means a real shot at finishing the 2027 race.',impact:[[60,'Buys one string of solar cells'],[350,'Covers one race-day tire set'],[1500,'Funds one array section']],unit:[60,'solar cell strings']},
 {id:'bike',org:'Urbana Bike Commons',camp:'Winter Repair Nights',type:'Grassroots',cat:'Community',d:1.4,b:70,goal:6000,others:954.70,ends:'2026-12-31',otherPartners:2,fg:'#2b4596',organizer:'Sam Okafor, shop lead',founded:2017,
  blurb:'Free repair nights that keep people riding through winter.',about:'For many neighbors a bike is the only way to work. Volunteers fix bikes for free every Wednesday, as long as we can stock parts.',impact:[[15,'Covers one bike repair'],[60,'Buys a set of winter tires'],[220,'Stocks a month of parts']],unit:[15,'bike repairs']},
 {id:'reading',org:'Lincoln Square Reading Buddies',camp:'Books for 120 Second Graders',type:'Small nonprofit',cat:'Education',d:1.6,b:40,goal:2400,others:1728,ends:'2026-11-30',otherPartners:2,fg:'#8e2734',organizer:'Grace Liu, director',founded:2014,
  blurb:'Volunteers reading one-on-one with second graders after school.',about:'Every child in the program picks books to keep. This campaign puts a home library in the hands of 120 second graders.',impact:[[20,'Gives one child a set of books'],[100,'Stocks a reading corner'],[300,'Trains ten new volunteers']],unit:[20,'book sets']},
 {id:'arts',org:'North First Street Arts Stoop',camp:'Free Saturday Studio',type:'Grassroots',cat:'Arts',d:1.9,b:350,goal:4000,others:920,ends:'2027-03-13',otherPartners:1,fg:'#50399b',organizer:'Imani Reed, founder',founded:2023,
  blurb:'Free Saturday art classes on a front stoop on North First Street.',about:'Kids and neighbors paint together every Saturday, rain or shine. Supplies are the only thing that ever runs out.',impact:[[25,'Supplies one class'],[90,'Buys a set of easels'],[400,'Funds a season of classes']],unit:[25,'art classes']},
 {id:'savoy',org:'Savoy Mutual Aid Kitchen',camp:'Hot Meals Through March',type:'Small nonprofit',cat:'Food & basic needs',d:3.8,b:200,goal:10000,others:3100,ends:'2027-03-31',otherPartners:3,fg:'#3d5a2a',organizer:'Ruth Adeyemi, coordinator',founded:2018,
  blurb:'Hot meals for neighbors, cooked by volunteers every Tuesday.',about:'Volunteers cook and deliver hot meals to neighbors every week. Winter is when demand climbs and donations slow down.',impact:[[6,'Serves one hot meal'],[60,'Feeds ten neighbors'],[300,'Covers one week of groceries']],unit:[6,'hot meals']},
].map(f=>({status:'LIVE',cover:f.id,em:f.id,...f}));
const SEED_P=[
 {id:'p_bike',cause:'bike',rule:'PERCENTAGE',pct:2,dur:'ongoing',start:'2026-09-01',end:null,cap:null,eligible:'All in-store sales',status:'Active',donated:1805.30,receipt:true},
 {id:'p_creek',cause:'creek',rule:'ROUND_UP',pct:0,dur:'range',start:'2026-10-20',end:'2026-11-30',cap:null,eligible:'Terminal and online',status:'Active',donated:674.22,receipt:true},
 {id:'p_scholars',cause:'scholars',rule:'PERCENTAGE',pct:5,dur:'one',start:'2026-11-14',end:'2026-11-14',cap:null,eligible:'All in-store sales',status:'Scheduled',donated:0,receipt:true},
 {id:'p_solar',cause:'solar',rule:'PERCENTAGE',pct:10,dur:'one',start:'2026-10-15',end:'2026-10-15',cap:null,eligible:'All in-store sales',status:'Completed',donated:214,receipt:false},
];
const SEED_W=[['Aug 31',172.40],['Sep 7',196.20],['Sep 14',201.10],['Sep 21',188.60],['Sep 28',194.30],['Oct 5',205.80],['Oct 12',412.90],['Oct 19',463.78],['Oct 26',522.12],['Nov 2',136.32]].map(([w,total])=>({w,total}));
console.assert(Math.abs(SEED_W.reduce((a,r)=>a+r.total,0)-SEED_P.reduce((a,p)=>a+p.donated,0))<.005,'weeks = partnerships');
const OTHER_GIFTS={pantry:[
 {b:'Kiln Pottery Café',sup:'4% of sales · ongoing',d:.2,amt:1804.70},
 {b:"Ruby's Taqueria",sup:'Round-up · Oct 1 – Dec 18',d:.5,amt:1329},
 {b:'Neil Street Books',sup:'5% of sales · Saturdays',d:.8,amt:1120},
 {b:'Lincoln Square Bakery',sup:'One day · Oct 24',d:1.5,amt:986.30}]};
console.assert(Math.abs(OTHER_GIFTS.pantry.reduce((a,r)=>a+r.amt,0)-5240)<.005,'pantry rows');
const NEAR=[
 {id:'boneyard',b:'Boneyard Coffee',k:'Café',d:.3,fit:'Open to % of sales and round-ups'},
 {id:'noodle',b:'Green Street Noodle House',k:'Restaurant',d:.1,fit:'Open to one-day events'},
 {id:'cycle',b:'Campustown Cycle',k:'Retail',d:.4,fit:'Open to round-ups'},
 {id:'harvest',b:'Harvest Moon Market',k:'Grocery',d:.7,fit:'Has given to food causes'},
 {id:'print',b:'Prairie Print Shop',k:'Services',d:.9,fit:'Open to % of sales'},
 {id:'oak',b:'Oak & Ash Barbershop',k:'Services',d:.5,fit:'Open to one-day events'},
];
const SEED_R=[
 {id:'r_oak',cause:'pantry',biz:'oak',from:'pantry',dur:'one',date:'2026-12-05',pct:5,rule:'PERCENTAGE',msg:'Would you host a Saturday with 5% of sales going to our winter restock?',status:'Pending',when:'Sent Oct 29'},
 {id:'r_read',cause:'reading',biz:'boneyard',from:'reading',dur:'one',date:'2026-11-21',pct:5,rule:'PERCENTAGE',msg:'We are $672 from putting books in the hands of 120 second graders. Would you host a reading morning with 5% of sales?',status:'Pending',when:'Sent Nov 2'},
];
const CATS=['Food & basic needs','Education','Environment','Community','STEM','Arts'];
const TYPES=['Student org','Grassroots','Small nonprofit'];

/* ───────── Store: shared by both prototypes ───────── */
const KEY='sf-prototype-v1';
const seed=()=>({today:'2026-11-03',fundraisers:SEED_F.map(f=>({...f})),partnerships:SEED_P.map(p=>({...p})),weeks:SEED_W.map(w=>({...w})),requests:SEED_R.map(r=>({...r}))});
let DB;
function loadDB(){try{const r=localStorage.getItem(KEY);DB=r?JSON.parse(r):seed()}catch(e){DB=seed()}return DB}
function saveDB(){try{localStorage.setItem(KEY,JSON.stringify(DB));return true}catch(e){toast('Could not save this change in the browser');return false}}
function resetDB(){DB=seed();saveDB()}
loadDB();
const F=id=>DB.fundraisers.find(f=>f.id===id);
const partnershipFor=id=>DB.partnerships.find(p=>p.cause===id&&!['Ended','Completed'].includes(p.status));
const givenTo=id=>DB.partnerships.filter(p=>p.cause===id).reduce((a,p)=>a+p.donated,0);
const raised=f=>+(f.others+givenTo(f.id)).toFixed(2);
const pctOf=f=>f.goal?Math.min(1,raised(f)/f.goal):0;
const leftOf=f=>Math.max(0,f.goal-raised(f));
const partnersOf=f=>f.otherPartners+(DB.partnerships.some(p=>p.cause===f.id&&p.status!=='Ended')?1:0);
const live=()=>DB.fundraisers.filter(f=>f.status==='LIVE');

/* dates */
const D=s=>new Date(s+'T12:00:00');
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const addDays=(s,n)=>{const d=D(s);d.setDate(d.getDate()+n);return iso(d)};
const diffDays=(a,b)=>Math.round((D(b)-D(a))/864e5);
const short=s=>s?D(s).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'';
const leftDays=f=>Math.max(0,diffDays(DB.today,f.ends));
const nextMonday=s=>{let d=addDays(s,1);while(D(d).getDay()!==1)d=addDays(d,1);return d};
const supLabel=p=>p.rule==='ROUND_UP'?'Customer round-up':p.pct+'% of sales';
const durLabel=p=>p.dur==='ongoing'?'Ongoing since '+short(p.start):p.dur==='one'?'One day, '+short(p.start):short(p.start)+' – '+short(p.end);

/* Mirrors computeQuote in the team repo: round-up tops an amount to the next dollar */
const roundUpCents=itemCents=>100-itemCents%100;

function estimate(f){
 const days=f.dur==='one'?1:f.dur==='range'?Math.max(0,diffDays(f.start,f.end)+1):30;
 const raw=f.rule==='ROUND_UP'?RU_DAILY*days:ME.daily*days*(+f.pct||0)/100;
 const cap=+f.cap||0;
 return{days,amount:+(cap?Math.min(raw,cap):raw).toFixed(2),capped:cap>0&&raw>cap};
}

/* One simulated trading day: moves partnerships along and adds real donations */
function simulateDay(){
 const today=addDays(DB.today,1);DB.today=today;
 if(D(today).getDay()===1)DB.weeks=[...DB.weeks.slice(1),{w:short(today),total:0}];
 let total=0,n=0;const h=[...today].reduce((a,c)=>a+c.charCodeAt(0),0);const wob=1+((h%17)-8)/100;
 DB.partnerships.forEach(p=>{
  if(['Paused','Ended','Completed'].includes(p.status))return;
  if(p.status==='Scheduled'&&p.start<=today)p.status='Active';
  if(p.status!=='Active')return;
  if(p.end&&p.end<today){p.status='Completed';return}
  let amt=(p.rule==='ROUND_UP'?RU_DAILY:ME.daily*p.pct/100)*wob;
  if(p.cap)amt=Math.min(amt,p.cap-p.donated);
  amt=Math.max(0,+amt.toFixed(2));p.donated=+(p.donated+amt).toFixed(2);total+=amt;n++;
  if((p.cap&&p.donated>=p.cap)||p.end===today)p.status='Completed';
 });
 const wk=DB.weeks[DB.weeks.length-1];wk.total=+(wk.total+total).toFixed(2);
 saveDB();
 return{today,total:+total.toFixed(2),n};
}

/* ───────── Shared bits of interface ───────── */
function toast(msg){document.querySelectorAll('.toast').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3200)}
const statusPill=s=>`<span class="pill ${['Active','Accepted','Live','Published'].includes(s)?'pos':['Scheduled','Pending'].includes(s)?'info':s==='Declined'||s==='Ended'?'neg':''}">${esc(s)}</span>`;
const coverOf=f=>f.image?`<img src="${f.image}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">`:cover(f.cover||'garden');
function fundCard(f,{href,badge=''}={}){
 const inner=`<div class="cover">${coverOf(f)}</div><div class="fbody"><div class="favatar">${logo(f,40)}</div>
  <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><span class="fname ell">${esc(f.org)}</span><span class="dist">${f.d} mi</span></div>
  <p class="blurb">${esc(f.blurb)||'<span class="sub">Your one-sentence description appears here.</span>'}</p>
  <div class="ffoot"><div class="bar"><i style="width:${pctOf(f)*100}%"></i></div>
  <div class="money num"><span><b>${m0(raised(f))}</b> <span class="sub">of ${m0(f.goal)}</span></span>${badge}</div></div></div>`;
 return href?`<a class="fcard" href="${href}" data-card="${f.id}">${inner}</a>`:`<div class="fcard">${inner}</div>`;
}
function bars(){
 const W=760,H=212,L=38,R=4,T=32,B=24,top=Math.max(600,Math.ceil(Math.max(...DB.weeks.map(r=>r.total))/200)*200),ticks=[0,1,2,3].map(i=>top/3*i);
 const y=v=>T+(H-T-B)*(1-v/top),step=(W-L-R)/DB.weeks.length,bw=Math.min(40,step*.56),x=i=>L+step*i+(step-bw)/2;
 return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Donations by week">
  ${ticks.map(t=>`<line x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}" stroke="${t?'#ebeef1':'#c0c8d2'}"/><text x="${L-8}" y="${y(t)+4}" font-size="12" fill="#596171" text-anchor="end">$${Math.round(t)}</text>`).join('')}
  ${DB.weeks.map((r,i)=>{const open=i===DB.weeks.length-1,h=Math.max(0,y(0)-y(r.total));return `<g><title>Week of ${r.w}: ${m2(r.total)}${open?' so far':''}</title>${h>0?`<rect x="${x(i)}" y="${y(r.total)}" width="${bw}" height="${h}" rx="3" fill="${open?'#c4c1ff':'#635bff'}"/>`:''}<rect x="${x(i)}" y="${T}" width="${bw}" height="${H-T-B}" fill="transparent"/><text x="${x(i)+bw/2}" y="${H-6}" font-size="12" fill="#596171" text-anchor="middle">${r.w}</text></g>`}).join('')}
 </svg>`;
}
function publicPage(f,back){
 const r=raised(f),hasGifts=r>0,others=OTHER_GIFTS[f.id]||(f.org===F('pantry').org?OTHER_GIFTS.pantry:[]);
 const more=live().filter(x=>x.id!==f.id).sort((a,b)=>a.d-b.d).slice(0,3);
 const imp=(f.impact||[]).slice(0,3);
 return `<div class="pub"><div class="pubnote">Concept mockup with illustrative data. Not a real Stripe page. ${back?`<a href="${back}" style="text-decoration:underline;margin-left:8px">Back to the Dashboard</a>`:''}</div>
  <div class="pubtop"><div class="pubband"></div>
   <div class="pubnav"><b>Stripe</b><span>Products</span><span>Solutions</span><span>Developers</span><span>Resources</span><span>Pricing</span><span class="sp">Fundraisers</span><span class="pbtn">Sign in</span></div>
   <div class="pubhero"><div>
    <div style="display:flex;align-items:center;gap:8px;color:#fff;font-size:15px;font-weight:500;margin-bottom:16px">${logo(f,32)}${esc(f.org)}</div>
    <h1>${esc(f.camp)}</h1>
    <p class="lede" style="margin-top:176px">${esc(f.blurb)}</p>
    <div style="margin-top:24px;max-width:480px"><div class="bar" style="height:8px;border-radius:4px"><i style="width:${pctOf(f)*100}%"></i></div><div class="num" style="margin-top:8px;color:var(--slate);font-size:15px"><b style="color:var(--navy);font-weight:600">${m0(r)}</b> of ${m0(f.goal)} goal · Champaign, IL · Ends ${short(f.ends)}</div></div>
    <div style="display:flex;gap:16px;margin-top:24px;align-items:center"><a class="pbtn2" href="./business.html#/f/${f.id}">Support from your Dashboard</a></div>
   </div><div class="pubcover"><div class="cover" style="aspect-ratio:4/3">${coverOf(f)}</div></div></div>
  </div>
  ${imp.length?`<div class="pubsec"><h2>Where the money goes</h2><p>${esc(f.about||f.blurb)}</p><div class="pubgrid">${imp.map(([a,t])=>`<div><div class="pubamt num">${a%1?m2(a):m0(a)}</div><p>${esc(t)}</p></div>`).join('')}</div></div>`:''}
  <div class="pubsec pubalt"><h2>${hasGifts?'Join the local shops helping':'Be the first shop to join'}</h2><p>Run your business on Stripe? Start giving in a few clicks, with nothing new to install.</p>
   <div class="pubgrid"><div><b style="font-weight:600">Host a one-day event</b><p>Give a share of one day's sales.</p></div><div><b style="font-weight:600">Give for a set stretch</b><p>Pick dates and a percentage of sales.</p></div><div><b style="font-weight:600">Add customer round-ups</b><p>Customers can round up at checkout.</p></div></div></div>
  ${others.length?`<div class="pubsec"><h2>Local shops already helping</h2><p>${others.length} Champaign–Urbana businesses support ${esc(f.org)}.</p><div class="pubgrid" style="grid-template-columns:repeat(4,1fr)">${others.map(x=>`<div><b style="font-weight:600">${esc(x.b)}</b><p class="num">${m0(x.amt)} · ${x.d} mi</p></div>`).join('')}</div></div>`:''}
  <div class="pubsec pubalt"><h2>More fundraisers in Champaign–Urbana</h2><div class="pubgrid" style="font-size:14px;line-height:20px">${more.map(x=>fundCard(x)).join('')}</div></div>
  <div class="pubfoot">Concept mockup for a hackathon. All organizations, businesses and figures are fictional.</div></div>`;
}
const appIcon=()=>`<span class="appicon">${I('heart',16,2)}</span>`;
const concept=`<span class="concept">Concept · illustrative data</span>`;

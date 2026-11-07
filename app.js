'use strict';
/* Post & Web Story Maker: all app code, in loading order.
   Sections: config > state > draw-utils > text-engine > templates > storage > ui > projects > pwa > main */

/* ================= config ================= */
/* Constants: formats, template list, colour palettes, font stacks */
const FM={ig:{n:'Instagram 1:1',w:1080,h:1080,s:0},igp:{n:'Instagram 4:5',w:1080,h:1350,s:0},st:{n:'Web Story 9:16',w:1080,h:1920,s:1}};
const TP=[['overlay','Overlay'],['split','Split Card'],['block','Mind Map Card'],['glass','Glass'],['edit','Editorial'],['poster','Bold Poster'],['news','News Banner'],['quote','Quote Card'],['spot','Spotlight'],['illus','Illustration'],['illus2','Illustration 2'],['tips','Numbered Tips'],['dodont',"Do / Don't"],['beforeafter','Before / After'],['checklist','Checklist'],['testi','Testimonial']];
const NOTES={beforeafter:'Image = Before photo, Second Image = After photo. The description shows below the photos.',checklist:'Each description line is a checklist item. Start a line with [ ] for an unchecked box.',testi:'Heading = person name, Heading 2 = role, Description = quote, Image = photo.'};
const CL=[['#3b5bdb','#edf2ff'],['#0c8599','#e3fafc'],['#2b8a3e','#ebfbee'],['#e67700','#fff4e6'],['#c2255c','#fff0f6'],['#7048e8','#f3f0ff'],['#0f2a4a','#e2e8f0'],['#c92a2a','#fff5f5'],['#1e3a8a','#dbeafe'],['#087f5b','#e6fcf5'],['#b8860b','#fff9db'],['#800f2f','#fff0f3'],['#212529','#f1f3f5'],['#862e9c','#f8f0fc'],['#1971c2','#e7f5ff'],['#2f5d3a','#ebf5ee'],['#475569','#f1f5f9'],['#9c4a1a','#fdf0e6'],['#b76e79','#fdf0f2']];
const MO="'Montserrat','Noto Sans Devanagari',sans-serif",PF="'Playfair Display','Noto Sans Devanagari',serif",AN="'Anton','Noto Sans Devanagari',sans-serif",KA="'Kalam','Noto Sans Devanagari',cursive";
const C2=['#e8590c','#1971c2','#2b8a3e','#c2255c','#7048e8','#b8860b'];

/* Fonts the user can pick per post (heading font and description font).
   [name, heading weight]. Fonts with one weight only use 400. */
const FONT_OPTS=[
 {g:'App fonts',list:[['Montserrat','800'],['Playfair Display','800'],['Anton','400'],['Kalam','700']]},
 {g:'Hindi / Devanagari fonts',list:[['Noto Sans Devanagari','800'],['Hind','700'],['Mukta','800'],['Poppins','800'],['Baloo 2','800'],['Laila','700'],['Khand','700'],['Tiro Devanagari Hindi','400'],['Rozha One','400']]}];
const FHW=Object.fromEntries(FONT_OPTS.flatMap(g=>g.list));
const fstack=n=>`'${n}','Noto Sans Devanagari',sans-serif`;

/* ================= state ================= */
/* DOM helpers and shared app state */
const $=id=>document.getElementById(id),cv=$('c');
/* st = editor state, K = state of the post being drawn, x = canvas context, H2 = highlight-2 colour */
let st={f:'igp',t:'overlay',c:CL[0][0],tn:CL[0][1],c2:C2[0],dir:'h',img:null,imgB:null,img2:null,img2B:null,kids:[],ns:'circle',logo:null,logoB:null,lpos:'tr',lsz:2,lop:1,rate:5,hf:'',df:'',dal:'auto'},K=st,x,H2=C2[0],dready=false,dt=null;
/* projects, saved posts, active project id, post being edited */
let projects=[],posts=[],pid=null,editId=null;
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);

/* ================= draw-utils ================= */
/* Canvas helpers: colours, shapes, images, number badges */
/* ---------- Drawing helpers ---------- */
const lt=(c,a)=>{const n=parseInt(c.slice(1),16),m=v=>Math.round(v+(255-v)*a);return`rgb(${m(n>>16)},${m(n>>8&255)},${m(n&255)})`};
function rr(px,py,w,h,r){x.beginPath();x.roundRect?x.roundRect(px,py,w,h,r):x.rect(px,py,w,h)}
function node(px,py,w,h,r,fill,stroke,lw){x.fillStyle=fill;rr(px,py,w,h,r);x.fill();if(stroke){x.strokeStyle=stroke;x.lineWidth=lw||3;x.stroke()}}
function cover(i,px,py,w,h){const r=Math.max(w/i.width,h/i.height),iw=i.width*r,ih=i.height*r;x.drawImage(i,px+(w-iw)/2,py+(h-ih)/2,iw,ih)}
function contain(i,px,py,w,h){const r=Math.min(w/i.width,h/i.height),iw=i.width*r,ih=i.height*r;x.drawImage(i,px+(w-iw)/2,py+(h-ih)/2,iw,ih)}
function pic(i,px,py,w,h,r){const q=Math.min(w/i.width,h/i.height),pw=i.width*q,ph2=i.height*q,qx=px+(w-pw)/2,qy=py+(h-ph2)/2;x.save();rr(qx,qy,pw,ph2,r);x.clip();x.drawImage(i,qx,qy,pw,ph2);x.restore();rr(qx,qy,pw,ph2,r);x.strokeStyle='#fff';x.lineWidth=5;x.stroke()}
function ph(px,py,w,h){const g=x.createLinearGradient(px,py,px+w,py+h);g.addColorStop(0,lt(K.c,.1));g.addColorStop(1,'#0f172a');x.fillStyle=g;x.fillRect(px,py,w,h)}
function img(px,py,w,h){x.save();x.beginPath();x.rect(px,py,w,h);x.clip();K.img?cover(K.img,px,py,w,h):ph(px,py,w,h);x.restore()}
function slot(i,px,py,w,h){if(i)contain(i,px,py,w,h);else{x.save();x.setLineDash([14,12]);node(px,py,w,h,28,K.tn,K.c,3);x.restore();x.fillStyle=K.c;x.font=`700 32px ${MO}`;x.textAlign='center';x.textBaseline='middle';x.fillText('Add image here',px+w/2,py+h/2)}}
function pill(t,px,py,fill,col,stroke,fs=26,al='left'){x.font=`700 ${fs}px ${MO}`;const w=x.measureText(t).width+fs*1.8,h=fs*2.1,p=al==='center'?px-w/2:px;node(p,py,w,h,h/2,fill,stroke,3);x.fillStyle=col;x.textAlign='left';x.textBaseline='middle';x.fillText(t,p+fs*.9,py+h/2+1);return h}
/* ---------- Number badge (circle / square / pill) ---------- */
function lum(c){let r,g,b;if(c[0]==='#'){const n=parseInt(c.slice(1),16);r=n>>16;g=n>>8&255;b=n&255}else[r,g,b]=c.match(/\d+/g).map(Number);return(.299*r+.587*g+.114*b)/255}
const fsz=()=>parseFloat((x.font.match(/([\d.]+)px/)||[0,40])[1]);
const btx=o=>(K.ns==='pill'&&K.nt)?o.w+'/'+K.nt:o.w;
function bdM(o){const s=fsz(),ns=K.ns||'circle',f=x.font;x.font=f.replace(/[\d.]+px/,(s*.56)+'px');const tw=x.measureText(btx(o)).width;x.font=f;o.bh=ns==='pill'?s*.86:s*1.02;o.n=(ns==='pill'?tw+s*.8:Math.max(s*1.02,tw+s*.5))+s*.16}
function drawBadge(px,py,w,h,tx,ns,hc,fnt,fs){const cx=px+w/2,cy=py+h/2;x.save();
 if(ns==='square'){const lw=Math.max(3,h*.09);x.lineWidth=lw;x.strokeStyle=hc;rr(px+lw/2,py+lw/2,w-lw,h-lw,h*.24);x.stroke();x.globalAlpha=.14;x.fillStyle=hc;x.fill();x.globalAlpha=1;x.fillStyle=hc}
 else if(ns==='pill'){x.fillStyle=hc;rr(px,py,w,h,h/2);x.fill();x.fillStyle=lum(hc)>.62?'#0f172a':'#fff'}
 else{const r=h/2,lw=Math.max(2,h*.07);x.strokeStyle=hc;x.lineWidth=lw;x.beginPath();x.arc(cx,cy,r-lw/2,0,7);x.stroke();x.fillStyle=hc;x.beginPath();x.arc(cx,cy,r*.74,0,7);x.fill();x.fillStyle=lum(hc)>.62?'#0f172a':'#fff'}
 x.font=fnt;x.textAlign='center';x.textBaseline='middle';x.fillText(tx,cx,cy+fs*.05);x.restore()}
function bdTok(o,px,py,b,hc){const s=b.s,h=o.bh;drawBadge(px,py+(b.lh-h)/2,o.n-s*.16,h,btx(o),K.ns||'circle',hc,`${b.wt} ${Math.round(s*.56)}px ${b.fam}`,s*.56)}

/* ================= text-engine ================= */
/* Rich text engine: *word* / _word_ highlights, bullet lists, wrapping, auto-fit */
/* rich text: *word* = highlight 1, _word_ = highlight 2, new line = bullet point */
function toks(t){let m=0;return t.split(/\s+/).filter(Boolean).map(w=>{if(w[0]==='\u0001')return{w:w.slice(1),h:0,b:1};if(w[0]==='*')m=1;else if(w[0]==='_')m=2;const o={w:w.replace(/[*_]/g,''),h:m};if(w.length>1&&((m===1&&w.endsWith('*'))||(m===2&&w.endsWith('_'))))m=0;return o}).filter(o=>o.w)}
function lines(tk,mw){const sp=x.measureText(' ').width,out=[];let l=[],lw=0;tk.forEach(o=>{if(o.b)bdM(o);else o.n=x.measureText(o.w).width;const nw=l.length?lw+sp+o.n:o.n;if(nw>mw&&l.length){out.push({a:l,w:lw});l=[o];lw=o.n}else{l.push(o);lw=nw}});if(l.length)out.push({a:l,w:lw});return out}
/* user font override. role 'h' = heading font, 'd' = description font (empty = keep the template's own font) */
function fnt(fam,wt,role){const n=role==='h'?K.hf:role==='d'?K.df:'';if(!n)return[fam,wt];return[fstack(n),role==='h'?FHW[n]:(FHW[n]==='400'?'400':String(wt).replace(/italic\s*/,''))]}
const fontReady=n=>n?Promise.all(['400','700'].map(w=>document.fonts.load(`${w} 40px "${n}"`,'Aa अआइ'))).catch(()=>{}):Promise.resolve();
const ensureFonts=S=>Promise.all([fontReady(S.hf),fontReady(S.df)]);
function lay(t,mw,mh,s0,s1,wt,fam,lh=1.25,bul,role){if(role)[fam,wt]=fnt(fam,wt,role);const its=t.split('\n').map(z=>z.trim().replace(/^[-•]\s+/,'')).filter(Boolean),bb=bul&&its.length>1,tks=its.map(toks);let s=s0,L;
 const build=()=>{L=[];const ind=bb?s*.95:0;tks.forEach(tk=>lines(tk,mw-ind).forEach((ln,i)=>{ln.bu=bb&&i===0;ln.ind=ind;L.push(ln)}))};
 for(;s>=s1;s-=2){x.font=`${wt} ${s}px ${fam}`;build();if(L.length*s*lh<=mh)break}
 s=Math.max(s,s1);x.font=`${wt} ${s}px ${fam}`;build();
 const mx=Math.max(1,Math.floor(mh/(s*lh)));if(L.length>mx){L=L.slice(0,mx);const a=L[mx-1].a,o=a[a.length-1];a[a.length-1]={...o,w:o.w+'…',n:o.n+x.measureText('…').width}}
 return{L,s,lh:s*lh,h:L.length*s*lh,wt,fam,mw}}
/* layH = heading text, layD = description with bullets, layQ = description-like quote, layT = other body text (list rows) */
const layH=(t,a,b,c,d,e,f,g)=>lay(t,a,b,c,d,e,f,g,false,'h');
const layD=(t,a,b,c,d,e,f,g)=>{const r=lay(t,a,b,c,d,e,f,g,true,'d');r.isD=true;return r};
const layQ=(t,a,b,c,d,e,f,g)=>{const r=lay(t,a,b,c,d,e,f,g,false,'d');r.isD=true;return r};
const layT=(t,a,b,c,d,e,f,g)=>lay(t,a,b,c,d,e,f,g,false,'d');
function say(b,px,py,col,hc,al='left'){if(b.isD&&K.dal&&K.dal!=='auto'){const left=al==='center'?px-b.mw/2:px;px=K.dal==='center'?left+b.mw/2:left;al=K.dal}x.font=`${b.wt} ${b.s}px ${b.fam}`;x.textBaseline='top';x.textAlign='left';const sp=x.measureText(' ').width;b.L.forEach((ln,i)=>{const ind=ln.ind||0,y=py+i*b.lh;let p=al==='center'?px-(ln.w+ind)/2+ind:px+ind;if(ln.bu){x.fillStyle=hc;x.beginPath();x.arc(p-ind*.55,y+b.s*.6,b.s*.13,0,7);x.fill()}ln.a.forEach(o=>{if(o.b){bdTok(o,p,y,b,hc);p+=o.n+sp;return}x.fillStyle=o.h===1?hc:o.h===2?H2:col;x.fillText(o.w,p,y);p+=o.n+sp})})}

/* ================= templates ================= */
/* Templates: one function per template, plus render() */
/* every template receives the same drawing context */
/* Overlay: full photo, dark gradient, big heading at the bottom */
function tplOverlay(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{H2=lt(S.c2,.5);
  img(0,0,W,H);let g=x.createLinearGradient(0,H*.3,0,H);g.addColorStop(0,'rgba(8,12,24,0)');g.addColorStop(.5,'rgba(8,12,24,.7)');g.addColorStop(1,'rgba(8,12,24,.95)');x.fillStyle=g;x.fillRect(0,0,W,H);
  g=x.createLinearGradient(0,0,0,H*.16);g.addColorStop(0,'rgba(8,12,24,.45)');g.addColorStop(1,'rgba(8,12,24,0)');x.fillStyle=g;x.fillRect(0,0,W,H*.16);
  const bot=H-Bm-M,dh=layD(D,tw,H*.13,ds,24,'500',MO,1.45),hh=layH(R1,tw,H*.26,hs,38,'800',MO,1.15);
  let y=bot-(B?74:0)-dh.h;say(dh,M,y,'rgba(255,255,255,.88)',HL);y-=hh.h+22;say(hh,M,y,'#fff',HL);y-=34;x.fillStyle=HL;rr(M,y,110,10,5);x.fill();
  if(B){const py=bot-52;x.fillStyle=HL;x.beginPath();x.arc(M+14,py+26,14,0,7);x.fill();x.font=`700 30px ${MO}`;x.fillStyle='#fff';x.textBaseline='middle';x.textAlign='left';x.fillText(B,M+44,py+27)}
 
}}

/* Split Card: photo on top, white rounded card below */
function tplSplit(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{
  const ih=Math.round(H*.5);img(0,0,W,ih+60);x.save();x.shadowColor='rgba(0,0,0,.28)';x.shadowBlur=40;x.shadowOffsetY=-8;x.fillStyle='#fff';rr(0,ih,W,H-ih,[56,56,0,0]);x.fill();x.restore();
  if(B)pill(B,M,ih-34,A,'#fff',null,26);
  const top=ih+(B?64:46),bot=H-Bm-M,hh=layH(R1,tw,(bot-top)*.5,hs-6,36,'800',MO,1.15);
  let y=top;say(hh,M,y,'#0f172a',A);y+=hh.h+20;x.fillStyle=A;rr(M,y,90,8,4);x.fill();y+=34;const dh=layD(D,tw,bot-y,ds-2,22,'500',MO,1.5);say(dh,M,y,'#475569',A);
 
}}

/* Mind Map Card: main node + horizontal/vertical children */
function tplMindMap(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{
  H2=lt(S.c2,.55);x.fillStyle='#f1f5f9';x.fillRect(0,0,W,H);x.fillStyle='#cbd5e1';for(let i=22;i<W;i+=44)for(let j=22;j<H;j+=44){x.beginPath();x.arc(i,j,2.5,0,7);x.fill()}
  const kids=(S.kids||[]).filter(c=>c.t.trim()||c.img).slice(0,8),n=kids.length,hz=S.dir!=='v',PAL=['#3b5bdb','#0c8599','#2b8a3e','#e67700','#c2255c','#7048e8'].filter(c=>c!==A),ar=M*.75,aT=T+M*.75,aB=H-Bm-M*.75-(B?60:0),aw=W-ar*2,ah=aB-aT,LA=lt(A,.8);
  const root=(rw,maxH)=>{const p=26,iw=rw-p*2,ih=S.img?Math.min(iw*S.img.height/S.img.width,maxH*.5):0,hh=layH(R1,iw,maxH*.28,hs-24,28,'800',MO,1.15),dh=layD(D,iw,maxH*.2,ds-12,18,'500',MO,1.35),h=Math.max(110,p*2+(ih?ih+20:0)+hh.h+(dh.h?16+dh.h:0));
   return{w:rw,h,draw(rx,ry){x.save();x.shadowColor='rgba(15,23,42,.25)';x.shadowBlur=26;x.shadowOffsetY=8;node(rx,ry,rw,h,30,A,'#fff',6);x.restore();let y=ry+p;if(ih){pic(S.img,rx+p,y,iw,ih,16);y+=ih+20}say(hh,rx+rw/2,y,'#fff',LA,'center');y+=hh.h+(dh.h?16:0);if(dh.h)say(dh,rx+rw/2,y,'rgba(255,255,255,.9)',LA,'center')}}};
  const kid=(c,i,kx,ky,kw,kh,h)=>{const col=PAL[i%PAL.length],lc=lt(col,.8);x.save();x.shadowColor='rgba(15,23,42,.22)';x.shadowBlur=18;x.shadowOffsetY=6;node(kx,ky,kw,kh,22,col,'#fff',4);x.restore();
   if(h){let tx=kx+16,tw2=kw-32;if(c.img){const sd=kh-24;pic(c.img,kx+12,ky+12,sd,sd,12);tx=kx+sd+28;tw2=kw-sd-44}const b=layH(c.t,tw2,kh-24,36,16,'700',MO,1.2);say(b,tx,ky+(kh-b.h)/2,'#fff',lc)}
   else{let ty=ky+12,th=kh-24;if(c.img){const ih=kh*.5;pic(c.img,kx+10,ky+10,kw-20,ih-6,12);ty=ky+ih+10;th=kh-ih-20}const b=layH(c.t,kw-24,th,32,14,'700',MO,1.2);say(b,kx+kw/2,ty+(th-b.h)/2,'#fff',lc,'center')}};
  const cn=(x1,y1,x2,y2,col,h)=>{x.strokeStyle=col;x.lineWidth=7;x.lineCap='round';x.beginPath();x.moveTo(x1,y1);if(h){const m=(x1+x2)/2;x.bezierCurveTo(m,y1,m,y2,x2,y2)}else{const m=(y1+y2)/2;x.bezierCurveTo(x1,m,x2,m,x2,y2)}x.stroke()};
  if(!n){const r=root(aw*.8,ah*.9);r.draw(ar+(aw-r.w)/2,aT+(ah-r.h)/2)}
  else if(hz){const rw=aw*.36,r=root(rw,ah*.9),ry=aT+(ah-r.h)/2,gx=ar+rw+aw*.12,cw=aw-rw-aw*.12,gp=24,ch=Math.min(200,(ah-(n-1)*gp)/n),cy0=aT+(ah-(n*ch+(n-1)*gp))/2;
   kids.forEach((c,i)=>cn(ar+rw,ry+r.h/2,gx,cy0+i*(ch+gp)+ch/2,PAL[i%PAL.length],1));r.draw(ar,ry);kids.forEach((c,i)=>kid(c,i,gx,cy0+i*(ch+gp),cw,ch,1))}
  else{const r=root(aw*.7,ah*.4),rx=ar+(aw-r.w)/2,top=aT+r.h+90,cols=Math.min(n,4),rows=Math.ceil(n/cols),gp=24,cw=(aw-(cols-1)*gp)/cols,ch=Math.min(300,(aB-top-(rows-1)*gp)/rows);
   const pos=kids.map((c,i)=>{const rw2=Math.floor(i/cols),cc=i%cols,cnt=Math.min(cols,n-rw2*cols);return[ar+(cols-cnt)*(cw+gp)/2+cc*(cw+gp),top+rw2*(ch+gp)]});
   pos.forEach(([px,py],i)=>cn(W/2,aT+r.h,px+cw/2,py,PAL[i%PAL.length],0));r.draw(rx,aT);kids.forEach((c,i)=>kid(c,i,pos[i][0],pos[i][1],cw,ch,0))}
  if(B)bt(W/2,aB+14,'center','#64748b');
 
}}

/* Glass: photo with a 50% frosted card at the bottom */
function tplGlass(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{
  img(0,0,W,H);x.fillStyle='rgba(8,12,24,.2)';x.fillRect(0,0,W,H);
  const cw=W-M*1.2,cx=(W-cw)/2,ip=50,iw=cw-ip*2,bot=H-Bm-M*.8,hh=layH(R1,iw,H*.2,hs-14,34,'800',MO,1.15),dh=layD(D,iw,H*.14,ds-4,22,'500',MO,1.45);
  const ch=ip*2+30+hh.h+16+dh.h+(B?78:0),cy=bot-ch;
  x.save();rr(cx,cy,cw,ch,44);x.clip();if('filter' in x){x.filter='blur(26px)';img(0,0,W,H)}x.filter='none';x.restore();
  x.fillStyle='rgba(255,255,255,.5)';rr(cx,cy,cw,ch,44);x.fill();x.strokeStyle='rgba(255,255,255,.75)';x.lineWidth=3;x.stroke();
  let y=cy+ip;x.fillStyle=A;rr(cx+ip,y,90,8,4);x.fill();y+=30;say(hh,cx+ip,y,'#0f172a',A);y+=hh.h+16;say(dh,cx+ip,y,'#1e293b',A);y+=dh.h+22;if(B)pill(B,cx+ip,y,A,'#fff',null,26);
 
}}

/* Editorial: cream paper, polaroid photo, handwritten heading */
function tplEditorial(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{
  x.fillStyle='#faf6ef';x.fillRect(0,0,W,H);const bx=34,by=T+34,bw=W-68,bh=H-T-Bm-68;
  x.strokeStyle=A;x.lineWidth=4;rr(bx,by,bw,bh,22);x.stroke();x.strokeStyle=lt(A,.65);x.lineWidth=2;rr(bx+14,by+14,bw-28,bh-28,14);x.stroke();
  const pw=tw-40,pi=18,ih=Math.round(bh*.36),pwh=ih+pi*2+10,py0=by+64;
  x.save();x.translate(W/2,py0+pwh/2);x.rotate(-.025);x.shadowColor='rgba(0,0,0,.25)';x.shadowBlur=28;x.shadowOffsetY=10;node(-pw/2,-pwh/2,pw,pwh,6,'#fff',null);x.shadowColor='transparent';
  x.save();rr(-pw/2+pi,-pwh/2+pi,pw-pi*2,ih,3);x.clip();S.img?cover(S.img,-pw/2+pi,-pwh/2+pi,pw-pi*2,ih):ph(-pw/2+pi,-pwh/2+pi,pw-pi*2,ih);x.restore();
  x.globalAlpha=.7;x.fillStyle=A;x.save();x.translate(0,-pwh/2);x.rotate(.05);x.fillRect(-70,-16,140,40);x.restore();x.restore();
  if(B)pill(B,bx+40,by-27,'#faf6ef',A,A,24);
  let y=py0+pwh+46;const bot=by+bh-44,hh=layH(R1,tw-30,(bot-y)*.5,hs+6,40,'700',KA,1.12);say(hh,W/2,y,'#1a1a1a',A,'center');y+=hh.h+16;
  x.strokeStyle=A;x.lineWidth=3;x.beginPath();x.moveTo(W/2-130,y+14);x.lineTo(W/2-24,y+14);x.moveTo(W/2+24,y+14);x.lineTo(W/2+130,y+14);x.stroke();x.fillStyle=A;x.save();x.translate(W/2,y+14);x.rotate(.785);x.fillRect(-7,-7,14,14);x.restore();y+=42;
  const dh=layD(D,tw-30,bot-y,ds+4,22,'400',KA,1.35);say(dh,W/2,y,'#4a4a4a',A,'center');
 
}}

/* Bold Poster: tinted photo, huge uppercase heading */
function tplPoster(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{H2=lt(S.c2,.5);
  img(0,0,W,H);x.save();x.globalCompositeOperation='multiply';x.globalAlpha=.6;x.fillStyle=A;x.fillRect(0,0,W,H);x.restore();
  let g=x.createLinearGradient(0,H*.3,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.9)');x.fillStyle=g;x.fillRect(0,0,W,H);
  g=x.createLinearGradient(0,0,0,H*.2);g.addColorStop(0,'rgba(0,0,0,.5)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,W,H*.2);
  const Y='#ffd43b',bot=H-Bm-M,dh=layD(D,tw,H*.12,ds,24,'600',MO,1.45),hh=lay(R1.toUpperCase(),tw,H*.4,hs+70,60,'400',AN,1.02);
  let y=bot-dh.h;say(dh,M,y,'rgba(255,255,255,.92)',Y);y-=hh.h+28;say(hh,M,y,'#fff',Y);y-=34;x.fillStyle=Y;rr(M,y,150,14,7);x.fill();
  if(B)pill(B,M,T+M,'rgba(255,255,255,.14)','#fff','rgba(255,255,255,.6)',26);
 
}}

/* News Banner: photo + overlapping heading panel + footer bar */
function tplNews(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{
  x.fillStyle='#fff';x.fillRect(0,0,W,H);const ih=Math.round(H*.47);img(0,0,W,ih);
  const g=x.createLinearGradient(0,ih*.55,0,ih);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.5)');x.fillStyle=g;x.fillRect(0,0,W,ih);
  if(B)pill(B,M,T+M,A,'#fff',null,26);
  const P=34,hh=layH(R1,tw-P*2,H*.2,hs-16,32,'800',MO,1.18),pb=hh.h+P*2,py=ih-60,ft=H-Bm-78;
  if(hh.L.length){x.save();x.shadowColor='rgba(0,0,0,.3)';x.shadowBlur=26;x.shadowOffsetY=10;node(M,py,tw,pb,8,A,null);x.restore();H2=lt(S.c2,.5);say(hh,M+P,py+P,'#fff',lt(A,.8));H2=S.c2}
  const y=py+pb+36,dh=layD(D,tw,ft-y-24,ds,22,'500',MO,1.5);say(dh,M,y,'#334155',A);
  x.fillStyle=A;x.fillRect(0,ft,W,H-ft);bt(M,ft+24,'left','#fff');x.fillStyle='rgba(255,255,255,.7)';[0,1,2].forEach(i=>{x.beginPath();x.arc(W-M-8-i*26,ft+39,7,0,7);x.fill()});
 
}}

/* Quote Card: solid colour, round photo, serif quote */
function tplQuote(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{H2=lt(S.c2,.5);
  x.fillStyle=A;x.fillRect(0,0,W,H);const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(255,255,255,.14)');g.addColorStop(1,'rgba(0,0,0,.3)');x.fillStyle=g;x.fillRect(0,0,W,H);
  const d=Math.round(Math.min(W*.34,H*.22)),cx=W/2,cy=T+M+d/2;
  x.save();x.beginPath();x.arc(cx,cy,d/2,0,7);x.clip();S.img?cover(S.img,cx-d/2,cy-d/2,d,d):ph(cx-d/2,cy-d/2,d,d);x.restore();x.strokeStyle='#fff';x.lineWidth=8;x.beginPath();x.arc(cx,cy,d/2,0,7);x.stroke();
  x.font=`700 160px ${PF}`;x.fillStyle=TN;x.textAlign='center';x.textBaseline='alphabetic';x.fillText('\u201C',cx,cy+d/2+140);
  let y=cy+d/2+155;const bot=H-Bm-M-(B?74:0),hh=layH(R1,tw,(bot-y)*.55,hs-6,36,'italic 700',PF,1.2);say(hh,cx,y,'#fff',lt(A,.85),'center');y+=hh.h+22;
  x.fillStyle=TN;x.fillRect(cx-50,y,100,6);y+=30;const dh=layD(D,tw,bot-y,ds-4,22,'500',MO,1.45);say(dh,cx,y,TN,'#fff','center');
  if(B)pill(B,cx,H-Bm-M-56,'rgba(255,255,255,.18)','#fff','rgba(255,255,255,.6)',26,'center');
 
}}

/* Spotlight: big round photo on a soft tint */
function tplSpotlight(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{
  x.fillStyle=TN;x.fillRect(0,0,W,H);x.fillStyle=A;x.globalAlpha=.14;x.beginPath();x.arc(W*.95,H*.05,W*.35,0,7);x.fill();x.beginPath();x.arc(W*.02,H*.95,W*.3,0,7);x.fill();x.globalAlpha=1;
  const d=Math.round(Math.min(tw*.8,(H-T-Bm)*.38)),cx=W/2,cy=T+M+d/2+26;
  x.beginPath();x.arc(cx,cy,d/2+26,0,7);x.fillStyle='#fff';x.fill();x.lineWidth=10;x.strokeStyle=A;x.stroke();
  x.save();x.beginPath();x.arc(cx,cy,d/2,0,7);x.clip();S.img?cover(S.img,cx-d/2,cy-d/2,d,d):ph(cx-d/2,cy-d/2,d,d);x.restore();
  let y=cy+d/2+70;x.fillStyle=A;rr(cx-50,y,100,8,4);x.fill();y+=34;const bot=H-Bm-M-(B?76:0),hh=layH(R1,tw,(bot-y)*.5,hs-14,34,'800',MO,1.2);say(hh,cx,y,'#0f2a4a',A,'center');y+=hh.h+18;
  const dh=layD(D,tw,bot-y,ds-4,22,'500',MO,1.45);say(dh,cx,y,'#475569',A,'center');if(B)pill(B,cx,H-Bm-M-56,'#fff',A,A,26,'center');
 
}}

/* Numbered Tips: each description line becomes a numbered card */
function tplTips(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{
  x.fillStyle=TN;x.fillRect(0,0,W,H);const bot=H-Bm-M-(B?74:0),hh=layH(R1,tw,H*.2,hs-6,40,'800',MO,1.15);let y=T+M;
  if(hh.L.length){say(hh,M,y,'#0f172a',A);y+=hh.h+18;x.fillStyle=A;rr(M,y,100,9,5);x.fill();y+=34}
  const items=D.split('\n').map(z=>z.trim().replace(/^[-•]\s+/,'')).filter(Boolean),n=items.length;
  /* try big badges first, then shrink badges/padding/font until every tip fits */
  const fitT=av=>{const ns=S.ns||'circle';let o;for(const sc of [1,.88,.78,.68,.6,.52]){const bd=Math.round(70*Math.min(1,k+.1)*sc),bw=ns==='pill'?Math.round(bd*1.2):bd,bh=ns==='pill'?Math.round(bd*.78):bd,pad=Math.round(22*sc),gap=Math.round(16*sc);
    for(let fs=ds+2;fs>=22;fs-=2){const rows=items.map(q=>layT(q,tw-pad*2-bw-20,H,fs,fs,'600',MO,1.3)),tot=rows.reduce((a,r)=>a+Math.max(bh,r.h)+pad*2,0)+gap*(n-1);o={rows,bw,bh,pad,gap,ns,tot,sc};if(tot<=av)return o}}return o};
  const ih0=S.img?Math.min(H*.2,(bot-y)*.28):0;let ban=0;
  if(ih0&&n){const o=fitT(bot-y-ih0-24);if(o.tot<=bot-y-ih0-24&&o.sc>=.78)ban=ih0}          /* photo banner only when all tips still fit */
  if(ih0&&!n)ban=ih0;
  if(ban){x.save();rr(M,y,tw,ban,24);x.clip();cover(S.img,M,y,tw,ban);x.restore();y+=ban+24}
  if(n){const av=bot-y,o=fitT(av),{bw,bh,pad,gap,ns}=o;let rows=o.rows;
   while(rows.length>1&&rows.reduce((a,r)=>a+Math.max(bh,r.h)+pad*2,0)+gap*(rows.length-1)>av)rows=rows.slice(0,-1);   /* never draw outside the card area */
   let yy=y;rows.forEach((r,i)=>{const rh=Math.max(bh,r.h)+pad*2;x.save();x.shadowColor='rgba(15,23,42,.14)';x.shadowBlur=16;x.shadowOffsetY=5;node(M,yy,tw,rh,26,'#fff',null);x.restore();rr(M,yy,tw,rh,26);x.strokeStyle=lt(A,.6);x.lineWidth=3;x.stroke();
    drawBadge(M+pad,yy+(rh-bh)/2,bw,bh,String(i+1),ns,A,`800 ${Math.round(bh*.5)}px ${MO}`,bh*.5);say(r,M+pad+bw+20,yy+(rh-r.h)/2,'#1e293b',A);yy+=rh+gap})}
  if(B)pill(B,W/2,H-Bm-M-56,A,'#fff',null,26,'center');
 
}}

/* Do / Don't: green DO card and red DON'T card */
function tplDoDont(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{
  x.fillStyle='#f8fafc';x.fillRect(0,0,W,H);const bot=H-Bm-M-(B?74:0),hh=layH(R1,tw,H*.17,hs-10,38,'800',MO,1.15),G='#2b8a3e',Rd='#c92a2a';let y=T+M;
  if(hh.L.length){say(hh,M,y,'#0f172a',A);y+=hh.h+26}
  const side=H<=1350,gp=26,cw=side?(tw-gp)/2:tw,ch=side?bot-y:(bot-y-gp)/2;
  const ic=(cx,cy,r,ok,fc,sc)=>{x.save();x.fillStyle=fc;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.strokeStyle=sc;x.lineWidth=r*.2;x.lineCap='round';x.lineJoin='round';x.beginPath();if(ok){x.moveTo(cx-r*.42,cy+r*.02);x.lineTo(cx-r*.1,cy+r*.34);x.lineTo(cx+r*.46,cy-r*.32)}else{x.moveTo(cx-r*.34,cy-r*.34);x.lineTo(cx+r*.34,cy+r*.34);x.moveTo(cx+r*.34,cy-r*.34);x.lineTo(cx-r*.34,cy+r*.34)}x.stroke();x.restore()};
  const card=(px,py,lab,col,ok,txt)=>{node(px,py,cw,ch,30,'#fff',col,5);const hb=78;x.save();rr(px,py,cw,ch,30);x.clip();x.fillStyle=col;x.fillRect(px,py,cw,hb);x.restore();
   ic(px+24+22,py+hb/2,22,ok,'#fff',col);x.font=`400 44px ${AN}`;if('letterSpacing' in x)x.letterSpacing='2px';x.textAlign='left';x.textBaseline='middle';x.fillStyle='#fff';x.fillText(lab,px+24+44+16,py+hb/2+3);if('letterSpacing' in x)x.letterSpacing='0px';
   const its=txt.split('\n').map(z=>z.trim().replace(/^[-•]\s+/,'')).filter(Boolean),pd=26,iw=cw-pd*2-50,av=ch-hb-pd*2+10;let rows=[];
   for(let fs=ds-2;fs>=20;fs-=2){rows=its.map(q=>layT(q,iw,H,fs,fs,'600',MO,1.3));if(rows.reduce((a,r)=>a+Math.max(34,r.h)+20,0)<=av)break}
   let yy=py+hb+pd;rows.forEach(r=>{ic(px+pd+17,yy+r.s*.7,17,ok,col,'#fff');say(r,px+pd+50,yy,'#1e293b',col);yy+=Math.max(34,r.h)+20})};
  card(M,y,'DO',G,true,D);card(side?M+cw+gp:M,side?y:y+ch+gp,"DON'T",Rd,false,(S.d2||'').trim());
  if(B)pill(B,W/2,H-Bm-M-56,A,'#fff',null,26,'center');
 
}}

/* Before / After: two photos with labels */
function tplBeforeAfter(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{
  x.fillStyle='#f8fafc';x.fillRect(0,0,W,H);const bot=H-Bm-M-(B?74:0),hh=layH(R1,tw,H*.16,hs-10,38,'800',MO,1.15);let y=T+M;
  if(hh.L.length){say(hh,M,y,'#0f172a',A);y+=hh.h+24}
  const dh=D?layD(D,tw,H*.2,ds-2,22,'500',MO,1.4):null,dB=dh&&dh.h?dh.h+22:0,side=H<=1080,gp=30,ah=bot-y-dB,pw=side?(tw-gp)/2:tw,pH=side?ah:(ah-gp)/2;
  const panel=(px,py,im,lab,col)=>{x.save();rr(px,py,pw,pH,28);x.clip();if(im)cover(im,px,py,pw,pH);else{x.fillStyle=lt(col,.88);x.fillRect(px,py,pw,pH)}x.restore();
   if(!im){x.save();x.setLineDash([14,12]);rr(px,py,pw,pH,28);x.strokeStyle=col;x.lineWidth=3;x.stroke();x.restore();x.fillStyle=col;x.font=`700 30px ${MO}`;x.textAlign='center';x.textBaseline='middle';x.fillText('Add image here',px+pw/2,py+pH/2)}
   rr(px,py,pw,pH,28);x.strokeStyle=col;x.lineWidth=6;x.stroke();x.font=`400 40px ${AN}`;if('letterSpacing' in x)x.letterSpacing='3px';const lw=x.measureText(lab).width+44;node(px+22,py+22,lw,64,32,col,null);x.fillStyle='#fff';x.textAlign='left';x.textBaseline='middle';x.fillText(lab,px+44,py+56);if('letterSpacing' in x)x.letterSpacing='0px'};
  panel(M,y,S.img,'BEFORE','#64748b');panel(side?M+pw+gp:M,side?y:y+pH+gp,S.img2,'AFTER',A);
  const cx=side?M+pw+gp/2:M+tw/2,cy=side?y+pH/2:y+pH+gp/2;x.fillStyle='#fff';x.beginPath();x.arc(cx,cy,34,0,7);x.fill();x.strokeStyle=A;x.lineWidth=5;x.stroke();x.lineCap='round';x.lineJoin='round';x.beginPath();
  if(side){x.moveTo(cx-14,cy);x.lineTo(cx+14,cy);x.moveTo(cx+4,cy-10);x.lineTo(cx+14,cy);x.lineTo(cx+4,cy+10)}else{x.moveTo(cx,cy-14);x.lineTo(cx,cy+14);x.moveTo(cx-10,cy+4);x.lineTo(cx,cy+14);x.lineTo(cx+10,cy+4)}x.stroke();
  if(dh&&dh.h)say(dh,M,(side?y+pH:y+pH*2+gp)+22,'#475569',A);
  if(B)pill(B,W/2,H-Bm-M-56,A,'#fff',null,26,'center');
 
}}

/* Checklist: ticked / unticked rows */
function tplChecklist(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{
  x.fillStyle=TN;x.fillRect(0,0,W,H);const bot=H-Bm-M-(B?74:0),hh=layH(R1,tw,H*.18,hs-6,40,'800',MO,1.15);let y=T+M;
  if(hh.L.length){say(hh,M,y,'#0f172a',A);y+=hh.h+18;x.fillStyle=A;rr(M,y,100,9,5);x.fill();y+=34}
  const items=D.split('\n').map(z=>z.trim()).filter(Boolean).map(q=>({u:/^\[\s*\]/.test(q),t:q.replace(/^\[\s*[xX]?\s*\]\s*/,'').replace(/^[-•]\s+/,'')})),n=items.length;
  if(n){const pd=30,bx=48,rg=34,av=bot-y;let rows;for(let fs=ds+4;fs>=20;fs-=2){rows=items.map(o=>layT(o.t,tw-pd*2-bx-24,H,fs,fs,'600',MO,1.3));if(rows.reduce((a,r)=>a+Math.max(bx,r.h)+rg,0)-rg+pd*2<=av)break}
   const ch=rows.reduce((a,r)=>a+Math.max(bx,r.h)+rg,0)-rg+pd*2;x.save();x.shadowColor='rgba(15,23,42,.14)';x.shadowBlur=22;x.shadowOffsetY=7;node(M,y,tw,ch,30,'#fff',null);x.restore();rr(M,y,tw,ch,30);x.strokeStyle=lt(A,.6);x.lineWidth=3;x.stroke();
   let yy=y+pd;rows.forEach((r,i)=>{const o=items[i],rh=Math.max(bx,r.h),by=yy+Math.max(0,(rh>bx?r.lh/2-bx/2:(rh-bx)/2)),bx0=M+pd;
    if(o.u){node(bx0,by,bx,bx,13,'#fff',A,4)}else{node(bx0,by,bx,bx,13,A,null);x.strokeStyle='#fff';x.lineWidth=6;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(bx0+bx*.24,by+bx*.52);x.lineTo(bx0+bx*.43,by+bx*.7);x.lineTo(bx0+bx*.78,by+bx*.3);x.stroke()}
    say(r,bx0+bx+24,yy+(rh-r.h)/2,o.u?'#64748b':'#1e293b',A);yy+=rh;if(i<n-1){x.fillStyle='#e2e8f0';x.fillRect(M+pd,yy+rg/2-1,tw-pd*2,2);yy+=rg}})}
  if(B)pill(B,W/2,H-Bm-M-56,A,'#fff',null,26,'center');
 
}}

/* Testimonial: quote, star rating, person photo and name */
function tplTestimonial(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{
  x.fillStyle=TN;x.fillRect(0,0,W,H);const top=T+M,bot=H-Bm-M-(B?74:0),cH=bot-top,pad=56,iw=tw-pad*2,ph2=120;
  x.save();x.shadowColor='rgba(15,23,42,.18)';x.shadowBlur=36;x.shadowOffsetY=12;node(M,top,tw,cH,40,'#fff',null);x.restore();x.save();rr(M,top,tw,cH,40);x.clip();x.fillStyle=A;x.fillRect(M,top,tw,16);x.restore();
  x.font=`700 190px ${PF}`;x.fillStyle=lt(A,.6);x.textAlign='left';x.textBaseline='alphabetic';x.fillText('\u201C',M+pad,top+200);
  const star=(cx,cy,r,f)=>{x.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr2=i%2?r*.45:r;x.lineTo(cx+Math.cos(a)*rr2,cy+Math.sin(a)*rr2)}x.closePath();x.fillStyle=f;x.fill()};
  const rt=S.rate||5;for(let i=0;i<5;i++)star(M+tw-pad-24-(4-i)*54,top+96,24,i<rt?'#f5b301':'#e2e8f0');
  const fy=bot-pad-ph2,qy=top+215,qh=fy-36-qy,dh=layQ(D,iw,qh,ds+8,24,'italic 700',PF,1.4);say(dh,M+pad,qy+Math.max(0,(qh-dh.h)/2),'#1e293b',A);
  x.fillStyle='#e2e8f0';x.fillRect(M+pad,fy-20,iw,2);const cx=M+pad+ph2/2,cy=fy+ph2/2;
  x.save();x.beginPath();x.arc(cx,cy,ph2/2,0,7);x.clip();S.img?cover(S.img,cx-ph2/2,cy-ph2/2,ph2,ph2):ph(cx-ph2/2,cy-ph2/2,ph2,ph2);x.restore();x.strokeStyle=A;x.lineWidth=6;x.beginPath();x.arc(cx,cy,ph2/2,0,7);x.stroke();
  const tx=M+pad+ph2+26,nm=layH(R1,iw-ph2-26,64,46,28,'800',MO,1.1),rl=layH(R3,iw-ph2-26,40,30,20,'500',MO,1.2),gh=nm.h+(rl.h?8+rl.h:0),gy=cy-gh/2;
  say(nm,tx,gy,'#0f172a',A);if(rl.h)say(rl,tx,gy+nm.h+8,'#64748b',A);
  if(B)pill(B,W/2,H-Bm-M-56,A,'#fff',null,26,'center');
 
}}

/* Illustration and Illustration 2: handwritten headings between images */
function tplIllustration(_c){const {S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt}=_c;{  x.fillStyle='#fffdf8';x.fillRect(0,0,W,H);const aT=T+34,aB=H-Bm-34-(B?56:0),av=aB-aT,g=16;
  if(t==='illus2'){
   const h1=layH(R1,tw,av*.17,hs+10,36,'700',KA,1.15),h2=layH(R3,tw,av*.17,hs+10,36,'700',KA,1.15),ih=Math.floor((av-h1.h-h2.h-g*6)/2);
   let y=aT;slot(S.img,M,y,tw,ih);y+=ih+g*1.5;say(h1,W/2,y,'#1a1a1a',A,'center');y+=h1.h+g*1.5;slot(S.img2,M,y,tw,ih);y+=ih+g*1.5;say(h2,W/2,y,'#1a1a1a',A,'center');
  }else{
   const ih1=Math.round(av*(S.img2?.27:.4)),ih2=Math.round(av*.27),hh=layH(R1,tw,av*.24,hs+6,40,'700',KA,1.15);
   let y=aT;slot(S.img,M,y,tw,ih1);y+=ih1+18;say(hh,W/2,y,'#1a1a1a',A,'center');y+=hh.h+18;if(S.img2){slot(S.img2,M,y,tw,ih2);y+=ih2+18}
   const dh=layD(D,tw,aB-y,ds+8,22,'700',KA,1.2);say(dh,W/2,y,'#1a1a1a',A,'center');
  }
  bt(W/2,aB+14,'center',A);
 
}}

const TEMPLATES={overlay:tplOverlay,split:tplSplit,block:tplMindMap,glass:tplGlass,edit:tplEditorial,poster:tplPoster,news:tplNews,quote:tplQuote,spot:tplSpotlight,tips:tplTips,dodont:tplDoDont,beforeafter:tplBeforeAfter,checklist:tplChecklist,testi:tplTestimonial,illus:tplIllustration,illus2:tplIllustration};

/* Common layout values, then hands over to the chosen template */
function renderBase(c,S){
 x=c.getContext('2d');K=S;const F=FM[S.f],W=F.w,H=F.h;c.width=W;c.height=H;
 const R1=(S.num?'\u0001'+String(S.num).trim()+' ':'')+(S.h||'').trim(),R3=(S.h2||'').trim(),D=(S.d||'').trim(),B=(S.b||'').trim(),A=S.c,TN=S.tn,HL=lt(A,.6),t=S.t;
 const M=76,T=F.s?230:0,Bm=F.s?330:0,tw=W-M*2,k=Math.min(1,H/1350+.15),hs=Math.round(82*k),ds=Math.round(45*k);
 const bt=(px,py,al,col)=>{if(B){x.font=`700 30px ${MO}`;x.textAlign=al;x.fillStyle=col;x.textBaseline='top';x.fillText(B,px,py)}};
 x.textAlign='left';
 H2=S.c2;
 (TEMPLATES[t]||tplIllustration)({S,t,W,H,R1,R3,D,B,A,TN,HL,M,T,Bm,tw,k,hs,ds,bt});
}
function render(c,S){renderBase(c,S);if(S.logo)drawLogo(c,S)}
function drawLogo(c,S){const L=S.logo,W=c.width,H=c.height,F=FM[S.f],T=F.s?230:0,Bm=F.s?330:0,m=60,mh=[0,64,92,128][S.lsz||2],r=Math.min(mh*2.4/L.width,mh/L.height),w=L.width*r,h=L.height*r,p=S.lpos||'tr';
 const px=p[1]==='l'?m:W-m-w,py=p[0]==='t'?T+m:H-Bm-m-h;x.save();x.globalAlpha=S.lop==null?1:S.lop;x.shadowColor='rgba(0,0,0,.28)';x.shadowBlur=12;x.shadowOffsetY=3;x.drawImage(L,px,py,w,h);x.restore()}

/* ================= storage ================= */
/* Saving: PNG/ZIP download, ZIP writer, IndexedDB storage */
/* ---------- Save / ZIP ---------- */
const blobOf=c=>new Promise(r=>c.toBlob(r,'image/png'));
const out=async S=>{await ensureFonts(S);const c=document.createElement('canvas');render(c,S);return blobOf(c)};
const tname=k=>TP.find(p=>p[0]===k)[1];
let toastT;const msg=s=>{$('msg').textContent=s;$('msg2').textContent=s;const e=$('toast');if(s){e.textContent=s;e.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{e.hidden=true},3800)}else e.hidden=true};
async function save(blob,fn){
 try{const d=(typeof claude!=='undefined')?await claude.use('downloads'):null;if(d){await d.save({filename:fn,data:blob});return}}catch(e){if(e&&e.code==='declined')return}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
function crc(u){const T=crc.t||(crc.t=[...Array(256)].map((_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c>>>0}));let r=-1;for(const b of u)r=T[(r^b)&255]^(r>>>8);return(r^-1)>>>0}
async function zip(files){const enc=new TextEncoder(),parts=[],cen=[];let off=0,cs=0;
 for(const f of files){const d=new Uint8Array(await f.blob.arrayBuffer()),n=enc.encode(f.name),c=crc(d);
  const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(12,0x21,true);h.setUint32(14,c,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,n.length,true);parts.push(h.buffer,n,d);
  const e=new DataView(new ArrayBuffer(46));e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x0800,true);e.setUint16(14,0x21,true);e.setUint32(16,c,true);e.setUint32(20,d.length,true);e.setUint32(24,d.length,true);e.setUint16(28,n.length,true);e.setUint32(42,off,true);cen.push(e.buffer,n);cs+=46+n.length;off+=30+n.length+d.length}
 const z=new DataView(new ArrayBuffer(22));z.setUint32(0,0x06054b50,true);z.setUint16(8,files.length,true);z.setUint16(10,files.length,true);z.setUint32(12,cs,true);z.setUint32(16,off,true);return new Blob([...parts,...cen,z.buffer],{type:'application/zip'})}
const safe=s=>s.replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'posts';

/* ---------- Storage (IndexedDB: posts stay saved after refresh) ---------- */
const DB=new Promise(res=>{try{const r=indexedDB.open('postmaker',2);r.onupgradeneeded=()=>{const d=r.result;['projects','posts','draft'].forEach(n=>{if(!d.objectStoreNames.contains(n))d.createObjectStore(n,{keyPath:'id'})})};r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);r.onblocked=()=>res(null)}catch(e){res(null)}});
const tx=async(s,m,f)=>{const d=await DB;if(!d)throw new Error('storage unavailable');return new Promise((res,rej)=>{try{const t=d.transaction(s,m),q=f(t.objectStore(s));t.oncomplete=()=>res(q&&q.result);t.onerror=t.onabort=()=>rej(t.error||new Error('storage error'))}catch(e){rej(e)}})};
/* dbPut / dbDel resolve true on success and false on failure; dbAll resolves [] on failure */
const dbPut=(s,v)=>tx(s,'readwrite',o=>o.put(v)).then(()=>true,()=>false),dbDel=(s,k)=>tx(s,'readwrite',o=>o.delete(k)).then(()=>true,()=>false),dbAll=s=>tx(s,'readonly',o=>o.getAll()).catch(()=>[]);
const ser=S=>({f:S.f,t:S.t,c:S.c,tn:S.tn,c2:S.c2,dir:S.dir,h:S.h,h2:S.h2,d:S.d,b:S.b,imgB:S.imgB||null,img2B:S.img2B||null,kids:(S.kids||[]).map(k=>({t:k.t,imgB:k.imgB||null})),d2:S.d2||'',num:S.num||'',nt:S.nt||'',ns:S.ns||'circle',logoB:S.logoB||null,lpos:S.lpos||'tr',lsz:S.lsz||2,lop:S.lop==null?1:S.lop,rate:S.rate||5,hf:S.hf||'',df:S.df||'',dal:S.dal||'auto'});
const li=b=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=URL.createObjectURL(b)});
const hyd=async s=>({...s,logo:s.logoB?await li(s.logoB):null,img:s.imgB?await li(s.imgB):null,img2:s.img2B?await li(s.img2B):null,kids:await Promise.all((s.kids||[]).map(async k=>({...k,img:k.imgB?await li(k.imgB):null})))});
const put=it=>dbPut('posts',{id:it.id,pid:it.pid,ts:it.ts,th:it.th,S:ser(it.S)});

/* ================= ui ================= */
/* Editor controls: chips, colours, images, mind map children, numbering, logo, draw() */
/* ---------- UI ---------- */
function chips(el,list,key){el.innerHTML='';list.forEach(([k,n])=>{const b=document.createElement('button');b.className='chip'+(st[key]===k?' on':'');b.textContent=n;b.onclick=()=>{st[key]=k;ui();draw()};el.appendChild(b)})}
function ui(){chips($('dal'),[['auto','Template default'],['left','Left'],['center','Center']],'dal');$('hf').value=st.hf||'';$('df').value=st.df||'';chips($('fmt'),Object.entries(FM).map(([k,v])=>[k,v.n]),'f');chips($('tpl'),TP,'t');chips($('dir'),[['h','Horizontal'],['v','Vertical']],'dir');[...$('col').children].forEach(b=>b.className=b.dataset.c===st.c?'on':'');[...$('col2').children].forEach(b=>b.className=b.dataset.c===st.c2?'on':'');$('mm').hidden=st.t!=='block';$('d2w').hidden=st.t!=='dodont';$('tipn').hidden=st.t!=='tips';chips($('nstyle'),[['circle','Circle'],['square','Square'],['pill','Pill']],'ns');chips($('lpos'),[['tl','Top left'],['tr','Top right'],['bl','Bottom left'],['br','Bottom right']],'lpos');chips($('lsz'),[[1,'Small'],[2,'Medium'],[3,'Large']],'lsz');chips($('lop'),[[1,'100%'],[.7,'70%'],[.4,'40%']],'lop');chips($('rate'),[[1,'1 ★'],[2,'2 ★'],[3,'3 ★'],[4,'4 ★'],[5,'5 ★']],'rate');$('rw').hidden=st.t!=='testi';$('tnote').textContent=NOTES[st.t]||'';$('tnote').hidden=!NOTES[st.t]}
CL.forEach(([c,tn])=>{const b=document.createElement('button');b.style.background=c;b.dataset.c=c;b.onclick=()=>{st.c=c;st.tn=tn;ui();draw()};$('col').appendChild(b)});
C2.forEach(c=>{const b=document.createElement('button');b.style.background=c;b.dataset.c=c;b.onclick=()=>{st.c2=c;ui();draw()};$('col2').appendChild(b)});
/* Photos are resized (max side) and re-encoded before use, so big phone photos stay light */
async function prepImage(file,max){
 const u=URL.createObjectURL(file);
 try{const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('decode'));i.src=u});
  const r=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*r));c.height=Math.max(1,Math.round(im.naturalHeight*r));c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  const keepAlpha=/png|webp|gif|svg/.test(file.type),blob=await new Promise(res=>c.toBlob(res,keepAlpha?'image/png':'image/jpeg',.92));
  return{img:await li(blob),blob}}
 catch(e){msg('This image could not be opened. Please use a JPG or PNG file.');return null}
 finally{URL.revokeObjectURL(u)}}
function pick(inp,key,max){inp.onchange=async e=>{const f=e.target.files[0];if(!f)return;const p=await prepImage(f,max);if(!p)return;st[key]=p.img;st[key+'B']=p.blob;draw()}}
pick($('f'),'img',2000);pick($('f2'),'img2',2000);
pick($('fl'),'logo',700);$('rl').onclick=()=>{st.logo=null;st.logoB=null;$('fl').value='';draw()};
$('r1').onclick=()=>{st.img=null;st.imgB=null;$('f').value='';draw()};
$('r2').onclick=()=>{st.img2=null;st.img2B=null;$('f2').value='';draw()};
['h','h2','d','b'].forEach(i=>$(i).oninput=draw);
function kui(){const el=$('kl');el.innerHTML='';st.kids.forEach((k,i)=>{const r=document.createElement('div');r.className='row';r.style.marginTop='6px';
 const inp=document.createElement('input');inp.type='text';inp.placeholder='Child '+(i+1)+' text';inp.value=k.t;inp.oninput=()=>{k.t=inp.value;draw()};
 const lb=document.createElement('label');lb.className='chip kb';
 if(k.img){const im=new Image();im.src=k.img.src;im.style.cssText='width:26px;height:26px;object-fit:cover;border-radius:5px';lb.append(im);lb.title='Tap to remove image';lb.onclick=e=>{e.preventDefault();k.img=null;k.imgB=null;kui();draw()}}
 else{lb.append('🖼');const f=document.createElement('input');f.type='file';f.accept='image/*';f.hidden=true;f.onchange=async e=>{const fl=e.target.files[0];if(!fl)return;const p=await prepImage(fl,900);if(!p)return;k.img=p.img;k.imgB=p.blob;kui();draw()};lb.append(f)}
 const rm=document.createElement('button');rm.className='chip rm';rm.textContent='✕';rm.onclick=()=>{st.kids.splice(i,1);kui();draw()};
 r.append(inp,lb,rm);el.appendChild(r)});$('kadd').disabled=st.kids.length>=8}
$('kadd').onclick=()=>{st.kids.push({t:'',img:null,imgB:null});kui();draw();const a=$('kl').querySelectorAll('input[type=text]');a[a.length-1].focus()};
const nextNum=()=>Math.max(0,...posts.filter(p=>p.pid===pid).map(p=>parseInt(p.S.num)||0))+1;
['d2','nn','nt'].forEach(i=>$(i).oninput=draw);$('nshow').onchange=()=>{if($('nshow').checked&&!$('nn').value.trim())$('nn').value=nextNum();draw()};
const cur=()=>({...st,kids:st.kids.map(k=>({...k})),h:$('h').value,h2:$('h2').value,d:$('d').value,b:$('b').value,d2:$('d2').value,num:$('nshow').checked?($('nn').value.trim()||'1'):'',nt:$('nt').value.trim()});
function draw(){const S=cur();render(cv,S);$('empty').hidden=!!((S.h||'').trim()||(S.h2||'').trim()||(S.d||'').trim()||(S.b||'').trim()||S.img||S.img2||S.logo||S.num||(S.kids&&S.kids.length));$('lopt').hidden=!st.logo;dsave()}
function dsave(){if(!dready)return;clearTimeout(dt);dt=setTimeout(()=>{dbPut('draft',{id:'cur',ts:Date.now(),editId,S:ser(cur())}).then(ok=>{$('ds').textContent=ok?'✓ Draft autosaved':'Draft could not be saved (browser storage unavailable)'})},700)}


$('dl').onclick=async()=>{const S=cur();await save(await out(S),'post-'+S.t+'.png');msg('Done.')};

/* Font pickers: Template default keeps each design's own font */
function fillFonts(sel){sel.innerHTML='';const d=document.createElement('option');d.value='';d.textContent='Template default';sel.appendChild(d);FONT_OPTS.forEach(g=>{const og=document.createElement('optgroup');og.label=g.g;g.list.forEach(([n])=>{const o=document.createElement('option');o.value=n;o.textContent=n;o.style.fontFamily=fstack(n);og.appendChild(o)});sel.appendChild(og)})}
['hf','df'].forEach(id=>{fillFonts($(id));$(id).onchange=()=>{st[id]=$(id).value;draw();fontReady(st[id]).then(draw)}});
$('dl2').onclick=()=>$('dl').click();

/* ================= projects ================= */
/* Projects and posts: create, edit, duplicate, delete, ZIP */
/* ---------- Projects & posts ---------- */
const setCur=()=>{try{localStorage.setItem('pm_cur',pid||'')}catch(e){}};
function setAdd(){$('add').textContent=editId?'✔ Update post':'+ Add current post';$('cancel').hidden=!editId}
function pui(){const s=$('pj');s.innerHTML='';if(!projects.length){const o=document.createElement('option');o.textContent='No project yet';s.appendChild(o);s.disabled=true}else{s.disabled=false;projects.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=`${p.name} (${posts.filter(q=>q.pid===p.id).length})`;s.appendChild(o)});s.value=pid}}
function load(S){Object.assign(st,{f:S.f,t:S.t,c:S.c,tn:S.tn,c2:S.c2||C2[0],dir:S.dir||'h',img:S.img,imgB:S.imgB||null,img2:S.img2,img2B:S.img2B||null,kids:(S.kids||[]).map(k=>({...k}))});$('f').value='';$('f2').value='';$('h').value=S.h;$('h2').value=S.h2;$('d').value=S.d;$('b').value=S.b;$('d2').value=S.d2||'';$('nshow').checked=!!S.num;$('nn').value=S.num||'';$('nt').value=S.nt||'';Object.assign(st,{ns:S.ns||'circle',logo:S.logo||null,logoB:S.logoB||null,lpos:S.lpos||'tr',lsz:S.lsz||2,lop:S.lop==null?1:S.lop,rate:S.rate||5,hf:S.hf||'',df:S.df||'',dal:S.dal||'auto'});$('fl').value='';ui();kui();draw();ensureFonts(S).then(draw)}
function list(){const P=projects.find(p=>p.id===pid),ps=posts.filter(p=>p.pid===pid);$('bt').textContent=P?`${P.name} · ${ps.length} post${ps.length===1?'':'s'}`:'My Projects';const el=$('bl');el.innerHTML='';
 ps.forEach((it,i)=>{const r=document.createElement('div');r.className='bi'+(it.id===editId?' ed':'');const im=new Image();im.src=it.th;const n=document.createElement('div');n.className='bn';n.innerHTML=`<b>${i+1}. ${tname(it.S.t)}</b><br>${FM[it.S.f].n}`;r.append(im,n);
  [['Edit',()=>{editId=it.id;load(it.S);setAdd();list();msg(`Editing post ${i+1}. Change it, then tap "Update post".`)}],['PNG',async()=>save(await out(it.S),`${i+1}-${it.S.t}.png`)],['Duplicate',async()=>{const nx=ps[i+1],cp={id:uid(),pid,ts:nx?(it.ts+nx.ts)/2:it.ts+1,th:it.th,S:{...it.S,kids:(it.S.kids||[]).map(k=>({...k}))}};posts.splice(posts.indexOf(it)+1,0,cp);await put(cp);pui();list();msg('Post duplicated. Tap Edit on the copy to change it.')}],['✕',async()=>{posts.splice(posts.indexOf(it),1);await dbDel('posts',it.id);if(editId===it.id)editId=null;pui();list();setAdd()}]].forEach(([l,f])=>{const b=document.createElement('button');b.className='chip';b.textContent=l;b.onclick=f;r.appendChild(b)});el.appendChild(r)})}
$('pj').onchange=()=>{pid=$('pj').value;setCur();editId=null;setAdd();list()};
$('pnew').onclick=async()=>{const n=$('pn').value.trim();if(!n)return msg('Enter a project name first.');const p={id:uid(),name:n,ts:Date.now()};projects.push(p);pid=p.id;await dbPut('projects',p);setCur();$('pn').value='';editId=null;pui();list();setAdd();msg('Project created. Now add posts to it.')};
$('pren').onclick=async()=>{const P=projects.find(p=>p.id===pid),n=$('pn').value.trim();if(!P)return msg('Create a project first.');if(!n)return msg('Type the new name in the project name box, then tap Rename.');P.name=n;await dbPut('projects',P);$('pn').value='';pui();list();msg('Renamed.')};
let dc=0;$('pdel').onclick=async()=>{const P=projects.find(p=>p.id===pid);if(!P)return;if(!dc){dc=1;$('pdel').textContent='Confirm?';setTimeout(()=>{dc=0;$('pdel').textContent='Delete'},3000);return}dc=0;$('pdel').textContent='Delete';for(const q of posts.filter(q=>q.pid===pid))await dbDel('posts',q.id);posts=posts.filter(q=>q.pid!==pid);await dbDel('projects',pid);projects=projects.filter(p=>p.id!==pid);pid=projects[0]?projects[0].id:null;setCur();editId=null;pui();list();setAdd();msg('Project deleted.')};
$('cancel').onclick=()=>{editId=null;setAdd();list();msg('Edit cancelled.')};
$('add').onclick=async()=>{if(!pid)return msg('Create a project first: type a name above and tap Create.');draw();const t=document.createElement('canvas');t.width=108;t.height=Math.round(108*cv.height/cv.width);t.getContext('2d').drawImage(cv,0,0,t.width,t.height);const th=t.toDataURL(),S=cur();let ok;
 if(editId){const it=posts.find(p=>p.id===editId);it.S=S;it.th=th;ok=await put(it);editId=null;msg(ok?'Post updated.':'Post updated on screen, but browser storage is unavailable or full, so it may not stay after refresh.')}else{const it={id:uid(),pid,ts:Date.now(),th,S};posts.push(it);ok=await put(it);msg(ok?'Post saved to this project.':'Post added on screen, but browser storage is unavailable or full, so it may not stay after refresh.')}
 $('h').value='';$('h2').value='';$('d').value='';$('d2').value='';if($('nshow').checked)$('nn').value=nextNum();draw();pui();list();setAdd()};
$('zipb').onclick=async()=>{const P=projects.find(p=>p.id===pid),ps=posts.filter(p=>p.pid===pid);if(!P)return msg('Create a project first.');if(!ps.length)return msg('Add at least one post first.');msg('Preparing ZIP…');const files=[];for(let i=0;i<ps.length;i++)files.push({name:`${i+1}-${ps[i].S.t}.png`,blob:await out(ps[i].S)});await save(await zip(files),safe(P.name)+'.zip');msg('Done.')};
$('pn').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('pnew').click()}};

/* ================= pwa ================= */
/* PWA: service worker, Install button, install help and cache reset */
(function(){
 const card=$('pwa'),framed=window.self!==window.top,secure=/^https?:$/.test(location.protocol);
 const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
 let deferred=null;
 const say=t=>{$('pwas').textContent=t};
 if(framed)return;                                   /* e.g. shown inside another page: nothing to install */
 if(!secure){card.hidden=false;$('pwah').hidden=true;say('Installing works only from HTTPS hosting. Upload this folder to a web host (for example Netlify or GitHub Pages) and open it from there.');return}
 if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(e=>{if(!standalone){card.hidden=false;say('Offline support could not start: '+e.message)}});
 if(standalone)return;                               /* already running as an installed app */
 card.hidden=false;say('Checking whether your browser can install this app…');
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('pwai').hidden=false;say('Ready to install. Tap "Install app".')});
 window.addEventListener('appinstalled',()=>{deferred=null;$('pwai').hidden=true;say('Installed. Open it from your home screen or app list.')});
 $('pwai').onclick=async()=>{if(!deferred)return;deferred.prompt();const r=await deferred.userChoice;deferred=null;$('pwai').hidden=true;say(r.outcome==='accepted'?'Installing…':'Install cancelled. You can install later from the browser menu.')};
 async function diag(){const L=[(secure?'✓':'✗')+' Secure address (HTTPS)'];
  try{const m=await (await fetch('manifest.json',{cache:'no-store'})).json();L.push('✓ Manifest loaded, app id: '+m.id)}catch(e){L.push('✗ Manifest could not be loaded')}
  try{const rs=await navigator.serviceWorker.getRegistrations(),mine=new URL('./',location.href).href,own=rs.find(r=>r.scope===mine),other=rs.filter(r=>r.scope!==mine&&mine.indexOf(r.scope)===0);
   L.push(own?'✓ Offline support (service worker) is active':'… Offline support is starting. Reload once.');
   if(other.length)L.push('⚠ Another app on this address ('+other[0].scope+') can capture this page. Host this app on its own address.');
   if(own&&own.active&&own.active.scriptURL!==new URL('sw.js',location.href).href)L.push('⚠ A different service worker is registered here.')}catch(e){}
  const box=$('pwad');box.innerHTML='';L.forEach(q=>{const d=document.createElement('div');d.textContent=q;box.appendChild(d)})}
 $('pwah').onclick=()=>{$('pwahelp').hidden=!$('pwahelp').hidden;if(!$('pwahelp').hidden)diag()};
 $('pwar').onclick=async()=>{say('Resetting…');try{const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister()));const ks=await caches.keys();await Promise.all(ks.filter(k=>k.indexOf('postmaker')===0).map(k=>caches.delete(k)))}catch(e){}location.reload()};
 setTimeout(()=>{if(!deferred)say(ios?'On iPhone / iPad: tap Share, then "Add to Home Screen".':'Your browser has not offered installation. If it says "already installed", tap "Install help".')},3500);
})();

/* ================= main ================= */
/* Start-up: load saved projects and draft, first draw, font reload */
async function init(){try{projects=(await dbAll('projects')).sort((a,b)=>a.ts-b.ts);const ps=(await dbAll('posts')).sort((a,b)=>a.ts-b.ts);for(const p of ps)posts.push({...p,S:await hyd(p.S)})}catch(e){}
 let c=null;try{c=localStorage.getItem('pm_cur')}catch(e){}pid=projects.find(p=>p.id===c)?c:(projects[0]?projects[0].id:null);try{const dr=(await dbAll('draft'))[0];if(dr&&dr.S){load(await hyd(dr.S));if(dr.editId&&posts.find(p=>p.id===dr.editId))editId=dr.editId;$('ds').textContent='✓ Draft restored'}}catch(e){}
 dready=true;pui();list();setAdd();try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}}

ui();kui();draw();setAdd();init();
Promise.all(['700 40px Kalam','800 40px Montserrat','500 40px Montserrat','40px Anton','italic 700 40px "Playfair Display"','800 40px "Noto Sans Devanagari"'].map(f=>document.fonts.load(f))).then(()=>document.fonts.ready).then(draw);

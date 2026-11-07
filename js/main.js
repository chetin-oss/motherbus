(()=>{
let BPM=128,SPB=60/BPM;const PI=Math.PI;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
const pick=a=>a[Math.floor(rnd()*a.length)];

/* ---------- renderer / scene ---------- */
const app=document.getElementById('app');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
app.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xd2d8d6);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,0.05,60);
const hemi=new THREE.HemisphereLight(0xfff2f8,0x4a2a3a,0.72);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1dc,0.45);sun.position.set(3,4,-2);scene.add(sun);

const MC={};
function mat(c,o){const k=c+'|'+JSON.stringify(o||{});return MC[k]||(MC[k]=new THREE.MeshPhongMaterial(Object.assign({color:c,shininess:12},o||{})));}
function mesh(g,m,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);return o;}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw&&draw(g,w,h);const t=new THREE.CanvasTexture(c);t.userData={c,g};return t;}

const bus=new THREE.Group();scene.add(bus);
const L0=-7.2,L1=7.2,LEN=L1-L0,W=2.5;
const tmp=new THREE.Object3D();
function inst(geo,m,list){const im=new THREE.InstancedMesh(geo,m,list.length);list.forEach((p,i)=>{tmp.position.set(p[0],p[1],p[2]);tmp.rotation.set(p[3]||0,p[4]||0,p[5]||0);tmp.scale.set(1,1,1);tmp.updateMatrix();im.setMatrixAt(i,tmp.matrix);});bus.add(im);return im;}

/* ---------- outside scenery (autumn mountains) ---------- */
function ridge(x,base,amp,comps){let y=base;for(const [f,a,p] of comps)y-=amp*a*Math.sin(2*PI*f*x/2048+p);return y;}
/* reed field (갈대밭) painter, tileable horizontally */
function paintReeds(g,o){
  const H=150;
  const sky=g.createLinearGradient(0,0,0,H+10);sky.addColorStop(0,o.sky0);sky.addColorStop(1,o.sky1);g.fillStyle=sky;g.fillRect(0,0,2048,512);
  if(o.sun){const s=g.createRadialGradient(1024,H-30,6,1024,H-30,240);s.addColorStop(0,'rgba(255,252,235,1)');s.addColorStop(0.15,'rgba(255,236,180,.9)');s.addColorStop(1,'rgba(255,190,100,0)');g.fillStyle=s;g.fillRect(0,0,2048,512);}
  g.fillStyle=o.hill;g.beginPath();g.moveTo(0,512);for(let x=0;x<=2048;x+=8)g.lineTo(x,ridge(x,H-12,28,[[2,1,0],[5,.5,1],[11,.2,2]]));g.lineTo(2048,512);g.fill();
  g.fillStyle=o.trees;g.beginPath();g.moveTo(0,512);for(let x=0;x<=2048;x+=4)g.lineTo(x,H+2-5*Math.sin(2*PI*x/2048*9)-5*Math.abs(Math.sin(2*PI*x/2048*41))-3*Math.sin(2*PI*x/2048*97));g.lineTo(2048,512);g.fill();
  for(let k=0;k<26;k++){const x=k*78.77+((k*37)%50),h=14+((k*53)%20);g.beginPath();g.ellipse(x,H+4-h*0.6,8+h*0.3,h,0,0,2*PI);g.fill();}
  g.fillStyle=o.haze;g.fillRect(0,H-10,2048,24);
  const fld=g.createLinearGradient(0,H+8,0,512);fld.addColorStop(0,o.f0);fld.addColorStop(1,o.f1);g.fillStyle=fld;g.fillRect(0,H+8,2048,512-H-8);
  const reed=(x,y,len,lean,stem,plume)=>{const tx=x+lean,ty=y-len;g.strokeStyle=stem;g.lineWidth=Math.max(1,len/40);g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+lean*0.3,y-len*0.6,tx,ty);g.stroke();
    // feathery plume: fan of short strokes drooping with the wind
    g.strokeStyle=plume;g.lineWidth=Math.max(1,len/70);const pl=len*0.28;
    for(let k=0;k<7;k++){const a=-1.25+k*0.12+lean*0.004;g.beginPath();g.moveTo(tx,ty);g.quadraticCurveTo(tx+Math.cos(a)*pl*0.5+pl*0.2,ty+Math.sin(a)*pl*0.5,tx+Math.cos(a+0.5)*pl+pl*0.35,ty+Math.sin(a+0.5)*pl*0.6+pl*0.3);g.stroke();}};
  const N=7000;
  for(let i=0;i<N;i++){const d=Math.pow(i/N,1.6),y=H+12+d*(512-H-12)+Math.random()*6,len=5+d*72*(0.75+Math.random()*0.5),x=Math.random()*2048,lean=len*(0.18+Math.random()*0.12);
    const stem=o.stems[i%o.stems.length],plume=o.plumes[i%o.plumes.length];
    reed(x,y,len,lean,stem,plume);if(x<140)reed(x+2048,y,len,lean,stem,plume);if(x>1908)reed(x-2048,y,len,lean,stem,plume);}
}
const sceneryTex=canvasTex(2048,512,(g)=>paintReeds(g,{sky0:'#b9c6cc',sky1:'#e4e3da',hill:'#a9b0aa',trees:'#5f6a58',haze:'rgba(220,222,214,.35)',f0:'#b8a885',f1:'#a38d66',
  stems:['#8f7a55','#a08a63','#7d6a4a','#b39c72'],plumes:['#efe7d4','#e2d6bb','#f6f1e4','#d8c9a8','#cbb994']}));
sceneryTex.wrapS=THREE.RepeatWrapping;
const sceneR=sceneryTex, sceneL=sceneryTex.clone();sceneL.needsUpdate=true;sceneL.wrapS=THREE.RepeatWrapping;sceneL.offset.x=0.37;
const scnGeo=new THREE.PlaneGeometry(20,5.2);
const pR=new THREE.Mesh(scnGeo,new THREE.MeshBasicMaterial({map:sceneR}));pR.position.set(2.3,1.3,0);pR.rotation.y=-PI/2;scene.add(pR);
const pL=new THREE.Mesh(scnGeo,new THREE.MeshBasicMaterial({map:sceneL}));pL.position.set(-2.3,1.3,0);pL.rotation.y=PI/2;scene.add(pL);

/* road views for windshield and rear window */
function drawRoad(g,w,h,off,toward){
  const hz=h*0.45;const sky=g.createLinearGradient(0,0,0,hz);sky.addColorStop(0,'#b9c6cc');sky.addColorStop(1,'#e4e3da');g.fillStyle=sky;g.fillRect(0,0,w,hz);
  g.fillStyle='#5f6a58';g.beginPath();g.moveTo(0,hz);for(let x=0;x<=w;x+=8)g.lineTo(x,hz-14-10*Math.sin(x*0.03)-6*Math.sin(x*0.09));g.lineTo(w,hz);g.fill();
  g.fillStyle='#b5a27c';g.fillRect(0,hz,w,h-hz);g.fillStyle='rgba(240,232,212,.5)';for(let i=0;i<220;i++){const yy=hz+Math.pow(((i*73)%100)/100,0.7)*(h-hz),xx=(i*97)%w;g.fillRect(xx,yy-2-(yy-hz)*0.08,1,2+(yy-hz)*0.08);}
  g.fillStyle='#55585e';g.beginPath();g.moveTo(w*0.47,hz);g.lineTo(w*0.53,hz);g.lineTo(w*1.05,h);g.lineTo(-w*0.05,h);g.fill();
  g.fillStyle='#f3e9a0';
  for(let k=0;k<8;k++){let p=((k+(toward?off:-off))%8+8)%8/8;const y0=hz+(h-hz)*p*p,y1=hz+(h-hz)*Math.min(1,(p+0.06))**2;const ww=1+3*p;g.fillRect(w/2-ww/2,y0,ww,(y1-y0)*0.6);}
}
const roadF=canvasTex(256,128),roadB=canvasTex(256,128);

/* ---------- bus interior ---------- */
const carpet=canvasTex(64,512,(g)=>{g.fillStyle='#6d1730';g.fillRect(0,0,64,512);g.strokeStyle='#c9973a';g.lineWidth=2;for(let y=0;y<512;y+=32){g.beginPath();g.moveTo(32,y);g.lineTo(52,y+16);g.lineTo(32,y+32);g.lineTo(12,y+16);g.closePath();g.stroke();}g.fillStyle='#c9973a';g.fillRect(0,0,4,512);g.fillRect(60,0,4,512);});
carpet.wrapT=THREE.RepeatWrapping;carpet.repeat.set(1,8);
bus.add(mesh(new THREE.BoxGeometry(W,0.1,LEN),mat(0x3b2c34),0,-0.05,0));
const cp=mesh(new THREE.PlaneGeometry(0.6,LEN),new THREE.MeshPhongMaterial({map:carpet,shininess:4}),0,0.004,0);cp.rotation.x=-PI/2;bus.add(cp);
const wallM=mat(0x8b6676),trimM=mat(0x3d2f3a),purple=mat(0x6b1d6e,{shininess:30}),goldM=mat(0xd8a93a,{shininess:60}),metal=mat(0xbcb6c6,{shininess:90});
const ledMats=[];
for(const s of [-1,1]){
  bus.add(mesh(new THREE.BoxGeometry(0.08,0.86,LEN),wallM,s*1.25,0.43,0));
  bus.add(mesh(new THREE.BoxGeometry(0.08,0.56,LEN),wallM,s*1.25,2.09,0));
  bus.add(mesh(new THREE.BoxGeometry(0.18,0.04,LEN),trimM,s*1.19,0.86,0));
  bus.add(mesh(new THREE.BoxGeometry(0.07,0.15,LEN),purple,s*1.18,1.77,0));
  bus.add(mesh(new THREE.BoxGeometry(0.075,0.03,LEN),goldM,s*1.18,1.69,0));
  bus.add(mesh(new THREE.BoxGeometry(0.5,0.07,LEN),metal,s*0.99,2.0,0));
  bus.add(mesh(new THREE.BoxGeometry(0.04,0.16,LEN),metal,s*0.75,1.98,0));
  const lm=new THREE.MeshBasicMaterial({color:0xff3d8b});ledMats.push(lm);
  bus.add(mesh(new THREE.BoxGeometry(0.025,0.025,LEN),lm,s*0.74,1.895,0));
}
const posts=[],curtains=[],ties=[];
for(let z=L0+0.8;z<L1;z+=1.6)for(const s of [-1,1]){posts.push([s*1.235,1.32,z]);curtains.push([s*1.17,1.33,z+0.11]);ties.push([s*1.17,1.2,z+0.11]);}
inst(new THREE.BoxGeometry(0.1,0.94,0.12),mat(0x2a252c),posts);
inst(new THREE.CylinderGeometry(0.055,0.085,0.8,8),purple,curtains);
inst(new THREE.CylinderGeometry(0.075,0.075,0.035,8),goldM,ties);
// ceiling
bus.add(mesh(new THREE.BoxGeometry(W,0.06,LEN),mat(0x2a1a33),0,2.38,0));
bus.add(mesh(new THREE.BoxGeometry(1.0,0.05,LEN),mat(0x3a2347,{shininess:80,specular:0x664477}),0,2.33,0));
const ledC=new THREE.MeshBasicMaterial({color:0x2fe0cf});ledMats.push(ledC);
for(const s of [-1,1])bus.add(mesh(new THREE.BoxGeometry(0.02,0.02,LEN),ledC,s*0.5,2.3,0));
// star ceiling
{const n=160,pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=(rnd()-0.5)*0.9;pos[i*3+1]=2.302;pos[i*3+2]=L0+rnd()*LEN;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));var stars=new THREE.Points(g,new THREE.PointsMaterial({color:0xfff6c8,size:0.022,transparent:true}));bus.add(stars);}
// bus exterior (seen in the side-view game)
{const body=mat(0xf1eee9,{shininess:50}),stripe=mat(0xd2246a,{shininess:40}),tire=mat(0x1b1b1d),rim=mat(0x9a9aa2,{shininess:80});
 for(const s of [-1,1]){bus.add(mesh(new THREE.BoxGeometry(0.04,1.31,LEN+0.1),body,s*1.31,0.205,0));bus.add(mesh(new THREE.BoxGeometry(0.04,0.64,LEN+0.1),body,s*1.31,2.13,0));
  bus.add(mesh(new THREE.BoxGeometry(0.02,0.1,LEN),stripe,s*1.335,0.55,0));bus.add(mesh(new THREE.BoxGeometry(0.02,0.05,LEN),stripe,s*1.335,0.4,0));
  for(const z of [-4.6,3.4,4.7]){const w=mesh(new THREE.CylinderGeometry(0.45,0.45,0.3,20),tire,s*1.2,-0.05,z);w.rotation.z=PI/2;bus.add(w);const h=mesh(new THREE.CylinderGeometry(0.25,0.25,0.31,16),rim,s*1.2,-0.05,z);h.rotation.z=PI/2;bus.add(h);}}
 bus.add(mesh(new THREE.BoxGeometry(2.66,0.08,LEN+0.1),body,0,2.45,0));
 bus.add(mesh(new THREE.BoxGeometry(2.5,0.35,LEN),mat(0x2a2a2e),0,-0.27,0));}
// end walls
bus.add(mesh(new THREE.BoxGeometry(W,2.4,0.1),wallM,0,1.2,L1));
bus.add(mesh(new THREE.BoxGeometry(W,2.4,0.1),wallM,0,1.2,L0));
const rearWin=mesh(new THREE.PlaneGeometry(2.2,1.3),new THREE.MeshBasicMaterial({map:roadB}),0,1.5,L1-0.055);rearWin.rotation.y=PI;bus.add(rearWin);
/* sunset (역광) layers, faded in by the mini-game */
const sunsetMats=[];
const sunsetScn=canvasTex(2048,512,(g)=>paintReeds(g,{sun:true,sky0:'#ffd59a',sky1:'#ffb45e',hill:'#c9784a',trees:'#3a2014',haze:'rgba(255,190,120,.35)',f0:'#6a3c1c',f1:'#2a160c',
  stems:['#3a200f','#4a2a14','#2c170b'],plumes:['#ffd88a','#ffc366','#ffe6b0','#f0a650','#ffcf7a']}));
sunsetScn.wrapS=THREE.RepeatWrapping;const sunsetL=sunsetScn.clone();sunsetL.needsUpdate=true;sunsetL.wrapS=THREE.RepeatWrapping;sunsetL.offset.x=0.37;
const sunsetPlanes=[];
for(const [tx,x,ry] of [[sunsetScn,2.25,-PI/2],[sunsetL,-2.25,PI/2]]){const m=new THREE.MeshBasicMaterial({map:tx,transparent:true,opacity:0,depthWrite:false});sunsetMats.push(m);const p=new THREE.Mesh(scnGeo,m);p.position.set(x,1.3,0);p.rotation.y=ry;scene.add(p);sunsetPlanes.push(p);}
/* outside-the-bus world for the side view */
const backdropTex=canvasTex(512,512,(g)=>{const gr=g.createLinearGradient(0,0,0,512);gr.addColorStop(0,'#ff8d4a');gr.addColorStop(0.5,'#ffdca0');gr.addColorStop(0.56,'#ffe9bb');gr.addColorStop(0.7,'#ffc070');gr.addColorStop(1,'#c45a2a');g.fillStyle=gr;g.fillRect(0,0,512,512);
  const s=g.createRadialGradient(256,318,4,256,318,150);s.addColorStop(0,'rgba(255,255,245,1)');s.addColorStop(0.2,'rgba(255,240,200,.9)');s.addColorStop(1,'rgba(255,200,120,0)');g.fillStyle=s;g.fillRect(0,0,512,512);});
const backdropMat=new THREE.MeshBasicMaterial({map:backdropTex,transparent:true,opacity:0,depthWrite:false});
const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(80,30),backdropMat);backdrop.position.set(9,5,0);backdrop.rotation.y=-PI/2;scene.add(backdrop);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshPhongMaterial({color:0xa8936c}));ground.rotation.x=-PI/2;ground.position.y=-0.5;scene.add(ground);
const skyDay=new THREE.Color(0xd2d8d6),skySet=new THREE.Color(0xffc98a);
const sunsetRear=canvasTex(512,256,(g)=>{const sky=g.createLinearGradient(0,0,0,170);sky.addColorStop(0,'#ffd99a');sky.addColorStop(1,'#ff9a45');g.fillStyle=sky;g.fillRect(0,0,512,256);
  const glow=g.createRadialGradient(256,140,10,256,140,220);glow.addColorStop(0,'rgba(255,255,240,1)');glow.addColorStop(0.18,'rgba(255,240,190,.95)');glow.addColorStop(1,'rgba(255,170,80,0)');g.fillStyle=glow;g.fillRect(0,0,512,256);
  g.fillStyle='#8a3c1a';g.beginPath();g.moveTo(0,256);for(let x=0;x<=512;x+=8)g.lineTo(x,168-12*Math.sin(x*0.02)-6*Math.sin(x*0.07));g.lineTo(512,256);g.fill();g.fillStyle='#2e140a';g.fillRect(0,200,512,56);});
{const m=new THREE.MeshBasicMaterial({map:sunsetRear,transparent:true,opacity:0,depthWrite:false});sunsetMats.push(m);const p=mesh(new THREE.PlaneGeometry(2.2,1.3),m,0,1.5,L1-0.06);p.rotation.y=PI;bus.add(p);}
const glowTex=canvasTex(256,256,(g)=>{const r=g.createRadialGradient(128,128,0,128,128,128);r.addColorStop(0,'rgba(255,250,225,1)');r.addColorStop(0.25,'rgba(255,215,140,.6)');r.addColorStop(1,'rgba(255,140,50,0)');g.fillStyle=r;g.fillRect(0,0,256,256);});
const sunGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,transparent:true,opacity:0,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending}));sunGlow.scale.set(2.6,2.6,1);sunGlow.position.set(0,1.35,L1-0.2);sunGlow.renderOrder=20;bus.add(sunGlow);
bus.add(mesh(new THREE.PlaneGeometry(2.2,0.9),new THREE.MeshBasicMaterial({map:roadF}),0,1.25,L0+0.055));
// karaoke TV at front
const tvTex=canvasTex(512,288);
bus.add(mesh(new THREE.BoxGeometry(0.82,0.5,0.07),mat(0x111111),0,1.98,L0+0.75));
const tvMat=new THREE.MeshBasicMaterial({map:tvTex});bus.add(mesh(new THREE.PlaneGeometry(0.76,0.43),tvMat,0,1.98,L0+0.786));
bus.add(mesh(new THREE.BoxGeometry(0.05,0.12,0.05),mat(0x222222),0,2.29,L0+0.75));
// mirror ball
const ball=mesh(new THREE.IcosahedronGeometry(0.15,1),new THREE.MeshPhongMaterial({color:0xdde3ee,shininess:120,specular:0xffffff,flatShading:true,emissive:0x222233}),0,2.06,0.6);bus.add(ball);
bus.add(mesh(new THREE.CylinderGeometry(0.005,0.005,0.15,4),mat(0x888888),0,2.24,0.6));

/* seats (instanced) */
const SEATX=[-0.97,-0.52,0.52,0.97],ROWS=[];for(let r=0;r<11;r++)ROWS.push(-5+r);
const cush=[],back=[],cover=[],arm=[],leg=[];
for(const z of ROWS)for(const x of SEATX){cush.push([x,0.39,z]);back.push([x,0.8,z+0.22,0.12]);cover.push([x,1.08,z+0.255,0.12]);arm.push([x+(x<0?0.215:-0.215)*(Math.abs(x)<0.7?-1:1),0.58,z+0.02]);leg.push([x,0.17,z]);}
inst(new THREE.BoxGeometry(0.43,0.13,0.46),mat(0xb25c76,{shininess:6}),cush);
inst(new THREE.BoxGeometry(0.43,0.78,0.11),mat(0x9c4a63,{shininess:6}),back);
inst(new THREE.BoxGeometry(0.37,0.2,0.125),mat(0xf3eee6,{shininess:4}),cover);
inst(new THREE.BoxGeometry(0.05,0.05,0.38),mat(0x5a3a48),arm);
inst(new THREE.BoxGeometry(0.3,0.34,0.06),mat(0x4a3540),leg);

/* moving disco lights */
const plights=[0xff3d8b,0x2fe0cf,0xffcf3a].map((c,i)=>{const l=new THREE.PointLight(c,0.8,6,1.6);l.position.set(0,1.9,-4+i*4);bus.add(l);return l;});

/* ---------- ajumma avatars ---------- */
const Gm={
 pelvis:new THREE.CylinderGeometry(0.165,0.175,0.16,14),body:new THREE.CylinderGeometry(0.16,0.185,0.46,16),
 yoke:new THREE.CylinderGeometry(0.168,0.172,0.15,16),shoulder:new THREE.SphereGeometry(0.17,16,8,0,PI*2,0,PI/2),
 zip:new THREE.BoxGeometry(0.018,0.44,0.012),trim:new THREE.BoxGeometry(0.012,0.38,0.03),
 buff:new THREE.CylinderGeometry(0.065,0.082,0.08,12),neck:new THREE.CylinderGeometry(0.045,0.05,0.08,10),
 head:new THREE.SphereGeometry(0.105,20,16),eye:new THREE.SphereGeometry(0.011,8,6),lip:new THREE.BoxGeometry(0.042,0.013,0.01),
 cheek:new THREE.SphereGeometry(0.018,8,6),glasses:new THREE.BoxGeometry(0.165,0.038,0.02),
 cap:new THREE.SphereGeometry(0.114,18,10,0,PI*2,0,1.25),curl:new THREE.SphereGeometry(1,8,6),
 brim:new THREE.CylinderGeometry(0.175,0.175,0.008,20,1,false,PI-1.15,2.3),band:new THREE.TorusGeometry(0.112,0.013,6,24),
 upper:new THREE.CylinderGeometry(0.052,0.046,0.27,10),fore:new THREE.CylinderGeometry(0.045,0.04,0.24,10),cuff:new THREE.CylinderGeometry(0.048,0.048,0.04,10),
 hand:new THREE.SphereGeometry(0.042,10,8),finger:new THREE.CylinderGeometry(0.011,0.011,0.075,6),
 thigh:new THREE.CylinderGeometry(0.075,0.062,0.42,10),shin:new THREE.CylinderGeometry(0.06,0.05,0.4,10),
 boot:new THREE.BoxGeometry(0.1,0.085,0.2),sole:new THREE.BoxGeometry(0.106,0.02,0.21),
 ring:new THREE.TorusGeometry(0.075,0.013,6,20),jingle:new THREE.CylinderGeometry(0.018,0.018,0.012,8)
};
const CURLS=[];{const N=120;for(let i=0;i<N;i++){const y=1-2*(i+0.5)/N,r=Math.sqrt(1-y*y),th=i*2.39996,x=Math.cos(th)*r,z=Math.sin(th)*r;if(y<-0.32)continue;if(z<-0.3&&y<0.5)continue;if(z<-0.05&&y<0.12)continue;CURLS.push([x,y,z]);}}

const JACKETS=[[0xff4f9a,0x6b2fb3],[0x16b8b0,0xf2e14a],[0xff7a1a,0x2b3a8c],[0x9b4dff,0xff6fb5],[0xe8263a,0x222228],[0x29a3ff,0xf4f4f4],[0xb6dc2a,0x2d6b4f],[0xff9fc8,0x5c6cff]];
const HAIRS=[0x1c1513,0x4a2a1a,0x5e1f2c,0x2e2622];
const SKINS=[0xf0c8a8,0xe6b693,0xf3d3b8];

function makeAvatar(o){
  const root=new THREE.Group();
  const jM=new THREE.MeshPhongMaterial({color:o.j1,shininess:45,specular:0x444444}),j2M=new THREE.MeshPhongMaterial({color:o.j2,shininess:45,specular:0x444444});
  const hairM=new THREE.MeshPhongMaterial({color:o.hair,shininess:10}),skin=mat(o.skin),pants=mat(o.pants,{shininess:22}),dark=mat(0x1a1214),boot=mat(o.boot);
  const hips=new THREE.Group();hips.position.y=0.915;root.add(hips);
  hips.add(mesh(Gm.pelvis,pants,0,-0.02,0));
  const torso=new THREE.Group();torso.position.y=0.05;hips.add(torso);
  torso.add(mesh(Gm.body,jM,0,0.23,0));torso.add(mesh(Gm.yoke,j2M,0,0.39,0));
  const sh=mesh(Gm.shoulder,j2M,0,0.46,0);sh.scale.y=0.42;torso.add(sh);
  const zp=mesh(Gm.zip,mat(0xeeeaf0,{shininess:60}),0,0.23,-0.176);zp.rotation.x=0.054;torso.add(zp);
  for(const s of [-1,1])torso.add(mesh(Gm.trim,mat(0xf6f6f6,{shininess:70}),s*0.176,0.21,0));
  torso.add(mesh(Gm.buff,mat(o.scarf),0,0.53,0));torso.add(mesh(Gm.neck,skin,0,0.585,0));
  const head=new THREE.Group();head.position.y=0.68;torso.add(head);
  const hm=mesh(Gm.head,skin);hm.scale.y=1.08;head.add(hm);
  if(o.glasses){head.add(mesh(Gm.glasses,mat(0x141018,{shininess:90}),0,0.018,-0.102));}
  else for(const s of [-1,1])head.add(mesh(Gm.eye,dark,s*0.036,0.016,-0.097));
  for(const s of [-1,1]){const c=mesh(Gm.cheek,mat(0xf0959c),s*0.058,-0.022,-0.083);c.scale.z=0.4;head.add(c);}
  head.add(mesh(Gm.lip,mat(o.lip),0,-0.05,-0.1));
  head.add(mesh(Gm.cap,hairM,0,0.012,0.008));
  const im=new THREE.InstancedMesh(Gm.curl,hairM,CURLS.length);
  CURLS.forEach((d,i)=>{const r=0.112+rnd()*0.028+(d[1]>0.5?0.012:0);tmp.position.set(d[0]*r*1.06,d[1]*r+0.016,d[2]*r+0.01);tmp.rotation.set(0,0,0);const s=0.029+rnd()*0.014;tmp.scale.set(s,s,s);tmp.updateMatrix();im.setMatrixAt(i,tmp.matrix);});
  head.add(im);
  if(o.visor){const vm=mat(o.visor,{shininess:30});const br=mesh(Gm.brim,vm,0,0.035,0);br.rotation.x=-0.16;head.add(br);const bd=mesh(Gm.band,vm,0,0.035,0);bd.rotation.x=PI/2;head.add(bd);}
  const arms=[];
  for(const s of [-1,1]){
    const outer=new THREE.Group();outer.position.set(s*0.2,0.43,0);torso.add(outer);
    const inner=new THREE.Group();outer.add(inner);inner.add(mesh(Gm.upper,jM,0,-0.13,0));
    const elbow=new THREE.Group();elbow.position.y=-0.27;inner.add(elbow);
    elbow.add(mesh(Gm.fore,jM,0,-0.11,0));elbow.add(mesh(Gm.cuff,j2M,0,-0.22,0));
    const hand=new THREE.Group();hand.position.y=-0.27;elbow.add(hand);hand.add(mesh(Gm.hand,skin));
    const finger=mesh(Gm.finger,skin,0,-0.068,-0.012);hand.add(finger);
    arms.push({outer,inner,elbow,hand,finger});
  }
  const legs=[];
  for(const s of [-1,1]){
    const hip=new THREE.Group();hip.position.set(s*0.085,-0.04,0);hips.add(hip);hip.add(mesh(Gm.thigh,pants,0,-0.21,0));
    const knee=new THREE.Group();knee.position.y=-0.42;hip.add(knee);knee.add(mesh(Gm.shin,pants,0,-0.2,0));
    knee.add(mesh(Gm.boot,boot,0,-0.405,-0.035));knee.add(mesh(Gm.sole,dark,0,-0.445,-0.035));legs.push({hip,knee});
  }
  if(o.tamb){const t=new THREE.Group();t.add(mesh(Gm.ring,mat(0xd23a3a,{shininess:40})));for(let k=0;k<5;k++){const a=k/5*2*PI,j=mesh(Gm.jingle,mat(0xe8d07a,{shininess:120}),Math.cos(a)*0.075,Math.sin(a)*0.075,0);j.rotation.x=PI/2;t.add(j);}t.position.set(0,-0.09,0);t.rotation.y=PI/2;arms[1].hand.add(t);}
  return {root,hips,torso,head,arms,legs,jM,j2M,hairM};
}

/* pose: [0 hipY,1 hipX,2 hipYaw,3 hipRoll,4 lean,5 twist,6 roll,7 nod,8 headYaw,9 tilt, 10-13 L arm(x,y,z,e), 14-17 R arm, 18-19 L leg(t,k), 20-21 R leg] */
function computePose(A,o){
  const b=o.b,en=o.en,dip=0.5+0.5*Math.cos(2*PI*b),sw=Math.sin(PI*b);A.fill(0);
  const setArm=(i,x,y,z,e)=>{const k=10+i*4;A[k]=x;A[k+1]=y;A[k+2]=z;A[k+3]=e;};
  if(o.walking){const s=Math.sin(o.walkPh);A[0]=0.915+0.015*Math.abs(Math.cos(o.walkPh));A[18]=0.45*s;A[19]=-0.5*Math.max(0,-s)-0.1;A[20]=-0.45*s;A[21]=-0.5*Math.max(0,s)-0.1;setArm(0,-0.35*s,0,-0.12,0.3);setArm(1,0.35*s,0,0.12,0.3);return;}
  if(o.seated){A[0]=0.53+0.012*dip*en;A[18]=A[20]=PI/2;A[19]=A[21]=-PI/2;A[4]=0.06;}
  else{A[0]=0.915-0.045*dip*en;A[18]=A[20]=0.26*dip*en;A[19]=A[21]=-0.52*dip*en;}
  switch(o.move){
    case 0:{const h=o.hand,c=Math.cos(PI*b),up=0.5+0.5*Math.sign(c)*Math.pow(Math.abs(c),0.4),pi=h>0?1:0;
      setArm(pi,0.45*(1-up),0,h*(-0.3+2.95*up),0.1+0.35*(1-up));setArm(1-pi,-0.15,0,-h*0.6,1.4);
      A[6]=-h*0.13*up*en;A[1]=h*0.035*(up-0.5)*en;A[2]=h*0.09*sw;A[9]=h*0.12*up;A[7]=0.15*up;break;}
    case 1:{const cl=Math.pow(Math.abs(Math.cos(PI*b)),3),y=0.62*cl-0.22;
      setArm(0,1.15,-y,-0.12,0.7);setArm(1,1.15,y,0.12,0.7);
      A[6]=0.13*sw*en;A[1]=0.045*sw*en;A[9]=-0.1*sw;A[2]=0.08*sw;A[7]=-0.06*dip;break;}
    case 3:{const w=0.4*Math.sin(PI*b)*en;
      setArm(0,0.15,0,-2.7+w,0.3);setArm(1,0.15,0,2.7+w,0.3);A[6]=w*0.3;A[1]=-w*0.08;A[7]=0.15;A[9]=w*0.25;break;}
    default:{setArm(0,0.6,0,-0.1,0.9);setArm(1,0.6,0,0.1,0.9);A[6]=0.04*sw;A[7]=-0.03*dip;}
  }
  if(o.seated){A[1]=0;A[2]*=0.4;A[6]*=0.6;}
}
function applyPose(av,A){
  av.hips.position.y=A[0];av.hips.position.x=A[1];av.hips.rotation.set(0,A[2],A[3]);av.torso.rotation.set(A[4],A[5],A[6]);av.head.rotation.set(A[7],A[8],A[9]);
  for(let i=0;i<2;i++){const r=av.arms[i],k=10+i*4;r.inner.rotation.x=A[k];r.outer.rotation.set(0,A[k+1],A[k+2]);r.elbow.rotation.x=A[k+3];}
  for(let i=0;i<2;i++){const l=av.legs[i];l.hip.rotation.x=A[18+i*2];l.knee.rotation.x=A[19+i*2];}
}

const people=[];
function spawn(o,ent){const av=makeAvatar(o);bus.add(av.root);const e=Object.assign({av,rotY:0,curRot:0,lag:rnd()*0.06,hand:rnd()<0.5?1:-1,cur:new Float32Array(22),tgt:new Float32Array(22),block:-1,path:[],walkPh:0},ent);e.curRot=e.rotY;people.push(e);return e;}
function randOutfit(extra){const j=pick(JACKETS);return Object.assign({j1:j[0],j2:j[1],hair:pick(HAIRS),skin:pick(SKINS),pants:pick([0x26262e,0x3a3440,0x4a3b30,0x2c3242]),boot:pick([0x6b4a33,0x3c3c3c,0x8a5a3a,0x55453a]),scarf:pick([0xff5a8a,0x2fc7ff,0xffcf3a,0x9b5cff,0xff8a3d,0x40c47e]),lip:pick([0xd2213f,0xe2486b,0xc1304a]),glasses:rnd()<0.25,visor:rnd()<0.4?pick([0xffffff,0xff5fa0,0x1f2b55,0xf2e14a]):0},extra||{});}

// aisle dancers
[[-1.6,0],[1.9,0.3]].forEach(([z,r],i)=>spawn(randOutfit({tamb:i===1}),{x:(rnd()-0.5)*0.12,z,rotY:r,seated:false,move:[0,3][i]}));
// seated passengers
[[0.52,1]].forEach(([x,z])=>spawn(randOutfit({visor:0xffffff}),{x,z:z+0.05,rotY:0,seated:true,move:1}));
// player
const PSEAT=[-0.52,-3],PDANCE=[0,-2.7];
const player=spawn({j1:0xff4f9a,j2:0x6b2fb3,hair:0x1c1513,skin:0xf0c8a8,pants:0x26262e,boot:0x6b4a33,scarf:0xffcf3a,lip:0xd2213f,glasses:false,visor:0xffffff},{x:PDANCE[0],z:PDANCE[1],rotY:0,seated:false,move:0,hand:1,lag:0,isPlayer:true,mode:'dance'});
function makeLabel(text,bg,fg,wd){const w=wd||128;const t=canvasTex(w*2,96,(g)=>{g.fillStyle=bg;g.beginPath();g.roundRect?g.roundRect(8,10,w*2-16,72,36):g.rect(8,10,w*2-16,72);g.fill();g.fillStyle=fg;g.font='800 40px "Gothic A1",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,w,48);});
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true}));sp.scale.set(0.3*w/64,0.3*96/128*1,1);sp.scale.set(w/256*0.6,0.225,1);sp.position.y=0.34;sp.renderOrder=30;return sp;}
const meLabel=makeLabel('나','#ff3d8b','#fff');player.av.head.add(meLabel);

/* ---------- 기사님: muscular 20-something driver, shirtless ---------- */
const DRV={x:-0.72,z:-6.2};
// cockpit: dashboard, gauges, driver seat, steering wheel
bus.add(mesh(new THREE.BoxGeometry(2.4,0.26,0.5),mat(0x26232a,{shininess:30}),0,0.86,L0+0.3));
bus.add(mesh(new THREE.BoxGeometry(2.4,0.04,0.55),mat(0x3a3640),0,1.0,L0+0.32));
for(const gx of [-0.86,-0.6]){const g=mesh(new THREE.CircleGeometry(0.06,20),new THREE.MeshBasicMaterial({color:0x7ff7ea}),DRV.x+gx+0.72,1.0,L0+0.6);g.rotation.x=-PI/2+0.35;bus.add(g);}
bus.add(mesh(new THREE.BoxGeometry(0.45,0.13,0.46),mat(0x1d1b20,{shininess:20}),DRV.x,0.42,DRV.z));
const dSeatBack=mesh(new THREE.BoxGeometry(0.45,0.8,0.11),mat(0x1d1b20,{shininess:20}),DRV.x,0.85,DRV.z+0.24);dSeatBack.rotation.x=0.1;bus.add(dSeatBack);
bus.add(mesh(new THREE.BoxGeometry(0.06,0.3,0.06),mat(0x2a2a2e),DRV.x,0.2,DRV.z));
const wheelPivot=new THREE.Group();wheelPivot.position.set(DRV.x,1.02,DRV.z-0.43);wheelPivot.rotation.x=-0.95;bus.add(wheelPivot);
const wheel=new THREE.Group();wheelPivot.add(wheel);
wheel.add(mesh(new THREE.TorusGeometry(0.17,0.02,8,32),mat(0x151515,{shininess:40})));
for(let k=0;k<3;k++){const sp=mesh(new THREE.BoxGeometry(0.15,0.025,0.02),mat(0x2e2e33),0,0,0);sp.rotation.z=k*2*PI/3+PI/2;sp.position.set(Math.cos(k*2*PI/3+PI/2)*0.075,Math.sin(k*2*PI/3+PI/2)*0.075,0);wheel.add(sp);}
{const hub=mesh(new THREE.CylinderGeometry(0.04,0.04,0.03,12),mat(0xd2246a));hub.rotation.x=PI/2;wheel.add(hub);}
const col=mesh(new THREE.CylinderGeometry(0.025,0.03,0.4,8),mat(0x2a2a2e),DRV.x,0.92,DRV.z-0.6);col.rotation.x=-0.6;bus.add(col);
function makeDriver(){
  const skin=new THREE.MeshPhongMaterial({color:0xd29a72,shininess:60,specular:0x55372a}),jeans=mat(0x2c4a78,{shininess:15}),hairM=mat(0x16110f,{shininess:20}),dark=mat(0x121212,{shininess:90});
  const root=new THREE.Group();root.position.set(DRV.x,0,DRV.z);
  const hips=new THREE.Group();hips.position.y=0.55;root.add(hips);
  hips.add(mesh(new THREE.CylinderGeometry(0.15,0.16,0.16,14),jeans,0,-0.02,0));hips.add(mesh(new THREE.CylinderGeometry(0.152,0.152,0.04,14),mat(0x3a2414),0,0.06,0));
  const torso=new THREE.Group();torso.position.y=0.06;hips.add(torso);
  const ab=mesh(new THREE.CylinderGeometry(0.17,0.15,0.24,16),skin,0,0.12,0);ab.scale.z=0.8;torso.add(ab);
  const chest=mesh(new THREE.CylinderGeometry(0.255,0.17,0.27,16),skin,0,0.37,0);chest.scale.z=0.72;torso.add(chest);
  for(const s of [-1,1]){const pec=mesh(new THREE.SphereGeometry(0.105,14,10),skin,s*0.085,0.39,-0.105);pec.scale.set(1,0.68,0.45);torso.add(pec);
    const lat=mesh(new THREE.SphereGeometry(0.09,10,8),skin,s*0.17,0.3,0.01);lat.scale.set(0.6,1.3,0.9);torso.add(lat);
    for(let r=0;r<3;r++){const a=mesh(new THREE.SphereGeometry(0.036,10,8),skin,s*0.042,0.04+r*0.075,-0.118);a.scale.set(1,0.85,0.45);torso.add(a);}
    torso.add(mesh(new THREE.SphereGeometry(0.092,12,10),skin,s*0.255,0.47,0));}
  torso.add(mesh(new THREE.CylinderGeometry(0.07,0.12,0.12,12),skin,0,0.56,0.01));
  const head=new THREE.Group();head.position.y=0.71;torso.add(head);
  const hd=mesh(new THREE.SphereGeometry(0.1,18,14),skin);hd.scale.set(0.95,1.1,1);head.add(hd);
  head.add(mesh(new THREE.SphereGeometry(0.104,16,10,0,PI*2,0,1.15),hairM,0,0.022,0.006));
  for(const s of [-1,1]){head.add(mesh(new THREE.BoxGeometry(0.04,0.01,0.01),hairM,s*0.036,0.045,-0.094));head.add(mesh(new THREE.SphereGeometry(0.012,8,6),skin,s*0.098,0,0));}
  const shades=mesh(new THREE.BoxGeometry(0.15,0.035,0.02),dark,0,0.016,-0.1);head.add(shades);
  head.add(mesh(new THREE.BoxGeometry(0.045,0.01,0.01),mat(0x7a3a2a),0,-0.052,-0.096));
  const jaw=mesh(new THREE.SphereGeometry(0.075,12,8),skin,0,-0.05,-0.025);jaw.scale.set(1.05,0.7,0.95);head.add(jaw);
  const arms=[];
  for(const s of [-1,1]){const outer=new THREE.Group();outer.position.set(s*0.27,0.44,0);torso.add(outer);const inner=new THREE.Group();outer.add(inner);
    inner.add(mesh(new THREE.CylinderGeometry(0.072,0.062,0.28,12),skin,0,-0.14,0));
    const bi=mesh(new THREE.SphereGeometry(0.075,12,10),skin,0,-0.13,-0.03);bi.scale.set(0.95,1.35,1);inner.add(bi);
    const elbow=new THREE.Group();elbow.position.y=-0.28;inner.add(elbow);
    elbow.add(mesh(new THREE.CylinderGeometry(0.062,0.047,0.25,12),skin,0,-0.12,0));
    const fist=mesh(new THREE.SphereGeometry(0.05,10,8),skin,0,-0.27,0);elbow.add(fist);
    arms.push({outer,inner,elbow});}
  for(const s of [-1,1]){const hip=new THREE.Group();hip.position.set(s*0.095,-0.04,0);hip.rotation.x=PI/2;hips.add(hip);
    hip.add(mesh(new THREE.CylinderGeometry(0.088,0.07,0.42,12),jeans,0,-0.21,0));
    const knee=new THREE.Group();knee.position.y=-0.42;knee.rotation.x=-PI/2;hip.add(knee);
    knee.add(mesh(new THREE.CylinderGeometry(0.066,0.055,0.4,10),jeans,0,-0.2,0));knee.add(mesh(new THREE.BoxGeometry(0.11,0.09,0.22),mat(0xf2f2f2,{shininess:30}),0,-0.42,-0.04));}
  const tag=makeLabel('기사님','#2fe0cf','#06201d',160);head.add(tag);tag.position.y=0.3;
  head.scale.setScalar(1.15);bus.add(root);return {root,hips,torso,head,arms};
}
const driver=makeDriver();
function updateDriver(b,clock,party){
  const dip=0.5+0.5*Math.cos(2*PI*b),steer=0.12*Math.sin(clock*0.45)+0.04*Math.sin(clock*1.6);
  wheel.rotation.z=-steer*3;driver.head.rotation.set(-0.1*dip,0.08*Math.sin(clock*0.3),0.05*Math.sin(PI*b));driver.torso.rotation.set(0.04,0,0.04*Math.sin(PI*b)+steer*0.2);
  for(let i=0;i<2;i++){const s=i?1:-1,a=driver.arms[i];
    if(party&&i===1){a.outer.rotation.set(0,0,2.55+0.15*dip);a.inner.rotation.x=0.15;a.elbow.rotation.x=0.25+0.9*dip;}
    else{a.outer.rotation.set(0,s*0.22,-s*0.05+steer*0.5);a.inner.rotation.x=1.0;a.elbow.rotation.x=1.2;}}
}

/* ---------- confetti ---------- */
const CN=500,cPos=new Float32Array(CN*3),cVel=new Float32Array(CN*3),cCol=new Float32Array(CN*3);let confT=0;
{const pal=[[1,.24,.55],[.18,.88,.81],[1,.81,.23],[.6,.36,1],[1,1,1]];for(let i=0;i<CN;i++){const c=pal[i%5];cCol.set(c,i*3);cPos[i*3+1]=-10;}}
const cGeo=new THREE.BufferGeometry();cGeo.setAttribute('position',new THREE.BufferAttribute(cPos,3));cGeo.setAttribute('color',new THREE.BufferAttribute(cCol,3));
const confetti=new THREE.Points(cGeo,new THREE.PointsMaterial({size:0.04,vertexColors:true}));bus.add(confetti);
function burst(){for(let i=0;i<CN;i++){cPos[i*3]=(Math.random()-0.5)*1.6;cPos[i*3+1]=2.2;cPos[i*3+2]=-4+Math.random()*8;cVel[i*3]=(Math.random()-0.5)*1.2;cVel[i*3+1]=Math.random()*0.8;cVel[i*3+2]=(Math.random()-0.5)*1.2;}confT=6;}

/* ---------- EDM engine (Web Audio) ---------- */
let delayNode=null,ctx=null,master,synthBus,drumBus,duck,leadBus,analyser,noiseBuf,fft;
let musicOn=false,started=false,t0=0,nextT=0,stepN=0,timer=null,vol=0.7;
const mtof=m=>440*Math.pow(2,(m-69)/12);
const CH=[[57,60,64],[53,57,60],[60,64,67],[55,59,62]],BASS=[45,41,48,43];
const LEAD=[[76,0,76,74,72,0,69,0,72,0,74,0,76,0,0,0],[77,0,76,74,72,0,74,0,72,0,69,0,72,0,0,0],[76,0,79,0,76,0,74,72,74,0,76,0,72,0,0,0],[74,0,74,76,79,0,76,74,71,0,74,0,79,0,81,0]];
function initAudio(){
  ctx=new (window.AudioContext||window.webkitAudioContext)();
  master=ctx.createGain();master.gain.value=vol;const comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;
  analyser=ctx.createAnalyser();analyser.fftSize=128;fft=new Uint8Array(analyser.frequencyBinCount);
  master.connect(comp).connect(analyser).connect(ctx.destination);
  drumBus=ctx.createGain();drumBus.gain.value=0.9;drumBus.connect(master);
  duck=ctx.createGain();duck.connect(master);synthBus=ctx.createGain();synthBus.gain.value=0.8;synthBus.connect(duck);
  leadBus=ctx.createGain();leadBus.connect(synthBus);const dl=ctx.createDelay(1);dl.delayTime.value=SPB*0.75;delayNode=dl;const fb=ctx.createGain();fb.gain.value=0.32;const dlo=ctx.createGain();dlo.gain.value=0.35;leadBus.connect(dl);dl.connect(fb).connect(dl);dl.connect(dlo).connect(synthBus);
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
}
function kick(t){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(170,t);o.frequency.exponentialRampToValueAtTime(46,t+0.12);g.gain.setValueAtTime(1,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.42);o.connect(g).connect(drumBus);o.start(t);o.stop(t+0.45);
  duck.gain.cancelScheduledValues(t);duck.gain.setValueAtTime(0.3,t);duck.gain.linearRampToValueAtTime(1,t+0.22);}
function noiseHit(t,type,f,q,peak,dec){const s=ctx.createBufferSource();s.buffer=noiseBuf;const fl=ctx.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ctx.createGain();g.gain.setValueAtTime(peak,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dec);s.connect(fl).connect(g).connect(drumBus);s.start(t,Math.random()*1.5);s.stop(t+dec+0.02);}
const clap=t=>{noiseHit(t,'bandpass',1400,0.9,0.55,0.16);noiseHit(t+0.014,'bandpass',1200,0.9,0.4,0.12);};
const hat=(t,open,v)=>noiseHit(t,'highpass',8000,0.6,v||(open?0.16:0.07),open?0.15:0.04);
const snare=(t,v)=>noiseHit(t,'bandpass',2100,0.7,v,0.12);
const crash=t=>{noiseHit(t,'highpass',5200,0.3,0.4,1.8);noiseHit(t,'bandpass',3200,0.5,0.25,0.9);};
function pop(t){noiseHit(t,'bandpass',700+Math.random()*700,1.4,0.55,0.09);for(let k=0;k<5;k++)noiseHit(t+0.08+Math.random()*0.5,'highpass',7000,0.5,0.06+Math.random()*0.06,0.05);}
function hornBlast(t,d,bend){for(const m of [69,73,76])for(const dt of [-8,8]){const o=ctx.createOscillator();o.type='sawtooth';o.detune.value=dt;
  o.frequency.setValueAtTime(mtof(m-1),t);o.frequency.linearRampToValueAtTime(mtof(m),t+0.04);if(bend)o.frequency.linearRampToValueAtTime(mtof(m-3),t+d);
  const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=2600;const g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.05,t+0.02);g.gain.setValueAtTime(0.05,t+d-0.03);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.connect(f).connect(g).connect(drumBus);o.start(t);o.stop(t+d+0.02);}}
function horn(t){hornBlast(t,0.12);hornBlast(t+0.17,0.12);hornBlast(t+0.34,0.12);hornBlast(t+0.56,0.85,true);}

/* ---------- 흥 폭발: lasers + fireworks ---------- */
const beamGeo=new THREE.BoxGeometry(0.014,0.014,1);beamGeo.translate(0,0,0.5);
const beams=[],FWD=new THREE.Vector3(0,0,1),bDir=new THREE.Vector3();
for(const [ez,dir] of [[L0+0.95,1],[L1-0.4,-1]]){
  bus.add(mesh(new THREE.BoxGeometry(0.9,0.08,0.1),mat(0x1a1a20,{shininess:80}),0,2.22,ez));
  for(let i=0;i<7;i++){const m=new THREE.MeshBasicMaterial({color:0xff0000,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    const b=new THREE.Mesh(beamGeo,m);b.position.set((i-3)*0.12,2.17,ez+dir*0.06);b.userData={i,dir};b.visible=false;bus.add(b);beams.push(b);}}
function updateLasers(lv,t,hue){for(const b of beams){const {i,dir}=b.userData;b.visible=lv>0.01;if(!b.visible)continue;
  const sw=Math.sin(t*(1.3+i*0.17)+i*0.9+(dir>0?0:2.1));
  bDir.set(sw*1.2-b.position.x,0.2+0.95*Math.abs(Math.sin(t*0.9+i*1.3))-b.position.y,dir*6).normalize();
  b.quaternion.setFromUnitVectors(FWD,bDir);
  let L=12;if(Math.abs(bDir.x)>1e-3)L=Math.min(L,(Math.sign(bDir.x)*1.22-b.position.x)/bDir.x);if(bDir.y<0)L=Math.min(L,-b.position.y/bDir.y);
  b.scale.z=Math.max(0.1,L);b.material.color.setHSL((hue+i/7+(dir>0?0:0.5))%1,1,0.55);b.material.opacity=lv*0.85;}}
const FN=1600,fPos=new Float32Array(FN*3),fVel=new Float32Array(FN*3),fCol=new Float32Array(FN*3),fBase=new Float32Array(FN*3),fLife=new Float32Array(FN);let fNext=0;
for(let i=0;i<FN;i++)fPos[i*3+1]=-20;
const fGeo=new THREE.BufferGeometry();fGeo.setAttribute('position',new THREE.BufferAttribute(fPos,3));fGeo.setAttribute('color',new THREE.BufferAttribute(fCol,3));
const fwPoints=new THREE.Points(fGeo,new THREE.PointsMaterial({size:0.055,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));fwPoints.frustumCulled=false;bus.add(fwPoints);
const fc=new THREE.Color(),fc2=new THREE.Color();
function firework(x,y,z){fc.setHSL(Math.random(),1,0.6);fc2.setHSL(Math.random(),1,0.7);const n=120,ring=Math.random()<0.35;
  for(let k=0;k<n;k++){const i=fNext;fNext=(fNext+1)%FN;let ux,uy,uz;
    if(ring){const a=k/n*2*PI;ux=Math.cos(a);uy=Math.sin(a);uz=(Math.random()-0.5)*0.2;}
    else{uy=Math.random()*2-1;const r=Math.sqrt(1-uy*uy),a=Math.random()*2*PI;ux=Math.cos(a)*r;uz=Math.sin(a)*r;}
    const sp=1.1+Math.random()*0.9;fPos.set([x,y,z],i*3);fVel.set([ux*sp,uy*sp,uz*sp],i*3);
    const c=k%4===0?{r:1,g:1,b:0.9}:(k%2?fc:fc2);fBase.set([c.r,c.g,c.b],i*3);fLife[i]=0.9+Math.random()*0.4;}
  if(ctx&&musicOn)pop(ctx.currentTime+0.01);}
function updateFireworks(dt){let any=false;for(let i=0;i<FN;i++){if(fLife[i]<=0)continue;any=true;const j=i*3;
  fVel[j+1]-=2.0*dt;fVel[j]*=0.97;fVel[j+1]*=0.97;fVel[j+2]*=0.97;fPos[j]+=fVel[j]*dt;fPos[j+1]+=fVel[j+1]*dt;fPos[j+2]+=fVel[j+2]*dt;
  fLife[i]-=dt*0.75;const l=Math.max(0,fLife[i]),f=Math.pow(l,1.4)*(0.6+0.4*Math.random());
  fCol[j]=fBase[j]*f;fCol[j+1]=fBase[j+1]*f;fCol[j+2]=fBase[j+2]*f;if(fLife[i]<=0)fPos[j+1]=-20;}
  if(any){fGeo.attributes.position.needsUpdate=true;fGeo.attributes.color.needsUpdate=true;}}
function riser(t,dur){const s=ctx.createBufferSource();s.buffer=noiseBuf;s.loop=true;const fl=ctx.createBiquadFilter();fl.type='bandpass';fl.Q.value=2;fl.frequency.setValueAtTime(300,t);fl.frequency.exponentialRampToValueAtTime(7000,t+dur);const g=ctx.createGain();g.gain.setValueAtTime(0.001,t);g.gain.exponentialRampToValueAtTime(0.22,t+dur);g.gain.linearRampToValueAtTime(0,t+dur+0.05);s.connect(fl).connect(g).connect(drumBus);s.start(t);s.stop(t+dur+0.1);}
function bass(t,m,d){const f=mtof(m),o=ctx.createOscillator(),o2=ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;o2.type='square';o2.frequency.value=f/2;const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.Q.value=6;fl.frequency.setValueAtTime(1800,t);fl.frequency.exponentialRampToValueAtTime(220,t+d);const g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.3,t+0.005);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(fl);o2.connect(fl);fl.connect(g).connect(synthBus);for(const x of [o,o2]){x.start(t);x.stop(t+d+0.02);}}
function supersaw(t,notes,d,v,cut,pad){const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=cut;const g=ctx.createGain();const at=pad?Math.min(0.4,d*0.5):0.004;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+at);g.gain.setValueAtTime(v,t+d);g.gain.exponentialRampToValueAtTime(0.0001,t+d+0.18);fl.connect(g).connect(synthBus);
  for(const n of notes)for(const dt of [-14,0,14]){const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=mtof(n);o.detune.value=dt;o.connect(fl);o.start(t);o.stop(t+d+0.2);}}
function lead(t,m,d,v){v=v||0.085;const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=4200;const g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.006);g.gain.exponentialRampToValueAtTime(0.0001,t+d);fl.connect(g).connect(leadBus);
  const o=ctx.createOscillator(),o2=ctx.createOscillator();o.type='square';o2.type='sawtooth';o.frequency.value=mtof(m);o2.frequency.value=mtof(m);o2.detune.value=9;o.connect(fl);o2.connect(fl);for(const x of [o,o2]){x.start(t);x.stop(t+d+0.02);}}
function playStep(n,t){
  const bar=Math.floor(n/16)%16,s=n%16,ch=Math.floor(n/16)%4,sec=bar<4?0:bar<8?1:bar<12?2:3;
  if(sec!==2&&s%4===0)kick(t);
  if(sec===2){if(bar===8&&s===0)riser(t,SPB*16);if(bar===11&&(s%2===0||s>=8))snare(t,0.12+0.45*s/16);if(s%2===0)lead(t,CH[ch][(s/2)%3]+12,SPB*0.3,0.045);if(s===0)supersaw(t,CH[ch],SPB*4,0.035,1200+(bar-8)*700,true);}
  if((sec===1||sec===3)&&(s===4||s===12))clap(t);
  if(sec!==2){if(s%4===2)hat(t,true);else if(sec===3||s%2===0)hat(t,false,0.05);}
  if(sec!==2&&s%4===2)bass(t,BASS[ch],SPB*0.45);
  if(sec===3&&s%4===3)bass(t,BASS[ch]+12,SPB*0.2);
  if((sec===1||sec===3)&&[0,3,6,10,12].includes(s))supersaw(t,CH[ch],SPB*0.33,sec===3?0.06:0.045,sec===3?3600:2100);
  if(sec===0&&s===0)supersaw(t,CH[ch],SPB*3.5,0.03,900,true);
  if(sec===3&&LEAD[ch][s])lead(t,LEAD[ch][s],SPB*0.45);
}
/* ---------- 관광 힙합 (original boom-bap, 92 BPM, swung) ---------- */
let style='edm',crackleGain=null;
const HH_CH=[[57,60,64,67,71],[53,57,60,62,64],[53,57,59,64],[55,59,62,64]],HH_BASS=[45,50,43,48];
const HH_LEAD=[[76,0,0,74,76,0,79,0,76,0,74,0,72,0,0,0],[74,0,0,72,74,0,76,0,72,0,69,0,0,0,0,0],[72,0,72,74,76,0,0,79,81,0,79,0,76,0,0,0],[79,0,76,0,74,0,72,0,74,0,0,0,76,0,0,0]];
function ePiano(t,notes,d,v){for(const n of notes){const f=mtof(n),g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.012);g.gain.exponentialRampToValueAtTime(v*0.35,t+0.35);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  const o=ctx.createOscillator(),o2=ctx.createOscillator(),g2=ctx.createGain();o.type='sine';o.frequency.value=f;o2.type='sine';o2.frequency.value=f*4;g2.gain.setValueAtTime(0.35,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.25);
  o.connect(g);o2.connect(g2).connect(g);g.connect(synthBus);for(const x of [o,o2]){x.start(t);x.stop(t+d+0.05);}}}
let shaper=null;function sat(){if(shaper)return shaper;shaper=ctx.createWaveShaper();const c=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/512-1;c[i]=Math.tanh(1.1*x)/Math.tanh(1.1);}shaper.curve=c;shaper.connect(synthBus);return shaper;}
function bass808(t,m,d){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(mtof(m+12),t);o.frequency.exponentialRampToValueAtTime(mtof(m),t+0.06);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.55,t+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(g).connect(sat());o.start(t);o.stop(t+d+0.05);}
function hhSnare(t,v){noiseHit(t,'bandpass',1800,0.8,v||0.6,0.2);const o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(150,t+0.08);g.gain.setValueAtTime(0.4*(v||0.6),t);g.gain.exponentialRampToValueAtTime(0.001,t+0.12);o.connect(g).connect(drumBus);o.start(t);o.stop(t+0.15);}
function ensureCrackle(){if(crackleGain)return;const len=ctx.sampleRate*3,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++){d[i]=(Math.random()*2-1)*0.02;if(Math.random()<0.0006)d[i]=(Math.random()*2-1)*0.9;}
  const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=1500;crackleGain=ctx.createGain();crackleGain.gain.value=0;src.connect(f).connect(crackleGain).connect(master);src.start();}
function playStepHH(n,t0_){
  const bar=Math.floor(n/16)%16,s=n%16,ch=Math.floor(n/16)%4,sec=bar<4?0:bar<8?1:bar<12?2:3;
  const t=t0_+(s%2?SPB/4*0.22:0);
  if(sec===0){if(s===0)ePiano(t,HH_CH[ch],SPB*3.8,0.05);if(bar>=2&&s%4===0)hat(t,false,0.04);if(bar===3&&s===12)hhSnare(t,0.4);return;}
  if(sec===2){if(bar<10&&s===0)kick(t);if(s===0)ePiano(t,HH_CH[ch],SPB*3.8,0.045);if(s%2===0)hat(t,false,0.035+0.02*(bar-8));
    if(bar===8&&s===0)riser(t,SPB*16);if(bar===11&&(s%2===0||s>=8))hhSnare(t,0.15+0.4*s/16);return;}
  if(s===0||s===7||s===10)kick(t);
  if(s===4||s===12){hhSnare(t);if(sec===3)clap(t);}
  if(s%2===0)hat(t,false,s%4===0?0.07:0.045);
  if(sec===3&&(bar%4===3)&&s>=13)hat(t,false,0.04);
  if(sec===3&&s===14)hat(t,true,0.08);
  if(s===0)bass808(t,HH_BASS[ch],SPB*1.6);if(s===10)bass808(t,HH_BASS[ch],SPB*0.9);if(sec===3&&s===7)bass808(t,HH_BASS[ch]+7,SPB*0.5);
  if(s===0)ePiano(t,HH_CH[ch],SPB*1.9,0.05);if(s===9)ePiano(t,HH_CH[ch],SPB*1.2,0.035);
  if(sec===3){const m=HH_LEAD[ch][s];if(m)lead(t,m,SPB*0.5,0.07);if((bar%2===0)&&(s===0||s===3))supersaw(t,[HH_CH[ch][0]+12,HH_CH[ch][2]+12],SPB*0.22,0.05,1800);}
}
function setStyle(st){if(st===style)return;style=st;BPM=st==='hh'?92:128;SPB=60/BPM;
  document.getElementById('bpm').textContent=BPM+' BPM';document.querySelectorAll('#styles button').forEach(b=>b.classList.toggle('on',b.dataset.style===st));
  if(ctx){if(delayNode)delayNode.delayTime.value=SPB*0.75;ensureCrackle();crackleGain.gain.value=0;
    if(started){t0=ctx.currentTime+0.1;nextT=t0;stepN=0;vBeat=-0.2;}}prevSec=-1;}
function sched(){if(nextT<ctx.currentTime-0.05){const skip=Math.ceil((ctx.currentTime-nextT)/(SPB/4));nextT+=skip*SPB/4;stepN+=skip;}
  while(nextT<ctx.currentTime+0.2){(style==='hh'?playStepHH:playStep)(stepN,nextT);nextT+=SPB/4;stepN++;}}
function musicStart(){if(!ctx){initAudio();ensureCrackle();crackleGain.gain.value=0;}ctx.resume();if(!started){t0=ctx.currentTime+0.15;nextT=t0;stepN=0;started=true;}clearInterval(timer);timer=setInterval(sched,25);musicOn=true;btnMusic.firstChild.nodeValue='음악 끄기';}
function musicStop(){clearInterval(timer);if(ctx)ctx.suspend();musicOn=false;btnMusic.firstChild.nodeValue='음악 켜기';}

/* ---------- UI ---------- */
const btnMusic=document.getElementById('bMusic'),secEl=document.getElementById('sec'),dots=[...document.querySelectorAll('#dots i')];
let heungUntil=-1;
/* free walking: seats, collision, sit/stand */
const SEATS=[];for(const z of ROWS)for(const x of SEATX)SEATS.push([x,z]);
function seatTaken(s){const sz=s[1]+0.05;return people.some(e=>{if(e===player)return false;const end=e.path.length?e.path[e.path.length-1]:null;
  return (e.seated&&Math.abs(e.x-s[0])<0.1&&Math.abs(e.z-sz)<0.15)||(end&&e.mode==='sit'&&Math.abs(end[0]-s[0])<0.1&&Math.abs(end[1]-sz)<0.15);});}
function updateModeUI(){const m=player.mode==='sit'?'sit':'dance';document.querySelectorAll('#modes button').forEach(b=>b.classList.toggle('on',b.dataset.mode===m));}
function sitNearest(){if(player.seated)return;let best=null,bd=1e9;for(const s of SEATS){if(seatTaken(s))continue;const d=Math.hypot(s[0]-player.x,s[1]-player.z);if(d<bd){bd=d;best=s;}}if(!best)return;
  const sz=best[1]+0.05;player.mode='sit';player.seated=false;player.speed=1.6;player.path=[[0,player.z],[0,sz],[best[0],sz]];updateModeUI();}
function standUp(){if(player.mode!=='sit')return;player.mode='dance';player.seated=false;player.speed=1.6;player.path=[[0,player.z]];updateModeUI();}
function setMode(m){m==='sit'?sitNearest():standUp();}
const clampN=(v,a,b)=>Math.max(a,Math.min(b,v));
function collide(e){const r=0.17;e.x=clampN(e.x,-1.08,1.08);e.z=clampN(e.z,L0+0.45,L1-0.35);
  {const x0=-1.25-r,x1=DRV.x+0.3+r,z1=DRV.z+0.32+r;if(e.x<x1&&e.z<z1){if(x1-e.x<z1-e.z)e.x=x1;else e.z=z1;}}
  for(const z of ROWS)for(const sg of [-1,1]){const x0=(sg<0?-1.2:0.29)-r,x1=(sg<0?-0.29:1.2)+r,z0=z-0.24-r,z1=z+0.29+r;
    if(e.x>x0&&e.x<x1&&e.z>z0&&e.z<z1){const p=[e.x-x0,x1-e.x,e.z-z0,z1-e.z],m=Math.min(...p);if(m===p[0])e.x=x0;else if(m===p[1])e.x=x1;else if(m===p[2])e.z=z0;else e.z=z1;}}}
const keys=new Set(),joy={x:0,y:0};let firstPerson=false,playerWalking=false;
function setView(fp){firstPerson=fp;document.getElementById('bView').firstChild.nodeValue=fp?'3인칭 시점':'1인칭 시점';if(fp)cam.pitch=0;else cam.pitch=0.2;}
document.getElementById('bView').addEventListener('click',()=>setView(!firstPerson));
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>keys.clear());
{const jEl=document.getElementById('joy'),kn=document.getElementById('knob');let id=null;
 const upd=e=>{const r=jEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,R=r.width/2;let dx=(e.clientX-cx)/R,dy=(e.clientY-cy)/R;const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m;}joy.x=dx;joy.y=dy;kn.style.transform=`translate(${dx*R*0.6}px,${dy*R*0.6}px)`;};
 jEl.addEventListener('pointerdown',e=>{id=e.pointerId;jEl.setPointerCapture(id);upd(e);});
 jEl.addEventListener('pointermove',e=>{if(e.pointerId===id)upd(e);});
 const end=e=>{if(e.pointerId!==id)return;id=null;joy.x=joy.y=0;kn.style.transform='';};jEl.addEventListener('pointerup',end);jEl.addEventListener('pointercancel',end);}
function movePlayer(dt){
  playerWalking=false;if(game.on)return;
  let ix=joy.x,iz=-joy.y;
  if(keys.has('w')||keys.has('arrowup'))iz+=1;if(keys.has('s')||keys.has('arrowdown'))iz-=1;
  if(keys.has('a')||keys.has('arrowleft'))ix-=1;if(keys.has('d')||keys.has('arrowright'))ix+=1;
  const mag=Math.hypot(ix,iz);if(mag<0.15)return;
  if(player.seated||player.path.length){player.seated=false;player.path=[];player.mode='dance';updateModeUI();}
  const n=Math.min(1,mag),fx=-Math.sin(cam.yaw),fz=-Math.cos(cam.yaw);
  const dx=(fx*iz-fz*ix)/mag*n,dz=(fz*iz+fx*ix)/mag*n,sp=1.7*dt;
  player.x+=dx*sp;player.z+=dz*sp;collide(player);player.rotY=Math.atan2(-dx,-dz);player.walkPh+=sp*9*n;playerWalking=true;
}
function setMove(v){player.move=v;document.querySelectorAll('#moves button').forEach(b=>b.classList.toggle('on',+b.dataset.move===v));}
const flashEl=document.getElementById('flash');let lastFxBeat=-1;
/* 흥 게이지: 서서 5분 춤추면 흥 폭발 1회 */
const HEUNG_NEED=300;let danceSec=0,lastGaugeTxt='';
let nick='흥부자';try{nick=localStorage.getItem('heung-nick')||nick;}catch(e){}
const nickIn=document.getElementById('nick');nickIn.value=nick==='흥부자'?'':nick;
const toastEl=document.getElementById('toast');let toastTimer=0;
function toast(t,big){toastEl.textContent=t;toastEl.className=big?'big':'';toastEl.hidden=false;void toastEl.offsetWidth;toastEl.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toastEl.hidden=true;},big?4000:2200);}
const mmss=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function updateGauge(){const b=document.getElementById('bHeung'),ready=danceSec>=HEUNG_NEED;
  b.style.setProperty('--p',Math.min(100,danceSec/HEUNG_NEED*100).toFixed(1)+'%');b.classList.toggle('locked',!ready);b.classList.toggle('ready',ready);
  const t=ready?'흥 폭발!':`흥 게이지 ${mmss(HEUNG_NEED-danceSec)} 남음`;if(t!==lastGaugeTxt){b.textContent=t;b.setAttribute('aria-disabled',!ready);lastGaugeTxt=t;}}
function heung(){
  if(danceSec<HEUNG_NEED){toast(`통로에서 ${mmss(HEUNG_NEED-danceSec)} 더 춤추면 흥 폭발을 쓸 수 있어요`);return;}
  danceSec=0;updateGauge();toast(`${nick}님이 흥을 폭발시켰습니다!`,true);
  heungUntil=Math.floor(vBeat)+16;burst();lastFxBeat=Math.floor(vBeat);
  for(let i=0;i<3;i++)firework((Math.random()-0.5)*1.6,1.7+Math.random()*0.4,player.z-2+Math.random()*4);
  if(ctx&&musicOn){const t=ctx.currentTime+0.02;crash(t);horn(t);}
  const b=document.getElementById('bHeung');b.classList.remove('boom');void b.offsetWidth;b.classList.add('boom');}
document.getElementById('modes').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setMode(b.dataset.mode);});
document.getElementById('moves').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setMove(+b.dataset.move);});
document.getElementById('bHeung').addEventListener('click',heung);
document.getElementById('styles').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setStyle(b.dataset.style);});
btnMusic.addEventListener('click',()=>musicOn?musicStop():musicStart());
document.getElementById('vol').addEventListener('input',e=>{vol=e.target.value/100;if(master)master.gain.value=vol;});
// keep keyboard focus off controls so walking keys never nudge the volume slider or re-press a button
['change','pointerup'].forEach(ev=>document.getElementById('vol').addEventListener(ev,e=>e.target.blur()));
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&e.detail>0)b.blur();});
// browsers may pause audio (tab switch, phone interruption) — resume on return or next touch
const wake=()=>{if(musicOn&&ctx&&ctx.state!=='running')ctx.resume();};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});
addEventListener('pointerdown',wake,true);addEventListener('keydown',wake,true);
const fold=document.getElementById('fold'),panel=document.getElementById('panel');
const joyEl=document.getElementById('joy');
function placeJoy(){joyEl.style.bottom=(panel.hidden?24:panel.offsetHeight+24)+'px';joyEl.style.visibility=game&&game.on?'hidden':'';document.getElementById('bGame').hidden=!!(game&&game.on);}
function setFold(f){panel.classList.toggle('folded',f);fold.textContent=f?'조작판 펼치기':'접기';fold.setAttribute('aria-expanded',!f);if(f){fold.style.position='static';fold.style.padding='10px 14px';fold.style.width='100%';}else{fold.style.cssText='';}placeJoy();}
fold.addEventListener('click',()=>setFold(!panel.classList.contains('folded')));
addEventListener('resize',placeJoy);
function swatches(id,list,apply,cur){const el=document.getElementById(id);list.forEach((c,i)=>{const b=document.createElement('button');b.id=id+'-'+i;b.setAttribute('aria-label',id==='jackets'?'등산복 색 '+(i+1):'머리색 '+(i+1));const sp=document.createElement('span');sp.style.background=Array.isArray(c)?`linear-gradient(180deg,#${c[1].toString(16).padStart(6,'0')} 0 38%,#${c[0].toString(16).padStart(6,'0')} 38%)`:'#'+c.toString(16).padStart(6,'0');b.appendChild(sp);if(i===cur)b.classList.add('on');b.onclick=()=>{el.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');apply(c);};el.appendChild(b);});}
swatches('jackets',JACKETS,c=>{player.av.jM.color.setHex(c[0]);player.av.j2M.color.setHex(c[1]);},0);
swatches('hairs',HAIRS.slice(0,3),c=>player.av.hairM.color.setHex(c),0);
addEventListener('keydown',e=>{const k=e.key.toLowerCase();
  if(e.target.tagName==='INPUT'){if(!k.startsWith('arrow'))return;e.preventDefault();e.target.blur();}
  if(e.target.tagName==='BUTTON'&&(k===' '||k==='enter')&&!game.on&&k===' ')e.target.blur();
  if(game.on){if(k==='escape')quitGame();return;}
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){keys.add(k);if(k.startsWith('arrow'))e.preventDefault();return;}
  if(k==='e')player.mode==='sit'?standUp():sitNearest();else if(k==='v')setView(!firstPerson);else if(k==='1')setMove(0);else if(k==='2')setMove(1);else if(k==='3')setMove(3);
  else if(k===' '){e.preventDefault();heung();}else if(k==='m')musicOn?musicStop():musicStart();});
document.getElementById('go').addEventListener('click',()=>{
  nick=(nickIn.value.trim()||'흥부자').slice(0,10);try{localStorage.setItem('heung-nick',nick);}catch(e){}
  player.av.head.remove(meLabel);const w=Math.max(64,(nick.length*42+48)/2);const lb=makeLabel(nick,'#ff3d8b','#fff',w);player.av.head.add(lb);
  document.getElementById('start').hidden=true;musicStart();toast(`${nick}님이 탑승했습니다`);});
nickIn.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('go').click();});
setTimeout(()=>{if(innerWidth<600)setFold(true);else placeJoy();},0);

/* ---------- camera orbit ---------- */
const cam={yaw:PI-0.3,pitch:0.2,dist:3.0,tgt:new THREE.Vector3(0,1.2,-2.7)};
const ptrs=new Map();let pinch0=0,dist0=0;
const cv=renderer.domElement;
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch0=Math.hypot(a[0]-b[0],a[1]-b[1]);dist0=cam.dist;}});
cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId)||game.on)return;const p=ptrs.get(e.pointerId);
  if(ptrs.size===1){cam.yaw-=(e.clientX-p[0])*0.006;cam.pitch=Math.max(firstPerson?-0.9:-0.35,Math.min(firstPerson?0.9:0.95,cam.pitch+(e.clientY-p[1])*0.004));}
  ptrs.set(e.pointerId,[e.clientX,e.clientY]);
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);cam.dist=Math.max(1,Math.min(5,dist0*pinch0/d));}});
const up=e=>ptrs.delete(e.pointerId);cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();cam.dist=Math.max(1,Math.min(5,cam.dist*(1+e.deltaY*0.001)));},{passive:false});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

/* ---------- 엄마 찾기 mini-game ---------- */
const SIL=new THREE.MeshBasicMaterial({color:0x140806});
const SLOTS=[[-0.17,-2.0],[0.17,-1.35],[-0.15,-0.7],[0.16,-0.05],[-0.16,0.6],[0.15,1.25],[-0.13,1.9]];
const regular=people.filter(e=>!e.isPlayer),aisleNPC=regular.filter(e=>!e.seated);
regular.forEach(e=>e.home={x:e.x,z:e.z,seated:e.seated,move:e.move});
// game-only cast: Mom + the dancing crowd. Hidden outside the mini-game.
const cast=[];for(let i=0;i<5;i++)cast.push(spawn(randOutfit({tamb:i===2,visor:i%2?0xffffff:0,glasses:i===3}),{x:0,z:L1+5,seated:false,move:3,gameOnly:true}));
cast.forEach(e=>e.av.root.visible=false);
const npcs=people.filter(e=>!e.isPlayer);
const R=a=>a[Math.floor(Math.random()*a.length)];
const momLabel=makeLabel('엄마','#ffcf3a','#3a1500');momLabel.visible=false;
const wrongLabel=makeLabel('옆집 아주머니','#3b3346','#fff',224);wrongLabel.visible=false;
const momRing=mesh(new THREE.TorusGeometry(0.3,0.022,8,40),new THREE.MeshBasicMaterial({color:0xffcf3a}),0,0.03,0);momRing.rotation.x=PI/2;momRing.visible=false;bus.add(momRing);
const game={on:false,phase:'',t:0,mom:null,group:[],slotOf:new Map(),swaps:0,nextSwap:0,swapDur:0.8,level:0,streak:0,best:0,k:0,kTarget:0,sil:false,camPos:new THREE.Vector3(),camTgt:new THREE.Vector3()};
const gBanner=document.getElementById('gBanner'),gResult=document.getElementById('gResult'),gQuit=document.getElementById('gQuit'),haze=document.getElementById('haze');
function banner(t){gBanner.textContent=t;gBanner.hidden=!t;gBanner.classList.remove('pop');void gBanner.offsetWidth;gBanner.classList.add('pop');}
function silhouette(on){if(on===game.sil)return;game.sil=on;npcs.forEach(e=>e.av.root.traverse(o=>{if(!o.isMesh)return;if(on){o.userData.orig=o.material;o.material=SIL;}else if(o.userData.orig)o.material=o.userData.orig;}));}
function hideCast(){cast.forEach(e=>{e.av.root.visible=false;e.x=0;e.z=L1+5;e.seated=false;e.path=[];e.mode=undefined;});}
function goHomeInstant(){hideCast();regular.forEach(e=>{e.x=e.home.x;e.z=e.home.z;e.seated=e.home.seated;e.move=e.home.move;e.path=[];e.mode=undefined;e.rotY=0;e.speed=0;e.faceY=0;});}
function startGame(){
  silhouette(false);goHomeInstant();momLabel.visible=wrongLabel.visible=false;momLabel.parent&&momLabel.parent.remove(momLabel);wrongLabel.parent&&wrongLabel.parent.remove(wrongLabel);
  if(!game.on){game.camPos.copy(camera.position);game.camTgt.copy(cam.tgt);}
  momRing.visible=false;game.on=true;panel.hidden=true;placeJoy();keys.clear();gResult.hidden=true;gQuit.hidden=false;player.av.root.visible=false;
  cast.forEach(e=>{const j=R(JACKETS);e.av.jM.color.setHex(j[0]);e.av.j2M.color.setHex(j[1]);e.av.hairM.color.setHex(R(HAIRS));e.av.root.visible=true;e.faceY=0;});
  const mom=R(cast);game.mom=mom;mom.move=1;
  const free=SEATS.filter(s=>s[1]>-2.6&&s[1]<4.5&&!seatTaken(s)&&!(player.seated&&Math.hypot(player.x-s[0],player.z-s[1]-0.05)<0.2));const ms=R(free);
  mom.x=ms[0];mom.z=ms[1]+0.05;mom.seated=true;mom.rotY=mom.curRot=0;mom.av.head.add(momLabel);momLabel.visible=true;
  game.group=[mom,...aisleNPC,...cast.filter(e=>e!==mom)];const order=[0,1,2,3,4,5,6].sort(()=>Math.random()-0.5);game.slotOf.clear();
  game.group.forEach((e,i)=>{game.slotOf.set(e,order[i]);e.lag=Math.random()*0.05;e.faceY=-0.3+Math.random()*1.9;if(e!==mom){const s=SLOTS[order[i]];if(e.gameOnly){e.x=s[0];e.z=s[1];e.rotY=e.curRot=e.faceY;e.av.root.visible=false;}else{e.path=[[s[0],s[1]]];e.speed=1.3;}}});
  game.swaps=Math.min(14,3+game.level*2);game.swapDur=Math.max(0.5,1.2-game.level*0.1);
  game.phase='intro';game.t=0;game.kTarget=0;banner('이 분이 우리 엄마! 잘 봐두세요');
}
function swapOnce(){const g=game.group;let a=Math.random()<0.55?game.mom:R(g),b=R(g);while(b===a)b=R(g);
  const sa=game.slotOf.get(a),sb=game.slotOf.get(b);game.slotOf.set(a,sb);game.slotOf.set(b,sa);
  for(const [e,s] of [[a,SLOTS[sb]],[b,SLOTS[sa]]]){const d=Math.hypot(s[0]-e.x,s[1]-e.z)||0.1;e.path=[[s[0],s[1]]];e.speed=d/game.swapDur;}}
function reveal(pickE){
  game.phase='reveal';silhouette(false);game.kTarget=0.3;momLabel.visible=true;momRing.visible=true;
  const ok=pickE===game.mom;
  if(!ok&&pickE){pickE.av.head.add(wrongLabel);wrongLabel.visible=true;}
  if(ok){game.streak++;game.level++;game.best=Math.max(game.best,game.streak);burst();}else{game.streak=0;game.level=0;}
  banner('');
  document.getElementById('gTitle').textContent=ok?'엄마 찾았다!':'아이고, 우리 엄마 아니에요';
  document.getElementById('gMsg').textContent=ok?`역광 속에서도 딱 알아봤네요. 다음 판은 더 많이 섞여요.`:`노란 링이 있는 분이 진짜 엄마예요. 엄마는 왼쪽에서 ${game.slotOf.get(game.mom)+1}번째 자리에서 춤추고 있었어요.`;
  document.getElementById('gStat').textContent=`연속 성공 ${game.streak} · 최고 기록 ${game.best} · 다음 판 섞기 ${Math.min(14,3+game.level*2)}번`;
  gResult.hidden=false;gQuit.hidden=true;
}
function quitGame(){
  if(!game.on)return;game.on=false;silhouette(false);game.kTarget=0;banner('');gResult.hidden=true;gQuit.hidden=true;panel.hidden=false;placeJoy();
  momLabel.visible=wrongLabel.visible=momRing.visible=false;player.av.root.visible=!firstPerson;
  hideCast();regular.forEach(e=>{e.faceY=0;e.move=e.home.move;e.speed=1.3;e.mode=e.home.seated?'sit':undefined;
    e.path=e.home.seated?[[0,e.z],[0,e.home.z],[e.home.x,e.home.z]]:[[e.home.x,e.home.z]];if(e.seated)e.path=[];});
}
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
function pickAt(cx,cy){const r=cv.getBoundingClientRect();ndc.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
  const shown=o=>{while(o){if(!o.visible)return false;o=o.parent;}return true;};
  for(const h of ray.intersectObject(bus,true)){if(!h.object.isMesh||h.object.material.transparent||!shown(h.object))continue;let o=h.object;while(o){const e=npcs.find(p=>p.av.root===o);if(e)return e;o=o.parent;}return null;}return null;}
function gameTick(dt){
  game.t+=dt;const m=game.mom;
  if(game.phase==='intro'){
    if(game.t>3.5&&m.seated&&!m.path.length){const s=SLOTS[game.slotOf.get(m)];m.mode='dance';m.seated=false;m.speed=1.0;m.path=[[0,m.z],[s[0],s[1]]];banner('엄마가 일어나서 춤추러 나가요!');}
    if(game.t>4.5&&!m.seated&&!m.path.length){game.phase='show';game.t=0;cast.forEach(c=>c.av.root.visible=true);banner('엄마는 지금 여기! 위치를 잘 기억하세요');}
  }else if(game.phase==='show'){
    if(game.t>4.0){game.phase='sunset';game.t=0;game.kTarget=1;banner('해가 기울고… 눈부신 역광!');}
  }else if(game.phase==='sunset'){
    if(game.k>0.6){silhouette(true);momLabel.visible=false;}
    if(game.t>4.0){game.phase='shuffle';game.t=0;game.nextSwap=0.6;banner(game.level<2?'엄마를 따라가세요 (힌트: 엄마만 다른 춤을 춰요)':'엄마를 눈으로 따라가세요');}
  }else if(game.phase==='shuffle'){
    if(game.swaps>0&&game.t>=game.nextSwap){swapOnce();game.swaps--;game.nextSwap=game.t+game.swapDur+0.12;}
    if(game.swaps===0&&game.group.every(e=>!e.path.length)){game.phase='dance';game.t=0;banner('한참 동안 신나게 춤추는 중…');}
  }else if(game.phase==='dance'){
    if(game.t>3.5){game.phase='guess';game.t=0;banner('엄마는 어디 있을까? 눌러서 골라주세요');}
  }
  if(momRing.visible){momRing.position.set(m.x,0.03,m.z);}
}
document.getElementById('bGame').addEventListener('click',startGame);
document.getElementById('gAgain').addEventListener('click',startGame);
document.getElementById('gExit').addEventListener('click',quitGame);
gQuit.addEventListener('click',quitGame);
let downXY=null;
cv.addEventListener('pointerdown',e=>{downXY=[e.clientX,e.clientY];});
cv.addEventListener('pointerup',e=>{if(!game.on||game.phase!=='guess'||!downXY)return;if(Math.hypot(e.clientX-downXY[0],e.clientY-downXY[1])>10)return;const p=pickAt(e.clientX,e.clientY);if(p)reveal(p);});

/* ---------- canvases: TV + roads ---------- */
let roadOff=0,lastDraw=0;
function drawTV(sec,beat){const {g}=tvTex.userData,w=512,h=288;
  const bg=g.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#1a1060');bg.addColorStop(1,'#5a1a6e');g.fillStyle=bg;g.fillRect(0,0,w,h);
  const n=28;if(analyser&&musicOn)analyser.getByteFrequencyData(fft);
  for(let i=0;i<n;i++){const v=(analyser&&musicOn)?fft[Math.floor(i*1.8)+1]/255:0.15+0.1*Math.sin(i+beat*3);const bh=v*150;g.fillStyle=`hsl(${(i*12+beat*20)%360},90%,60%)`;g.fillRect(16+i*17.5,h-30-bh,13,bh);}
  g.textAlign='center';g.font='56px "Black Han Sans",sans-serif';g.lineWidth=8;g.strokeStyle='#b0103e';
  const title=style==='hh'?(sec===3?'얼씨구 훅 간다!!':sec===2?'올라간다~ 올라가!':'갈대밭 붐뱁'):(sec===3?'흥 폭발 드롭!!':sec===2?'올라간다~ 올라가!':'고속도로 디스코');
  g.strokeText(title,w/2,82);g.fillStyle='#ffe14a';g.fillText(title,w/2,82);
  g.font='bold 20px "Gothic A1",sans-serif';g.fillStyle='#fff';g.fillText(style==='hh'?'♪ 관광버스 힙합 · '+BPM+' BPM':'♪ 단풍놀이 메들리 · '+BPM+' BPM',w/2,118);
  g.fillStyle='#000';g.fillRect(0,h-26,w,26);g.fillStyle='#7ff7ea';g.font='bold 16px "Gothic A1",sans-serif';g.textAlign='left';
  const tick='  기사님 안전운전 부탁드려요 ★ 다음 휴게소까지 32km ★ 통로에서는 손잡이 꼭 잡고 흔드세요 ★';const x=-((beat*30)%900);g.fillText(tick+tick,x,h-8);
  tvTex.needsUpdate=true;}

/* ---------- main loop ---------- */
let last=performance.now(),vBeat=0,prevSec=-1,prevDot=-1,clock=0;
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000);last=now;clock+=dt;
  if(musicOn&&ctx)vBeat=(ctx.currentTime-t0)/SPB;else vBeat+=dt/SPB;
  const bar=((Math.floor(vBeat/4)%16)+16)%16,sec=musicOn?(bar<4?0:bar<8?1:bar<12?2:3):1;
  const heungOn=vBeat<heungUntil,en=heungOn?1.35:[0.85,1,0.8,1.25][sec];
  const frac=vBeat-Math.floor(vBeat),pulse=sec===2&&!heungOn?0.25+0.5*((vBeat%4)/4):Math.exp(-frac*5);

  // section change → shuffle moves at drop
  if(sec!==prevSec){if(sec===3&&musicOn)people.forEach(e=>{if(!e.isPlayer)e.move=e.seated?pick([1,3,0]):pick([0,1,3]);});
    secEl.textContent=!started?'탑승 대기':!musicOn?'음악 꺼짐':(style==='hh'?['인트로','벌스','빌드업','훅!']:['인트로','그루브','빌드업','드롭!'])[sec];secEl.className='pill'+(musicOn&&sec===3?' drop':musicOn&&sec===2?' build':'');prevSec=sec;}
  const dIdx=((Math.floor(vBeat)%4)+4)%4;if(dIdx!==prevDot){dots.forEach((d,i)=>d.classList.toggle('on',i===dIdx));prevDot=dIdx;}

  const k=1-Math.exp(-dt*18);
  const gMove=[3,0,1,3][((Math.floor(vBeat/8)%4)+4)%4];
  if(game.on)gameTick(dt);
  movePlayer(dt);
  if(started&&!game.on&&!playerWalking&&!player.seated&&!player.path.length&&!heungOn)danceSec=Math.min(HEUNG_NEED,danceSec+dt);
  updateGauge();
  updateDriver(vBeat,clock,heungOn||(musicOn&&sec===3));
  for(const e of people){
    if(e.gameOnly&&!e.av.root.visible)continue;
    if(!e.isPlayer){const blk=Math.floor(vBeat/8);if(blk!==e.block){if(e.block>=0&&rnd()<0.3)e.move=e.seated?pick([-1,1,3,1]):pick([0,1,3]);if(rnd()<0.25)e.hand*=-1;e.block=blk;}}
    let walking=false;
    if(e.path.length){const [tx,tz]=e.path[0],dx=tx-e.x,dz=tz-e.z,d=Math.hypot(dx,dz),st=(e.speed||1.5)*dt;
      if(d<=st){e.x=tx;e.z=tz;e.path.shift();if(!e.path.length){e.seated=e.mode==='sit';e.rotY=e.seated?0:(e.faceY||0);}}
      else{e.x+=dx/d*st;e.z+=dz/d*st;e.rotY=Math.atan2(-dx,-dz);walking=true;e.walkPh+=st*9;}}
    if(e.isPlayer&&playerWalking)walking=true;
    let mv=heungOn?3:e.move,hd=e.hand;
    if(game.on&&game.group.includes(e)&&!(game.phase==='intro')){mv=game.phase==='reveal'?3:gMove;hd=1;if(e===game.mom&&game.level<2&&game.phase!=='reveal'&&game.phase!=='show')mv=gMove===3?1:3;}
    computePose(e.tgt,{b:vBeat-e.lag,en,seated:e.seated,walking,walkPh:e.walkPh,hand:hd,move:mv});
    for(let i=0;i<22;i++)e.cur[i]+=(e.tgt[i]-e.cur[i])*k;
    applyPose(e.av,e.cur);
    let dr=e.rotY-e.curRot;dr=Math.atan2(Math.sin(dr),Math.cos(dr));e.curRot+=dr*Math.min(1,dt*10);
    e.av.root.position.set(e.x,0,e.z);e.av.root.rotation.y=e.curRot;
    e.av.arms[0].finger.visible=mv===0&&hd<0;e.av.arms[1].finger.visible=mv===0&&hd>0;
  }

  // lights
  const hue=(clock*(sec===3?0.18:0.06))%1,strobe=heungOn||sec===3?pulse:pulse*0.6;
  plights.forEach((l,i)=>{l.color.setHSL((hue+i/3)%1,0.9,0.55);l.intensity=0.35+1.1*strobe;l.position.z=-4.5+i*4.2+Math.sin(clock*0.8+i*2)*1.6;l.position.x=Math.sin(clock*1.3+i)*0.6;});
  ledMats.forEach((m,i)=>m.color.setHSL((hue+i*0.33+frac*0.05)%1,1,0.45+0.25*strobe));
  ball.rotation.y+=dt*0.8;ball.visible=game.k<0.3;
  // sunset backlight blend
  game.k+=(game.kTarget-game.k)*Math.min(1,dt*(game.on?0.7:1.3));const K=game.k;
  hemi.intensity=0.72-0.62*K;sun.intensity=0.45*(1-K);plights.forEach(l=>l.intensity*=1-K);
  if(K>0.01)ledMats.forEach(m=>m.color.multiplyScalar(1-0.85*K));
  sunsetMats.forEach(m=>m.opacity=K);sunGlow.material.opacity=0.5*K;haze.style.opacity=(K*0.35).toFixed(3);tvMat.color.setScalar(1-0.8*K);
  stars.material.opacity=(0.55+0.45*Math.abs(Math.sin(clock*2)))*(1-K);
  const outside=game.on&&game.phase!=='intro';
  pL.visible=sunsetPlanes[1].visible=!outside;backdropMat.opacity=outside?K:0;scene.background.copy(skyDay).lerp(skySet,K);
  if(outside){sunGlow.position.set(2.0,1.4,0);const fl=0.92+0.08*Math.sin(clock*1.7);sunGlow.scale.set(4.2*fl,4.2*fl,1);}
  else{sunGlow.position.set(0,1.35,L1-0.2);sunGlow.scale.set(2.6,2.6,1);}
  if(!reduceMotion){bus.rotation.z=0.008*Math.sin(clock*0.9)+0.003*Math.sin(clock*2.7);bus.position.y=0.004*Math.sin(clock*9);}

  // scenery
  sceneR.offset.x-=dt*0.085;sceneL.offset.x+=dt*0.085;sunsetScn.offset.x=sceneR.offset.x;sunsetL.offset.x=sceneL.offset.x;roadOff+=dt*6;
  if(now-lastDraw>50){lastDraw=now;drawRoad(roadF.userData.g,256,128,roadOff,true);roadF.needsUpdate=true;drawRoad(roadB.userData.g,256,128,roadOff,false);roadB.needsUpdate=true;drawTV(musicOn?sec:1,vBeat);}

  // 흥 폭발 FX
  const laserLv=heungOn?1:(musicOn&&sec===3?0.4:0);updateLasers(laserLv,clock,hue);
  if(heungOn){const fb=Math.floor(vBeat);if(fb!==lastFxBeat){lastFxBeat=fb;const near=Math.random()<0.5;
      firework(near?clampN(player.x+(Math.random()-0.5)*1.4,-0.9,0.9):(Math.random()-0.5)*1.6,1.55+Math.random()*0.55,near?player.z+(Math.random()-0.5)*3:-5+Math.random()*10);
      if(fb%2===0)firework((Math.random()-0.5)*1.6,1.7+Math.random()*0.4,-5+Math.random()*10);
      if(fb%4===0)burst();}}
  updateFireworks(dt);
  flashEl.style.opacity=heungOn?(reduceMotion?0.04:0.22)*pulse:0;
  const shake=heungOn&&!reduceMotion?0.03*pulse:0;
  // confetti
  if(confT>0){confT-=dt;for(let i=0;i<CN;i++){cVel[i*3+1]-=dt*1.2;cVel[i*3]*=0.99;cVel[i*3+2]*=0.99;cPos[i*3]+=cVel[i*3]*dt;cPos[i*3+1]=Math.max(0.01,cPos[i*3+1]+cVel[i*3+1]*dt*0.6);cPos[i*3+2]+=cVel[i*3+2]*dt;}cGeo.attributes.position.needsUpdate=true;}

  // camera
  if(game.on){const m=game.mom;let p,t;
    if(game.phase==='intro'){t=new THREE.Vector3(m.x,m.seated?1.05:1.3,m.z);p=m.seated?new THREE.Vector3(m.x*0.85,1.78,Math.max(L0+0.4,m.z-1.15)):new THREE.Vector3(0,2.1,Math.max(L0+0.4,m.z-1.6));}
    else{const hf=2*Math.atan(Math.tan(31*PI/180)*camera.aspect),d=Math.max(2.7,Math.min(6,2.3/Math.tan(hf/2)));
      t=new THREE.Vector3(0,1.38,0);p=new THREE.Vector3(-d,1.42+0.03*Math.sin(clock*0.5),0.12*Math.sin(clock*0.3));}
    const a=1-Math.exp(-dt*2.5);game.camPos.lerp(p,a);game.camTgt.lerp(t,a);camera.position.copy(game.camPos);camera.lookAt(game.camTgt);
    renderer.render(scene,camera);requestAnimationFrame(frame);return;}
  player.av.root.visible=!firstPerson;
  if(firstPerson){const eye=new THREE.Vector3(player.x,player.seated?1.2:1.56,player.z),cp=Math.cos(cam.pitch);
    camera.position.copy(eye);if(shake)camera.position.add(new THREE.Vector3((Math.random()-0.5)*shake,(Math.random()-0.5)*shake,0));camera.lookAt(eye.x-Math.sin(cam.yaw)*cp,eye.y-Math.sin(cam.pitch),eye.z-Math.cos(cam.yaw)*cp);cam.tgt.copy(eye);
    renderer.render(scene,camera);requestAnimationFrame(frame);return;}
  const tg=new THREE.Vector3(player.x,player.seated?1.0:1.25,player.z);cam.tgt.lerp(tg,1-Math.exp(-dt*5));
  const cp=Math.cos(cam.pitch);
  camera.position.set(cam.tgt.x+Math.sin(cam.yaw)*cp*cam.dist,cam.tgt.y+Math.sin(cam.pitch)*cam.dist,cam.tgt.z+Math.cos(cam.yaw)*cp*cam.dist);
  camera.position.x=Math.max(-1.1,Math.min(1.1,camera.position.x));camera.position.y=Math.max(0.5,Math.min(2.2,camera.position.y));camera.position.z=Math.max(L0+0.3,Math.min(L1-0.3,camera.position.z));
  camera.lookAt(cam.tgt);
  if(shake){camera.position.x+=(Math.random()-0.5)*shake*2;camera.position.y+=(Math.random()-0.5)*shake*2;}
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();

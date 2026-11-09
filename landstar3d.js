/* landstar3d.js — the 3D Landstar truck on /BCOonboarding ("We eat off the same plate").
   Replaces the truck photo band with a blue Landstar sleeper tractor and a white 53' trailer
   carrying the Landstar logo on both sides, built in CSS 3D and rolling down a lit highway.
   It turns on its own; drag (or swipe) to spin it around. Wheels and lane lines move.
   The photo stays in the page as a soft backdrop and as the fallback if 3D is unavailable.
   No library. Reduced-motion visitors get it parked. */
(function(){
  var band=document.getElementById('truckBand'); if(!band) return;
  if(!(window.CSS&&CSS.supports&&CSS.supports('transform-style','preserve-3d'))) return;
  var still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var LOGO='/assets/landstar-logo.png';
  var css=[
  '.truck-band.t3d{height:min(440px,58vh)!important;background:#06121f;cursor:grab;touch-action:pan-y;user-select:none;-webkit-user-select:none}',
  '.truck-band.t3d.grab{cursor:grabbing}',
  '.truck-band.t3d .truck-svg,.truck-band.t3d > .road{display:none}',
  '.truck-band.t3d .truck-photo{z-index:0;filter:blur(7px) brightness(.42) saturate(1.2);transform:scale(1.12)}',
  '@media(max-width:600px){.truck-band.t3d{height:300px!important}}',
  '.ls3d{position:absolute;inset:0;z-index:3;perspective:1100px;perspective-origin:50% 30%}',
  '.ls3d::after{content:"";position:absolute;inset:0;background:radial-gradient(80% 70% at 50% 75%,transparent 40%,rgba(4,12,22,.75));pointer-events:none}',
  '.ls3d .sc{position:absolute;left:50%;top:70%;width:0;height:0;transform-style:preserve-3d}',
  '.ls3d .rot{position:absolute;transform-style:preserve-3d}',
  '.ls3d i{position:absolute;left:0;top:0;display:block;backface-visibility:hidden;-webkit-backface-visibility:hidden}',
  /* road: a long strip under the truck, lane dashes flowing toward the back of the rig */
  '.ls3d .road{width:1600px;height:300px;transform:translate3d(-800px,-150px,0) rotateX(90deg);backface-visibility:visible!important;background:linear-gradient(180deg,transparent 0,#16212e 12%,#1b2735 50%,#16212e 88%,transparent 100%)}',
  '.ls3d .road b{position:absolute;left:0;right:0;height:5px;background:repeating-linear-gradient(90deg,#ffd27a 0 60px,transparent 60px 140px);background-size:140px 5px;animation:ls3dLane .55s linear infinite}',
  '.ls3d .road b.c{top:50%;margin-top:-2px}',
  '.ls3d .road b.e1,.ls3d .road b.e2{background:rgba(255,255,255,.75);animation:none;height:3px}',
  '.ls3d .road b.e1{top:16%}.ls3d .road b.e2{bottom:16%}',
  '@keyframes ls3dLane{from{background-position:0 0}to{background-position:-140px 0}}',
  '.ls3d .shadow{width:720px;height:150px;transform:translate3d(-400px,-75px,1px) rotateX(90deg);backface-visibility:visible!important;background:radial-gradient(closest-side,rgba(0,0,0,.65),transparent);border-radius:50%}',
  '.ls3d i.wh{border-radius:50%;overflow:hidden;background:#10151c}',
  '.ls3d i.wh s{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,#e8edf3 0 14%,#9aa6b5 15% 30%,transparent 31%),conic-gradient(#c3ccd8 0 10%,#6b7787 10% 20%,#c3ccd8 20% 30%,#6b7787 30% 40%,#c3ccd8 40% 50%,#6b7787 50% 60%,#c3ccd8 60% 70%,#6b7787 70% 80%,#c3ccd8 80% 90%,#6b7787 90%);box-shadow:inset 0 0 0 9px #10151c,inset 0 0 0 11px #2a323d}',
  '.ls3d i.wh.spin s{animation:ls3dSpin .45s linear infinite}',
  '@keyframes ls3dSpin{to{transform:rotate(-360deg)}}',
  '.ls3d .tside{display:flex;align-items:center;justify-content:center;height:100%;position:relative}',
  '.ls3d .tside img{height:46%;width:auto;filter:drop-shadow(0 1px 0 rgba(0,0,0,.08))}',
  '.ls3d .tside::after{content:"";position:absolute;left:0;right:0;bottom:12px;height:7px;background:linear-gradient(90deg,#0a4fbf,#1f7ae0)}',
  '.ls3d .door{display:flex;align-items:flex-end;justify-content:center;height:100%;padding-bottom:30%}',
  '.ls3d .door img{width:56%;height:auto;background:#fff;border-radius:4px;padding:3px}',
  '.ls3d .rear{display:grid;grid-template-columns:1fr 1fr;height:100%;gap:2px;background:#cfd6df}',
  '.ls3d .rear span{background:linear-gradient(180deg,#f4f6f9,#e3e8ee);display:flex;align-items:center;justify-content:center}',
  '.ls3d .rear img{width:70%;height:auto}',
  '.ls3d .hint{position:absolute;right:14px;top:12px;z-index:6;font:600 .74rem Inter,sans-serif;color:rgba(220,236,255,.75);background:rgba(8,26,44,.55);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:5px 11px}',
  ].join('\n');
  if(still) css+='\n.ls3d .road b,.ls3d i.wh.spin s{animation:none}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  function shade(hex,k){ var n=parseInt(hex.slice(1),16), r=n>>16, g=n>>8&255, b=n&255; function f(c){return Math.max(0,Math.min(255,Math.round(c*k)));} return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; }
  // box from x0..x1 (front of the rig = +x), y0..y1 above the road, depth d centred on z (o.z)
  // o.f/o.b/o.l/o.r/o.t = custom html for the near side (+z), far side (-z), rear (-x), front (+x), top
  function box(x0,x1,y0,y1,d,col,o){
    o=o||{}; var w=x1-x0, h=y1-y0, cx=(x0+x1)/2, cy=(y0+y1)/2, cz=o.z||0, out='';
    var F=[['',w,h,d/2,1,'f'],['rotateY(180deg)',w,h,d/2,.86,'b'],['rotateY(90deg)',d,h,w/2,.74,'r'],['rotateY(-90deg)',d,h,w/2,.66,'l'],['rotateX(90deg)',w,d,h/2,1.14,'t'],['rotateX(-90deg)',w,d,h/2,.45,'u']];
    F.forEach(function(f){
      var html=o[f[5]]||'', bg=(o.bg&&o.bg[f[5]])||(o.grad?o.grad:shade(col,f[4]));
      out+='<i style="width:'+f[1]+'px;height:'+f[2]+'px;background:'+bg+';transform:translate3d('+(cx-f[1]/2)+'px,'+(-cy-f[2]/2)+'px,'+cz+'px) '+f[0]+' translateZ('+f[3]+'px)'+(o.rad?';border-radius:'+o.rad:'')+'">'+html+'</i>';
    });
    return out;
  }
  function wheelPair(x,r,half,dual){
    var s='', zs=dual?[half,half-12]:[half];
    zs.forEach(function(z){
      s+='<i class="wh spin" style="width:'+2*r+'px;height:'+2*r+'px;transform:translate3d('+(x-r)+'px,'+(-2*r)+'px,'+z+'px)"><s></s></i>';
      s+='<i class="wh spin" style="width:'+2*r+'px;height:'+2*r+'px;transform:translate3d('+(x-r)+'px,'+(-2*r)+'px,'+(-z)+'px) rotateY(180deg)"><s></s></i>';
    });
    return s+box(x-r*.72,x+r*.72,r*.28,r*1.72,half*2-1,'#0f141b');               // tyre tread between the discs
  }
  var BLUE='#0b4fc4', CHROME='linear-gradient(180deg,#f5f8fb,#9aa7b6 45%,#e6ebf1 55%,#7d8a99)';
  var side='<div class="tside"><img src="'+LOGO+'" alt="" draggable="false"></div>';
  var door='<div class="door"><img src="'+LOGO+'" alt="" draggable="false"></div>';
  var rear='<div class="rear"><span><img src="'+LOGO+'" alt="" draggable="false"></span><span></span></div>';
  var D=80; // trailer depth
  var M=''+
    // trailer
    box(-340,70,34,158,D,'#f4f6f9',{f:side,b:side,l:rear,bg:{t:'#e9edf2'}})+
    box(-340,70,24,34,D-6,'#2a323d')+                                             // trailer frame
    box(-336,-300,14,30,D-2,'#d1d8e1')+                                          // rear bumper
    box(30,40,10,24,D-14,'#3a4350')+                                              // landing gear
    // tractor frame, fuel tanks, steps
    box(70,330,20,34,58,'#252c36')+
    box(175,232,22,46,14,'#ccd5df',{z:34,grad:CHROME,rad:'7px'})+box(175,232,22,46,14,'#ccd5df',{z:-34,grad:CHROME,rad:'7px'})+
    // sleeper + cab
    box(92,172,34,156,74,BLUE,{rad:'4px'})+
    box(172,230,34,146,74,BLUE,{f:door,b:door})+
    box(188,224,102,134,75,'#0b1a2b',{bg:{f:'linear-gradient(160deg,#9fd7ff,#123a63 70%)',b:'linear-gradient(200deg,#9fd7ff,#123a63 70%)'}})+  // side windows
    box(228,232,100,138,66,'#0b1a2b',{bg:{r:'linear-gradient(170deg,#bfe6ff,#1b4f82 60%,#0b2a4a)'}})+                                          // windshield
    box(226,236,140,147,76,'#0a3f9c')+                                             // sun visor
    // hood, fenders, grille, bumper, lights
    box(230,318,46,104,66,BLUE,{rad:'6px'})+
    box(268,312,30,58,80,BLUE,{rad:'10px 10px 0 0'})+
    box(316,322,42,104,52,'#c8d1dc',{grad:CHROME})+
    box(318,336,24,46,82,'#c8d1dc',{grad:CHROME,rad:'4px'})+
    box(317,323,74,84,14,'#fff4c2',{z:28})+box(317,323,74,84,14,'#fff4c2',{z:-28})+
    // stacks + air cleaners
    box(166,172,60,196,7,'#ccd5df',{z:40,grad:CHROME})+box(166,172,60,196,7,'#ccd5df',{z:-40,grad:CHROME})+
    box(236,250,96,122,12,'#ccd5df',{z:38,grad:CHROME,rad:'6px'})+box(236,250,96,122,12,'#ccd5df',{z:-38,grad:CHROME,rad:'6px'})+
    // wheels: steer, two drive axles, two trailer axles
    wheelPair(292,22,38,false)+wheelPair(140,22,38,true)+wheelPair(104,22,38,true)+
    wheelPair(-262,22,38,true)+wheelPair(-226,22,38,true);

  var hint=document.createElement('div'); hint.className='hint'; hint.textContent='⟲ Drag to spin the truck';
  var stage=document.createElement('div'); stage.className='ls3d'; stage.setAttribute('aria-hidden','true');
  stage.innerHTML='<div class="sc"><div class="rot"><i class="road"><b class="e1"></b><b class="c"></b><b class="e2"></b></i><i class="shadow"></i>'+M+'</div></div>';
  band.classList.add('t3d'); band.appendChild(stage); band.appendChild(hint);
  band.setAttribute('aria-label',"3D Landstar tractor-trailer with the Landstar logo on the trailer");
  var sc=stage.querySelector('.sc'), rot=stage.querySelector('.rot');

  var ang=-32, vel=still?0:9, drag=false, lx=0, t0=performance.now(), vis=true;
  if('IntersectionObserver' in window) new IntersectionObserver(function(e){vis=e[0].isIntersecting;}).observe(band);
  function frame(now){
    var dt=Math.min(.05,(now-t0)/1000); t0=now;
    if(vis){
      if(!drag) ang+=vel*dt;
      var w=band.clientWidth, s=Math.max(.45,Math.min(1,w/720));
      sc.style.transform='scale('+s+')';
      rot.style.transform='rotateX(-14deg) rotateY('+ang.toFixed(2)+'deg)';
    }
    requestAnimationFrame(frame);
  }
  band.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX;band.classList.add('grab');});
  addEventListener('pointermove',function(e){ if(!drag) return; ang+=(e.clientX-lx)*.45; lx=e.clientX; });
  addEventListener('pointerup',function(){drag=false;band.classList.remove('grab');});
  addEventListener('pointercancel',function(){drag=false;band.classList.remove('grab');});
  requestAnimationFrame(frame);
})();

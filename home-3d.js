/* home-3d.js — the 3D layer on the trucking home page (/).
   1. Hero: a spinning 3D globe with freight lanes running out of Myrtle Beach to the
      cities and ports the agency serves (U.S., Canada, Mexico), trucks moving along them.
   2. The four "need" cards and the four network stats stand up in 3D as they scroll in.
   3. The five walkthrough screens tilt in 3D like a monitor turning toward you, and follow
      the mouse on a computer.
   Canvas + CSS 3D, no library. Reduced-motion visitors get it standing still.
   It never touches the walkthrough player, the narration or the forms. */
(function(){
  var still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  var css=[
  '#s01 .g3d{position:absolute;z-index:0;pointer-events:none;right:-60px;top:50%;width:min(56vw,700px);height:min(56vw,700px);transform:translateY(-50%);-webkit-mask-image:radial-gradient(closest-side,#000 82%,transparent);mask-image:radial-gradient(closest-side,#000 82%,transparent)}',
  '#s01 > .wrap{position:relative;z-index:2}',
  '@media(max-width:900px){#s01 .g3d{right:-150px;top:40px;width:440px;height:440px;transform:none;opacity:.38}}',
  /* stand-up cards: only once they have revealed, so the page's own fade-in still runs first */
  '.need.reveal.in.s3d,.net-stat.reveal.in.s3d{transform:perspective(900px) rotateX(var(--rx,0deg)) translateZ(var(--tz,0px));transition:opacity .7s cubic-bezier(.22,.61,.36,1)}',
  '.mock.reveal.in.s3d{transform:perspective(1300px) rotateY(var(--ry,0deg)) rotateX(var(--rx,0deg));transition:opacity .7s cubic-bezier(.22,.61,.36,1);transform-origin:50% 60%}',
  '.mock.s3d{box-shadow:var(--shadow-lg,0 30px 70px rgba(8,26,44,.45))}'
  ].join('\n');
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  /* ---------- 1. hero globe ---------- */
  (function(){
    var hero=document.getElementById('s01'); if(!hero||!document.createElement('canvas').getContext) return;
    var cv=document.createElement('canvas'); cv.className='g3d'; cv.setAttribute('aria-hidden','true');
    hero.insertBefore(cv,hero.firstChild);
    var cx=cv.getContext('2d'), D=Math.PI/180, W=0, dpr=Math.min(2,window.devicePixelRatio||1);
    function size(){ var r=cv.getBoundingClientRect(); W=Math.round(r.width); cv.width=W*dpr; cv.height=W*dpr; }
    size(); addEventListener('resize',size);
    var HOME={n:'Myrtle Beach',lat:33.69,lon:-78.89};
    var C=[
      {n:'Atlanta',lat:33.75,lon:-84.39},{n:'Chicago',lat:41.88,lon:-87.63},{n:'Dallas',lat:32.78,lon:-96.8},
      {n:'Los Angeles',lat:34.05,lon:-118.24},{n:'New York',lat:40.71,lon:-74.0},{n:'Miami',lat:25.76,lon:-80.19},
      {n:'Denver',lat:39.74,lon:-104.99},{n:'Seattle',lat:47.61,lon:-122.33},{n:'Toronto',lat:43.65,lon:-79.38},
      {n:'Monterrey',lat:25.69,lon:-100.32},{n:'Savannah',lat:32.08,lon:-81.09},{n:'Laredo',lat:27.53,lon:-99.48},
      {n:'Memphis',lat:35.15,lon:-90.05},{n:'Phoenix',lat:33.45,lon:-112.07},{n:'Montréal',lat:45.5,lon:-73.57}
    ];
    var LABEL={'Myrtle Beach':1,'Los Angeles':1,'Toronto':1,'Monterrey':1,'Dallas':1,'New York':1};
    // a dot sphere (fibonacci) for the globe body
    function fib(N){ var o=[]; for(var i=0;i<N;i++){ var y=1-2*(i+.5)/N, r=Math.sqrt(1-y*y), a=i*2.399963; o.push({lat:Math.asin(y)/D, lon:Math.atan2(r*Math.sin(a),r*Math.cos(a))/D}); } return o; }
    // a rough outline of North America, enough to light up the land dots
    var NA=[[-168,66],[-160,71],[-140,70],[-125,70],[-110,73],[-95,72],[-85,70],[-80,63],[-90,57],[-82,52],[-78,58],[-68,60],[-62,58],[-56,52],[-60,47],[-66,45],[-70,42],[-74,40],[-76,35],[-81,31],[-80,26],[-82,26],[-83,29],[-89,30],[-94,29],[-97,26],[-97,22],[-95,18.5],[-91,19],[-90.5,21.3],[-87,21.5],[-88,16],[-84,15],[-83,10],[-79,9],[-80,7.5],[-86,11],[-92,14.5],[-97,16],[-105,20],[-106,23],[-109,24],[-112.5,29],[-114.5,31.5],[-112,26],[-110,23],[-112.5,24.5],[-115,28],[-117,32],[-120,34],[-124,40],[-124,46],[-125,49],[-131,54],[-140,60],[-150,61],[-158,58],[-165,60],[-168,66]];
    function inNA(lon,lat){ var c=false; for(var i=0,j=NA.length-1;i<NA.length;j=i++){ var a=NA[i],b=NA[j]; if(((a[1]>lat)!==(b[1]>lat))&&(lon<(b[0]-a[0])*(lat-a[1])/(b[1]-a[1])+a[0])) c=!c; } return c; }
    // dense dots on the land, sparse dots on the water
    var P=fib(3000).filter(function(q){return !inNA(q.lon,q.lat);}).concat(fib(42000).filter(function(q){ q.land=1; return q.lon<-50&&q.lon>-170&&q.lat>5&&inNA(q.lon,q.lat); }));
    function vec(lat,lon){ lat*=D; lon*=D; return [Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat)]; }
    function ll(v){ var h=Math.hypot(v[0],v[1],v[2]); return {lat:Math.asin(v[2]/h)/D, lon:Math.atan2(v[1],v[0])/D, h:h}; }
    var lat0=38, lon0=-98, t=0, small=W<500;
    function proj(lat,lon,h){
      var dl=(lon-lon0)*D, la=lat*D, l0=lat0*D;
      return {x:Math.cos(la)*Math.sin(dl)*h, y:(Math.cos(l0)*Math.sin(la)-Math.sin(l0)*Math.cos(la)*Math.cos(dl))*h, z:Math.sin(l0)*Math.sin(la)+Math.cos(l0)*Math.cos(la)*Math.cos(dl)};
    }
    function arc(a,b,k){ // point k (0..1) along a lifted great circle a→b
      var va=vec(a.lat,a.lon), vb=vec(b.lat,b.lon), dot=va[0]*vb[0]+va[1]*vb[1]+va[2]*vb[2], om=Math.acos(Math.min(1,dot)), s=Math.sin(om)||1;
      var f1=Math.sin((1-k)*om)/s, f2=Math.sin(k*om)/s, v=[va[0]*f1+vb[0]*f2,va[1]*f1+vb[1]*f2,va[2]*f1+vb[2]*f2], p=ll(v);
      return proj(p.lat,p.lon,1+0.12*om*Math.sin(Math.PI*k));
    }
    var seeds=C.map(function(_,i){return (i*0.137)%1;});
    var vis=true; if('IntersectionObserver' in window) new IntersectionObserver(function(e){vis=e[0].isIntersecting;}).observe(hero);
    function draw(){
      if(!vis){ requestAnimationFrame(draw); return; }
      t+=1/60; if(!still){ lon0=-98+Math.sin(t*0.15)*16; lat0=38+Math.sin(t*0.11)*5; }
      var R=W*0.48, ox=W/2, oy=W/2+R*0.1;
      cx.setTransform(dpr,0,0,dpr,0,0); cx.clearRect(0,0,W,W);
      // atmosphere
      var g=cx.createRadialGradient(ox,oy,R*0.6,ox,oy,R*1.25); g.addColorStop(0,'rgba(14,128,212,.18)'); g.addColorStop(1,'rgba(14,128,212,0)');
      cx.fillStyle=g; cx.beginPath(); cx.arc(ox,oy,R*1.25,0,7); cx.fill();
      cx.strokeStyle='rgba(120,190,255,.25)'; cx.lineWidth=1; cx.beginPath(); cx.arc(ox,oy,R,0,7); cx.stroke();
      // body dots, back side faint
      for(var i=0;i<P.length;i++){ var p=proj(P[i].lat,P[i].lon,1); if(p.z<0.02) continue; var L=P[i].land, a=(L?0.45:0.07)+(L?0.45:0.12)*p.z, s2=L?1.9:1.3; cx.fillStyle=(L?'rgba(120,195,255,':'rgba(150,205,255,')+a.toFixed(3)+')'; cx.fillRect(ox+p.x*R-s2/2,oy-p.y*R-s2/2,s2,s2); }
      // lanes
      for(var c=0;c<C.length;c++){
        cx.beginPath(); var first=true;
        for(var k=0;k<=40;k++){ var q=arc(HOME,C[c],k/40); if(q.z<-0.05){first=true;continue;} if(first){cx.moveTo(ox+q.x*R,oy-q.y*R);first=false;} else cx.lineTo(ox+q.x*R,oy-q.y*R); }
        cx.strokeStyle='rgba(56,170,255,.55)'; cx.lineWidth=1.4; cx.stroke();
        // a truck (bright dot with a tail) running the lane
        var k0=still?0.6:((t*0.12+seeds[c])%1);
        for(var tail=0;tail<6;tail++){ var kk=k0-tail*0.012; if(kk<0) continue; var q2=arc(HOME,C[c],kk); if(q2.z<0) continue;
          cx.fillStyle='rgba(255,255,255,'+(0.9-tail*0.14).toFixed(2)+')'; cx.beginPath(); cx.arc(ox+q2.x*R,oy-q2.y*R,tail?1.6:2.6,0,7); cx.fill(); }
      }
      // cities
      cx.font='600 '+Math.max(10,Math.round(W/48))+'px Inter,system-ui,sans-serif';
      C.concat([HOME]).forEach(function(m){
        var p=proj(m.lat,m.lon,1); if(p.z<0.05) return; var x=ox+p.x*R, y=oy-p.y*R, home=m===HOME;
        if(home){ var pr=(t*0.8)%1; cx.strokeStyle='rgba(94,234,212,'+(1-pr).toFixed(2)+')'; cx.lineWidth=2; cx.beginPath(); cx.arc(x,y,4+pr*16,0,7); cx.stroke(); }
        cx.fillStyle=home?'#5eead4':'#9fd3ff'; cx.beginPath(); cx.arc(x,y,home?4.5:2.8,0,7); cx.fill();
        if(LABEL[m.n]&&!small){ cx.fillStyle=home?'rgba(94,234,212,.95)':'rgba(220,236,255,.75)'; cx.fillText(m.n,x+7,y-6); }
      });
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })();

  /* ---------- 2 + 3. scroll-linked 3D on cards and screens ---------- */
  (function(){
    if(still) return;
    var cards=[].slice.call(document.querySelectorAll('.need,.net-stat')), mocks=[].slice.call(document.querySelectorAll('.mock'));
    cards.concat(mocks).forEach(function(el){ el.classList.add('s3d'); });
    var mouse={x:0,y:0}; if(fine) addEventListener('pointermove',function(e){ mouse.x=e.clientX/innerWidth-.5; mouse.y=e.clientY/innerHeight-.5; });
    var ticking=false;
    function update(){
      ticking=false; var vh=innerHeight;
      cards.forEach(function(el){
        var r=el.getBoundingClientRect(); if(r.bottom<0||r.top>vh) return;
        var k=Math.max(0,Math.min(1,(vh-r.top)/(vh*0.45))); // 0 just entering → 1 well in view
        el.style.setProperty('--rx',((1-k)*38).toFixed(1)+'deg'); el.style.setProperty('--tz',((1-k)*-60).toFixed(0)+'px');
      });
      mocks.forEach(function(el){
        var r=el.getBoundingClientRect(); if(r.bottom<0||r.top>vh) return;
        var c=(r.top+r.height/2-vh/2)/vh; // -0.5 above center … +0.5 below
        var flip=el.closest('.flip')?-1:1;
        el.style.setProperty('--ry',(flip*-14*Math.max(-1,Math.min(1,c*2))+mouse.x*8).toFixed(1)+'deg');
        el.style.setProperty('--rx',(Math.max(-1,Math.min(1,c*2))*10-mouse.y*6).toFixed(1)+'deg');
      });
    }
    function req(){ if(!ticking){ ticking=true; requestAnimationFrame(update); } }
    addEventListener('scroll',req,{passive:true}); addEventListener('resize',req); if(fine) addEventListener('pointermove',req);
    // the page's own reveal adds .in later; refresh once things have appeared
    setTimeout(update,800); update();
  })();
})();

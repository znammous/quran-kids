// يؤطّر اللقطات بعناوينها ويصدّرها بمقاسات المتجرين: node scripts/store/compose.cjs <lang>
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const L=process.argv[2]; const ROOT=path.join(__dirname,'../..');
const RTL=['ur','fa','ps','ar'].includes(L);
const meta=JSON.parse(fs.readFileSync(ROOT+'/store/l10n/'+L+'/listing.json','utf8'));
const dict=(()=>{ let d={}; const f=ROOT+'/lang/'+L+'.js'; if(fs.existsSync(f)) new Function('NUR_I18N',fs.readFileSync(f,'utf8'))({add:(c,m)=>{d=m}}); return d; })();   /* العربيّةُ بلا قاموس: نصوصُها في listing.json */
const OUT=ROOT+'/store/l10n/'+L;
const SIZES=[ {dir:'appstore/iphone-6.5',w:1284,h:2778,raw:'phone'}, {dir:'appstore/iphone-6.9',w:1290,h:2796,raw:'phone'},
              {dir:'appstore/ipad-13',w:2048,h:2732,raw:'ipad'}, {dir:'play/phone',w:1080,h:1920,raw:'phone'} ];
const SCENES=['1-path','2-games','3-seg','4-rec','5-mean','6-build','7-words','7-story','8-board','9-lang'];   /* 7-story: قائمةُ القصص من capture-games (العربيّة) */   /* ما لا لقطةَ خامّةً له يُتخطّى */
const b64=f=>'data:image/png;base64,'+fs.readFileSync(f).toString('base64');
const FONT=`@font-face{font-family:P;src:url(http://localhost:8765/fonts/ui/plex-arabic-700-arabic.woff2);font-weight:700}
@font-face{font-family:P;src:url(http://localhost:8765/fonts/ui/plex-arabic-700-latin.woff2);font-weight:700;unicode-range:U+0000-00FF,U+2000-206F}`;
const FAM= ['tr','bn','ha','uz'].includes(L) ? 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif' : 'P,system-ui,sans-serif';
const BG='radial-gradient(120% 55% at 50% 0%, #1d4f9f 0%, #0d2f6b 45%, #061b42 100%)';
function shotHTML(s,sz,img){
  const W=sz.w,H=sz.h, top=Math.round(H*0.16), pad=Math.round(W*0.035);
  const asp= sz.raw==='ipad' ? 1024/1366 : 390/844;
  let ih=Math.round(H-top-H*0.045-pad*2), iw=Math.round(ih*asp);
  const maxW=Math.round(W*(sz.raw==='ipad'?0.80:0.80)); if(iw>maxW){ iw=maxW; ih=Math.round(iw/asp); }
  const t=meta.screens[s]||{title:'',sub:''};
  /* ipad_flat: إطارُ صور iPad العربيّة الأولى — الشاشةُ عريضةٌ بحافّةٍ رفيعة، بلا هيكل جهاز */
  const flat=sz.raw==='ipad' && meta.ipad_flat;
  if(flat){ iw=Math.round(W*0.78); ih=Math.round(iw/asp); }
  return `<!doctype html><html dir="${RTL?'rtl':'ltr'}"><head><meta charset="utf-8"><style>${FONT}
  html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:${BG};font-family:${FAM};font-weight:700}
  .t,.s{white-space:nowrap;overflow:hidden}
  .t{position:absolute;top:${Math.round(H*0.045)}px;left:0;right:0;text-align:center;color:#fff;font-size:${Math.round(W*(sz.raw==='ipad'?0.058:0.083))}px;line-height:1.15;padding:0 ${pad}px}
  .s{position:absolute;top:${Math.round(H*0.045+W*(sz.raw==='ipad'?0.075:0.108))}px;left:0;right:0;text-align:center;color:#f5c542;font-size:${Math.round(W*(sz.raw==='ipad'?0.032:0.046))}px;padding:0 ${pad}px}
  .dev{position:absolute;left:50%;top:${top}px;transform:translateX(-50%);padding:${pad}px;background:#11161f;border:${Math.round(W*0.012)}px solid #3a4150;border-radius:${Math.round(iw*0.12)}px;box-shadow:0 30px 80px rgba(0,0,0,.45)}
  .dev img{display:block;width:${iw}px;height:${ih}px;border-radius:${Math.round(iw*0.085)}px;object-fit:cover}
  ${flat?`.dev{top:${Math.round(H*0.183)}px;padding:0;background:none;border:${Math.round(W*0.004)}px solid #2b3a5c;border-radius:${Math.round(W*0.012)}px}
  .dev img{border-radius:${Math.round(W*0.009)}px}`:''}
  </style></head><body><div class="t">${t.title}</div><div class="s">${t.sub}</div><div class="dev"><img src="${img}"></div>
  <script>document.querySelectorAll('.t,.s').forEach(function(e){ var f=parseFloat(getComputedStyle(e).fontSize); while(e.scrollWidth>e.clientWidth+1 && f>12){ f-=1; e.style.fontSize=f+'px'; } });</script></body></html>`;
}
function featureHTML(){
  const name=(meta.play_title||'Nur Al-Wahy').split(':')[0].trim();
  const chips=meta.feature_chips || [['🗺️',dict['المغامرة']],['📖',dict['المصحف']],['🕌',dict['مسجدي']],['💎',dict['الجواهر']]].filter(c=>c[1]);
  /* feature_langs: شريطٌ بأسماء اللغات مكانَ الشارات — كلٌّ بخطّه واتّجاهه */
  const LG=meta.feature_langs;
  return `<!doctype html><html dir="${RTL?'rtl':'ltr'}"><head><meta charset="utf-8"><style>${FONT}
  html,body{margin:0;width:1024px;height:500px;overflow:hidden;background:linear-gradient(160deg,#081a3d,#0f2f6b 60%,#173f8a);font-family:${FAM};font-weight:700;position:relative}
  .st{position:absolute;width:3px;height:3px;border-radius:50%;background:#cfe3ff;opacity:.6}
  .moon{position:absolute;top:118px;${RTL?'right':'left'}:60px;width:108px}
  .mosq{position:absolute;bottom:35px;${RTL?'left':'right'}:20px;width:315px}
  .n{position:absolute;top:95px;${RTL?'right':'left'}:200px;color:#fff;font-size:${name.length>14?62:84}px;line-height:1.1}
  .s{position:absolute;top:${name.length>14?185:205}px;${RTL?'right':'left'}:200px;width:560px;color:#f5c542;font-size:30px}
  .c{position:absolute;bottom:70px;${RTL?"right":"left"}:60px;display:flex;gap:12px;flex-wrap:nowrap;width:640px}
  .lh{position:absolute;bottom:172px;${RTL?"right":"left"}:60px;color:#f5c542;font-size:24px}
  .lg{position:absolute;bottom:34px;${RTL?"right":"left"}:60px;width:620px;display:flex;flex-wrap:wrap;gap:8px}
  .lg bdi{border:1.5px solid rgba(245,197,66,.55);border-radius:999px;padding:4px 11px;color:#fff;font-size:16px;white-space:nowrap;background:rgba(255,255,255,.06);font-family:P,system-ui,sans-serif}
  .c span{border:2px solid rgba(245,197,66,.6);border-radius:999px;padding:7px 14px;color:#fff;font-size:20px;white-space:nowrap;background:rgba(255,255,255,.06)}
  </style></head><body>${Array.from({length:40},(_,i)=>`<i class="st" style="left:${(i*97)%1024}px;top:${(i*53)%500}px"></i>`).join('')}
  <img class="moon" src="${b64(__dirname+'/moon.png')}"><img class="mosq" src="${b64(__dirname+'/mosque.png')}">
  <div class="n">${name}</div><div class="s">${meta.appstore_subtitle||''}</div>
  ${LG ? `<div class="lh">${LG.head}</div><div class="lg">${LG.names.map(n=>`<bdi>${n}</bdi>`).join('')}</div>`
       : `<div class="c">${chips.map(c=>`<span>${c[0]} ${c[1]}</span>`).join('')}</div>`}</body></html>`;
}
(async()=>{
  const b=await chromium.launch({channel:'chrome'}); let n=0;
  for(const sz of SIZES){
    fs.mkdirSync(OUT+'/'+sz.dir,{recursive:true});
    const p=await b.newPage({viewport:{width:sz.w,height:sz.h},deviceScaleFactor:1});
    for(const s of SCENES){
      const raw=ROOT+'/store/l10n/_raw/'+L+'/'+sz.raw+'/'+s+'.png'; if(!fs.existsSync(raw)) continue;
      await p.setContent(shotHTML(s,sz,b64(raw)),{waitUntil:'load'}); await p.waitForTimeout(150);
      await p.screenshot({path:OUT+'/'+sz.dir+'/'+s+'.jpg',type:'jpeg',quality:90}); n++;
    }
    await p.close();
  }
  const p=await b.newPage({viewport:{width:1024,height:500}}); await p.setContent(featureHTML(),{waitUntil:'load'}); await p.waitForTimeout(200);
  fs.mkdirSync(OUT+'/play',{recursive:true}); await p.screenshot({path:OUT+'/play/feature-1024x500.jpg',type:'jpeg',quality:92});
  await b.close(); console.log(L,'images',n+1);
})();

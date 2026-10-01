// يلتقط المشاهد الثمانية بلغةٍ ومقاسٍ من الحساب المزروع: node scripts/store/capture.cjs <lang> <phone|ipad>
const {chromium}=require('playwright'); const fs=require('fs');
const L=process.argv[2]||'en', DEV=process.argv[3]||'phone';
const ROOT=require('path').join(__dirname,'../..'); const OUT=ROOT+'/store/l10n/_raw/'+L+'/'+DEV; fs.mkdirSync(OUT,{recursive:true});
const VP= DEV==='ipad' ? {width:1024,height:1366,dsf:2} : {width:390,height:844,dsf:3};
const LTR=['en','id','ms','bn','tr','fr','sw','ha','uz','so'];
let db=JSON.parse(fs.readFileSync(__dirname+'/seed_db.json','utf8'));
if(LTR.includes(L)){ db.players[0].name='Maryam'; db.players[1].name='Omar'; }
const HIDE='#qaBar,#setInstall,[id*="nstallBan"],.instbar,.toast{display:none!important}';
(async()=>{
  const b=await chromium.launch({channel:'chrome'});
  const ctx=await b.newContext({viewport:{width:VP.width,height:VP.height},deviceScaleFactor:VP.dsf,isMobile:DEV!=='ipad',hasTouch:true});
  const errs=[];
  async function page(qa){
    const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
    await p.addInitScript(([l,d])=>{ localStorage.clear(); localStorage.setItem('nur_lang',l); localStorage.setItem('nur_db',d); },[L,JSON.stringify(db)]);
    await p.goto('http://localhost:8765/index.html'+(qa?'?qa=1':'')); await p.waitForTimeout(2200);
    await p.addStyleTag({content:HIDE});
    await p.evaluate(()=>{ document.querySelectorAll('.modal-bg').forEach(m=>m.hidden=true); });
    return p;
  }
  const snap=async(p,name)=>{ await p.waitForTimeout(900); await p.screenshot({path:OUT+'/'+name+'.png'}); };
  const adab=async p=>{ for(let i=0;i<4;i++){ await p.waitForTimeout(500); await p.evaluate(()=>{ const a=document.getElementById('btnAdabOk'); if(a&&a.offsetParent) a.click(); }); } await p.waitForTimeout(700); };
  /* حتى تظهر المرحلة: يُصرف الدعاءُ ويُضغط «ابدأ» ما بقيا */
  const toStage=async p=>{ for(let i=0;i<6;i++){ const ok=await p.evaluate(()=>{ const a=document.getElementById('btnAdabOk'); if(a&&a.offsetParent){ a.click(); return false; } const g=document.getElementById('mfGoBtn'); if(g&&g.offsetParent){ g.click(); return false; } return !!document.querySelector('#playArea') && !!document.querySelector('#playArea').offsetParent; }); if(ok) break; await p.waitForTimeout(700); }
    await p.waitForTimeout(800); await p.evaluate(()=>{ const s=document.getElementById('mfSheet'); if(s && !s.hidden){ const x=document.getElementById('mfClose'); if(x) x.click(); } }); await p.waitForTimeout(500); };
  const noQA=async p=>p.addStyleTag({content:'#qaSkip,#qaEnd,#qaBar{visibility:hidden!important}'});
  const MULK=()=>{ const s=SURAHS[66]; curSurah=s; startSeg(s,0); };
  // 1 path
  { const p=await page(); await p.evaluate(()=>{ curSurah=SURAHS[66]; renderPath(); show('scr-path'); window.scrollTo(0,0); }); await snap(p,'1-path'); await p.close(); }
  // 2 games
  { const p=await page(); await p.evaluate(()=>{ show('scr-games'); advGo('games'); window.scrollTo(0,0); }); await snap(p,'2-games'); await p.close(); }
  // 3 seg (mushaf page with section highlighted)
  { const p=await page(); await p.evaluate(MULK); await adab(p); await p.waitForTimeout(1500); await snap(p,'3-seg');
  // 5 mean (same page, meanings panel)
    await p.evaluate(()=>{ mfPanel('mfMean'); mfMeanRender(); }); await p.waitForTimeout(1800); await snap(p,'5-mean'); await p.close(); }
  // 4 rec (read stage with recording on)
  { const p=await page(); await p.evaluate(()=>{ SET.rec=true; }); await p.evaluate(MULK); await toStage(p); await snap(p,'4-rec'); await p.close(); }
  // 6 build
  { const p=await page(); await p.evaluate(()=>{ renderBuild(); show('scr-build'); window.scrollTo(0,0); }); await snap(p,'6-build'); await p.close(); }
  // 7 words (QA: finish read stage → word order)
  { const p=await page(true); await p.evaluate(MULK); await toStage(p);
    await p.evaluate(()=>{ const e=document.getElementById('qaEnd'); if(e) e.click(); }); await p.waitForTimeout(1500);
    for(let i=0;i<4;i++){ await p.evaluate(()=>{ document.querySelectorAll('.cele').forEach(x=>{ x.click&&x.click(); }); const n=document.getElementById('btnNextStage'); if(n&&n.offsetParent) n.click(); }); await p.waitForTimeout(700); }
    await toStage(p); await p.waitForTimeout(600);
    for(let i=0;i<2;i++){ await p.evaluate(()=>{ const c=[...document.querySelectorAll('#playArea .chip')].filter(x=>x.offsetParent&&!x.disabled); const want=(S&&S.cur&&S.cur.words)?null:null; if(c.length) c[0].click(); }); await p.waitForTimeout(350); }
    await noQA(p); await snap(p,'7-words'); await p.close(); }
  // 8 board
  { const p=await page(); await p.evaluate(()=>{ renderBoard(); show('scr-board'); window.scrollTo(0,0); }); await snap(p,'8-board'); await p.close(); }
  await b.close(); console.log(L,DEV,'errors',errs.slice(0,3));
})();

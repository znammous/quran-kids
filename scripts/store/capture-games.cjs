// يلتقط الألعابَ وهي تُلعب، لمربّعات صفحة الهبوط: node scripts/store/capture-games.cjs <lang>
// ← store/l10n/_raw/<lang>/games/ — runner وshelf وbird في منتصف اللعب، وgift وfam شاشتاهما
const {chromium}=require('playwright'); const fs=require('fs');
const L=process.argv[2]||'ar';
const ROOT=require('path').join(__dirname,'../..'); const OUT=ROOT+'/store/l10n/_raw/'+L+'/games'; fs.mkdirSync(OUT,{recursive:true});
const LTR=['en','id','ms','bn','tr','fr','sw','ha','uz','so'];
let db=JSON.parse(fs.readFileSync(__dirname+'/seed_db.json','utf8'));
if(LTR.includes(L)){ db.players[0].name='Maryam'; db.players[1].name='Omar'; }
const HIDE='#qaBar,#setInstall,[id*="nstallBan"],.instbar,.toast{display:none!important}';
(async()=>{
  const b=await chromium.launch({channel:'chrome'});
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const errs=[];
  async function page(){
    const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
    await p.addInitScript(([l,d])=>{ localStorage.clear(); localStorage.setItem('nur_lang',l); localStorage.setItem('nur_db',d); },[L,JSON.stringify(db)]);
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2200);
    await p.addStyleTag({content:HIDE});
    await p.evaluate(()=>{ document.querySelectorAll('.modal-bg').forEach(m=>m.hidden=true); });
    return p;
  }
  const snap=async(p,name)=>{ await p.screenshot({path:OUT+'/'+name+'.png'}); };
  // عدّاء الآيات: يجري ثمّ يُلتقط والكلماتُ أمامه
  { const p=await page(); await p.evaluate(()=>{ runOpen('mem'); }); await p.waitForTimeout(900);
    await p.evaluate(()=>{ $('runStart').click(); }); await p.waitForTimeout(2600); await snap(p,'runner'); await p.close(); }
  // رفّ الآيات: الصناديقُ تنزل
  { const p=await page(); await p.evaluate(()=>{ shelfOpen('mem'); }); await p.waitForTimeout(900);
    await p.evaluate(()=>{ $('shelfStart').click(); }); await p.waitForTimeout(2200); await snap(p,'shelf'); await p.close(); }
  // عصفور الآيات: يُنقر ليبقى طائراً
  { const p=await page(); await p.evaluate(()=>{ birdOpen('mem'); }); await p.waitForTimeout(900);
    await p.evaluate(()=>{ $('birdStart').click(); });
    for(let i=0;i<9;i++){ await p.keyboard.press('Space'); await p.waitForTimeout(260); }
    await snap(p,'bird'); await p.close(); }
  // اصنع هديّتك وعائلتي: من قائمة الألعاب
  { const p=await page(); await p.evaluate(()=>{ gamesOpen(); $('gmGift').click(); window.scrollTo(0,0); }); await p.waitForTimeout(1200); await snap(p,'gift'); await p.close(); }
  { const p=await page(); await p.evaluate(()=>{ gamesOpen(); $('gmFam').click(); window.scrollTo(0,0); }); await p.waitForTimeout(1200); await snap(p,'fam'); await p.close(); }
  await b.close(); console.log(L,'games errors',errs.slice(0,3));
})();

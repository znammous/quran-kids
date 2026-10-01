/* جولةُ الترجمة الحيّة: يفتح التطبيقَ في متصفّحٍ بلغةٍ غير العربيّة، ويضغط أزرارَه
   مئاتِ المرّات في شاشاته كلِّها وفي درسٍ كامل، ويجمع كلَّ نصٍّ عربيٍّ ظهر ولم يُترجَم.
   يلتقط ما لا يراه الفحصُ الثابت (scripts/i18n-check.mjs): الجملَ التي تُركَّب وقتَ العرض.

   يحتاج Playwright ومتصفّح Chrome، ولا يدخل في حزمة التطبيق:
     npm i --no-save playwright
   التشغيل:
     node scripts/i18n-harvest.mjs            الأرديّة، ٤ جولات × ٣٠٠ ضغطة
     node scripts/i18n-harvest.mjs ur 6 400   اللغة، عددُ الجولات، الضغطاتُ في كلّ جولة
   والناتج: ما لم يُترجَم، بعد إسقاط الآيات والتفسير والغريب وأسماء السور والقرّاء
   وما في lang/i18n-ignore.json — ويُحفظ كاملاً في /tmp/i18n-harvest-<رمز>.json */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';

const [LANG = 'ur', RUNS = '4', STEPS = '300'] = process.argv.slice(2);
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('يحتاج Playwright:  npm i --no-save playwright'); process.exit(2); }

/* ---------- خادمٌ صغيرٌ للمجلّد: الصفحةُ تجلب بياناتها بـ fetch فلا تعمل من file:// ---------- */
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.webmanifest': 'application/json' };
const server = createServer((q, r) => {
  const p = join('.', decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  r.end(readFileSync(p));
}).listen(0);
const URL0 = `http://localhost:${server.address().port}/index.html`;

/* ---------- ما لا يُترجم أصلاً: آياتٌ وتفسيرٌ وغريبٌ وأسماء ---------- */
const norm = s => s.replace(/\s+/g, ' ').trim();
const content = new Set();
const addC = x => {
  if (typeof x === 'string') { const t = norm(x); if (t.length > 1) content.add(t); }
  else if (Array.isArray(x)) x.forEach(addC);
  else if (x && typeof x === 'object') Object.values(x).forEach(addC);
};
for (const f of readdirSync('data/tafsir')) addC(JSON.parse(readFileSync('data/tafsir/' + f, 'utf8')));
addC(JSON.parse(readFileSync('data/gharib.json', 'utf8')));
const SURAHS = JSON.parse(readFileSync('data/quran.js', 'utf8').match(/var SURAHS = (\[.*?\]);\s*\n/s)[1]);
const names = new Set(SURAHS.map(s => s.name));
SURAHS.forEach(s => s.ayat.forEach(addC));
const words = new Set([...content].filter(c => c.length < 400).flatMap(c => c.split(' ')));
const ignore = new Set(existsSync('lang/i18n-ignore.json') ? JSON.parse(readFileSync('lang/i18n-ignore.json', 'utf8')) : []);
const QARI = /^(محمود|محمد|عبد|علي|مشاري|سعود|ماهر|أبو بكر|سعد|ناصر|ياسر|أحمد|خليفة|محسن|صلاح|المنشاوي|الحصري)/;
const core = s => { const m = s.match(/^([^؀-ۿ]*)([\s\S]*?[؀-ۿ])([^؀-ۿ]*)$/); return m ? m[2] : s; };
function isContent(s) {
  const p = norm(s.replace(/<[^>]*>/g, '')).replace(/^[:\s]+/, ''), c = core(p);
  if (content.has(p) || content.has(c) || p.includes('﴿')) return true;
  if (!c.includes(' ') && words.has(c)) return true;
  if (/^\d+\. /.test(p) || names.has(c) || names.has(c.replace(/^سورة /, ''))) return true;
  return QARI.test(p) || ignore.has(s);
}

/* ---------- الجولة ---------- */
const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
const miss = new Set(), errors = new Set();
async function page() {
  const p = await browser.newPage({ viewport: { width: 400, height: 860 } });
  p.on('pageerror', e => errors.add(e.message.slice(0, 160)));
  p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.addInitScript(l => {
    localStorage.setItem('nur_lang', l);
    window.__miss = new Set(); window.__nurHarvest = k => window.__miss.add(k);
    window.print = () => {}; window.open = () => null;
  }, LANG);
  await p.goto(URL0); await p.waitForTimeout(2500);
  return p;
}
const collect = async p => (await p.evaluate(() => [...window.__miss])).forEach(k => miss.add(k));

const SCREENS = ['scr-start','scr-map','scr-path','scr-juz','scr-rev','scr-revpath','scr-exam','scr-bqn','scr-build',
  'scr-shop','scr-badges','scr-board','scr-games','scr-story','scr-shelf','scr-cert','scr-tree','scr-report','scr-settings','scr-look'];
const CLICK = (r, scope) => {
  const vis = e => { if (e.hidden || e.disabled) return false; const b = e.getBoundingClientRect();
    return b.width && b.height && getComputedStyle(e).visibility !== 'hidden' && b.bottom > 0 && b.top < innerHeight * 3; };
  let els = [...document.querySelectorAll(scope)].filter(vis);
  const modal = [...document.querySelectorAll('.modal-bg')].find(m => !m.hidden && m.getClientRects().length);
  if (modal) els = els.filter(e => modal.contains(e));
  /* لا يُمسّ ما يُتلف البيانات أو يغادر الصفحة */
  els = els.filter(e => !/btnReset|btnDelPlayer|btnImport|fileInput|btnPrivacy|btnInstall|btnLang/.test(e.id || ''));
  if (els.length) els[Math.floor(r * els.length)].click();
};
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

for (let run = 0; run < +RUNS; run++) {
  const p = await page();
  for (let i = 0; i < +STEPS; i++) {
    try {
      if (i % 30 === 0) await p.evaluate(s => { try { document.querySelectorAll('.modal-bg').forEach(m => m.hidden = true); show(s); } catch (e) {} },
        SCREENS[Math.floor(rnd() * SCREENS.length)]);
      await p.evaluate(CLICK, rnd(), 'button,.opt,.chip,.acard,[data-gi],.pnode,.gbtn,.chipsel,.pchip,[role=button]');
      await p.waitForTimeout(120 + Math.floor(rnd() * 150));
    } catch (e) {}
  }
  await collect(p); await p.close();
  process.stdout.write(`جولة ${run + 1}/${RUNS}… `);
}
/* ودرسٌ كامل: المراحلُ الخمس في سورٍ قصيرة */
{
  const p = await page();
  for (const n of [114, 113, 112, 1]) {
    await p.evaluate(n => { try { document.querySelectorAll('.modal-bg').forEach(m => m.hidden = true);
      const s = SURAHS[n - 1]; curSurah = s; startSeg(s, 0); } catch (e) {} }, n);
    await p.waitForTimeout(700);
    for (let i = 0; i < 120; i++) {
      try { await p.evaluate(CLICK, rnd(), '.screen.active button,.screen.active .opt,.screen.active .chip,.screen.active .acard,.modal-bg:not([hidden]) button');
            await p.waitForTimeout(140); } catch (e) {}
    }
  }
  await collect(p); await p.close();
}
await browser.close(); server.close();

/* النصُّ المترجَمُ نفسُه يُسجَّل أحياناً (حروفُ الأرديّة وحدها لا تميّزه دائماً): يُسقط ما هو قيمةٌ في القاموس */
let dict = {};
new Function('NUR_I18N', readFileSync(`lang/${LANG}.js`, 'utf8'))({ add: (c, m) => { dict = m; } });
const numKey = s => { let i = 0; return s.replace(/[0-9٠-٩]+/g, () => '{' + (i++) + '}'); };
const values = new Set(Object.values(dict).flatMap(v => [norm(v), norm(core(v))]));
const keys = new Set(Object.keys(dict).map(norm));
const MONTH = /^[0-9٠-٩]+ (محرم|صفر|ربيع الأول|ربيع الآخر|جمادى الأولى|جمادى الآخرة|رجب|شعبان|رمضان|شوال|ذو القعدة|ذو الحجة)/;
const done = s => {
  const t = norm(s.replace(/<[^>]*>/g, ' ')), c = core(t);
  return values.has(t) || values.has(c) || values.has(numKey(c)) || values.has(norm(numKey(t)))
      || (s.includes('<') && (keys.has(c) || keys.has(numKey(c))))  /* «<i>🏠</i>الرئيسية»: تُرجمت كلمتُه */
      || !/[؀-ٟ٪-ۿ]/.test(c) || MONTH.test(t);
};
const out = [...miss].filter(s => !isContent(s) && !done(s) &&!/[ٹڈڑکگںھہۃیےټډړښږځڅۍېګپچژ]/.test(s));   /* حروفُ الأرديّة والبشتو والفارسيّة: نصٌّ مترجَمٌ لا عربيّ */
writeFileSync(`/tmp/i18n-harvest-${LANG}.json`, JSON.stringify(out, null, 1));
console.log(`\n\nنصوصٌ ظهرت ولم تُترجَم (${out.length}):`);
out.forEach(s => console.log('   • ' + (s.length > 140 ? s.slice(0, 140) + '…' : s)));
if (errors.size) { console.log('\nأخطاءُ الصفحة أثناء الجولة:'); errors.forEach(e => console.log('   ! ' + e)); }

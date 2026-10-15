/* مسحُ الترجمة الشامل: يكمّل i18n-harvest. ذاك يضغط أزراراً عشوائيّة في حسابٍ فارغ فلا يبلغ
   شاشاتٍ تحتاج حالاً (مراحلُ البداية، نهايةُ جلسة المراجعة، سؤالُ الاختبار، نافذةُ حذف مستخدم…).
   وهذا يفتح التطبيقَ بحسابٍ مزروعٍ فيه تقدّم (scripts/store/seed_db.json)، ويستدعي كلَّ دالّةٍ في
   الصفحة واحدةً واحدة — بلا معاملاتٍ ثمّ بسورةٍ أو رقم — ويضغط بعدها، ثمّ يقرأ ما على الشاشة نفسِه:
   كلُّ نصٍّ ظاهرٍ فيه حرفٌ عربيٌّ وليس بخطّ المصحف ولا داخل translate="no" فهو لم يُترجم.
   يحتاج Playwright وChrome:  npm i --no-save playwright
   التشغيل:  node scripts/i18n-sweep.mjs [رمز اللغة، الافتراضيّ en]
   والناتج: كلُّ نصٍّ ومعه الدالّةُ التي أظهرته — ويُحفظ في /tmp/i18n-sweep-<رمز>.json */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
const LANG = process.argv[2] || 'en';
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('يحتاج Playwright:  npm i --no-save playwright'); process.exit(2); }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.webmanifest': 'application/json' };
const server = createServer((q, r) => {
  const p = join('.', decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  r.end(readFileSync(p));
}).listen(0);
const URL0 = `http://localhost:${server.address().port}/index.html`;

/* ---------- ما لا يُترجم أصلاً: الآياتُ والتفسيرُ والغريبُ وأسماءُ السور والقرّاء ---------- */
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
const AR = /[؀-٩٫-ۿ]/;   /* بلا ٪: علامةُ النسبة تبقى في الأرقام */
function isContent(s) {
  const p = norm(s).replace(/^[^؀-ۿ]+|[^؀-ۿ]+$/g, '');
  /* ألفُ الوصل والتطويل لا تكونان إلّا في نصّ المصحف: مقاطعُ الآيات في الألعاب */
  if (/[ٱـ]/.test(p)) return true;
  if (!p || content.has(p) || s.includes('﴿')) return true;
  if (!p.includes(' ') && words.has(p)) return true;
  if (names.has(p) || names.has(p.replace(/^سورة /, ''))) return true;
  /* حروفُ الأرديّة والبشتو والفارسيّة: نصٌّ مترجَمٌ لا عربيّ */
  if (/[ٹڈڑکگںھہۃیےټډړښږځڅۍېګپچژ]/.test(s)) return true;
  return QARI.test(p) || ignore.has(s);
}

/* ---------- الحسابُ المزروع ---------- */
const db = JSON.parse(readFileSync('scripts/store/seed_db.json', 'utf8'));
if (LANG !== 'ar') { db.players[0].name = 'Maryam'; if (db.players[1]) db.players[1].name = 'Omar'; }

/* ما لا يُستدعى: يمسح أو يغادر الصفحة أو يفتح ملفّاً أو ينتظر الشبكة */
const SKIP = /reset|wipe|clear|del|remove|import|restore|backup|export|share|download|print|reload|install|upd|live|exit|quit|lang|pick|file|purge|fetch|load|sync|seed|harvest|tx$|^on|ready|boot|start$|^init|navBack|history|blob|zip|cache/i;

const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
const found = new Map();   /* النصّ ← الدالّةُ التي أظهرته */
const errors = new Set();

async function page() {
  const p = await browser.newPage({ viewport: { width: 400, height: 860 } });
  p.on('pageerror', () => {});
  p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.addInitScript(([l, d]) => {
    localStorage.clear(); localStorage.setItem('nur_lang', l); localStorage.setItem('nur_db', d);
    window.print = () => {}; window.open = () => null;
  }, [LANG, JSON.stringify(db)]);
  await p.goto(URL0); await p.waitForTimeout(2200);
  return p;
}
/* ما على الشاشة بالعربيّة: نصٌّ ظاهرٌ، ليس بخطّ المصحف ولا داخل translate="no" */
const SCAN = () => {
  const out = [], AR = /[؀-٩٫-ۿ]/;
  const quran = el => /Amiri Quran|UthmanicHafs|SuraNames|Nastaliq/.test(getComputedStyle(el).fontFamily.split(',')[0]);
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) {
    if (!AR.test(n.nodeValue)) continue;
    const el = n.parentElement; if (!el || el.closest('[translate=no],script,style,svg,title')) continue;
    if (!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') continue;
    if (quran(el)) continue;
    out.push((el.closest('p,li,button,h1,h2,h3,label,.gline,.sub,.ttl,div') || el).textContent.replace(/\s+/g, ' ').trim().slice(0, 300));
  }
  return [...new Set(out)];
};
const CLICK = r => {
  const vis = e => { if (e.hidden || e.disabled) return false; const b = e.getBoundingClientRect(); return b.width && b.height; };
  let els = [...document.querySelectorAll('button,.opt,.chip,.acard,[data-gi],.pnode,.gbtn,.chipsel,.pchip,[role=button]')].filter(vis);
  const modal = [...document.querySelectorAll('.modal-bg')].find(m => !m.hidden && m.getClientRects().length);
  if (modal) els = els.filter(e => modal.contains(e));
  els = els.filter(e => !/Reset|Del|Import|file|Privacy|Install|Lang/i.test(e.id || ''));
  if (els.length) els[Math.floor(r * els.length)].click();
};
const record = async (p, tag) => {
  try { for (const s of await p.evaluate(SCAN)) if (!found.has(s)) found.set(s, tag); } catch (e) {}
};

/* أسماءُ الدوالّ: ما عرّفته الصفحةُ نفسُها */
let fns;
{ const p = await page();
  fns = await p.evaluate(src => Object.keys(window).filter(k => {
    try { const f = window[k]; return typeof f === 'function' && !/\[native code\]/.test(Function.prototype.toString.call(f)) && !new RegExp(src, 'i').test(k); }
    catch (e) { return false; } }), SKIP.source);
  await record(p, 'البداية'); await p.close(); }
process.stdout.write(`دوالّ: ${fns.length}\n`);

const ARGS = [[], ['__S'], [0], [1]];   /* __S: سورةُ الملك (٦٧) */
const BATCH = 15;
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < fns.length; i += BATCH) {
  const p = await page();
  for (const f of fns.slice(i, i + BATCH)) for (const a of ARGS) {
    try {
      await Promise.race([
        p.evaluate(([f, a]) => { document.querySelectorAll('.modal-bg').forEach(m => m.hidden = true);
          const args = a.map(x => x === '__S' ? SURAHS[66] : x); try { window[f].apply(null, args); } catch (e) {} }, [f, a]),
        new Promise(r => setTimeout(r, 1500))]);
      await p.waitForTimeout(160); await record(p, f + '(' + a.join(',') + ')');
      for (let k = 0; k < 3; k++) { await p.evaluate(CLICK, rnd()).catch(() => {}); await p.waitForTimeout(120); await record(p, f + ' ← ضغطة'); }
    } catch (e) { errors.add(f + ': ' + String(e.message).slice(0, 80)); }
  }
  await p.close().catch(() => {});
  process.stdout.write(`${Math.min(i + BATCH, fns.length)}/${fns.length} `);
}
await browser.close(); server.close();

const out = [...found].filter(([s]) => AR.test(s) && !isContent(s));
writeFileSync(`/tmp/i18n-sweep-${LANG}.json`, JSON.stringify(out, null, 1));
console.log(`\n\nنصوصٌ ظهرت بالعربيّة (${out.length}):`);
out.forEach(([s, f]) => console.log('   • ' + (s.length > 150 ? s.slice(0, 150) + '…' : s) + '   [' + f + ']'));

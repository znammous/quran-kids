/* يجمع ما يحتاجه التطبيقُ الأصليّ في www/ — ولا شيءَ غيرَه.
   خارجَه: القصص (تُجلب من الشبكة فتُضاف بلا تحديث)، وعاملُ الخدمة (لا يعمل
   داخل التطبيق)، وgames.html (لغير مؤلّفينا)، والـ PDF وأدواتُ المحرّر. */
import { rmSync, mkdirSync, cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const OUT = 'www';
const FILES = ['index.html', 'privacy.html', 'manifest.webmanifest'];
const DIRS  = ['data', 'fonts', 'icons', 'lang'];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const f of FILES) cpSync(f, `${OUT}/${f}`);
for (const d of DIRS) {
  if (!existsSync(d)) throw new Error(`مفقود: ${d}/`);
  /* من lang/ القواميسُ وحدَها: الدليلُ وقائمةُ التجاهل لأدوات الفحص لا للتطبيق */
  cpSync(d, `${OUT}/${d}`, { recursive: true,
    filter: f => !(d === 'lang' && /\.(md|json)$/.test(f)) });
}
/* رقمُ الحزمة: بصمةُ محتواها، لا رقمٌ يُكتب باليد. يقارنه التطبيقُ برقم آخر
   حزمةٍ منشورة فيعرف أنّ عنده تحديثاً (انظر «التحديث الحيّ» في index.html) */
const all = readdirSync(OUT, { recursive: true, withFileTypes: true })
  .filter(e => e.isFile())
  .map(e => `${e.parentPath ?? e.path}/${e.name}`.split('\\').join('/'))
  .sort();
const h = createHash('sha256');
/* خطوطُ الأوجه خارجَ البصمة وخارجَ حزمة التحديث: لا تتغيّر، وتصل مع التطبيق مرّةً واحدة */
const inBundle = f => !f.startsWith(`${OUT}/fonts/pages/`);
for (const f of all.filter(inBundle)) { h.update(f.slice(OUT.length + 1)); h.update(readFileSync(f)); }
const id = h.digest('hex').slice(0, 12);
/* الجديدُ في هذا التحديث (WHATSNEW في index.html) بترجماته من lang/*.js: يحمله
   وصفُ الإصدار على GitHub فيقرأه التطبيقُ بلغته قبل أن ينزّل الحزمة. وما لا
   ترجمةَ له يُترك، فيعود التطبيقُ إلى العربيّة */
const note = {};
const m = readFileSync('index.html', 'utf8').match(/^var WHATSNEW='((?:[^'\\]|\\.)*)';/m);
const ar = m ? m[1].replace(/\\(.)/g, '$1').trim() : '';
if (ar) {
  note.ar = ar;
  const norm = s => s.replace(/\s+/g, ' ').trim();
  for (const f of readdirSync('lang').filter(f => /^[a-z]{2,3}\.js$/.test(f))) {
    let d = null;
    new Function('NUR_I18N', readFileSync(`lang/${f}`, 'utf8'))({ add: (c, map) => { d = map; } });
    for (const k in d) if (norm(k) === norm(ar)) { note[f.slice(0, -3)] = d[k]; break; }
  }
}
writeFileSync(`${OUT}/bundle.json`, JSON.stringify(ar ? { id, note } : { id }) + '\n');
console.log(`www/ جاهز: ${all.length} ملفّاً، والحزمة ${id}`);

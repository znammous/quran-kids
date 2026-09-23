/* يجمع ما يحتاجه التطبيقُ الأصليّ في www/ — ولا شيءَ غيرَه.
   خارجَه: القصص (تُجلب من الشبكة فتُضاف بلا تحديث)، وعاملُ الخدمة (لا يعمل
   داخل التطبيق)، وgames.html (لغير مؤلّفينا)، والـ PDF وأدواتُ المحرّر. */
import { rmSync, mkdirSync, cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const OUT = 'www';
const FILES = ['index.html', 'privacy.html', 'manifest.webmanifest'];
const DIRS  = ['data', 'fonts', 'icons'];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const f of FILES) cpSync(f, `${OUT}/${f}`);
for (const d of DIRS) {
  if (!existsSync(d)) throw new Error(`مفقود: ${d}/`);
  cpSync(d, `${OUT}/${d}`, { recursive: true });
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
writeFileSync(`${OUT}/bundle.json`, JSON.stringify({ id }) + '\n');
console.log(`www/ جاهز: ${all.length} ملفّاً، والحزمة ${id}`);

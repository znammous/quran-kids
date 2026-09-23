/* يجمع ما يحتاجه التطبيقُ الأصليّ في www/ — ولا شيءَ غيرَه.
   خارجَه: القصص (تُجلب من الشبكة فتُضاف بلا تحديث)، وعاملُ الخدمة (لا يعمل
   داخل التطبيق)، وgames.html (لغير مؤلّفينا)، والـ PDF وأدواتُ المحرّر. */
import { rmSync, mkdirSync, cpSync, existsSync } from 'node:fs';

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
console.log(`www/ جاهز: ${FILES.length} ملفّات و${DIRS.length} مجلّدات`);

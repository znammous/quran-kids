/* فهرسُ البحث في القصص: نصوصُ صفحاتها كلُّها في ملفٍّ واحد، يُجلب عند أوّل بحث
   — فالقصّةُ نفسُها لا تُنزَّل إلّا حين تُفتح، ولا يُبحث في نصٍّ لم يصل.
   التشغيل:  npm run stories          يكتب stories/q.json وstories/<لغة>/q.json
             npm run stories -- --check   يفشل (رمز 1) إن كان فهرسٌ لا يطابق القصص
   ويُشغَّل بعد كلّ قصّةٍ تُضاف أو تُعدَّل أو تُترجم (و«npm run i18n» ينبّه إن نُسي). */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const D = 'stories/';
const rd = f => JSON.parse(readFileSync(D + f, 'utf8'));
const text = f => (rd(f).pages || []).map(p => typeof p === 'string' ? p : (p.x || '')).join('\n\n');
const SI = rd('index.json').stories;
const rev = x => (x && x.rev) | 0 || 1;

/* { s: { <id>: { r: مراجعتُها, x: نصُّها } } } — والمترجمُ بمراجعة ترجمته، فلا يُبحث
   في ترجمةٍ قديمةٍ لقصّةٍ عُدّلت بعدها (تُعرض بالعربيّة، فيُبحث في العربيّة) */
export function build() {
  const out = { 'q.json': { s: Object.fromEntries(SI.map(x => [x.id, { r: rev(x), x: text(x.file || `s/${x.id}.json`) }])) } };
  for (const c of readdirSync(D).filter(c => /^[a-z]{2}$/.test(c) && existsSync(`${D}${c}/index.json`))) {
    const L = rd(`${c}/index.json`).stories || {}, s = {};
    for (const x of SI) {
      const t = L[x.id];
      if (t && existsSync(`${D}${c}/s/${x.id}.json`)) s[x.id] = { r: rev(t), x: text(`${c}/s/${x.id}.json`) };
    }
    out[`${c}/q.json`] = { s };
  }
  for (const f in out) out[f] = JSON.stringify(out[f]) + '\n';
  return out;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const out = build(), stale = Object.keys(out).filter(f => !existsSync(D + f) || readFileSync(D + f, 'utf8') !== out[f]);
  if (process.argv.includes('--check')) {
    if (stale.length) { console.log('فهرسُ البحث قديم: ' + stale.join('، ') + ' — شغّل npm run stories'); process.exit(1); }
    console.log('فهرسُ البحث مطابق ✓');
  } else {
    for (const f of stale) writeFileSync(D + f, out[f]);
    console.log(stale.length ? 'كُتب: ' + stale.join('، ') : 'لا تغيير ✓');
  }
}

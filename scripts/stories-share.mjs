/* صفحاتُ مشاركة القصص: رابطُ القصّة إذا أُرسل (واتساب، تيليجرام…) قرأ التطبيقُ المُرسَلُ
   إليه وسومَ og منه فعرض غلافَها وعنوانَها ووصفَها — وهو لا يشغّل الشيفرة، فلكلّ قصّةٍ
   صفحةٌ ثابتةٌ بوسومها: stories/p/<id>.html، والمترجمةُ stories/<لغة>/p/<id>.html.
   ومن فتحها نُقل إلى القصّة في الصفحة (index.html#story=<id>).
   وصورةُ المعاينة stories/og/<id>.jpg من الغلاف العريض — فـWebP لا تقرؤه كلُّ التطبيقات —
   تُحوَّل بـsips (ماك) حين تغيب أو يكون الغلافُ أحدثَ منها.
   التشغيل: مع فهرس البحث في «npm run stories»، و«npm run i18n» ينبّه إن نُسي (٨). */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const D = 'stories/';
const SITE = 'https://znammous.github.io/quran-kids/';
const rd = f => JSON.parse(readFileSync(D + f, 'utf8'));
const SI = rd('index.json').stories;
const rev = x => (x && x.rev) | 0 || 1;
const at = s => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cover = x => x.cw || x.cover;

/* اسمُ التطبيق بلغة الصفحة، من قاموسها */
function appName(c) {
  if (!c || !existsSync(`lang/${c}.js`)) return 'نور الوحي';
  let m = {};
  new Function('NUR_I18N', readFileSync(`lang/${c}.js`, 'utf8'))({ add: (_, d) => { m = d; } });
  return m['نور الوحي'] || 'نور الوحي';
}
const RTL = { ar: 1, ur: 1, fa: 1, ps: 1 };

function page(x, t, d, c) {
  const up = c ? '../../../' : '../../', name = appName(c), dir = RTL[c || 'ar'] ? 'rtl' : 'ltr';
  const go = up + 'index.html' + (c ? '?hl=' + c : '') + '#story=' + encodeURIComponent(x.id);
  const img = cover(x) ? `og/${x.id}.jpg?r=${rev(x)}` : '';
  const self = SITE + 'stories/' + (c ? c + '/' : '') + `p/${x.id}.html`;
  return `<!DOCTYPE html>
<html lang="${c || 'ar'}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${at(t)} — ${at(name)}</title>
<meta name="description" content="${at(d)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${at(name)}">
<meta property="og:title" content="${at(t)}">
<meta property="og:description" content="${at(d)}">
<meta property="og:url" content="${self}">
${img ? `<meta property="og:image" content="${SITE}stories/${img}">
<meta property="og:image:type" content="image/jpeg">
<meta name="twitter:card" content="summary_large_image">
` : ''}<link rel="icon" href="${up}icons/icon-192.png">
<script>location.replace(${JSON.stringify(go)});</script>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d1b3d;font-family:system-ui,sans-serif}
a{display:block;max-width:420px;margin:20px;color:#fff;text-decoration:none;text-align:center}
img{width:100%;border-radius:16px;display:block}h1{font-size:22px;margin:14px 0 6px}p{margin:0;opacity:.8}</style>
</head>
<body><a href="${at(go)}">${img ? `<img src="${up}stories/${img}" alt="">` : ''}<h1>${at(t)}</h1><p>${at(d)}</p></a></body>
</html>
`;
}

/* الصفحاتُ: { <مسارٌ تحت stories/>: نصّ } — والمترجمةُ لما تُرجم بمراجعته وحدَه */
export function build() {
  const out = {};
  for (const x of SI) out[`p/${x.id}.html`] = page(x, x.t, x.d, '');
  for (const c of readdirSync(D).filter(c => /^[a-z]{2}$/.test(c) && existsSync(`${D}${c}/index.json`))) {
    const L = rd(`${c}/index.json`).stories || {};
    for (const x of SI) {
      const t = L[x.id];
      if (t && rev(t) === rev(x)) out[`${c}/p/${x.id}.html`] = page(x, t.t || x.t, t.d || x.d, c);
    }
  }
  return out;
}
/* صورُ المعاينة الغائبةُ أو الأقدمُ من غلافها */
export function staleImages() {
  return SI.filter(x => cover(x) && existsSync(D + cover(x))).filter(x => {
    const j = `${D}og/${x.id}.jpg`;
    return !existsSync(j) || statSync(j).mtimeMs < statSync(D + cover(x)).mtimeMs;
  });
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const out = build(), stale = Object.keys(out).filter(f => !existsSync(D + f) || readFileSync(D + f, 'utf8') !== out[f]);
  for (const f of stale) { mkdirSync(D + f.replace(/\/[^/]+$/, ''), { recursive: true }); writeFileSync(D + f, out[f]); }
  const im = staleImages();
  mkdirSync(D + 'og', { recursive: true });
  for (const x of im) {
    try { execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', D + cover(x), '--out', `${D}og/${x.id}.jpg`], { stdio: 'ignore' }); }
    catch (e) { console.log(`تعذّر تحويل غلاف ${x.id} (sips على ماك وحده) — حوّله إلى stories/og/${x.id}.jpg يدويّاً`); }
  }
  console.log(stale.length + im.length ? `صفحاتُ المشاركة: ${stale.length}، وصورُها: ${im.length}` : 'صفحاتُ المشاركة: لا تغيير ✓');
}

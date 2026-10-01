/* فحصُ الترجمة: ما الذي في الواجهة بالعربيّة ولم يدخل قواميسَ اللغات؟
   التشغيل:  node scripts/i18n-check.mjs            تقريرٌ فقط
             node scripts/i18n-check.mjs --strict   يفشل (رمز 1) إن وُجد نقص — للفحص الآليّ
             node scripts/i18n-check.mjs --accept   يضمّ ما ظهر جديداً إلى قائمة التجاهل
                                                    (بعد مراجعته: نصٌّ ليس للواجهة، أو جزءُ جملة)

   يفحص خمسة أشياء:
   ١) نصوصٌ عربيّةٌ في الشيفرة (نصوصُ الصفحة الثابتة، والنصوصُ بين علامات التنصيص
      وما بين وسوم HTML فيها) ليست في قاموس الأرديّة ولا في قائمة التجاهل — أي جديدةٌ
      أو عُدّلت بعد آخر ترجمة. هذا أهمّ ما فيه: تعديلُ نصِّ زرٍّ عربيٍّ يُسقط ترجمتَه بصمت.
   ٢) صيغُ العدد: كلُّ مصفوفة C_* (arCount) لها «#1 …» و«#n …» في كلّ قاموس.
   ٣) قوالبُ tx('…') في الشيفرة لها مدخلٌ في كلّ قاموس.
   ٤) مفاتيحُ في القاموس لم يعد لنصّها أثرٌ في الشيفرة (يتيمة) — تُحذف أو تُحدَّث.
   ٥) كلُّ لغةٍ غير الأرديّة: ما في قاموس الأرديّة (المرجع) ولم يُترجَم فيها بعد.

   الفحصُ ثابتٌ لا يشغّل الصفحة، فالجملُ التي تُركَّب من أجزاءٍ تظهر أجزاءً.
   ولما لا يُرى إلا بالتشغيل: scripts/i18n-harvest.mjs */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const args = new Set(process.argv.slice(2));
const AR = /[؀-ۿ]/;
const IGNORE_FILE = 'lang/i18n-ignore.json';
const REF = 'ur';                                   /* القاموسُ المرجع: أوّلُ لغةٍ وأكملُها */

const norm = s => s.replace(/\s+/g, ' ').trim();
/* الرمزُ في أوّل النصّ وآخره لا يُترجم (المحرّكُ يفصله): «⚙️ الإعدادات» ← «الإعدادات» */
const core = s => { const m = s.match(/^([^؀-ۿ]*)([\s\S]*?[؀-ۿ])([^؀-ۿ]*)$/); return m ? m[2] : s; };
const numKey = s => { let i = 0; return s.replace(/[0-9٠-٩]+/g, () => '{' + (i++) + '}'); };

/* ---------- القواميس: lang/<رمز>.js تنادي NUR_I18N.add(رمز، {…}) ---------- */
function loadDict(code) {
  const src = readFileSync(`lang/${code}.js`, 'utf8');
  let out = null;
  new Function('NUR_I18N', src)({ add: (c, m) => { out = m; } });
  const d = {};
  for (const k in out) d[norm(k)] = out[k];
  return d;
}
const langs = readdirSync('lang').filter(f => /^[a-z]{2,3}\.js$/.test(f)).map(f => f.slice(0, -3));
const dicts = Object.fromEntries(langs.map(c => [c, loadDict(c)]));
const ref = dicts[REF];

/* ---------- أسماءُ السور: تصير {s1} في المفاتيح كما في المحرّك ---------- */
const quran = readFileSync('data/quran.js', 'utf8');
const SURAHS = JSON.parse(quran.match(/var SURAHS = (\[.*?\]);\s*\n/s)[1]);
const names = SURAHS.map(s => s.name).sort((a, b) => b.length - a.length);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const surahRe = new RegExp('(^|[\\s«(>])(' + names.map(esc).join('|') + ')(?=$|[\\s»),.:،؛—–<-])', 'g');
const surahKey = s => { let i = 0; return s.replace(surahRe, (m, pre) => pre + '{s' + (++i) + '}'); };

/* نصوصُ المفاتيح مجرّدةً من الوسوم: جملةٌ فيها <b> تُترجم كاملةً، فقطعُها
   في الشيفرة («كل سورة مقسّمة إلى» ثمّ «<b>مقاطع</b>») مترجَمةٌ ضمنها */
const whole = d => Object.keys(d).filter(k => k.includes('<'))
  .map(k => norm(k.replace(/<[^>]*>/g, ' ').replace(/\{[a-z0-9]+\}/g, ' ')));
const wholeRef = whole(ref);

/* النصُّ مترجَمٌ إن وُجد بأيّ صورةٍ يبحث بها المحرّك */
function known(dict, s, W) {
  const c0 = norm(core(s));
  if (W && c0.length > 1 && W.some(t => t.includes(c0))) return true;
  const c = core(s);
  for (const k of [s, c, numKey(s), numKey(c), surahKey(numKey(s)), surahKey(numKey(c))])
    if (dict[norm(k)] != null) return true;
  /* «… — …» و«… • …»: يُترجم مقطَّعاً */
  for (const sep of [' — ', ' • '])
    if (s.includes(sep) && s.split(sep).every(p => !AR.test(p) || known(dict, p, W))) return true;
  return false;
}

/* ---------- استخراجُ النصوص العربيّة من index.html ---------- */
const html = readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const body = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
                 .replace(/<!--[\s\S]*?-->/g, ' ');

function literals(js) {
  const out = [];
  for (let i = 0, n = js.length; i < n;) {
    const c = js[i];
    if (c === '/' && js[i + 1] === '*') { const j = js.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; continue; }
    if (c === '/' && js[i + 1] === '/') { const j = js.indexOf('\n', i); i = j < 0 ? n : j; continue; }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1, buf = '';
      while (j < n && js[j] !== c) {
        if (js[j] === '\\') { buf += js.slice(j, j + 2); j += 2; continue; }
        if (js[j] === '\n' && c !== '`') break;
        buf += js[j++];
      }
      if (AR.test(buf)) out.push(buf);
      i = j + 1; continue;
    }
    i++;
  }
  return out;
}

const found = new Map();                            /* النصّ ← أين وُجد (لتقريرٍ مفهوم) */
function add(s, where) {
  s = norm(s.replace(/\\n/g, ' ').replace(/\\u2068|\\u2069/g, ''));
  if (!AR.test(s) || core(s).length < 2) return;
  if (/[{};=]|\bfunction\b|\breturn\b|\+/.test(s)) return;   /* شيفرةٌ لا نصّ */
  if (!found.has(s)) found.set(s, where);
}
/* الصفحةُ الثابتة: ما بين الوسوم، وصفاتُ العرض */
for (const m of body.matchAll(/>([^<>]+)</g)) add(m[1], 'HTML');
for (const m of body.matchAll(/\b(?:placeholder|title|aria-label|alt)="([^"]+)"/g)) add(m[1], 'HTML');
/* الشيفرة: النصُّ كاملاً إن خلا من الوسوم، وإلّا فما بينها */
const TX = [];
for (const js of scripts) {
  for (const t of [...js.matchAll(/\btx\(\s*(['"])((?:\\.|(?!\1).)*)\1/g)]) TX.push(t[2]);
  for (const l of literals(js)) {
    if (!/[<>]/.test(l)) { add(l, 'JS'); continue; }
    for (const seg of l.split(/<[^>]*>|<[^>]*$|^[^<]*>/)) add(seg, 'JS·HTML');
  }
}

/* ---------- ١) الجديدُ غيرُ المترجَم ---------- */
const ignore = new Set(existsSync(IGNORE_FILE) ? JSON.parse(readFileSync(IGNORE_FILE, 'utf8')) : []);
const fresh = [...found.keys()].filter(s => !ignore.has(s) && !known(ref, s, wholeRef));

/* ---------- ٢) صيغُ العدد ---------- */
const countForms = [];
for (const js of scripts)
  for (const m of js.matchAll(/var (C_[A-Z]+)\s*=\s*\[\s*'([^']+)'/g)) countForms.push([m[1], m[2]]);
const extra = [['arYears', 'سنة'], ['arMonths', 'شهر'], ['arDays', 'يوم'], ['agoText', 'منذ يوم'], ['marra', 'مرّة']];

/* ---------- ٤) اليتيمة: لا أثرَ لأيّ جزءٍ من المفتاح في الشيفرة ولا في بيانات الخطط ----------
   المفتاحُ صورتُه وقتَ العرض، والشيفرةُ تبنيه قطعاً («الإتقان» + « — الشارة » + «فضّية»)،
   فيُقطَّع عند الوسوم والخانات والفواصل، ويكفي أن تُوجد قطعةٌ منه ليُعدّ حيّاً */
const flat = norm(html + ' ' + (existsSync('data/plans.js') ? readFileSync('data/plans.js', 'utf8') : ''));
const pieces = k => k.replace(/<[^>]*>/g, '|').split(/\{[a-z0-9]+\}|#1 |#n |\||—|•|«|»|:|؟|\(|\)|،|\.|<br>/)
  .map(norm).filter(p => AR.test(p) && p.length >= 4);
/* ما يأتي من البيانات لا من الشيفرة: نوعُ السورة، وأسماءُ الأشهر (من Intl) */
const fromData = new Set([...SURAHS.map(s => s.type),
  'يناير','فبراير','مارس','أبريل','إبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
  'محرم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة']);
/* حيٌّ إن وُجدت قطعةٌ منه، أو جُلُّ كلماته («اختر شكل » + اسم ← «اختر شكل أبي») */
const words = k => k.replace(/<[^>]*>|\{[a-z0-9]+\}/g, ' ').split(/[^\u0600-\u06FF]+/).filter(w => w.length >= 3);
const orphans = Object.keys(ref).filter(k => {
  if (/^#[1n] /.test(k) || fromData.has(k)) return false;
  const ps = pieces(k); if (ps.some(p => flat.includes(p))) return false;
  const ws = words(k); if (!ws.length) return false;
  return ws.filter(w => flat.includes(w)).length < ws.length * 0.7;
});

/* ---------- التقرير ---------- */
let bad = 0;
const head = t => console.log('\n' + t);
const list = (arr, fmt = x => x) => arr.forEach(x => console.log('   • ' + fmt(x)));

head(`١) نصوصٌ عربيّةٌ جديدةٌ لا ترجمةَ لها (${fresh.length}):`);
if (fresh.length) {
  bad += fresh.length;
  list(fresh, s => `${s.length > 110 ? s.slice(0, 110) + '…' : s}   [${found.get(s)}]`);
  console.log('   ← أضفها إلى lang/*.js، أو إن لم تكن للواجهة (آية، اسم، جزءُ جملة) فـ --accept');
} else console.log('   لا شيء ✓');

for (const c of langs) {
  const d = dicts[c];
  const missCount = [...countForms.map(f => f[1]), ...extra.map(e => e[1])]
    .filter(f => d['#1 ' + f] == null || d['#n ' + f] == null);
  const missTx = TX.filter(t => AR.test(t) && d[norm(t)] == null && !/^[؀-ۿ ]{1,3}$/.test(t));
  head(`٢–٣) ${c}: صيغُ العدد الناقصة (${missCount.length}) — قوالبُ tx() الناقصة (${missTx.length}):`);
  if (missCount.length) { bad += missCount.length; list(missCount, f => `«#1 ${f}» و«#n ${f}»`); }
  if (missTx.length) { bad += missTx.length; list([...new Set(missTx)]); }
  if (!missCount.length && !missTx.length) console.log('   لا شيء ✓');
}

head(`٤) مفاتيحُ في قاموس ${REF} لم يعد نصُّها في الشيفرة (${orphans.length}) — تُراجَع وتُحذف أو تُحدَّث:`);
orphans.length ? list(orphans, k => k.length > 110 ? k.slice(0, 110) + '…' : k) : console.log('   لا شيء ✓');

for (const c of langs.filter(c => c !== REF)) {
  const miss = Object.keys(ref).filter(k => dicts[c][k] == null);
  head(`٥) ${c}: ما في ${REF} ولم يُترجم بعدُ (${miss.length} من ${Object.keys(ref).length})`);
  if (miss.length) { bad += miss.length; list(miss.slice(0, 15)); if (miss.length > 15) console.log(`   … و${miss.length - 15} غيرُها`); }
}

/* ---------- ٦) لغاتُ اليسار: مفاتيحُ زائدةٌ في الإنجليزيّة (أسماءٌ بالحروف اللاتينيّة، وقوالبُ
   أسماء السور) يجب أن تكون في كلِّ لغةٍ من اليسار ---------- */
const LTRS = [...html.matchAll(/^\s{4}([a-z]{2}):\{n:'[^']*',\s*dir:'ltr'/gm)].map(m => m[1]).filter(c => dicts[c]);
if (dicts.en) {
  const extra = Object.keys(dicts.en).filter(k => ref[k] == null);
  for (const c of LTRS.filter(c => c !== 'en')) {
    const miss = extra.filter(k => dicts[c][k] == null);
    head(`٦) ${c}: مفاتيحُ لغات اليسار الناقصة (${miss.length})`);
    if (miss.length) { bad += miss.length; list(miss); }
  }
}

console.log(`\nاللغات: ${langs.join('، ')} — نصوصُ الشيفرة المفحوصة: ${found.size}، وفي قاموس ${REF}: ${Object.keys(ref).length}`);

if (args.has('--accept') && fresh.length) {
  for (const s of fresh) ignore.add(s);
  writeFileSync(IGNORE_FILE, JSON.stringify([...ignore].sort(), null, 1) + '\n');
  console.log(`ضُمّ ${fresh.length} إلى ${IGNORE_FILE}`);
}
if (args.has('--strict') && bad) process.exit(1);

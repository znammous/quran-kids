// نوعُ كلّ كلمةٍ في المصحف لخيارات «أكمل الآية» ← data/morph.json
// node scripts/morph-build.mjs [quran-morphology.txt]
// المصدر: Quranic Arabic Corpus ‏(corpus.quran.com، رخصة GPL) بنسخته المنقّحة
// github.com/mustafa0x/quran-morphology — يُنزَّل إن لم يُعطَ ملفُّه.
//
// لكلّ كلمةٍ مفتاحٌ من أربع خانات: النوع|السوابق|الصيغة|اللواحق، فتُختار
// المشتّتاتُ ممّا طابقها، ثمّ يُتنازل عن الخانات من آخرها (انظر missOptions).
import fs from 'fs'; import vm from 'vm';

const SRC = 'https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt';
const txt = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : await (await fetch(SRC)).text();
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('data/quran.js', 'utf8'), ctx);
const SURAHS = ctx.SURAHS;

/* بلا تشكيل: للموازنة بين رسمين */
const bare = s => s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـࣰ-ࣿ]/g, '')
  .replace(/[آأإٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

/* أسماءُ الله وصفاتُه: تُجعل خياراتُها منها — «عَزِيزٌ حَكِيمٌ» مقابل «عَلِيمٌ حَكِيمٌ» */
const GOD = new Set(['الله', 'رب', 'اله', 'رحمن'].map(bare));
const DIV = new Set(('عليم رحيم عزيز حكيم غفور سميع بصير خبير قدير شهيد حليم لطيف شكور شاكر ودود حميد ' +
  'مجيد قوي علي كبير رءوف تواب رقيب حفيظ وكيل غني واسع حسيب محيط قريب مجيب وهاب رزاق فتاح ' +
  'قهار غفار عفو خلاق قدوس مهيمن جبار متكبر قيوم مقيت متعال علام كريم حي صمد').split(' ').map(bare));

/* ===== قراءةُ المصدر: الكلمةُ مقاطعُ (سوابق، جذع، لواحق) ===== */
const W = {};                                   /* "س:آ" ← [كلمة ← [مقاطع]] */
for (const l of txt.split('\n')) {
  if (!l || l[0] === '#') continue;
  const [loc, form, pos, feat] = l.split('\t');
  const [s, a, w] = loc.split(':');
  const f = feat.split('|');
  ((W[s + ':' + a] ??= [])[w - 1] ??= []).push({ form, pos, f, tag: f[0],
    lem: (f.find(x => x.startsWith('LEM:')) || '').slice(4),
    pre: f.includes('PREF'), suf: f.includes('SUFF') });
}
const has = (g, t) => g.f.includes(t);
const pgn = g => g.f.find(x => /^[123][MF]?[SDP]$/.test(x)) || '';

function keyOf(segs) {
  let i = 0; const pre = [];
  while (i < segs.length - 1 && segs[i].pre) pre.push(segs[i++]);
  const st = segs[i], suf = segs.slice(i + 1);
  let C, f1 = '', f2 = suf.map(g => g.tag === 'PRON' ? pgn(g) : g.tag + pgn(g)).join('+');
  if (st.pos === 'V') {
    C = 'V' + st.tag;                              /* VPERF / VIMPF / VIMPV */
    f1 = [pgn(st), st.f.find(x => x.startsWith('MOOD:')) || '', has(st, 'PASS') ? 'P' : ''].join('.');
  } else if (st.pos === 'P') {
    C = st.tag === 'P' ? 'P' : 'p' + st.tag;       /* حرفُ جرّ، أو أداةٌ بنوعها */
  } else if (st.tag === 'PRON' && pre.some(g => g.tag === 'P')) {
    /* «لَهُۥ» و«بِهِۦ» حرفُ جرٍّ مع ضمير، كـ«عَلَيْهِ» و«فِيهِ» */
    const k = pre.findLastIndex(g => g.tag === 'P');
    C = 'P'; f2 = pgn(st); pre.splice(k, 1);
  } else {
    const lb = bare(st.lem);
    const nounish = !['PRON', 'REL', 'DEM', 'T', 'LOC', 'INTG', 'COND'].includes(st.tag);
    const one = !st.f.some(x => /^[MF]?[DP]$/.test(x));   /* «ٱلْـَٔالِهَةَ» ليست من أسماء الله */
    C = !nounish ? 'n' + st.tag
      : GOD.has(lb) && one ? 'GOD'
      : DIV.has(lb) && one && !has(st, 'PN') ? 'DIV'
      : has(st, 'PN') ? 'PN'
      : has(st, 'ADJ') ? 'ADJ' : 'N';
    const cs = st.f.find(x => x === 'NOM' || x === 'ACC' || x === 'GEN') || '';
    /* المصدرُ يكتب المفردَ «M» مرّةً و«MS» مرّة. وأسماءُ الله وصفاتُه مفردةٌ كلُّها */
    const ng = (st.f.find(x => /^([MF][SDP]?|[SDP])$/.test(x)) || '').replace(/^([MF])$/, '$1S');
    f1 = cs + (has(st, 'INDEF') ? '~' : '') + (C === 'GOD' || C === 'DIV' ? '' : pgn(st) || ng);
  }
  /* «ٱللَّهِ» بلا «ال» في المصدر و«ٱلرَّحْمَٰنِ» بها: سواءٌ في الخيارات */
  const pl = pre.filter(g => !(C === 'GOD' && g.tag === 'DET')).map(g => bare(g.lem || g.form) || g.tag);
  return [C, pl.join('+'), f1, f2].join('|');
}

/* ===== محاذاةُ كلماتنا بكلمات المصدر ===== */
const MARK = /^[؀-؅ۖ-ۭ۞۩ࣰ-ࣿ]+$/;
const words = t => t.split(/\s+/).filter(w => w && !MARK.test(w));
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
/* عددُهما سواءٌ: كلمةٌ بكلمة. وإلّا فبرمجةٌ ديناميّة: كلمةٌ بكلمة، أو كلمتان بواحدة
   («يَا أَيُّهَا» ← «يَـٰٓأَيُّهَا»)، أو واحدةٌ باثنتين («بَعْدَ مَا» ← بعدما). وما لم
   يقابل كلمةً واحدةً لا نوعَ له، فيعود سؤالُه إلى الطريقة القديمة */
function align(ours, src) {
  const forms = src.map(g => g.map(x => x.form).join(''));
  if (ours.length === src.length) return src.map((g, i) => keyOf(g));
  const n = ours.length, m = src.length, INF = 1e9;
  const D = Array.from({ length: n + 1 }, () => Array(m + 1).fill(INF)), P = [];
  D[0][0] = 0;
  const steps = [[1, 1], [2, 1], [1, 2], [3, 1], [1, 3]];
  for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
    if (D[i][j] >= INF) continue;
    for (const [di, dj] of steps) {
      if (i + di > n || j + dj > m) continue;
      const c = D[i][j] + lev(bare(ours.slice(i, i + di).join('')), bare(forms.slice(j, j + dj).join(''))) + (di + dj - 2) * .5;
      if (c < D[i + di][j + dj]) { D[i + di][j + dj] = c; (P[i + di] ??= [])[j + dj] = [di, dj]; }
    }
  }
  const out = Array(n).fill(null);
  for (let i = n, j = m; i > 0 || j > 0;) {
    const [di, dj] = P[i][j];
    if (di === 1 && dj === 1) out[i - 1] = keyOf(src[j - 1]);
    else if (di === 2 && dj === 1) {
      /* «يَا أَيُّهَا»: النداءُ كلمةٌ برأسها عندنا، وما بعده مفتاحُه بلا «يا» */
      const g = src[j - 1];
      if (g[0].tag === 'VOC' && g.length > 1) out[i - 1] = keyOf(g.slice(1));
    }
    i -= di; j -= dj;
  }
  return out;
}

/* ===== الترميز: حرفان لكلّ كلمة، و«~~» لما لا نوعَ له ===== */
const AB = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+,-./:;<=>?@[]^_`{|}';
const keys = [], kid = new Map();
const code = k => {
  if (k == null) return '~~';
  if (!kid.has(k)) { kid.set(k, keys.length); keys.push(k); }
  const n = kid.get(k); return AB[Math.floor(n / AB.length)] + AB[n % AB.length];
};
const u = [], x = {};
let miss = [0, 0];
for (const s of SURAHS) {
  const ay = [];
  s.ayat.forEach((a, i) => {
    const src = W[s.n + ':' + (i + 1)];
    const ku = align(words(a[0]), src), ks = align(words(a[1]), src);
    miss[0] += ku.filter(k => !k).length; miss[1] += ks.filter(k => !k).length;
    const cu = ku.map(code).join(''), cs = ks.map(code).join('');
    ay.push(cu);
    if (cs !== cu) x[s.n + ':' + i] = cs;          /* الرسمُ الإملائيّ إن خالف */
  });
  u.push(ay.join(' '));
}
if (keys.length > AB.length ** 2) throw new Error('المفاتيح أكثر من حرفين');
fs.writeFileSync('data/morph.json', JSON.stringify({
  src: 'Quranic Arabic Corpus (corpus.quran.com, GPL) via github.com/mustafa0x/quran-morphology',
  ab: AB, k: keys, u, x }));
console.log(`data/morph.json: ${keys.length} مفتاحاً، وبلا نوع: ${miss[0]} عثمانيّ و${miss[1]} إملائيّ، وآياتٌ مخالفة: ${Object.keys(x).length}`);

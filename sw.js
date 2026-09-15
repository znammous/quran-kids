/* ===== عامل خدمة «نور الوحي» =====
   الصفحة: الشبكة أوّلاً ثم المخزَّن — فلا يعلق أحدٌ على نسخة قديمة، ويعمل دون إنترنت.
   الخطوط والأيقونات: المخزَّن أوّلاً — لا تتغيّر أبداً، وتُخزَّن عند أوّل استعمال فقط
   فلا نُنزّل ستّة وأربعين ميجابايت دفعةً واحدة.
   البيانات (data/): المخزَّن أوّلاً في مخزنٍ له رقمُه، يُرفع حين تتغيّر. */
var VER   = 'v3';
var SHELL = 'nur-shell-' + VER;   /* الصفحة وما يتبعها — يُمسح مع كل إصدار */
var ASSET = 'nur-assets';         /* خطوط لا تتغيّر — يبقى عبر الإصدارات */
var DATA  = 'nur-data-1';         /* معاني الكلمات وأمثالها — يُرفع رقمُه إذا تغيّر ملفٌّ فيها */
/* مهلةُ الشبكة للصفحة: كان يُنتظر بلا حدّ، فيعلق التطبيقُ على شبكةٍ ضعيفة
   قبل أن يُلجأ إلى المخزَّن */
var NET_WAIT = 4000;

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(SHELL).then(function(c){
      return c.addAll(['./','./index.html','./manifest.webmanifest',
                       './icons/icon-192.png','./icons/icon-512.png']);
    })['catch'](function(){})                    /* تعذّر شيء: لا نُفشل التنصيب */
     .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){
        if(k!==SHELL && k!==ASSET && k!==DATA) return caches['delete'](k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* ما لا يتغيّر أبداً: خطوط الصفحات والأيقونات */
function immutable(p){ return p.indexOf('/fonts/')>-1 || p.indexOf('/icons/')>-1; }
function isData(p){ return p.indexOf('/data/')>-1; }

/* المخزَّن أوّلاً، وما لم يُخزَّن يُجلب ثمّ يُحفظ */
function cacheFirst(name, req){
  return caches.open(name).then(function(c){
    return c.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        if(res && res.ok) c.put(req, res.clone());
        return res;
      });
    });
  });
}

function withTimeout(p, ms){
  return new Promise(function(ok, no){
    var t=setTimeout(function(){ no(new Error('timeout')); }, ms);
    p.then(function(v){ clearTimeout(t); ok(v); }, function(er){ clearTimeout(t); no(er); });
  });
}

self.addEventListener('fetch', function(e){
  var req=e.request;
  if(req.method!=='GET') return;
  var url;
  try{ url=new URL(req.url); }catch(err){ return; }
  if(url.origin!==self.location.origin) return;   /* jsDelivr وغيره: يمرّ كما هو */

  if(immutable(url.pathname)){ e.respondWith(cacheFirst(ASSET, req)); return; }
  if(isData(url.pathname)){ e.respondWith(cacheFirst(DATA, req)); return; }

  /* «الشبكة أوّلاً» لا تعني شيئاً إن أجاب مخزنُ المتصفّح دونها:
     GitHub Pages يرسل max-age=600، فتبقى الصفحةُ القديمةَ عشرَ دقائق وإن رُفع
     الجديد. فكان يُطلب تجاوزُ مخزنه كلّياً (reload)، فتُنزَّل الصفحةُ كاملةً
     (أربعة ميجابايت) عند كلّ فتح. و«no-cache» يسأل الخادمَ أتغيّرت؟ فإن لم
     تتغيّر جاء الجوابُ بلا جسم، ويبقى الجديدُ يُرى فور رفعه. */
  var net=fetch(url.href, { cache:'no-cache', credentials:'same-origin' }).then(function(res){
    if(res && res.ok && res.type==='basic'){
      var cp=res.clone();
      caches.open(SHELL).then(function(c){ c.put(req, cp); });
    }
    return res;
  });
  net['catch'](function(){});                     /* رفضٌ لم يُنتظر: لا يُعدّ خطأً غير معالَج */

  e.respondWith(
    withTimeout(net, NET_WAIT)['catch'](function(){
      return caches.match(req).then(function(hit){
        if(hit) return hit;
        /* الصفحةُ بديلُ التنقّل وحده: كانت تُرجَع لكلّ ملفٍّ غير مخزَّن، فيُقرأ
           ملفُّ البيانات صفحةً ويفشل. وكان «أو» بين وعدين لا يبلغ الثاني أبداً */
        if(req.mode==='navigate'){
          return caches.match('./index.html').then(function(h){
            return h || caches.match('./');
          }).then(function(h){ return h || net; });
        }
        return net;                               /* لا مخزَّن: ينتظر الشبكةَ كما هي */
      });
    })
  );
});

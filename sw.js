/* ===== عامل خدمة «نور الوحي» =====
   الصفحة: الشبكة أوّلاً ثم المخزَّن — فلا يعلق أحدٌ على نسخة قديمة، ويعمل دون إنترنت.
   الخطوط والأيقونات: المخزَّن أوّلاً — لا تتغيّر أبداً، وتُخزَّن عند أوّل استعمال فقط
   فلا نُنزّل ستّة وأربعين ميجابايت دفعةً واحدة. */
var VER   = 'v1';
var SHELL = 'nur-shell-' + VER;   /* الصفحة وما يتبعها — يُمسح مع كل إصدار */
var ASSET = 'nur-assets';         /* خطوط لا تتغيّر — يبقى عبر الإصدارات */

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
        if(k!==SHELL && k!==ASSET) return caches['delete'](k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* ما لا يتغيّر أبداً: خطوط الصفحات والأيقونات */
function immutable(p){ return p.indexOf('/fonts/')>-1 || p.indexOf('/icons/')>-1; }

self.addEventListener('fetch', function(e){
  var req=e.request;
  if(req.method!=='GET') return;
  var url;
  try{ url=new URL(req.url); }catch(err){ return; }
  if(url.origin!==self.location.origin) return;   /* jsDelivr وغيره: يمرّ كما هو */

  if(immutable(url.pathname)){
    e.respondWith(caches.open(ASSET).then(function(c){
      return c.match(req).then(function(hit){
        if(hit) return hit;
        return fetch(req).then(function(res){
          if(res && res.ok) c.put(req, res.clone());
          return res;
        });
      });
    }));
    return;
  }

  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok && res.type==='basic'){
        var cp=res.clone();
        caches.open(SHELL).then(function(c){ c.put(req, cp); });
      }
      return res;
    })['catch'](function(){
      return caches.match(req).then(function(hit){
        return hit || caches.match('./index.html') || caches.match('./');
      });
    })
  );
});

# App Store — نور الوحي

كلُّ ما يُكتب في **App Store Connect**، ثمّ خطواتُ الرفع من الماك.
الأصلُ كما في Google Play: لا جمعَ بيانات، ولا إعلانات، ولا مشتريات، ولا حسابات.

## ١) إنشاء التطبيق (Apps ← ➕ New App)
| الحقل | القيمة |
|---|---|
| Platforms | iOS |
| Name | `نور الوحي: حفظ القرآن ومراجعته` (٣٠ حرفاً) |
| Primary Language | Arabic |
| Bundle ID | `io.github.znammous.nuralwahy` — يُسجَّل أوّلاً في developer.apple.com ← Identifiers إن لم يظهر (أو يسجّله Xcode تلقائيّاً عند أوّل أرشفة) |
| SKU | `nuralwahy` |
| User Access | Full Access |

## ٢) صفحة المتجر (App Information و iOS App ← 1.0.0)
- **Subtitle** (٣٠ حرفاً): `رحلةٌ ممتعة في حفظ القرآن`
- **Category**: Primary **Education** · Secondary **Books** (أو Reference)
- **Promotional Text** (١٧٠ حرفاً، يُعدَّل متى شئتَ بلا مراجعة):
  `حفظُ القرآن رحلةٌ لا واجب: خريطةٌ وقلاع، ومسجدٌ تبنيه بحفظك، وقصصٌ مصوّرة — على وجه المصحف، بلا إعلانات ولا جمع بيانات.`
- **Keywords** (١٠٠ حرف، فواصل بلا مسافات):
  `قرآن,حفظ,مراجعة,مصحف,تحفيظ,تفسير,تلاوة,حافظ,جزء عم,أطفال,قرآن كريم,ورد,تسميع,إسلامي`
- **Support URL**: `https://znammous.github.io/quran-kids/`
- **Privacy Policy URL**: `https://znammous.github.io/quran-kids/privacy.html`
- **Copyright**: `2026 زهير النموس`
- **Description** — النصُّ نفسُه الذي في Google Play بلا وسوم `<b>`:

```
حفظُ القرآن في «نور الوحي» رحلةٌ لا واجب: مغامرةٌ تتقدّم فيها وجهاً بعد وجه، وتجمع الجواهر، وتفتح القلاع، وتبني مسجدك آيةً بعد آية. ولا تريد أن تتوقّف.

🗺️ رحلةٌ مليئة بالمغامرة
• خريطةٌ تسير عليها جزءاً بعد جزء، وقلاعٌ تفتحها باختبارات الأجزاء
• ركنُ المغامرة: ألعابٌ تكافئك على ما حفظت
• مسجدٌ يرتفع بناؤه كلّما حفظت
• قصصٌ مصوّرة تُفتح لك في الطريق
• جواهر وشارات، ومتجرٌ تزيّن منه شخصيّتك
• شهادة إتمامٍ تشاركها أهلك

📖 حفظٌ متقن على وجه المصحف
على وجه المصحف برسم عثمان طه كما تراه في مصحفك. تسمع الآية بصوت القارئ، ثمّ تقرؤها وتسجّل صوتك وتستمع إلى نفسك، ثمّ تربط الآيات حتى تتقن المقطع كاملاً.

☀️ مراجعةٌ لا تنقطع
جدول مراجعة يعيد ما حفظتَ في وقته حتى لا يتفلّت، مع «اختبر نفسك» وتحدٍّ يوميّ.

🧭 خطط حفظ جاهزة
خطط «بالقرآن نحيا» بمقاديرَ تناسب كلَّ حافظ.

💡 افهم ما تحفظ
التفسير الميسّر ومعاني الكلمات الغريبة لكلّ آية، من إصدارات مجمّع الملك فهد لطباعة المصحف الشريف.

🎧 تلاوات القرّاء
استمع إلى الآية أو الوجه بصوت قارئك المفضّل، وبالسرعة التي تناسبك.

👨‍👩‍👧 للصغار والكبار
حسابٌ لكلّ فردٍ في البيت على الجهاز نفسه، ولوحة البيت تجمع تقدّم الجميع فيتنافسون في الخير.

🔒 خصوصيّةٌ كاملة
لا حسابات ولا إعلانات ولا مشتريات، ولا يجمع التطبيق أيَّ بيانات. تقدّمك في جهازك وحده، وتسجيلُ صوتك يُسمع ثمّ يُمحى. ويعمل دون إنترنت.

وقفٌ لله تعالى، وصدقةٌ جارية عن أمّي لمياء قبّاني.
```

- **لقطات الشاشة** (تُسحب إلى الصفحة):
  - iPhone 6.5" (ما تطلبه الصفحة): `store/appstore/iphone-6.5/` — ثمانٍ، 1284×2778
  - iPhone 6.9" إن طُلب: `store/appstore/iphone/` — ثمانٍ، 1290×2796
  - iPad 13": `store/appstore/ipad/` — ثمانٍ، 2048×2732
- **App Icon**: من داخل التطبيق نفسِه (في مشروع Xcode)، لا يُرفع هنا.

## ٣) خصوصيّة التطبيق (App Privacy)
- Privacy Policy URL: كما أعلاه
- **Do you or your third-party partners collect data from this app? → No, we do not collect data from this app**
- النتيجة في المتجر: **Data Not Collected**

## ٤) التصنيف العمريّ (Age Rating)
- كلُّ أسئلة المحتوى (عنف، رعب، جنس، ألفاظ، كحول وتدخين ومخدّرات، مقامرة، محتوى طبّيّ…): **None / لا**
- Unrestricted Web Access: **No** · User-Generated Content / تواصل بين المستخدمين: **No**
- Messaging / Chat: **No** · Advertising: **No** · In-App Purchases / Loot boxes: **No**
- Made for Kids (Kids Category): **No** — التطبيقُ للجميع، وفئتُه «التعليم»
- النتيجة المتوقّعة: **4+**

## ٥) ملاحظاتٌ لمراجع أبل (App Review Information ← Notes)
- Sign-in required: **No** (لا حسابات)
- Contact: الاسم، والهاتف، و`zuhair.nammous@gmail.com`
- Notes:
```
Nur al-Wahy is a Qur'an memorization and review app for all ages. No account, no ads, no purchases, no data collection; all progress stays on the device.
The microphone is optional: users record their own recitation to listen back; audio stays in memory on the device and is never uploaded. It is enabled in Settings behind a parental question.
"Gems" are an in-app reward only; they cannot be bought or exchanged.
Some content (reciter audio from everyayah.com, illustrated stories, and content updates of the web layer) is downloaded from the internet; downloads only — nothing about the user is sent.
```

## ٦) على الماك: من المشروع إلى App Store Connect
1. ثبّت **Xcode** (من App Store) و**Node.js 22+**.
2. `git clone https://github.com/znammous/quran-kids.git` ثمّ في المجلّد:
   ```
   npm ci
   npm run www
   npx cap sync ios
   npx cap open ios
   ```
3. في Xcode ← الهدف **App** ← **Signing & Capabilities**: فعّل **Automatically manage signing** واختر **Team** حسابك.
4. جرّب أوّلاً على المحاكي أو آيفونك (زرّ ▶︎)، ثمّ القائمة في الأسفل.
5. اختر الجهاز **Any iOS Device (arm64)** ← **Product ← Archive** ← **Distribute App ← App Store Connect ← Upload**.
6. بعد دقائق يظهر البناءُ في **TestFlight**؛ جرّبه، ثمّ اختره في صفحة الإصدار 1.0.0 و**Add for Review**.
- كلُّ إصدارٍ تالٍ: ارفعْ **Build** في Xcode (الهدف App ← General ← Build) ثمّ أرشفْ من جديد. وتعديلاتُ الصفحة تصل وحدَها بالتحديث الحيّ.

## ٧) ما يُجرَّب على آيفون قبل الإرسال
- [ ] الأيقونة وشاشةُ البداية الكحليّة، والاتّجاهُ عموديّ
- [ ] الشريطُ العلويّ (الساعة) لا يغطّي رأسَ الصفحة ولا وجهَ المصحف، والشريطُ السفليّ فوق خطّ الرجوع
- [ ] المصحف والتقليبُ دون إنترنت
- [ ] التلاوة، وتفعيلُ التسجيل من الإعدادات (بوّابة الوالدين ثمّ إذن المايكروفون بالعربيّة) والاستماع
- [ ] حفظُ نسخة التقدّم ومشاركةُ الشهادة (نافذةُ المشاركة)
- [ ] سياسةُ الخصوصيّة تُفتح داخل التطبيق
- [ ] **التحديثُ الحيّ**: بعد تعديلٍ يُرفع إلى GitHub، أغلق التطبيق وافتحه ← «يوجد تحديث» ← حدِّث، ثمّ افتح المصحف **دون إنترنت** (يُتحقَّق أنّ خطوطَ الأوجه تبقى بعد التحديث على iOS)
- [ ] على الآيباد: الصفحاتُ مقروءة، والمصحفُ يملأ الشاشة

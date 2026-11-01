# Kurd Chat & Domino — حل مشكلة الرفع على Cloudflare Pages ودليل التنزيل ☀️🚀

---

## 🛠️ سبب المشكلة وحلها الجذري (Cause & Fix)

### ❓ سبب الخطأ الظاهر في لقطة الشاشة:
في منصة **Cloudflare Pages** عند الرفع المباشر (Direct Upload):
- الحد الأقصى لحجم أي ملف فردي هو **25 ميغابايت (25 MB)**.
- كان مجلد المشروع يحتوي سابقاً على تسجيل فيديو شاشة تجريبي بصيغة MP4 باسم `Screen_Recording_________________TikTok_990b80de.mp4` بحجم **30 ميغابايت**، وهو ما تسبب في توقف الرفع وظهور رسالة:
  > *"1/80 files could not be uploaded: 1 are larger than the file size limit. Screen_Recording...TikTok..."*

### ✅ ما قمنا به لحل المشكلة فوراً:
1. **حذف واستبعاد جميع ملفات الفيديو والتسجيلات الثقيلة نهائياً** من حزم المشروع.
2. تقليص حجم المشروع بالكامل من **81 ميغابايت** إلى **أقل من 1 ميغابايت فقط!**
3. تجهيز حزمة مخصصة جاهزة مباشرة لـ **Cloudflare Pages** تسمى:
   **`kurd-chat-cloudflare-pages.zip`** تحتوي على ملفات الإنتاج المترجمة (`dist`) مع ملف `_redirects` لتشغيل تطبيق الويب فوراً وبدون أي أخطاء!

---

## 📥 روابط التنزيل المباشرة (Direct Download Links)

| الملف (File) | الوصف (Description) | الحجم (Size) | الرابط المباشر |
| :--- | :--- | :--- | :--- |
| 🚀 **حزمة Cloudflare Pages المباشرة** | **الملفات المجمعة والجاهزة للرفع المباشر على Cloudflare Pages (أنسب خيار لحل مشكلتك فوراً)** | **~940 KB** | [`kurd-chat-cloudflare-pages.zip`](./kurd-chat-cloudflare-pages.zip) |
| 💻 **كود المصدر الكامل النظيف** | سورس كود التطبيق كاملاً (React 19 + TypeScript + Node.js Express + لعبة الدومينو) | **~900 KB** | [`kurd-chat-project.zip`](./kurd-chat-project.zip) |
| ⚡ **صفحة التنزيل المباشر** | صفحة تنزيل بضغطة زر واحدة مخصصة للهاتف المحمول | **~1.2 MB** | [`kurd_chat_project_download.html`](./kurd_chat_project_download.html) |

---

## 📋 خطوات رفع المشروع بنجاح على Cloudflare Pages في دقيقة واحدة:

1. **نزّل ملف:** [`kurd-chat-cloudflare-pages.zip`](./kurd-chat-cloudflare-pages.zip) (حجمه أقل من 1 ميغابايت).
2. **قم بفك الضغط (Extract)** عن الملف، ستجد بداخله مجلد يحتوي على:
   - `index.html`
   - مجلد `assets/` (أكواد جافاسكريبت وCSS الجاهزة)
   - ملف `_redirects` (لضمان عمل التوجيه الداخلي للتطبيق)
   - الأيقونات وخطوط PWA
3. في صفحة **Cloudflare Pages**:
   - ارجع خطوة واحدة أو اضغط **Remove all** لإزالة الملفات القديمة المعلقة.
   - اسحب المجلد المفكوك وضعه في مربع الرفع (أو اختر المجلد).
4. ستظهر لك رسالة: **`15/15 files uploaded`** باللون الأخضر ✅.
5. اضغط على زر **`Save and deploy`**، وسيصبح موقعك متاحاً ومباشراً على الإنترنت خلال 5 ثوانٍ برابط مجاني دائم (مثل `kurdchat.pages.dev`).

# Digital Culture Schools — مدارس الثقافة الرقمية

منصة أخبار اجتماعية تعليمية تعمل على المنفذ `5008`.

## تشغيل الموقع

```bash
npm install
npm start
```

صفحة الموقع الرئيسية:

```text
http://localhost:5008
```

ومسار الصفحة المباشر:

```text
http://localhost:5008/site
```

من جهاز آخر استخدم عنوان الخادم:

```text
http://SERVER-IP:5008
```

فحص حالة الخادم:

```text
curl http://localhost:5008/health
```

## التشغيل بالخلفية

```bash
chmod +x deploy/*.sh
./deploy/start.sh
```

إذا كان الموقع على خادم خارجي، يجب فتح المنفذ `5008` في الجدار الناري أو إعداد Reverse Proxy.

## دخول المدير

- البريد: `schools@admin.schools.info`
- كلمة المرور: `this admin12345`

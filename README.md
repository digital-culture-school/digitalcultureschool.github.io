# Digital Culture Schools — مدارس الثقافة الرقمية

منصة أخبار اجتماعية تعليمية تعمل على Cloudflare Workers.

## متطلبات التشغيل

- Node.js 20+
- Wrangler
- حساب Cloudflare

## إنشاء قاعدة بيانات D1

```bash
npx wrangler login
npx wrangler d1 create app-schools-db
```

انسخ `database_id` الذي يظهر، ثم ضع القيمة في `wrangler.toml`.

## تشغيل migrations

```bash
npx wrangler d1 migrations apply app-schools-db --remote
```

## النشر النهائي

```bash
npx wrangler deploy
```

## حسابات البداية

يجب إنشاء أول مدير بعد ربط D1، ثم إنشاء الحسابات من لوحة المدير.

## الروابط

```text
https://app-schools.opencodexandpasscard.workers.dev/login
```

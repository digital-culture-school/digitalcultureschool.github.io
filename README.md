# ربط Cloudflare D1 وواجهة API

الموقع مستضاف على Cloudflare Workers، أما النسخة الحالية للواجهة فتعمل محلياً في المتصفح. تمت إضافة API آمن وقاعدة بيانات D1 بدون تغيير تصميم الصفحات.

## الإعداد لمرة واحدة

نفذ من جهازك بعد تثبيت Wrangler وتسجيل الدخول:

```bash
npx wrangler d1 create app-schools-db
```

انسخ `database_id` الناتج إلى `wrangler.toml` بهذا الشكل:

```toml
[[d1_databases]]
binding = "DB"
database_name = "app-schools-db"
database_id = "ضع_database_id_هنا"
migrations_dir = "migrations"
```

ثم نفذ migration:

```bash
npx wrangler d1 migrations apply app-schools-db --remote
```

بعدها انشر:

```bash
npx wrangler deploy
```

## نقاط API المضافة

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/posts`
- `POST /api/posts`
- `POST /api/users` للمدير فقط

## ملاحظات أمنية

- كلمات المرور لا تُحفظ كنص صريح في D1؛ تستخدم PBKDF2.
- الجلسة تحفظ في Cookie من نوع HttpOnly.
- حسابات D1 لا تُنشأ تلقائياً حتى لا نضع كلمات مرور داخل المستودع.
- يجب إنشاء أول مدير عبر أداة إدارة/تهيئة آمنة قبل استخدام API.
- الحسابات القديمة الموجودة في localStorage لا تنتقل إلى D1 تلقائياً.

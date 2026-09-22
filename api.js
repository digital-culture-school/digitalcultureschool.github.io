function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extra }
  });
}

function requestBody(request) {
  return request.json().catch(() => ({}));
}

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function toBase64(bytes) {
  let result = '';
  for (const byte of bytes) result += String.fromCharCode(byte);
  return btoa(result);
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  return toBase64(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
}

async function hashPassword(password, salt = toBase64(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromBase64(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
  return `pbkdf2$120000$${salt}$${toBase64(new Uint8Array(bits))}`;
}

async function verifyPassword(password, stored) {
  const [, iterations, salt, expected] = stored.split('$');
  if (!iterations || !salt || !expected) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromBase64(salt), iterations: Number(iterations), hash: 'SHA-256' }, key, 256);
  return toBase64(new Uint8Array(bits)) === expected;
}

function cookieToken(request) {
  const value = request.headers.get('cookie') || '';
  return value.match(/school_session=([^;]+)/)?.[1] || '';
}

async function authUser(request, env) {
  if (!env.DB) return null;
  const token = cookieToken(request);
  if (!token) return null;
  const tokenHash = await digest(token);
  return env.DB.prepare(`SELECT u.id, u.name, u.email, u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > datetime('now')`).bind(tokenHash).first();
}

function safeUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function handleApi(request, env, url) {
  if (!env.DB) return json({ error: 'D1 غير مربوط بعد. أضف binding باسم DB ثم نفذ migration.' }, 503);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (request.method === 'GET' && path === '/api/health') return json({ ok: true, database: 'connected' });

  if (request.method === 'POST' && path === '/api/auth/login') {
    const { email = '', password = '' } = await requestBody(request);
    const user = await env.DB.prepare('SELECT * FROM users WHERE email=? COLLATE NOCASE').bind(email.trim()).first();
    if (!user || !(await verifyPassword(password, user.password_hash))) return json({ error: 'البريد أو كلمة المرور غير صحيحة.' }, 401);
    const token = toBase64(crypto.getRandomValues(new Uint8Array(32))).replace(/[^a-zA-Z0-9]/g, '');
    await env.DB.prepare("INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,datetime('now','+7 days'))").bind(await digest(token), user.id).run();
    return json({ user: safeUser(user) }, 200, { 'set-cookie': `school_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800` });
  }

  if (request.method === 'POST' && path === '/api/auth/logout') {
    const token = cookieToken(request);
    if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run();
    return json({ ok: true }, 200, { 'set-cookie': 'school_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax' });
  }

  const user = await authUser(request, env);
  if (request.method === 'GET' && path === '/api/auth/me') return user ? json({ user: safeUser(user) }) : json({ user: null }, 401);
  if (!user) return json({ error: 'يجب تسجيل الدخول أولاً.' }, 401);

  if (request.method === 'GET' && path === '/api/posts') {
    const result = await env.DB.prepare(`SELECT p.id,p.title,p.text,p.image_url AS image,p.video_url AS video,p.pinned,p.created_at,p.author_id,u.name AS author,u.role,CASE WHEN f.user_id IS NULL THEN 0 ELSE 1 END AS favorite FROM posts p JOIN users u ON u.id=p.author_id LEFT JOIN favorites f ON f.post_id=p.id AND f.user_id=? ORDER BY p.pinned DESC,p.created_at DESC`).bind(user.id).all();
    return json({ posts: result.results });
  }

  if (request.method === 'POST' && path === '/api/posts') {
    if (user.role !== 'admin' && user.role !== 'teacher') return json({ error: 'ليس لديك صلاحية النشر.' }, 403);
    const { title = '', text = '', image = '', video = '' } = await requestBody(request);
    if (!title.trim() || !text.trim()) return json({ error: 'العنوان والنص مطلوبان.' }, 400);
    const id = newId('post');
    await env.DB.prepare('INSERT INTO posts (id,title,text,author_id,image_url,video_url) VALUES (?,?,?,?,?,?)').bind(id, title.trim(), text.trim(), user.id, image || null, video || null).run();
    return json({ id }, 201);
  }

  if (request.method === 'POST' && path === '/api/users') {
    if (user.role !== 'admin') return json({ error: 'هذه العملية للمدير فقط.' }, 403);
    const { name = '', email = '', password = '', role = 'teacher' } = await requestBody(request);
    if (!name.trim() || !email.trim() || !password || !['admin', 'teacher'].includes(role)) return json({ error: 'بيانات الحساب غير مكتملة.' }, 400);
    const id = newId('user');
    try {
      await env.DB.prepare('INSERT INTO users (id,name,email,password_hash,role) VALUES (?,?,?,?,?)').bind(id, name.trim(), email.trim(), await hashPassword(password), role).run();
    } catch {
      return json({ error: 'البريد مستخدم بالفعل.' }, 409);
    }
    return json({ id }, 201);
  }

  return json({ error: 'المسار غير موجود.' }, 404);
}

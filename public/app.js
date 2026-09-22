const roleName = { admin: 'مدير', teacher: 'معلم', student: 'طالب' };

const normalizePath = () => (location.pathname || '/').replace(/\/+$/, '') || '/';
const isAdminRoute = () => /\/admin(?:\/|$)/.test(normalizePath());
const isTeacherRoute = () => /\/teacher(?:\/|$)/.test(normalizePath());
const isDashboardRoute = () => normalizePath() === '/dashboard' || normalizePath() === '/';
const isLoginRoute = () => normalizePath() === '/login' || normalizePath() === '/login.html';

const navigate = (page) => { location.href = page; };

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const roleBadge = (role) => `<span class="role-badge">${roleName[role] || role}</span>`;

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'فشل الطلب');
  }

  return data;
}

async function getCurrentUser() {
  try {
    const data = await fetchJson('/api/auth/me');
    return data.user || null;
  } catch {
    return null;
  }
}

async function buildShell(content, active = 'home') {
  const user = await getCurrentUser();
  if (!user) {
    navigate('/login');
    return;
  }

  document.getElementById('app').innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand-box">
          <div class="brand-mark">م</div>
          <h2>مدارس الثقافة الرقمية</h2>
        </div>

        <nav class="nav">
          <a class="${active === 'home' ? 'active' : ''}" href="/dashboard">الرئيسية</a>
          ${user.role === 'admin' ? `<a class="${active === 'admin' ? 'active' : ''}" href="/admin">إدارة الحسابات</a>` : ''}
          ${user.role === 'teacher' ? `<a class="${active === 'teacher' ? 'active' : ''}" href="/teacher">نشر خبر</a>` : ''}
          <a href="#" id="logoutBtn">تسجيل الخروج</a>
        </nav>
      </aside>

      <main class="main-panel">
        ${content}
      </main>
    </div>
  `;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await fetchJson('/api/auth/logout', { method: 'POST' });
      } catch {}
      navigate('/login');
    });
  }
}

async function renderHome() {
  const user = await getCurrentUser();
  if (!user) {
    navigate('/login');
    return;
  }

  const data = await fetchJson('/api/posts');
  const posts = (data.posts || []).sort((a, b) => Number(b.pinned) - Number(a.pinned));
  const favorites = posts.filter((p) => p.favorite).map((p) => p.id);
  const notices = await fetchJson('/api/notices').catch(() => ({ notices: [] }));

  await buildShell(`
    <div class="topbar">
      <div>
        <h1>آخر الأخبار</h1>
        <p class="muted">مرحباً ${escapeHtml(user.name)}، هذه آخر الأخبار والرسائل الرسمية.</p>
      </div>
      <div class="user-pill">${roleBadge(user.role)} <span>${escapeHtml(user.email)}</span></div>
    </div>

    <div class="dashboard-grid">
      <section class="feeds" id="feed">
        ${posts.map((post) => {
          const isFav = !!post.favorite;
          const canManage = user.role !== 'student';
          const authorRole = post.role || 'teacher';
          return `
            <article class="card post-card ${post.pinned ? 'pinned' : ''}">
              <div class="post-head">
                <div>
                  <strong>${escapeHtml(post.author || 'مدرسة')}</strong>
                  ${roleBadge(authorRole)}
                </div>
                <div class="meta">
                  <span>${escapeHtml(new Date(post.created_at).toLocaleDateString('ar-EG'))}</span>
                  ${post.pinned ? '<span class="pin-tag">📌 مثبت</span>' : ''}
                </div>
              </div>

              <h3>${escapeHtml(post.title || 'خبر جديد')}</h3>
              <p>${escapeHtml(post.text || '')}</p>
              ${post.image ? `<img src="${escapeHtml(post.image)}" alt="صورة الخبر">` : ''}

              <div class="action-row">
                <button class="btn small secondary fav-btn" data-id="${post.id}">${isFav ? '★ في المفضلة' : '☆ حفظ في المفضلة'}</button>
                ${canManage ? `<button class="btn small danger delete-btn" data-id="${post.id}">حذف الخبر</button>` : ''}
                ${user.role === 'admin' ? `<button class="btn small secondary pin-btn" data-id="${post.id}">${post.pinned ? 'إزالة التثبيت' : 'تثبيت الخبر'}</button>` : ''}
              </div>
            </article>
          `;
        }).join('') || '<div class="card"><p class="muted">لا توجد منشورات حتى الآن.</p></div>'}
      </section>

      <aside class="sidebar-aside">
        <div class="card">
          <h3>الإشعارات</h3>
          ${(notices.notices || []).length ? (notices.notices || []).slice(-5).reverse().map((n) => `<p class="notice-item">${escapeHtml(n)}</p>`).join('') : '<p class="muted">لا توجد إشعارات جديدة.</p>'}
        </div>

        <div class="card stats-box">
          <h3>ملخص الحساب</h3>
          <div class="stat-row"><span>إجمالي المنشورات</span><b>${posts.length}</b></div>
          <div class="stat-row"><span>المفضلة</span><b>${favorites.length}</b></div>
          <div class="stat-row"><span>الدور</span><b>${roleName[user.role]}</b></div>
        </div>
      </aside>
    </div>
  `, 'home');

  bindCardActions();
}

function bindCardActions() {
  document.querySelectorAll('.fav-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        await fetchJson('/api/favorites', {
          method: 'POST',
          body: JSON.stringify({ post_id: id })
        });
      } catch (error) {
        console.error(error);
      }
      await renderHome();
    });
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        await fetchJson('/api/posts/' + id, { method: 'DELETE' });
      } catch (error) {
        console.error(error);
      }
      await renderHome();
    });
  });

  document.querySelectorAll('.pin-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        await fetchJson('/api/posts/' + id + '/pin', {
          method: 'POST'
        });
      } catch (error) {
        console.error(error);
      }
      await renderHome();
    });
  });
}

async function renderTeacher() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    navigate('/dashboard');
    return;
  }

  await buildShell(`
    <div class="topbar">
      <div>
        <h1>نشر خبر جديد</h1>
        <p class="muted">اكتب الخبر، أضف صورة اختيارية، ثم انشره مباشرة.</p>
      </div>
      <div class="user-pill">${roleBadge(user.role)}</div>
    </div>

    <section class="card form-card">
      <form id="postForm" class="form-grid">
        <label>عنوان الخبر
          <input id="postTitle" type="text" placeholder="مثل: إعلان يوم الرياضة" required>
        </label>

        <label>نص الخبر
          <textarea id="postText" placeholder="اكتب تفاصيل الخبر هنا..." required></textarea>
        </label>

        <label>رابط الصورة (اختياري)
          <input id="postImage" type="url" placeholder="https://example.com/image.jpg">
        </label>

        <button class="btn primary" type="submit">نشر الخبر</button>
        <p id="postMessage" class="message"></p>
      </form>
    </section>
  `, 'teacher');

  const form = document.getElementById('postForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('postTitle').value.trim();
    const text = document.getElementById('postText').value.trim();
    const image = document.getElementById('postImage').value.trim();
    const message = document.getElementById('postMessage');

    if (!title || !text) {
      message.textContent = 'يجب إدخال عنوان الخبر ونص الخبر.';
      return;
    }

    try {
      await fetchJson('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ title, text, image })
      });
      navigate('/dashboard');
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

async function renderAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    navigate('/dashboard');
    return;
  }

  const usersData = await fetchJson('/api/users').catch(() => ({ users: [] }));
  const users = usersData.users || [];

  await buildShell(`
    <div class="topbar">
      <div>
        <h1>إدارة الحسابات</h1>
        <p class="muted">يمكنك إنشاء حسابات للمعلمين بشكل مباشر.</p>
      </div>
      <div class="user-pill">${roleBadge(user.role)}</div>
    </div>

    <div class="admin-grid">
      <section class="card">
        <h3>إنشاء حساب جديد</h3>
        <form id="userForm" class="form-grid">
          <label>الاسم
            <input id="userName" required>
          </label>
          <label>البريد الإلكتروني
            <input id="userEmail" type="email" required>
          </label>
          <label>كلمة المرور
            <input id="userPassword" type="password" required>
          </label>
          <label>الدور
            <select id="userRole">
              <option value="teacher">معلم</option>
              <option value="admin">مدير</option>
            </select>
          </label>
          <button class="btn primary" type="submit">إضافة الحساب</button>
          <p id="adminMessage" class="message"></p>
        </form>
      </section>

      <section class="card">
        <h3>الحسابات الحالية</h3>
        <div class="user-list">
          ${users.map((item) => `
            <div class="user-row">
              <div>
                <strong>${escapeHtml(item.name)}</strong><br>
                <small>${escapeHtml(item.email)}</small>
              </div>
              <div class="user-actions">
                ${roleBadge(item.role)}
                ${item.id !== user.id ? `<button class="btn small danger delete-user" data-id="${item.id}">حذف</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `, 'admin');

  document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value.trim();
    const role = document.getElementById('userRole').value;
    const message = document.getElementById('adminMessage');

    if (!name || !email || !password) {
      message.textContent = 'يرجى إكمال جميع الحقول.';
      return;
    }

    try {
      await fetchJson('/api/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      });
      await renderAdmin();
    } catch (error) {
      message.textContent = error.message;
    }
  });

  document.querySelectorAll('.delete-user').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        await fetchJson('/api/users/' + id, { method: 'DELETE' });
      } catch (error) {
        console.error(error);
      }
      await renderAdmin();
    });
  });
}

function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const message = document.getElementById('loginMessage');

    try {
      const user = await fetchJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (user.user.role === 'admin') {
        navigate('/admin');
      } else if (user.user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

async function init() {
  const path = normalizePath();

  if (isLoginRoute()) {
    initLoginPage();
    return;
  }

  const user = await getCurrentUser();

  if (isAdminRoute()) {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    await renderAdmin();
    return;
  }

  if (isTeacherRoute()) {
    if (!user || user.role !== 'teacher') {
      navigate('/login');
      return;
    }
    await renderTeacher();
    return;
  }

  if (isDashboardRoute()) {
    if (!user) {
      navigate('/login');
      return;
    }
    await renderHome();
    return;
  }
}

document.addEventListener('DOMContentLoaded', init);


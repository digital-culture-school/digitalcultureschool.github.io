const roleName = { admin: 'مدير', teacher: 'معلم', student: 'طالب' };
const storage = {
  users: 'schoolUsers',
  posts: 'schoolPosts',
  session: 'schoolSession',
  favs: 'schoolFavs',
  notices: 'schoolNotices'
};

const defaultUsers = [
  { id: 'admin-1', name: 'المدير العام', email: 'admin@school.local', password: 'admin123', role: 'admin' },
  { id: 'teacher-1', name: 'أحمد المعلم', email: 'teacher@school.local', password: 'teacher123', role: 'teacher' },
  { id: 'student-1', name: 'سارة الطالب', email: 'student@school.local', password: 'student123', role: 'student' }
];

const defaultPosts = [
  {
    id: 'post-1',
    title: 'مرحباً بكم في منصة المدارس',
    text: 'نرحب بكم في منصة مدارس الثقافة الرقمية، حيث يمكن للمدرسة مشاركة الأخبار والإنجازات.',
    author: 'المدير العام',
    role: 'admin',
    pinned: true,
    image: '',
    date: new Date().toLocaleDateString('ar-EG')
  },
  {
    id: 'post-2',
    title: 'إعلان اختبارات نهاية الفصل',
    text: 'سيتم إعلان جدول الاختبارات خلال الأيام القادمة، يرجى متابعة صفحة الأخبار.',
    author: 'أحمد المعلم',
    role: 'teacher',
    pinned: false,
    image: '',
    date: new Date().toLocaleDateString('ar-EG')
  }
];

const ensureStorage = () => {
  if (!localStorage.getItem(storage.users)) {
    localStorage.setItem(storage.users, JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem(storage.posts)) {
    localStorage.setItem(storage.posts, JSON.stringify(defaultPosts));
  }
  if (!localStorage.getItem(storage.favs)) {
    localStorage.setItem(storage.favs, JSON.stringify([]));
  }
  if (!localStorage.getItem(storage.notices)) {
    localStorage.setItem(storage.notices, JSON.stringify([]));
  }
};

const read = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const currentUser = () => read(storage.session, null);

const navigate = (page) => {
  location.href = page;
};

const escapeHtml = (value = '') => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const roleBadge = (role) => `<span class="role-badge">${roleName[role] || role}</span>`;

function buildShell(content, active = 'home') {
  const user = currentUser();
  if (!user) {
    navigate('login.html');
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
          <a class="${active === 'home' ? 'active' : ''}" href="dashboard.html">الرئيسية</a>
          <a class="${active === 'feed' ? 'active' : ''}" href="dashboard.html#feed">آخر الأخبار</a>
          ${user.role === 'admin' ? `<a class="${active === 'admin' ? 'active' : ''}" href="admin.html">إدارة الحسابات</a>` : ''}
          ${user.role !== 'student' ? `<a class="${active === 'teacher' ? 'active' : ''}" href="teacher.html">نشر خبر</a>` : ''}
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
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem(storage.session);
      navigate('login.html');
    });
  }
}

function renderHome() {
  const user = currentUser();
  if (!user) {
    navigate('login.html');
    return;
  }

  const posts = read(storage.posts, []).sort((a, b) => Number(b.pinned) - Number(a.pinned));
  const favorites = read(storage.favs, []);
  const notices = read(storage.notices, []);

  buildShell(`
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
          const isFav = favorites.includes(post.id);
          const canManage = user.role !== 'student';
          return `
            <article class="card post-card ${post.pinned ? 'pinned' : ''}">
              <div class="post-head">
                <div>
                  <strong>${escapeHtml(post.author)}</strong>
                  ${roleBadge(post.role)}
                </div>
                <div class="meta">
                  <span>${escapeHtml(post.date)}</span>
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
          ${notices.length ? notices.slice(-5).reverse().map((n) => `<p class="notice-item">${escapeHtml(n)}</p>`).join('') : '<p class="muted">لا توجد إشعارات جديدة.</p>'}
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
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const favs = read(storage.favs, []);
      const updated = favs.includes(id) ? favs.filter((item) => item !== id) : [...favs, id];
      write(storage.favs, updated);
      renderHome();
    });
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const posts = read(storage.posts, []).filter((item) => item.id !== id);
      write(storage.posts, posts);
      const favs = read(storage.favs, []).filter((item) => item !== id);
      write(storage.favs, favs);
      renderHome();
    });
  });

  document.querySelectorAll('.pin-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const posts = read(storage.posts, []).map((post) => {
        if (post.id === id) {
          return { ...post, pinned: !post.pinned };
        }
        return post;
      });
      write(storage.posts, posts);
      renderHome();
    });
  });
}

function renderTeacher() {
  const user = currentUser();
  if (!user || user.role === 'student') {
    navigate('dashboard.html');
    return;
  }

  buildShell(`
    <div class="topbar">
      <div>
        <h1>نشر خبر جديد</h1>
        <p class="muted">اكتب الخبر، أضف صورة optional، ثم انشره مباشرة.</p>
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
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('postTitle').value.trim();
    const text = document.getElementById('postText').value.trim();
    const image = document.getElementById('postImage').value.trim();
    const message = document.getElementById('postMessage');

    if (!title || !text) {
      message.textContent = 'يجب إدخال عنوان الخبر ونص الخبر.';
      return;
    }

    const posts = read(storage.posts, []);
    const newPost = {
      id: `post-${Date.now()}`,
      title,
      text,
      author: user.name,
      role: user.role,
      image,
      pinned: false,
      date: new Date().toLocaleDateString('ar-EG')
    };

    write(storage.posts, [newPost, ...posts]);
    const notices = read(storage.notices, []);
    writesNotice(notices, `${user.name} نشر خبراً جديداً`);
    navigate('dashboard.html');
  });
}

function writesNotice(notices, item) {
  write(storage.notices, [...notices, item]);
}

function renderAdmin() {
  const user = currentUser();
  if (!user || user.role !== 'admin') {
    navigate('dashboard.html');
    return;
  }

  const users = read(storage.users, []);

  buildShell(`
    <div class="topbar">
      <div>
        <h1>إدارة الحسابات</h1>
        <p class="muted">يمكنك إنشاء حسابات للمعلمين والطلاب بشكل مباشر.</p>
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
              <option value="student">طالب</option>
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
                ${item.id !== 'admin-1' ? `<button class="btn small danger delete-user" data-id="${item.id}">حذف</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `, 'admin');

  document.getElementById('userForm').addEventListener('submit', (e) => {
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

    const users = read(storage.users, []);
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      message.textContent = 'هذا البريد مستخدم بالفعل.';
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      role
    };

    write(storage.users, [...users, newUser]);
    write(storage.notices, [...read(storage.notices, []), `تم إنشاء حساب جديد: ${name}`]);
    renderAdmin();
  });

  document.querySelectorAll('.delete-user').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const users = read(storage.users, []).filter((item) => item.id !== id);
      write(storage.users, users);
      renderAdmin();
    });
  });
}

function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const message = document.getElementById('loginMessage');

    const users = read(storage.users, []);
    const matched = users.find((user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password);

    if (!matched) {
      message.textContent = 'البريد أو كلمة المرور غير صحيحة.';
      return;
    }

    write(storage.session, matched);
    navigate('dashboard.html');
  });
}

function init() {
  ensureStorage();

  const path = location.pathname.split('/').pop();

  if (path === 'login.html') {
    initLoginPage();
    return;
  }

  if (path === 'admin.html') {
    renderAdmin();
    return;
  }

  if (path === 'teacher.html') {
    renderTeacher();
    return;
  }

  if (path === 'dashboard.html' || path === '') {
    renderHome();
    return;
  }
}

document.addEventListener('DOMContentLoaded', init);

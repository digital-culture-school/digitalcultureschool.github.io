export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    const map = {
      '/': '/index.html',
      '/login': '/login.html',
      '/dashboard': '/dashboard.html',
      '/admin': '/admin.html',
      '/teacher': '/teacher.html'
    };

    if (pathname.startsWith('/admin/')) {
      return env.ASSETS.fetch(new Request(new URL('/admin.html', url), request));
    }

    if (pathname.startsWith('/teacher/')) {
      return env.ASSETS.fetch(new Request(new URL('/teacher.html', url), request));
    }

    if (map[pathname]) {
      return env.ASSETS.fetch(new Request(new URL(map[pathname], url), request));
    }

    if (pathname === '/index.html' || pathname === '/login.html' || pathname === '/dashboard.html' || pathname === '/admin.html' || pathname === '/teacher.html') {
      return env.ASSETS.fetch(request);
    }

    return env.ASSETS.fetch(request);
  }
};

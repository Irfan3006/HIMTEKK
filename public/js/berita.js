/**
 * ============================================================================
 * HIMTEKK Berita & Admin Client Library
 * ============================================================================
 */

(function (window) {
  'use strict';

  const STORAGE_USER_KEY = 'himtekk_berita_user';
  const STORAGE_TOKEN_KEY = 'himtekk_berita_token';

  // --------------------------------------------------------------------------
  // Autentikasi
  // --------------------------------------------------------------------------
  const BeritaAuth = {
    getUser: function () {
      try {
        const raw = localStorage.getItem(STORAGE_USER_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },

    setUser: function (user, token) {
      if (user) localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_USER_KEY);

      if (token) localStorage.setItem(STORAGE_TOKEN_KEY, token);
      else if (token === null) localStorage.removeItem(STORAGE_TOKEN_KEY);
    },

    getToken: function () {
      return localStorage.getItem(STORAGE_TOKEN_KEY) || '';
    },

    isLoggedIn: function () {
      const u = this.getUser();
      return Boolean(u && u.id && u.role);
    },

    isAdmin: function () {
      const u = this.getUser();
      return Boolean(u && u.role === 'admin');
    },

    requireAuth: function () {
      if (!this.isLoggedIn()) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/berita/login?redirect=${redirect}`;
        return false;
      }
      return true;
    },

    requireAdmin: function () {
      if (!this.requireAuth()) return false;
      if (!this.isAdmin()) {
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'error',
            title: 'Akses Terbatas',
            text: 'Halaman ini hanya dapat diakses oleh Administrator.',
            confirmButtonColor: '#00406E'
          }).then(() => {
            window.location.href = '/berita/admin';
          });
        } else {
          alert('Akses hanya untuk Administrator.');
          window.location.href = '/berita/admin';
        }
        return false;
      }
      return true;
    },

    logout: async function () {
      try {
        await BeritaAPI.call('logout', {});
      } catch (_) {}
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      window.location.href = '/berita/login';
    }
  };

  // --------------------------------------------------------------------------
  // API Caller Gateway
  // --------------------------------------------------------------------------
  const BeritaAPI = {
    call: async function (action, data = {}, options = {}) {
      const url = `/api/berita/${encodeURIComponent(action)}`;
      const token = BeritaAuth.getToken();

      const payload = { ...data };
      if (token && !payload.token) payload.token = token;

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const json = await res.json();

        // Sesi expired / invalid
        if (!json.success && json.code === 'unauthorized') {
          localStorage.removeItem(STORAGE_USER_KEY);
          localStorage.removeItem(STORAGE_TOKEN_KEY);
          if (window.location.pathname.startsWith('/berita/admin')) {
            window.location.href = '/berita/login?msg=session_expired';
          }
        }

        return json;
      } catch (err) {
        console.error(`[BeritaAPI] ${action} error:`, err);
        return {
          success: false,
          message: 'Gagal terhubung ke gateway API. Periksa koneksi internet Anda.'
        };
      }
    },

    login: function (username, password) {
      return this.call('login', { username, password });
    },

    getStats: function () {
      return this.call('admin_stats', {});
    },

    getPosts: function () {
      return this.call('admin_list_posts', {});
    },

    getPost: function (id) {
      return this.call('admin_get_post', { id });
    },

    savePost: function (postData) {
      return this.call('admin_save_post', postData);
    },

    updateFlags: function (id, status, featured) {
      return this.call('admin_update_flags', { id, status, featured });
    },

    deletePost: function (id) {
      return this.call('admin_delete_post', { id });
    },

    getCategories: function () {
      return this.call('admin_list_categories', {});
    },

    saveCategory: function (catData) {
      return this.call('admin_save_category', catData);
    },

    deleteCategory: function (slug) {
      return this.call('admin_delete_category', { slug });
    },

    getUsers: function () {
      return this.call('admin_list_users', {});
    },

    saveUser: function (userData) {
      return this.call('admin_save_user', userData);
    },

    deleteUser: function (id) {
      return this.call('admin_delete_user', { id });
    },

    getAuditLog: function (limit = 100) {
      return this.call('admin_audit_log', { limit });
    },

    changePassword: function (old_password, new_password) {
      return this.call('change_password', { old_password, new_password });
    },

    uploadImage: function (base64Data, filename) {
      return this.call('admin_upload_image', { data: base64Data, filename });
    },

    incrementView: function (slug) {
      if (!slug) return;
      const key = `viewed_${slug}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      return this.call('increment_view', { slug });
    }
  };

  // --------------------------------------------------------------------------
  // Notifikasi & UI
  // --------------------------------------------------------------------------
  function showToast(icon, title, text = '') {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: icon,
        title: title,
        text: text,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true
      });
    } else {
      alert(`${title}\n${text}`);
    }
  }

  window.BeritaAuth = BeritaAuth;
  window.BeritaAPI = BeritaAPI;
  window.showBeritaToast = showToast;
})(window);

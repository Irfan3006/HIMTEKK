import type { APIRoute } from 'astro';
import { BERITA_CONFIG } from '../../../lib/berita-config';
import { invalidateBeritaCache } from '../../../lib/berita-api';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const action = params.action;
  if (!action) {
    return new Response(JSON.stringify({ success: false, message: 'Aksi tidak ditentukan.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body: Record<string, any> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Ambil token dari body atau cookie
  const token = body.token || cookies.get('himtekk_admin_token')?.value || '';

  const scriptUrl = BERITA_CONFIG.scriptUrl;
  if (!scriptUrl) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Google Apps Script belum dikonfigurasi (BERITA_SCRIPT_URL kosong). Silakan atur environment variable di Vercel.',
        code: 'not_configured'
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const payload = {
      secret: BERITA_CONFIG.apiSecret,
      action: action,
      token: token,
      ...body
    };

    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Respons dari Google Apps Script tidak valid.',
          raw: text.substring(0, 200)
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Jika login berhasil, set cookie sesi httpOnly
    if (action === 'login' && data.success && data.data?.token) {
      cookies.set('himtekk_admin_token', data.data.token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 // 12 jam
      });
    }

    // Jika logout, hapus cookie sesi
    if (action === 'logout') {
      cookies.delete('himtekk_admin_token', { path: '/' });
    }

    // Jika aksi mengubah konten, invalidate SSR cache
    if (
      action.startsWith('admin_save') ||
      action.startsWith('admin_delete') ||
      action.startsWith('admin_update')
    ) {
      invalidateBeritaCache();
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error(`[api/berita/${action}] Error:`, err);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Gagal menghubungi server database Google Sheets.',
        error: err?.message || String(err)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async ({ params }) => {
  return new Response(
    JSON.stringify({
      success: true,
      service: 'himtekk-berita-gateway',
      action: params.action,
      status: 'ready'
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

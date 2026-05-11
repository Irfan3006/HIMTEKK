// worker-script.js

// Definisi binding KV Namespace
// Pastikan Anda mengikat KV Namespace ini di pengaturan Cloudflare Worker Anda
// dengan nama variabel SHORTLINKS
const KV_NAMESPACE = SHORTLINKS; 

// --- Konfigurasi ---
const CUSTOM_MIN_LENGTH = 5; // Minimal 5 huruf untuk kode kustom
const CUSTOM_MAX_LENGTH = 20; // Maksimal 20 huruf untuk kode kustom
const RANDOM_SHORT_LENGTH = 6; // Panjang tetap 6 huruf untuk kode acak
const AUTO_REDIRECT_DELAY_SECONDS = 3; // Waktu pengalihan otomatis dalam detik
const DOMAIN = 'go.himtekk.com';
const BASE_URL = `https://${DOMAIN}`;

// --- Cache Settings ---
const MEM_CACHE = new Map(); 
const MAX_MEM_CACHE_SIZE = 100; // Batasi jumlah item di memori agar tidak memory leak
const CACHE_TTL = 3600; // Cache selama 1 jam (dalam detik)

// --- Fungsi Pembantu Cache ---

// Mengambil dari Memory Cache (Mengembalikan longUrl string)
function getFromMemCache(path) {
    const entry = MEM_CACHE.get(path);
    if (!entry) return null;
    
    // Validasi TTL
    if (Date.now() - entry.timestamp > CACHE_TTL * 1000) {
        MEM_CACHE.delete(path);
        return null;
    }
    return entry.longUrl;
}

// Menyimpan ke Memory Cache (Simpan longUrl string)
function setToMemCache(path, longUrl) {
    if (!longUrl) return;

    if (MEM_CACHE.size >= MAX_MEM_CACHE_SIZE) {
        // Hapus entri tertua (FIFO)
        const oldestKey = MEM_CACHE.keys().next().value;
        MEM_CACHE.delete(oldestKey);
    }
    
    MEM_CACHE.set(path, {
        longUrl: longUrl,
        timestamp: Date.now()
    });
}

// Fungsi Helper untuk membuat response pengalihan dan menyimpannya ke Edge Cache
function serveRedirectResponse(request, longUrl, event, cacheStatus) {
    const responseBody = renderSafeRedirectPage(request.url, longUrl);
    const response = new Response(responseBody, {
        headers: { 
            'Content-Type': 'text/html',
            'Cache-Control': `public, max-age=${CACHE_TTL}`,
            'X-HIMTEKK-Cache': cacheStatus
        },
    });

    // Simpan ke Edge Cache secara proaktif
    if (request.method === 'GET' || cacheStatus === 'PRE-WARMED') {
        const cache = caches.default;
        event.waitUntil((async () => {
            try {
                // Gunakan request URL yang asli untuk key cache
                await cache.put(request, response.clone());
            } catch (e) {
                console.error("Proactive Cache failed:", e);
            }
        })());
    }

    return response;
}

// --- Fungsi Pembantu ---

// Fungsi untuk menghasilkan kode pendek acak (hanya huruf)
function generateShortCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// --- Template HTML ---

// // Fungsi untuk merender halaman pembuatan shortlink
function renderCreatePage(initialMessage = '', initialIsError = false, initialShortUrlResult = '') {
    const messageClass = initialIsError ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400';
    const messageHtml = initialMessage ? `
        <div class="mb-6 p-4 rounded-2xl border ${messageClass} animate__animated animate__fadeIn">
            <p class="text-sm font-semibold flex items-center justify-center gap-2">
                <i class="fas ${initialIsError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
                ${initialMessage}
            </p>
        </div>` : '';

    const shortUrlDisplay = initialShortUrlResult ? `
        <div class="mt-8 p-6 bg-white/5 border border-white/10 rounded-[2rem] animate__animated animate__zoomIn">
            <label class="block text-xs font-bold text-accent uppercase tracking-widest mb-3 text-left opacity-80">Link Pendek Berhasil Dibuat</label>
            <div class="flex flex-col sm:flex-row items-stretch gap-2">
                <input type="text" id="shortenedLink" value="${initialShortUrlResult}" readonly 
                    class="flex-grow bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none text-sm font-medium">
                <button onclick="copyToClipboard('shortenedLink')" id="copyBtn"
                    class="bg-accent hover:bg-yellow-600 text-primary font-bold py-3 px-8 rounded-xl transition-all duration-300 transform active:scale-95 whitespace-nowrap text-sm shadow-lg shadow-accent/20">
                    Salin Link
                </button>
            </div>
        </div>
    ` : '';

    return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HIMTEKK - URL Shortener</title>
        <meta property="og:title" content="HIMTEKK - URL Shortener">
        <meta property="og:description" content="Make your links short & simple">
        <meta property="og:image" content="https://i.ibb.co.com/JWQD3LTZ/logo.webp">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:image" content="https://i.ibb.co.com/JWQD3LTZ/logo.webp">
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link rel="icon" type="image/webp" href="https://i.ibb.co.com/JWQD3LTZ/logo.webp">
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        colors: {
                            primary: '#00406E',
                            accent: '#DBB865',
                        },
                        fontFamily: {
                            sans: ['Outfit', 'sans-serif'],
                        }
                    }
                }
            }
        </script>
        <style>
            body {
                background: #00406E;
                background: radial-gradient(circle at 0% 0%, #005a9c 0%, #00406E 100%);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                margin: 0;
            }
            .glass {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .input-group:focus-within {
                border-color: #DBB865;
                box-shadow: 0 0 0 4px rgba(219, 184, 101, 0.1);
            }
            /* Autofill Fix */
            input:-webkit-autofill,
            input:-webkit-autofill:hover, 
            input:-webkit-autofill:focus {
                -webkit-text-fill-color: white;
                -webkit-box-shadow: 0 0 0px 1000px #00406E inset;
                transition: background-color 5000s ease-in-out 0s;
                caret-color: white;
            }
        </style>
        <script>
            function copyToClipboard(elementId) {
                const copyText = document.getElementById(elementId);
                const btn = document.getElementById('copyBtn');
                copyText.select();
                navigator.clipboard.writeText(copyText.value).then(() => {
                    const originalText = btn.innerText;
                    btn.innerText = 'Tersalin!';
                    btn.style.backgroundColor = '#10b981';
                    setTimeout(() => {
                        btn.innerText = originalText;
                        btn.style.backgroundColor = '';
                    }, 2000);
                });
            }

            window.onload = function() {
                const url = new URL(window.location.href);
                if (url.searchParams.has('message') || url.searchParams.has('isError') || url.searchParams.has('result')) {
                    url.searchParams.delete('message');
                    url.searchParams.delete('isError');
                    url.searchParams.delete('result');
                    history.replaceState({}, document.title, url.toString());
                }
            };
        </script>
    </head>
    <body class="p-4 sm:p-8">
        <div class="glass p-8 sm:p-12 rounded-[3rem] shadow-2xl max-w-lg w-full text-center relative overflow-hidden animate__animated animate__fadeIn">
            <!-- Decorative circle -->
            <div class="absolute -top-20 -right-20 w-48 h-48 bg-accent/10 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-20 -left-20 w-48 h-48 bg-accent/5 rounded-full blur-3xl"></div>

            <div class="mb-10 flex justify-center relative z-10">
                <div class="bg-white/10 p-6 rounded-[2.5rem] backdrop-blur-md border border-white/20 shadow-2xl transition-transform hover:scale-110 duration-500">
                    <img src="https://i.ibb.co.com/JWQD3LTZ/logo.webp" alt="HIMTEKK Logo" class="w-24 h-24 drop-shadow-[0_0_20px_rgba(219,184,101,0.5)]">
                </div>
            </div>
            
            <div class="relative z-10">
                <h1 class="text-4xl sm:text-5xl font-bold mb-2 text-white tracking-tight">
                    <span class="text-accent">HIM</span>TEKK Short
                </h1>
                <p class="text-white/60 mb-10 text-lg font-light italic">"Make your links short & simple"</p>
                
                ${messageHtml}

                <form action="/" method="POST" class="space-y-6 text-left">
                    <div>
                        <label for="long_url" class="block text-xs font-bold text-accent uppercase tracking-widest mb-3 ml-1 opacity-80">Target URL Panjang</label>
                        <div class="flex items-center bg-white/5 border border-white/10 rounded-2xl input-group transition-all overflow-hidden">
                            <div class="pl-4 text-white/40">
                                <i class="fas fa-link"></i>
                            </div>
                            <input type="url" id="long_url" name="long_url" placeholder="https://himtekk.com/sangat-panjang" required 
                                class="w-full bg-transparent border-none text-white px-4 py-4 focus:outline-none placeholder:text-white/20">
                        </div>
                    </div>
                    
                    <div>
                        <label for="short_code" class="block text-xs font-bold text-accent uppercase tracking-widest mb-3 ml-1 opacity-80">Custom URL (Opsional)</label>
                        <div class="flex items-center bg-white/5 border border-white/10 rounded-2xl input-group transition-all overflow-hidden">
                            <div class="pl-4 pr-1 text-white/40 text-sm font-medium border-r border-white/5 whitespace-nowrap">
                                go.himtekk.com/
                            </div>
                            <input type="text" id="short_code" name="short_code" placeholder="url-kamu" 
                                minlength="${CUSTOM_MIN_LENGTH}" maxlength="${CUSTOM_MAX_LENGTH}" pattern="[a-zA-Z0-9\-]+" 
                                title="Hanya boleh huruf, angka, dan tanda hubung" 
                                class="w-full bg-transparent border-none text-white px-3 py-4 focus:outline-none placeholder:text-white/20">
                        </div>
                    </div>

                    <button type="submit" class="w-full py-4 bg-accent hover:bg-yellow-600 text-primary font-black text-lg rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-accent/20 flex items-center justify-center gap-3">
                        BUAT SHORTLINK <i class="fas fa-magic"></i>
                    </button>
                </form>

                ${shortUrlDisplay}
            </div>
        </div>

        <div class="mt-12 text-center relative z-10 animate__animated animate__fadeIn animate__delay-1s">
            <p class="text-white/30 text-sm font-medium tracking-wide flex items-center gap-2 justify-center">
                <span class="w-8 h-[1px] bg-white/10"></span>
                Created by <a href="https://irfan-syarifudin.vercel.app/" target="_blank" rel="noopener noreferrer" class="text-white/50 hover:text-accent transition-colors">Irfan Syarifudin</a>
                <span class="w-8 h-[1px] bg-white/10"></span>
            </p>
        </div>
    </body>
    </html>
    `;
}

// Fungsi untuk merender halaman "Pengalihan Aman"
function renderSafeRedirectPage(shortUrl, longUrl) {
    return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HIMTEKK - Mengalihkan...</title>
        <meta property="og:title" content="HIMTEKK - Mengalihkan...">
        <meta property="og:description" content="Anda sedang dialihkan ke tautan tujuan yang aman.">
        <meta property="og:image" content="https://i.ibb.co.com/JWQD3LTZ/logo.webp">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:image" content="https://i.ibb.co.com/JWQD3LTZ/logo.webp">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link rel="icon" type="image/webp" href="https://i.ibb.co.com/JWQD3LTZ/logo.webp">
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        colors: {
                            primary: '#00406E',
                            accent: '#DBB865',
                        },
                        fontFamily: {
                            sans: ['Outfit', 'sans-serif'],
                        }
                    }
                }
            }
        </script>
        <style>
            body {
                background: #00406E;
                background: radial-gradient(circle at 100% 100%, #005a9c 0%, #00406E 100%);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                margin: 0;
            }
            .glass {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .progress-bar {
                animation: progress ${AUTO_REDIRECT_DELAY_SECONDS}s linear forwards;
            }
            @keyframes progress {
                0% { width: 0%; }
                100% { width: 100%; }
            }
        </style>
        <script>
            window.onload = function() {
                setTimeout(function() {
                    window.location.href = "${longUrl}"; 
                }, ${AUTO_REDIRECT_DELAY_SECONDS * 1000});
            };
        </script>
    </head>
    <body class="p-4 text-white">
        <div class="glass p-10 sm:p-14 rounded-[3.5rem] shadow-2xl max-w-md w-full text-center relative overflow-hidden animate__animated animate__fadeIn">
            <div class="absolute -top-10 -left-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl"></div>
            
            <div class="mb-10 flex flex-col items-center relative z-10">
                <div class="relative mb-8">
                    <div class="absolute inset-0 bg-accent/20 rounded-full animate-ping opacity-50"></div>
                    <div class="relative bg-white/10 p-6 rounded-full border border-white/20 shadow-2xl transition-transform hover:scale-110 duration-500">
                        <i class="fas fa-shield-halved text-6xl text-accent drop-shadow-[0_0_15px_rgba(219,184,101,0.5)]"></i>
                    </div>
                </div>
                <h1 class="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">Tautan Aman!</h1>
                <p class="text-white/60 text-lg font-light">Mohon tunggu sejenak...</p>
            </div>
<div class="space-y-8 relative z-10">
                <div class="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <p class="text-xs font-bold text-accent uppercase tracking-widest mb-2 opacity-80">Anda akan dialihkan ke</p>
                    <p class="text-sm font-medium truncate px-2 italic text-white/90">"${longUrl}"</p>
                </div>

                <div class="space-y-3">
                    <div class="relative h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div class="progress-bar absolute top-0 left-0 h-full bg-accent shadow-[0_0_15px_rgba(219,184,101,0.5)]"></div>
                    </div>
                    <p class="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Mengalihkan secara otomatis</p>
                </div>

                <a href="${longUrl}" rel="noopener noreferrer" 
                    class="w-full py-5 bg-accent hover:bg-yellow-600 text-primary font-black text-lg rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-accent/20 flex items-center justify-center gap-3">
                    LANJUTKAN <i class="fas fa-external-link-alt text-sm"></i>
                </a>
            </div>
        </div>

        <div class="mt-12 text-center relative z-10 animate__animated animate__fadeIn animate__delay-1s">
            <img src="https://i.ibb.co.com/JWQD3LTZ/logo.webp" alt="HIMTEKK Logo" class="w-20 h-20 mx-auto mb-4 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-pointer">
            <p class="text-white/20 text-[10px] tracking-[0.3em] uppercase font-bold">Safe Link Protected</p>
        </div>
    </body>
    </html>
    `;
}


// --- Main Event Listener ---
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
    const request = event.request;
    const url = new URL(request.url);
    const path = url.pathname.slice(1); // Hapus garis miring di depan

    // --- STRATEGI CACHING (BIG Performance Boost) ---
    // Hanya cache request GET untuk shortlink
    const isShortlinkRequest = request.method === 'GET' && path !== '' && !url.searchParams.has('message');

    if (isShortlinkRequest) {
        // 1. Cek In-Memory Cache (Skip KV & Cache API jika ada)
        const cachedLongUrl = getFromMemCache(path);
        if (cachedLongUrl) {
            return serveRedirectResponse(request, cachedLongUrl, event, 'HIT-MEM');
        }

        // 2. Cek Cloudflare Edge Cache (Cache API)
        const cache = caches.default;
        let cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
    }

    // Tangani permintaan POST untuk membuat shortlink
    if (request.method === 'POST') {
        if (url.pathname !== '/') {
            return new Response('Tidak Ditemukan', { status: 404 });
        }
        return handleCreateShortlink(event);
    }

    // Tangani permintaan GET untuk halaman pembuatan
    if (path === '') {
        // Ambil parameter dari URL untuk inisialisasi halaman
        const message = url.searchParams.get('message') || '';
        const isError = url.searchParams.get('isError') === 'true';
        const result = url.searchParams.get('result') || '';

        // Render halaman dengan pesan dan hasil jika ada
        return new Response(renderCreatePage(message, isError, result), {
            headers: { 'Content-Type': 'text/html' },
        });
    }

    // Tangani permintaan GET untuk mengalihkan shortlink
    // Gunakan cacheTtl untuk optimasi pembacaan KV
    const longUrl = await KV_NAMESPACE.get(path, { cacheTtl: CACHE_TTL });

    if (longUrl) {
        // Simpan ke Memory Cache untuk request berikutnya
        setToMemCache(path, longUrl);
        
        // Kirim response dan simpan ke Edge Cache
        return serveRedirectResponse(request, longUrl, event, 'MISS');
    } else {
        // Jika shortlink tidak ditemukan, alihkan kembali ke halaman utama
        // dengan pesan error menggunakan parameter URL
        const redirectUrl = new URL(BASE_URL);
        redirectUrl.searchParams.set('message', 'Shortlink tidak ditemukan!');
        redirectUrl.searchParams.set('isError', 'true');
        return Response.redirect(redirectUrl.toString(), 302);
    }
}

async function handleCreateShortlink(event) {
    const request = event.request;
    const formData = await request.formData();
    const longUrl = formData.get('long_url');
    let shortCode = formData.get('short_code');

    let message = '';
    let isError = false;
    let shortUrlResult = '';

    if (!longUrl) {
        message = 'URL tidak boleh kosong.';
        isError = true;
    } else {
        try {
            new URL(longUrl);
        } catch (e) {
            message = 'Format URL tidak valid. Pastikan dimulai dengan http:// atau https://';
            isError = true;
        }
    }

    if (!isError) {
        let generatedCode;
        if (shortCode) { // Jika pengguna memasukkan kode kustom
            shortCode = shortCode.replace(/[^a-zA-Z0-9\-]/g, ''); // Izinkan huruf, angka, dan tanda hubung
            
            if (shortCode.length < CUSTOM_MIN_LENGTH || shortCode.length > CUSTOM_MAX_LENGTH) {
                message = `Kode pendek kustom harus ${CUSTOM_MIN_LENGTH} sampai ${CUSTOM_MAX_LENGTH} huruf.`;
                isError = true;
            } else {
                const existing = await KV_NAMESPACE.get(shortCode);
                if (existing) {
                    message = `Kode pendek kustom "${shortCode}" sudah digunakan.`;
                    isError = true;
                } else {
                    generatedCode = shortCode;
                }
            }
        } else { // Jika pengguna TIDAK memasukkan kode kustom, generate acak 6 huruf
            let foundUnique = false;
            let attemptCount = 0;
            while (!foundUnique && attemptCount < 10) { // Batasi percobaan
                generatedCode = generateShortCode(RANDOM_SHORT_LENGTH); // Panjang tetap 6 huruf
                const existing = await KV_NAMESPACE.get(generatedCode);
                if (!existing) {
                    foundUnique = true;
                }
                attemptCount++;
            }
            if (!foundUnique) {
                 message = 'Gagal menghasilkan kode pendek unik setelah beberapa percobaan. Silakan coba lagi.';
                 isError = true;
            }
        }

        if (!isError && generatedCode) {
            await KV_NAMESPACE.put(generatedCode, longUrl);
            
            // --- PRE-WARM CACHE LEVEL DEWA ---
            // 1. Warm-up Memory Cache
            setToMemCache(generatedCode, longUrl);

            // 2. Proactive Edge Cache Warm-up
            // Kita buat request "palsu" untuk men-trigger penyimpanan ke CDN
            const fakeRequest = new Request(`${BASE_URL}/${generatedCode}`);
            serveRedirectResponse(fakeRequest, longUrl, event, 'PRE-WARMED');

            shortUrlResult = `${BASE_URL}/${generatedCode}`;
            message = 'Shortlink berhasil dibuat!';
            isError = false; 
        }
    }

    // Lakukan redirect ke halaman utama setelah pemrosesan POST
    // Sertakan pesan dan hasil sebagai parameter query string
    const redirectUrl = new URL(BASE_URL);
    if (message) {
        redirectUrl.searchParams.set('message', message);
    }
    if (isError) {
        redirectUrl.searchParams.set('isError', 'true');
    }
    if (shortUrlResult) {
        redirectUrl.searchParams.set('result', shortUrlResult);
    }

    return Response.redirect(redirectUrl.toString(), 302);
}
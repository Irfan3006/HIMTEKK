// JS File Cookie & Consent Manager HIMTEKK
const CookieManager = (() => {
    const CONFIG = {
        GA_ID: 'G-YWKD4CJZJY',
        COOKIE_NAME: 'himtekk_consent_v2',
        VERSION: 1,
        EXPIRY_DAYS: 365,
        BANNER_ID: 'cookie-consent-banner'
    };

    let initialized = false;

    // 1. Core Utilities: Robust Cookie Management
    const setCookie = (name, value, days) => {
        try {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = "; expires=" + date.toUTCString();
            const secure = window.location.protocol === 'https:' ? "; Secure" : "";
            const cookieValue = encodeURIComponent(JSON.stringify(value));
            document.cookie = `${name}=${cookieValue}${expires}; path=/; SameSite=Lax${secure}`;
        } catch (e) {
            console.error('CookieManager: Write error', e);
        }
    };

    const getCookie = (name) => {
        try {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i].trim();
                if (c.indexOf(nameEQ) === 0) {
                    const rawValue = decodeURIComponent(c.substring(nameEQ.length, c.length));
                    return JSON.parse(rawValue);
                }
            }
        } catch (e) {
            console.warn('CookieManager: Parse error (corrupted data)');
        }
        return null;
    };

    const initializeGtag = () => {
        if (window.gtagInitialized) return;
        
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { dataLayer.push(arguments); };
        
        gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'wait_for_update': 500
        });

        gtag('js', new Date());
        gtag('config', CONFIG.GA_ID, { 'anonymize_ip': true });
        
        window.gtagInitialized = true;
    };

    const applyConsent = (status) => {
        if (!window.gtag) initializeGtag();

        if (status === 'accepted') {
            delete window[`ga-disable-${CONFIG.GA_ID}`];
            
            gtag('consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted'
            });

            injectAnalyticsScript();
        } else {
            window[`ga-disable-${CONFIG.GA_ID}`] = true;
        }
    };

    const injectAnalyticsScript = () => {
        if (document.querySelector(`script[src*="${CONFIG.GA_ID}"]`)) return;
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA_ID}`;
        document.head.appendChild(script);
    };

    const saveConsent = (status) => {
        const data = { status, version: CONFIG.VERSION, ts: Date.now() };
        setCookie(CONFIG.COOKIE_NAME, data, CONFIG.EXPIRY_DAYS);
        try { localStorage.setItem(CONFIG.COOKIE_NAME, JSON.stringify(data)); } catch(e) {}
    };

    const loadConsent = () => {
        let data = getCookie(CONFIG.COOKIE_NAME);
        if (!data) {
            try {
                const localData = localStorage.getItem(CONFIG.COOKIE_NAME);
                if (localData) {
                    data = JSON.parse(localData);
                    if (data && data.version === CONFIG.VERSION) setCookie(CONFIG.COOKIE_NAME, data, CONFIG.EXPIRY_DAYS);
                }
            } catch(e) {}
        }
        return (data && data.version === CONFIG.VERSION) ? data : null;
    };

    const createBanner = () => {
        if (document.getElementById(CONFIG.BANNER_ID)) return;
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', createBanner, { once: true });
            return;
        }

        const banner = document.createElement('div');
        banner.id = CONFIG.BANNER_ID;
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-label', 'Cookie Consent');
        banner.className = 'fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-[100] animate__animated animate__fadeInUp';
        banner.innerHTML = `
            <div class="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-white/20">
                <div class="flex items-start gap-4 text-left">
                    <div class="bg-primary/10 p-3 rounded-2xl text-primary flex-shrink-0">
                        <i class="fas fa-cookie-bite text-2xl"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-bold text-primary text-lg mb-1">Privacy & Cookies</h4>
                        <p class="text-slate-600 text-sm leading-relaxed mb-4">
                            Kami menggunakan cookie untuk mengoptimalkan pengalaman Anda. 
                            <a href="/pages/privacy" class="text-accent font-semibold hover:underline">Kebijakan Privasi</a>.
                        </p>
                        <div class="flex gap-3">
                            <button id="cookie-accept" class="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all transform hover:scale-105">
                                Terima
                            </button>
                            <button id="cookie-decline" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-sm transition-all transform hover:scale-105">
                                Tolak
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById('cookie-accept').addEventListener('click', () => handleChoice('accepted'), { once: true });
        document.getElementById('cookie-decline').addEventListener('click', () => handleChoice('declined'), { once: true });
    };

    const handleChoice = (status) => {
        saveConsent(status);
        applyConsent(status);
        const banner = document.getElementById(CONFIG.BANNER_ID);
        if (banner) {
            banner.classList.replace('animate__fadeInUp', 'animate__fadeOutDown');
            setTimeout(() => banner.remove(), 800);
        }
    };

    return {
        init: () => {
            if (initialized) return;
            initialized = true;

            const consent = loadConsent();
            initializeGtag();

            if (!consent) {
                applyConsent('declined');
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', createBanner, { once: true });
                } else {
                    createBanner();
                }
            } else {
                applyConsent(consent.status);
            }
        },
        open: () => createBanner(),
        reset: () => {
            document.cookie = `${CONFIG.COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            try { localStorage.removeItem(CONFIG.COOKIE_NAME); } catch(e) {}
            location.reload();
        }
    };
})();

CookieManager.init();

document.addEventListener('DOMContentLoaded', () => {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        });
    }

    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        if (!navbar) return;
        
        // 1. Scroll Effect
        if (window.scrollY > 50) {
            navbar.classList.add('bg-primary', 'shadow-lg', 'py-2');
            navbar.classList.remove('py-4');
        } else {
            navbar.classList.remove('bg-primary', 'shadow-lg', 'py-2');
            navbar.classList.add('py-4');
        }

        // 2. Scroll Spy
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // 3. Mobile Menu Toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // 4. Join Button Popup (SweetAlert2)
    const btnGabung = document.getElementById('btn-gabung');
    if (btnGabung && typeof Swal !== 'undefined') {
        btnGabung.addEventListener('click', () => {
            Swal.fire({
                title: 'Info Pendaftaran',
                html: '<p class="text-slate-600 mb-4">Pendaftaran belum dibuka, silakan pantau <a href="https://www.instagram.com/himtekk_amikom/" target="_blank" class="font-bold text-accent hover:underline">Instagram HIMTEKK</a> untuk info selanjutnya.</p>',
                imageUrl: 'assets/img/logo.webp',
                imageWidth: 100,
                imageHeight: 100,
                imageAlt: 'HIMTEKK Logo',
                background: '#FFFFFF',
                padding: '3rem',
                confirmButtonText: 'Siap, Pantau Terus!',
                confirmButtonColor: '#00406E',
                customClass: {
                    popup: 'rounded-[3rem] border-4 border-primary/5 shadow-2xl',
                    title: 'text-primary font-bold text-3xl mt-4',
                    confirmButton: 'rounded-full px-10 py-4 text-lg font-bold transition-all hover:scale-105 shadow-lg',
                },
                showClass: {
                    popup: 'animate__animated animate__zoomIn animate__faster'
                },
                hideClass: {
                    popup: 'animate__animated animate__zoomOut animate__faster'
                },
                backdrop: `rgba(0,64,110,0.4) backdrop-filter: blur(8px)`
            });
        });
    }

    // 5. Contact Form — Security Hardened (PoW + HMAC + Behavioral + Server-Side)
    const contactForm = document.getElementById('contactForm');
    if (contactForm && typeof Swal !== 'undefined') {

        const _EP = [
            'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mv',
            'cy9BS2Z5Y2J5M29fUlc0UHFFcEVMNjlSMUd5emlWdjly',
            'NTFGcTlLelZJMWhTVlVBMFlLZWMzclJld1ZsQVdWejct',
            'ZWluMU81UVkvZXhlYw=='
        ];
        const getEndpoint = () => atob(_EP.join(''));

        const HMAC_SECRET = 'HIMTEKK_S3cur3_F0rm_2026!';
        const POW_DIFFICULTY = 4; 

        const sha256 = async (msg) => {
            const buf = await crypto.subtle.digest('SHA-256',
                new TextEncoder().encode(msg));
            return Array.from(new Uint8Array(buf))
                .map(b => b.toString(16).padStart(2, '0')).join('');
        };

        const hmacSign = async (message, secret) => {
            const key = await crypto.subtle.importKey('raw',
                new TextEncoder().encode(secret),
                { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
            const sig = await crypto.subtle.sign('HMAC', key,
                new TextEncoder().encode(message));
            return Array.from(new Uint8Array(sig))
                .map(b => b.toString(16).padStart(2, '0')).join('');
        };

        const solvePoW = async (challenge) => {
            const prefix = '0'.repeat(POW_DIFFICULTY);
            let nonce = 0;
            while (true) {
                const hash = await sha256(challenge + nonce);
                if (hash.startsWith(prefix)) return { nonce, hash };
                nonce++;
                if (nonce % 500 === 0) await new Promise(r => setTimeout(r, 0)); 
            }
        };

        const pageLoadTime = Date.now();
        const behavior = { mouse: 0, keyboard: 0, touch: 0, scroll: 0, input: 0, click: 0 };
        const formArea = contactForm.closest('section') || document;

        formArea.addEventListener('mousemove', () => behavior.mouse++, { passive: true });
        formArea.addEventListener('keydown', () => behavior.keyboard++, { passive: true });
        formArea.addEventListener('touchstart', () => behavior.touch++, { passive: true });
        window.addEventListener('scroll', () => behavior.scroll++, { passive: true });
        formArea.addEventListener('input', () => behavior.input++, { passive: true });
        formArea.addEventListener('change', () => behavior.input++, { passive: true });
        formArea.addEventListener('click', () => behavior.click++, { passive: true });
        formArea.addEventListener('focus', () => behavior.click++, { passive: true, capture: true });

        const MIN_INTERACTIONS = 3;
        const MIN_TIME_ON_PAGE_MS = 5000;

        const isHumanBehavior = () => {
            const total = behavior.mouse + behavior.keyboard + behavior.touch
                        + behavior.scroll + behavior.input + behavior.click;
            const timeOnPage = Date.now() - pageLoadTime;
            return total >= MIN_INTERACTIONS && timeOnPage >= MIN_TIME_ON_PAGE_MS;
        };

        // Rate Limiting 
        const RATE_LIMIT = {
            MAX_SUBMISSIONS: 3,
            WINDOW_MS: 5 * 60 * 1000,
            COOLDOWN_MS: 60 * 1000,
            STORAGE_KEY: 'himtekk_cf_rl',
            INTEGRITY_KEY: 'himtekk_cf_ri'
        };
        let sessionSubmitCount = 0;
        let lastSubmitTime = 0;

        const fnv1aHash = (str) => {
            let hash = 0x811c9dc5;
            for (let i = 0; i < str.length; i++) {
                hash ^= str.charCodeAt(i);
                hash = Math.imul(hash, 0x01000193);
            }
            return ('0000000' + (hash >>> 0).toString(16)).slice(-8);
        };

        const saveRL = (data) => {
            try {
                const j = JSON.stringify(data);
                localStorage.setItem(RATE_LIMIT.STORAGE_KEY, j);
                localStorage.setItem(RATE_LIMIT.INTEGRITY_KEY, fnv1aHash(j));
            } catch (e) {}
        };

        const loadRL = () => {
            try {
                const j = localStorage.getItem(RATE_LIMIT.STORAGE_KEY);
                const h = localStorage.getItem(RATE_LIMIT.INTEGRITY_KEY);
                if (!j) return { timestamps: [] };
                if (fnv1aHash(j) !== h) {
                    localStorage.removeItem(RATE_LIMIT.STORAGE_KEY);
                    localStorage.removeItem(RATE_LIMIT.INTEGRITY_KEY);
                    return { timestamps: [], tampered: true };
                }
                return JSON.parse(j);
            } catch (e) { return { timestamps: [] }; }
        };

        const isRateLimited = () => {
            if (sessionSubmitCount >= RATE_LIMIT.MAX_SUBMISSIONS) return true;
            const d = loadRL();
            if (d.tampered) return true;
            d.timestamps = d.timestamps.filter(t => (Date.now() - t) < RATE_LIMIT.WINDOW_MS);
            saveRL(d);
            return d.timestamps.length >= RATE_LIMIT.MAX_SUBMISSIONS;
        };

        const isCooldownActive = () =>
            lastSubmitTime > 0 && (Date.now() - lastSubmitTime) < RATE_LIMIT.COOLDOWN_MS;

        const recordSubmission = () => {
            sessionSubmitCount++;
            lastSubmitTime = Date.now();
            const d = loadRL();
            if (!d.tampered) { d.timestamps.push(Date.now()); saveRL(d); }
        };

        // BOT DEFENSE & SPAM PROTECTION (Honeypot + Heuristics + Anti-Automation)
        const BotDefense = (() => {
            const isAutomated = () => {
                const nav = navigator;
                return Boolean(
                    nav.webdriver || 
                    /HeadlessChrome|Puppeteer|Selenium|Playwright/i.test(nav.userAgent) ||
                    (nav.languages && nav.languages.length === 0) ||
                    (nav.plugins && nav.plugins.length === 0 && !/iPhone|iPad|Android/i.test(nav.userAgent))
                );
            };

            return { isBot: isAutomated };
        })();

        // Input Sanitization
        const sanitize = (str) => {
            if (typeof str !== 'string') return '';
            return str
                .replace(/[<>]/g, '')
                .replace(/javascript\s*:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/(\r\n|\r|\n){4,}/g, '\n\n\n')
                .trim();
        };

        // Validation & Anti-Spam Heuristics
        const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        const LIMITS = { nama: [2, 100], email: [5, 254], pesan: [10, 2000] };

        const validateForm = async () => {
            // 1. Bot & Automation check
            if (BotDefense.isBot()) {
                return { valid: false, msg: 'Aktivitas peramban otomatis terdeteksi.' };
            }

            // 2. Honeypot check (Bots fill invisible fields)
            const hp = contactForm.querySelector('[name="confirm_email_hp"]');
            if (hp && hp.value.trim().length > 0) {
                return { valid: false, silent: true };
            }

            // 3. Time-based check (Human takes at least 2.5 seconds to read/fill)
            const timeOnPage = Date.now() - pageLoadTime;
            if (timeOnPage < 2500) {
                return { valid: false, msg: 'Pengiriman terlalu cepat. Mohon luangkan waktu beberapa detik sebelum mengirim pesan.' };
            }

            // 4. Behavioral interaction check
            if (!isHumanBehavior()) {
                return { valid: false, msg: 'Sistem mendeteksi minim interaksi. Silakan lengkapi form sebelum mengirim.' };
            }

            const nama = sanitize(document.getElementById('nama').value);
            const email = sanitize(document.getElementById('email').value);
            const pesan = sanitize(document.getElementById('pesan').value);

            if (nama.length < LIMITS.nama[0] || nama.length > LIMITS.nama[1])
                return { valid: false, msg: `Nama harus ${LIMITS.nama[0]}–${LIMITS.nama[1]} karakter.` };
            if (!EMAIL_RE.test(email))
                return { valid: false, msg: 'Format alamat email tidak valid.' };
            if (email.length > LIMITS.email[1])
                return { valid: false, msg: 'Alamat email terlalu panjang.' };
            if (pesan.length < LIMITS.pesan[0])
                return { valid: false, msg: `Pesan minimal ${LIMITS.pesan[0]} karakter.` };
            if (pesan.length > LIMITS.pesan[1])
                return { valid: false, msg: `Pesan maksimal ${LIMITS.pesan[1]} karakter.` };

            if ((pesan.match(/https?:\/\//gi) || []).length > 2)
                return { valid: false, msg: 'Pesan mengandung terlalu banyak tautan (maksimal 2 tautan).' };

            return { valid: true, data: { nama, email, pesan } };
        };

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';
        let cooldownInterval = null;

        const startCooldown = () => {
            if (!submitBtn) return;
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-60', 'cursor-not-allowed');
            const tick = () => {
                const r = Math.ceil((RATE_LIMIT.COOLDOWN_MS - (Date.now() - lastSubmitTime)) / 1000);
                if (r <= 0) {
                    clearInterval(cooldownInterval);
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
                    submitBtn.innerHTML = originalBtnHTML;
                    return;
                }
                submitBtn.innerHTML = `<i class="fas fa-clock mr-2"></i> Tunggu ${r} detik`;
            };
            tick();
            cooldownInterval = setInterval(tick, 1000);
        };

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Rate limit
            if (isRateLimited()) {
                Swal.fire({ 
                    icon: 'warning', 
                    title: 'Batas Terlampaui',
                    text: 'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.', 
                    confirmButtonColor: '#00406E',
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-[2.5rem] border-4 border-amber-100 shadow-2xl',
                        title: 'text-primary font-bold text-2xl',
                        confirmButton: 'rounded-full px-10 py-3 font-bold transition-all hover:scale-105'
                    }
                });
                return;
            }
            if (isCooldownActive()) {
                const r = Math.ceil((RATE_LIMIT.COOLDOWN_MS - (Date.now() - lastSubmitTime)) / 1000);
                Swal.fire({ 
                    icon: 'info', 
                    title: 'Harap Tunggu',
                    text: `Mohon tunggu ${r} detik sebelum mengirim pesan kembali.`, 
                    confirmButtonColor: '#00406E',
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-[2.5rem] border-4 border-blue-100 shadow-2xl',
                        title: 'text-primary font-bold text-2xl',
                        confirmButton: 'rounded-full px-10 py-3 font-bold transition-all hover:scale-105'
                    }
                });
                return;
            }

            if (!isHumanBehavior()) {
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Verifikasi Gagal',
                    text: 'Sistem mendeteksi aktivitas tidak wajar. Silakan berinteraksi dengan halaman sebelum mengirim.',
                    confirmButtonColor: '#00406E',
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-[2.5rem] border-4 border-red-100 shadow-2xl',
                        title: 'text-primary font-bold text-2xl',
                        confirmButton: 'rounded-full px-10 py-3 font-bold transition-all hover:scale-105'
                    }
                });
                return;
            }

            // Validate
            const v = await validateForm();
            if (!v.valid) {
                if (v.attack || v.blocked) return;
                if (v.silent) {
                    Swal.fire({ 
                        icon: 'success', 
                        title: 'Terkirim!',
                        text: 'Pesan Anda telah berhasil dikirim.', 
                        confirmButtonColor: '#00406E',
                        background: '#ffffff',
                        customClass: {
                            popup: 'rounded-[2.5rem] border-4 border-green-100 shadow-2xl',
                            title: 'text-primary font-bold text-2xl',
                            confirmButton: 'rounded-full px-10 py-3 font-bold transition-all hover:scale-105'
                        }
                    });
                    contactForm.reset(); return;
                }
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Validasi Gagal',
                    text: v.msg, 
                    confirmButtonColor: '#00406E',
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-[2.5rem] border-4 border-red-100 shadow-2xl',
                        title: 'text-primary font-bold text-2xl',
                        confirmButton: 'rounded-full px-10 py-3 font-bold transition-all hover:scale-105'
                    }
                });
                return;
            }

            Swal.fire({ 
                title: 'Verifikasi Keamanan',
                html: `
                    <div class="flex flex-col items-center py-4">
                        <div class="relative mb-6">
                            <div class="w-20 h-20 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                            <div class="absolute inset-0 flex items-center justify-center">
                                <i class="fas fa-shield-halved text-primary text-3xl animate__animated animate__pulse animate__infinite"></i>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <p class="text-slate-600 font-bold">Menganalisis Integritas Data...</p>
                            <p class="text-slate-400 text-xs uppercase tracking-widest font-mono">ENCRYPTING | POW_SOLVING</p>
                        </div>
                    </div>
                `,
                allowOutsideClick: false, 
                showConfirmButton: false,
                background: '#ffffff',
                customClass: {
                    popup: 'rounded-[2.5rem] border-4 border-primary/5 shadow-2xl',
                    title: 'text-primary font-bold text-2xl pt-8'
                }
            });

            // Challenge & PoW
            try {
                const ts = Date.now().toString();
                const challenge = `${v.data.nama}|${v.data.email}|${ts}`;
                const pow = await solvePoW(challenge);

                const payload = `${v.data.nama}|${v.data.email}|${v.data.pesan}|${ts}|${pow.nonce}`;
                const sig = await hmacSign(payload, HMAC_SECRET);

                Swal.update({ 
                    title: 'Mengirim Pesan',
                    html: `
                        <div class="flex flex-col items-center py-4">
                            <div class="relative mb-6">
                                <div class="w-20 h-20 border-4 border-slate-100 border-t-accent rounded-full animate-spin"></div>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <i class="fas fa-paper-plane text-accent text-3xl animate__animated animate__bounceIn"></i>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <p class="text-slate-600 font-bold">Menghubungkan ke Server...</p>
                                <p class="text-slate-400 text-xs uppercase tracking-widest font-mono">UPLOADING | HMAC_SIGNED</p>
                            </div>
                        </div>
                    `
                });

                const params = new URLSearchParams();
                params.append('nama', v.data.nama);
                params.append('email', v.data.email);
                params.append('pesan', v.data.pesan);
                params.append('timestamp', ts);
                params.append('pow_nonce', pow.nonce.toString());
                params.append('pow_hash', pow.hash);
                params.append('pow_difficulty', POW_DIFFICULTY.toString());
                params.append('hmac', sig);
                params.append('behavior', JSON.stringify({
                    mouse: behavior.mouse, keyboard: behavior.keyboard,
                    touch: behavior.touch, scroll: behavior.scroll,
                    input: behavior.input, click: behavior.click,
                    timeOnPage: Date.now() - pageLoadTime
                }));

                const ctrl = new AbortController();
                const timeout = setTimeout(() => ctrl.abort(), 20000);

                const resp = await fetch(getEndpoint(), {
                    method: 'POST',
                    body: params,
                    signal: ctrl.signal,
                    redirect: 'follow'
                });
                clearTimeout(timeout);

                let result = { status: 'ok' };
                try {
                    const text = await resp.text();
                    if (text) result = JSON.parse(text);
                } catch (_) {
                    result = { status: resp.ok ? 'ok' : 'error' };
                }

                if (result.status === 'rejected') {
                    Swal.fire({ 
                        icon: 'error', 
                        title: 'Ditolak Server',
                        text: result.message || 'Permintaan ditolak oleh server.',
                        confirmButtonColor: '#00406E',
                        background: '#ffffff',
                        customClass: {
                            popup: 'rounded-[2.5rem] border-4 border-red-100 shadow-2xl',
                            title: 'text-primary font-bold text-2xl',
                            confirmButton: 'rounded-full px-10 py-3 font-bold transition-all hover:scale-105'
                        }
                    });
                    return;
                }

                recordSubmission();
                Swal.fire({ 
                    icon: 'success', 
                    title: 'Pesan Terkirim!',
                    text: 'Terima kasih! Pesan Anda telah kami terima dan akan segera diproses.', 
                    confirmButtonColor: '#00406E',
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-[2.5rem] border-4 border-green-100 shadow-2xl',
                        title: 'text-primary font-bold text-2xl',
                        confirmButton: 'rounded-full px-10 py-3 font-bold transition-all hover:scale-105'
                    }
                });
                contactForm.reset();
                startCooldown();

            } catch (err) {
                Swal.fire({ 
                    icon: 'error',
                    title: err.name === 'AbortError' ? 'Koneksi Terputus' : 'Gagal Mengirim',
                    text: err.name === 'AbortError'
                        ? 'Server tidak merespons dalam waktu lama. Silakan periksa koneksi Anda.' 
                        : 'Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.',
                    confirmButtonColor: '#00406E',
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-[2.5rem] border-4 border-red-100 shadow-2xl',
                        title: 'text-primary font-bold text-2xl',
                        confirmButton: 'rounded-full px-10 py-3 font-bold transition-all hover:scale-105'
                    }
                });
            }
        });

        const pesanField = document.getElementById('pesan');
        const pesanCounter = document.getElementById('pesan-counter');
        if (pesanField && pesanCounter) {
            pesanField.addEventListener('input', () => {
                const len = pesanField.value.length;
                pesanCounter.textContent = `${len} / 2000`;
                pesanCounter.classList.toggle('text-red-500', len > 1800);
                pesanCounter.classList.toggle('text-amber-500', len > 1500 && len <= 1800);
                pesanCounter.classList.toggle('text-slate-400', len <= 1500);
            });
        }
    }

    // 6. Mobile Hover/Click for Team Cards
    const allCards = document.querySelectorAll('.group');
    allCards.forEach(card => {
        card.addEventListener('click', function (e) {
            if (!this.querySelector('.bg-primary\\/40')) return;

            if (window.matchMedia("(hover: none)").matches) {
                const isLink = e.target.closest('a');
                if (isLink) return;

                const isActive = this.classList.contains('mobile-active');
                allCards.forEach(c => { if (c !== this) c.classList.remove('mobile-active'); });

                if (!isActive) {
                    this.classList.add('mobile-active');
                    e.preventDefault();
                } else {
                    this.classList.remove('mobile-active');
                }
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.group')) {
            allCards.forEach(c => c.classList.remove('mobile-active'));
        }
    });
});

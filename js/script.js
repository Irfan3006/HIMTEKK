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
                            <a href="/pages/privacy.html" class="text-accent font-semibold hover:underline">Kebijakan Privasi</a>.
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

        // SECURITY GUARD — Advanced XSS, HTML Injection & SQLi Detection
        const SecurityGuard = (() => {
            const LOCKOUT_MS = 30000; 
            const PERMA_BLOCK_MS = 24 * 60 * 60 * 1000;
            const MAX_STRIKES = 3;

            const STRIKE_KEY = btoa('himtekk_v4_integrity_a');
            const BLOCK_KEY = btoa('himtekk_v4_blacklist_b');
            const SIG_KEY = btoa('himtekk_v4_signature_s');

            let isLocked = false;
            let visitorData = { ip: 'Fetching...', isp: 'Fetching...', city: 'Fetching...', country: 'Fetching...', ua: navigator.userAgent };
            let visitorPromise = null;

            const getFingerprint = () => {
                const s = window.screen;
                const nav = window.navigator;
                const components = [
                    nav.userAgent, nav.language, nav.platform,
                    s.height, s.width, s.colorDepth,
                    new Date().getTimezoneOffset(),
                    nav.hardwareConcurrency || 0,
                    nav.deviceMemory || 0,
                    !!window.chrome, !!window.PointerEvent
                ];
                let hash = 0x811c9dc5;
                const id = components.join('|');
                for (let i = 0; i < id.length; i++) {
                    hash ^= id.charCodeAt(i);
                    hash = Math.imul(hash, 0x01000193);
                }
                return (hash >>> 0).toString(16);
            };
            const FINGERPRINT = getFingerprint();

            // Bot/Headless Detection
            const isAutomated = () => {
                const nav = navigator;
                return nav.webdriver || 
                       /HeadlessChrome|Puppeteer|Selenium|Playwright/i.test(nav.userAgent) ||
                       (nav.languages && nav.languages.length === 0) ||
                       (nav.plugins && nav.plugins.length === 0 && !/iPhone|iPad|Android/i.test(nav.userAgent));
            };

            const fetchVisitorData = async () => {
                try {
                    const resp = await fetch('https://free.freeipapi.com/api/json');
                    if (!resp.ok) throw new Error();
                    const data = await resp.json();
                    visitorData.ip = data.ipAddress || 'Unknown';
                    visitorData.isp = data.asnOrganization || 'Unknown';
                    visitorData.city = data.cityName || 'Unknown';
                    visitorData.country = data.countryName || 'Unknown';
                    return visitorData;
                } catch (e) {
                    try {
                        const resp2 = await fetch('https://ipapi.co/json/');
                        if (!resp2.ok) throw new Error();
                        const data2 = await resp2.json();
                        visitorData.ip = data2.ip || 'Unavailable';
                        visitorData.isp = data2.org || 'Unknown Provider';
                        visitorData.city = data2.city || 'Unknown';
                        visitorData.country = data2.country_name || 'Unknown';
                    } catch (e2) {
                        try {
                            const resp3 = await fetch('https://api.ipify.org?format=json');
                            const data3 = await resp3.json();
                            visitorData.ip = data3.ip || 'Unavailable';
                            visitorData.isp = 'ISP Hidden (VPN/Proxy)';
                            visitorData.city = 'Locked';
                            visitorData.country = 'Restricted';
                        } catch (e3) {
                            visitorData.ip = 'Hidden/VPN';
                            visitorData.isp = 'Unknown Provider';
                        }
                    }
                    return visitorData;
                }
            };
            visitorPromise = fetchVisitorData();

            // --- XSS Detection Patterns ---
            const XSS_PATTERNS = [
                /<\s*script[\s>\/]/i,
                /<\s*\/\s*script\s*>/i,
                /javascript\s*:/i,
                /vbscript\s*:/i,
                /data\s*:\s*text\/html/i,
                /data\s*:\s*image\/svg\+xml/i,
                /\bon\w{3,}\s*=/i,
                /<\s*img[^>]+\bon\w+/i,
                /<\s*svg[\s>\/]/i,
                /<\s*math[\s>\/]/i,
                /expression\s*\(/i,
                /url\s*\(\s*['"]*\s*javascript/i,
                /-moz-binding\s*:/i,
                /&#(x[0-9a-f]+|[0-9]+);/i,
                /\\u00[0-9a-f]{2}/i,
                /%3[Cc].*%3[Ee]/i,
                /\balert\s*\(/i,
                /\bconfirm\s*\(/i,
                /\bprompt\s*\(/i,
                /\beval\s*\(/i,
                /\bsetTimeout\s*\(/i,
                /\bsetInterval\s*\(/i,
                /\bFunction\s*\(/i,
                /\bdocument\s*\.\s*(cookie|write|location)/i,
                /\bwindow\s*\.\s*(location|open|eval)/i,
                /\blocation\s*\.\s*(href|assign|replace)/i,
                /\bfetch\s*\(/i,
                /\bXMLHttpRequest/i,
                /\bimport\s*\(/i,
                /fromCharCode/i,
                /\batob\s*\(/i,
                /constructor\s*\[\s*['"]|\bconstructor\s*\.\s*constructor/i,
            ];

            // --- HTML Injection Detection Patterns ---
            const HTML_INJECTION_PATTERNS = [
                /<\s*iframe[\s>\/]/i,
                /<\s*object[\s>\/]/i,
                /<\s*embed[\s>\/]/i,
                /<\s*form[\s>\/]/i,
                /<\s*input[\s>\/]/i,
                /<\s*button[\s>\/]/i,
                /<\s*textarea[\s>\/]/i,
                /<\s*select[\s>\/]/i,
                /<\s*link[\s>\/]/i,
                /<\s*meta[\s>\/]/i,
                /<\s*base[\s>\/]/i,
                /<\s*style[\s>\/]/i,
                /<\s*div[\s>\/]/i,
                /<\s*span[\s>\/]/i,
                /<\s*a\s+href/i,
                /<\s*marquee[\s>\/]/i,
                /<\s*details[\s>\/]/i,
                /<\s*video[\s>\/]/i,
                /<\s*audio[\s>\/]/i,
                /<\s*source[\s>\/]/i,
                /<\s*body[\s>\/]/i,
                /<\s*html[\s>\/]/i,
                /<\s*head[\s>\/]/i,
                /<\s*table[\s>\/]/i,
                /<\s*applet[\s>\/]/i,
                /<!--.*-->/,
                /<\s*!\s*DOCTYPE/i
            ];

            // --- SQL Injection Detection Patterns ---
            const SQLI_PATTERNS = [
                /\b(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|REPLACE)\b\s+/i,
                /\bUNION\b\s+(ALL\s+)?SELECT\b/i,
                /\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
                /\bAND\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
                /['"]?\s*;\s*(DROP|DELETE|INSERT|UPDATE|SELECT|CREATE|ALTER|TRUNCATE)\b/i,
                /'\s*(OR|AND)\s+'/i,
                /'\s*--/,
                /#\s*$/m,
                /\/\*[\s\S]*?\*\//,
                /\bEXEC(\s+|\s*\()/i,
                /\bXP_\w+/i,
                /\bSLEEP\s*\(/i,
                /\bBENCHMARK\s*\(/i,
                /\bWAITFOR\s+DELAY\b/i,
                /\bLOAD_FILE\s*\(/i,
                /\bINTO\s+(OUT|DUMP)FILE\b/i,
                /\bINFORMATION_SCHEMA\b/i,
                /\bSYSTABLES\b/i,
                /\bsys\.(tables|columns|objects)\b/i,
                /0x[0-9a-f]{6,}/i,
                /\bCHAR\s*\(\s*\d+/i,
                /\bCONCAT\s*\(/i,
                /\bGROUP_CONCAT\s*\(/i,
                /\bCAST\s*\(/i,
                /\bCONVERT\s*\(/i,
                /\bHAVING\s+\d+\s*[=<>]/i,
                /\bORDER\s+BY\s+\d+/i,
                /'\s*\|\|\s*'/, 
                /\bEXTRACTVALUE\s*\(/i,
                /\bUPDATEXML\s*\(/i, 
            ];

            const normalize = (str) => {
                if (typeof str !== 'string') return '';
                let s = str;
                try { s = decodeURIComponent(s); } catch(e) {}
                s = s.replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
                s = s.replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
                s = s.replace(/&(lt|gt|amp|quot|apos);/gi, (_, e) => ({lt:'<',gt:'>',amp:'&',quot:'"',apos:"'"})[e.toLowerCase()] || _);
                s = s.replace(/\0/g, '');
                s = s.replace(/\s+/g, ' ');
                return s;
            };

            const detectAttack = (rawStr) => {
                if (typeof rawStr !== 'string' || rawStr.length === 0) return null;
                const normalized = normalize(rawStr);
                const checks = [
                    { patterns: XSS_PATTERNS, type: 'XSS (Cross-Site Scripting)' },
                    { patterns: HTML_INJECTION_PATTERNS, type: 'HTML Injection' },
                    { patterns: SQLI_PATTERNS, type: 'SQL Injection' },
                ];
                for (const check of checks) {
                    for (const pattern of check.patterns) {
                        if (pattern.test(rawStr) || pattern.test(normalized)) {
                            return check.type;
                        }
                    }
                }
                return null;
            };

            const scanAllFields = () => {
                const fields = ['nama', 'email', 'pesan'];
                for (const fieldId of fields) {
                    const el = document.getElementById(fieldId);
                    if (!el) continue;
                    const attack = detectAttack(el.value);
                    if (attack) return { field: fieldId, type: attack };
                }
                return null;
            };

            const getStrikes = () => {
                try { return parseInt(localStorage.getItem(STRIKE_KEY) || '0', 10); } catch(e) { return 0; }
            };
            const addStrike = () => {
                try {
                    const s = getStrikes() + 1;
                    localStorage.setItem(STRIKE_KEY, s.toString());
                    if (s >= MAX_STRIKES) {
                        localStorage.setItem(BLOCK_KEY, Date.now().toString());
                    }
                    return s;
                } catch(e) { return 1; }
            };
            const isPermBlocked = () => {
                try {
                    const blockTime = parseInt(localStorage.getItem(BLOCK_KEY) || '0', 10);
                    if (blockTime > 0 && (Date.now() - blockTime) < PERMA_BLOCK_MS) return true;
                    if (blockTime > 0 && (Date.now() - blockTime) >= PERMA_BLOCK_MS) {
                        localStorage.removeItem(BLOCK_KEY);
                        localStorage.removeItem(STRIKE_KEY);
                    }
                    return false;
                } catch(e) { return false; }
            };

            // Show warning
            const showWarning = async (attackType, strikeCount) => {
                await visitorPromise;

                if (typeof Swal === 'undefined') {
                    alert('⚠️ PERINGATAN KEAMANAN: Percobaan ' + attackType + ' terdeteksi!\n\nSegala bentuk percobaan peretasan akan kami tindak secara tegas dan tanpa toleransi.');
                    return;
                }
                const remaining = MAX_STRIKES - strikeCount;
                Swal.fire({
                    title: '<span style="color:#FFFFFF;font-size:1.4rem;letter-spacing:1px;font-weight:800;">PERINGATAN KEAMANAN</span>',
                    html: `
                        <div style="text-align:left;padding:0.5rem 0;">
                            <div style="background:rgba(220,38,38,0.05);border-left:5px solid #DC2626;border-radius:12px;padding:1.2rem;margin-bottom:1.5rem;display:flex;gap:15px;align-items:start;">
                                <div style="background:#DC2626;color:white;width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                    <i class="fas fa-biohazard text-xl"></i>
                                </div>
                                <div>
                                    <p style="color:#DC2626;font-weight:800;font-size:1rem;margin-bottom:0.2rem;text-transform:uppercase;">Serangan Terdeteksi</p>
                                    <p style="color:#475569;font-size:0.9rem;">Sistem kami mendeteksi pola <strong>${attackType}</strong> yang dikirimkan ke server.</p>
                                </div>
                            </div>
                            
                            <div style="background:#0F172A;border-radius:20px;padding:1.8rem;color:#F8FAFC;box-shadow:0 15px 35px -5px rgba(0,0,0,0.4);position:relative;overflow:hidden;margin-bottom:1.5rem;">
                                <div style="position:absolute;top:-20px;right:-20px;font-size:5rem;opacity:0.05;color:white;transform:rotate(15deg);">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                                <div style="display:flex;align-items:center;gap:12px;margin-bottom:1.2rem;padding-bottom:1rem;border-bottom:1px solid rgba(255,255,255,0.1);">
                                    <i class="fas fa-gavel" style="color:#DBB865;font-size:1.5rem;"></i>
                                    <span style="font-weight:800;font-size:1rem;color:#DBB865;letter-spacing:1px;text-transform:uppercase;">Kebijakan Keamanan</span>
                                </div>
                                <p style="font-size:1.05rem;font-weight:700;line-height:1.6;margin-bottom:1.5rem;font-style:italic;">
                                    "Segala bentuk percobaan peretasan akan kami tindak secara tegas dan tanpa toleransi."
                                </p>
                                <div style="font-size:0.75rem;display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.05);padding:0.8rem 1rem;border-radius:10px;">
                                    <span style="color:#94A3B8;">PERCOBAAN: <strong style="color:white;">${strikeCount} / ${MAX_STRIKES}</strong></span>
                                    <span style="color:#EF4444;font-weight:800;"><i class="fas fa-broadcast-tower animate-pulse mr-1"></i> MONITORING AKTIF</span>
                                </div>
                            </div>

                            <div style="background:#F1F5F9;border-radius:15px;padding:1.2rem;font-family:monospace;font-size:0.75rem;color:#475569;border:1px solid #E2E8F0;">
                                <p style="font-weight:800;color:#0F172A;margin-bottom:0.8rem;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:6px;">
                                    <i class="fas fa-fingerprint text-red-600"></i> Digital Fingerprint
                                </p>
                                <div style="display:grid;gap:6px;">
                                    <div style="display:flex;justify-content:space-between;"><span style="color:#94A3B8;">IP ADDRESS:</span> <span style="font-weight:700;color:#1E293B;">${visitorData.ip}</span></div>
                                    <div style="display:flex;justify-content:space-between;"><span style="color:#94A3B8;">ISP/ORG:</span> <span style="font-weight:700;color:#1E293B;text-align:right;">${visitorData.isp}</span></div>
                                    <div style="display:flex;justify-content:space-between;"><span style="color:#94A3B8;">LOCATION:</span> <span style="font-weight:700;color:#1E293B;">${visitorData.city}, ${visitorData.country}</span></div>
                                    <div style="display:flex;justify-content:space-between;"><span style="color:#94A3B8;">DEVICE ID:</span> <span style="font-weight:700;color:#DC2626;">HID-${FINGERPRINT.toUpperCase()}</span></div>
                                    <div style="border-top:1px dashed #CBD5E1;margin:4px 0;padding-top:4px;word-break:break-all;line-height:1.2;">
                                        <span style="color:#94A3B8;">USER AGENT:</span><br>${visitorData.ua}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `,
                    confirmButtonText: 'SAYA MENGERTI & BERSIHKAN INPUT',
                    confirmButtonColor: '#0F172A',
                    background: '#FFFFFF',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    customClass: {
                        popup: 'rounded-[2.5rem] border-0 shadow-2xl overflow-hidden',
                        confirmButton: 'rounded-xl px-10 py-4 font-bold text-base transition-all hover:scale-105 mb-4 shadow-lg',
                        title: 'bg-red-600 py-8 m-0 w-full'
                    },
                    showClass: { popup: 'animate__animated animate__shakeX' },
                    backdrop: 'rgba(15,23,42,0.96) backdrop-filter: blur(8px)',
                }).then(() => {
                    ['nama', 'email', 'pesan'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.value = '';
                    });
                    const counter = document.getElementById('pesan-counter');
                    if (counter) counter.textContent = '0 / 2000';
                });
            };

            const lockForm = (formEl, duration) => {
                if (isLocked) return;
                isLocked = true;
                const fields = formEl.querySelectorAll('input, textarea, button');
                fields.forEach(f => { f.disabled = true; f.classList.add('opacity-40', 'cursor-not-allowed'); });

                setTimeout(() => {
                    fields.forEach(f => {
                        if (f.name !== 'confirm_email_hp') {
                            f.disabled = false;
                            f.classList.remove('opacity-40', 'cursor-not-allowed');
                        }
                    });
                    isLocked = false;
                }, duration);
            };

            const showBlockedScreen = async () => {
                // Ensure data is loaded before showing
                await visitorPromise;

                if (typeof Swal === 'undefined') return;
                Swal.fire({
                    title: '<span style="color:#FFFFFF;font-size:1.4rem;letter-spacing:2px;font-weight:900;">AKSES DIBLOKIR</span>',
                    html: `
                        <div style="padding:1rem 0;">
                            <div style="margin-bottom:2.5rem;">
                                <div style="width:100px;height:100px;background:#DC2626;border-radius:30px;display:flex;align-items:center;justify-content:center;margin:0 auto 2rem;transform:rotate(-10deg);box-shadow:0 20px 40px -10px rgba(220,38,38,0.5);">
                                    <i class="fas fa-user-lock text-white text-4xl"></i>
                                </div>
                                <h3 style="color:#0F172A;font-weight:900;font-size:1.6rem;margin-bottom:0.8rem;letter-spacing:-0.5px;">IDENTITAS DIBLOKIR</h3>
                                <p style="color:#64748B;font-size:1rem;line-height:1.6;max-width:300px;margin:0 auto;">Akses Anda telah diputus secara permanen oleh firewall sistem karena pelanggaran keamanan berulang.</p>
                            </div>
                            
                            <div style="background:linear-gradient(135deg,#0F172A,#1E293B);border-radius:24px;padding:2.2rem;color:#F8FAFC;text-align:center;position:relative;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);margin-bottom:1.5rem;">
                                <i class="fas fa-quote-left" style="position:absolute;top:15px;left:20px;font-size:2rem;opacity:0.1;color:#DBB865;"></i>
                                <p style="font-size:1.15rem;font-weight:800;line-height:1.6;color:#DBB865;margin-bottom:1.5rem;position:relative;z-index:1;">
                                    "Segala bentuk percobaan peretasan akan kami tindak secara tegas dan tanpa toleransi."
                                </p>
                                <div style="font-size:0.8rem;color:#94A3B8;border-top:1px solid rgba(255,255,255,0.1);pt-4;margin-top:1rem;display:grid;gap:8px;text-align:left;">
                                    <div style="display:flex;justify-content:space-between;"><span>IP ADDRESS:</span> <span style="color:white;font-weight:700;">${visitorData.ip}</span></div>
                                    <div style="display:flex;justify-content:space-between;"><span>ISP NAME:</span> <span style="color:white;font-weight:700;">${visitorData.isp}</span></div>
                                    <div style="display:flex;justify-content:space-between;"><span>LOCATION:</span> <span style="color:white;font-weight:700;">${visitorData.city}, ${visitorData.country}</span></div>
                                    <div style="display:flex;justify-content:space-between;"><span>DEVICE ID:</span> <span style="color:#DBB865;font-weight:700;">HID-${FINGERPRINT.toUpperCase()}</span></div>
                                    <div style="font-size:0.7rem;opacity:0.6;word-break:break-all;line-height:1.2;margin-top:4px;">
                                        USER AGENT: ${visitorData.ua}
                                    </div>
                                </div>
                            </div>
                            <p style="margin-top:2rem;font-size:0.85rem;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:1px;">
                                <i class="fas fa-clock mr-1"></i> Peninjauan Kembali: 24 Jam
                            </p>
                        </div>
                    `,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    background: '#FFFFFF',
                    customClass: {
                        popup: 'rounded-[3.5rem] border-0 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden',
                        title: 'bg-black py-10 m-0 w-full'
                    },
                    backdrop: 'rgba(0,0,0,0.98)',
                });
            };

            return { detectAttack, scanAllFields, addStrike, getStrikes, isPermBlocked, showWarning, lockForm, showBlockedScreen, isLocked: () => isLocked, isBot: isAutomated };
        })();

        // Immediate persistence check: Show block screen if user is already in blacklist
        if (SecurityGuard.isPermBlocked()) {
            SecurityGuard.showBlockedScreen();
        }

        ['nama', 'email', 'pesan'].forEach(fieldId => {
            const el = document.getElementById(fieldId);
            if (!el) return;
            let debounceTimer = null;
            el.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const attack = SecurityGuard.detectAttack(el.value);
                    if (attack) {
                        el.classList.add('ring-2', 'ring-red-500', 'border-red-500', 'bg-red-50');
                    } else {
                        el.classList.remove('ring-2', 'ring-red-500', 'border-red-500', 'bg-red-50');
                    }
                }, 300);
            }, { passive: true });
        });

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

        // Validation
        const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        const LIMITS = { nama: [2, 100], email: [5, 254], pesan: [10, 2000] };

        const validateForm = async () => {
            // --- SECURITY CHECK: Block automated bots ---
            if (SecurityGuard.isBot()) {
                SecurityGuard.addStrike();
                await SecurityGuard.showWarning('Automated Bot/Headless Browser', SecurityGuard.getStrikes());
                return { valid: false, blocked: true };
            }

            if (SecurityGuard.isPermBlocked()) {
                await SecurityGuard.showBlockedScreen();
                return { valid: false, blocked: true };
            }

            const attackResult = SecurityGuard.scanAllFields();
            if (attackResult) {
                const strikes = SecurityGuard.addStrike();
                await SecurityGuard.showWarning(attackResult.type, strikes);
                SecurityGuard.lockForm(contactForm, 30000);
                return { valid: false, attack: true };
            }

            const nama = sanitize(document.getElementById('nama').value);
            const email = sanitize(document.getElementById('email').value);
            const pesan = sanitize(document.getElementById('pesan').value);

            const hp = contactForm.querySelector('[name="confirm_email_hp"]');
            if (hp && hp.value.length > 0) return { valid: false, silent: true };

            if (nama.length < LIMITS.nama[0] || nama.length > LIMITS.nama[1])
                return { valid: false, msg: `Nama harus ${LIMITS.nama[0]}–${LIMITS.nama[1]} karakter.` };
            if (!EMAIL_RE.test(email))
                return { valid: false, msg: 'Format email tidak valid.' };
            if (email.length > LIMITS.email[1])
                return { valid: false, msg: 'Email terlalu panjang.' };
            if (pesan.length < LIMITS.pesan[0])
                return { valid: false, msg: `Pesan minimal ${LIMITS.pesan[0]} karakter.` };
            if (pesan.length > LIMITS.pesan[1])
                return { valid: false, msg: `Pesan maksimal ${LIMITS.pesan[1]} karakter.` };

            if ((pesan.match(/https?:\/\//gi) || []).length > 2)
                return { valid: false, msg: 'Pesan mengandung terlalu banyak tautan.' };

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

            if (SecurityGuard.isPermBlocked()) {
                SecurityGuard.showBlockedScreen();
                return;
            }
            if (SecurityGuard.isLocked()) return;

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

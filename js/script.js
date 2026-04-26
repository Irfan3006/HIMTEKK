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
                            <a href="privacy.html" class="text-accent font-semibold hover:underline">Kebijakan Privasi</a>.
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

    // 5. Contact Form Submission (Google Apps Script)
    const contactForm = document.getElementById('contactForm');
    if (contactForm && typeof Swal !== 'undefined') {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            Swal.fire({
                title: 'Mengirim pesan...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            const formData = new FormData(contactForm);
            formData.append('timestamp', new Date().toLocaleString());

            try {
                await fetch('https://script.google.com/macros/s/AKfycbx_NnN8IrW_3iGUURI_SHnbPFFEoJsXddedLlKZt4pfcM_YNTqKeOLYWX9ECPwLt1EJ/exec', {
                    method: 'POST',
                    body: formData
                });

                Swal.fire({
                    icon: 'success',
                    title: 'Terkirim!',
                    text: 'Pesan Anda telah berhasil dikirim.',
                    confirmButtonColor: '#00406E'
                });

                contactForm.reset();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal!',
                    text: 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.',
                    confirmButtonColor: '#00406E'
                });
            }
        });
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

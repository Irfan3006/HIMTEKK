// Initialize AOS
AOS.init({
    duration: 1000,
    once: true,
    offset: 100
});

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('bg-primary', 'shadow-lg', 'py-2');
        navbar.classList.remove('py-4');
    } else {
        navbar.classList.remove('bg-primary', 'shadow-lg', 'py-2');
        navbar.classList.add('py-4');
    }
    
    // Scroll Spy
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
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

// Mobile Menu Toggle
const menuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

// Join Button Popup
const btnGabung = document.getElementById('btn-gabung');
if (btnGabung) {
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
            backdrop: `
                rgba(0,64,110,0.4)
                backdrop-filter: blur(8px)
            `
        });
    });
}

// Form Submission Logic
const contactForm = document.getElementById('contactForm');
if(contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading
        Swal.fire({
            title: 'Mengirim pesan...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const formData = new FormData(contactForm);
        formData.append('timestamp', new Date().toLocaleString());

        try {
            const response = await fetch('https://script.google.com/macros/s/AKfycbx_NnN8IrW_3iGUURI_SHnbPFFEoJsXddedLlKZt4pfcM_YNTqKeOLYWX9ECPwLt1EJ/exec', {
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

# Dokumentasi Teknis Website Resmi HIMTEKK Universitas Amikom Yogyakarta

Dokumentasi ini disusun sebagai pedoman teknis komprehensif mengenai arsitektur, standar pengembangan, keamanan, optimasi performa, Search Engine Optimization (SEO), dan pemeliharaan website resmi Himpunan Mahasiswa Teknik Komputer (HIMTEKK) Universitas Amikom Yogyakarta.

---

## 1. Deskripsi Proyek

Website HIMTEKK merupakan platform informasi digital resmi organisasi Himpunan Mahasiswa Teknik Komputer (HIMTEKK) Universitas Amikom Yogyakarta. Platform ini berfungsi sebagai media profil kelembagaan, pusat informasi kegiatan akademik dan organisasi, etalase struktur kepengurusan, serta sarana publikasi resmi bagi seluruh civitas akademika dan masyarakat luas.

Proyek ini dirancang menggunakan arsitektur situs statis berperforma tinggi (Jamstack) tanpa ketergantungan pada basis data sisi klien yang berat, sehingga menghasilkan kecepatan pemuatan yang optimal, efisiensi bandwidth, dan ketahanan terhadap potensi celah keamanan.

---

## 2. Spesifikasi Teknologi

Website ini dibangun dengan fondasi teknologi web modern yang berfokus pada kecepatan akses, efisiensi kode, dan kepatuhan standar web internasional:

1. **HTML5 Semantik**: Penyusunan hierarki dokumen yang terstruktur secara semantik untuk memastikan aksesibilitas (a11y) dan keterbacaan optimal oleh mesin perayap (crawler).
2. **Tailwind CSS Versi 3 (Pre-compiled)**: Kerangka kerja styling berbasis utility yang dikompilasi secara luring menjadi file CSS statis yang diminifikasi (`css/tailwind.min.css`, ukuran sekitar 25 KB). Pendekatan ini menggantikan runtime Play CDN untuk mengeliminasi latensi parsing JavaScript dan pergeseran tata letak saat pemuatan awal.
3. **Vanilla JavaScript (ES6+)**: Logika sisi klien tanpa ketergantungan framework berat, mencakup manajemen persetujuan cookie berbasis GDPR, proteksi formulir anti-spam, dan interaksi antarmuka pengguna.
4. **Clean URLs Engine**: Penyajian seluruh rute URL bersih tanpa ekstensi file (`/pages/pengurus`, `/pages/privacy`, `/pages/terms`) yang dikonfigurasi melalui platform Vercel.
5. **Pustaka Antarmuka Eksternal**:
   * **AOS (Animate On Scroll)**: Menangani animasi transisi elemen berbasis posisi gulir layar.
   * **FontAwesome Versi 6**: Penyedia ikonografi vektor antarmuka pengguna.
   * **SweetAlert2**: Komponen kotak dialog responsif untuk konfirmasi interaksi pengguna.
   * **Animate.css**: Pustaka animasi CSS deklaratif untuk elemen interaktif tertentu.

---

## 3. Struktur Direktori Proyek

Susunan file dan direktori dalam repositori ini diatur dengan struktur berikut:

```
HIMTEKK/
│
├── .gitignore                     # Konfigurasi file yang diabaikan oleh Git
├── 404.html                       # Halaman penanganan galat HTTP 404 kustom
├── index.html                     # Halaman utama profil organisasi (URL: /)
├── LICENSE                        # Lisensi perangkat lunak (MIT License)
├── package.json                   # Konfigurasi dependensi dan script kompilasi Tailwind CSS
├── panduan-color-palette.md       # Panduan standar identitas warna dan tipografi resmi
├── README.md                      # Dokumentasi teknis utama proyek
├── robots.txt                     # Instruksi perayapan untuk mesin pencari web
├── short.js                       # Skrip worker penyingkat tautan (Cloudflare Worker)
├── sitemap.xml                    # Peta situs XML dengan format Clean URLs
├── tailwind.config.js             # File konfigurasi tema dan pemindaian template Tailwind CSS
├── vercel.json                    # Konfigurasi deployment, Clean URLs, header keamanan, dan caching
│
├── assets/
│   └── img/
│       ├── hero.webp              # Aset visual utama hero section berprioritas tinggi
│       ├── logo.webp              # Logo identitas resmi organisasi
│       ├── og.webp                # Gambar pratinjau untuk Open Graph dan Twitter Cards
│       ├── placeholder.webp       # Gambar pengganti cadangan
│       └── pengurus/              # Direktori penyimpanan foto resmi seluruh pengurus
│           ├── ketua.webp
│           ├── sekjend.webp
│           ├── sekretaris1.webp
│           └── ... (foto pengurus per divisi)
│
├── css/
│   ├── input.css                  # Berkas sumber layer Tailwind (@tailwind base, components, utilities)
│   ├── style.css                  # Stylesheet kustom untuk tema, scrollbar, dan animasi khusus
│   └── tailwind.min.css           # Hasil kompilasi akhir Tailwind CSS yang terminifikasi
│
├── js/
│   └── script.js                  # Skrip utama logika aplikasi, anti-spam, analytics, dan interaksi UI
│
└── pages/
    ├── flag.html                  # Halaman uji coba khusus
    ├── pengurus.html              # Halaman struktur kepengurusan organisasi (URL: /pages/pengurus)
    ├── privacy.html               # Halaman kebijakan privasi data (URL: /pages/privacy)
    └── terms.html                 # Halaman syarat dan ketentuan layanan (URL: /pages/terms)
```

---

## 4. Optimasi Performa dan Core Web Vitals

Seluruh kode sumber telah dioptimalkan secara ketat untuk mencapai skor performa tinggi pada Google PageSpeed Insights dan Core Web Vitals:

### A. Pengurangan Bobot CSS dan Penghapusan Render-Blocking
* Menggantikan script `cdn.tailwindcss.com` sebesar sekitar 300 KB dengan file statis terminifikasi `css/tailwind.min.css` sebesar 25 KB, menghemat lebih dari 90 persen ukuran transfer CSS.
* Menghilangkan `@import url(...)` pada file `css/style.css` yang sebelumnya menghambat proses render browser.
* Menerapkan `<link rel="preconnect">` dan `<link rel="dns-prefetch">` pada domain Google Fonts (`fonts.googleapis.com` dan `fonts.gstatic.com`) untuk mempercepat koneksi socket jaringan sebelum font diunduh.

### B. Optimalisasi Largest Contentful Paint (LCP)
* Gambar hero section (`assets/img/hero.webp`) dilengkapi dengan tag `<link rel="preload" as="image" href="assets/img/hero.webp" fetchpriority="high">` pada file `index.html`. Hal ini memastikan gambar utama diunduh oleh scanner browser pada prioritas tertinggi sejak awal siklus pemuatan.

### C. Pencegahan Cumulative Layout Shift (CLS) dan Pemuatan Gambar Efisien
* Seluruh elemen gambar, khususnya lebih dari 40 foto pengurus pada `pages/pengurus.html`, telah dilengkapi dengan atribut dimensi eksplisit (`width` dan `height`), atribut `loading="lazy"` untuk menghemat kuota data, serta `decoding="async"` agar proses decoding citra tidak memblokir thread utama eksekusi antarmuka.

### D. Peringanan JavaScript
* Ukuran file `js/script.js` dipangkas dari 57 KB menjadi 33 KB melalui eliminasi kode redundan dan penghapusan permintaan API eksternal geolokasi IP yang sebelumnya menambah latensi jaringan saat inisialisasi halaman.

---

## 5. Arsitektur Keamanan Siber Tanpa Captcha Pihak Ketiga

Sistem keamanan website dibangun dengan pendekatan frictionless security, memberikan perlindungan terhadap bot dan eksploitasi data formulir tanpa menggunakan widget captcha modern (seperti Google reCAPTCHA atau Cloudflare Turnstile) yang berpotensi menurunkan kenyamanan pengunjung:

### A. Proteksi Formulir Kontak Berlapis (Anti-Spam Heuristics)
1. **Perangkap Honeypot**: Formulir kontak dilengkapi field tersembunyi (`confirm_email_hp`) yang dirancang khusus untuk memikat bot pengisi formulir otomatis. Jika field ini terisi oleh skrip otomatis, sistem akan melakukan penolakan diam-diam (silent rejection) tanpa mengganggu pengguna sah.
2. **Ambang Batas Waktu Berbasis Perilaku**: Pengiriman pesan yang berlangsung lebih cepat dari 2.5 detik sejak halaman dibuka akan ditolak secara otomatis, karena interaksi manusia yang wajar membutuhkan waktu untuk membaca dan mengetik pesan.
3. **Deteksi Interaksi Fisik Manusia**: Sistem memverifikasi adanya sinyal interaksi nyata (seperti penekanan tombol keyboard, pergerakan kursor, atau fokus elemen form) sebelum proses transmisi diizinkan.
4. **Pembatasan Frekuensi (Rate Limiting Lokal)**: Pengiriman pesan dibatasi maksimal 3 kali dalam interval 5 menit dengan masa jeda (cooldown) minimal 60 detik untuk mencegah serangan banjir pesan (flooding).
5. **Proof-of-Work (PoW) SHA-256 Sisi Klien**: Peramban pengunjung wajib memecahkan komputasi kriptografis SHA-256 lokal untuk membuktikan kapasitas komputasi sebelum data dikirim ke endpoint Google Apps Script.
6. **Integritas Data HMAC-SHA256**: Seluruh payload pesan ditandatangani menggunakan tanda tangan kriptografis HMAC untuk menjamin integritas data saat transit ke Google Apps Script backend.

### B. Pengamanan Kredensial dan Endpoint
* File `short.js` tidak lagi menyimpan kunci otentikasi dalam bentuk teks mentah (plaintext), melainkan membaca variabel lingkungan rahasia Cloudflare Worker (`SHORTLINKS_ADMIN_KEY`).
* Menghilangkan jalur URL rahasia dari `robots.txt` guna mencegah pengintaian informasi sensitif oleh mesin pencari web.
* Menambahkan direktori dependensi `node_modules/` ke dalam file `.gitignore`.

### C. Konfigurasi HTTP Security Headers Enterprise
Konfigurasi `vercel.json` menerapkan rangkaian header keamanan ketat pada setiap respons server:
* **Content-Security-Policy (CSP)**: Mengontrol sumber daya skrip, gaya, font, gambar, dan frame yang diizinkan untuk dieksekusi guna mencegah serangan Cross-Site Scripting (XSS) dan data injection.
* **X-Frame-Options: SAMEORIGIN**: Mencegah serangan Clickjacking dengan melarang penyematan website di dalam iframe pada domain eksternal.
* **X-Content-Type-Options: nosniff**: Memaksa browser mematuhi tipe MIME dokumen yang dikirimkan server untuk mencegah serangan berbasis eksploitasi MIME sniffing.
* **Strict-Transport-Security (HSTS)**: Mewajibkan enkripsi koneksi HTTPS selama dua tahun penuh (`max-age=63072000; includeSubDomains; preload`).
* **Referrer-Policy: strict-origin-when-cross-origin**: Menjaga kerahasiaan URL rujukan saat navigasi berpindah ke domain lain.
* **Permissions-Policy**: Mematikan akses sensor perangkat yang tidak relevan (seperti kamera, mikrofon, dan geolokasi) untuk meningkatkan privasi pengunjung.
* **Cache-Control Imutabel**: Mengatur caching aset statis (`/assets/*`, `/css/*`, `/js/*`) selama satu tahun dengan status `immutable` guna mempercepat pemuatan halaman pada kunjungan ulang.

---

## 6. Standar Search Engine Optimization (SEO) dan Aksesibilitas

Website ini dirancang agar mudah ditemukan, dipahami, dan diindeks secara kredibel oleh mesin pencari web:

1. **Clean URLs Universal**: Seluruh tautan internal, tag kanonikal (`rel="canonical"`), dan sitemap telah diselaraskan ke rute URL tanpa ekstensi `.html`:
   * Halaman Beranda: `https://himtekk.com/`
   * Halaman Pengurus: `https://himtekk.com/pages/pengurus`
   * Halaman Privasi: `https://himtekk.com/pages/privacy`
   * Halaman Ketentuan Layanan: `https://himtekk.com/pages/terms`
2. **Peningkatan Nilai E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)**:
   * Mengizinkan perayapan dokumen kebijakan privasi dan syarat layanan pada `robots.txt`.
   * Mengatur meta tag robot pada `privacy.html` dan `terms.html` menjadi `index, follow` guna memperkuat sinyal kepercayaan mesin pencari terhadap legalitas organisasi.
3. **Optimasi Aksesibilitas Citra (Image SEO)**: Seluruh atribut `alt` pada foto profil pengurus telah dilengkapi dengan format teks deskriptif standar: `alt="[Nama Lengkap] - [Jabatan] HIMTEKK"`.
4. **Structured Data (Schema.org / JSON-LD)**: Menyematkan skema terstruktur `BreadcrumbList` pada seluruh subhalaman untuk menghasilkan tampilan cuplikan kaya (rich breadcrumb snippets) pada hasil pencarian Google.
5. **Protokol Open Graph dan Twitter Card**: Menetapkan metadata sosial media lengkap mencakup `og:title`, `og:description`, `og:image`, `og:image:width: 1200`, `og:image:height: 630`, dan `twitter:card: summary_large_image`.

---

## 7. Privasi dan Kepatuhan Pelacakan Pengunjung (GDPR)

Website ini menerapkan sistem manajemen persetujuan cookie (Cookie Consent Manager) yang patuh terhadap regulasi perlindungan data pribadi internasional (GDPR):

1. **Pencegahan Pelacakan Default**: Seluruh skrip pelacakan analitik berada dalam kondisi nonaktif secara global (`window['ga-disable-G-YWKD4CJZJY'] = true`) sampai pengguna memberikan persetujuan eksplisit melalui banner cookie.
2. **Injeksi Skrip Dinamis**: Google Analytics 4 (ID Pengukuran: `G-YWKD4CJZJY`) diinjeksikan ke dalam DOM hanya setelah status persetujuan bernilai positif.
3. **Dukungan Google Consent Mode v2**: Sinyal persetujuan dikirimkan secara formal ke endpoint analitik Google (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`) sesuai preferensi pengguna.
4. **Persistensi Preferensi**: Status persetujuan disimpan dalam bentuk Cookie HTTP dan dicadangkan pada LocalStorage peramban untuk mencegah munculnya banner berulang pada kunjungan berikutnya.

---

## 8. Panduan Pengembangan dan Kompilasi Lokal

Untuk melakukan pengembangan lokal pada repositori ini, ikuti langkah-langkah berikut:

### A. Prasyarat Sistem
* Node.js versi 18 atau yang lebih baru.
* Pengelola paket npm (bawaan dari instalasi Node.js).
* Perangkat lunak Git.

### B. Tahapan Instalasi
1. Klon repositori ke komputer lokal Anda:
   ```bash
   git clone https://github.com/Irfan3006/HIMTEKK.git
   cd HIMTEKK
   ```
2. Pasang dependensi pengembangan untuk Tailwind CSS:
   ```bash
   npm install
   ```

### C. Menjalankan Kompilasi CSS
* Untuk mengompilasi CSS satu kali ke format terminifikasi untuk rilis:
  ```bash
  npm run build:css
  ```
* Untuk menjalankan pengawasan otomatis (watcher) saat sedang mengubah file HTML atau CSS:
  ```bash
  npm run watch:css
  ```

---

## 9. Administrasi Akun Resmi dan Infrastruktur Cloud

Seluruh layanan pendukung operasional website wajib dihubungkan ke akun Google resmi organisasi demi menjamin kontinuitas akses antargenerasi kepengurusan:

* **Alamat Email Resmi**: `himtekk@amikom.ac.id`
* **Layanan Terhubung**:
  * Akun GitHub Organisasi (Penyimpanan repositori kode sumber)
  * Vercel (Penyedia hosting produksi)
  * Cloudflare (Manajemen DNS, mitigasi DDoS, dan WAF)
  * Google Search Console (Pemantauan indeks dan audit performa pencarian)
  * Google Analytics (Statistik lalu lintas pengunjung)

---

## 10. Prosedur Deployment ke Vercel

Layanan hosting produksi ditangani oleh platform Vercel dengan integrasi langsung ke repositori GitHub:

1. **Penyambungan Proyek**:
   * Masuk ke dashboard Vercel menggunakan akun resmi organisasi.
   * Pilih menu **Add New Project** dan impor repositori `HIMTEKK`.
2. **Parameter Proyek**:
   * **Framework Preset**: Pilih `Other`.
   * **Build Command**: Kosongkan (atau isi `npm run build:css` jika kompilasi dilakukan pada pipeline CI/CD).
   * **Output Directory**: Biarkan bernilai root (`.`).
3. **Penyebaran Otomatis (Continuous Deployment)**: Setiap pembaharuan kode yang digabungkan ke cabang utama (`main`) akan secara otomatis memicu proses build dan penyebaran ke server produksi Vercel.
4. **Aktivasi Firewall dan Proteksi Bot**:
   * Buka menu **Settings > Firewall** pada dashboard proyek Vercel.
   * Aktifkan opsi **Bot Protection**.
   * Aktifkan pemblokiran otomatis terhadap AI scraping bots yang tidak terverifikasi.

---

## 11. Konfigurasi Domain Kustom dan DNS Cloudflare

Pengaturan domain `himtekk.com` wajib diarahkan menggunakan proxy Cloudflare untuk menjamin keamanan jaringan dan proteksi terhadap serangan siber:

1. **Pengaturan pada Vercel**:
   * Masuk ke menu **Settings > Domains**.
   * Daftarkan domain utama `himtekk.com` dan subdomain `www.himtekk.com`.
2. **Pengaturan DNS pada Cloudflare**:
   * Atur Nameserver registrar domain agar mengarah ke Nameserver resmi Cloudflare.
   * Tambahkan entri DNS dengan status Proxy Aktif (Orange Cloud):
     * Tipe **A**: Nama `@`, Target `76.76.21.21`, Status **Proxied**.
     * Tipe **CNAME**: Nama `www`, Target `cname.vercel-dns.com`, Status **Proxied**.
3. **Pengaturan Enkripsi SSL/TLS**:
   * Pada menu **SSL/TLS > Overview** di Cloudflare, pastikan mode enkripsi disetel ke **Full (Strict)**.
   * Pengaturan ini mencegah terjadinya galat redirect loop yang disebabkan oleh perbedaan sertifikat SSL antara Cloudflare Edge dan server asal Vercel.

---

## 12. Prosedur Pemeliharaan Rutin Kepengurusan

1. **Pembaruan Data Pengurus**:
   * Edit file `pages/pengurus.html` pada blok kartu divisi yang bersangkutan.
   * Simpan foto resmi pengurus baru ke dalam folder `assets/img/pengurus/`.
   * Konversi seluruh citra ke format `.webp` dengan resolusi seragam dan ukuran kompresi yang efisien.
   * Pastikan atribut `alt`, `width`, dan `height` selalu terisi dengan tepat pada setiap tag `<img>`.
2. **Kompilasi Ulang Styling**: Jalankan `npm run build:css` setelah menambahkan kelas utility Tailwind baru pada file HTML sebelum melakukan commit kode ke repositori.
3. **Pemberian Izin Akses Akun**: Sebelum masa kepengurusan berakhir, lakukan serah terima seluruh kredensial email organisasi, akses Vercel, Cloudflare, dan Google Analytics kepada pengurus divisi siber/teknologi informasi periode berikutnya secara aman.
4. **Kepatuhan Desain Grafis**: Setiap penambahan komponen antarmuka baru wajib merujuk pada standar [panduan-color-palette.md](panduan-color-palette.md) untuk menjaga konsistensi identitas visual organisasi.

---

## 13. Lisensi Perangkat Lunak

Proyek ini didistribusikan di bawah naungan lisensi **MIT License**.

Hak Cipta (c) 2026 Himpunan Mahasiswa Teknik Komputer (HIMTEKK) Universitas Amikom Yogyakarta.

Ketentuan lengkap perizinan dan batasan penggunaan perangkat lunak dapat ditinjau pada dokumen [LICENSE](LICENSE).

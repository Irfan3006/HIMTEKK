# Dokumentasi Website Resmi HIMTEKK Amikom Yogyakarta

Dokumentasi ini disusun untuk memberikan panduan teknis mengenai penggunaan, pengembangan, dan pemeliharaan website resmi HIMTEKK Universitas Amikom Yogyakarta kepada kepengurusan di masa mendatang.

## Deskripsi Proyek

Website HIMTEKK adalah platform informasi digital resmi organisasi Himpunan Mahasiswa Teknik Komputer (HIMTEKK) Universitas Amikom Yogyakarta. Website ini berfungsi sebagai media profil organisasi, pusat informasi kegiatan, dan sarana publikasi bagi seluruh anggota dan khalayak umum.

## Spesifikasi Teknologi

Website ini dibangun menggunakan teknologi berbasis web statis (Static Site) untuk memastikan performa yang optimal dan kemudahan dalam pengelolaan:

1.  **HTML5**: Sebagai struktur dasar konten website.
2.  **Tailwind CSS (CDN)**: Digunakan untuk kerangka desain (styling) yang responsif dan modern.
3.  **JavaScript (Vanilla)**: Untuk logika interaksi sisi klien.
4.  **Library Pendukung**:
    *   **AOS (Animate On Scroll)**: Untuk animasi transisi saat melakukan gulir halaman.
    *   **FontAwesome**: Untuk penyediaan ikonografi.
    *   **SweetAlert2**: Untuk tampilan dialog box atau notifikasi yang interaktif.
    *   **Animate.css**: Untuk animasi elemen UI.

## Struktur Direktori

Berikut adalah penjelasan mengenai struktur file dalam proyek ini:

*   `index.html`: Halaman utama website yang berisi profil umum, visi misi, dan informasi kontak.
*   `404.html`: Halaman kesalahan 404 kustom.
*   `pages/`: Direktori yang menyimpan halaman tambahan:
    *   `pengurus.html`: Halaman struktur organisasi.
    *   `privacy.html`: Kebijakan privasi.
    *   `terms.html`: Ketentuan layanan.
    *   `flag.html`: Halaman redirect khusus.
*   `assets/img`: Direktori aset media.
    *   `assets/img/pengurus/`: Folder khusus untuk menyimpan foto profil seluruh pengurus.
*   `css/`: Berisi file stylesheet kustom (`style.css`).
*   `js/`: Berisi file skrip JavaScript kustom (`script.js`).

## Panduan Penggunaan Lokal

Untuk melakukan pengembangan atau perubahan konten secara lokal, ikuti langkah-langkah berikut:

1.  Unduh atau klon seluruh file source code ke komputer Anda.
2.  Pastikan seluruh struktur folder tetap terjaga (jangan memindahkan file keluar dari foldernya kecuali diperlukan).
3.  Gunakan editor teks seperti Visual Studio Code.
4.  Sangat disarankan menggunakan ekstensi "Live Server" pada VS Code untuk melihat perubahan secara real-time.
5.  Buka file `index.html` melalui browser untuk meninjau hasil akhir.

## Administrasi Akun Resmi

Seluruh layanan pendukung website wajib menggunakan akun Google resmi organisasi untuk menjamin keberlanjutan akses bagi kepengurusan berikutnya.

*   **Email Resmi**: `himtekk@amikom.ac.id`
*   **Layanan Terkait**: Akun ini wajib digunakan untuk mendaftar dan mengelola:
    *   Vercel (Hosting)
    *   Google Search Console (Indeks Pencarian)
    *   Google Analytics (Statistik Pengunjung)
    *   GitHub (Penyimpanan Source Code)

## Pengelolaan Source Code (GitHub)

Source code website ini disimpan dalam repositori Git untuk memudahkan kolaborasi dan version control.

1.  **Akses Repositori**: Pastikan repositori GitHub berada di bawah organisasi atau akun yang terhubung dengan `himtekk@amikom.ac.id`.
2.  **Sinkronisasi**: Setiap perubahan yang di-push ke branch utama (`main`) akan secara otomatis memicu proses build dan update pada server Vercel.

## Monitoring dan Analitik

Untuk memantau performa dan kesehatan website, digunakan dua instrumen utama dari Google:

### 1. Google Search Console
Digunakan untuk memantau website di hasil pencarian Google.
*   **Verifikasi**: Dilakukan menggunakan metode DNS Record atau pengunggahan file HTML verifikasi.
*   **Fungsi**: Mengajukan sitemap, memantau error pengindeksan, dan meninjau kata kunci yang membawa pengunjung ke website.
*   **Akses Data**: Login ke [Google Search Console](https://search.google.com/search-console) menggunakan akun `himtekk@amikom.ac.id` untuk memantau indeks dan performa pencarian.

### 2. Google Analytics (GA4) & Consent Mode
Digunakan untuk menganalisis perilaku pengunjung dengan standar privasi tinggi (GDPR compliant).
*   **ID Pengukuran**: `G-YWKD4CJZJY` (Dikonfigurasi melalui `js/script.js`).
*   **Mekanisme**: Website menggunakan **Dynamic Injection**. Skrip pelacakan tidak dimuat secara otomatis, melainkan hanya setelah pengguna memberikan izin melalui banner cookie.
*   **Consent Mode v2**: Implementasi terbaru Google yang memastikan data hanya dikirim sesuai tingkat persetujuan pengguna (analytics, ads, user_data).
*   **Akses Data**: Login ke [Google Analytics](https://analytics.google.com/) menggunakan akun `himtekk@amikom.ac.id`.

## Fitur Privasi & Kepatuhan (GDPR)

Website ini dilengkapi dengan **Cookie Consent Manager** untuk memenuhi standar privasi global:

1.  **Pemblokiran Global**: Secara default, semua fungsi pelacakan dimatikan (`ga-disable` diaktifkan) sebelum ada aksi dari pengguna.
2.  **Mekanisme Penyimpanan**:
    *   **Cookie**: Digunakan sebagai sumber utama.
    *   **LocalStorage**: Digunakan sebagai *fallback/cache* cadangan.

## Panduan Deployment ke Vercel

Vercel digunakan sebagai platform hosting karena kemampuannya dalam menangani website statis dengan sangat baik dan efisien. Seluruh administrasi di Vercel wajib menggunakan login GitHub yang terhubung dengan email `himtekk@amikom.ac.id`.

### Langkah-langkah Deployment:

1.  **Persiapan Repositori**:
    Pastikan source code sudah berada di GitHub dengan akun resmi.
2.  **Koneksi ke Vercel**:
    *   Masuk ke dashboard [Vercel](https://vercel.com/) menggunakan akun GitHub resmi.
    *   Pilih "Add New" lalu klik "Project".
    *   Impor repositori website HIMTEKK.
3.  **Konfigurasi Proyek**:
    *   Vercel akan mendeteksi secara otomatis bahwa ini adalah proyek web statis.
    *   **Framework Preset**: Pilih "Other".
    *   **Build Command**: Biarkan kosong.
    *   **Output Directory**: Biarkan default (titik/root).
4.  **Eksekusi Deployment**:
    Klik tombol "Deploy".
5.  **Konfigurasi Keamanan (Firewall)**:
    Setelah deployment berhasil, wajib mengaktifkan fitur perlindungan bot pada menu **Settings > Firewall**:
    *   **Bot Protection**: Aktifkan fitur ini.
    *   **Challenge**: Aktifkan tantangan (challenge) untuk permintaan dari sumber non-browser (kecuali verified bots).
    *   **AI Bots**: Pilih opsi untuk memblokir permintaan dari AI bots dan scrapers yang dikenal.

## Konfigurasi Domain Kustom

Domain `himtekk.com` harus dikelola dan dihubungkan melalui akun Vercel yang sama.

### 1. Pengaturan di Vercel:
*   Buka proyek di dashboard Vercel.
*   Masuk ke menu "Settings" > "Domains".
*   Masukkan nama domain `himtekk.com`.

### 2. Pengaturan di Registrar Domain (DNS):
Update catatan DNS pada penyedia layanan domain (wajib menggunakan akun resmi jika registrar dipisah):

*   **A Record**: `@` -> `76.76.21.21`
*   **CNAME Record**: `www` -> `cname.vercel-dns.com`

## Pemeliharaan Berkala

1.  **Pembaruan Pengurus**: Modifikasi file `pengurus.html` pada bagian grid anggota. Pastikan gambar profil disimpan di folder `assets/img/pengurus`.
2.  **Optimalisasi Gambar**: Gunakan format `.webp` untuk efisiensi bandwidth.
3.  **Keamanan Akun**: Selalu pastikan akses ke email `himtekk@amikom.ac.id` terjaga dan kredensial diserahterimakan dengan aman ke pengurus baru.

## Lisensi

Proyek ini dilindungi oleh **MIT License**.

Copyright (©) 2026 HIMTEKK

Lihat file [LICENSE](LICENSE) untuk informasi lebih lanjut mengenai izin dan batasan lisensi.

## Penutup

Dokumentasi ini diharapkan dapat menjadi panduan yang jelas bagi pengembang atau pengurus HIMTEKK di masa mendatang dalam mengelola aset digital organisasi secara profesional dan terpusat pada satu identitas resmi.

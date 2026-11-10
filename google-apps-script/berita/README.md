# Panduan Integrasi Database Google Sheets & Google Apps Script (Berita HIMTEKK)

Panduan ini menjelaskan cara mengaktifkan sistem database berbasis **Google Sheets** dan backend API berbasis **Google Apps Script** untuk portal berita dan dashboard admin HIMTEKK.

---

## Arsitektur & Keamanan

Sistem ini dirancang dengan standar keamanan tinggi:
1. **Google Sheets sebagai Database**: Menyimpan data berita (`BERITA`), konten utuh ter-chunk (`KONTEN`), kategori (`KATEGORI`), akun redaksi (`USERS`), sesi aktif (`SESSIONS`), dan log audit (`LOG`).
2. **Google Apps Script sebagai API**: Berfungsi sebagai REST-like microservice backend tanpa memerlukan server database mandiri.
3. **Gateway Astro SSR di Vercel**: Seluruh request dari browser diarahkan ke endpoint internal `/api/berita/[action]`. Token `API_SECRET` disimpan di environment variable server Vercel sehingga **tidak pernah terekspos ke sisi klien/browser**.
4. **Proteksi Akun & Sandi**:
   - Kata sandi di-hash menggunakan algoritma SHA-256 dengan *random salt* dan iterasi (format `v2$<iterasi>$<salt>$<hash>`).
   - Proteksi brute-force otomatis mengunci akun selama 15 menit jika terjadi 5 kali kegagalan login berturut-turut.
   - Token sesi berbentuk acak 64-karakter hex dengan masa kedaluwarsa 12 jam.
5. **Auto-Chunking Konten Besar**: Konten artikel panjang otomatis dipecah menjadi blok 40.000 karakter agar tidak melebihi batas 50.000 karakter per sel di Google Sheets.
6. **Unggah Media ke Google Drive**: Admin/Editor dapat mengunggah gambar langsung dari komputer; file otomatis disimpan ke folder Google Drive dan menghasilkan URL publik berkecepatan tinggi.

---

## Langkah 1: Buat Proyek Google Apps Script

1. Buka [Google Apps Script](https://script.google.com/) menggunakan akun Google resmi organisasi (`himtekk@amikom.ac.id`).
2. Klik tombol **New Project** (Proyek Baru).
3. Beri nama proyek, misalnya: `HIMTEKK Berita API`.
4. Hapus seluruh isi file `Code.gs` bawaan, lalu salin dan tempelkan seluruh kode dari file:
   [`google-apps-script/berita/Code.gs`](file:///d:/File_IRFAN/CODE/HIMTEKK/google-apps-script/berita/Code.gs)
5. Klik ikon **Save** (Simpan).

---

## Langkah 2: Konfigurasi Script Properties

1. Di editor Google Apps Script, klik menu **Project Settings** (ikon roda gigi di bilah kiri).
2. Gulir ke bawah ke bagian **Script Properties**, lalu klik **Add script property** untuk menambahkan variabel berikut:

| Property | Contoh Nilai | Keterangan |
|---|---|---|
| `ADMIN_USERNAME` | `admin` | Username akun administrator utama |
| `ADMIN_PASSWORD` | `Himtekk2026!Admin` | Kata sandi awal (minimal 8 karakter, huruf + angka) |
| `API_SECRET` | `himtekk-super-secret-key-2026` | Kunci rahasia untuk autentikasi server Vercel |

3. Klik **Save script properties**.

---

## Langkah 3: Jalankan Inisialisasi Database (`setup()`)

1. Kembali ke tab **Editor** (`< >`).
2. Di toolbar atas, pada dropdown fungsi yang ingin dijalankan, pilih fungsi **`setup`**.
3. Klik tombol **Run** (Jalankan).
4. Google akan meminta izin (*Authorization Required*):
   - Klik **Review permissions**
   - Pilih akun Google Anda
   - Klik **Advanced** -> Klik **Go to HIMTEKK Berita API (unsafe)**
   - Klik **Allow**
5. Buka tab **Execution log** di bagian bawah. Anda akan melihat log seperti:
   ```text
   Spreadsheet baru dibuat: https://docs.google.com/spreadsheets/d/1xxxxxxxxxxxxxxx
   Admin "admin" dibuat.
   Setup selesai.
   ```
6. Buka URL spreadsheet yang tertera di log untuk memastikan sheet `BERITA`, `KONTEN`, `KATEGORI`, `USERS`, `SESSIONS`, dan `LOG` telah terbuat dengan rapi.

---

## Langkah 4: Deploy sebagai Web App

1. Di pojok kanan atas editor Apps Script, klik tombol **Deploy** -> pilih **New deployment**.
2. Klik ikon gerigi di sebelah *Select type*, lalu pilih **Web app**.
3. Isi parameter deployment:
   - **Description**: `HIMTEKK Berita Production v1`
   - **Execute as**: `Me (email-anda@amikom.ac.id)`
   - **Who has access**: `Anyone` *(Wajib diset Anyone agar Vercel dapat memanggil API)*
4. Klik tombol **Deploy**.
5. Salin **Web app URL** yang dihasilkan (formatnya: `https://script.google.com/macros/s/AKfycb.../exec`).

---

## Langkah 5: Hubungkan ke Vercel

1. Buka dashboard proyek Anda di [Vercel](https://vercel.com).
2. Masuk ke **Settings** -> **Environment Variables**.
3. Tambahkan 2 variabel berikut:

| Nama Variabel | Nilai | Lingkungan |
|---|---|---|
| `BERITA_SCRIPT_URL` | *(URL Web App dari Langkah 4, berakhiran `/exec`)* | Production, Preview, Development |
| `BERITA_API_SECRET` | *(Nilai API_SECRET dari Langkah 2)* | Production, Preview, Development |

4. Klik **Save**, lalu lakukan redeploy atau git push ke branch `main`.

---

## Alur Halaman di Website

- **Halaman Berita Publik**: `https://himtekk.com/berita` (Menampilkan daftar berita, filter kategori, search, dan artikel unggulan).
- **Halaman Detail Berita**: `https://himtekk.com/berita/[slug]` (Isi berita lengkap, indikator baca, share bar, views counter).
- **Halaman Login Redaksi**: `https://himtekk.com/berita/login` (Masuk menggunakan `ADMIN_USERNAME` dan `ADMIN_PASSWORD`).
- **Dashboard Admin**: `https://himtekk.com/berita/admin` (Kelola berita, statistik views, draft/published, kategori, pengguna).
- **Tulis Berita**: `https://himtekk.com/berita/admin/tulis` (Editor Markdown lengkap dengan pratinjau & upload cover ke Drive).
- **Edit Berita**: `https://himtekk.com/berita/admin/edit?id=[id]` (Perbarui artikel).

---

## Pemeliharaan & Reset Password

- **Ganti Password Admin**: Bisa dilakukan langsung dari dashboard admin pada tab **Ganti Password**, atau jika lupa kata sandi:
  1. Masukkan kata sandi baru pada Script Properties `ADMIN_PASSWORD`.
  2. Jalankan fungsi `resetAdminPassword()` di Google Apps Script.
- **Pembersihan Sesi**: Di menu **Triggers** (ikon jam di bilah kiri Apps Script), Anda dapat menambahkan trigger berbasis waktu harian (*Time-driven*) untuk menjalankan fungsi `cleanExpiredSessions()` secara otomatis.

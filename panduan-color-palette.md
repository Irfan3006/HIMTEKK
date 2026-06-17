# Panduan Color Palette Resmi HIMTEKK
Himpunan Mahasiswa Teknik Komputer (HIMTEKK) - Universitas Amikom Yogyakarta

Dokumen ini berisi panduan skema warna resmi yang wajib diikuti untuk website dan sosial media resmi HIMTEKK. Panduan ini dibuat untuk menjaga konsistensi identitas visual dan estetika premium di seluruh media publikasi HIMTEKK.

---

## 1. Warna Utama (Brand Colors)

### Primary Color (Biru Tua / Deep Blue)
*   **HEX:** `#00406E`
*   **RGB:** `rgb(0, 64, 110)`
*   **HSL:** `hsl(205, 100%, 22%)`
*   **Makna:** Melambangkan profesionalisme, teknologi, keamanan (*Cyber Security*), stabilitas, dan integritas organisasi.
*   **Penggunaan:** Latar belakang utama (navbar mobile, footer, section Visi Misi), warna teks judul utama (*headings*), warna scrollbar, tombol utama, dan elemen hover penting.

### Accent Color (Emas / Gold)
*   **HEX:** `#DBB865`
*   **RGB:** `rgb(219, 184, 101)`
*   **HSL:** `hsl(42, 63%, 63%)`
*   **Makna:** Melambangkan prestasi, keunggulan, inovasi (*Internet of Things*), energi positif, dan memberikan sentuhan premium/elegan.
*   **Penggunaan:** Aksen dekoratif, garis bawah link aktif (navbar), highlight teks, ikon, label status, hover tombol sekunder, dan efek glow.

### Secondary Color (Putih Bersih / Pure White)
*   **HEX:** `#FFFFFF`
*   **RGB:** `rgb(255, 255, 255)`
*   **HSL:** `hsl(0, 0%, 100%)`
*   **Penggunaan:** Latar belakang section putih (seperti Tentang Kami, Kontak), warna teks di atas latar belakang gelap (primary), dan tombol sekunder.

---

## 2. Warna Netral & Latar Belakang (Neutral Colors)

| Elemen | HEX Code | RGB | Keterangan & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Base Background** | `#F8FAFC` | `rgb(248, 250, 252)` | Latar belakang default halaman (body) untuk memberikan kesan bersih dan modern (Slate 50). |
| **Footer & Dark Details** | `#0F172A` | `rgb(15, 23, 42)` | Latar belakang footer utama dan area gelap kontras tinggi (Slate 900). |
| **Text Primary** | `#1E293B` | `rgb(30, 41, 59)` | Warna teks default (body text) pada latar belakang terang untuk keterbacaan optimal (Slate 800). |
| **Text Muted / Sub-elements** | `#475569` | `rgb(71, 85, 105)` | Deskripsi paragraf panjang, teks sekunder, dan sub-judul (Slate 600). |
| **Border & Scrollbar Track** | `#F1F5F9` | `rgb(241, 245, 249)` | Garis pembatas (border) halus, track scrollbar, dan card background (Slate 100). |

---

## 3. Panduan Penggunaan & Kombinasi Warna

### Kontras Teks
*   Jika latar belakang menggunakan warna **Primary** (`#00406E`), pastikan teks menggunakan warna **Secondary** (`#FFFFFF`) dengan tingkat opacity minimal 80%-90% untuk paragraf.
*   Gunakan warna **Accent** (`#DBB865`) hanya untuk highlight kata kunci penting atau link.

### Komponen Glassmorphism (Efek Kaca)
Gunakan kombinasi warna putih transparan dengan blur serta border tipis untuk memberikan kesan modern:
```css
.glass {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Gradasi Latar Belakang (Hero Section)
Gunakan gradasi linear dari warna primary ke arah warna primary yang lebih gelap yang digabungkan dengan gambar latar belakang ber-overlay:
```css
background-image: linear-gradient(rgba(0, 64, 110, 0.8), rgba(0, 64, 110, 0.9)), url('assets/img/hero.webp');
```

---

## 4. Konfigurasi & Integrasi Kode

### Tailwind CSS Configuration
Di dalam `index.html` atau file konfigurasi Tailwind Anda:
```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#00406E',
                secondary: '#FFFFFF',
                accent: '#DBB865',
            }
        }
    }
}
```

### CSS Variables (Custom Properties)
Untuk diletakkan di bagian atas file `css/style.css`:
```css
:root {
    --color-primary: #00406E;
    --color-secondary: #FFFFFF;
    --color-accent: #DBB865;
    --color-bg-base: #F8FAFC;
    --color-text-main: #1E293B;
    --color-text-muted: #475569;
}
```

### Penerapan pada Scrollbar (CSS)
```css
/* Custom Scrollbar */
::-webkit-scrollbar {
    width: 10px;
}

::-webkit-scrollbar-track {
    background: #F1F5F9;
}

::-webkit-scrollbar-thumb {
    background: #00406E;
    border-radius: 5px;
    border: 2px solid #F1F5F9;
}

::-webkit-scrollbar-thumb:hover {
    background: #DBB865;
}
```

---

> [!IMPORTANT]
> Panduan ini wajib diikuti untuk seluruh pengembangan website dan pembuatan konten sosial media resmi HIMTEKK Universitas Amikom Yogyakarta demi menjaga konsistensi identitas visual organisasi.

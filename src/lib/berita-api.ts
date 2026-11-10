import { BERITA_CONFIG, DEFAULT_CATEGORIES } from './berita-config';

export interface BeritaPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  thumbnail: string;
  category: string;
  category_name?: string;
  tags?: string[];
  author_id?: string;
  author_name: string;
  status?: 'published' | 'draft';
  featured?: boolean;
  views: number;
  word_count?: number;
  created_at: string;
  updated_at?: string;
  published_at?: string;
}

export interface BeritaIndexData {
  posts: BeritaPost[];
  categories: {
    slug: string;
    name: string;
    description: string;
    count: number;
  }[];
  fromCache?: boolean;
  isFallback?: boolean;
}

// ---------------------------------------------------------------------------
// Fallback / Data awal (ditampilkan jika Apps Script belum terhubung)
// ---------------------------------------------------------------------------
const SEED_POSTS: BeritaPost[] = [
  {
    id: 'seed_1',
    slug: 'himtekk-resmi-tutup-open-recruitment-pengurus-periode-2026-2027',
    title: 'HIMTEKK Resmi Tutup Open Recruitment Pengurus Periode 2026/2027',
    excerpt: 'Setelah melalui tahapan pendaftaran yang ketat, HIMTEKK Universitas Amikom Yogyakarta secara resmi menutup proses registrasi Oprec 2026 dan beralih ke tahap seleksi wawancara.',
    content: `## Penutupan Pendaftaran Open Recruitment HIMTEKK 2026

Himpunan Mahasiswa Teknik Komputer (HIMTEKK) Universitas Amikom Yogyakarta secara resmi mengumumkan penutupan pendaftaran **Open Recruitment (Oprec)** kepengurusan untuk periode 2026/2027.

Proses pendaftaran yang telah berlangsung mendapatkan antusiasme yang luar biasa dari para mahasiswa program studi Teknik Komputer angkatan 2024 dan 2025. Ratusan pendaftar telah memilih divisi pilihan mereka mulai dari:

- **Cyber Security**: Fokus pada keamanan jaringan, ethical hacking, digital forensics, dan persiapan kompetisi Capture The Flag (CTF).
- **Internet of Things (IoT)**: Mengembangkan hardware pintar, mikrokontroler ESP32/Arduino, dan sistem automasi cerdas.
- **Pengembangan Sumber Daya Manusia (PSDM)**: Membangun kepemimpinan, bonding, dan manajemen kaderisasi organisasi.
- **Digital Creative**: Menangani branding visual, UI/UX design, konten media sosial, dan multimedia.
- **Program & Event Development**: Manajemen program kerja unggulan, seminar teknologi, dan kompetisi nasional.
- **Public Relationship**: Menjalin sinergi kemitraan eksternal, relasi industri, dan pengabdian masyarakat.

### Tahapan Selanjutnya
Seluruh peserta yang telah mengumpulkan berkas administrasi dihimbau untuk secara berkala mengecek email resmi dan grup koordinasi untuk jadwal sesi wawancara (_interview_) serta uji kompetensi divisi masing-masing.

Kami mengapresiasi dedikasi dan semangat rekan-rekan mahasiswa yang ingin berkontribusi membangun ekosistem teknologi di lingkungan Universitas Amikom Yogyakarta bersama HIMTEKK.`,
    thumbnail: '/assets/img/hero.webp',
    category: 'rekrutmen',
    category_name: 'Rekrutmen',
    tags: ['Oprec', 'HIMTEKK', 'Amikom', 'Organisasi'],
    author_name: 'BPH HIMTEKK',
    status: 'published',
    featured: true,
    views: 142,
    word_count: 220,
    created_at: '2026-11-01T09:00:00.000Z',
    published_at: '2026-11-01T09:00:00.000Z'
  },
  {
    id: 'seed_2',
    slug: 'workshop-cyber-security-eksplorasi-dasar-penetration-testing-dan-ctf',
    title: 'Workshop Cyber Security: Eksplorasi Dasar Penetration Testing dan CTF',
    excerpt: 'Divisi Cyber Security HIMTEKK menyelenggarakan workshop intensif pengenalan teknik ethical hacking, analisis kerentanan web, dan strategi penyelesaian tantangan kompetisi CTF.',
    content: `## Membangun Pondasi Talenta Keamanan Siber Mahasiswa

Sebagai upaya meningkatkan kompetensi mahasiswa di ranah keamanan digital, Divisi Cyber Security HIMTEKK sukses menyelenggarakan agenda **Workshop Hands-on: Cyber Security & CTF 101**.

Acara yang digelar di Laboratorium Komputer Universitas Amikom Yogyakarta ini menghadirkan sesi praktik langsung mengenai:

1. **Reconnaissance & Footprinting**: Penggunaan tools seperti Nmap dan OSINT untuk identifikasi target.
2. **Web Vulnerability Assessment**: Pembahasan kerentanan umum OWASP Top 10 seperti SQL Injection, Cross-Site Scripting (XSS), dan Insecure Direct Object References (IDOR).
3. **Capture The Flag (CTF) Fundamentals**: Membedah kategori kriptografi, reverse engineering, dan forensics.

> "Keamanan siber bukan hanya tentang menyerang atau bertahan, melainkan memahami bagaimana sistem bekerja secara mendalam agar kita dapat menutup celah sebelum dieksploitasi pihak yang tidak bertanggung jawab."

Kegiatan ini diharapkan menjadi batu loncatan bagi mahasiswa Teknik Komputer untuk aktif berkompetisi di ajang nasional seperti Gemastik, Cyber Jawara, dan perlombaan CTF lainnya.`,
    thumbnail: '/assets/img/og.webp',
    category: 'cyber-security',
    category_name: 'Cyber Security',
    tags: ['Cyber Security', 'Workshop', 'CTF', 'Ethical Hacking'],
    author_name: 'Divisi Cyber Security',
    status: 'published',
    featured: true,
    views: 295,
    word_count: 185,
    created_at: '2026-10-24T13:30:00.000Z',
    published_at: '2026-10-24T13:30:00.000Z'
  },
  {
    id: 'seed_3',
    slug: 'inovasi-smart-campus-berbasis-iot-karya-kolaboratif-divisi-iot-himtekk',
    title: 'Inovasi Smart Campus Berbasis IoT: Karya Kolaboratif Divisi IoT HIMTEKK',
    excerpt: 'Kembangkan prototipe monitoring lingkungan kampus real-time dengan mikrokontroler hemat daya dan integrasi dashboard cloud telemetri.',
    content: `## Solusi Teknologi Cerdas untuk Lingkungan Kampus

Divisi Internet of Things (IoT) HIMTEKK memperkenalkan prototipe stasiun pemantau kualitas udara dan temperatur ruangan berbasis mikrokontroler ESP32 dengan protokol komunikasi MQTT.

Sistem ini dirancang untuk membaca data sensor DHT22 (suhu & kelembapan) serta MQ-135 (kualitas udara) yang kemudian dikirimkan secara kontinu ke server telemetri. Data tersebut diproses dan ditampilkan dalam bentuk visual grafik real-time yang dapat diakses oleh civitas akademika.

### Keunggulan Prototipe:
- **Low Power Consumption**: Dilengkapi fitur deep-sleep saat tidak sedang mentransmisikan data.
- **Modular Hardware**: Kemudahan integrasi modul sensor tambahan seperti detektor kebisingan dan sensor gerak PIR.
- **Open Data API**: Membuka peluang bagi mahasiswa untuk memanfaatkan data telemetri sebagai bahan riset skripsi maupun proyek mata kuliah.

Proyek ini menjadi bukti nyata komitmen HIMTEKK dalam mendorong riset aplikatif yang berdampak langsung bagi lingkungan kampus.`,
    thumbnail: '/assets/img/hero.webp',
    category: 'iot',
    category_name: 'IoT',
    tags: ['IoT', 'Smart Campus', 'ESP32', 'Hardware'],
    author_name: 'Divisi IoT',
    status: 'published',
    featured: false,
    views: 188,
    word_count: 195,
    created_at: '2026-10-15T10:15:00.000Z',
    published_at: '2026-10-15T10:15:00.000Z'
  }
];

// ---------------------------------------------------------------------------
// In-Memory Cache (Warm Serverless Memory)
// ---------------------------------------------------------------------------
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let postsListCache: CacheEntry<BeritaIndexData> | null = null;
const postDetailCache = new Map<string, CacheEntry<BeritaPost>>();

const LIST_CACHE_TTL = 5 * 60 * 1000;       // 5 menit fresh
const LIST_STALE_TTL = 30 * 60 * 1000;     // 30 menit stale
const DETAIL_CACHE_TTL = 5 * 60 * 1000;
const DETAIL_STALE_TTL = 30 * 60 * 1000;

let inFlightListFetch: Promise<BeritaIndexData | null> | null = null;

async function callAppsScriptDirect(payload: Record<string, any>, timeoutMs = 12000): Promise<any | null> {
  const url = BERITA_CONFIG.scriptUrl;
  if (!url) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        secret: BERITA_CONFIG.apiSecret,
        ...payload
      }),
      redirect: 'follow',
      signal: controller.signal
    });

    if (!res.ok) {
      console.warn(`[berita-api] HTTP status ${res.status} from Apps Script`);
      return null;
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.warn(`[berita-api] Non-JSON response from Apps Script: ${text.substring(0, 100)}`);
      return null;
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn(`[berita-api] Fetch failed:`, err?.message || err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Mengambil daftar berita publik untuk halaman index/kategori
 */
export async function getBeritaIndex(forceRefresh = false): Promise<BeritaIndexData> {
  const now = Date.now();

  // 1. Fresh Cache
  if (!forceRefresh && postsListCache && now - postsListCache.timestamp < LIST_CACHE_TTL) {
    return { ...postsListCache.data, fromCache: true };
  }

  // 2. Reuse fetch in flight
  if (inFlightListFetch) {
    const res = await inFlightListFetch;
    if (res) return { ...res, fromCache: false };
    if (postsListCache) return { ...postsListCache.data, fromCache: true };
  }

  // 3. Stale-While-Revalidate
  if (!forceRefresh && postsListCache && now - postsListCache.timestamp < LIST_STALE_TTL) {
    inFlightListFetch = (async () => {
      const res = await callAppsScriptDirect({ action: 'public_index' });
      if (res && res.success && res.data) {
        const payload: BeritaIndexData = {
          posts: Array.isArray(res.data.posts) ? res.data.posts : [],
          categories: Array.isArray(res.data.categories) ? res.data.categories : []
        };
        postsListCache = { data: payload, timestamp: Date.now() };
        return payload;
      }
      return null;
    })().finally(() => {
      inFlightListFetch = null;
    });

    return { ...postsListCache.data, fromCache: true };
  }

  // 4. Fetch synchronously
  inFlightListFetch = (async () => {
    const res = await callAppsScriptDirect({ action: 'public_index' });
    if (res && res.success && res.data && Array.isArray(res.data.posts)) {
      const payload: BeritaIndexData = {
        posts: res.data.posts,
        categories: Array.isArray(res.data.categories) ? res.data.categories : []
      };
      postsListCache = { data: payload, timestamp: Date.now() };
      return payload;
    }
    return null;
  })().finally(() => {
    inFlightListFetch = null;
  });

  const fresh = await inFlightListFetch;
  if (fresh) {
    return { ...fresh, fromCache: false };
  }

  // 5. Fallback ke stale cache jika ada
  if (postsListCache) {
    return { ...postsListCache.data, fromCache: true };
  }

  // 6. Fallback ke seed data jika Apps Script belum terhubung
  const categoriesWithCounts = DEFAULT_CATEGORIES.map((c) => ({
    ...c,
    count: SEED_POSTS.filter((p) => p.category === c.slug).length
  }));

  return {
    posts: SEED_POSTS,
    categories: categoriesWithCounts,
    isFallback: true
  };
}

/**
 * Mengambil detail berita publik berdasarkan slug
 */
export async function getBeritaBySlug(
  slug: string,
  forceRefresh = false
): Promise<{ post: BeritaPost | null; status: 'FOUND' | 'NOT_FOUND' | 'FALLBACK'; fromCache?: boolean }> {
  const cleanSlug = (slug || '').trim().toLowerCase();
  if (!cleanSlug) return { post: null, status: 'NOT_FOUND' };

  const now = Date.now();
  const cached = postDetailCache.get(cleanSlug);

  if (!forceRefresh && cached && now - cached.timestamp < DETAIL_CACHE_TTL) {
    return { post: cached.data, status: 'FOUND', fromCache: true };
  }

  // Fetch dari Apps Script
  const res = await callAppsScriptDirect({ action: 'public_post', slug: cleanSlug });
  if (res && res.success && res.data) {
    const post = res.data as BeritaPost;
    postDetailCache.set(cleanSlug, { data: post, timestamp: Date.now() });
    return { post, status: 'FOUND', fromCache: false };
  }

  if (cached) {
    return { post: cached.data, status: 'FOUND', fromCache: true };
  }

  // Cek seed fallback
  const fallback = SEED_POSTS.find((p) => p.slug === cleanSlug);
  if (fallback) {
    return { post: fallback, status: 'FALLBACK' };
  }

  return { post: null, status: 'NOT_FOUND' };
}

/**
 * Menghapus cache memory secara manual (dipanggil saat ada posting/update baru)
 */
export function invalidateBeritaCache() {
  postsListCache = null;
  postDetailCache.clear();
}

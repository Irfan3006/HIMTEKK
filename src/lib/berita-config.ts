/**
 * Konfigurasi Berita HIMTEKK
 */

export const BERITA_CONFIG = {
  siteUrl: 'https://himtekk.com',
  siteName: 'HIMTEKK Amikom',
  title: 'Berita & Pengumuman - HIMTEKK Amikom',
  description: 'Portal berita, pengumuman resmi, liputan kegiatan, artikel teknologi, cyber security, dan inovasi Internet of Things (IoT) HIMTEKK Universitas Amikom Yogyakarta.',
  defaultThumbnail: '/assets/img/og.webp',
  authorDefault: 'HIMTEKK Amikom',
  // URL deployment Google Apps Script (bisa diatur lewat env BERITA_SCRIPT_URL)
  scriptUrl:
    import.meta.env.BERITA_SCRIPT_URL ||
    'https://script.google.com/macros/s/AKfycbyjUzNx2ffHFZX3GW_QWctmOe24mxHqVS9s9fzFTL3as0kSaMQ7zW2dqEUqkkrcnCNA2Q/exec',
  // Secret token backend untuk komunikasi aman Vercel Server -> Apps Script
  apiSecret: import.meta.env.BERITA_API_SECRET || 'himtekk-berita-secret',
  itemsPerPage: 9
};

export interface BeritaCategory {
  slug: string;
  name: string;
  description: string;
  icon?: string;
}

export const DEFAULT_CATEGORIES: BeritaCategory[] = [
  {
    slug: 'pengumuman',
    name: 'Pengumuman',
    description: 'Informasi resmi, surat edaran, dan pengumuman keorganisasian HIMTEKK.',
    icon: 'fa-bullhorn'
  },
  {
    slug: 'kegiatan',
    name: 'Kegiatan',
    description: 'Liputan dokumentasi kegiatan, webinar, workshop, dan rapat kerja HIMTEKK.',
    icon: 'fa-calendar-check'
  },
  {
    slug: 'prestasi',
    name: 'Prestasi',
    description: 'Raihan kejuaraan, sertifikasi, dan apresiasi karya mahasiswa Teknik Komputer.',
    icon: 'fa-trophy'
  },
  {
    slug: 'rekrutmen',
    name: 'Rekrutmen',
    description: 'Informasi Open Recruitment (Oprec), seleksi pengurus, dan magang HIMTEKK.',
    icon: 'fa-user-plus'
  },
  {
    slug: 'cyber-security',
    name: 'Cyber Security',
    description: 'Edukasi keamanan siber, writeup CTF, mitigasi kerentanan, dan tips privasi.',
    icon: 'fa-shield-halved'
  },
  {
    slug: 'iot',
    name: 'IoT',
    description: 'Inovasi perangkat cerdas, mikrokontroler, embedded system, dan sensorika.',
    icon: 'fa-microchip'
  },
  {
    slug: 'teknologi',
    name: 'Teknologi',
    description: 'Wawasan perkembangan teknologi hardware, software, dan jaringan komputer.',
    icon: 'fa-laptop-code'
  }
];

export function getCategoryIcon(slug: string): string {
  const found = DEFAULT_CATEGORIES.find((c) => c.slug === slug);
  return found?.icon || 'fa-tag';
}

export function formatDateIndo(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function formatDateTimeIndo(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    }).format(d) + ' WIB';
  } catch {
    return String(dateStr);
  }
}

# Oche & Yoga — Undangan Pernikahan Digital

## Cara menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:5173 di browser.

## Build untuk deploy

```bash
npm run build
```

Hasilnya ada di folder `dist/`, tinggal upload ke Vercel, Netlify, atau hosting statis lainnya.

## Edit isi undangan

Semua data (nama mempelai, tanggal, alamat venue, koordinat lokasi, nomor rekening, foto, video)
ada dalam satu blok `CONFIG` di baris paling atas file:

```
src/WeddingInvitation.jsx
```

Tinggal ganti nilai di dalam `CONFIG`, tidak perlu mengubah bagian lain kodenya.

### Mengganti foto & video

Taruh file asli kamu di folder `public/`:

```
public/
├── photos/     ← semua foto prewedding + foto profil mempelai
└── video/      ← video hero (mp4)
```

File di folder `public/` otomatis bisa diakses lewat path `/nama-folder/nama-file.ext` (tanpa perlu import), jadi:

- Foto `public/photos/prewed-1.jpg` → dipanggil di kode sebagai `/photos/prewed-1.jpg`
- Video `public/video/hero.mp4` → dipanggil di kode sebagai `/video/hero.mp4`

Lalu tinggal ganti value-nya di `src/WeddingInvitation.jsx`:

```js
heroVideo: {
  src: "/video/hero.mp4",
  poster: "/photos/cover.jpg",
},
gallery: [
  "/photos/prewed-1.jpg",
  "/photos/prewed-2.jpg",
  // ...tambah sesuai jumlah foto kamu
],
groom: { ..., photo: "/photos/groom.jpg" },
bride: { ..., photo: "/photos/bride.jpg" },
```

Nama file bebas, yang penting path-nya cocok. Alternatif lain: upload ke Google Drive/Imgur/Cloudinary lalu pakai link publiknya langsung — kalau video/foto ukurannya besar, cara ini malah lebih ringan buat repo/project kamu.

### Lokasi & peta
`CONFIG.venue.lat` dan `CONFIG.venue.lng` dipakai untuk fitur "Petunjuk Arah" (mengambil lokasi
pengguna lalu membuka rute Google Maps). Ambil koordinat venue dari Google Maps: klik kanan pada
titik lokasi → koordinat akan muncul untuk disalin.
# undangan

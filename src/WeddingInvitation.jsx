import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Heart, MapPin, Calendar, Gift, Copy, Check, Volume2, VolumeX,
  ChevronDown, Instagram, Navigation, X, Menu, Play, Pause, Send, Image as ImageIcon, Mail,
  ChevronLeft, ChevronRight, Expand, Bell
} from "lucide-react";
/* ============================================================
   CONFIG — edit everything here. Nothing else needs to change.
   ============================================================ */
const CONFIG = {
  groom: {
    name: "Yoga",
    fullName: "Try Yoga Utomo",
    parents: "Putra Ketiga dari\nBapak Roetomo & Ibu Yogyastuti(Bandung)",
    instagram: "https://instagram.com/",
    photo: "/photos/laki.jpg",
  },
  bride: {
    name: "Oche",
    fullName: "Cathoche Uniqua Supomo",
    parents: "Putri Pertama dari\nBapak Dedy Supomo & Ibu Linda Apriyani (Bandar Lampung)",
    location: "(Bandar Lampung)",
    instagram: "https://instagram.com/",
    photo: "/photos/perempuan.jpg"
  },
  quote: {
    text: "Dan segala sesuatu Kami ciptakan berpasang-pasangan, agar kamu mengingat (kebesaran Allah).",
    source: "Adz-Dzariyat : 49",
  },
  loveNote: "Dengan segala puji bagi Allah yang telah menciptakan makhluk-Nya berpasang-pasangan, Ya Allah izinkanlah kami merangkaikan cinta yang Engkau berikan dalam ikatan pernikahan.",
  akad: {
    label: "Akad Nikah",
    date: "2026-09-05T15:30:00",
    dateDisplay: "Sabtu, 5 september 2026",
    time: "15.30 – 17.30 WIB",
    address: "BUMI SAMAMI\Jl. Terusan Cigadung No.15, Sekeloa, Kecamatan Coblong, Kota Bandung, Jawa Barat 401",
  },
  resepsi: {
    label: "Resepsi",
    date: "2026-09-05T19:00:00",
    dateDisplay: "Sabtu, 5 september 2026",
    time: "19:00 – 21:00 WIB",
    address: "BUMI SAMAMI\Jl. Terusan Cigadung No.15, Sekeloa, Kecamatan Coblong, Kota Bandung, Jawa Barat 401",
  },

  venue: {
    name: "Bumi Samami",
    address: "Jl. Terusan Cigadung No.15, Sekeloa, Kecamatan Coblong, Kota Bandung, Jawa Barat 40132",
    lat: -6.8482,
    lng: 107.6238,
  },

  heroVideo: {
    src: "https://youtu.be/z-Ct1yrE90Q",
    // "poster" HARUS berupa gambar (jpg/png) — dipakai sebagai layar
    // pembuka sebelum video YouTube termuat. Ganti ke foto cover kamu.
    poster: "/photos/satu.png",
    // (opsional) video mp4 yang di-hosting sendiri, dipakai sebagai
    // video latar bergerak di layar amplop sebelum tombol "OPEN THE
    // ENVELOPE" ditekan. Kosongkan jika tidak punya file video ini.
    bgVideoSrc: "/video/videos.mp4",
  },

  gallery: [
    "/photos/satu.png",
    "/photos/empat.png",
    "/photos/dua.png",
    "/photos/tiga.png",
    "/photos/lima.png",
    "/photos/enam.png",
    "/photos/tujuh.png",
    "/photos/delapan.png",
    "/photos/sembilan.png",
    "/photos/sepuluh.png",
    "/photos/sebelas.png",
    "/photos/duabelas.png",
    "/photos/tigabelas.png",
    "/photos/empatbelas.png",
    "/photos/limabelas.png",
    "/photos/enambelas.png",
    // "/photos/tujuhbelas.png",
  ],

  gifts: {
    bank: { bankName: "CIMB Niaga", accountNumber: "707435339300", accountName: "Cathoche Uniqua Supomo" },
    address: {
      label: "Kirim Kado",
      text: "Jl Cihanjuang gg Bagja 3 No. 85 RT/RW 003/011, Kel. Cibabat, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat",
    },
  },
};

/* ============================================================
   YouTube helpers
   ============================================================ */
function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const embedMatch = u.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch) return embedMatch[1];
    const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch) return shortsMatch[1];
  } catch (e) {
    /* fall through */
  }
  return "";
}

const YOUTUBE_ID = getYouTubeId(CONFIG.heroVideo.src);

let ytApiPromise = null;
function loadYouTubeIframeAPI() {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevCallback === "function") prevCallback();
      resolve(window.YT);
    };
    if (!document.getElementById("yt-iframe-api-script")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  });
  return ytApiPromise;
}

/* ============================================================
   Google Calendar helper
   ============================================================ */
// CONFIG.akad.date ditulis sebagai jam lokal WIB (mis. "2026-02-14T08:00:00"),
// TANPA info zona waktu. Supaya link "Ingatkan Acara" tetap benar buat siapa
// pun yang buka undangan (dari HP dengan zona waktu manapun), kita anggap
// string itu selalu jam WIB (UTC+7) dan konversi manual ke UTC — bukan pakai
// `new Date(...)` polos yang bisa salah baca sebagai jam lokal si pengunjung.
function wibStringToUTCDate(localISOString, tzOffsetHours = 7) {
  const m = localISOString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return new Date(localISOString);
  const [, y, mo, d, h, mi, s] = m.map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - tzOffsetHours, mi, s));
}

function formatGCalUTC(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildGoogleCalendarUrl({ title, startISO, durationHours = 2, details = "", location = "" }) {
  const start = wibStringToUTCDate(startISO);
  const end = new Date(start.getTime() + durationHours * 3600 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGCalUTC(start)}/${formatGCalUTC(end)}`,
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ============================================================
   Small helpers
   ============================================================ */
function useCountdown(targetISO) {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const target = new Date(targetISO).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetISO]);
  return left;
}

function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown];
}

function Reveal({ children, className = "", delay = 0 }) {
  const [ref, shown] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.9s ease ${delay}ms, transform 0.9s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* PopReveal — dipakai khusus untuk teks (judul, label, paragraf).
   Beda dengan Reveal biasa (fade + geser halus), PopReveal membesar
   dari kecil ke ukuran normal dengan sedikit "overshoot" (efek pop)
   memakai cubic-bezier pegas, jadi terasa seperti teks "muncul"
   satu-satu saat di-scroll, bukan cuma satu blok besar yang fade. */
function PopReveal({ children, className = "", delay = 0, as = "div", style = {} }) {
  const [ref, shown] = useReveal();
  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0) scale(1)" : "translateY(18px) scale(0.82)",
        transition: `opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms, transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </Tag>
  );
}

/* Menghitung ukuran "cover" (px) sebuah kotak video/iframe terhadap
   ukuran ASLI containernya (bukan vw/vh viewport), supaya tetap pas
   dan tidak "kebesaran"/terpotong aneh di HP — termasuk saat address
   bar browser mobile muncul/hilang dan mengubah tinggi viewport. */
function useCoverDimensions(containerRef, aspect = 16 / 9) {
  const [dims, setDims] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (!cw || !ch) return;
      const containerAspect = cw / ch;
      if (containerAspect > aspect) {
        setDims({ width: cw, height: cw / aspect });
      } else {
        setDims({ width: ch * aspect, height: ch });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("orientationchange", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", update);
    };
  }, [containerRef, aspect]);
  return dims;
}

/* Botanical divider — the signature line-art motif reused across sections */
function Sprig({ color = "#8A9A7E", width = 120 }) {
  return (
    <svg width={width} height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 20 C 30 5, 40 35, 60 20 S 90 5, 118 20" stroke={color} strokeWidth="1" opacity="0.7" />
      <circle cx="60" cy="20" r="2.5" fill={color} opacity="0.8" />
      <path d="M40 14 Q 45 8 50 14" stroke={color} strokeWidth="1" opacity="0.6" />
      <path d="M70 26 Q 75 32 80 26" stroke={color} strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

const palette = {
  cream: "#F6F2E8",
  creamDeep: "#EFE8D8",
  forest: "#25321F",
  forestSoft: "#3E4E33",
  sage: "#8A9A7E",
  gold: "#B08D4F",
  wine: "#5C2333",
  ink: "#2B2820",
};

/* ============================================================
   Main component
   ============================================================ */
export default function WeddingInvitation() {
 const [opened, setOpened] = useState(false);
const [muted, setMuted] = useState(false);
const [playing, setPlaying] = useState(true);
const [floating, setFloating] = useState(false);
const [menuOpen, setMenuOpen] = useState(false);
const [copiedKey, setCopiedKey] = useState("");
const [giftOpen, setGiftOpen] = useState(false);
  const [rsvp, setRsvp] = useState({ name: "", attend: "", message: "" });
  const [rsvpSent, setRsvpSent] = useState(false);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
  const [wishes, setWishes] = useState([]);
  const [wishesLoading, setWishesLoading] = useState(true);

  // Ambil ucapan yang sudah tersimpan di database (Vercel KV) begitu halaman dibuka,
  // supaya semua tamu melihat daftar ucapan yang sama — bukan cuma yang ada di
  // memori browser masing-masing.
  useEffect(() => {
    fetch("/api/rsvp")
      .then((r) => r.json())
      .then((data) => setWishes(Array.isArray(data.wishes) ? data.wishes : []))
      .catch(() => {})
      .finally(() => setWishesLoading(false));
  }, []);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  // Galeri: berapa foto yang ditampilkan awal, dan index foto yang lagi di-preview (lightbox)
  const GALLERY_PREVIEW_COUNT = 4;
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const openLightbox = (i) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const showPrevPhoto = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + CONFIG.gallery.length) % CONFIG.gallery.length));
  }, []);
  const showNextPhoto = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % CONFIG.gallery.length));
  }, []);

  // Navigasi lightbox pakai keyboard (Esc, ←, →)
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrevPhoto();
      if (e.key === "ArrowRight") showNextPhoto();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, showPrevPhoto, showNextPhoto]);

  // Nama tamu diambil dari parameter URL, contoh: ?to=Budi%20%26%20Keluarga
  const [guestName, setGuestName] = useState("");
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const to = params.get("to");
      if (to) setGuestName(decodeURIComponent(to));
    } catch (e) {
      /* ignore, fallback ke default */
    }
  }, []);

  const heroPlayerRef = useRef(null);
  const floatPlayerRef = useRef(null);
  const heroRef = useRef(null);
  const floatBoxRef = useRef(null);
  const bgAudioRef = useRef(null);

  const akadLeft = useCountdown(CONFIG.akad.date);
  const akadCalendarUrl = buildGoogleCalendarUrl({
    title: `Akad Nikah ${CONFIG.groom.name} & ${CONFIG.bride.name}`,
    startISO: CONFIG.akad.date,
    durationHours: 2,
    details: `Akad Nikah ${CONFIG.groom.name} & ${CONFIG.bride.name}`,
    location: CONFIG.venue.address,
  });

  // Ukuran "cover" video YouTube dihitung dari ukuran asli container
  // (bukan vw/vh) supaya tidak kebesaran/terzoom aneh di layar HP.
  const heroDims = useCoverDimensions(heroRef, 16 / 9);
  const floatDims = useCoverDimensions(floatBoxRef, 16 / 9);

  // Scroll → toggle floating mini player once hero is mostly out of view
  useEffect(() => {
    if (!opened) return;
    const onScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setFloating(rect.bottom < 120);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [opened]);

  const openInvitation = () => {
    setOpened(true);

    // Auto-play musik latar begitu amplop dibuka; browser mengizinkan play()
    // karena dipicu langsung dari klik tombol (user gesture).
    if (bgAudioRef.current) {
      bgAudioRef.current.currentTime = 0;
      bgAudioRef.current.volume = 1;
      bgAudioRef.current.play().catch(() => {
        // Jika browser tetap memblokir autoplay suara, coba lagi saat user
        // berinteraksi (scroll/tap) berikutnya.
        const retryPlay = () => {
          bgAudioRef.current?.play().catch(() => {});
          window.removeEventListener("click", retryPlay);
          window.removeEventListener("touchstart", retryPlay);
        };
        window.addEventListener("click", retryPlay, { once: true });
        window.addEventListener("touchstart", retryPlay, { once: true });
      });
    }

    requestAnimationFrame(() => {
      if (!YOUTUBE_ID) return;
      loadYouTubeIframeAPI().then((YT) => {
        if (heroPlayerRef.current || !document.getElementById("yt-hero-player")) return;
        heroPlayerRef.current = new YT.Player("yt-hero-player", {
          width: "100%",
          height: "100%",
          videoId: YOUTUBE_ID,
          playerVars: {
            autoplay: 1,
            mute: 1,
            loop: 1,
            playlist: YOUTUBE_ID,
            controls: 0,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
            iv_load_policy: 3,
            disablekb: 1,
          },
          events: {
            // Video YouTube selalu dibisukan (mute) — hanya musik latar (audio.mp3) yang berbunyi.
            onReady: (e) => {
              try {
                e.target.mute();
                e.target.playVideo();
              } catch (err) {}
            },
          },
        });
      });
    });
  };

  const toggleMute = () => {
    // Tombol ini sekarang hanya mengontrol musik latar (audio.mp3) — video YouTube
    // selalu dibisukan secara permanen dan tidak terpengaruh tombol ini.
    const next = !muted;
    setMuted(next);
    if (bgAudioRef.current) {
      bgAudioRef.current.muted = next;
    }
  };

  const togglePlay = () => {
    const p = floatPlayerRef.current;
    if (!p) return;
    try {
      if (p.getPlayerState() === 1) { p.pauseVideo(); setPlaying(false); }
      else { p.playVideo(); setPlaying(true); }
    } catch (e) {}
  };

  // Create / destroy the floating mini player as it enters and leaves view
  useEffect(() => {
    if (!YOUTUBE_ID) return;
    if (floating) {
      loadYouTubeIframeAPI().then((YT) => {
        if (floatPlayerRef.current || !document.getElementById("yt-float-player")) return;
        floatPlayerRef.current = new YT.Player("yt-float-player", {
          width: "100%",
          height: "100%",
          videoId: YOUTUBE_ID,
          playerVars: {
            autoplay: 1,
            mute: 1,
            loop: 1,
            playlist: YOUTUBE_ID,
            controls: 0,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
            iv_load_policy: 3,
            disablekb: 1,
          },
          events: {
            // Video YouTube selalu dibisukan (mute) — hanya musik latar (audio.mp3) yang berbunyi.
            onReady: (e) => {
              try { e.target.mute(); } catch (err) {}
              e.target.playVideo();
              setPlaying(true);
            },
          },
        });
      });
    } else if (floatPlayerRef.current) {
      try { floatPlayerRef.current.destroy(); } catch (e) {}
      floatPlayerRef.current = null;
    }
  }, [floating]);

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 1800);
    });
  };

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const submitRsvp = async (e) => {
    e.preventDefault();
    if (!rsvp.name || !rsvp.attend) return;
    setRsvpError("");
    setRsvpSubmitting(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rsvp),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal mengirim");
      setWishes((w) => [data.entry, ...w]);
      setRsvp({ name: "", attend: "", message: "" });
      setRsvpSent(true);
      setTimeout(() => setRsvpSent(false), 2500);
    } catch (err) {
      setRsvpError("Gagal mengirim ucapan. Coba lagi ya.");
    } finally {
      setRsvpSubmitting(false);
    }
  };

  const findDirections = () => {
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("Perangkat tidak mendukung layanan lokasi.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${CONFIG.venue.lat},${CONFIG.venue.lng}&travelmode=driving`;
        window.open(url, "_blank");
      },
      () => {
        setLocating(false);
        setLocError("Izin lokasi ditolak. Buka langsung di Google Maps saja ya.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const mapEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
    CONFIG.venue.name + " " + CONFIG.venue.address
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const navItems = [
    { id: "couple", label: "Mempelai" },
    { id: "acara", label: "Acara" },
    { id: "lokasi", label: "Lokasi" },
    { id: "galeri", label: "Galeri" },
    { id: "rsvp", label: "RSVP" },
    { id: "hadiah", label: "Hadiah" },
  ];

  return (
    <div style={{ background: palette.cream, color: palette.ink, fontFamily: "'Jost', sans-serif", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Jost:wght@300;400;500;600&family=Mrs+Saint+Delafield&display=swap');

.font-display { font-family: 'Cormorant Garamond', serif; }
.font-script { font-family: 'Mrs Saint Delafield', cursive; }
        html { scroll-behavior: smooth; }
        .btn-primary {
          background: ${palette.forest}; color: ${palette.cream};
          transition: transform .25s ease, background .25s ease;
        }
        .btn-primary:hover { background: ${palette.forestSoft}; transform: translateY(-2px); }
        .btn-outline {
          border: 1px solid ${palette.gold}; color: ${palette.forest};
          transition: background .25s ease, color .25s ease;
        }
        .btn-outline:hover { background: ${palette.gold}; color: #fff; }
        input, textarea {
          background: rgba(255,255,255,0.6); border: 1px solid rgba(37,50,31,0.2);
          outline: none; font-family: 'Jost', sans-serif;
        }
        input:focus, textarea:focus { border-color: ${palette.gold}; box-shadow: 0 0 0 3px rgba(176,141,79,0.15); }
        .attend-btn { border: 1px solid rgba(37,50,31,0.25); transition: all .2s ease; }
        .attend-btn.active { background: ${palette.forest}; color: #fff; border-color: ${palette.forest}; }

        .gallery-hover-overlay:hover { background: rgba(20,26,16,0.35) !important; }
        .gallery-hover-overlay:hover .gallery-hover-icon { opacity: 1 !important; }
        .gallery-hover-icon { transition: opacity .2s ease; }

        /* Grid galeri prewedding — kolom tetap & rasio foto seragam supaya
           rapi di semua ukuran layar, termasuk HP kecil. */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        @media (min-width: 560px) {
          .gallery-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }
        }
        @media (min-width: 900px) {
          .gallery-grid { grid-template-columns: repeat(4, 1fr); gap: 14px; }
        }
        .gallery-item { aspect-ratio: 3 / 4; }

        /* Countdown Save the Date — 4 kotak menyamping (hari | jam | menit | detik) */
        .countdown-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          max-width: 480px;
          margin: 0 auto;
        }
        .countdown-box {
          background: #fff;
          border: 1px solid ${palette.gold};
          border-radius: 14px;
          padding: 14px 4px 12px;
          box-shadow: 0 6px 18px rgba(37,50,31,0.06);
        }
        @media (min-width: 480px) {
          .countdown-grid { gap: 16px; }
          .countdown-box { border-radius: 16px; padding: 18px 6px 14px; }
        }

        /* Hormati preferensi user yang mematikan animasi di sistemnya */
        @media (prefers-reduced-motion: reduce) {
          * { transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* Musik latar — auto-play saat amplop dibuka, otomatis mengulang saat selesai */}
      <audio ref={bgAudioRef} src="/audio/audio.mp3" loop preload="auto" style={{ display: "none" }} />

      {/* ================= COVER ================= */}
      {!opened && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 60, overflow: "hidden", background: "#141a10" }}
        >
          {/* Video latar layar amplop — pakai object-fit: cover asli
              browser, jadi otomatis pas di HP tanpa hitungan vw/vh manual. */}
          <video
            src={CONFIG.heroVideo.bgVideoSrc || undefined}
            poster={CONFIG.heroVideo.poster}
            autoPlay
            muted
            loop
            playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, rgba(37,50,31,0.35), rgba(20,26,16,0.75))",
            }}
          />

          <div
            className="flex flex-col items-center justify-center text-center px-6"
            style={{ position: "relative", zIndex: 1, height: "100%" }}
          >
            <Sprig color="#E7DFC6" width={90} />
            <p style={{ color: "#E7DFC6", fontSize: "clamp(11px,3vw,14px)", marginTop: 6, letterSpacing: "0.08em" }}>
              {CONFIG.akad.dateDisplay}
            </p>

            {/* ================= ENVELOPE ================= */}
            <div style={{ width: "100%", maxWidth: 320, margin: "0 auto" }}>
              <div
                style={{
                  position: "relative",
                  background: "#f4f1e8",
                  borderRadius: 4,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
                  padding: "24px 20px 20px",
                  overflow: "hidden",
                }}
              >
                {/* flap segitiga atas */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: 0,
                    borderLeft: "160px solid transparent",
                    borderRight: "160px solid transparent",
                    borderTop: "78px solid rgba(0,0,0,0.05)",
                  }}
                />
                {/* garis diagonal flap */}
                <svg
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 78 }}
                  viewBox="0 0 320 78"
                  preserveAspectRatio="none"
                >
                  <line x1="0" y1="0" x2="160" y2="72" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                  <line x1="320" y1="0" x2="160" y2="72" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                </svg>

                <div style={{ position: "relative", marginTop: 8 }}>
                  <p className="font-display" style={{ fontSize: "clamp(11px,3vw,13px)", color: palette.forest, letterSpacing: "0.05em" }}>
                    The Wedding of
                  </p>

                  <h3 className="font-script" style={{ fontSize: "clamp(26px,8vw,34px)", color: palette.gold, margin: "3px 0 12px" }}>
                    {CONFIG.groom.name} &amp; {CONFIG.bride.name}
                  </h3>

                  {/* wax seal */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      margin: "0 auto 12px",
                      borderRadius: "50%",
                      background: "radial-gradient(circle at 35% 30%, #b5443a, #7a1f1f)",
                      boxShadow: "0 3px 8px rgba(0,0,0,0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Heart size={14} color="rgba(255,255,255,0.85)" fill="rgba(255,255,255,0.5)" />
                  </div>

                  <p style={{ fontSize: "clamp(10px,2.8vw,12px)", color: "rgba(43,40,32,0.7)", marginBottom: 2 }}>
                    Yth. Bapak/Ibu/Saudara/i
                  </p>
                  <p className="font-display" style={{ fontSize: "clamp(15px,4.5vw,18px)", color: palette.forest }}>
                    {guestName || "Tamu Undangan"}
                  </p>
                </div>
              </div>

              <button
                onClick={openInvitation}
                type="button"
                className="btn-primary flex items-center justify-center gap-2"
                style={{
                  marginTop: 16,
                  padding: "11px 0",
                  borderRadius: 999,
                  fontSize: "clamp(11px,2.8vw,13px)",
                  letterSpacing: "0.15em",
                  background: palette.gold,
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <Mail size={13} /> OPEN THE ENVELOPE
              </button>
            </div>
          </div>
        </div>
      )}

      {opened && (
        <>
          {/* Top nav */}
          <div style={{ position: "fixed", top: 18, right: 18, zIndex: 50 }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{ background: "rgba(246,242,232,0.9)", border: `1px solid ${palette.gold}`, borderRadius: 999, width: 46, height: 46 }}
              className="flex items-center justify-center"
              aria-label="Menu"
            >
              {menuOpen ? <X size={18} color={palette.forest} /> : <Menu size={18} color={palette.forest} />}
            </button>
            {menuOpen && (
              <div style={{ marginTop: 10, background: palette.cream, border: `1px solid ${palette.gold}`, borderRadius: 14, padding: 10, minWidth: 160, boxShadow: "0 12px 30px rgba(0,0,0,0.15)" }}>
                {navItems.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => scrollTo(n.id)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 10px", fontSize: 13, color: palette.forest, borderRadius: 8 }}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Floating mini video player */}
          {floating && (
            <div style={{ position: "fixed", bottom: 18, right: 18, zIndex: 50, width: 150, borderRadius: 14, overflow: "hidden", boxShadow: "0 14px 34px rgba(0,0,0,0.35)", border: `2px solid ${palette.cream}` }}>
              <div ref={floatBoxRef} style={{ position: "relative", aspectRatio: "9/16", background: "#000", overflow: "hidden" }}>
                <div
                  style={{
                    position: "absolute", top: "50%", left: "50%",
                    width: floatDims.width ? `${floatDims.width}px` : "100%",
                    height: floatDims.height ? `${floatDims.height}px` : "100%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                  }}
                >
                  <div id="yt-float-player" style={{ width: "100%", height: "100%" }} />
                </div>
                <div style={{ position: "absolute", bottom: 6, left: 6, right: 6, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button onClick={toggleMute} style={{ background: "rgba(0,0,0,0.45)", borderRadius: 999, width: 26, height: 26 }} className="flex items-center justify-center">
                    {muted ? <VolumeX size={13} color="#fff" /> : <Volume2 size={13} color="#fff" />}
                  </button>
                  <button onClick={togglePlay} style={{ background: "rgba(0,0,0,0.45)", borderRadius: 999, width: 26, height: 26 }} className="flex items-center justify-center">
                    {playing ? <Pause size={13} color="#fff" /> : <Play size={13} color="#fff" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= HERO VIDEO ================= */}
          <section ref={heroRef} style={{ position: "relative", height: "100svh", overflow: "hidden", background: "#141a10" }}>
            <div
              style={{
                position: "absolute", inset: 0,
                backgroundImage: `url(${CONFIG.heroVideo.poster})`,
                backgroundSize: "cover", backgroundPosition: "center",
              }}
            />
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
              <div
                style={{
                  position: "absolute", top: "50%", left: "50%",
                  width: heroDims.width ? `${heroDims.width}px` : "100%",
                  height: heroDims.height ? `${heroDims.height}px` : "100%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div id="yt-hero-player" style={{ width: "100%", height: "100%" }} />
              </div>
            </div>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,26,16,0.15), rgba(20,26,16,0.55) 85%)" }} />
            <div style={{ position: "absolute", inset: 0 }} className="flex flex-col items-center justify-end text-center pb-14 px-6">
              <p className="font-display italic" style={{ color: palette.cream, fontSize: 13, letterSpacing: "0.25em" }}>THE WEDDING OF</p>
              <h1 className="font-script" style={{ color: "#fff", fontSize: "clamp(52px,13vw,92px)", margin: "8px 0" }}>
                {CONFIG.groom.name} &amp; {CONFIG.bride.name}
              </h1>
              <button onClick={toggleMute} className="flex items-center gap-2" style={{ marginTop: 10, color: "#E7DFC6", fontSize: 12, letterSpacing: "0.1em", pointerEvents: "auto" }}>
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />} {muted ? "Suara mati — tap untuk aktifkan" : "Suara aktif"}
              </button>
              <ChevronDown className="animate-bounce" style={{ marginTop: 22 }} color="#E7DFC6" size={22} />
            </div>
          </section>

          {/* ================= QUOTE ================= */}
          <section style={{ padding: "88px 24px", textAlign: "center", background: palette.creamDeep }}>
            <Reveal>
              <Sprig color={palette.sage} />
            </Reveal>
            <PopReveal as="p" delay={100} className="font-display italic" >
              <span style={{ fontSize: "clamp(20px,4vw,28px)", maxWidth: 640, margin: "20px auto 0", lineHeight: 1.5, color: palette.forest, display: "inline-block" }}>
                &ldquo;{CONFIG.quote.text}&rdquo;
              </span>
            </PopReveal>
            <PopReveal as="p" delay={280}>
              <span style={{ marginTop: 14, fontSize: 12, letterSpacing: "0.15em", color: palette.gold, display: "inline-block" }}>{CONFIG.quote.source}</span>
            </PopReveal>
          </section>

          {/* ================= COUPLE ================= */}
          <section id="couple" style={{ padding: "90px 24px", background: palette.forest, color: palette.cream }}>
            <div className="text-center">
              <PopReveal as="p" className="font-display italic" delay={0} style={{ color: palette.gold, fontSize: 14, letterSpacing: "0.2em" }}>
                BRIDE &amp; GROOM
              </PopReveal>
              <PopReveal as="p" delay={160}>
                <span style={{ maxWidth: 560, margin: "18px auto 0", fontSize: 14, lineHeight: 1.9, color: "rgba(246,242,232,0.8)", display: "inline-block" }}>{CONFIG.loveNote}</span>
              </PopReveal>
            </div>

            <div className="grid gap-10" style={{ maxWidth: 780, margin: "60px auto 0", gridTemplateColumns: "1fr" }}>
              {[CONFIG.bride, CONFIG.groom].map((p, i) => (
                <div key={p.name} className="flex flex-col items-center text-center">
                  <Reveal delay={i * 150}>
                    <div style={{ width: 168, height: 210, borderRadius: "50% 50% 4px 4px / 60% 60% 4px 4px", overflow: "hidden", border: `2px solid ${palette.gold}` }}>
                      <img src={p.photo} alt={p.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  </Reveal>
                  <PopReveal as="h3" className="font-display" delay={i * 150 + 120} style={{ fontSize: 32, marginTop: 18 }}>
                    {p.name}
                  </PopReveal>
                  <PopReveal as="p" delay={i * 150 + 220} style={{ fontSize: 14, marginTop: 4, color: "rgba(246,242,232,0.85)" }}>
                    {p.fullName}
                  </PopReveal>
                  <PopReveal as="p" delay={i * 150 + 320} style={{ fontSize: 12.5, marginTop: 10, color: "rgba(246,242,232,0.6)", whiteSpace: "pre-line", lineHeight: 1.7 }}>
                    {p.parents}
                  </PopReveal>
                  <PopReveal delay={i * 150 + 420} style={{ marginTop: 12 }}>
                    <a href={p.instagram} target="_blank" rel="noreferrer" className="flex items-center justify-center">
                      <span style={{ width: 34, height: 34, borderRadius: 999, border: `1px solid ${palette.gold}` }} className="flex items-center justify-center">
                        <Instagram size={15} color={palette.gold} />
                      </span>
                    </a>
                  </PopReveal>
                </div>
              ))}
            </div>
          </section>

          {/* ================= SAVE THE DATE / COUNTDOWN ================= */}
          <section id="acara" style={{ padding: "90px 24px", textAlign: "center" }}>
            <PopReveal as="p" className="font-script" delay={0} style={{ fontSize: "clamp(36px,8vw,52px)", color: palette.gold }}>
              Save the Date
            </PopReveal>
            <PopReveal as="h2" className="font-display" delay={140} style={{ fontSize: "clamp(30px,6vw,44px)", marginTop: 8, color: palette.forest }}>
              {CONFIG.akad.dateDisplay}
            </PopReveal>

            {/* Kotak hitung mundur — hari | jam | menit | detik, menyamping.
                Dihitung otomatis di browser tiap detik dari jam perangkat
                pengunjung (bukan jam server), jadi tetap akurat walau
                di-deploy gratis statis ke Vercel. */}
            <div style={{ marginTop: 44 }}>
              <div className="countdown-grid">
                {[
                  { value: akadLeft.d, label: "Hari" },
                  { value: akadLeft.h, label: "Jam" },
                  { value: akadLeft.m, label: "Menit" },
                  { value: akadLeft.s, label: "Detik" },
                ].map((item, i) => (
                  <PopReveal key={item.label} delay={i * 90}>
                    <div className="countdown-box">
                      <div className="font-display" style={{ fontSize: "clamp(24px,7vw,36px)", color: palette.forest, lineHeight: 1 }}>
                        {String(item.value).padStart(2, "0")}
                      </div>
                      <div style={{ fontSize: "clamp(9px,2.4vw,11px)", letterSpacing: "0.1em", color: palette.gold, marginTop: 6 }}>
                        {item.label.toUpperCase()}
                      </div>
                    </div>
                  </PopReveal>
                ))}
              </div>

              <PopReveal delay={420} style={{ marginTop: 26 }}>
                <a
                  href={akadCalendarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline flex items-center justify-center gap-2"
                  style={{
                    display: "inline-flex",
                    padding: "12px 28px",
                    borderRadius: 999,
                    fontSize: 12.5,
                    letterSpacing: "0.08em",
                    background: "transparent",
                  }}
                >
                  <Bell size={14} /> INGATKAN ACARA
                </a>
              </PopReveal>
            </div>

            <div className="grid gap-6" style={{ maxWidth: 720, margin: "60px auto 0", gridTemplateColumns: "1fr" }}>
              {[CONFIG.akad, CONFIG.resepsi].map((ev, i) => (
                <Reveal key={ev.label} delay={i * 120}>
                  <button
                    type="button"
                    onClick={() => scrollTo("lokasi")}
                    style={{
                      border: `1px solid ${palette.gold}`, borderRadius: 18, padding: "28px 24px",
                      background: "#fff", width: "100%", textAlign: "center", cursor: "pointer",
                    }}
                  >
                    <Calendar size={20} color={palette.gold} />
                    <PopReveal as="h3" className="font-script" delay={i * 120 + 100} style={{ fontSize: 40, marginTop: 10, color: palette.forest }}>
                      {ev.label}
                    </PopReveal>
                    <PopReveal as="p" delay={i * 120 + 200} style={{ fontSize: 13.5, marginTop: 6, color: palette.ink }}>
                      {ev.dateDisplay}
                    </PopReveal>
                    <PopReveal as="p" delay={i * 120 + 300} style={{ fontSize: 13.5, color: "rgba(43,40,32,0.65)" }}>
                      {ev.time}
                    </PopReveal>
                    <PopReveal as="p" delay={i * 120 + 400} style={{ fontSize: 11.5, marginTop: 10, color: palette.gold, letterSpacing: "0.08em" }}>
                      LIHAT LOKASI
                    </PopReveal>
                  </button>
                </Reveal>
              ))}
            </div>
          </section>
          

          {/* ================= LOCATION / MAP ================= */}
          <section id="lokasi" style={{ padding: "90px 24px", background: palette.creamDeep }}>
            <div className="text-center">
              <PopReveal as="p" className="font-display italic" delay={0} style={{ fontSize: 14, letterSpacing: "0.2em", color: palette.gold }}>
                LOKASI ACARA
              </PopReveal>
              <PopReveal as="h2" className="font-display" delay={140} style={{ fontSize: "clamp(28px,6vw,40px)", marginTop: 8, color: palette.forest }}>
                {CONFIG.venue.name}
              </PopReveal>
              <PopReveal as="p" delay={280}>
                <span style={{ maxWidth: 520, margin: "10px auto 0", fontSize: 13.5, color: "rgba(43,40,32,0.7)", lineHeight: 1.7, display: "inline-block" }}>{CONFIG.venue.address}</span>
              </PopReveal>
            </div>

            <Reveal>
              <div style={{ maxWidth: 780, margin: "36px auto 0", borderRadius: 18, overflow: "hidden", border: `1px solid ${palette.gold}`, height: 320 }}>
                <iframe
                  title="Peta Lokasi"
                  src={mapEmbedSrc}
                  style={{ width: "100%", height: "100%", border: 0 }}
                  loading="lazy"
                />
              </div>

              <div className="flex flex-col items-center" style={{ marginTop: 22, gap: 10 }}>
                <button onClick={findDirections} className="btn-primary flex items-center gap-2" style={{ padding: "13px 26px", borderRadius: 999, fontSize: 13, letterSpacing: "0.05em" }}>
                  <Navigation size={15} /> {locating ? "Mencari lokasimu..." : "Petunjuk Arah dari Lokasiku"}
                </button>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${CONFIG.venue.lat},${CONFIG.venue.lng}`}
                  target="_blank" rel="noreferrer"
                  className="btn-outline"
                  style={{ padding: "12px 26px", borderRadius: 999, fontSize: 13 }}
                >
                  Buka di Google Maps
                </a>
                {locError && <p style={{ fontSize: 12, color: palette.wine, maxWidth: 320, textAlign: "center" }}>{locError}</p>}
                <p style={{ fontSize: 11, color: "rgba(43,40,32,0.5)", maxWidth: 340, textAlign: "center" }}>
                  Browser akan meminta izin akses lokasi untuk menunjukkan rute dari tempatmu ke lokasi acara.
                </p>
              </div>
            </Reveal>
          </section>

          {/* ================= GALLERY ================= */}
          <section id="galeri" style={{ padding: "90px 24px" }}>
            <div className="text-center">
              <PopReveal as="p" className="font-script" delay={0} style={{ fontSize: 46, color: palette.gold }}>
                a Potrait of
              </PopReveal>
              <PopReveal as="h2" className="font-display" delay={140} style={{ fontSize: "clamp(20px,6vw,25px)", marginTop: 3, color: palette.forest }}>
                “I was created in time to fill your time, and I use all the time in my live to love you.”
              </PopReveal>
              <PopReveal as="h6" className="font-display" delay={280} style={{ fontSize: "clamp(10px,6vw,15px)", marginTop: 3, color: palette.forest }}>
                “Photo & Video by Oche & Yoga.”
              </PopReveal>
            </div>

            <div className="gallery-grid" style={{ maxWidth: 900, margin: "40px auto 0" }}>
              {(galleryExpanded ? CONFIG.gallery : CONFIG.gallery.slice(0, GALLERY_PREVIEW_COUNT)).map((src, i) => (
                <Reveal key={i} delay={(i % 4) * 100}>
                  <button
                    type="button"
                    onClick={() => openLightbox(i)}
                    className="gallery-item"
                    style={{
                      position: "relative", display: "block", width: "100%", padding: 0, border: 0,
                      borderRadius: 10, overflow: "hidden",
                      cursor: "pointer", background: "none",
                    }}
                    aria-label={`Lihat foto ${i + 1}`}
                  >
                    <img src={src} alt={`Prewedding ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <span
                      style={{
                        position: "absolute", inset: 0, background: "rgba(20,26,16,0)",
                        transition: "background .2s ease",
                      }}
                      className="gallery-hover-overlay"
                    >
                      <Expand size={18} color="#fff" style={{ position: "absolute", top: 10, right: 10, opacity: 0 }} className="gallery-hover-icon" />
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>

            {!galleryExpanded && CONFIG.gallery.length > GALLERY_PREVIEW_COUNT && (
              <Reveal className="text-center">
                <button
                  type="button"
                  onClick={() => setGalleryExpanded(true)}
                  className="btn-outline"
                  style={{ marginTop: 30, padding: "12px 30px", borderRadius: 999, fontSize: 13, letterSpacing: "0.08em", background: "transparent" }}
                >
                  Lihat Selengkapnya ({CONFIG.gallery.length - GALLERY_PREVIEW_COUNT}+ foto)
                </button>
              </Reveal>
            )}

            {galleryExpanded && CONFIG.gallery.length > GALLERY_PREVIEW_COUNT && (
              <Reveal className="text-center">
                <button
                  type="button"
                  onClick={() => setGalleryExpanded(false)}
                  className="btn-outline"
                  style={{ marginTop: 30, padding: "12px 30px", borderRadius: 999, fontSize: 13, letterSpacing: "0.08em", background: "transparent" }}
                >
                  Tampilkan Lebih Sedikit
                </button>
              </Reveal>
            )}
          </section>

          {/* ================= LIGHTBOX PREVIEW ================= */}
          {lightboxIndex !== null && (
            <div
              onClick={closeLightbox}
              style={{
                position: "fixed", inset: 0, zIndex: 70,
                background: "rgba(10,13,8,0.92)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 20,
              }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                aria-label="Tutup"
                style={{
                  position: "absolute", top: 18, right: 18, width: 42, height: 42, borderRadius: 999,
                  background: "rgba(255,255,255,0.12)", border: "none",
                }}
                className="flex items-center justify-center"
              >
                <X size={18} color="#fff" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); showPrevPhoto(); }}
                aria-label="Foto sebelumnya"
                style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  width: 42, height: 42, borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "none",
                }}
                className="flex items-center justify-center"
              >
                <ChevronLeft size={20} color="#fff" />
              </button>

              <img
                src={CONFIG.gallery[lightboxIndex]}
                alt={`Prewedding ${lightboxIndex + 1}`}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "min(92vw, 900px)", maxHeight: "85vh", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", objectFit: "contain" }}
              />

              <button
                onClick={(e) => { e.stopPropagation(); showNextPhoto(); }}
                aria-label="Foto berikutnya"
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  width: 42, height: 42, borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "none",
                }}
                className="flex items-center justify-center"
              >
                <ChevronRight size={20} color="#fff" />
              </button>

              <p style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.7)", fontSize: 12, letterSpacing: "0.08em" }}>
                {lightboxIndex + 1} / {CONFIG.gallery.length}
              </p>
            </div>
          )}

          {/* ================= RSVP ================= */}
          <section id="rsvp" style={{ padding: "90px 24px", background: palette.forest, color: palette.cream }}>
            <div className="text-center">
              <PopReveal as="p" className="font-script" delay={0} style={{ fontSize: 54, color: palette.gold, marginTop: 10 }}>
                Rsvp & Wishes
              </PopReveal>
              <PopReveal as="h2" className="font-display" delay={140} style={{ fontSize: "clamp(20px,6vw,20px)", marginTop: 8 }}>
                Kami ingin menunggu kehadiranmu!
              </PopReveal>
              <PopReveal as="h2" className="font-display" delay={220} style={{ fontSize: "clamp(20px,6vw,20px)", marginTop: 8 }}>
                Silahkan isi formulir konfirmasi di bawah ini:
              </PopReveal>
            </div>

            <Reveal>
              <form onSubmit={submitRsvp} style={{ maxWidth: 480, margin: "40px auto 0" }} className="flex flex-col gap-4">
                <div>
                  <label style={{ fontSize: 12, letterSpacing: "0.08em", color: "rgba(246,242,232,0.75)" }}>NAMA</label>
                  <input
                    value={rsvp.name}
                    onChange={(e) => setRsvp((r) => ({ ...r, name: e.target.value }))}
                    placeholder="Tulis namamu"
                    style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 10, color: palette.ink }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, letterSpacing: "0.08em", color: "rgba(246,242,232,0.75)" }}>KONFIRMASI KEHADIRAN</label>
                  <div className="flex gap-3" style={{ marginTop: 6 }}>
                    {["Hadir", "Tidak Hadir"].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setRsvp((r) => ({ ...r, attend: opt }))}
                        className={`attend-btn ${rsvp.attend === opt ? "active" : ""}`}
                        style={{ flex: 1, padding: "11px 0", borderRadius: 10, fontSize: 13, background: rsvp.attend === opt ? undefined : "rgba(255,255,255,0.08)", color: rsvp.attend === opt ? "#fff" : palette.cream }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, letterSpacing: "0.08em", color: "rgba(246,242,232,0.75)" }}>DOA &amp; UCAPAN</label>
                  <textarea
                    value={rsvp.message}
                    onChange={(e) => setRsvp((r) => ({ ...r, message: e.target.value }))}
                    rows={3}
                    placeholder="Tulis doa & ucapan untuk kedua mempelai"
                    style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 10, color: palette.ink, resize: "none" }}
                  />
                </div>
                {rsvpError && <p style={{ fontSize: 12, color: "#E8A0A0" }}>{rsvpError}</p>}
                <button
                  type="submit"
                  disabled={rsvpSubmitting}
                  className="btn-primary flex items-center justify-center gap-2"
                  style={{ background: palette.gold, padding: "13px 0", borderRadius: 10, fontSize: 13, letterSpacing: "0.08em", opacity: rsvpSubmitting ? 0.7 : 1, cursor: rsvpSubmitting ? "default" : "pointer" }}
                >
                  <Send size={14} /> {rsvpSubmitting ? "Mengirim..." : rsvpSent ? "Terkirim!" : "Kirim Konfirmasi"}
                </button>
              </form>
            </Reveal>

            <div style={{ maxWidth: 480, margin: "50px auto 0" }} className="flex flex-col gap-4">
              {wishesLoading && (
                <p style={{ fontSize: 12.5, textAlign: "center", color: "rgba(246,242,232,0.55)" }}>Memuat ucapan...</p>
              )}
              {!wishesLoading && wishes.length === 0 && (
                <p style={{ fontSize: 12.5, textAlign: "center", color: "rgba(246,242,232,0.55)" }}>Jadilah yang pertama memberi ucapan &amp; doa!</p>
              )}
              {wishes.map((w, i) => (
                <Reveal key={w.createdAt || i} delay={Math.min(i, 5) * 80}>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{w.name}</span>
                      <span style={{ fontSize: 10.5, letterSpacing: "0.08em", color: w.attend === "Hadir" ? "#B8D4A8" : "rgba(246,242,232,0.5)" }}>
                        {w.attend.toUpperCase()}
                      </span>
                    </div>
                    {w.message && <p style={{ fontSize: 13, marginTop: 6, color: "rgba(246,242,232,0.8)", lineHeight: 1.6 }}>{w.message}</p>}
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

         {/* ================= WEDDING GIFT ================= */}
          <section id="hadiah" style={{ padding: "90px 24px", textAlign: "center" }}>
            <Reveal>
              <Gift size={26} color={palette.gold} style={{ margin: "0 auto" }} />
            </Reveal>
            <PopReveal as="p" className="font-script" delay={100} style={{ fontSize: 54, color: palette.gold, marginTop: 10 }}>
              Wedding Gift
            </PopReveal>
            <PopReveal as="p" delay={220}>
              <span style={{ maxWidth: 480, margin: "12px auto 0", fontSize: 13.5, color: "rgba(43,40,32,0.7)", lineHeight: 1.7, display: "inline-block" }}>
                Doa Restu Anda merupakan karunia yang sangat berarti bagi kami. Namun jika memberi adalah ungkapan tanda kasih Anda, kami akan senang hati menerimanya yang tentu akan semakin melengkapi kebahagiaan kami.
              </span>
            </PopReveal>

            {/* Tombol amplop — klik untuk buka popup no. rekening */}
            <Reveal delay={200}>
              <button
                type="button"
                onClick={() => setGiftOpen(true)}
                style={{
                  marginTop: 36,
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 220,
                    height: 140,
                    background: "#f4f1e8",
                    borderRadius: 6,
                    boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute", top: 0, left: 0, width: "100%", height: 0,
                      borderLeft: "110px solid transparent",
                      borderRight: "110px solid transparent",
                      borderTop: "70px solid rgba(0,0,0,0.06)",
                    }}
                  />
                  <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 70 }} viewBox="0 0 220 70" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="110" y2="65" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                    <line x1="220" y1="0" x2="110" y2="65" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                  </svg>
                  <div
                    style={{
                      position: "absolute", top: "58%", left: "50%", transform: "translate(-50%,-50%)",
                      width: 40, height: 40, borderRadius: "50%",
                      background: "radial-gradient(circle at 35% 30%, #b5443a, #7a1f1f)",
                      boxShadow: "0 3px 8px rgba(0,0,0,0.35)",
                    }}
                    className="flex items-center justify-center"
                  >
                    <Heart size={16} color="rgba(255,255,255,0.85)" fill="rgba(255,255,255,0.5)" />
                  </div>
                </div>
                <span className="btn-outline" style={{ padding: "10px 24px", borderRadius: 999, fontSize: 12.5, letterSpacing: "0.1em" }}>
                  BUKA AMPLOP DIGITAL
                </span>
              </button>
            </Reveal>
          </section>

          {/* ================= GIFT MODAL POPUP ================= */}
          {giftOpen && (
            
            <div
              onClick={() => setGiftOpen(false)}
              style={{
                position: "fixed", inset: 0, zIndex: 80,
                background: "rgba(10,13,8,0.7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 20,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: palette.cream,
                  borderRadius: 18,
                  padding: "36px 26px",
                  maxWidth: 440,
                  width: "100%",
                  maxHeight: "85vh",
                  overflowY: "auto",
                  position: "relative",
                  boxShadow: "0 30px 70px rgba(0,0,0,0.4)",
                }}
              >
                <button
                  onClick={() => setGiftOpen(false)}
                  aria-label="Tutup"
                  style={{
                    position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: 999,
                    background: "rgba(37,50,31,0.08)", border: "none",
                  }}
                  className="flex items-center justify-center"
                >
                  <X size={16} color={palette.forest} />
                </button>

                <div className="text-center" style={{ marginBottom: 24 }}>
                  <Gift size={22} color={palette.gold} style={{ margin: "0 auto" }} />
                  <p className="font-script" style={{ fontSize: 32, color: palette.gold, marginTop: 8 }}>Wedding Gift</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div style={{ border: `1px solid ${palette.gold}`, borderRadius: 14, padding: "18px 20px", textAlign: "left" }} className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: 11, letterSpacing: "0.1em", color: "rgba(43,40,32,0.5)" }}>{CONFIG.gifts.bank.bankName}</p>
                      <p style={{ fontSize: 16, marginTop: 3, fontWeight: 500 }}>{CONFIG.gifts.bank.accountNumber}</p>
                      <p style={{ fontSize: 12.5, color: "rgba(43,40,32,0.6)" }}>{CONFIG.gifts.bank.accountName}</p>
                    </div>
                    <button
                      onClick={() => copy(CONFIG.gifts.bank.accountNumber, "bank")}
                      className="btn-outline flex items-center gap-1"
                      style={{ padding: "8px 14px", borderRadius: 999, fontSize: 12, flexShrink: 0 }}
                    >
                      {copiedKey === "bank" ? <Check size={13} /> : <Copy size={13} />} {copiedKey === "bank" ? "Tersalin" : "Salin"}
                    </button>
                  </div>

                  <div style={{ border: `1px solid ${palette.gold}`, borderRadius: 14, padding: "18px 20px", textAlign: "left" }} className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: 11, letterSpacing: "0.1em", color: "rgba(43,40,32,0.5)" }}>{CONFIG.gifts.address.label.toUpperCase()}</p>
                      <p style={{ fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>{CONFIG.gifts.address.text}</p>
                    </div>
                    <button
                      onClick={() => copy(CONFIG.gifts.address.text, "addr")}
                      className="btn-outline flex items-center gap-1"
                      style={{ padding: "8px 14px", borderRadius: 999, fontSize: 12, flexShrink: 0, marginLeft: 12 }}
                    >
                      {copiedKey === "addr" ? <Check size={13} /> : <Copy size={13} />} {copiedKey === "addr" ? "Tersalin" : "Salin"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ================= FOOTER ================= */}
          <footer style={{ padding: "70px 24px", textAlign: "center", background: palette.forest, color: "rgba(246,242,232,0.7)" }}>
            <Reveal>
              <Sprig color={palette.gold} />
            </Reveal>
            <PopReveal as="h3" className="font-script" delay={100} style={{ fontSize: 42, color: "#fff", marginTop: 14 }}>
              {CONFIG.groom.name} &amp; {CONFIG.bride.name}
            </PopReveal>
            <PopReveal as="p" delay={220}>
              <span style={{ fontSize: 12.5, marginTop: 10, maxWidth: 380, margin: "10px auto 0", lineHeight: 1.8, display: "inline-block" }}>
                Merupakan suatu kehormatan dan kebahagiaan bagi kami, apabila Bapak/Ibu/Saudara/i berkenan hadir di hari bahagia kami.
              </span>
            </PopReveal>
            <p style={{ fontSize: 10.5, marginTop: 30, letterSpacing: "0.1em", opacity: 0.5 }}>MADE WITH LOVE — {new Date().getFullYear()}</p>
          </footer>
        </>
      )}
    </div>
  );
}
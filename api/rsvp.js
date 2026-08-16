import { Redis } from "@upstash/redis";

const kv = Redis.fromEnv();
const WISHES_KEY = "wedding:wishes";
const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 500;

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const raw = await kv.lrange(WISHES_KEY, 0, 199); // maksimal 200 ucapan terbaru
      const wishes = raw.map((item) => (typeof item === "string" ? JSON.parse(item) : item));
      return res.status(200).json({ wishes });
    } catch (err) {
      console.error("GET /api/rsvp error:", err);
      return res.status(500).json({ error: "Gagal mengambil data ucapan." });
    }
  }

  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const name = String(body.name || "").trim();
      const attend = body.attend === "Hadir" ? "Hadir" : body.attend === "Tidak Hadir" ? "Tidak Hadir" : "";
      const message = String(body.message || "").trim();

      if (!name || !attend) {
        return res.status(400).json({ error: "Nama dan konfirmasi kehadiran wajib diisi." });
      }

      const entry = {
        name: name.slice(0, MAX_NAME_LENGTH),
        attend,
        message: message.slice(0, MAX_MESSAGE_LENGTH),
        createdAt: Date.now(),
      };

      // Simpan paling baru di posisi paling depan list
      await kv.lpush(WISHES_KEY, JSON.stringify(entry));

      return res.status(200).json({ ok: true, entry });
    } catch (err) {
      console.error("POST /api/rsvp error:", err);
      return res.status(500).json({ error: "Gagal menyimpan ucapan." });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.io",
    "*.trycloudflare.com",
    "*.lhr.life",
    "localhost",
    "127.0.0.1",
    // Akses dari HP/laptop lain di jaringan lokal (mis. http://192.168.1.6:3000) — hanya berlaku saat `next dev`
    "192.168.*.*",
    "10.*.*.*",
  ],
};

export default config;

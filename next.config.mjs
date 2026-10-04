const isProd = process.env.NODE_ENV === "production";
const isVercelPreview = process.env.VERCEL_ENV === "preview";

// Exact Supabase origin (browser auth calls) — falls back to the wildcard so a
// build without env vars still produces a working policy.
function supabaseOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "https://*.supabase.co";
  }
}

// Cloudflare Turnstile is only allowed when it is actually configured.
const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

/**
 * Content-Security-Policy.
 *
 * Notes on required allowances (strictest policy that keeps the app working):
 *  - script-src 'unsafe-inline': Next.js App Router injects inline bootstrap
 *    scripts; nonce-based CSP would force dynamic rendering everywhere.
 *  - checkout.razorpay.com / api.razorpay.com: Razorpay Checkout script, its
 *    iframe, and its API/telemetry calls.
 *  - style-src 'unsafe-inline': Tailwind/Framer Motion inline style attributes.
 *  - img-src data: blob: https:: QR codes are data: URLs; event cover images
 *    are organizer-supplied https URLs.
 *  - worker-src blob:: html5-qrcode decodes camera frames in a blob worker.
 *  - vercel.live is allowed on PREVIEW deployments only (Vercel toolbar).
 *  - COEP is intentionally NOT set: Razorpay's script/iframe do not send CORP
 *    headers, so require-corp would break checkout.
 */
function contentSecurityPolicy() {
  const script = [
    "'self'",
    "'unsafe-inline'",
    "https://checkout.razorpay.com",
    ...(turnstileEnabled ? ["https://challenges.cloudflare.com"] : []),
    ...(isVercelPreview ? ["https://vercel.live"] : []),
    ...(!isProd ? ["'unsafe-eval'"] : []), // React refresh in dev only
  ];
  const connect = [
    "'self'",
    supabaseOrigin(),
    "https://api.razorpay.com",
    "https://lumberjack.razorpay.com",
    ...(turnstileEnabled ? ["https://challenges.cloudflare.com"] : []),
    ...(isVercelPreview ? ["https://vercel.live", "wss://*.pusher.com"] : []),
    ...(!isProd ? ["ws:"] : []), // HMR websocket in dev only
  ];
  const frame = [
    "https://api.razorpay.com",
    "https://checkout.razorpay.com",
    ...(turnstileEnabled ? ["https://challenges.cloudflare.com"] : []),
    ...(isVercelPreview ? ["https://vercel.live"] : []),
  ];

  const directives = [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connect.join(" ")}`,
    `frame-src ${frame.join(" ")}`,
    "worker-src 'self' blob:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ];
  return directives.join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  // 2 years, subdomains, preload-eligible. Only meaningful over HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Camera stays same-origin for the admin QR scanner; everything else off.
  // `payment` is deliberately left unset so Razorpay's checkout iframe can use
  // the Payment Request API where it needs to.
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(), geolocation=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=()",
  },
  // allow-popups (not plain same-origin): Razorpay opens bank/3DS popups that
  // must keep their opener relationship to complete payment.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // don't advertise the framework
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

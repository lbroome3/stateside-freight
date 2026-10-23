// THE ASHBURN BLOCK. Lewis, 10/23: "permanently block that IP address from Virginia right now."
// The visitor on the site was geolocated to Ashburn, VA; only a hash of its IP was kept, so the
// block is by city (his call, told it covers everyone Vercel places in Ashburn). Vercel sets
// x-vercel-ip-city itself; a visitor cannot set it. Anything else passes straight through.
const BLOCKED_CITIES = ["ashburn"];

export const config = { matcher: "/:path*" };

export default function middleware(request) {
  try {
    const city = decodeURIComponent(request.headers.get("x-vercel-ip-city") || "").trim().toLowerCase();
    if (BLOCKED_CITIES.includes(city)) {
      return new Response("Forbidden", { status: 403, headers: { "content-type": "text/plain", "cache-control": "no-store" } });
    }
  } catch { /* never take the site down over the gate */ }
}

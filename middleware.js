// THE ASHBURN BLOCK. Lewis, 10/23: "permanently block that IP address from Virginia right now."
// The visitor on the site was geolocated to Ashburn, VA; only a hash of its IP was kept, so the
// block is by city (his call, told it covers everyone Vercel places in Ashburn). Vercel sets
// x-vercel-ip-city itself; a visitor cannot set it. Anything else passes straight through.
//
// PAGES ONLY (10/24). Ashburn is also where Vercel's own servers (iad1) and the big clouds sit,
// so the CRM fetching his signature photo (/api/stationery-photo) or the Landstar logo for a
// letter can come from "Ashburn" too, and a blocked photo means a letter without his picture. The block keeps
// the visitor off every page; the API, images and other files still answer.
const BLOCKED_CITIES = ["ashburn"];
const isPage = (path) => !path.startsWith("/api/") && !path.startsWith("/assets/") && (!/\.[a-z0-9]+$/i.test(path) || /\.html?$/i.test(path));

export const config = { matcher: "/:path*" };

export default function middleware(request) {
  try {
    const city = decodeURIComponent(request.headers.get("x-vercel-ip-city") || "").trim().toLowerCase();
    if (BLOCKED_CITIES.includes(city) && isPage(new URL(request.url).pathname)) {
      return new Response("Forbidden", { status: 403, headers: { "content-type": "text/plain", "cache-control": "no-store" } });
    }
  } catch { /* never take the site down over the gate */ }
}

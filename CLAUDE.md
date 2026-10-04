# lewisbroome.com — the marketing and quoting site

Lewis Broome's public site for Stateside International Logistics, Landstar Agency LBR.
Static HTML on Vercel, deployed from `main`. The CRM is a separate repo
(`beacon-harmony-grid`, live at `broome-crm.vercel.app`); read ITS `CLAUDE.md` first — it
holds the laws that cost money, and most work here touches both.

---

## The rules

**The root and every page here always win.** `vercel.json` is filesystem-first: the site's
own pages serve from this repo, the CRM is mounted at `/x` (never printed anywhere public),
and targeted rewrites proxy only what the CRM must serve under this host: `/api/*`,
`/assets/*`, `/track`, `/dispatch*`, `/meet`, `/team`, `/portal`, `/j/:token`, `/rc/:token`
and the rest listed in that file. NEVER a blanket catch-all — one once put the CRM login
on the marketing root (8/13) and Lewis caught it in production.

**Every page needs a clean URL.** Pages are `name.html`; a rewrite in `vercel.json` makes
`/name` serve it (`/truckload`, `/BCOonboarding`, `/fireworks-import`, `/loads`, `/trucks`,
`/week`…). A new page without its rewrite is a page whose link 404s in a Facebook post.
Add it to `sitemap.xml` too.

**Lewis is told the moment anyone starts any form.** `engage.js` is included on all seven
form pages (`<script src="/engage.js" data-form="…" defer>`): four seconds after the first
keystroke it posts `{stage:"engaged", form, fields}` to `/api/web-lead`, once per page
load. `truckload.html` also posts `{stage:"requested"}` the instant Request a Truck is
pressed. The CRM pushes and mails him so he can open the Tawk chat with the visitor.
Lewis, 9/25: "I can't miss an opportunity to retain a customer." Any new form gets the
same script and the same `data-form` name.

**Every form carries the bot trap.** A hidden `company_website` field (or `.hp` on the
driver pages) and a `fill_ms` timer go with every submission; the CRM refuses anything
that fills the trap or submits in under a few seconds. Never remove them, never make the
trap visible, never autofill it in a test.

**No physical address.** Lewis, 9/25: "I don't have a physical address anymore. Just use
Myrtle Beach SC." Every page, the structured-data address, the geo tags, the email signature and the
Gizmo knowledge base say "Myrtle Beach, SC" with no street and no ZIP (changed 10/3 on his
word). Never put a street address back.

**Nothing public names a customer, a rate, a driver or a load id.** `/loads`, `/trucks` and
`/week` read `GET /api/public-board` (same-origin via the `/api/*` rewrite), which the CRM
serves as a whitelist: lanes, days, equipment, counts. Keep it that way on any page that
shows live freight.

---

## The pages

| Page | URL | What it is |
|---|---|---|
| `index.html` | `/` | Home. Footer links every page and the Facebook page; JSON-LD `sameAs` names it too. |
| `truckload.html` | `/truckload` | Request a Truck — the form every social post sends shippers to. |
| `quote.html` | `/quote` | Container quote. |
| `fireworks-import.html` | `/fireworks-import` | Importers, dock to dock. Wednesday's post. |
| `customs-bond.html` | `/customs-bond` | Continuous and single-entry bonds through partners. |
| `BCOonboarding.html` | `/BCOonboarding` | Lease on with Landstar. Tuesday's post. |
| `2seats.html` | `/2seats` | Two company trucks, two seats. Driver application. |
| `portal.html` | `/portal` → CRM | Client account setup (the HTML here is a fallback; `/portal` is proxied). |
| `loads.html` | `/loads` | Open loads this week, live from the public board. Monday's post. |
| `trucks.html` | `/trucks` | Trucks empty today and capacity. Thursday's post. |
| `week.html` | `/week` | Loads, miles, states since Monday. Friday's post. |
| `videos.html` | `/videos` | The promo videos, downloadable. |
| `bco-dispatch.html` | `/bco-dispatch` | The 3%-of-linehaul dispatch offer for BCOs. |
| `home-classic.html` | — | The older long-form home page, linked as "More information". |
| `ours.html` | `/ours` | A countdown page. |

The agency line on public pages and posts is **803-361-1303**; the nav on several pages
shows (706) 417-9097. Both are Lewis's. Don't "fix" one to the other without asking.

The Facebook page (`https://www.facebook.com/profile.php?id=61592981752191`) is linked
from every page's footer or trust row. It is managed by Muse, Lewis's Meta assistant; the
CRM's `api/_muse.js` drafts the posts and every post links back to a page here.

Tawk.to chat is embedded on the form pages and the three live-board pages; the embed
snippet is the same on each. The CRM's early alert opens `dashboard.tawk.to` for Lewis.

---

## Shipping

There is no build and no test suite in this repo. Verify a change the way it will be seen:

```bash
git push -u origin claude/ai-chatbox-name-p3fpjk && git push origin HEAD:main
# Vercel deploys main in about a minute, then:
curl -sS -o /dev/null -w "%{http_code}\n" -L https://www.lewisbroome.com/<page>
curl -sS -L https://www.lewisbroome.com/<page> | grep -c "<something the change added>"
```

For anything interactive (a form, a script that posts to the CRM) the pattern that has
worked is Playwright against the live site from the sandbox, with Node `fetch` fulfilling
the routes the browser cannot reach directly. Never submit a real form from a test with a
real-looking name; use the trap fields' absence and a `fill_ms` the screen accepts.

The site repo is pushed to BOTH the designated branch and `main`. The CRM repo is pushed
to `main` only.

---

## How Lewis works

He reads on a phone, often while driving. Lead with what changed and what he has to tap.
"I don't care how it looks on the page, the content just needs to be there" (10/3) is the
standard for a landing page: plain, fast, the call and text buttons present, the content
true. He is usually right about his own freight; when a page says something a record does
not support, say so before it goes live.

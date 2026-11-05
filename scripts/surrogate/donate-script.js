/* Set DONATE_URL to the checkout link from the giving platform (Zeffy, Givebutter, etc.)
   once the bank account and SC charity registration are in place. While it is empty,
   the Give button shows the "opens soon" note instead of taking money. */
const DONATE_URL = "https://square.link/u/4jNLO1b2"; /* open amount: "Other amount" */
/* Fixed-price Square links, one per tier, so the checkout already shows the amount. */
const TIER_URLS = {
  25: "https://square.link/u/jftBfoMr",
  50: "https://square.link/u/4Apxt6OH",
  100: "https://square.link/u/lNM9YhJO",
  300: "https://square.link/u/4VOyXyuJ",
  500: "https://square.link/u/hRZy7edX",
  1000: "https://square.link/u/DdClimuo"
};

(function () {
  const form = document.getElementById('give-form');
  const freqBtns = form.querySelectorAll('[data-freq]');
  const amtBtns = form.querySelectorAll('[data-amt]');
  const other = document.getElementById('amt-other');
  const main = document.getElementById('impact-main');
  const sub = document.getElementById('impact-sub');
  const btn = document.getElementById('give-btn');
  const soon = document.getElementById('give-soon');
  let freq = 'once', amt = 100;

  const fmt = n => '$' + n.toLocaleString('en-US');
  function impact(a) {
    if (a >= 1000) return 'Founding sponsor: background checks and training for new mentors.';
    if (a >= 500) return 'Runs the Crossroads circle for a season: the room, the meals, the materials.';
    if (a >= 300) return 'Covers the largest small bond we post.';
    if (a >= 100) return 'Brings someone home on a small bond.';
    if (a >= 50) return 'Feeds the whole Crossroads circle for a week.';
    if (a >= 1) return 'Puts a workbook and a meal in front of a young man.';
    return 'Choose an amount to see what it does.';
  }
  function render() {
    main.textContent = impact(amt);
    if (!amt) { sub.textContent = ''; btn.textContent = 'Give'; return; }
    if (freq === 'monthly') {
      sub.textContent = fmt(amt) + ' a month is ' + fmt(amt * 12) + ' a year, enough to keep the work steady through every season.';
      btn.textContent = 'Give ' + fmt(amt) + ' monthly';
    } else {
      sub.textContent = 'A one-time founding gift, put to work right away.';
      btn.textContent = 'Give ' + fmt(amt);
    }
  }
  freqBtns.forEach(b => b.addEventListener('click', () => {
    freq = b.dataset.freq;
    freqBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
  amtBtns.forEach(b => b.addEventListener('click', () => {
    amt = Number(b.dataset.amt); other.value = '';
    amtBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
  other.addEventListener('input', () => {
    other.value = other.value.replace(/[^0-9]/g, '').slice(0, 7);
    amt = Number(other.value) || 0;
    amtBtns.forEach(x => x.setAttribute('aria-pressed', 'false'));
    render();
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!amt) { other.focus(); return; }
    /* Gift button tap -> the CRM's Surrogate Funding tab ("Gift button taps", by amount). */
    try { if (window.gmTrack) window.gmTrack('donate', '$' + amt); } catch (x) {}
    if (DONATE_URL) {
      const a = document.createElement('a');
      a.href = TIER_URLS[amt] || DONATE_URL; a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
    } else {
      soon.hidden = false;
    }
  });
  render();
})();

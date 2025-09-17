document.addEventListener('DOMContentLoaded', () => {
  // --- Resolve site root from where script.js actually loaded ---
  const scriptTag =
    document.querySelector('script[src$="script.js"]') ||
    Array.from(document.scripts).find(s => (s.src || '').endsWith('script.js'));
  const scriptSrc = scriptTag ? scriptTag.src : window.location.href;
  // Directory of script.js (always ends with /)
  const siteRoot = new URL('.', scriptSrc).href;

  // ============================
  // Load Latest Updates (from root)
  // ============================
  fetch(new URL('updates.json', siteRoot))
    .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
    .then(data => {
      const latestList = document.querySelector('.latest-list');
      if (!latestList) return; // Not all pages have the carousel

      latestList.innerHTML = '';

      data
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3)
        .forEach((item, index) => {
          const card = document.createElement('a');
          card.href = item.link || '#';
          card.className = `latest-card rotate-${index + 1}`;
          card.innerHTML = `
            <img src="${item.image}" alt="${item.title}">
            <div class="card-caption">${item.date} – ${item.title}</div>
          `;
          latestList.appendChild(card);
        });

      // Rotate the cards every 3 seconds
      setInterval(() => {
        const list = document.querySelector('.latest-list');
        const cards = list ? list.querySelectorAll('.latest-card') : [];
        if (!list || cards.length < 2) return;

        const firstCard = cards[0];
        firstCard.classList.add('fade-out');

        setTimeout(() => {
          list.appendChild(firstCard);
          list.querySelectorAll('.latest-card').forEach((card, i) => {
            card.className = `latest-card rotate-${i + 1}`;
          });
        }, 300); // Match fade-out duration
      }, 3000);
    })
    .catch(err => console.warn('Failed to load updates:', err));

  // ============================
  // Load Navbar (from root)
  // ============================
  const navbarPlaceholder = document.getElementById('navbar-placeholder');
  if (navbarPlaceholder) {
    const navbarUrl = new URL('navbar.html', siteRoot);

    fetch(navbarUrl)
      .then(res => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(html => {
        navbarPlaceholder.innerHTML = html;

        const navMenu = document.querySelector('.nav-menu');
        const toggleBtn = document.querySelector('.menu-toggle');
        if (toggleBtn && navMenu) {
          toggleBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
          });
        }
      })
      .catch(err => console.error('Navbar load failed:', err, 'URL:', String(navbarUrl)));
  }
});
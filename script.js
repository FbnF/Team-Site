document.addEventListener('DOMContentLoaded', () => {
  // This event listener ensures the script runs only after the entire HTML document has been fully loaded and parsed.

  // Load updates dynamically from a JSON file
  fetch('updates.json')
    .then(res => res.json()) // Parse the response as JSON
    .then(data => {
      // Select the container element where the latest updates will be displayed
      const latestList = document.querySelector('.latest-list');
      if (!latestList) return; // If the container doesn't exist, exit early

      latestList.innerHTML = ''; // Clear any fallback content inside the container

      data
        .slice() // Create a shallow copy of the data array to avoid mutating the original
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort updates by date in descending order (newest first)
        .slice(0, 3) // Limit to the top 3 most recent updates
        .forEach((item, index) => {
          // For each update item, create an anchor element to serve as a clickable card
          const card = document.createElement('a');
          card.href = item.link || '#'; // Set the link, or default to '#' if none provided
          card.className = `latest-card rotate-${index + 1}`; // Assign a class with rotation based on index for styling

          // Set the inner HTML of the card with an image and caption containing the date and title
          card.innerHTML = `
            <img src="${item.image}" alt="${item.title}">
            <div class="card-caption">${item.date} – ${item.title}</div>
          `;
          // Append the card to the latest list container
          latestList.appendChild(card);
        });

      // Rotate the cards every 3 seconds
      setInterval(() => {
        const cards = document.querySelectorAll('.latest-card');
        if (cards.length < 2) return;

        const firstCard = cards[0];
        firstCard.classList.add('fade-out');

        // After fade-out animation, move the card to the end
        setTimeout(() => {
          latestList.appendChild(firstCard);
          // Reset classes for all cards
          document.querySelectorAll('.latest-card').forEach((card, i) => {
            card.className = `latest-card rotate-${i + 1}`;
          });
        }, 300); // Match with fade-out duration
      }, 3000);
    })
    .catch(err => console.error('Failed to load updates:', err)); // Log any errors that occur during fetch or processing

  // Load the navbar HTML from an external file and insert it into the page
  const navbarPlaceholder = document.getElementById('navbar-placeholder'); // Find the placeholder element for the navbar
  if (navbarPlaceholder) {
    // Compute a repo-aware root path that works on GitHub Pages project sites.
    // Example URLs:
    //   Local dev:              /updates/Blog_main.html
    //   GitHub Pages project:   /TEAM-SITE/updates/Blog_main.html
    // We want to always fetch "/<repo>/navbar.html" when a repo segment exists.
    const pathname = window.location.pathname.replace(/\/index\.html$/, '');
    const segments = pathname.split('/').filter(Boolean);
    const repoRoot = segments.length ? `/${segments[0]}/` : '/';
    const navbarUrl = `${repoRoot}navbar.html`;

    fetch(navbarUrl)
      .then(res => res.text())
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
      .catch(err => console.error('Navbar load failed:', err));
  }
});
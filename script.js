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
    // Determine the relative path to the root directory based on current URL path
    const path = window.location.pathname;
    let pathToRoot = path.includes('/Team/') || path.includes('/updates/') ? '../' : './';

    // Fetch the navbar.html file from the appropriate path
    fetch(`${pathToRoot}navbar.html`)
      .then(res => res.text()) // Parse the response as plain text (HTML)
      .then(html => {
        navbarPlaceholder.innerHTML = html; // Insert the navbar HTML into the placeholder element

        // After the navbar is inserted, add event listeners for interactive functionality

        const navMenu = document.querySelector('.nav-menu'); // Select the navigation menu element
        const toggleBtn = document.querySelector('.menu-toggle'); // Select the menu toggle button (for mobile)

        if (toggleBtn && navMenu) {
          // If both elements exist, add a click listener to toggle the menu visibility
          toggleBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active'); // Toggle the 'active' class to show/hide the menu
          });
        }
      })
      .catch(err => console.error('Navbar load failed:', err)); // Log any errors during navbar fetch or insertion
  }
});
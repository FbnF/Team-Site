(function () {
  const photos = document.querySelectorAll('.member-photo');

  photos.forEach((photo) => {
    photo.addEventListener('click', () => {
      photo.classList.remove('jump');
      // Force reflow to restart animation
      void photo.offsetWidth;
      photo.classList.add('jump');
    });
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  const year = new Date().getFullYear();
  const footerText = document.querySelector('.footer-inner div');

  if (footerText && footerText.textContent.includes('2026')) {
    footerText.textContent = `© ${year} Digital Culture Schools`;
  }
});

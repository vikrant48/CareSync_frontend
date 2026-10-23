// Runs before the app starts. Kept in a file (not inline in index.html) so the Content-Security-Policy can block
// every inline script.

// Apply the saved theme before the first paint, so the page doesn't flash the wrong colours
(function () {
  try {
    var t = localStorage.getItem('theme') || 'dark';
    if (t === 'system') {
      t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var isDark = t !== 'light';
    var d = document.documentElement;
    if (isDark) {
      d.classList.add('dark', 'theme-dark');
      d.classList.remove('light', 'theme-light');
    } else {
      d.classList.add('light', 'theme-light');
      d.classList.remove('dark', 'theme-dark');
    }
  } catch (e) { }
})();

// SockJS (live chat) expects Node's "global"
if (typeof global === 'undefined') {
  window.global = window;
}

// This script runs before React hydration to prevent theme flickering
export const themeScript = `(function() {
  try {
    const stored = localStorage.getItem('tidysub-settings');
    if (stored) {
      const settings = JSON.parse(stored);
      const theme = settings.appearance || 'dark';
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (theme === 'system') {
        if (systemPrefersDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      } else if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();`


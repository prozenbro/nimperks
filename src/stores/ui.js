import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const isSettingsOpen = ref(false);
  const theme = ref(localStorage.getItem('nimperks-theme') || 'system');

  function updateDarkClass(currentTheme) {
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (currentTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // system
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  function setTheme(newTheme) {
    theme.value = newTheme;
    localStorage.setItem('nimperks-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    updateDarkClass(newTheme);
  }

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'system') updateDarkClass('system');
    });
  }

  // Initialize theme on load
  setTheme(theme.value);

  return { isSettingsOpen, theme, setTheme };
});

// Base API Endpoint สำหรับเชื่อมต่อกับ FastAPI (main.py)
const API_BASE = "http://127.0.0.1:8000/api";

// ระบบควบคุมธีมสลับ 2 โทนสี (Light / Dark Mode)
function initTheme() {
  const savedTheme = localStorage.getItem('kinraidee_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
  applyTheme(isDark);
}

function applyTheme(isDark) {
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');

  if (isDark) {
    document.documentElement.classList.add('dark');
    if (moonIcon && sunIcon) {
      moonIcon.classList.remove('hidden');
      sunIcon.classList.add('hidden');
    }
  } else {
    document.documentElement.classList.remove('dark');
    if (moonIcon && sunIcon) {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    }
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('kinraidee_theme', isDark ? 'dark' : 'light');
  applyTheme(isDark);
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }
});
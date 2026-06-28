/* ==========================================================================
   SmartExpense Pro - Centralized API Service Wrapper
   ========================================================================== */

const API_CONFIG = {
  // Automatically switch base URL depending on environment
  BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : (localStorage.getItem('smartexpense_backend_url') || '/api'),
};

// Centralized Fetch Wrapper
const api = {
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('smartexpense_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    // Inject headers
    options.headers = {
      ...this.getHeaders(),
      ...options.headers,
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
          localStorage.removeItem('smartexpense_token');
          localStorage.removeItem('smartexpense_user');
          showToast('Session expired. Redirecting to login...', 'error');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
        }
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Request failed on ${endpoint}:`, error.message);
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

// Global Toast Notification Helper
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Trigger animate-in
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Remove toast after 4s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 4000);
}

// Global Theme and Loader initialization
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme
  const savedTheme = localStorage.getItem('smartexpense_theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  }

  // Remove loader overlay if exists
  const loader = document.getElementById('loader-overlay');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
      }, 500);
    }, 400);
  }

  // Setup sidebar responsive toggle (hamburger menu)
  const menuBtn = document.querySelector('.hamburger-btn');
  const sidebar = document.querySelector('.sidebar');
  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
      }
    });
  }
});

/* ==========================================================================
   SmartExpense Pro - Authentication Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  // Handle Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) {
        return showToast('Please enter both email and password', 'error');
      }

      try {
        const response = await api.post('/auth/login', { email, password });
        
        // Save user state
        localStorage.setItem('smartexpense_token', response.token);
        localStorage.setItem('smartexpense_user', JSON.stringify({
          id: response._id,
          name: response.name,
          email: response.email,
          role: response.role,
        }));

        showToast('Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
      } catch (error) {
        showToast(error.message || 'Login failed. Please check credentials.', 'error');
      }
    });
  }

  // Handle Register Form Submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (!name || !email || !password || !confirmPassword) {
        return showToast('All fields are required', 'error');
      }

      if (password !== confirmPassword) {
        return showToast('Passwords do not match', 'error');
      }

      if (password.length < 6) {
        return showToast('Password must be at least 6 characters long', 'error');
      }

      try {
        const response = await api.post('/auth/register', { name, email, password });
        
        // Save user state
        localStorage.setItem('smartexpense_token', response.token);
        localStorage.setItem('smartexpense_user', JSON.stringify({
          id: response._id,
          name: response.name,
          email: response.email,
          role: response.role,
        }));

        showToast('Registration successful! Redirecting...', 'success');
        
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
      } catch (error) {
        showToast(error.message || 'Registration failed.', 'error');
      }
    });
  }
});

// Redirect helper to check auth token
function checkAuth() {
  const token = localStorage.getItem('smartexpense_token');
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  
  // Render user info in UI if elements exist
  const user = JSON.parse(localStorage.getItem('smartexpense_user'));
  if (user) {
    const nameElements = document.querySelectorAll('.user-name');
    const roleElements = document.querySelectorAll('.user-role');
    const avatarElements = document.querySelectorAll('.user-avatar');
    const adminLinks = document.querySelectorAll('.admin-link');

    nameElements.forEach(el => el.textContent = user.name);
    roleElements.forEach(el => el.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1));
    avatarElements.forEach(el => el.textContent = user.name.charAt(0).toUpperCase());

    // Show Admin Link if role is admin
    if (user.role === 'admin') {
      adminLinks.forEach(el => el.style.display = 'block');
    }
  }

  // Setup Theme Switcher
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
      localStorage.setItem('smartexpense_theme', currentTheme);
    });
  }

  // Setup Logout Trigger
  const logoutBtn = document.getElementById('logout-trigger');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('smartexpense_token');
      localStorage.removeItem('smartexpense_user');
      showToast('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
    });
  }

  return true;
}

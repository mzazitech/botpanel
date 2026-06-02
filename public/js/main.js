// Toast notification system
class ToastManager {
  constructor() {
    this.container = document.querySelector('.toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span>${message}</span>
      </div>
    `;
    toast.style.borderLeftColor = type === 'success' ? '#00ff9d' : type === 'error' ? '#ff4444' : '#00d4ff';
    this.container.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

const toast = new ToastManager();

// Theme Toggle
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  }
  
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const newTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      toast.show(`${newTheme} mode activated`);
    });
  }
}

// Product search functionality
function initProductSearch() {
  const searchInput = document.getElementById('productSearch');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
      const title = product.querySelector('.product-title')?.textContent.toLowerCase() || '';
      const desc = product.querySelector('.product-description')?.textContent.toLowerCase() || '';
      const matches = title.includes(searchTerm) || desc.includes(searchTerm);
      product.style.display = matches ? 'block' : 'none';
    });
  });
}

// Buy Now handler
async function handleBuyNow(productId) {
  try {
    // Check if user is logged in
    const token = getCookie('token');
    if (!token) {
      toast.show('Please login to purchase', 'error');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }
    
    const response = await fetch('/api/payment/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      window.location.href = data.authorization_url;
    } else {
      toast.show(data.message || 'Payment initialization failed', 'error');
    }
  } catch (error) {
    console.error('Buy error:', error);
    toast.show('Something went wrong', 'error');
  }
}

// Helper: Get cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Logout handler
async function handleLogout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    if (response.ok) {
      toast.show('Logged out successfully');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Initialize all
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initProductSearch();
  
  // Attach buy buttons (delegation)
  document.addEventListener('click', (e) => {
    if (e.target.closest('.buy-now-btn')) {
      const btn = e.target.closest('.buy-now-btn');
      const productId = btn.dataset.productId;
      if (productId) handleBuyNow(productId);
    }
    
    if (e.target.closest('#logoutBtn')) {
      e.preventDefault();
      handleLogout();
    }
  });
});

// Loading overlay
function showLoading() {
  let loader = document.querySelector('.global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.className = 'global-loader';
    loader.innerHTML = '<div class="loader"></div>';
    loader.style.position = 'fixed';
    loader.style.top = '0';
    loader.style.left = '0';
    loader.style.width = '100%';
    loader.style.height = '100%';
    loader.style.background = 'rgba(0,0,0,0.7)';
    loader.style.display = 'flex';
    loader.style.justifyContent = 'center';
    loader.style.alignItems = 'center';
    loader.style.zIndex = '9999';
    document.body.appendChild(loader);
  }
  loader.style.display = 'flex';
}

function hideLoading() {
  const loader = document.querySelector('.global-loader');
  if (loader) loader.style.display = 'none';
}

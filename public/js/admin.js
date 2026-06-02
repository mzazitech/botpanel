// Admin panel functionality
async function loadAdminStats() {
  showLoading();
  try {
    const response = await fetch('/api/admin/stats', { credentials: 'include' });
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('totalUsers').textContent = data.stats.totalUsers;
      document.getElementById('totalProducts').textContent = data.stats.totalProducts;
      document.getElementById('totalSales').textContent = `KES ${data.stats.totalSales.toLocaleString()}`;
      document.getElementById('totalPurchases').textContent = data.stats.totalPurchases;
      
      // Render recent purchases
      const recentContainer = document.getElementById('recentPurchases');
      if (recentContainer && data.recentPurchases) {
        recentContainer.innerHTML = data.recentPurchases.map(p => `
          <tr>
            <td>${p.user?.username || 'N/A'}</td>
            <td>${p.product?.name || 'N/A'}</td>
            <td>KES ${p.amount}</td>
            <td>${new Date(p.createdAt).toLocaleDateString()}</td>
          </tr>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Admin stats error:', error);
    toast.show('Failed to load admin stats', 'error');
  } finally {
    hideLoading();
  }
}

async function loadUsers() {
  try {
    const response = await fetch('/api/admin/users', { credentials: 'include' });
    const data = await response.json();
    if (data.success && data.users) {
      const container = document.getElementById('usersTableBody');
      if (container) {
        container.innerHTML = data.users.map(user => `
          <tr>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.isAdmin ? '👑 Admin' : '👤 User'}</td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td><button onclick="deleteUser('${user._id}')" class="neon-outline" style="padding: 5px 15px;">Delete</button></td>
          </tr>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Load users error:', error);
  }
}

async function deleteUser(userId) {
  if (!confirm('Are you sure? This will delete all user data and purchases.')) return;
  
  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      toast.show('User deleted successfully');
      loadUsers();
      loadAdminStats();
    } else {
      toast.show(data.message, 'error');
    }
  } catch (error) {
    toast.show('Error deleting user', 'error');
  }
}

async function loadProducts() {
  try {
    const response = await fetch('/api/admin/products', { credentials: 'include' });
    const data = await response.json();
    if (data.success) {
      const container = document.getElementById('productsTableBody');
      if (container) {
        container.innerHTML = data.products.map(product => `
          <tr>
            <td>${product.name}</td>
            <td>KES ${product.price}</td>
            <td>${product.isActive ? '✅ Active' : '❌ Inactive'}</td>
            <td>
              <button onclick="toggleProductStatus('${product._id}', ${!product.isActive})" class="neon-outline" style="padding: 5px 10px; margin-right: 5px;">
                ${product.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onclick="editProduct('${product._id}')" class="neon-btn" style="padding: 5px 10px;">Edit</button>
            </td>
          </tr>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Load products error:', error);
  }
}

async function toggleProductStatus(productId, newStatus) {
  try {
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: newStatus }),
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      toast.show('Product updated');
      loadProducts();
    }
  } catch (error) {
    toast.show('Error updating product', 'error');
  }
}

function editProduct(productId) {
  const newName = prompt('Enter new product name:');
  if (newName) {
    // Simplified update - in real implementation would do full update
    fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
      credentials: 'include'
    }).then(() => loadProducts());
  }
}

if (document.getElementById('adminPanel')) {
  loadAdminStats();
  loadUsers();
  loadProducts();
}

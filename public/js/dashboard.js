// Dashboard specific functionality
async function loadDashboard() {
  showLoading();
  try {
    const response = await fetch('/api/dashboard', {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.success) {
      updateDashboardUI(data);
    } else {
      toast.show('Failed to load dashboard', 'error');
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    toast.show('Error loading dashboard', 'error');
  } finally {
    hideLoading();
  }
}

function updateDashboardUI(data) {
  // Update user info
  const usernameEl = document.getElementById('dashboardUsername');
  if (usernameEl) usernameEl.textContent = data.user.username;
  
  // Update stats
  document.getElementById('totalPurchases')?.textContent = data.stats.totalPurchases;
  document.getElementById('activeProducts')?.textContent = data.stats.activeProducts;
  document.getElementById('totalSpent')?.textContent = `KES ${data.stats.totalSpent}`;
  
  // Render purchases
  const purchasesContainer = document.getElementById('purchasesList');
  if (purchasesContainer && data.purchases.length > 0) {
    purchasesContainer.innerHTML = data.purchases.map(purchase => `
      <div class="glass-card" style="padding: 15px; margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
          <div>
            <span style="font-size: 1.5rem; margin-right: 10px;">${purchase.productIcon || '📦'}</span>
            <strong>${purchase.productName}</strong>
          </div>
          <div>
            <span style="color: #00ff9d;">KES ${purchase.amount}</span>
            ${purchase.expiryDate ? `<small style="color: #888;">Expires: ${new Date(purchase.expiryDate).toLocaleDateString()}</small>` : ''}
          </div>
        </div>
        ${purchase.apiKey ? `
          <div style="margin-top: 10px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; font-family: monospace;">
            <strong>🔑 API Key:</strong> ${purchase.apiKey}
            <button onclick="copyToClipboard('${purchase.apiKey}')" style="margin-left: 10px; background: #00d4ff; border: none; padding: 4px 12px; border-radius: 5px; cursor: pointer;">Copy</button>
          </div>
        ` : ''}
        <div style="margin-top: 10px; font-size: 0.85rem; color: #888;">
          Purchased: ${new Date(purchase.deliveredAt || purchase.createdAt).toLocaleDateString()}
        </div>
      </div>
    `).join('');
  } else if (purchasesContainer) {
    purchasesContainer.innerHTML = '<p style="text-align: center; padding: 40px;">No purchases yet. <a href="/">Browse Products</a></p>';
  }
  
  // Render API Keys section
  const apiKeysContainer = document.getElementById('apiKeysList');
  if (apiKeysContainer && data.apiKeys.length > 0) {
    apiKeysContainer.innerHTML = data.apiKeys.map(key => `
      <div class="glass-card" style="padding: 12px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
          <div>
            <strong>${key.productName}</strong>
          </div>
          <code style="background: #000; padding: 5px 10px; border-radius: 5px;">${key.apiKey}</code>
          <button onclick="copyToClipboard('${key.apiKey}')" class="neon-outline" style="padding: 5px 15px;">Copy</button>
        </div>
      </div>
    `).join('');
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  toast.show('Copied to clipboard!', 'success');
}

if (document.getElementById('dashboardContent')) {
  loadDashboard();
}

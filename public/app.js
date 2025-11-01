// API Base URL
const API_BASE = window.location.origin;

// State
let currentStatus = null;
let refreshInterval = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Vinny Command Center initialized');
  refreshData();

  // Auto-refresh every 10 seconds
  refreshInterval = setInterval(refreshData, 10000);
});

// Refresh all data
async function refreshData() {
  await Promise.all([
    fetchStatus(),
    fetchPosts(),
    fetchAgents(),
    fetchConfig(),
    fetchStats(),
  ]);
}

// Fetch bot status
async function fetchStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/status`);
    const data = await response.json();
    currentStatus = data;

    // Update status badge
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');

    if (data.running) {
      statusBadge.className = 'status-badge status-active';
      statusText.textContent = 'Active';
      document.getElementById('botStatus').textContent = 'Running';
      document.getElementById('btnStart').disabled = true;
      document.getElementById('btnStop').disabled = false;
      document.getElementById('btnPostNow').disabled = false;
    } else {
      statusBadge.className = 'status-badge status-inactive';
      statusText.textContent = 'Inactive';
      document.getElementById('botStatus').textContent = 'Stopped';
      document.getElementById('btnStart').disabled = false;
      document.getElementById('btnStop').disabled = true;
      document.getElementById('btnPostNow').disabled = true;
    }

    // Update stats
    document.getElementById('postsToday').textContent = data.todayPostCount || 0;
    document.getElementById('dailyLimit').textContent = data.postsPerDay || 10;

    // Update uptime
    if (data.running && data.uptime) {
      const hours = Math.floor(data.uptime / 3600000);
      const minutes = Math.floor((data.uptime % 3600000) / 60000);
      document.getElementById('uptime').textContent = `${hours}h ${minutes}m`;
    } else {
      document.getElementById('uptime').textContent = '-';
    }

  } catch (error) {
    console.error('Error fetching status:', error);
    showToast('Failed to fetch status', 'error');
  }
}

// Fetch posts
async function fetchPosts() {
  try {
    const category = document.getElementById('categoryFilter').value;
    const url = category === 'all'
      ? `${API_BASE}/api/posts?limit=50`
      : `${API_BASE}/api/posts?category=${category}`;

    const response = await fetch(url);
    const data = await response.json();

    const postsList = document.getElementById('postsList');

    if (data.posts.length === 0) {
      postsList.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-inbox text-4xl mb-2"></i>
          <p>No posts yet</p>
        </div>
      `;
      return;
    }

    postsList.innerHTML = data.posts.map(post => {
      const date = new Date(post.posted_at);
      const timeAgo = getTimeAgo(date);
      const categoryColor = getCategoryColor(post.category);

      return `
        <div class="post-card bg-white p-4 rounded-lg shadow-sm">
          <div class="flex items-start justify-between mb-2">
            <span class="text-xs px-2 py-1 rounded" style="background: ${categoryColor}20; color: ${categoryColor}; font-weight: 600;">
              ${post.category.replace('_', ' ').toUpperCase()}
            </span>
            <span class="text-xs text-gray-500">${timeAgo}</span>
          </div>
          <p class="text-gray-800 leading-relaxed">${escapeHtml(post.content)}</p>
          <div class="mt-2 text-xs text-gray-400">
            ${date.toLocaleString()}
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error fetching posts:', error);
    showToast('Failed to fetch posts', 'error');
  }
}

// Fetch agents
async function fetchAgents() {
  try {
    const response = await fetch(`${API_BASE}/api/agents`);
    const data = await response.json();

    const agentsList = document.getElementById('agentsList');

    agentsList.innerHTML = data.agents.map(agent => {
      const statusColor = agent.status === 'active' ? 'green' : 'red';
      const statusIcon = agent.status === 'active' ? 'fa-check-circle' : 'fa-times-circle';

      return `
        <div class="stat-card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-lg">${agent.name}</h3>
            <i class="fas ${statusIcon} text-${statusColor}-500 text-xl"></i>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Status:</span>
              <span class="font-semibold text-${statusColor}-600">${agent.status}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Today:</span>
              <span class="font-semibold">${agent.postsToday} posts</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Total:</span>
              <span class="font-semibold">${agent.totalPosts} posts</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error fetching agents:', error);
  }
}

// Fetch config
async function fetchConfig() {
  try {
    const response = await fetch(`${API_BASE}/api/config`);
    const data = await response.json();

    document.getElementById('postsPerDay').value = data.postsPerDay || 10;
    document.getElementById('timezone').value = data.timezone || 'America/Edmonton';

  } catch (error) {
    console.error('Error fetching config:', error);
  }
}

// Fetch stats
async function fetchStats() {
  try {
    const response = await fetch(`${API_BASE}/api/stats`);
    const data = await response.json();

    const statsContent = document.getElementById('statsContent');

    statsContent.innerHTML = `
      <div class="stat-card">
        <div class="text-sm text-gray-600 mb-1">Total Posts</div>
        <div class="text-2xl font-bold text-purple-600">${data.totalPosts || 0}</div>
      </div>
      <div class="stat-card">
        <div class="text-sm text-gray-600 mb-1">Today</div>
        <div class="text-2xl font-bold text-green-600">${data.todayPosts || 0}</div>
      </div>
      ${Object.entries(data.categoryBreakdown || {}).slice(0, 2).map(([category, count]) => `
        <div class="stat-card">
          <div class="text-sm text-gray-600 mb-1">${category.replace('_', ' ')}</div>
          <div class="text-2xl font-bold text-blue-600">${count}</div>
        </div>
      `).join('')}
    `;

  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

// Start bot
async function startBot() {
  const btn = document.getElementById('btnStart');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="loading"></span> Starting...';
  btn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/start`, { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      showToast('Bot started successfully!', 'success');
      await refreshData();
    } else {
      showToast(data.message || 'Failed to start bot', 'error');
    }
  } catch (error) {
    console.error('Error starting bot:', error);
    showToast('Failed to start bot', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Stop bot
async function stopBot() {
  const btn = document.getElementById('btnStop');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="loading"></span> Stopping...';
  btn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/stop`, { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      showToast('Bot stopped successfully!', 'success');
      await refreshData();
    } else {
      showToast(data.message || 'Failed to stop bot', 'error');
    }
  } catch (error) {
    console.error('Error stopping bot:', error);
    showToast('Failed to stop bot', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Post now
async function postNow() {
  const btn = document.getElementById('btnPostNow');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="loading"></span> Posting...';
  btn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/post-now`, { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      showToast('Posted successfully!', 'success');
      await refreshData();
    } else {
      showToast(data.message || 'Failed to post', 'error');
    }
  } catch (error) {
    console.error('Error posting:', error);
    showToast('Failed to post', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Generate preview
async function generatePreview() {
  const btn = document.getElementById('btnPreview');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="loading"></span> Generating...';
  btn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/test-post`, { method: 'POST' });
    const data = await response.json();

    const previewArea = document.getElementById('previewArea');
    const previewContent = document.getElementById('previewContent');
    const previewCategory = document.getElementById('previewCategory');

    previewContent.textContent = data.content;
    previewCategory.textContent = data.category.replace('_', ' ').toUpperCase();
    previewArea.classList.remove('hidden');

    showToast('Preview generated!', 'success');

  } catch (error) {
    console.error('Error generating preview:', error);
    showToast('Failed to generate preview', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Save config
async function saveConfig() {
  const btn = document.getElementById('btnSaveConfig');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="loading"></span> Saving...';
  btn.disabled = true;

  try {
    const postsPerDay = parseInt(document.getElementById('postsPerDay').value);
    const timezone = document.getElementById('timezone').value;

    const response = await fetch(`${API_BASE}/api/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postsPerDay, timezone })
    });

    const data = await response.json();

    if (data.success) {
      showToast('Configuration saved and bot restarted!', 'success');
      await refreshData();
    } else {
      showToast(data.error || 'Failed to save config', 'error');
    }
  } catch (error) {
    console.error('Error saving config:', error);
    showToast('Failed to save config', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Filter posts
function filterPosts() {
  fetchPosts();
}

// Utility: Show toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');

  toastMessage.textContent = message;

  if (type === 'error') {
    toastIcon.className = 'fas fa-exclamation-circle text-xl';
  } else {
    toastIcon.className = 'fas fa-check-circle text-xl';
  }

  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// Utility: Get time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';

  return Math.floor(seconds) + ' seconds ago';
}

// Utility: Get category color
function getCategoryColor(category) {
  const colors = {
    health_tip: '#10b981',
    fitness: '#3b82f6',
    safety: '#ef4444',
    longevity: '#8b5cf6',
    joke: '#f59e0b',
    story: '#ec4899',
    fact: '#06b6d4',
  };
  return colors[category] || '#6b7280';
}

// Utility: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

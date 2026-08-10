// Tab Navigation logic for Website Prototype
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.nav-tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabTarget = tab.getAttribute('data-tab');
      switchTab(tabTarget);
    });
  });
});

function switchTab(viewId) {
  // Update nav buttons active state
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.remove('active');
    if (t.getAttribute('data-tab') === viewId) {
      t.classList.add('active');
    }
  });

  // Hide all views
  document.querySelectorAll('.app-view').forEach(view => {
    view.classList.remove('active');
  });

  // Show target view
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Like Button Toggle simulation
function toggleLike(btn) {
  const isLiked = btn.classList.contains('liked');
  const countSpan = btn.querySelector('.like-count');
  let currentCount = parseInt(countSpan.textContent.replace(',', ''), 10) || 0;

  if (isLiked) {
    btn.classList.remove('liked');
    btn.querySelector('.action-icon').textContent = '🤍';
    countSpan.textContent = currentCount - 1;
  } else {
    btn.classList.add('liked');
    btn.querySelector('.action-icon').textContent = '❤️';
    countSpan.textContent = currentCount + 1;
  }
}

// Add new post dynamically to top of feed
function addNewPost() {
  const input = document.querySelector('.post-input');
  const content = input.value.trim();
  const selector = document.querySelector('.char-selector-input');
  const selectedIdentity = selector.options[selector.selectedIndex].text;

  if (!content) {
    alert('Escreva algo para publicar no feed de Azeroth!');
    return;
  }

  const container = document.getElementById('posts-container');
  const newPostHTML = `
    <article class="post-card">
      <div class="post-header">
        <div class="author-info">
          <img src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80" alt="Avatar" class="avatar-md">
          <div>
            <div class="author-title">
              <span class="author-name">Gabriel</span>
              <span class="via-tag">${selectedIdentity.includes('via') ? selectedIdentity : ''}</span>
            </div>
            <span class="post-time">Agora mesmo · Stormrage (US)</span>
          </div>
        </div>
        <button class="icon-btn-ghost">•••</button>
      </div>
      
      <div class="post-body">
        <p>${escapeHTML(content)}</p>
      </div>

      <div class="post-footer">
        <button class="post-action-btn" onclick="toggleLike(this)">
          <span class="action-icon">🤍</span> <span class="like-count">0</span>
        </button>
        <button class="post-action-btn">
          <span class="action-icon">💬</span> 0 Comentários
        </button>
        <button class="post-action-btn">
          <span class="action-icon">🔁</span> Compartilhar
        </button>
      </div>
    </article>
  `;

  container.insertAdjacentHTML('afterbegin', newPostHTML);
  input.value = '';
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

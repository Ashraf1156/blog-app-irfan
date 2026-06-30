// ==========================================================================
// Application State & Constants
// ==========================================================================
const state = {
  blogs: [],
  currentCategory: 'All',
  searchQuery: '',
  likedBlogs: new Set(JSON.parse(localStorage.getItem('likedBlogs') || '[]')),
  likesMap: JSON.parse(localStorage.getItem('likesMap') || '{}'),
  currentPage: 1
};

// DOM References
const DOM = {
  mainContent: document.getElementById('main-content'),
  homeView: document.getElementById('home-view'),
  libraryView: document.getElementById('library-view'),
  likedView: document.getElementById('liked-view'),
  readerView: document.getElementById('reader-view'),
  blogGrid: document.getElementById('blog-grid'),
  chipsContainer: document.getElementById('chips-container'),
  searchBar: document.getElementById('search-bar'),
  searchSubmit: document.getElementById('search-submit'),
  searchInfoBar: document.getElementById('search-info-bar'),
  searchInfoText: document.getElementById('search-info-text'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  sidebar: document.getElementById('sidebar'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
  themeToggle: document.getElementById('theme-toggle'),
  logoHomeLink: document.getElementById('logo-home-link'),
  backHomeLink: document.getElementById('back-home-link'),
  
  // Navigation Sidebar Elements
  sideNavHome: document.getElementById('side-nav-home'),
  sideNavLibrary: document.getElementById('side-nav-library'),
  sideNavLiked: document.getElementById('side-nav-liked'),
  
  // Library View Elements
  playlistGrid: document.getElementById('playlist-grid'),
  
  // Liked Blogs View Elements
  likedCountBadge: document.getElementById('liked-count-badge'),
  likedPlaylistBlur: document.getElementById('liked-playlist-blur'),
  readFirstLikedBtn: document.getElementById('read-first-liked-btn'),
  likedRowsList: document.getElementById('liked-rows-list'),
  
  // Reader View Elements
  readerCategory: document.getElementById('reader-category'),
  readerTitle: document.getElementById('reader-title'),
  readerAuthorAvatar: document.getElementById('reader-author-avatar'),
  readerAuthorName: document.getElementById('reader-author-name'),
  readerReadsCount: document.getElementById('reader-reads-count'),
  readerPublishDate: document.getElementById('reader-publish-date'),
  readerReadingTime: document.getElementById('reader-reading-time'),
  readerContent: document.getElementById('reader-content'),
  readingProgressBar: document.getElementById('reading-progress'),
  relatedPostsList: document.getElementById('related-posts-list'),
  likePostBtn: document.getElementById('like-post-btn'),
  sharePostBtn: document.getElementById('share-post-btn'),
  likeCount: document.getElementById('like-count'),
  paginationBar: document.getElementById('pagination-bar')
};

// ==========================================================================
// Initialization & Data Fetching
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  setupTheme();
  setupEventListeners();
  await loadBlogData();
  handleRouting();
});

// Load blogs metadata from local JSON and parse metadata from markdown source files
async function loadBlogData() {
  try {
    const response = await fetch('blogs.json');
    if (!response.ok) throw new Error('Failed to load blog index');
    state.blogs = await response.json();
    
    // In-memory cache to fetch each markdown file exactly once
    const fileCache = {};
    
    for (const blog of state.blogs) {
      if (!fileCache[blog.file]) {
        try {
          const fileResponse = await fetch(blog.file);
          if (fileResponse.ok) {
            const text = await fileResponse.text();
            
            // Extract Author (matches: **Author:** Name)
            const authorMatch = text.match(/\*\*Author:\*\*\s*(.+)/i);
            const author = authorMatch ? authorMatch[1].replace(/<[^>]*>?/gm, '').trim() : null;
            
            // Extract Category (matches: **Category:** Tech)
            const categoryMatch = text.match(/\*\*Category:\*\*\s*(.+)/i);
            const category = categoryMatch ? categoryMatch[1].replace(/<[^>]*>?/gm, '').trim() : null;
            
            // Extract Date (matches: **Updated At:** Date or **Date:** Date)
            const dateMatch = text.match(/\*\*(?:Updated At|Date):\*\*\s*(.+)/i);
            const date = dateMatch ? dateMatch[1].replace(/<[^>]*>?/gm, '').trim() : null;
            
            // Calculate dynamic reading time (200 words per minute)
            const words = text.trim().split(/\s+/).length;
            const readingTime = Math.ceil(words / 200);
            const time = `${readingTime} min read`;
            
            // Generate realistic reads count
            const reads = `${Math.floor(Math.random() * 850) + 120} reads`;
            
            fileCache[blog.file] = { author, category, date, time, reads };
          }
        } catch (err) {
          console.error(`Failed to parse metadata from ${blog.file}:`, err);
        }
      }
      
      const cached = fileCache[blog.file];
      if (cached) {
        blog.author = cached.author || "Guest Author";
        blog.category = cached.category || "General";
        blog.date = cached.date || "Recent";
        blog.time = cached.time || "5 min read";
        blog.reads = cached.reads || "100 reads";
        blog.avatar = blog.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(blog.author)}`;
      }
    }
    
    // Initialize base likes count for posts in the map if not already present
    state.blogs.forEach(blog => {
      if (!state.likesMap[blog.id]) {
        state.likesMap[blog.id] = Math.floor(Math.random() * 200) + 50; // Random default starting likes
      }
    });
    saveToLocalStorage();
    
    renderCategoryChips();
    renderBlogGrid();
  } catch (error) {
    console.error('Error initializing application:', error);
    DOM.blogGrid.innerHTML = `
      <div class="error-state">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 40px; color: var(--accent-color); margin-bottom: 12px;"></i>
        <h2>Failed to load articles</h2>
        <p>Please ensure you are serving this folder locally using a web server (e.g. VS Code Live Server or Node http-server).</p>
      </div>
    `;
  }
}

// Save reactive states to storage
function saveToLocalStorage() {
  localStorage.setItem('likedBlogs', JSON.stringify(Array.from(state.likedBlogs)));
  localStorage.setItem('likesMap', JSON.stringify(state.likesMap));
}

// ==========================================================================
// Design Theme Manager
// ==========================================================================
function setupTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = DOM.themeToggle.querySelector('i');
  if (theme === 'dark') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
}

// ==========================================================================
// Routing Architecture
// ==========================================================================
window.addEventListener('hashchange', handleRouting);

function handleRouting() {
  const hash = window.location.hash || '#home';
  
  // Clear navigation active states
  DOM.sideNavHome.classList.remove('active');
  DOM.sideNavLibrary.classList.remove('active');
  DOM.sideNavLiked.classList.remove('active');
  
  if (hash === '#home') {
    showHomeView();
  } else if (hash === '#library') {
    showLibraryView();
  } else if (hash === '#liked') {
    showLikedView();
  } else if (hash.startsWith('#blog/')) {
    const slug = hash.replace('#blog/', '');
    showBlogReaderView(slug);
  } else {
    // Fallback redirect
    window.location.hash = '#home';
  }
}

function showHomeView() {
  // Toggle Views
  DOM.readerView.style.display = 'none';
  DOM.libraryView.style.display = 'none';
  DOM.likedView.style.display = 'none';
  DOM.homeView.style.display = 'block';
  DOM.homeView.classList.add('active');
  
  // Set Active sidebar navigation
  DOM.sideNavHome.classList.add('active');
  
  // Update browser titles (SEO)
  document.title = 'DevBlog - Tech & Coding Articles styled like YouTube';
  
  // Reset Reader scroll progress
  DOM.readingProgressBar.style.width = '0%';
  
  // Scroll main workspace container to top
  DOM.mainContent.scrollTop = 0;
}

function showLibraryView() {
  // Toggle Views
  DOM.homeView.style.display = 'none';
  DOM.readerView.style.display = 'none';
  DOM.likedView.style.display = 'none';
  DOM.libraryView.style.display = 'block';
  DOM.libraryView.classList.add('active');
  
  // Set Active sidebar navigation
  DOM.sideNavLibrary.classList.add('active');
  
  // Update browser title
  document.title = 'Library - DevBlog';
  
  // Render playlist cards
  renderCategoryPlaylists();
  
  // Reset scroll progress
  DOM.readingProgressBar.style.width = '0%';
  DOM.mainContent.scrollTop = 0;
}

function showLikedView() {
  // Toggle Views
  DOM.homeView.style.display = 'none';
  DOM.readerView.style.display = 'none';
  DOM.libraryView.style.display = 'none';
  DOM.likedView.style.display = 'block';
  DOM.likedView.classList.add('active');
  
  // Set Active sidebar navigation
  DOM.sideNavLiked.classList.add('active');
  
  // Update browser title
  document.title = 'Liked Blogs - DevBlog';
  
  // Render liked row card slabs
  renderLikedBlogsList();
  
  // Reset scroll progress
  DOM.readingProgressBar.style.width = '0%';
  DOM.mainContent.scrollTop = 0;
}

async function showBlogReaderView(slug) {
  const blog = state.blogs.find(b => b.slug === slug);
  if (!blog) {
    console.error('Blog post not found for slug:', slug);
    window.location.hash = '#home';
    return;
  }
  
  // Toggle Views
  DOM.homeView.style.display = 'none';
  DOM.libraryView.style.display = 'none';
  DOM.likedView.style.display = 'none';
  DOM.readerView.style.display = 'block';
  DOM.readerView.classList.add('active');
  
  // Set details in header
  document.title = `${blog.title} - DevBlog`;
  
  // Fill Reader Metadata
  DOM.readerCategory.innerText = blog.category;
  DOM.readerTitle.innerText = blog.title;
  DOM.readerAuthorAvatar.src = blog.avatar;
  DOM.readerAuthorName.innerText = blog.author;
  DOM.readerReadsCount.innerText = blog.reads;
  DOM.readerPublishDate.innerText = blog.date;
  DOM.readerReadingTime.innerText = blog.time;
  
  // Setup Dynamic Reader State
  updateReaderInteractiveStates(blog);
  
  // Render Markdown Body Content
  DOM.readerContent.innerHTML = '<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i> Reading markdown file...</div>';
  
  try {
    const response = await fetch(blog.file);
    if (!response.ok) throw new Error('Markdown file could not be fetched');
    let markdown = await response.text();
    
    // Strip leading H1 from Markdown to avoid duplication with reader header title
    markdown = markdown.replace(/^#\s+.+(\r?\n)?/, '');
    
    // Parse Markdown to HTML
    marked.setOptions({
      gfm: true,
      breaks: true
    });
    DOM.readerContent.innerHTML = marked.parse(markdown);
    
    // Trigger Prism Syntax Highlighting
    if (typeof Prism !== 'undefined') {
      Prism.highlightAllUnder(DOM.readerContent);
    }
  } catch (error) {
    console.error('Error rendering markdown content:', error);
    DOM.readerContent.innerHTML = `
      <div class="error-state">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px; color: var(--accent-color); margin-bottom: 8px;"></i>
        <h3>Failed to load blog content</h3>
        <p>Could not fetch the markdown content file (${blog.file}). Make sure file structure exists in workspace.</p>
      </div>
    `;
  }
  
  // Render Related blogs list on sidebar
  renderRelatedPosts(blog);
  
  // Reset scroll and recalculate progress bar
  DOM.mainContent.scrollTop = 0;
  updateScrollProgress();
}

function updateReaderInteractiveStates(blog) {
  // Likes indicator
  DOM.likeCount.innerText = state.likesMap[blog.id] || 100;
  if (state.likedBlogs.has(blog.id)) {
    DOM.likePostBtn.classList.add('active');
    DOM.likePostBtn.querySelector('i').className = 'fa-solid fa-thumbs-up';
  } else {
    DOM.likePostBtn.classList.remove('active');
    DOM.likePostBtn.querySelector('i').className = 'fa-regular fa-thumbs-up';
  }
  
  // Likes action listener
  DOM.likePostBtn.onclick = () => {
    if (state.likedBlogs.has(blog.id)) {
      state.likedBlogs.delete(blog.id);
      state.likesMap[blog.id]--;
      DOM.likePostBtn.classList.remove('active');
      DOM.likePostBtn.querySelector('i').className = 'fa-regular fa-thumbs-up';
    } else {
      state.likedBlogs.add(blog.id);
      state.likesMap[blog.id]++;
      DOM.likePostBtn.classList.add('active');
      DOM.likePostBtn.querySelector('i').className = 'fa-solid fa-thumbs-up';
    }
    DOM.likeCount.innerText = state.likesMap[blog.id];
    saveToLocalStorage();
  };
  
  // Share indicator
  DOM.sharePostBtn.onclick = () => {
    const dummyUrl = window.location.href;
    navigator.clipboard.writeText(dummyUrl).then(() => {
      const originalText = DOM.sharePostBtn.querySelector('span').innerText;
      DOM.sharePostBtn.querySelector('span').innerText = 'Copied!';
      setTimeout(() => {
        DOM.sharePostBtn.querySelector('span').innerText = originalText;
      }, 2000);
    });
  };
}

// ==========================================================================
// Category Chips Renderer
// ==========================================================================
function renderCategoryChips() {
  const categories = ['All', ...new Set(state.blogs.map(b => b.category))];
  
  DOM.chipsContainer.innerHTML = categories.map(category => `
    <button class="chip ${state.currentCategory === category ? 'active' : ''}" 
            data-category="${category}">
      ${category}
    </button>
  `).join('');
  
  // Attach listeners to newly created chip elements
  DOM.chipsContainer.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      DOM.chipsContainer.querySelector('.chip.active').classList.remove('active');
      chip.classList.add('active');
      state.currentCategory = chip.dataset.category;
      state.currentPage = 1;
      renderBlogGrid();
    });
  });
}

// ==========================================================================
// Grid Feed Rendering & Filtering
// ==========================================================================
function calculatePageSize() {
  let columns = 4;
  const width = window.innerWidth;
  
  // 240px sidebar if screen > 768px, 72px if collapsed, none if mobile
  let sidebarWidth = 240;
  if (width <= 768) {
    sidebarWidth = 0;
  } else if (width <= 1200) {
    sidebarWidth = 72;
  }
  
  const padding = width <= 768 ? 32 : 48; // Mobile padding is 16px each side, desktop is 24px each side
  const mainContentWidth = width - sidebarWidth - padding;
  const cardMinWidth = 280;
  const gap = 16;
  columns = Math.floor((mainContentWidth + gap) / (cardMinWidth + gap)) || 1;
  
  return columns * 4; // Exactly 4 rows of blogs!
}

function renderBlogGrid() {
  // Filter core data
  const filtered = state.blogs.filter(blog => {
    const matchesCategory = state.currentCategory === 'All' || blog.category === state.currentCategory;
    const matchesSearch = blog.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                          blog.author.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                          blog.category.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // Render grid output
  if (filtered.length === 0) {
    DOM.blogGrid.innerHTML = `
      <div class="error-state" style="grid-column: 1 / -1; padding: 40px; text-align: center; width: 100%;">
        <i class="fa-solid fa-magnifying-glass" style="font-size: 36px; color: var(--text-sub); margin-bottom: 12px;"></i>
        <h3>No results found</h3>
        <p>Try checking your spelling or selecting another category filter chip.</p>
      </div>
    `;
    DOM.paginationBar.style.display = 'none';
    return;
  }
  
  const pageSize = calculatePageSize();
  const totalPages = Math.ceil(filtered.length / pageSize);
  
  // Safeguard current page bounds
  if (state.currentPage > totalPages) {
    state.currentPage = totalPages;
  }
  if (state.currentPage < 1) {
    state.currentPage = 1;
  }
  
  const startIndex = (state.currentPage - 1) * pageSize;
  const pageBlogs = filtered.slice(startIndex, startIndex + pageSize);
  
  DOM.blogGrid.innerHTML = pageBlogs.map(blog => `
    <article class="blog-card" data-slug="${blog.slug}">
      <div class="thumbnail-wrapper">
        <img src="${blog.thumbnail}" alt="${blog.title}" class="thumbnail-img" loading="lazy">
        <span class="read-time-badge">
          <i class="fa-regular fa-clock"></i> ${blog.time}
        </span>
      </div>
      <div class="card-details">
        <img src="${blog.avatar}" alt="${blog.author}" class="card-avatar">
        <div class="card-meta">
          <h3 class="card-title">${blog.title}</h3>
          <span class="card-author">${blog.author}</span>
          <span class="card-stats">
            ${blog.reads} <span class="dot-separator">•</span> ${blog.date}
          </span>
        </div>
      </div>
    </article>
  `).join('');
  
  // Attach listeners to newly created card elements
  DOM.blogGrid.querySelectorAll('.blog-card').forEach(card => {
    card.addEventListener('click', () => {
      const slug = card.dataset.slug;
      window.location.hash = `#blog/${slug}`;
    });
  });
  
  // Draw the pagination controls
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  if (totalPages <= 1) {
    DOM.paginationBar.style.display = 'none';
    return;
  }
  
  DOM.paginationBar.style.display = 'flex';
  
  let html = '';
  
  // Prev button
  html += `
    <button class="page-btn" ${state.currentPage === 1 ? 'disabled' : ''} id="prev-page-btn" aria-label="Previous Page">
      <i class="fa-solid fa-chevron-left"></i> Prev
    </button>
  `;
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="page-btn ${state.currentPage === i ? 'active' : ''}" data-page="${i}">
        ${i}
      </button>
    `;
  }
  
  // Next button
  html += `
    <button class="page-btn" ${state.currentPage === totalPages ? 'disabled' : ''} id="next-page-btn" aria-label="Next Page">
      Next <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;
  
  DOM.paginationBar.innerHTML = html;
  
  // Page number listeners
  DOM.paginationBar.querySelectorAll('.page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentPage = parseInt(btn.dataset.page);
      renderBlogGrid();
      DOM.mainContent.scrollTop = 0;
    });
  });
  
  // Prev page listener
  const prevBtn = document.getElementById('prev-page-btn');
  if (prevBtn && state.currentPage > 1) {
    prevBtn.addEventListener('click', () => {
      state.currentPage--;
      renderBlogGrid();
      DOM.mainContent.scrollTop = 0;
    });
  }
  
  // Next page listener
  const nextBtn = document.getElementById('next-page-btn');
  if (nextBtn && state.currentPage < totalPages) {
    nextBtn.addEventListener('click', () => {
      state.currentPage++;
      renderBlogGrid();
      DOM.mainContent.scrollTop = 0;
    });
  }
}

// Render the YouTube-like sidebar recommendations inside blog reader view
function renderRelatedPosts(currentBlog) {
  // Show other posts (exclude current)
  const related = state.blogs.filter(b => b.id !== currentBlog.id);
  
  DOM.relatedPostsList.innerHTML = related.map(blog => `
    <div class="related-card" data-slug="${blog.slug}">
      <div class="related-thumb-wrapper">
        <img src="${blog.thumbnail}" alt="${blog.title}" class="related-thumb" loading="lazy">
        <span class="related-badge">${blog.time}</span>
      </div>
      <div class="related-meta">
        <h4 class="related-title">${blog.title}</h4>
        <span class="related-author">${blog.author}</span>
        <span class="related-stats">${blog.reads}</span>
      </div>
    </div>
  `).join('');
  
  // Attach listeners to related post items
  DOM.relatedPostsList.querySelectorAll('.related-card').forEach(card => {
    card.addEventListener('click', () => {
      const slug = card.dataset.slug;
      window.location.hash = `#blog/${slug}`;
    });
  });
}

// ==========================================================================
// Category Playlists Loader (Library View)
// ==========================================================================
function renderCategoryPlaylists() {
  const categories = [...new Set(state.blogs.map(b => b.category))];
  
  DOM.playlistGrid.innerHTML = categories.map(category => {
    const categoryBlogs = state.blogs.filter(b => b.category === category);
    const count = categoryBlogs.length;
    const firstBlog = categoryBlogs[0];
    
    return `
      <div class="playlist-card" data-category="${category}">
        <div class="playlist-thumb-stack">
          <div class="playlist-thumb-container">
            <img src="${firstBlog.thumbnail}" alt="${category}" class="playlist-thumb-img" loading="lazy">
            <div class="playlist-side-overlay">
              <i class="fa-solid fa-list-ul"></i>
              <span>${count} blog${count !== 1 ? 's' : ''}</span>
            </div>
            <div class="playlist-hover-play">
              <i class="fa-solid fa-play"></i>
              <span>PLAY ALL</span>
            </div>
          </div>
        </div>
        <div class="playlist-meta">
          <h3 class="playlist-title">${category}</h3>
          <span class="playlist-subtext">Category Playlist • Updated today</span>
        </div>
      </div>
    `;
  }).join('');
  
  // Attach redirect to chip filter and return home
  DOM.playlistGrid.querySelectorAll('.playlist-card').forEach(card => {
    card.addEventListener('click', () => {
      const category = card.dataset.category;
      state.currentCategory = category;
      
      // Update Chip Active Class
      const chips = DOM.chipsContainer.querySelectorAll('.chip');
      chips.forEach(chip => {
        if (chip.dataset.category === category) {
          chip.classList.add('active');
        } else {
          chip.classList.remove('active');
        }
      });
      
      window.location.hash = '#home';
      renderBlogGrid();
    });
  });
}

// ==========================================================================
// Liked Blogs List Manager (Liked View)
// ==========================================================================
function renderLikedBlogsList() {
  const likedList = state.blogs.filter(blog => state.likedBlogs.has(blog.id));
  
  DOM.likedCountBadge.innerText = `${likedList.length} blog${likedList.length !== 1 ? 's' : ''}`;
  
  if (likedList.length > 0) {
    // Mirror the first liked blog thumbnail in the playlist hero card background
    DOM.likedPlaylistBlur.style.backgroundImage = `url(${likedList[0].thumbnail})`;
    DOM.readFirstLikedBtn.disabled = false;
    
    DOM.readFirstLikedBtn.onclick = () => {
      window.location.hash = `#blog/${likedList[0].slug}`;
    };
    
    DOM.likedRowsList.innerHTML = likedList.map((blog, index) => `
      <div class="liked-row-card" data-slug="${blog.slug}">
        <span class="liked-row-index">${index + 1}</span>
        <div class="liked-row-thumb-wrapper">
          <img src="${blog.thumbnail}" alt="${blog.title}" class="liked-row-thumb" loading="lazy">
        </div>
        <div class="liked-row-meta">
          <h3 class="liked-row-title">${blog.title}</h3>
          <span class="liked-row-author-stats">${blog.author} • ${blog.reads}</span>
        </div>
        <button class="liked-row-remove" data-id="${blog.id}" title="Remove from Liked blogs" aria-label="Remove like">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join('');
    
    // Attach click routing for liked rows
    DOM.likedRowsList.querySelectorAll('.liked-row-card').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.liked-row-remove')) return;
        const slug = row.dataset.slug;
        window.location.hash = `#blog/${slug}`;
      });
    });
    
    // Attach removal actions
    DOM.likedRowsList.querySelectorAll('.liked-row-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        state.likedBlogs.delete(id);
        state.likesMap[id] = Math.max(0, (state.likesMap[id] || 1) - 1);
        saveToLocalStorage();
        renderLikedBlogsList();
      });
    });
  } else {
    DOM.likedPlaylistBlur.style.backgroundImage = 'none';
    DOM.readFirstLikedBtn.disabled = true;
    DOM.likedRowsList.innerHTML = `
      <div class="error-state" style="padding: 40px; text-align: center; width: 100%; border: 1px dashed var(--border-color); border-radius: 16px;">
        <i class="fa-solid fa-thumbs-up" style="font-size: 36px; color: var(--text-sub); margin-bottom: 12px; display: block;"></i>
        <h3 style="margin-bottom: 8px;">No liked blogs yet</h3>
        <p style="color: var(--text-sub); font-size: 14px;">Explore our home feed and click the thumbs-up button on any article to add it here!</p>
      </div>
    `;
  }
}

// ==========================================================================
// Filtering UI Search Control
// ==========================================================================
function performSearch() {
  state.searchQuery = DOM.searchBar.value.trim();
  state.currentPage = 1;
  
  if (state.searchQuery !== '') {
    DOM.searchInfoText.innerText = `Showing results for "${state.searchQuery}"`;
    DOM.searchInfoBar.style.display = 'flex';
  } else {
    DOM.searchInfoBar.style.display = 'none';
  }
  
  // Force router to go home if user is in reader view while searching
  if (window.location.hash !== '#home' && window.location.hash !== '') {
    window.location.hash = '#home';
  }
  
  renderBlogGrid();
}

function clearSearch() {
  DOM.searchBar.value = '';
  state.searchQuery = '';
  DOM.searchInfoBar.style.display = 'none';
  state.currentPage = 1;
  renderBlogGrid();
}

// ==========================================================================
// Scroll Progress Tracker
// ==========================================================================
function updateScrollProgress() {
  if (window.location.hash.startsWith('#blog/')) {
    const scrollTop = DOM.mainContent.scrollTop;
    // Calculate total scrollable height in the container
    const scrollHeight = DOM.mainContent.scrollHeight - DOM.mainContent.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    DOM.readingProgressBar.style.width = `${progress}%`;
  }
}

// ==========================================================================
// Events & UI Triggers Setup
// ==========================================================================
function setupEventListeners() {
  // Search bar logic
  DOM.searchBar.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') performSearch();
  });
  DOM.searchSubmit.addEventListener('click', performSearch);
  DOM.clearSearchBtn.addEventListener('click', clearSearch);
  
  // Theme switch
  DOM.themeToggle.addEventListener('click', toggleTheme);
  
  // Collapsible sidebar
  DOM.sidebarToggle.addEventListener('click', () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      DOM.sidebar.classList.toggle('active-mobile');
    } else {
      DOM.sidebar.classList.toggle('collapsed');
    }
  });
  
  // Scroll monitoring for reading progress bar
  DOM.mainContent.addEventListener('scroll', updateScrollProgress);
  
  // Recalculate dynamic row pagination on window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (DOM.homeView.style.display === 'block') {
        renderBlogGrid();
      }
    }, 200);
  });
}

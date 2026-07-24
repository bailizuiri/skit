/**
 * main.js - Main application logic
 * Handles homepage, theme page, background slideshow, and routing
 */

const App = {
  config: null,
  currentSlide: 0,
  slideTimer: null,

  /**
   * Initialize the application based on current page
   */
  async init() {
    // Load configuration from embedded data (file:// compatible)
    // Falls back to fetch for server environments
    if (typeof CONF_DATA !== 'undefined') {
      this.config = CONF_DATA;
    } else {
      try {
        const res = await fetch('data/conf.json');
        this.config = await res.json();
      } catch (e) {
        console.error('Failed to load conf.json:', e);
        return;
      }
    }

    // Initialize i18n
    await I18N.init();

    // Initialize share module
    Share.init();

    // Bind language switch
    const langBtn = document.getElementById('lang-switch');
    if (langBtn) {
      langBtn.addEventListener('click', () => I18N.toggle());
    }

    // Detect page type and initialize accordingly
    const page = document.body.getAttribute('data-page');
    switch (page) {
      case 'home':
        this.initHomePage();
        break;
      case 'theme':
        this.initThemePage();
        break;
      case 'about':
        this.initAboutPage();
        break;
    }

    // Listen for language changes to re-render dynamic content
    document.addEventListener('langchange', () => {
      if (page === 'theme') this.updateThemeInfo();
    });
  },

  /**
   * Initialize homepage
   */
  initHomePage() {
    this.initBackgroundSlideshow(this.getAllHomeImages());
    this.bindConcertButton();
  },

  /**
   * Initialize theme page
   */
  initThemePage() {
    // Get theme from URL parameter
    const params = new URLSearchParams(window.location.search);
    const themeId = params.get('theme') || 'forest';

    const theme = this.config.themes.find(t => t.id === themeId);
    if (!theme) {
      window.location.href = 'index.html';
      return;
    }

    this.currentTheme = theme;

    // Initialize background slideshow with theme images
    this.initBackgroundSlideshow(theme.images);

    // Initialize audio player with volume from config
    const volume = this.config.settings.defaultVolume || 0.7;
    Player.init(theme.audio, {
      onPlay: () => this.updatePlayButton(true),
      onPause: () => this.updatePlayButton(false),
      onEnded: () => this.updatePlayButton(false)
    }, volume);

    // Setup progress bar interaction
    Player.setupProgressBar();

    // Bind player controls
    this.bindPlayerControls();

    // Update theme info text
    this.updateThemeInfo();

    // Auto play (handle browser autoplay policy gracefully)
    setTimeout(() => {
      Player.play();
      // If autoplay is blocked, show play state as paused
      setTimeout(() => {
        if (!Player.isPlaying) this.updatePlayButton(false);
      }, 300);
    }, 500);
  },

  /**
   * Initialize about page
   */
  initAboutPage() {
    this.initBackgroundSlideshow(this.getAllHomeImages());
  },

  /**
   * Initialize background slideshow with Ken Burns effect
   * @param {string[]} images - Array of image paths
   */
  initBackgroundSlideshow(images) {
    const container = document.getElementById('bg-slideshow');
    if (!container || !images.length) return;

    // Clear existing slides
    container.innerHTML = '';

    // Create slide elements
    images.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'slide' + (i === 0 ? ' active' : '');
      slide.style.backgroundImage = `url('${src}')`;
      container.appendChild(slide);
    });

    this.currentSlide = 0;

    // Start slideshow if multiple images
    if (images.length > 1) {
      const interval = (this.config && this.config.settings && this.config.settings.imageInterval) || 8000;
      this.slideTimer = setInterval(() => {
        this.nextSlide();
      }, interval);
    }
  },

  /**
   * Transition to next slide
   */
  nextSlide() {
    const slides = document.querySelectorAll('#bg-slideshow .slide');
    if (slides.length <= 1) return;

    slides[this.currentSlide].classList.remove('active');
    this.currentSlide = (this.currentSlide + 1) % slides.length;
    slides[this.currentSlide].classList.add('active');
  },

  /**
   * Get all home cover images
   * @returns {string[]} Array of image paths
   */
  getAllHomeImages() {
    if (!this.config) return [];
    return this.config.themes.map(t => t.cover);
  },

  /**
   * Bind the "Start Concert" random button
   */
  bindConcertButton() {
    const btn = document.getElementById('btn-concert');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Click pulse animation
      btn.classList.remove('clicked');
      void btn.offsetWidth; // force reflow
      btn.classList.add('clicked');
      // Navigate after animation
      setTimeout(() => {
        const themes = this.config.themes;
        const random = themes[Math.floor(Math.random() * themes.length)];
        window.location.href = `theme.html?theme=${random.id}`;
      }, 350);
    });

    btn.addEventListener('animationend', () => {
      btn.classList.remove('clicked');
    });
  },

  /**
   * Bind player control buttons
   */
  bindPlayerControls() {
    // Play/Pause button
    const playBtn = document.getElementById('btn-play');
    if (playBtn) {
      playBtn.addEventListener('click', () => Player.toggle());
    }

    // Loop toggle button
    const loopBtn = document.getElementById('btn-loop');
    if (loopBtn) {
      loopBtn.classList.add('active'); // Default loop is on
      loopBtn.addEventListener('click', () => {
        const isLoop = Player.toggleLoop();
        loopBtn.classList.toggle('active', isLoop);
      });
    }

    // Mute toggle button
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const muted = Player.toggleMute();
        muteBtn.classList.toggle('active', muted);
        const iconVol = muteBtn.querySelector('.icon-volume');
        const iconMuted = muteBtn.querySelector('.icon-muted');
        if (iconVol) iconVol.style.display = muted ? 'none' : '';
        if (iconMuted) iconMuted.style.display = muted ? '' : 'none';
        muteBtn.title = I18N.t(muted ? 'player_unmute' : 'player_mute');
      });
    }

    // Speed cycle button
    const speedBtn = document.getElementById('btn-speed');
    if (speedBtn) {
      speedBtn.addEventListener('click', () => {
        Player.cycleSpeed();
        const label = speedBtn.querySelector('.speed-label');
        if (label) label.textContent = Player.getSpeedLabel();
      });
    }

    // Download button
    const downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => Player.download());
    }

    // Next random button with animations
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) {
      // Mouse move for radial gradient tracking
      nextBtn.addEventListener('mousemove', (e) => {
        const rect = nextBtn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        nextBtn.style.setProperty('--x', x + '%');
        nextBtn.style.setProperty('--y', y + '%');
      });
      // Click pulse animation
      nextBtn.addEventListener('click', () => {
        nextBtn.classList.remove('clicked');
        void nextBtn.offsetWidth; // force reflow
        nextBtn.classList.add('clicked');
        setTimeout(() => this.playRandomTheme(), 300);
      });
      nextBtn.addEventListener('animationend', () => {
        nextBtn.classList.remove('clicked');
      });
    }
  },

  /**
   * Navigate to a random different theme
   */
  playRandomTheme() {
    const themes = this.config.themes;
    const others = themes.filter(t => t.id !== this.currentTheme.id);
    const random = others[Math.floor(Math.random() * others.length)];
    window.location.href = `theme.html?theme=${random.id}`;
  },

  /**
   * Update play/pause button icon
   * @param {boolean} playing - Whether audio is playing
   */
  updatePlayButton(playing) {
    const btn = document.getElementById('btn-play');
    if (!btn) return;

    if (playing) {
      btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>';
      btn.title = I18N.t('player_pause');
    } else {
      btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
      btn.title = I18N.t('player_play');
    }
  },

  /**
   * Update theme info section based on current language
   */
  updateThemeInfo() {
    if (!this.currentTheme) return;

    const lang = I18N.currentLang;
    const info = this.currentTheme.info[lang];

    const titleEl = document.getElementById('theme-title');
    const locationEl = document.getElementById('theme-location');
    const timeEl = document.getElementById('theme-time');
    const descEl = document.getElementById('theme-desc');

    if (titleEl) titleEl.textContent = info.title;
    if (locationEl) locationEl.textContent = info.location;
    if (timeEl) timeEl.textContent = info.time;
    if (descEl) descEl.textContent = info.description;
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

/**
 * player.js - Audio Player Module
 * Handles audio playback with progress bar, loop, and seek functionality
 */

const Player = {
  audio: null,
  isPlaying: false,
  isLoop: true,
  isMuted: false,
  currentTheme: null,
  onStateChange: null,
  speeds: [0.5, 0.75, 1, 1.25, 1.5, 2],
  speedIndex: 2, // default 1x

  /**
   * Initialize the audio player
   * @param {string} audioSrc - Path to audio file
   * @param {object} callbacks - State change callbacks
   * @param {number} volume - Default volume (0-1)
   */
  init(audioSrc, callbacks = {}, volume = 0.7) {
    this.onStateChange = callbacks;

    // Create audio element
    this.audio = new Audio(audioSrc);
    this.audio.loop = this.isLoop;
    this.audio.preload = 'auto';
    this.audio.volume = volume;

    // Bind events
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.onEnded());
    this.audio.addEventListener('loadedmetadata', () => this.onLoaded());
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      if (this.onStateChange.onPlay) this.onStateChange.onPlay();
    });
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      if (this.onStateChange.onPause) this.onStateChange.onPause();
    });
  },

  /**
   * Play the audio
   */
  play() {
    if (this.audio) {
      this.audio.play().catch(e => console.warn('Playback failed:', e));
    }
  },

  /**
   * Pause the audio
   */
  pause() {
    if (this.audio) {
      this.audio.pause();
    }
  },

  /**
   * Toggle play/pause
   */
  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  },

  /**
   * Toggle loop mode
   * @returns {boolean} New loop state
   */
  toggleLoop() {
    this.isLoop = !this.isLoop;
    if (this.audio) {
      this.audio.loop = this.isLoop;
    }
    return this.isLoop;
  },

  /**
   * Seek to a specific time
   * @param {number} time - Time in seconds
   */
  seek(time) {
    if (this.audio && this.audio.duration) {
      this.audio.currentTime = time;
    }
  },

  /**
   * Seek by percentage (0-1)
   * @param {number} percent - Percentage of total duration
   */
  seekPercent(percent) {
    if (this.audio && this.audio.duration) {
      this.audio.currentTime = this.audio.duration * percent;
    }
  },

  /**
   * Update progress bar UI
   */
  updateProgress() {
    if (!this.audio) return;

    const current = this.audio.currentTime;
    const duration = this.audio.duration || 0;
    const percent = duration > 0 ? (current / duration) * 100 : 0;

    // Update progress fill
    const fill = document.getElementById('progress-fill');
    if (fill) {
      fill.style.width = percent + '%';
    }

    // Update time display
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration-time');
    if (currentTimeEl) currentTimeEl.textContent = this.formatTime(current);
    if (durationEl) durationEl.textContent = this.formatTime(duration);
  },

  /**
   * Handle audio ended event
   */
  onEnded() {
    if (!this.isLoop) {
      this.isPlaying = false;
      if (this.onStateChange.onEnded) this.onStateChange.onEnded();
    }
  },

  /**
   * Handle metadata loaded
   */
  onLoaded() {
    this.updateProgress();
    if (this.onStateChange.onLoaded) this.onStateChange.onLoaded();
  },

  /**
   * Format seconds to mm:ss
   * @param {number} seconds
   * @returns {string} Formatted time string
   */
  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  },

  /**
   * Setup progress bar click/drag interaction
   */
  setupProgressBar() {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;

    let isDragging = false;

    const getPercent = (e) => {
      const rect = bar.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      let percent = (clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(1, percent));
    };

    // Mouse events
    bar.addEventListener('mousedown', (e) => {
      isDragging = true;
      this.seekPercent(getPercent(e));
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        this.seekPercent(getPercent(e));
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch events for mobile
    bar.addEventListener('touchstart', (e) => {
      isDragging = true;
      this.seekPercent(getPercent(e));
    });

    bar.addEventListener('touchmove', (e) => {
      if (isDragging) {
        e.preventDefault();
        this.seekPercent(getPercent(e));
      }
    });

    bar.addEventListener('touchend', () => {
      isDragging = false;
    });
  },

  /**
   * Toggle mute/unmute
   * @returns {boolean} New mute state
   */
  toggleMute() {
    if (!this.audio) return this.isMuted;
    this.isMuted = !this.isMuted;
    this.audio.muted = this.isMuted;
    return this.isMuted;
  },

  /**
   * Cycle playback speed
   * @returns {number} New playback rate
   */
  cycleSpeed() {
    this.speedIndex = (this.speedIndex + 1) % this.speeds.length;
    const rate = this.speeds[this.speedIndex];
    if (this.audio) {
      this.audio.playbackRate = rate;
    }
    return rate;
  },

  /**
   * Get current speed label
   * @returns {string}
   */
  getSpeedLabel() {
    return this.speeds[this.speedIndex] + 'x';
  },

  /**
   * Download current audio file
   */
  download() {
    if (!this.audio || !this.audio.src) return;
    const a = document.createElement('a');
    a.href = this.audio.src;
    const filename = this.audio.src.split('/').pop() || 'audio.wav';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  /**
   * Destroy player and clean up
   */
  destroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    this.isPlaying = false;
    this.isMuted = false;
    this.speedIndex = 2;
  }
};

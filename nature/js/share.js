/**
 * share.js - Share functionality module
 * Provides share modal with copy link and multiple social platform sharing
 */

const Share = {
  /**
   * Initialize share functionality
   * Binds share buttons and modal interactions
   */
  init() {
    // Bind all share trigger buttons
    document.querySelectorAll('[data-share]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal();
      });
    });

    // Bind close button
    const closeBtn = document.getElementById('share-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    // Close on backdrop click
    const modal = document.getElementById('share-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    // Bind copy link button
    const copyBtn = document.getElementById('share-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyLink());
    }

    // Bind all platform share buttons via data-platform attribute
    document.querySelectorAll('.platform-btn[data-platform]').forEach(btn => {
      btn.addEventListener('click', () => {
        const platform = btn.getAttribute('data-platform');
        this.shareToPlatform(platform);
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  },

  /**
   * Open the share modal and populate URL field
   */
  openModal() {
    const modal = document.getElementById('share-modal');
    const urlInput = document.getElementById('share-url');
    if (urlInput) {
      urlInput.value = window.location.href;
    }
    if (modal) {
      modal.classList.add('active');
    }
  },

  /**
   * Close the share modal
   */
  closeModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  },

  /**
   * Copy current page URL to clipboard
   */
  async copyLink() {
    const url = window.location.href;
    const copyBtn = document.getElementById('share-copy');

    try {
      await navigator.clipboard.writeText(url);
      this.showCopied(copyBtn);
    } catch (e) {
      // Fallback for older browsers or file:// protocol
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.showCopied(copyBtn);
    }
  },

  /**
   * Show copied feedback on button
   */
  showCopied(btn) {
    if (!btn) return;
    btn.classList.add('copied');
    btn.textContent = I18N.t('share_copied');
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.textContent = I18N.t('share_copy_link');
    }, 2000);
  },

  /**
   * Route sharing to the appropriate platform
   * @param {string} platform - Platform identifier
   */
  shareToPlatform(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(I18N.t('site_title'));
    const text = encodeURIComponent(I18N.t('site_subtitle'));
    const popup = 'width=600,height=500,scrollbars=yes,resizable=yes';

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      github: `https://github.com/new?title=${title}&body=${text}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      whatsapp: `https://api.whatsapp.com/send?text=${text}%20${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      reddit: `https://www.reddit.com/submit?url=${url}&title=${title}`,
      weibo: `https://service.weibo.com/share/share.php?url=${url}&title=${text}`,
      email: `mailto:?subject=${title}&body=${text}%0A%0A${url}`
    };

    const shareUrl = shareUrls[platform];
    if (!shareUrl) return;

    if (platform === 'email') {
      window.location.href = shareUrl;
    } else if (platform === 'whatsapp') {
      // WhatsApp works better with _blank
      window.open(shareUrl, '_blank');
    } else {
      window.open(shareUrl, '_blank', popup);
    }

    this.closeModal();
  }
};

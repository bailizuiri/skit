/**
 * i18n.js - Internationalization module
 * Handles language switching with browser memory (localStorage)
 * Default language: English
 */

const I18N = {
  currentLang: 'en',
  translations: null,

  /**
   * Initialize i18n module
   * Loads translations from embedded data or fetches from JSON
   */
  async init() {
    // Use embedded data for file:// protocol compatibility
    if (typeof I18N_DATA !== 'undefined') {
      this.translations = I18N_DATA;
    } else {
      try {
        const res = await fetch('data/I18N.json');
        this.translations = await res.json();
      } catch (e) {
        console.error('Failed to load I18N.json:', e);
        return;
      }
    }

    // Restore saved language from localStorage
    const saved = localStorage.getItem('nature_lang');
    if (saved && this.translations[saved]) {
      this.currentLang = saved;
    }

    this.apply();
  },

  /**
   * Get translated string by key
   * @param {string} key - Translation key
   * @returns {string} Translated text
   */
  t(key) {
    if (!this.translations) return key;
    const lang = this.translations[this.currentLang];
    return lang && lang[key] ? lang[key] : key;
  },

  /**
   * Switch language and persist to localStorage
   * @param {string} lang - Language code ('en' or 'zh')
   */
  switchLang(lang) {
    if (!this.translations || !this.translations[lang]) return;
    this.currentLang = lang;
    localStorage.setItem('nature_lang', lang);
    this.apply();
  },

  /**
   * Toggle between en and zh
   */
  toggle() {
    const next = this.currentLang === 'en' ? 'zh' : 'en';
    this.switchLang(next);
  },

  /**
   * Apply translations to all elements with data-i18n attribute
   */
  apply() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    });

    // Update all elements with data-i18n-title (tooltip)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = this.t(el.getAttribute('data-i18n-title'));
    });

    // Update page title
    const titleEl = document.querySelector('[data-i18n-page-title]');
    if (titleEl) {
      document.title = this.t(titleEl.getAttribute('data-i18n-page-title'));
    }

    // Update language switch button text
    const langBtn = document.getElementById('lang-switch');
    if (langBtn) {
      langBtn.textContent = this.t('lang_switch');
    }

    // Update html lang attribute
    document.documentElement.lang = this.currentLang;

    // Dispatch event for other modules to react
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: this.currentLang } }));
  }
};

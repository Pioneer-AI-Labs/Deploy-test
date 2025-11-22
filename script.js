// JSON ↔ TOML Converter
// Simple, elegant, functional, and ACTUALLY WORKS

class Converter {
  constructor() {
    // DOM elements
    this.inputArea = document.getElementById('inputArea');
    this.outputArea = document.getElementById('outputArea');
    this.inputLabel = document.getElementById('inputLabel');
    this.outputLabel = document.getElementById('outputLabel');
    this.jsonToTomlBtn = document.getElementById('jsonToTomlBtn');
    this.tomlToJsonBtn = document.getElementById('tomlToJsonBtn');
    this.copyBtn = document.getElementById('copyBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.sampleBtn = document.getElementById('sampleBtn');

    // State
    this.direction = 'jsonToToml';
    this.debounceTimer = null;
    this.TOML = null;

    // Create toast container
    this.createToastContainer();

    this.init();
  }

  createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
    this.toastContainer = container;
  }

  async init() {
    // Show loading state
    this.showToast('Loading TOML library...', 'info');

    // Load TOML library - using browser-compatible UMD build
    const loaded = await this.loadTOMLLibrary();

    if (!loaded) {
      this.showToast('Failed to load TOML library. Please refresh the page.', 'error', 0);
      return;
    }

    this.showToast('Ready!', 'success', 1500);

    // Event listeners
    this.jsonToTomlBtn.addEventListener('click', () => this.setDirection('jsonToToml'));
    this.tomlToJsonBtn.addEventListener('click', () => this.setDirection('tomlToJson'));
    this.inputArea.addEventListener('input', () => this.handleInput());
    this.copyBtn.addEventListener('click', () => this.copy());
    this.clearBtn.addEventListener('click', () => this.clear());
    this.sampleBtn.addEventListener('click', () => this.loadSample());

    // Load sample on start
    this.loadSample();
  }

  async loadTOMLLibrary() {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      // Using smol-toml from jsDelivr - ES module build
      script.type = 'module';
      script.textContent = `
        import TOML from 'https://cdn.jsdelivr.net/npm/smol-toml@1.3.1/dist/index.min.mjs';
        window.TOML = TOML;
        window.dispatchEvent(new Event('toml-loaded'));
      `;

      window.addEventListener('toml-loaded', () => {
        this.TOML = window.TOML;
        if (this.TOML && this.TOML.parse && this.TOML.stringify) {
          resolve(true);
        } else {
          resolve(false);
        }
      }, { once: true });

      script.onerror = () => {
        console.error('Failed to load TOML library');
        resolve(false);
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.TOML) {
          script.remove();
          resolve(false);
        }
      }, 10000);

      document.head.appendChild(script);
    });
  }

  setDirection(direction) {
    this.direction = direction;

    // Update button states
    this.jsonToTomlBtn.classList.toggle('active', direction === 'jsonToToml');
    this.tomlToJsonBtn.classList.toggle('active', direction === 'tomlToJson');

    // Update ARIA pressed state
    this.jsonToTomlBtn.setAttribute('aria-pressed', direction === 'jsonToToml');
    this.tomlToJsonBtn.setAttribute('aria-pressed', direction === 'tomlToJson');

    // Update labels
    if (direction === 'jsonToToml') {
      this.inputLabel.textContent = 'JSON Input';
      this.outputLabel.textContent = 'TOML Output';
      this.inputArea.placeholder = 'Paste your JSON here...';
    } else {
      this.inputLabel.textContent = 'TOML Input';
      this.outputLabel.textContent = 'JSON Output';
      this.inputArea.placeholder = 'Paste your TOML here...';
    }

    // Swap content
    const temp = this.inputArea.value;
    this.inputArea.value = this.outputArea.value;
    this.outputArea.value = temp;

    // Convert
    this.convert();
  }

  handleInput() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.convert(), 400);
  }

  convert() {
    if (!this.TOML) {
      this.showToast('TOML library not loaded yet', 'error');
      return;
    }

    const input = this.inputArea.value.trim();

    if (!input) {
      this.outputArea.value = '';
      this.inputArea.removeAttribute('aria-invalid');
      return;
    }

    // File size check - warn if over 500KB
    if (input.length > 500000) {
      this.showToast('Large input detected - conversion may be slow', 'warning', 3000);
    }

    try {
      if (this.direction === 'jsonToToml') {
        const obj = JSON.parse(input);
        this.outputArea.value = this.TOML.stringify(obj);
      } else {
        const obj = this.TOML.parse(input);
        this.outputArea.value = JSON.stringify(obj, null, 2);
      }
      this.inputArea.removeAttribute('aria-invalid');
    } catch (error) {
      this.inputArea.setAttribute('aria-invalid', 'true');
      const formatType = this.direction === 'jsonToToml' ? 'JSON' : 'TOML';
      this.showToast(`Invalid ${formatType}: ${error.message}`, 'error', 5000);
    }
  }

  async copy() {
    const text = this.outputArea.value;
    if (!text.trim()) {
      this.showToast('Nothing to copy!', 'warning');
      return;
    }

    try {
      // Check if clipboard API is available (requires HTTPS)
      if (!navigator.clipboard) {
        // Fallback for HTTP or old browsers
        this.fallbackCopy(text);
        return;
      }

      await navigator.clipboard.writeText(text);
      this.showToast('Copied to clipboard!', 'success');
    } catch (error) {
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    // Old-school copy method
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      this.showToast('Copied to clipboard!', 'success');
    } catch (err) {
      this.showToast('Copy failed - please copy manually', 'error');
    }

    document.body.removeChild(textarea);
  }

  clear() {
    // Confirm before clearing if there's content
    if (this.inputArea.value.trim() || this.outputArea.value.trim()) {
      if (!confirm('Clear all content? This cannot be undone.')) {
        return;
      }
    }

    this.inputArea.value = '';
    this.outputArea.value = '';
    this.inputArea.removeAttribute('aria-invalid');
    this.showToast('Cleared', 'success');
  }

  loadSample() {
    // Confirm before overwriting if there's existing content
    if (this.inputArea.value.trim() && this.inputArea.value !== this.getLastSample()) {
      if (!confirm('Load example? This will replace your current input.')) {
        return;
      }
    }

    const sample = {
      "name": "my-app",
      "version": "1.0.0",
      "description": "A sample application",
      "dependencies": {
        "express": "^4.18.0",
        "react": "^18.2.0"
      },
      "config": {
        "port": 3000,
        "host": "localhost",
        "debug": true
      },
      "scripts": [
        "start",
        "build",
        "test"
      ]
    };

    this.lastSample = JSON.stringify(sample, null, 2);
    this.inputArea.value = this.lastSample;
    this.convert();
  }

  getLastSample() {
    return this.lastSample || '';
  }

  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    this.toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto-remove after duration (0 = permanent)
    if (duration > 0) {
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new Converter();
});

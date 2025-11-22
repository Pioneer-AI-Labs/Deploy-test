// JSON ↔ TOML Converter
// Uses smol-toml library from CDN

class Converter {
  constructor() {
    // DOM elements
    this.jsonInput = document.getElementById('jsonInput');
    this.tomlInput = document.getElementById('tomlInput');
    this.errorDisplay = document.getElementById('errorDisplay');

    // State
    this.lastEditedSide = 'json';
    this.debounceTimer = null;
    this.TOML = null; // Will be loaded from CDN

    // Initialize
    this.init();
  }

  async init() {
    // Wait for TOML library to load
    await this.waitForTOML();

    // Event listeners
    this.jsonInput.addEventListener('input', () => this.handleInput('json'));
    this.tomlInput.addEventListener('input', () => this.handleInput('toml'));

    document.getElementById('copyJson').addEventListener('click', () => this.copyToClipboard('json'));
    document.getElementById('copyToml').addEventListener('click', () => this.copyToClipboard('toml'));
    document.getElementById('loadSample').addEventListener('click', () => this.loadSample());
    document.getElementById('clearAll').addEventListener('click', () => this.clearAll());

    // Load sample on first visit
    this.loadSample();
  }

  async waitForTOML() {
    // Wait for smol-toml to be available
    return new Promise((resolve) => {
      const checkTOML = setInterval(() => {
        if (window.TOML && window.TOML.parse && window.TOML.stringify) {
          this.TOML = window.TOML;
          clearInterval(checkTOML);
          resolve();
        }
      }, 50);
    });
  }

  handleInput(side) {
    this.lastEditedSide = side;
    this.clearError();

    // Debounce conversion
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.convert(side);
    }, 300);
  }

  convert(from) {
    try {
      if (from === 'json') {
        this.jsonToToml();
      } else {
        this.tomlToJson();
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  jsonToToml() {
    const jsonText = this.jsonInput.value.trim();

    if (!jsonText) {
      this.tomlInput.value = '';
      return;
    }

    try {
      // Parse JSON
      const jsonObj = JSON.parse(jsonText);

      // Convert to TOML
      const tomlText = this.TOML.stringify(jsonObj);
      this.tomlInput.value = tomlText;

    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON: ${error.message}`);
      }
      throw new Error(`Conversion error: ${error.message}`);
    }
  }

  tomlToJson() {
    const tomlText = this.tomlInput.value.trim();

    if (!tomlText) {
      this.jsonInput.value = '';
      return;
    }

    try {
      // Parse TOML
      const tomlObj = this.TOML.parse(tomlText);

      // Convert to JSON with pretty formatting
      const jsonText = JSON.stringify(tomlObj, null, 2);
      this.jsonInput.value = jsonText;

    } catch (error) {
      throw new Error(`Invalid TOML: ${error.message}`);
    }
  }

  async copyToClipboard(side) {
    const text = side === 'json' ? this.jsonInput.value : this.tomlInput.value;

    if (!text.trim()) {
      this.showError('Nothing to copy!');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.showSuccess(`${side.toUpperCase()} copied to clipboard!`);
    } catch (error) {
      this.showError('Failed to copy to clipboard');
    }
  }

  loadSample() {
    const sampleJson = {
      "app": {
        "name": "JSON-TOML Converter",
        "version": "1.0.0",
        "description": "A simple and elegant converter"
      },
      "features": [
        "Bi-directional conversion",
        "Live updates",
        "Copy to clipboard",
        "Error handling"
      ],
      "config": {
        "theme": "light",
        "debounce": 300,
        "autoConvert": true
      },
      "metadata": {
        "created": "2025-11-22",
        "author": "Claude"
      }
    };

    this.jsonInput.value = JSON.stringify(sampleJson, null, 2);
    this.lastEditedSide = 'json';
    this.convert('json');
  }

  clearAll() {
    this.jsonInput.value = '';
    this.tomlInput.value = '';
    this.clearError();
  }

  showError(message) {
    this.errorDisplay.textContent = `❌ ${message}`;
    this.errorDisplay.className = 'message error';
    this.errorDisplay.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => this.clearError(), 5000);
  }

  showSuccess(message) {
    this.errorDisplay.textContent = `✓ ${message}`;
    this.errorDisplay.className = 'message success';
    this.errorDisplay.style.display = 'block';

    // Auto-hide after 2 seconds
    setTimeout(() => this.clearError(), 2000);
  }

  clearError() {
    this.errorDisplay.style.display = 'none';
    this.errorDisplay.textContent = '';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.converter = new Converter();
});

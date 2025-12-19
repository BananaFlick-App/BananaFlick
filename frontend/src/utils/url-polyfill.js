// URL polyfill for Hermes engine
// Hermes doesn't fully support URL.protocol, so we provide a minimal polyfill

(function() {
  // Check if URL exists but protocol is not implemented
  let needsPolyfill = false;
  
  if (typeof URL === 'undefined') {
    needsPolyfill = true;
  } else {
    try {
      // Try to access protocol on a test URL
      const testUrl = new URL('https://example.com');
      const protocol = testUrl.protocol; // This might throw in Hermes
      if (typeof protocol === 'undefined') {
        needsPolyfill = true;
      }
    } catch (e) {
      // If accessing protocol throws, we need the polyfill
      needsPolyfill = true;
    }
  }
  
  if (needsPolyfill) {
    // Minimal URL polyfill for Hermes
    const OriginalURL = global.URL;
    
    global.URL = class URL {
      constructor(url, base) {
        if (typeof url !== 'string') {
          throw new TypeError('URL constructor: url must be a string');
        }
        
        // If base is provided, resolve relative URL
        if (base) {
          if (OriginalURL) {
            try {
              const resolved = new OriginalURL(url, base);
              url = resolved.href;
            } catch (e) {
              // Fall through to manual parsing
            }
          }
        }
        
        // Simple URL parsing
        const match = url.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/);
        if (!match) {
          throw new TypeError('Invalid URL');
        }
        
        this.href = url;
        this.protocol = match[2] ? match[2] + ':' : '';
        this.host = match[4] || '';
        this.hostname = match[4] ? match[4].split(':')[0] : '';
        this.port = match[4] && match[4].includes(':') ? match[4].split(':')[1] : '';
        this.pathname = match[5] || '/';
        this.search = match[6] || '';
        this.hash = match[8] ? '#' + match[8] : '';
        this.origin = this.protocol + '//' + this.host;
      }
      
      toString() {
        return this.href;
      }
    };
    
    // Copy static methods if they exist
    if (OriginalURL && OriginalURL.createObjectURL) {
      global.URL.createObjectURL = OriginalURL.createObjectURL;
    }
    if (OriginalURL && OriginalURL.revokeObjectURL) {
      global.URL.revokeObjectURL = OriginalURL.revokeObjectURL;
    }
  }
})();


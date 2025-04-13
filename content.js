// content.js
(() => {
  // Track converted images to avoid re-processing
  const processedImages = new Set();
  let settings = {
    enabled: true,
    quality: 100,
    redditBypass: true
  };
  
  // Load settings
  chrome.storage.local.get(['settings'], (result) => {
    if (result.settings) {
      settings = result.settings;
    }
  });
  
  // Listen for settings updates
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings) {
      settings = changes.settings.newValue;
    }
  });
  
  // Image URL patterns to detect WebP
  const WEBP_PATTERNS = [
    /\.webp($|\?)/i,
    /format=webp/i,
    /fm=webp/i,
    /&webp=*/i,
    /\?webp/i
  ];
  
  // Reddit specific patterns
  const REDDIT_PATTERNS = [
    /preview\.redd\.it/i,
    /i\.redd\.it/i,
    /redditmedia\.com/i
  ];
  
  // Function to check if URL is WebP
  function isWebPUrl(url) {
    return WEBP_PATTERNS.some(pattern => pattern.test(url));
  }
  
  // Function to check if URL is from Reddit
  function isRedditUrl(url) {
    return REDDIT_PATTERNS.some(pattern => pattern.test(url));
  }
  
  // Process all image elements
  function processImages() {
    if (!settings.enabled) return;
    
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (processedImages.has(img)) return;
      
      const src = img.src || img.getAttribute('src') || '';
      if (!src) return;
      
      // Check if image is WebP or from Reddit
      if (isWebPUrl(src) || (settings.redditBypass && isRedditUrl(src))) {
        processedImages.add(img);
        replaceWebPImage(img, src);
      }
    });
  }
  
  // Replace WebP image with PNG
  async function replaceWebPImage(imgElement, url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Create a new image from the blob
      const img = new Image();
      const blobUrl = URL.createObjectURL(blob);
      
      img.onload = function() {
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Convert to PNG with specified quality
        const dataUrl = canvas.toDataURL('image/png', settings.quality / 100);
        
        // Replace the original image with the converted PNG
        imgElement.src = dataUrl;
        
        // Clean up
        URL.revokeObjectURL(blobUrl);
        
        // Update stats
        updateStats(blob.size);
      };
      
      img.onerror = function() {
        URL.revokeObjectURL(blobUrl);
      };
      
      img.src = blobUrl;
    } catch (error) {
      console.error('Error converting WebP to PNG:', error);
    }
  }
  
  // Update statistics
  function updateStats(originalSize) {
    chrome.storage.local.get(['stats'], function(result) {
      const stats = result.stats || { killCount: 0, spaceSaved: 0 };
      stats.killCount++;
      stats.spaceSaved += originalSize;
      chrome.storage.local.set({ stats });
    });
  }
  
  // Monitor DOM changes to catch dynamically loaded images
  const observer = new MutationObserver((mutations) => {
    let hasNewImages = false;
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        hasNewImages = true;
      }
    });
    
    if (hasNewImages) {
      processImages();
    }
  });
  
  // Intercept XMLHttpRequest to modify headers
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if (settings.enabled && (isWebPUrl(url) || (settings.redditBypass && isRedditUrl(url)))) {
      this.addEventListener('readystatechange', function() {
        if (this.readyState === this.HEADERS_RECEIVED) {
          // Add a header to prevent WebP content
          this.setRequestHeader('Accept', 'image/png,image/*,*/*;q=0.8');
        }
      });
    }
    
    return originalOpen.call(this, method, url, ...args);
  };
  
  // Intercept fetch to modify headers
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    if (settings.enabled && typeof input === 'string' && 
        (isWebPUrl(input) || (settings.redditBypass && isRedditUrl(input)))) {
      
      init = init || {};
      init.headers = init.headers || {};
      
      // Add headers to prevent WebP content
      init.headers = {
        ...init.headers,
        'Accept': 'image/png,image/*,*/*;q=0.8'
      };
    }
    
    return originalFetch.call(this, input, init);
  };
  
  // Process images when page loads
  document.addEventListener('DOMContentLoaded', processImages);
  window.addEventListener('load', processImages);
  
  // Start observing document changes
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  // Process images immediately in case some are already loaded
  processImages();
})();

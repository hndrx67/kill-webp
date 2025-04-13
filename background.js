// background.js
let settings = {
  enabled: true,
  quality: 100,
  notificationsEnabled: true,
  autoDownload: true,
  redditBypass: true
};

// Load settings from storage
chrome.storage.local.get(['settings'], (result) => {
  if (result.settings) {
    settings = result.settings;
  } else {
    // Save default settings
    chrome.storage.local.set({ settings });
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

// Function to create modified headers to force PNG
function createModifiedHeaders(headers) {
  const newHeaders = headers.filter(header => {
    const name = header.name.toLowerCase();
    return name !== 'accept' && name !== 'content-type';
  });
  
  newHeaders.push({
    name: 'Accept',
    value: 'image/png,image/*,*/*;q=0.8'
  });
  
  return newHeaders;
}

// Intercept webRequest and modify headers
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    if (!settings.enabled) return { requestHeaders: details.requestHeaders };
    
    // Check if this is an image request and potentially WebP
    if (isWebPUrl(details.url) || (settings.redditBypass && isRedditUrl(details.url))) {
      return {
        requestHeaders: createModifiedHeaders(details.requestHeaders)
      };
    }
    
    return { requestHeaders: details.requestHeaders };
  },
  { urls: ["<all_urls>"] },
  ["blocking", "requestHeaders"]
);

// Extract filename from URL
function extractFilenameFromUrl(url) {
  try {
    // Try to get the filename from the URL path
    const urlObj = new URL(url);
    let path = urlObj.pathname;
    
    // Get the last segment of the path
    let segments = path.split('/');
    let filename = segments[segments.length - 1];
    
    // If filename is empty, generate a default name
    if (!filename || filename === '') {
      filename = 'image';
    }
    
    // Remove query parameters if present
    if (filename.includes('?')) {
      filename = filename.split('?')[0];
    }
    
    // Decode URI components to handle special characters
    filename = decodeURIComponent(filename);
    
    // Generate a random name if filename still empty
    if (!filename || filename === '') {
      filename = 'image_' + Date.now();
    }
    
    return filename;
  } catch (error) {
    console.error('Error extracting filename:', error);
    return 'image_' + Date.now();
  }
}

// Handle download requests
chrome.downloads.onDeterminingFilename.addListener(function(item, suggest) {
  if (!settings.enabled) {
    suggest();
    return;
  }
  
  // Check if this is a WebP image or from Reddit
  if (isWebPUrl(item.url) || item.filename.toLowerCase().endsWith('.webp') || 
      (settings.redditBypass && isRedditUrl(item.url))) {
    
    // Ensure we have a valid filename
    let filename = item.filename;
    if (!filename || filename === '') {
      filename = extractFilenameFromUrl(item.url);
      
      // If still empty, generate a default
      if (!filename || filename === '') {
        filename = 'image_' + Date.now();
      }
    }
    
    // Extract the filename without extension
    if (filename.toLowerCase().endsWith('.webp')) {
      filename = filename.slice(0, -5);
    } else if (filename.includes('.')) {
      // Remove any existing extension
      filename = filename.substring(0, filename.lastIndexOf('.'));
    }
    
    // Add PNG extension
    filename = filename + '.png';
    
    // Create an offscreen document to handle image conversion
    chrome.offscreen.createDocument({
      url: 'converter.html',
      reasons: ['IFRAME_SCRIPTING'],
      justification: 'Converting WebP image to PNG'
    }).then(() => {
      // Send message to offscreen document to convert the image
      chrome.runtime.sendMessage({
        target: 'offscreen',
        action: 'convertWebPToPNG',
        data: {
          url: item.url,
          filename: filename,
          quality: settings.quality,
          autoDownload: settings.autoDownload
        }
      });
    }).catch(error => {
      console.error('Error creating offscreen document:', error);
    });
    
    // Cancel the original download
    chrome.downloads.cancel(item.id, () => {
      // Handle any error from canceling
      if (chrome.runtime.lastError) {
        console.log('Cancel error:', chrome.runtime.lastError.message);
      }
    });
    
    // Cancel the suggest operation
    suggest({ cancel: true });
  } else {
    // Not a WebP image, proceed with the original download
    suggest();
  }
});

// Listen for messages from offscreen document and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    sendResponse({ settings });
  } else if (request.action === 'updateSettings') {
    settings = request.settings;
    chrome.storage.local.set({ settings });
    sendResponse({ success: true });
  } else if (request.action === 'downloadConverted') {
    // Handle the converted image download
    chrome.downloads.download({
      url: request.dataUrl,
      filename: request.filename,
      saveAs: !settings.autoDownload
    }, (downloadId) => {
      // Check for errors
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError);
      }
      
      // Close the offscreen document
      chrome.offscreen.closeDocument();
      
      // Show notification if enabled
      if (settings.notificationsEnabled) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'KillWEBP',
          message: `Converted "${request.filename}" to PNG`
        });
      }
      
      // Update stats
      updateStats();
    });
    sendResponse({ success: true });
  }
  return true;
});

// Update statistics
function updateStats() {
  chrome.storage.local.get(['stats'], function(result) {
    const stats = result.stats || { killCount: 0, spaceSaved: 0 };
    stats.killCount++;
    stats.spaceSaved += 50000; // Rough estimate of bytes saved
    chrome.storage.local.set({ stats });
  });
}
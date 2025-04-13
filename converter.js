
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.target === 'offscreen' && request.action === 'convertWebPToPNG') {
      convertWebPToPNG(request.data);
      return true;
    }
  });
  
  // Function to convert WebP to PNG
  function convertWebPToPNG(data) {
    const { url, filename, quality, autoDownload } = data;
    
    console.log('Converting image:', url);
    console.log('Target filename:', filename);
    
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const img = new Image();
        const blobUrl = URL.createObjectURL(blob);
        
        img.onload = function() {
          // Create canvas and draw image
          const canvas = document.getElementById('conversionCanvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          // Convert to PNG with specified quality
          const dataUrl = canvas.toDataURL('image/png', quality / 100);
          URL.revokeObjectURL(blobUrl);
          
          // Send the converted image back to the background script
          chrome.runtime.sendMessage({
            action: 'downloadConverted',
            dataUrl: dataUrl,
            filename: filename
          });
        };
        
        img.onerror = function(error) {
          console.error('Error loading image:', error);
          URL.revokeObjectURL(blobUrl);
          
          // Close the offscreen document
          chrome.runtime.sendMessage({
            action: 'conversionFailed',
            error: 'Failed to load image'
          });
        };
        
        img.src = blobUrl;
      })
      .catch(error => {
        console.error('Error fetching image:', error);
        
        // Close the offscreen document
        chrome.runtime.sendMessage({
          action: 'conversionFailed',
          error: error.message
        });
      });
  }
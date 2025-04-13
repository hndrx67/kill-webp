// popup.js - changed on April1 - optimizedcsaasdasd
document.addEventListener('DOMContentLoaded', function() {
  const enabledCheckbox = document.getElementById('enabled');
  const qualitySlider = document.getElementById('quality');
  const qualityValue = document.getElementById('qualityValue');
  const notificationsCheckbox = document.getElementById('notificationsEnabled');
  const autoDownloadCheckbox = document.getElementById('autoDownload');
  const redditBypassCheckbox = document.getElementById('redditBypass');
  const clearCacheButton = document.getElementById('clearCache');
  const killCountElement = document.getElementById('killCount');
  const spaceSavedElement = document.getElementById('spaceSaved');
  const bloodContainer = document.getElementById('blood-container');
  
  
  createBloodDrips();
  
  //loadndasdjas
  //help me im mstarotmmvong
  chrome.runtime.sendMessage({ action: 'getSettings' }, function(response) {
    if (response && response.settings) {
      const settings = response.settings;
      enabledCheckbox.checked = settings.enabled;
      qualitySlider.value = settings.quality;
      qualityValue.textContent = settings.quality;
      notificationsCheckbox.checked = settings.notificationsEnabled;
      autoDownloadCheckbox.checked = settings.autoDownload;
      redditBypassCheckbox.checked = settings.redditBypass;
    }
  });
  
  // Load stattiti
  chrome.storage.local.get(['stats'], function(result) {
    const stats = result.stats || { killCount: 0, spaceSaved: 0 };
    killCountElement.textContent = stats.killCount.toLocaleString();
    spaceSavedElement.textContent = formatBytes(stats.spaceSaved);
    
   
    if (stats.killCount > 0) {
      animateCounterValue(killCountElement, 0, stats.killCount);
    }
  });
  
  
  qualitySlider.addEventListener('input', function() {
    qualityValue.textContent = this.value;
    
    const percent = (this.value - this.min) / (this.max - this.min);
    const thumbPosition = percent * (this.offsetWidth - 20); 
    qualityValue.style.transition = 'none';
  });
  
  
  function saveSettings() {
    const settings = {
      enabled: enabledCheckbox.checked,
      quality: parseInt(qualitySlider.value),
      notificationsEnabled: notificationsCheckbox.checked,
      autoDownload: autoDownloadCheckbox.checked,
      redditBypass: redditBypassCheckbox.checked
    };
    
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: settings
    });
  }
  
  // listen to the event og=f being gay
  enabledCheckbox.addEventListener('change', saveSettings);
  qualitySlider.addEventListener('change', saveSettings);
  notificationsCheckbox.addEventListener('change', saveSettings);
  autoDownloadCheckbox.addEventListener('change', saveSettings);
  redditBypassCheckbox.addEventListener('change', saveSettings);
  
  //clear cache
  clearCacheButton.addEventListener('click', function() {
    // loadingsttate wehn claring
    const originalText = clearCacheButton.textContent;
    clearCacheButton.innerHTML = '<span>Clearing...</span>';
    clearCacheButton.disabled = true;
    
    // bloodyeffect 
    addBloodSplatter();
    
    // API to clear cache
    chrome.browsingData.removeCache({ since: 0 }, function() {
      clearCacheButton.innerHTML = '<span>Cache Cleared!</span>';
      
      //reset after 2 functions
      setTimeout(function() {
        clearCacheButton.innerHTML = originalText;
        clearCacheButton.disabled = false;
      }, 2000);
    });
  });
  
 // bytes conversion func
  function formatBytes(bytes) {
    if (bytes === 0) return '0 KB';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  //fnczzmzain

  function createBloodDrips() {
    //cleardripsofset
    bloodContainer.innerHTML = '';
    
    //blood drips
    const dripCount = 8;
    for (let i = 0; i < dripCount; i++) {
      const drip = document.createElement('div');
      drip.className = 'blood-drip';
      
      //randompositioning of blooodrdirpd
      const left = Math.floor(Math.random() * 100);
      const delay = Math.random() * 2;
      const duration = 3 + Math.random() * 3;
      const width = 4 + Math.floor(Math.random() * 6);
      
      drip.style.left = `${left}%`;
      drip.style.width = `${width}px`;
      drip.style.opacity = (0.6 + Math.random() * 0.4).toString();
      drip.style.animationDelay = `${delay}s`;
      drip.style.animationDuration = `${duration}s`;
      
      bloodContainer.appendChild(drip);
    }
    
    // red drip timeoti
    setTimeout(createBloodDrips, 8000);
  }
  
  // red splat
  function addBloodSplatter() {
    // red drip
    for (let i = 0; i < 20; i++) {
      const spot = document.createElement('div');
      spot.style.position = 'fixed';
      spot.style.width = (3 + Math.random() * 10) + 'px';
      spot.style.height = spot.style.width;
      spot.style.borderRadius = '50%';
      spot.style.backgroundColor = '#c00';
      spot.style.opacity = (Math.random() * 0.7 + 0.3).toString();
      
      // bronyarand
      spot.style.left = (Math.random() * 320) + 'px';
      spot.style.top = (Math.random() * window.innerHeight) + 'px';
      spot.style.zIndex = '9999';
      
      
      document.body.appendChild(spot);
      
      // aninm
      const animation = spot.animate([
        { transform: 'scale(0)', offset: 0 },
        { transform: 'scale(1)', offset: 0.1 },
        { transform: 'scale(1)', opacity: 0.8, offset: 0.7 },
        { transform: 'scale(1)', opacity: 0, offset: 1 }
      ], {
        duration: 1000 + Math.random() * 1000,
        easing: 'ease-out'
      });
      
      
      animation.onfinish = () => spot.remove();
    }
  }
  
  
  function animateCounterValue(element, start, end) {
    const duration = 1500;
    const startTime = performance.now();
    const updateCount = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      
      const easeOutQuart = progress => 1 - Math.pow(1 - progress, 4);
      const easedProgress = easeOutQuart(progress);
      
      
      const value = Math.floor(start + easedProgress * (end - start));
      element.textContent = value.toLocaleString();
      
     
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };
    
    requestAnimationFrame(updateCount);
  }
});
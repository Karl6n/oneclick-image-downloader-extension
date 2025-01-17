chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ 
    isActive: false,
    downloadFolder: '' 
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadImage") {
    chrome.storage.local.get('downloadFolder', (data) => {
      const folder = data.downloadFolder ? data.downloadFolder + '/' : '';
      const downloadPath = folder + request.filename;
      
      console.log('Downloading to:', downloadPath);
      
      chrome.downloads.download({
        url: request.imageUrl,
        filename: downloadPath,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download error:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError });
        } else {
          console.log('Download started:', downloadId);
          sendResponse({ success: true, downloadId: downloadId });
        }
      });
    });
    
    return true;
  }
});
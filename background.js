chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isActive: false });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadImage") {
    console.warn('Received download request for:', request.imageUrl); // Debug log
    
    chrome.downloads.download({
      url: request.imageUrl,
      filename: request.filename,
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
    
    return true;
  }
});
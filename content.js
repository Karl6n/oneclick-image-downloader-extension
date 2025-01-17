let isExtensionActive = false;

chrome.storage.local.get('isActive', (data) => {
  isExtensionActive = data.isActive || false;
  if (isExtensionActive) {
    updateImageListeners();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle") {
    isExtensionActive = request.isActive;
    updateImageListeners();
    sendResponse({received: true});
  }
});

function updateImageListeners() {
  const images = document.getElementsByTagName('img');
  
  for (let img of images) {
    img.removeEventListener('click', handleImageClick);
    
    if (isExtensionActive) {
      img.style.cursor = 'pointer';
      img.addEventListener('click', handleImageClick);
    } else {
      img.style.cursor = '';
    }
  }
}

function handleImageClick(event) {
  if (!isExtensionActive) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const img = event.target;
  const imageUrl = img.dataset.src || img.currentSrc || img.src;
  
  if (!imageUrl) return;
  
  const filename = getFilenameFromUrl(imageUrl);
  
  console.log('Sending download message for:', imageUrl); // Debug log
  
  chrome.runtime.sendMessage({
    action: "downloadImage",
    imageUrl: imageUrl,
    filename: filename
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
    } else {
      console.log('Download message sent successfully');
    }
  });
}

function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    let filename = urlObj.pathname.split('/').pop() || 'image';
    
    filename = filename.split('?')[0];
    
    if (!filename.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      filename += '.jpg';
    }
    
    filename = decodeURIComponent(filename).replace(/[#%&{}\\<>*?/$!'":@+`|=]/g, '_');
    
    return filename;
  } catch (e) {
    return 'image.jpg';
  }
}

const observer = new MutationObserver((mutations) => {
  if (isExtensionActive) {
    updateImageListeners();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
let isExtensionActive = false;
let cursorIcon = null;
let isHoveringImage = false;

// Toast notification
function showToast(message) {
  let toast = document.getElementById('oneclick-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'oneclick-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 32px;
      right: 32px;
      background: rgba(44, 62, 80, 0.95);
      color: #fff;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 15px;
      z-index: 99999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 2000);
}

// Minimal SVG arrow-down orange cursor (#FFA000)
const ARROW_DOWN_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><polygon points='12,18 6,9 18,9' fill='%23FFA000'/></svg>";

// Initialize state from storage
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
    sendResponse({ received: true });
  }
});

function updateImageListeners() {
  const images = document.getElementsByTagName('img');
  for (let img of images) {
    img.removeEventListener('click', handleImageClick);
    img.removeEventListener('mouseenter', handleImageHover);
    img.removeEventListener('mouseleave', handleImageLeave);
    if (isExtensionActive) {
      img.style.cursor = 'pointer';
      img.addEventListener('click', handleImageClick);
      img.addEventListener('mouseenter', handleImageHover);
      img.addEventListener('mouseleave', handleImageLeave);
    } else {
      img.style.cursor = '';
    }
  }
}

// Track if currently hovering a valid image or background image
let isHoveringImageOrBg = false;

// Helper to check if an element has a background image
function hasBackgroundImage(el) {
  if (!el || el.tagName.toLowerCase() === 'img') return false;
  const bg = window.getComputedStyle(el).backgroundImage;
  return bg && bg.startsWith('url(');
}

// Update mousemove logic to show/hide cursor for <img> or background image
// Remove previous document.addEventListener('mousemove', ...) and replace with:
document.addEventListener('mousemove', (event) => {
  if (!isExtensionActive) {
    hideCursorIcon();
    isHoveringImageOrBg = false;
    return;
  }
  const target = event.target;
  if (target.tagName.toLowerCase() === 'img' || hasBackgroundImage(target)) {
    isHoveringImageOrBg = true;
    createCursorIcon();
    showCursorIcon(event.clientX, event.clientY);
  } else {
    isHoveringImageOrBg = false;
    hideCursorIcon();
  }
});

// Update handleImageHover/handleImageLeave to set isHoveringImageOrBg for <img>
function handleImageHover(event) {
  isHoveringImageOrBg = true;
  createCursorIcon();
  showCursorIcon(event.clientX, event.clientY);
}

function handleImageLeave() {
  isHoveringImageOrBg = false;
  hideCursorIcon();
}

function handleImageClick(event) {
  if (!isExtensionActive) return;
  event.preventDefault();
  event.stopPropagation();
  const img = event.target;
  const imageUrl = img.dataset.src || img.currentSrc || img.src;
  if (!imageUrl) return;
  const filename = getFilenameFromUrl(imageUrl);
  // Animate cursor icon (zoom in/out)
  if (cursorIcon && cursorIcon.style.display === 'block') {
    cursorIcon.style.transform = 'scale(1.3)';
    cursorIcon.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
    setTimeout(() => {
      cursorIcon.style.transform = 'scale(1)';
      cursorIcon.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
    }, 90);
  }
  chrome.runtime.sendMessage({
    action: "downloadImage",
    imageUrl: imageUrl,
    filename: filename
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
      showToast(`❌ ${filename} failed`);
    } else {
      showToast(`⬇️ ${filename} ✅`);
    }
  });
}

function handleBackgroundImageClick(event) {
  if (!isExtensionActive) return;
  // Only act if not clicking an <img>
  if (event.target.tagName.toLowerCase() === 'img') return;
  const bg = window.getComputedStyle(event.target).backgroundImage;
  if (bg && bg.startsWith('url(')) {
    // Extract the URL
    const urlMatch = bg.match(/url\(["']?(.*?)["']?\)/);
    if (urlMatch && urlMatch[1]) {
      const imageUrl = urlMatch[1];
      const filename = getFilenameFromUrl(imageUrl);
      // Animate cursor icon (zoom in/out)
      if (cursorIcon && cursorIcon.style.display === 'block') {
        cursorIcon.style.transform = 'scale(1.3)';
        cursorIcon.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
        setTimeout(() => {
          cursorIcon.style.transform = 'scale(1)';
          cursorIcon.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
        }, 90);
      }
      chrome.runtime.sendMessage({
        action: "downloadImage",
        imageUrl,
        filename
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          showToast(`❌ ${filename} failed`);
        } else {
          showToast(`⬇️ ${filename} ✅`);
        }
      });
      event.preventDefault();
      event.stopPropagation();
    }
  }
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

// Create and add cursor icon element
function createCursorIcon() {
  if (cursorIcon) return;
  cursorIcon = document.createElement('div');
  cursorIcon.innerHTML = `<img src="${chrome.runtime.getURL('pointer.png')}" width="24" height="24">`;
  cursorIcon.style.cssText = `
    position: fixed;
    width: 24px;
    height: 24px;
    pointer-events: none;
    z-index: 10000;
    display: none;
    left: 0;
    top: 0;
    transform: none;
    border-radius: 50%;
    background: rgba(255,255,255,0.7);
    box-shadow: 0 2px 8px rgba(0,0,0,0.10);
    transition: transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s;
  `;
  document.body.appendChild(cursorIcon);
}

function showCursorIcon(x, y) {
  if (!cursorIcon) return;
  cursorIcon.style.left = x + 'px';
  cursorIcon.style.top = y + 'px';
  cursorIcon.style.display = 'block';
}

function hideCursorIcon() {
  if (cursorIcon) cursorIcon.style.display = 'none';
}

// Clean up function
function cleanup() {
  if (cursorIcon && cursorIcon.parentNode) {
    cursorIcon.parentNode.removeChild(cursorIcon);
  }
  cursorIcon = null;
}

// Observe DOM for dynamically added images
const observer = new MutationObserver((mutations) => {
  if (isExtensionActive) {
    updateImageListeners();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Add a global click listener for background images
if (!window._oneclick_bg_listener) {
  document.addEventListener('click', handleBackgroundImageClick, true);
  window._oneclick_bg_listener = true;
}

// Cleanup on navigation
window.addEventListener('beforeunload', cleanup);
document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const status = document.getElementById('status');
  const folderPath = document.getElementById('folderPath');
  const saveFolder = document.getElementById('saveFolder');
  const currentFolder = document.getElementById('currentFolder');

  // Get current states
  chrome.storage.local.get(['isActive', 'downloadFolder'], (data) => {
    toggleSwitch.checked = data.isActive || false;
    updateStatus(data.isActive || false);
    
    if (data.downloadFolder) {
      currentFolder.textContent = data.downloadFolder;
      folderPath.value = data.downloadFolder;
    }
  });

  toggleSwitch.addEventListener('change', () => {
    const isActive = toggleSwitch.checked;
    
    chrome.storage.local.set({ isActive: isActive }, () => {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { 
            action: "toggle", 
            isActive: isActive 
          }).catch(err => {
            console.log('Tab update skipped:', err);
          });
        });
      });
    });
    
    updateStatus(isActive);
  });

  saveFolder.addEventListener('click', () => {
    const folder = folderPath.value.trim();
    
    // Clean the folder path
    const cleanFolder = folder
      .replace(/\\/g, '/') // Convert Windows backslashes to forward slashes
      .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
      .replace(/[<>:"|?*]/g, '_'); // Replace invalid characters
    
    chrome.storage.local.set({ downloadFolder: cleanFolder }, () => {
      currentFolder.textContent = cleanFolder || 'Downloads';
      status.textContent = 'Folder path saved!';
      setTimeout(() => {
        status.textContent = toggleSwitch.checked ? 'OneClick Download is active' : 'OneClick Download is inactive';
      }, 2000);
    });
  });

  function updateStatus(isActive) {
    status.textContent = isActive ? 'OneClick Download is active' : 'OneClick Download is inactive';
  }
});
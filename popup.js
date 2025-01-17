document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const status = document.getElementById('status');

  chrome.storage.local.get('isActive', (data) => {
    toggleSwitch.checked = data.isActive || false;
    updateStatus(data.isActive || false);
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

  function updateStatus(isActive) {
    status.textContent = isActive ? 'OneClick Download is active' : 'OneClick Download is inactive';
  }
});
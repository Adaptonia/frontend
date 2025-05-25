// This script prevents white flash when loading the PWA
(function() {
  // Check if we're in standalone mode (PWA)
  const isStandalone = 
    window.navigator.standalone || 
    window.matchMedia('(display-mode: standalone)').matches;
  
  if (isStandalone) {
    // Force dark theme for PWA mode to prevent flash
    document.documentElement.classList.add('dark');
    
    // Set body background immediately
    document.documentElement.style.backgroundColor = '#000000';
    document.body.style.backgroundColor = '#000000';
    
    // Create a loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'pwa-splash-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = '#000000';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    
    // Add logo (optional)
    const logo = document.createElement('img');
    logo.src = '/icons/icon-192x192.png';
    logo.style.width = '80px';
    logo.style.height = '80px';
    
    overlay.appendChild(logo);
    
    // Add to document as soon as possible
    if (document.body) {
      document.body.appendChild(overlay);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        document.body.appendChild(overlay);
      });
    }
    
    // Remove overlay after the app has loaded
    window.addEventListener('load', function() {
      setTimeout(function() {
        const overlay = document.getElementById('pwa-splash-overlay');
        if (overlay) {
          overlay.style.opacity = '0';
          overlay.style.transition = 'opacity 0.5s ease';
          setTimeout(function() {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          }, 500);
        }
      }, 1000); // Give the app a second to render fully
    });
  }
})(); 
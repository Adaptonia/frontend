// Define interface for Safari-specific navigator properties
interface SafariNavigator extends Navigator {
  standalone?: boolean;
}

// Check if the app is running as a PWA (installed on home screen)
export const isRunningAsPWA = (): boolean => {
  // Check if it's in standalone mode (installed on home screen)
  if (typeof window !== 'undefined') {
    // iOS and iPadOS detection
    const nav = window.navigator as SafariNavigator;
    if (nav.standalone) {
      return true;
    }
    
    // Android and other platforms
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }

    // Fallback detection looking at URL properties that are often different in PWA mode
    const url = window.location.href;
    if (url.includes('?pwa=true') || url.includes('&pwa=true')) {
      return true;
    }
  }
  
  return false;
};

// Detect iOS device
export const isIOS = (): boolean => {
  if (typeof window !== 'undefined') {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent) && !(userAgent.includes('mac os') && 'ontouchend' in document);
  }
  return false;
};

// Detect Safari browser
export const isSafari = (): boolean => {
  if (typeof window !== 'undefined') {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes('safari') && !userAgent.includes('chrome');
  }
  return false;
};

// Detect PWA install capability
export const canInstallPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return !isRunningAsPWA() && ('BeforeInstallPromptEvent' in window || (isIOS() && isSafari()));
};

// Add PWA parameter to URLs to help with detection
export const addPWAParam = (url: string): string => {
  if (isRunningAsPWA()) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}pwa=true`;
  }
  return url;
};

// Force reload the PWA to pick up new service worker
export const reloadPWA = (): void => {
  if (typeof window === 'undefined') return;
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.update();
      }
    });
  }
  
  // Clear browser cache and reload
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }
  
  // Hard reload
  window.location.reload();
}; 
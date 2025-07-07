// Adaptonia Service Worker
// Provides offline caching, background sync, and enhanced PWA functionality

const CACHE_NAME = 'adaptonia-v1.0.0';
const STATIC_CACHE = 'adaptonia-static-v1.0.0';
const API_CACHE = 'adaptonia-api-v1.0.0';
const IMAGE_CACHE = 'adaptonia-images-v1.0.0';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/explore',
  '/goals',
  '/groups',
  '/settings',
  '/manifest.json',
  '/favicon.ico',
  '/logo.png',
  '/blueLogo.png',
  '/Mlogo.png',
  '/sounds/notification.wav',
  // Core CSS and JS will be cached automatically by Next.js
];

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = [
  { pattern: /\/api\/user\//, strategy: 'networkFirst' },
  { pattern: /\/api\/goals\//, strategy: 'staleWhileRevalidate' },
  { pattern: /\/api\/notifications\//, strategy: 'networkFirst' },
  { pattern: /\/api\/cron\//, strategy: 'networkOnly' }, // Don't cache cron jobs
];

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\/icons\//,
  /\/first-onboarding-one\//
];

// Background sync tags
const SYNC_TAGS = {
  GOAL_UPDATES: 'goal-updates',
  USER_ACTIONS: 'user-actions',
  OFFLINE_QUEUE: 'offline-queue'
};

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { credentials: 'same-origin' })));
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isImage(request)) {
    event.respondWith(handleImage(request));
  } else if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered for:', event.tag);
  
  if (event.tag === SYNC_TAGS.GOAL_UPDATES) {
    event.waitUntil(syncGoalUpdates());
  } else if (event.tag === SYNC_TAGS.USER_ACTIONS) {
    event.waitUntil(syncUserActions());
  } else if (event.tag === SYNC_TAGS.OFFLINE_QUEUE) {
    event.waitUntil(syncOfflineQueue());
  }
});

// Message handling for communication with the app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_API_RESPONSE':
      cacheApiResponse(data.url, data.response);
      break;
    case 'QUEUE_OFFLINE_ACTION':
      queueOfflineAction(data);
      break;
    case 'CLEAR_CACHE':
      clearCache(data.cacheType);
      break;
    case 'CLEAR_OFFLINE_QUEUE':
      clearOfflineQueue();
      break;
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage({ type: 'CACHE_STATUS', data: status });
      });
      break;
  }
});

// Cache strategy implementations

// Cache First (for static assets)
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached version immediately
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Service Worker: Static asset fetch failed:', error);
    // Return offline fallback if available
    return await getOfflineFallback('static');
  }
}

// Cache First with fallback (for images)
async function handleImage(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Service Worker: Image fetch failed:', error);
    // Return placeholder image or cached fallback
    return await getOfflineFallback('image');
  }
}

// Network First with cache fallback (for API requests)
async function handleApiRequest(request) {
  const strategy = getApiStrategy(request.url);
  
  switch (strategy) {
    case 'networkFirst':
      return await networkFirst(request, API_CACHE);
    case 'staleWhileRevalidate':
      return await staleWhileRevalidate(request, API_CACHE);
    case 'cacheFirst':
      return await cacheFirst(request, API_CACHE);
    case 'networkOnly':
      return fetch(request);
    default:
      return await networkFirst(request, API_CACHE);
  }
}

// Network First strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', request.url);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Queue for background sync if it's a critical request
    await queueOfflineAction({
      type: 'FAILED_REQUEST',
      request: {
        url: request.url,
        method: request.method,
        headers: [...request.headers.entries()],
      },
      timestamp: Date.now()
    });
    
    throw error;
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always fetch in background to update cache
  const fetchPromise = fetch(request).then((response) => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.log('Service Worker: Background fetch failed:', error);
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cached version, wait for network
  return await fetchPromise;
}

// Cache First strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const response = await fetch(request);
  if (response.status === 200) {
    cache.put(request, response.clone());
  }
  
  return response;
}

// Navigation requests (for page routing)
async function handleNavigation(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('Service Worker: Navigation failed, serving cached page');
    const cache = await caches.open(STATIC_CACHE);
    
    // Try to serve cached version of the requested page
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to cached root page
    const rootPage = await cache.match('/');
    if (rootPage) {
      return rootPage;
    }
    
    // Ultimate fallback
    return new Response(
      '<html><body><h1>Offline</h1><p>Please check your connection.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Background sync implementations
async function syncGoalUpdates() {
  try {
    const offlineQueue = await getOfflineQueue();
    const goalUpdates = offlineQueue.filter(item => item.type === 'GOAL_UPDATE');
    
    for (const update of goalUpdates) {
      try {
        await fetch(update.url, {
          method: update.method,
          headers: update.headers,
          body: JSON.stringify(update.data)
        });
        
        // Remove from queue on success
        await removeFromOfflineQueue(update.id);
        console.log('✅ Service Worker: Synced goal update:', update.id);
      } catch (error) {
        console.error('❌ Service Worker: Failed to sync goal update:', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Goal sync failed:', error);
  }
}

async function syncUserActions() {
  try {
    const offlineQueue = await getOfflineQueue();
    const userActions = offlineQueue.filter(item => item.type === 'USER_ACTION');
    
    for (const action of userActions) {
      try {
        // Replay user action
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: JSON.stringify(action.data)
        });
        
        await removeFromOfflineQueue(action.id);
        console.log('✅ Service Worker: Synced user action:', action.id);
      } catch (error) {
        console.error('❌ Service Worker: Failed to sync user action:', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: User action sync failed:', error);
  }
}

async function syncOfflineQueue() {
  try {
    const queue = await getOfflineQueue();
    
    for (const item of queue) {
      try {
        await fetch(item.url, {
          method: item.method || 'GET',
          headers: item.headers || {},
          body: item.data ? JSON.stringify(item.data) : undefined
        });
        
        await removeFromOfflineQueue(item.id);
        console.log('✅ Service Worker: Synced offline item:', item.id);
      } catch (error) {
        console.error('❌ Service Worker: Failed to sync offline item:', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Offline queue sync failed:', error);
  }
}

// Utility functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/_next/static/') || 
         url.pathname.includes('/manifest.json') ||
         url.pathname.includes('/favicon.ico') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css');
}

function isImage(request) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(request.url));
}

function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function getApiStrategy(url) {
  const pattern = API_CACHE_PATTERNS.find(p => p.pattern.test(url));
  return pattern ? pattern.strategy : 'networkFirst';
}

async function getOfflineFallback(type) {
  const cache = await caches.open(STATIC_CACHE);
  
  switch (type) {
    case 'image':
      // Try to return a cached placeholder image
      return await cache.match('/logo.png') || new Response();
    case 'static':
      // Return cached root page
      return await cache.match('/') || new Response();
    default:
      return new Response();
  }
}

// Offline queue management using IndexedDB
async function queueOfflineAction(action) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    
    await store.add({
      ...action,
      id: Date.now() + Math.random(),
      timestamp: Date.now()
    });
    
    console.log('📤 Service Worker: Queued offline action');
  } catch (error) {
    console.error('Service Worker: Failed to queue offline action:', error);
  }
}

async function getOfflineQueue() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['offlineQueue'], 'readonly');
    const store = transaction.objectStore('offlineQueue');
    return await store.getAll();
  } catch (error) {
    console.error('Service Worker: Failed to get offline queue:', error);
    return [];
  }
}

async function removeFromOfflineQueue(id) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    await store.delete(id);
  } catch (error) {
    console.error('Service Worker: Failed to remove from offline queue:', error);
  }
}

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AdaptoniaOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offlineQueue')) {
        db.createObjectStore('offlineQueue', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('apiCache')) {
        db.createObjectStore('apiCache', { keyPath: 'url' });
      }
    };
  });
}

async function cacheApiResponse(url, response) {
  try {
    const cache = await caches.open(API_CACHE);
    await cache.put(url, new Response(JSON.stringify(response)));
  } catch (error) {
    console.error('Service Worker: Failed to cache API response:', error);
  }
}

async function clearCache(cacheType) {
  try {
    if (cacheType === 'all') {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    } else {
      await caches.delete(cacheType);
    }
    console.log('🗑️ Service Worker: Cleared cache:', cacheType);
  } catch (error) {
    console.error('Service Worker: Failed to clear cache:', error);
  }
}

async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const status = {};
    
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      status[name] = {
        size: keys.length,
        lastUpdated: Date.now() // Simplified - could store actual timestamps
      };
    }
    
    return status;
  } catch (error) {
    console.error('Service Worker: Failed to get cache status:', error);
    return {};
  }
}

async function clearOfflineQueue() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    await store.clear();
    console.log('🗑️ Service Worker: Cleared offline queue');
  } catch (error) {
    console.error('Service Worker: Failed to clear offline queue:', error);
  }
}

console.log('🚀 Service Worker: Loaded successfully'); 
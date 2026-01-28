// PickStack Service Worker
const CACHE_NAME = 'pickstack-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(clients.claim());
});

// Fetch event - handle share target POST requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle share target POST request
  if (url.pathname === '/share' && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
    return;
  }
  
  // For other requests, use network-first strategy
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const title = formData.get('title') || '';
    const text = formData.get('text') || '';
    const url = formData.get('url') || '';
    
    // Build redirect URL with shared data as query params
    const redirectUrl = new URL('/share', self.location.origin);
    if (title) redirectUrl.searchParams.set('title', title);
    if (text) redirectUrl.searchParams.set('text', text);
    if (url) redirectUrl.searchParams.set('url', url);
    
    // Redirect to the share page with GET params
    return Response.redirect(redirectUrl.toString(), 303);
  } catch (error) {
    console.error('[SW] Error handling share target:', error);
    return Response.redirect('/share?error=parse_failed', 303);
  }
}

// Register service worker and print scope
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js', {scope: './'})
  .then(function(reg) {
    // registration worked
    console.log('Registration succeeded. Scope is ' + reg.scope);
    if (!navigator.serviceWorker.controller) {
        return;
    }
    if (reg.waiting) {
        navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
    }
    if (reg.installing) {
        navigator.serviceWorker.addEventListener('statechange', function () {
            if (navigator.serviceWorker.controller.state == 'installed') {
                navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
            }
        });
    }
    reg.addEventListener('updatefound', function () {
        navigator.serviceWorker.addEventListener('statechange', function () {
            if (navigator.serviceWorker.controller.state == 'installed') {
                navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
            }
        });
    });
  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}

// Create cache for the selected items
let random = Math.floor(Math.random() * Math.floor(99));
let cacheData = 'r-cache-'+random;
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheData).then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/404.jpg',
        '/css/styles.css',
        '/js/dbhelper.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/data/restaurants.json'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.filter(function(cacheName) {
					return cacheName.startsWith('r-cache-') && cacheName != cacheData;
				}).map(function(cacheName) {
					return caches.delete(cacheName);
				})
			);
		})
	);
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
		caches.match(event.request).then(response => {
			if (response) {
				console.log(event.request.url);
				return response;
			}
			return fetch(event.request).then(networkResponse => {
				return caches.open(cacheData).then(cache => {
					cache.put(event.request.url, networkResponse.clone());
					console.log(event.request.url);
					return networkResponse;
				})
			})
		}).catch(function() {
        return new Response("I'm Sorry But There's Nothing Here !");
    })
	);
});

self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
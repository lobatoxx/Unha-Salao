// Nome do cache
const CACHE_NAME = 'belezaja-cache-v1';

// Ficheiros a serem guardados em cache para funcionamento offline
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn-tailwindcss.vercel.app/',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Evento de instalação: abre o cache e adiciona os ficheiros principais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de fetch: responde com o cache se disponível, senão vai à rede
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se o ficheiro estiver no cache, retorna-o
        if (response) {
          return response;
        }
        // Senão, vai buscar à rede
        return fetch(event.request);
      }
    )
  );
});

// Evento de ativação: limpa caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

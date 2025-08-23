// ATENÇÃO: Mudamos a versão do cache para v2. Isso é crucial para a atualização.
const CACHE_NAME = 'belezaja-cache-v2';

// Lista de arquivos essenciais para o app funcionar offline.
// Mantemos apenas os arquivos locais para maior estabilidade.
const urlsToCache = [
  '/',
  '/index.html' 
];

// Evento de instalação: Guarda os arquivos essenciais e força a ativação do novo Service Worker.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto e arquivos essenciais salvos.');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Força o novo Service Worker a se tornar ativo imediatamente.
  );
});

// Evento de ativação: Limpa os caches antigos.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se o nome do cache não for o atual, ele será deletado.
          if (cacheName !== CACHE_NAME) {
            console.log('Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Garante que o SW controle a página imediatamente.
  );
});

// Evento de fetch: A NOVA ESTRATÉGIA "INTERNET PRIMEIRO".
self.addEventListener('fetch', event => {
  // Ignora requisições que não sejam do tipo GET (ex: salvar dados no Firebase)
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    // 1. Tenta buscar na internet primeiro.
    fetch(event.request)
      .then(networkResponse => {
        // 2. Se conseguir, salva uma cópia no cache e retorna a resposta da internet.
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // 3. Se a internet falhar, tenta buscar no cache.
        return caches.match(event.request);
      })
  );
});

# TECH_SPEC_PWA.md

> PWA 配置、Service Worker、缓存策略

---

## PWA 概述

Family Reward 是一个 Progressive Web App (PWA)，支持：
- 离线访问
- 主屏幕安装
- 推送通知（未来）
- 后台同步

---

## Web App Manifest

```json
// public/manifest.json
{
  "name": "Family Reward",
  "short_name": "FamilyReward",
  "description": "家庭行为管理游戏平台",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["education", "lifestyle", "productivity"],
  "lang": "zh-CN",
  "dir": "ltr",
  "prefer_related_applications": false
}
```

---

## Service Worker

```javascript
// public/sw.js
const CACHE_NAME = 'family-reward-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// 安装：缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API 请求：Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // 页面导航：Network First
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // 静态资源：Cache First
  event.respondWith(cacheFirst(request));
});

// 缓存策略：Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // 更新缓存
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // 离线时使用缓存
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 页面离线回退
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// 缓存策略：Cache First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  // 更新缓存
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, networkResponse.clone());
  
  return networkResponse;
}

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncPendingTasks());
  }
});

async function syncPendingTasks() {
  // 同步离线队列中的任务
  const pendingTasks = await getPendingTasksFromIndexedDB();
  
  for (const task of pendingTasks) {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      
      await removePendingTaskFromIndexedDB(task.id);
    } catch (error) {
      console.error('Sync failed for task:', task.id);
    }
  }
}
```

---

## Next.js PWA 配置

```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...其他配置
};

module.exports = withPWA(nextConfig);
```

---

## 注册 Service Worker

```typescript
// lib/pwa/register.ts
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    });
  }
}

// 请求后台同步权限
export async function requestBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-tasks');
  }
}
```

---

## 离线支持策略

### 缓存策略表

| 资源类型 | 策略 | 说明 |
|----------|------|------|
| HTML 页面 | Network First | 优先在线，离线用缓存 |
| API 响应 | Network First | 实时数据，离线用缓存 |
| JS/CSS | Cache First | 长期缓存，哈希文件名 |
| 图片 | Cache First | 长期缓存 |
| 字体 | Cache First | 长期缓存 |

### 离线功能范围

**必须离线可用**：
- 任务列表查看
- 积分查询
- 愿望单查看
- 用户资料

**需网络连接**（支持离线队列）：
- 任务完成提交
- 积分结算
- 愿望兑换
- 数据修改

### 离线队列实现

```typescript
// lib/pwa/offline-queue.ts
const DB_NAME = 'family-reward-offline';
const STORE_NAME = 'pending-requests';

interface PendingRequest {
  id: string;
  url: string;
  method: string;
  body: string;
  headers: Record<string, string>;
  timestamp: number;
}

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
  });
}

export async function addToQueue(request: PendingRequest): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  await new Promise<void>((resolve, reject) => {
    const addRequest = store.add(request);
    addRequest.onsuccess = () => resolve();
    addRequest.onerror = () => reject(addRequest.error);
  });
}

export async function getPendingRequests(): Promise<PendingRequest[]> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  await new Promise<void>((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
```

---

## 在线状态检测

```typescript
// hooks/use-online-status.ts
'use client';

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}

// 使用示例
function TaskList() {
  const isOnline = useOnlineStatus();
  
  return (
    <div>
      {!isOnline && (
        <div className="bg-yellow-100 p-2 text-center">
          离线模式 - 您的操作将在联网后同步
        </div>
      )}
      {/* 任务列表 */}
    </div>
  );
}
```

---

## PWA 安装提示

```typescript
// components/pwa-install-prompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted install');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
      <p className="mb-2">将 Family Reward 安装到主屏幕，使用更方便！</p>
      <div className="flex gap-2">
        <Button onClick={handleInstall}>安装</Button>
        <Button variant="outline" onClick={() => setShowPrompt(false)}>
          稍后
        </Button>
      </div>
    </div>
  );
}
```

---

## PWA 验证清单

- [ ] Web App Manifest 有效
- [ ] Service Worker 注册成功
- [ ] 离线访问正常
- [ ] 主屏幕安装可用
- [ ] HTTPS 部署
- [ ] 响应式设计
- [ ] 图标完整（72x72 到 512x512）

---

## 扩展阅读

- [PWA 最佳实践](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [TECH_SPEC_ARCHITECTURE.md](./TECH_SPEC_ARCHITECTURE.md) - 架构设计

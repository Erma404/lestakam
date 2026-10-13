// Service worker de LesTakam : affiche les rappels envoyés par l'application.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let message;
  try {
    message = event.data.json();
  } catch {
    message = { title: "LesTakam", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(message.title || "LesTakam", {
      body: message.body || "",
      icon: "/icon-192.png",
      badge: "/badge.png",
      tag: message.tag,
      data: { url: message.url || "/" },
    }),
  );
});

// Au toucher : revient sur l'application déjà ouverte, sinon l'ouvre.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

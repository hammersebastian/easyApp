const UPDATE_INTERVAL_MS = 60_000;

export function registerPwaUpdates() {
  if (!('serviceWorker' in navigator)) return;

  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  void navigator.serviceWorker.ready.then((registration) => {
    const checkForUpdate = () => {
      if (navigator.onLine) void registration.update().catch(() => undefined);
    };

    checkForUpdate();
    window.setInterval(checkForUpdate, UPDATE_INTERVAL_MS);
    window.addEventListener('online', checkForUpdate);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    });
  });
}

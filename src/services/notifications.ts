export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones push');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error al solicitar permiso de notificaciones:', error);
    return false;
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });
      return registration;
    } catch (error) {
      console.error('Error al registrar el service worker:', error);
      return null;
    }
  }
  return null;
}

export async function subscribeToPushNotifications(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // En un entorno real, esta clave pública vendría del backend
      applicationServerKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
    });
    
    // En un entorno real, enviaríamos esta suscripción al backend
    console.log('Push subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('Error al suscribirse a notificaciones push:', error);
    return null;
  }
}

export function showLocalNotification(
  title: string,
  options: NotificationOptions
): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  }
}
import { useState, useEffect } from 'react';
import {
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
} from '../services/notifications';

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator;
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
        
        // Registrar el service worker
        const reg = await registerServiceWorker();
        if (reg) {
          setRegistration(reg);
          
          // Verificar si ya existe una suscripción
          const existingSubscription = await reg.pushManager.getSubscription();
          if (existingSubscription) {
            setSubscription(existingSubscription);
          }
        }
      }
    };

    checkSupport();
  }, []);

  const requestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermission('granted');
      
      // Si tenemos el registro del service worker, intentamos suscribir
      if (registration) {
        const sub = await subscribeToPushNotifications(registration);
        setSubscription(sub);
      }
    }
    return granted;
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
  };
}
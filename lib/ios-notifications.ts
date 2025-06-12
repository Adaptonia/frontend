import { toast } from 'sonner';

interface IOSNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  data?: any;
  actions?: {
    action: string;
    title: string;
  }[];
}

class IOSNotificationManager {
  private static instance: IOSNotificationManager;
  private isSupported: boolean;
  private permission: NotificationPermission;
  private notificationQueue: IOSNotificationOptions[] = [];
  private isProcessingQueue: boolean = false;

  private constructor() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.isSupported = 'Notification' in window;
      this.permission = this.isSupported ? Notification.permission : 'denied';
    } else {
      this.isSupported = false;
      this.permission = 'denied';
    }
  }

  public static getInstance(): IOSNotificationManager {
    if (!IOSNotificationManager.instance) {
      IOSNotificationManager.instance = new IOSNotificationManager();
    }
    return IOSNotificationManager.instance;
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    if (!this.isSupported) {
      console.warn('Notifications not supported on this device');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  public async showNotification(options: IOSNotificationOptions): Promise<void> {
    if (typeof window === 'undefined') return;
    
    if (!this.isSupported || this.permission !== 'granted') {
      // Queue the notification for when permission is granted
      this.notificationQueue.push(options);
      return;
    }

    try {
      // Show in-app toast notification
      toast(options.title, {
        description: options.body,
        duration: 5000,
        action: options.actions?.[0] ? {
          label: options.actions[0].title,
          onClick: () => this.handleNotificationAction(options.actions![0].action, options.data)
        } : undefined
      });

      // Show system notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: `ios-notification-${Date.now()}`,
          requireInteraction: true,
          silent: false
        });

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
          if (options.actions?.[0]) {
            this.handleNotificationAction(options.actions[0].action, options.data);
          }
        };
      }

      // Play notification sound
      this.playNotificationSound();

    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  private async handleNotificationAction(action: string, data: any): Promise<void> {
    if (typeof window === 'undefined') return;
    
    switch (action) {
      case 'view':
        if (data?.url) {
          window.location.href = data.url;
        }
        break;
      case 'complete':
        // Handle goal completion
        if (data?.goalId) {
          // Trigger goal completion logic
          console.log('Goal completed:', data.goalId);
        }
        break;
      case 'snooze':
        // Handle snooze action
        if (data?.goalId) {
          // Schedule new notification for 5 minutes later
          setTimeout(() => {
            this.showNotification({
              title: data.title,
              body: data.body,
              data: data
            });
          }, 5 * 60 * 1000);
        }
        break;
    }
  }

  private async playNotificationSound(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const audio = new Audio('/sounds/notification.wav');
      audio.volume = 0.7;
      await audio.play();
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  public async processNotificationQueue(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    if (this.isProcessingQueue || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      if (notification) {
        await this.showNotification(notification);
      }
    }

    this.isProcessingQueue = false;
  }

  public isNotificationSupported(): boolean {
    return this.isSupported;
  }

  public getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

// Create a singleton instance only in browser environment
export const iosNotificationManager = typeof window !== 'undefined' 
  ? IOSNotificationManager.getInstance()
  : null; 
// Type declarations for PWA-related interfaces

interface BeforeInstallPromptEvent extends Event {
  /**
   * Returns a Promise that resolves to a DOMString containing either "accepted" or "dismissed".
   */
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;

  /**
   * Allows a developer to show the install prompt at a time of their own choosing.
   */
  prompt(): Promise<void>;
}

interface NotificationOptions {
  /** A vibration pattern to run with the display of the notification. */
  vibrate?: number[];
  
  /** Creates actions on the notification. */
  actions?: NotificationAction[];
  
  /** URL of an image to represent the notification when there is not enough space to display the notification itself. */
  badge?: string;
  
  /** The body string of the notification. */
  body?: string;
  
  /** Arbitrary data that you want associated with the notification. */
  data?: unknown;
  
  /** The direction of the notification; it can be auto, ltr, or rtl. */
  dir?: 'auto' | 'ltr' | 'rtl';
  
  /** URL to the notification icon. */
  icon?: string;
  
  /** URL of an image to be displayed in the notification. */
  image?: string;
  
  /** The notification's language. */
  lang?: string;
  
  /** A boolean that indicates whether the notification should be silent. */
  silent?: boolean;
  
  /** The ID of the notification. */
  tag?: string;
  
  /** The time when the notification was created. */
  timestamp?: number;
} 
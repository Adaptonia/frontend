# Mobile Notifications & Badge Count Guide for Adaptonia PWA

## 🚀 What I've Fixed

### 1. Enhanced Service Worker (`public/service-worker.js`)
- **Badge Count Management**: Added proper badge counting with increment/decrement
- **Mobile-Optimized Notifications**: Better notification options for mobile devices
- **Improved Permission Handling**: Enhanced permission requests for mobile browsers

### 2. Enhanced Service Worker Registration (`app/sw-register.tsx`)
- **Mobile Detection**: Automatically detects mobile devices and adjusts behavior
- **Better Permission Flow**: User-friendly permission requests with explanatory messages
- **Badge Count Hooks**: Functions to update and clear badge counts

### 3. New Badge Component (`components/NotificationBadge.tsx`)
- **Visual Badge**: Shows notification count in the UI
- **Real-time Updates**: Syncs with service worker badge count
- **Responsive Design**: Works on mobile and desktop

## 🔧 Implementation Guide

### Step 1: Add Badge to Your Navigation/Header

```tsx
// In your header component
import { NotificationBadge } from '@/components/NotificationBadge';

function Header() {
  return (
    <div className="relative">
      <button className="notification-button">
        🔔
        <NotificationBadge size="sm" />
      </button>
    </div>
  );
}
```

### Step 2: Update Badge Count When Reminders are Set

```tsx
// In your reminder creation logic
import { updateBadgeCount, getBadgeCount } from '@/app/sw-register';

// When creating a reminder
await scheduleReminderNotification(reminder);
await updateBadgeCount(getBadgeCount() + 1);

// When viewing/dismissing notifications
await updateBadgeCount(getBadgeCount() - 1);

// When clearing all notifications
await clearBadgeCount();
```

## 📱 Why Mobile Notifications Weren't Working

### Common Issues:
1. **PWA Not Installed**: Mobile browsers often require the PWA to be installed before notifications work
2. **Permission Timing**: Mobile browsers are stricter about when you can request notification permission
3. **Background Restrictions**: Mobile devices have aggressive background app limitations
4. **iOS Limitations**: iOS has specific PWA notification requirements

### Solutions I've Implemented:

#### 1. **Better Permission Request Flow**
```tsx
// Now automatically requests permissions with user-friendly messages
const requestNotificationPermissionForMobile = async (): Promise<boolean> => {
  // Shows explanatory toast before requesting permission
  // Detects mobile devices and adjusts behavior
  // Provides test notification on success
}
```

#### 2. **Enhanced Notification Options**
```tsx
const options = {
  body: reminder.description,
  icon: '/icons/icon-192x192.png',
  badge: '/icons/icon-72x72.png',
  vibrate: [200, 100, 200],
  requireInteraction: true,
  renotify: true, // Important for mobile
  tag: `goal-${reminder.goalId}` // Prevents duplicates
};
```

#### 3. **Mobile-Specific Manifest Updates**
```json
{
  "display_override": ["window-controls-overlay", "standalone"],
  "launch_handler": {
    "client_mode": ["navigate-existing", "auto"]
  }
}
```

## 🔍 Troubleshooting Mobile Notifications

### For Android:
1. **Install the PWA**: Use "Add to Home Screen" in Chrome/Edge
2. **Check App Permissions**: Go to Android Settings > Apps > Adaptonia > Notifications
3. **Disable Battery Optimization**: Settings > Battery > Battery Optimization > Adaptonia > Don't optimize

### For iOS:
1. **iOS 16.4+ Required**: PWA notifications only work on iOS 16.4 and later
2. **Safari Only**: Must use Safari, not Chrome or other browsers
3. **Add to Home Screen**: Must install as PWA first
4. **Check Settings**: Settings > Notifications > Adaptonia

### Testing Steps:
1. **Clear Browser Data**: Clear cache and storage
2. **Reinstall PWA**: Remove from home screen and re-add
3. **Test Permission**: Use the built-in test notification
4. **Check Console**: Look for service worker logs

## 🎯 Using the Badge Count Feature

### Automatic Badge Updates:
- **New Reminder**: Badge count increases when notification is shown
- **Click Notification**: Badge count decreases when user interacts
- **Dismiss Notification**: Badge count decreases when dismissed

### Manual Badge Updates:
```tsx
import { updateBadgeCount, clearBadgeCount, getBadgeCount } from '@/app/sw-register';

// Set specific count
await updateBadgeCount(5);

// Clear all badges
await clearBadgeCount();

// Get current count
const currentCount = getBadgeCount();
```

### UI Badge Component:
```tsx
import { NotificationBadge, useNotificationBadge } from '@/components/NotificationBadge';

// As a component
<div className="relative">
  <NotificationIcon />
  <NotificationBadge size="md" variant="default" />
</div>

// As a hook
function MyComponent() {
  const badgeCount = useNotificationBadge();
  return <span>You have {badgeCount} notifications</span>;
}
```

## 🚨 Important Notes

### Mobile Browser Requirements:
- **Chrome Android 84+**: Full support for badges and notifications
- **Safari iOS 16.4+**: Limited PWA notification support
- **Edge Mobile**: Good support when PWA is installed
- **Firefox Mobile**: Limited PWA support

### Best Practices:
1. **Always Request Permission First**: Don't schedule reminders without permission
2. **Provide Clear Messaging**: Explain why notifications are needed
3. **Test on Real Devices**: Emulators don't always work correctly
4. **Handle Permission Denial Gracefully**: Provide alternative reminder methods

### Debugging:
```javascript
// Check service worker status
navigator.serviceWorker.ready.then(registration => {
  console.log('Service Worker ready:', registration);
});

// Check notification permission
console.log('Notification permission:', Notification.permission);

// Check if badge API is supported
console.log('Badge API supported:', 'setAppBadge' in navigator);
```

## 🔄 Next Steps

1. **Test on Mobile Device**: Install the PWA on your phone and test notifications
2. **Add Badge to UI**: Implement the NotificationBadge component in your header
3. **Monitor Usage**: Check browser console for any errors
4. **Iterate Based on User Feedback**: Monitor which devices/browsers have issues

The badge count will now appear on your PWA icon on mobile devices and in your UI wherever you place the NotificationBadge component! 
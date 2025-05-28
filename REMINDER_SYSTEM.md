# Reminder Notification System

This document outlines the professional reminder notification system implemented for the Adaptonia PWA, following patterns from the salein codebase.

## Overview

The reminder system provides web-based notifications for goal reminders with:
- ✅ Professional error handling and retry mechanisms
- ✅ Service worker integration for reliable notifications
- ✅ Appwrite database integration for persistence
- ✅ Status tracking (pending, sent, failed)
- ✅ Background processing and automatic retries
- ✅ Sound notifications and PWA support

## Architecture

### Core Components

1. **ReminderService** (`src/services/appwrite/reminderService.ts`)
   - Handles CRUD operations for reminders
   - Manages retry logic and status tracking
   - Integrates with Appwrite database

2. **Service Worker** (`public/service-worker.js`)
   - Schedules and displays notifications
   - Handles notification clicks and actions
   - Manages reminder timeouts and snoozing

3. **ReminderChecker** (`src/components/ReminderChecker.tsx`)
   - Background component that processes due reminders
   - Runs every minute to check for pending reminders
   - Handles retry logic and failure management

4. **ReminderStatus** (`src/components/ReminderStatus.tsx`)
   - Displays reminder status for goals
   - Shows retry information and failure states
   - Real-time status updates

5. **useNotifications Hook** (`src/hooks/useNotifications.ts`)
   - Custom hook for easy notification management
   - Handles permission requests and state management
   - Provides clean API for components

## Database Schema

### Reminders Collection

```typescript
interface Reminder {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  description?: string;
  sendDate: string;
  dueDate?: string;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  nextRetry?: string;
}
```

### Required Environment Variables

```env
NEXT_PUBLIC_APPWRITE_REMINDERS_COLLECTION_ID=your-reminders-collection-id
```

## Usage Examples

### 1. Using the useNotifications Hook

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function GoalComponent() {
  const { createReminder, cancelReminder, testNotification, state } = useNotifications();

  const handleCreateReminder = async () => {
    const success = await createReminder({
      goalId: 'goal-123',
      title: 'Exercise Reminder',
      description: 'Time for your daily workout!',
      sendDate: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      userId: 'user-123'
    });

    if (success) {
      console.log('Reminder created successfully');
    }
  };

  return (
    <div>
      <button onClick={handleCreateReminder}>Set Reminder</button>
      <button onClick={() => testNotification()}>Test Notification</button>
      <p>Notification Permission: {state.permission}</p>
    </div>
  );
}
```

### 2. Direct Service Usage

```typescript
import { reminderService } from '@/services/appwrite/reminderService';

// Create a reminder
const reminder = await reminderService.createReminder({
  goalId: 'goal-123',
  title: 'Study Session',
  description: 'Time to study for your exam',
  sendDate: '2024-01-15T14:30:00.000Z',
  userId: 'user-123'
});

// Get reminders for a goal
const goalReminders = await reminderService.getRemindersByGoalId('goal-123');

// Get due reminders (for background processing)
const dueReminders = await reminderService.getDueReminders();
```

### 3. Adding Background Processing

```typescript
import { ReminderChecker } from '@/components/ReminderChecker';

function App() {
  return (
    <div>
      {/* Your app content */}
      <ReminderChecker /> {/* Add this for background processing */}
    </div>
  );
}
```

### 4. Displaying Reminder Status

```typescript
import { ReminderStatus } from '@/components/ReminderStatus';

function GoalCard({ goalId }: { goalId: string }) {
  return (
    <div>
      <h3>My Goal</h3>
      <ReminderStatus goalId={goalId} />
    </div>
  );
}
```

## Features

### Retry Mechanism
- Automatic retry for failed notifications (max 3 attempts)
- 30-minute delay between retries
- Status tracking for each attempt

### Notification Actions
- **View Goal**: Opens the goal in the dashboard
- **Mark Complete**: Marks the goal as completed
- **Snooze**: Delays the reminder by 5 minutes

### Error Handling
- Comprehensive error logging
- Graceful fallbacks for missing permissions
- User-friendly error messages via toast notifications

### PWA Support
- Works offline with service worker caching
- Background sync for goal completion
- Persistent notifications

## Setup Instructions

### 1. Appwrite Collection Setup

Create a "reminders" collection in Appwrite with these attributes:
- `goalId` (string, required)
- `userId` (string, required)
- `title` (string, required)
- `description` (string, optional)
- `sendDate` (string, required)
- `dueDate` (string, optional)
- `status` (string, required, default: 'pending')
- `retryCount` (integer, required, default: 0)
- `isCompleted` (boolean, required, default: false)
- `createdAt` (string, required)
- `updatedAt` (string, required)
- `nextRetry` (string, optional)

### 2. Environment Configuration

Add to your `.env` file:
```env
NEXT_PUBLIC_APPWRITE_REMINDERS_COLLECTION_ID=your-collection-id
```

### 3. Service Worker Registration

Ensure the service worker is registered in your app:
```typescript
import ServiceWorkerRegistration from '@/app/sw-register';

function App() {
  return (
    <div>
      <ServiceWorkerRegistration />
      {/* Your app content */}
    </div>
  );
}
```

### 4. Add Background Processing

Include the ReminderChecker component:
```typescript
import { ReminderChecker } from '@/components/ReminderChecker';

function Layout() {
  return (
    <div>
      {/* Your layout */}
      <ReminderChecker />
    </div>
  );
}
```

## Best Practices

### 1. Permission Handling
- Always request notification permission before creating reminders
- Provide fallback behavior for denied permissions
- Show clear messaging about notification requirements

### 2. Error Management
- Use try-catch blocks for all async operations
- Log errors for debugging but don't expose technical details to users
- Provide meaningful error messages via toast notifications

### 3. Performance
- Use the background checker component sparingly (once per app)
- Implement proper cleanup in useEffect hooks
- Avoid creating multiple reminder checkers

### 4. User Experience
- Show loading states during reminder operations
- Provide immediate feedback for user actions
- Display reminder status clearly in the UI

## Troubleshooting

### Common Issues

1. **Notifications not showing**
   - Check if notification permission is granted
   - Verify service worker is registered and active
   - Ensure reminder dates are in the future

2. **Service worker not working**
   - Check browser console for registration errors
   - Verify service-worker.js is accessible
   - Clear browser cache and re-register

3. **Database errors**
   - Verify Appwrite collection ID is correct
   - Check database permissions
   - Ensure all required fields are provided

### Debug Mode

Enable debug logging by checking browser console for:
- Service worker messages
- Reminder processing logs
- Error messages with stack traces

## Security Considerations

- All reminder data is stored in Appwrite with proper authentication
- Service worker only processes reminders for authenticated users
- No sensitive data is exposed in notifications
- Proper error handling prevents information leakage

## Future Enhancements

- Push notifications for server-sent reminders (requires VAPID setup)
- Recurring reminder patterns
- Smart reminder scheduling based on user behavior
- Integration with calendar systems
- Advanced notification customization options 
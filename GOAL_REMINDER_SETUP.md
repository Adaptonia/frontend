# Goal Reminder System with Resend Email Integration

This document explains the professional goal reminder system integrated into the frontend-old project, using Resend for email notifications.

## Overview

The system automatically sends email reminders for goals based on scheduled times. It replaces the previous notification system with a clean, professional email-based approach.

## Architecture

### Components

1. **API Routes**
   - `/api/notifications/reminder` - Sends individual goal reminders
   - `/api/notifications/send-batch` - Processes multiple due reminders

2. **Services**
   - `ReminderChecker` component - Automatically checks and sends due reminders
   - `emailService` - Client-side service for manual email operations
   - `reminderService` - Database operations for reminders

3. **Database Integration**
   - Uses existing Appwrite reminder collection
   - Tracks reminder status, retry counts, and send dates

## Setup Instructions

### 1. Environment Variables

Add these variables to your `.env.local` file:

```env
# Resend Email Service
RESEND_API_KEY=your-resend-api-key-here
NEXT_PUBLIC_APP_DOMAIN=your-app-domain.com

# Existing Appwrite Configuration (required)
APPWRITE_ENDPOINT=your-appwrite-endpoint
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_REMINDERS_COLLECTION_ID=your-reminders-collection-id
APPWRITE_USERS_COLLECTION_ID=your-users-collection-id
```

### 2. Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Verify your sending domain (or use the sandbox for testing)
4. Add the API key to your environment variables

### 3. Domain Configuration

Update the dashboard link in the email templates:
- Replace `https://your-app-domain.com/dashboard` with your actual domain
- Found in both `/api/notifications/reminder/route.ts` and `/api/notifications/send-batch/route.ts`

## How It Works

### Automatic Processing

1. **ReminderChecker Component** runs every 5 minutes
2. Calls `/api/notifications/send-batch` to process due reminders
3. Batch endpoint queries Appwrite for pending reminders
4. Sends emails via Resend for each due reminder
5. Updates reminder status in database

### Manual Operations

```typescript
import { emailService } from '@/lib/services/emailService';

// Send a test reminder
await emailService.sendTestReminder('user@example.com', 'John Doe');

// Send a milestone reminder
await emailService.sendMilestoneReminder(
  'user@example.com',
  'Complete Chapter 1',
  'Learn React',
  '2024-01-15',
  'John Doe'
);

// Send a deadline reminder
await emailService.sendDeadlineReminder(
  'user@example.com',
  'Finish Project',
  'Your project deadline is tomorrow!',
  '2024-01-15',
  'John Doe'
);
```

## Email Templates

The system includes three types of reminders:

1. **Goal Reminders** - Regular motivation to work on goals
2. **Milestone Reminders** - Important milestone notifications
3. **Deadline Reminders** - Urgent deadline approaching alerts

All emails feature:
- Professional Adaptonia branding
- Responsive HTML design
- Personalized greetings
- Goal details and due dates
- Direct links to dashboard

## Database Schema

### Reminders Collection

```typescript
interface Reminder {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  description?: string;
  sendDate: string;        // When to send the reminder
  dueDate?: string;        // Goal/milestone due date
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  nextRetry?: string;
}
```

## Error Handling & Retry Logic

- Failed emails are retried up to 3 times
- 30-minute delay between retries
- After 3 failures, reminders are marked as 'failed'
- Comprehensive logging for debugging

## Testing

### Development Testing

```javascript
// Test function available in development
window.testGoalReminder()
```

### Manual API Testing

```bash
# Test individual reminder
curl -X POST http://localhost:3000/api/notifications/reminder \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "goalTitle": "Test Goal",
    "goalDescription": "Testing the reminder system",
    "reminderType": "goal_reminder",
    "userName": "Test User"
  }'

# Test batch processing
curl -X POST http://localhost:3000/api/notifications/send-batch \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-here",
    "limit": 10
  }'
```

## Integration with Goal Creation

The reminder system integrates seamlessly with existing goal management:

```typescript
import { reminderService } from '@/services/appwrite/reminderService';

// When creating a goal with reminders
await reminderService.createReminder({
  goalId: goal.id,
  userId: user.id,
  title: `Reminder: ${goal.title}`,
  description: goal.description,
  sendDate: reminderDate.toISOString(),
  dueDate: goal.dueDate
});
```

## Benefits

1. **Professional Appearance** - Beautiful, branded email templates
2. **Reliability** - Retry logic ensures delivery
3. **Scalability** - Batch processing handles multiple reminders efficiently
4. **User Experience** - Email notifications work across all devices
5. **Analytics** - Track delivery success and failure rates
6. **Cost Effective** - Resend's pricing is very competitive

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check RESEND_API_KEY is correctly set
   - Verify domain is configured in Resend dashboard
   - Check Appwrite connection and collection IDs

2. **Reminders not being processed**
   - Verify ReminderChecker component is included in layout
   - Check user authentication status
   - Ensure reminder sendDate is in the past

3. **Build errors**
   - Install required dependencies: `npm install resend node-appwrite sonner`
   - Check TypeScript types are correct

### Logs

Check browser console and server logs for detailed error messages. All operations include comprehensive logging.

## Future Enhancements

Potential improvements:
- Email template customization
- Unsubscribe functionality
- Email preferences management
- Analytics dashboard
- A/B testing for email content
- SMS reminders via Twilio integration

## Support

For issues or questions about the reminder system:
1. Check this documentation
2. Review the source code comments
3. Test with the development functions
4. Check Resend dashboard for delivery status 
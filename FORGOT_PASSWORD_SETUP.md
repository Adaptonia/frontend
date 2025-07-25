# Forgot Password Functionality Setup

This document explains the forgot password functionality implemented in the Adaptonia app using Appwrite's built-in recovery system.

## Overview

The forgot password flow uses Appwrite's native password recovery system, which provides a secure and reliable way to reset user passwords.

## Flow Description

### 1. User Requests Password Reset
- User visits `/forget-password` page
- Enters their email address
- Clicks "Send Reset Link" button
- System calls Appwrite's `createRecovery()` method

### 2. Appwrite Sends Recovery Email
- Appwrite automatically sends a recovery email to the user
- Email contains a secure link with `userId` and `secret` parameters
- Link points to `/reset-password` page

### 3. User Resets Password
- User clicks the link in their email
- They're taken to `/reset-password` page with URL parameters
- User enters new password and confirms it
- System calls Appwrite's `updateRecovery()` method

### 4. Success
- Password is updated in Appwrite
- User is redirected to `/password-changed` success page
- User can then login with their new password

## API Routes

### POST `/api/auth/forgot-password`
- **Purpose**: Request password reset email
- **Input**: `{ email: string }`
- **Output**: Success message or error
- **Uses**: Appwrite `requestPasswordReset()` function

### POST `/api/auth/reset-password`
- **Purpose**: Reset password using recovery link
- **Input**: `{ userId: string, secret: string, password: string }`
- **Output**: Success message or error
- **Uses**: Appwrite `resetPassword()` function

## Pages

### `/forget-password`
- Form to enter email address
- Calls forgot password API
- Shows success/error messages
- Redirects to login on success

### `/reset-password`
- Accepts `userId` and `secret` from URL parameters
- Form to enter new password
- Validates password strength and confirmation
- Calls reset password API
- Redirects to success page on completion

### `/password-changed`
- Success page showing password was changed
- Button to return to login page

## Environment Variables Required

Make sure these environment variables are set in your `.env.local` file:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
```

## Appwrite Configuration

The recovery system requires:
1. **Email/Password authentication enabled** in Appwrite console
2. **Recovery URL configured** to point to your app's `/reset-password` page
3. **Email templates configured** in Appwrite console (optional but recommended)

## Security Features

- **Secure tokens**: Appwrite generates secure, time-limited recovery tokens
- **Email verification**: Only registered email addresses can request resets
- **Token expiration**: Recovery links expire automatically
- **Rate limiting**: Appwrite provides built-in rate limiting
- **HTTPS required**: Recovery links only work over HTTPS

## Error Handling

The system handles various error scenarios:
- Invalid email format
- User not found
- Invalid or expired recovery link
- Password validation errors
- Network/server errors

## Testing

To test the functionality:
1. Go to `/forget-password`
2. Enter a valid email address
3. Check your email for the recovery link
4. Click the link and reset your password
5. Verify you can login with the new password

## Troubleshooting

### Common Issues:
1. **Email not received**: Check spam folder, verify email is registered
2. **Invalid link**: Links expire after a certain time, request a new one
3. **Password validation**: Ensure password meets minimum requirements (6+ characters)
4. **Appwrite errors**: Check Appwrite console for authentication settings

### Debug Steps:
1. Check browser console for error messages
2. Verify environment variables are set correctly
3. Ensure Appwrite project is properly configured
4. Check network tab for API call failures 
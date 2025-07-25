# Environment Setup for Forgot Password Functionality

## Required Environment Variables

To make the forgot password functionality work, you need to set up your environment variables. Create a `.env.local` file in your project root with the following variables:

### Essential Appwrite Configuration

```env
# Appwrite Configuration (REQUIRED for forgot password)
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-actual-project-id

# App URL (for password reset links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### How to Get Your Appwrite Project ID

1. **Log into your Appwrite Console** at https://cloud.appwrite.io
2. **Select your project** (or create a new one)
3. **Go to Settings** → **General**
4. **Copy your Project ID** from the "Project ID" field

### Example .env.local file

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=682b1633003712630789

# App URL (for password reset links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Database and Collection IDs (if you have them)
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
```

## Appwrite Console Configuration

### 1. Enable Email/Password Authentication

1. Go to your Appwrite Console
2. Navigate to **Auth** → **Settings**
3. Make sure **Email/Password** authentication is enabled
4. **Configure your Recovery URL** to point to: `http://localhost:3000/reset-password` (for development)

### 2. Recovery URL Configuration

**For Development:**
```
http://localhost:3000/reset-password
```

**For Production:**
```
https://your-domain.com/reset-password
```

**Note:** The recovery URL in Appwrite console should match your `NEXT_PUBLIC_APP_URL` environment variable.

### 3. Configure Email Templates (Optional)

1. Go to **Auth** → **Templates**
2. Customize the **Recovery** email template
3. Make sure the recovery link points to your reset password page

## Testing the Setup

1. **Create the .env.local file** with your Appwrite configuration
2. **Restart your development server**:
   ```bash
   npm run dev
   ```
3. **Test the forgot password flow**:
   - Go to `/forget-password`
   - Enter a valid email address
   - Check if the API call succeeds

## Troubleshooting

### Common Issues:

1. **500 Internal Server Error**:
   - Check that `NEXT_PUBLIC_APPWRITE_PROJECT_ID` is set correctly
   - Verify your Appwrite project exists and is active

2. **"User not found" error**:
   - Make sure the email address exists in your Appwrite project
   - Check that the user has verified their email

3. **"Server configuration error"**:
   - Verify all required environment variables are set
   - Restart your development server after adding environment variables

### Debug Steps:

1. **Check environment variables**:
   ```bash
   # In your terminal, check if variables are loaded
   echo $NEXT_PUBLIC_APPWRITE_PROJECT_ID
   ```

2. **Check browser console** for detailed error messages

3. **Check server logs** in your terminal where `npm run dev` is running

## Security Notes

- Never commit your `.env.local` file to version control
- The `.env.example` file is safe to commit as it contains no real values
- Use different project IDs for development and production 
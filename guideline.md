# Appwrite Integration Guidelines

## Overview
This document outlines the guidelines for using Appwrite as our backend service for the MVP. We're choosing Appwrite over our traditional Nest.js backend to accelerate development.

## Core Principles
1. **Simplicity First**: Use Appwrite's built-in services whenever possible instead of custom solutions
2. **Security**: Follow Appwrite's security best practices and proper authentication flows
3. **Documentation**: Document all Appwrite service integrations and configuration

## Appwrite Services to Utilize
- **Authentication**: User registration, login, and session management
- **Database**: Storing and querying application data
- **Storage**: File uploads and management
- **Functions**: Custom server-side logic when necessary
- **Realtime**: For live updates and notifications

## Implementation Guidelines
- Create dedicated service modules for each Appwrite service integration
- Use environment variables for Appwrite credentials
- Implement proper error handling for Appwrite API responses
- Create type definitions for all Appwrite data structures

## Folder Structure
```
/src
  /services
    /appwrite
      auth.ts       # Authentication service
      database.ts   # Database service
      storage.ts    # Storage service
      functions.ts  # Functions service
      realtime.ts   # Realtime service
```

## Appwrite Database Setup

### Collections

#### Users Collection
- Create a collection named `users` with the following attributes:
  - `userId` (string, required): Matches Appwrite Auth $id
  - `email` (string, required): User's email address
  - `name` (string): User's display name
  - `profilePicture` (string): URL to profile picture
  - `role` (string, enum: ['USER', 'ADMIN']): User's role in the system

#### Goals Collection
- Create a collection named `goals` with the following attributes:
  - `title` (string, required): Goal title
  - `description` (string): Detailed description
  - `category` (string, enum: ['SCHEDULE', 'FINANCE', 'CAREER', 'AUDIO_BOOKS']): Goal category
  - `deadline` (string): ISO date string for goal deadline
  - `location` (string): Associated location
  - `tags` (string): Tags for filtering
  - `reminderDate` (string): ISO date string for reminder
  - `isCompleted` (boolean, required): Completion status
  - `userId` (string, required): ID of goal owner
  - `createdAt` (string, required): ISO date string of creation time
  - `updatedAt` (string, required): ISO date string of last update

### Indexes
For efficient queries, create the following indexes:

1. Users Collection:
   - userId (unique)
   - email (unique)

2. Goals Collection:
   - userId (for filtering goals by user)
   - category (for filtering goals by category)
   - isCompleted (for filtering by completion status)

### Permissions
Set the following permissions:

1. Users Collection:
   - Create: Only authenticated users
   - Read: Document owner and admin
   - Update: Document owner and admin
   - Delete: Document owner and admin

2. Goals Collection:
   - Create: Only authenticated users
   - Read: Document owner
   - Update: Document owner
   - Delete: Document owner

## Migration Path
As the project matures, we may migrate certain functionality back to a custom Nest.js backend. Document all Appwrite implementations clearly to facilitate future migrations.

---

## Code Standards

check the codebase to understan what we have done, don't just create new files that are not neccessary, Don't write any code until you're very confident (95% or more) in what needs to be done. If unclear, ask for more info.

### Type Definitions
- No duplicate type definitions across files
- Always export interfaces used across multiple files

### Code Quality
- **Always use &apos; instead of &quot; for strings**
- **No undefined types**: Never use `(error)` as a catch block of a try statement or any other error emitting component in code
- **Always define error types**: All catch blocks must use `(error: unknown)` and properly type-check the error
- **Error handling pattern**: Always follow this pattern:
  ```typescript
  catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Default error message';
    console.error("Descriptive context:", errorMessage);
    // Additional error handling as needed
  }
  ```
- **No unused variables**: All declared variables must be used or prefixed with underscore
- **Proper error handling**: Include try/catch blocks for async operations
- **Type safety**: Use proper TypeScript types for all variables and function parameters
- **⚠️ WARNING: No unused state variables**: Don't declare state variables (useState) without using them in the component. If you declare `setIsLoading`, you must use it in the UI (e.g., showing a loading indicator). Unused state variables cause errors during Vercel deployment.
- **⚠️ WARNING: Avoid using `any` type**: Never use the `any` type as it defeats TypeScript's type checking. Instead:
  ```typescript
  // ❌ Bad
  const data: any = response.data;
  
  // ✅ Good
  const data: Record<string, unknown> = response.data;
  // Or use more specific types like:
  const data: CustomType = response.data;
  ```

## Environment Setup
```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_APPWRITE_DATABASE_ID=<your-database-id>
NEXT_PUBLIC_APPWRITE_GOALS_COLLECTION_ID=<your-goals-collection-id>
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=<your-users-collection-id>
```

// eslint-disable-next-line @typescript-eslint/no-unused-vars

*This document will be updated as we progress through development.* 
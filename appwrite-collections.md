# Appwrite Collections for Messaging System

This document outlines all the collections that need to be created in Appwrite for the messaging system.

## Users Collection
- Collection ID: Set in `.env` as `NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID`

### Attributes:
- `userId` (string, required) - Matches the Appwrite Auth $id
- `email` (string, required) - User's email address
- `name` (string) - User's display name
- `profilePicture` (string) - URL to profile picture
- `role` (string, enum: ['user', 'admin']) - User's role

### Indexes:
- Create an index on `userId` (unique)
- Create an index on `email` (unique)

## Channels Collection
- Collection ID: Set in `.env` as `NEXT_PUBLIC_APPWRITE_CHANNELS_COLLECTION_ID`

### Attributes:
- `name` (string, required) - Channel name
- `description` (string) - Channel description
- `type` (string, enum: ['PUBLIC', 'PRIVATE']) - Channel type
- `creatorId` (string, required) - User ID of the creator
- `createdAt` (string, required) - ISO string of creation date
- `updatedAt` (string, required) - ISO string of last update
- `isActive` (boolean, required) - Whether channel is active
- `memberCount` (integer, required, default: 0) - Number of members

### Indexes:
- Create an index on `creatorId`
- Create an index on `isActive`
- Create an index on `type`

## Channel Members Collection
- Collection ID: Set in `.env` as `NEXT_PUBLIC_APPWRITE_CHANNEL_MEMBERS_COLLECTION_ID`

### Attributes:
- `channelId` (string, required) - ID of the channel
- `userId` (string, required) - ID of the user
- `role` (string, enum: ['ADMIN', 'MEMBER']) - User's role in the channel
- `joinedAt` (string, required) - ISO string of when user joined
- `isActive` (boolean, required) - Whether membership is active

### Indexes:
- Create a composite index on `channelId`, `userId` (unique)
- Create an index on `channelId`
- Create an index on `userId`
- Create an index on `isActive`

## Channel Messages Collection
- Collection ID: Set in `.env` as `NEXT_PUBLIC_APPWRITE_CHANNEL_MESSAGES_COLLECTION_ID`

### Attributes:
- `channelId` (string, required) - ID of the channel
- `senderId` (string, required) - ID of the sender
- `content` (string, required) - Message content
- `replyToId` (string) - ID of the message being replied to
- `createdAt` (string, required) - ISO string of creation date
- `updatedAt` (string, required) - ISO string of last update
- `isDeleted` (boolean, required) - Whether message is deleted

### Indexes:
- Create an index on `channelId`
- Create an index on `senderId`
- Create a composite index on `channelId`, `createdAt`
- Create an index on `isDeleted`

## Channel Invites Collection
- Collection ID: Set in `.env` as `NEXT_PUBLIC_APPWRITE_CHANNEL_INVITES_COLLECTION_ID`

### Attributes:
- `channelId` (string, required) - ID of the channel
- `createdBy` (string, required) - ID of the user who created the invite
- `createdAt` (string, required) - ISO string of creation date
- `expiresAt` (string, required) - ISO string of expiration date
- `isActive` (boolean, required) - Whether invite is active

### Indexes:
- Create an index on `channelId`
- Create an index on `isActive`
- Create an index on `expiresAt`

## Contacts Collection
- Collection ID: Set in `.env` as `NEXT_PUBLIC_APPWRITE_CONTACTS_COLLECTION_ID`

### Attributes:
- `userId` (string, required) - ID of the user
- `contactId` (string, required) - ID of the contact
- `createdAt` (string, required) - ISO string of creation date
- `isBlocked` (boolean, required) - Whether contact is blocked

### Indexes:
- Create a composite index on `userId`, `contactId` (unique)
- Create an index on `userId`
- Create an index on `isBlocked`

## Direct Messages Collection
- Collection ID: Set in `.env` as `NEXT_PUBLIC_APPWRITE_DIRECT_MESSAGES_COLLECTION_ID`

### Attributes:
- `senderId` (string, required) - ID of the sender
- `recipientId` (string, required) - ID of the recipient
- `content` (string, required) - Message content
- `replyToId` (string) - ID of the message being replied to
- `createdAt` (string, required) - ISO string of creation date
- `isRead` (boolean, required) - Whether message is read
- `isDeleted` (boolean, required) - Whether message is deleted

### Indexes:
- Create an index on `senderId`
- Create an index on `recipientId`
- Create a composite index on `senderId`, `recipientId`
- Create a composite index on `recipientId`, `senderId`
- Create an index on `isRead`
- Create an index on `isDeleted`
- Create an index on `createdAt`

## Permissions

For all collections, set up these permissions:
- Create: Authenticated users only
- Read: Document owner or users with proper access (e.g., channel members)
- Update: Document owner or administrators/moderators
- Delete: Document owner or administrators/moderators

## Environment Setup

Make sure to add all these collection IDs to your `.env` file:

```
# Appwrite credentials
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id

# Collection IDs for auth and users
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=your-users-collection-id

# Collection IDs for channels and groups
NEXT_PUBLIC_APPWRITE_CHANNELS_COLLECTION_ID=your-channels-collection-id
NEXT_PUBLIC_APPWRITE_CHANNEL_MEMBERS_COLLECTION_ID=your-channel-members-collection-id
NEXT_PUBLIC_APPWRITE_CHANNEL_MESSAGES_COLLECTION_ID=your-channel-messages-collection-id
NEXT_PUBLIC_APPWRITE_CHANNEL_INVITES_COLLECTION_ID=your-channel-invites-collection-id

# Collection IDs for direct messaging
NEXT_PUBLIC_APPWRITE_CONTACTS_COLLECTION_ID=your-contacts-collection-id
NEXT_PUBLIC_APPWRITE_DIRECT_MESSAGES_COLLECTION_ID=your-direct-messages-collection-id

# WebSocket configuration
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-url
``` 
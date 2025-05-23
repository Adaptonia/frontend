import { client, DATABASE_ID } from './client';
import { 
  CHANNELS_COLLECTION_ID, 
  CHANNEL_MESSAGES_COLLECTION_ID,
  CHANNEL_MEMBERS_COLLECTION_ID 
} from './channel';
import { DIRECT_MESSAGES_COLLECTION_ID } from './messaging';

// Message event types
export type MessageEventType = 
  | 'new_message' 
  | 'message_update' 
  | 'message_delete';

// Channel event types
export type ChannelEventType = 
  | 'channel_create'
  | 'channel_update'
  | 'channel_delete' 
  | 'member_join'
  | 'member_leave';

// Define response type for realtime events
export type RealtimeResponse = {
  events: string[];
  payload: Record<string, unknown>;
};

/**
 * Subscribe to channel messages
 */
export const subscribeToChannelMessages = (
  channelId: string,
  onMessage: (message: unknown) => void,
  onError?: (error: Error) => void
) => {
  try {
    // Subscribe to specific channel messages
    return client.subscribe(
      `databases.${DATABASE_ID}.collections.${CHANNEL_MESSAGES_COLLECTION_ID}.documents`,
      (response: RealtimeResponse) => {
        // Only process if this is for the channel we're interested in
        if (response.payload && response.payload.channelId === channelId) {
          if (response.events.includes('databases.*.collections.*.documents.*.create')) {
            onMessage({
              type: 'new_message',
              data: {
                ...response.payload,
                id: response.payload.$id,
              }
            });
          } else if (response.events.includes('databases.*.collections.*.documents.*.update')) {
            onMessage({
              type: 'message_update',
              data: {
                ...response.payload,
                id: response.payload.$id,
              }
            });
          } else if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
            onMessage({
              type: 'message_delete',
              data: {
                id: response.payload.$id,
                channelId
              }
            });
          }
        }
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe to channel messages';
    console.error('Channel subscription error:', errorMessage);
    if (onError && error instanceof Error) {
      onError(error);
    }
    // Return a no-op unsubscribe function when subscription fails
    return () => {};
  }
};

/**
 * Subscribe to channel updates (creation, deletion, member changes)
 */
export const subscribeToChannelUpdates = (
  onUpdate: (update: unknown) => void,
  onError?: (error: Error) => void
) => {
  try {
    // Channel collection subscription
    const channelSubscription = client.subscribe(
      `databases.${DATABASE_ID}.collections.${CHANNELS_COLLECTION_ID}.documents`,
      (response: RealtimeResponse) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          onUpdate({
            type: 'channel_create',
            data: {
              ...response.payload,
              id: response.payload.$id,
            }
          });
        } else if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          onUpdate({
            type: 'channel_update',
            data: {
              ...response.payload,
              id: response.payload.$id,
            }
          });
        } else if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
          onUpdate({
            type: 'channel_delete',
            data: {
              id: response.payload.$id
            }
          });
        }
      }
    );

    // Channel members subscription
    const membersSubscription = client.subscribe(
      `databases.${DATABASE_ID}.collections.${CHANNEL_MEMBERS_COLLECTION_ID}.documents`,
      (response: RealtimeResponse) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          onUpdate({
            type: 'member_join',
            data: {
              ...response.payload,
              id: response.payload.$id,
            }
          });
        } else if (response.events.includes('databases.*.collections.*.documents.*.update') &&
                 response.payload.isActive === false) {
          onUpdate({
            type: 'member_leave',
            data: {
              ...response.payload,
              id: response.payload.$id,
            }
          });
        }
      }
    );

    // Return combined unsubscribe function
    return () => {
      channelSubscription();
      membersSubscription();
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe to channel updates';
    console.error('Channel updates subscription error:', errorMessage);
    if (onError && error instanceof Error) {
      onError(error);
    }
    // Return a no-op unsubscribe function when subscription fails
    return () => {};
  }
};

/**
 * Subscribe to direct messages with a specific user
 */
export const subscribeToDirectMessages = (
  userId: string,
  otherUserId: string,
  onMessage: (message: unknown) => void,
  onError?: (error: Error) => void
) => {
  try {
    return client.subscribe(
      `databases.${DATABASE_ID}.collections.${DIRECT_MESSAGES_COLLECTION_ID}.documents`,
      (response: RealtimeResponse) => {
        const message = response.payload as {
          senderId: string;
          recipientId: string;
          $id: string;
        };
        
        // Only process messages that are part of this conversation
        if ((message.senderId === userId && message.recipientId === otherUserId) ||
            (message.senderId === otherUserId && message.recipientId === userId)) {
          
          if (response.events.includes('databases.*.collections.*.documents.*.create')) {
            onMessage({
              type: 'new_message',
              data: {
                ...message,
                id: message.$id,
              }
            });
          } else if (response.events.includes('databases.*.collections.*.documents.*.update')) {
            onMessage({
              type: 'message_update',
              data: {
                ...message,
                id: message.$id,
              }
            });
          } else if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
            onMessage({
              type: 'message_delete',
              data: {
                id: message.$id
              }
            });
          }
        }
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe to direct messages';
    console.error('Direct message subscription error:', errorMessage);
    if (onError && error instanceof Error) {
      onError(error);
    }
    // Return a no-op unsubscribe function when subscription fails
    return () => {};
  }
};

export default client; 
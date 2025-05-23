'use client'
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getChannelById, 
  getChannelMembership,
} from '@/src/services/appwrite/channel';
import { Channel, ChannelMessage } from '@/lib/types/messaging';

import { ArrowLeft, Hash, MoreVertical } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChannelMessaging } from '@/hooks/useChannelMessaging';
import { format } from 'date-fns';
import { getInitials } from '@/lib/utils';
import { useWebSocket } from '@/context/WebSocketContext';
import { ChannelHeader } from '@/components/channel/ChannelHeader';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';

// CSS for typing animation
const typingAnimationStyles = `
  @keyframes typingPulse {
    0% { opacity: 0.4; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
    100% { opacity: 0.4; transform: scale(0.8); }
  }
  .typing-dot {
    width: 6px;
    height: 6px;
    background-color: #3B82F6;
    border-radius: 50%;
    display: inline-block;
    margin-right: 3px;
  }
  .typing-dot:nth-child(1) {
    animation: typingPulse 1.5s infinite;
  }
  .typing-dot:nth-child(2) {
    animation: typingPulse 1.5s infinite 0.2s;
  }
  .typing-dot:nth-child(3) {
    animation: typingPulse 1.5s infinite 0.4s;
  }
`;

type ChannelClientPageProps = {
  channelId: string;
}

export default function ChannelClientPage({ channelId }: ChannelClientPageProps) {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id || !channelId) return false;
      
      try {
        const membership = await getChannelMembership(channelId, user.id);
        return membership?.role === 'admin';
      } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
    };
    
    if (user?.id && channelId) {
      checkAdminStatus().then(isUserAdmin => {
        setIsAdmin(isUserAdmin);
      });
    }
  }, [user?.id, channelId]);
  
  // Use the existing WebSocket-enabled hook for channel messaging
  const {
    messages,
    isLoading: messagesLoading,
    isSending,
    typingUsers,
    sendMessage,
    sendTypingIndicator,
    joinChannel,
    typingIndicatorText,
    onUserTyping,
  } = useChannelMessaging(channelId);
  
  // Log for debugging
  const { socket, isConnected } = useWebSocket();
  
  // Ensure we join the channel on mount
  useEffect(() => {
    joinChannel();
  }, [joinChannel]);
  
  // Handle typing indicators with debounce
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Only send typing events if there's content
    if (messageText.trim().length > 0) {
      sendTypingIndicator(true);
      
      // Set a timeout to stop the typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 3000);
    } else {
      sendTypingIndicator(false);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageText, sendTypingIndicator]);

  // Fetch channel data
  useEffect(() => {
    async function fetchChannelData() {
      if (!channelId) return;
      
      try {
        const channelData = await getChannelById(channelId);
        setChannel(channelData);
      } catch (error) {
        console.error('Error fetching channel:', error);
        // If channel not found, we can set a default placeholder
        setChannel({
          id: channelId,
          name: 'General Chat',
          description: 'Channel description',
          type: 'public',
          creatorId: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          memberCount: 20
        });
      } finally {
        setLoading(false);
      }
    }

    fetchChannelData();
  }, [channelId]);

  // Track whether we should show the "New messages" indicator
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [hasSeenLatestMessages, setHasSeenLatestMessages] = useState(true);
  
  // Message reply state
  const [replyToMessage, setReplyToMessage] = useState<ChannelMessage | null>(null);
  
  // Reference to track current scrolled position
  const lastScrollTop = useRef(0);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !messagesLoading) {
      // Check if user is near bottom before scrolling
      const container = messageContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        
        if (isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          setHasSeenLatestMessages(true);
          setNewMessageCount(0);
        } else if (messages.length > 0) {
          // If user is scrolled up, increment new message count
          setHasSeenLatestMessages(false);
          setNewMessageCount(prev => prev + 1);
        }
      }
    }
  }, [messages, messagesLoading]);

  // Handle scroll events to detect when user has seen new messages
  const handleScroll = () => {
    const container = messageContainerRef.current;
    if (!container) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isScrollingDown = scrollTop > lastScrollTop.current;
    lastScrollTop.current = scrollTop;
    
    // If scrolled to bottom, mark as seen
    if (scrollHeight - scrollTop - clientHeight < 50 && isScrollingDown) {
      setHasSeenLatestMessages(true);
      setNewMessageCount(0);
    }
  };

  // Handle scrolling to new messages
  const scrollToNewMessages = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHasSeenLatestMessages(true);
    setNewMessageCount(0);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !user?.id) return;
    
    try {
      // Use the channelMessaging hook's sendMessage
      await sendMessage(messageText);
      setMessageText('');
      
      // Clear any reply
      setReplyToMessage(null);
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: unknown ) {
      if (error instanceof Error) {
        console.error('Failed to send message:', error);
        toast.error("Failed to send message", {
          description: error.message || "Please try again"
        });
      } else {
        console.error('Failed to send message:', error);
        toast.error("Failed to send message", {
          description: "An unknown error occurred"
        });
      }
    }
  };

  // Handle replying to a message
  const handleReplyClick = (message: ChannelMessage) => {
    setReplyToMessage(message);
    // Focus the message input
    document.getElementById('message-input')?.focus();
  };

  // Cancel replying
  const cancelReply = () => {
    setReplyToMessage(null);
  };

  // Group messages by date
  const messagesByDate = messages.reduce<{ [date: string]: ChannelMessage[] }>((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Format message time
  const formatMessageTime = (timestamp: string | Date): string => {
    const date = new Date(timestamp);
    return `today ${format(date, 'h:mm a')}`;
  };

  // Check if a message contains a meeting link
  const extractMeetingInfo = (content: string) => {
    const googleMeetRegex = /https:\/\/meet\.google\.com\/[a-z0-9-]+/i;
    const match = content.match(googleMeetRegex);
    
    if (match) {
      return {
        platform: 'Meet',
        description: 'Real-time meetings by Google.',
        meetingName: 'Group meeting',
        time: format(new Date(), 'h:mm a'),
        link: match[0]
      };
    }
    
    return null;
  };

  // Channel header state
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);

  if (loading || messagesLoading) {
    return <div className="flex justify-center items-center h-screen">Loading channel...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Include the typing animation styles */}
      <style dangerouslySetInnerHTML={{ __html: typingAnimationStyles }} />
      
      <div className="flex-grow overflow-hidden flex flex-col">
        {/* Channel header */}
        <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center flex-grow">
            <button 
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div 
              className="flex items-center flex-grow cursor-pointer"
              onClick={() => setIsHeaderOpen(true)}
            >
              <Hash className="h-5 w-5 mr-2 text-gray-500" />
              <h1 className="text-xl font-semibold">{channel?.name || 'Channel'}</h1>
            </div>
          </div>
          <div>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#33363F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 21L16.65 16.65" stroke="#33363F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Channel Header Dialog */}
        <Dialog open={isHeaderOpen} onOpenChange={setIsHeaderOpen}>
          <DialogContent>
            {channel && <ChannelHeader channel={channel} isAdmin={isAdmin} />}
          </DialogContent>
        </Dialog>

        {/* New messages indicator */}
        {!hasSeenLatestMessages && newMessageCount > 0 && (
          <div className="py-2 flex justify-center border-b cursor-pointer" onClick={scrollToNewMessages}>
            <div className="text-red-500 text-sm font-medium">
              New messages ({newMessageCount})
            </div>
          </div>
        )}

        {/* Channel messages */}
        <div 
          className="flex-grow overflow-y-auto px-4"
          ref={messageContainerRef}
          onScroll={handleScroll}
        >
          <div className="flex flex-col space-y-6 py-4">
            {Object.keys(messagesByDate).length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p>No messages yet</p>
                <p className="text-sm mt-2">Be the first to send a message!</p>
              </div>
            )}
            
            {Object.entries(messagesByDate).map(([date, dateMessages]) => (
              <div key={date} className="mb-2">
                <div className="text-center mb-4">
                  <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                    {format(new Date(date), 'MMMM d, yyyy')}
                  </span>
                </div>
                
                {dateMessages.map((message) => {
                  // Extract meeting info if present
                  const meetingInfo = extractMeetingInfo(message.content);
                  const isMeetingCard = !!meetingInfo;
                  
                  return (
                    <div key={message.id} className="flex items-start mb-4">
                      {/* User avatar */}
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center">
                        {getInitials(message.sender?.firstName || '', message.sender?.lastName || '')}
                      </div>
                      
                      {/* Message content */}
                      <div className="ml-3 flex-grow">
                        <div className="flex items-center">
                          <span className="font-semibold">
                            {message.sender?.firstName && message.sender?.lastName 
                              ? `${message.sender.firstName} ${message.sender.lastName}`
                              : message.sender?.email || message.senderId}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                        
                        {/* Regular message content */}
                        {!isMeetingCard && (
                          <p className="mt-1 text-gray-800">
                            {message.content}
                          </p>
                        )}
                        
                        {/* Meeting card */}
                        {isMeetingCard && meetingInfo && (
                          <div className="mt-2 bg-gray-100 rounded-lg p-4 max-w-sm">
                            <div className="flex items-start mb-2">
                              <div className="mr-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <rect width="24" height="24" rx="4" fill="#EEEEEE"/>
                                  <path d="M12 6.5L19 11.5L12 16.5L5 11.5L12 6.5Z" fill="#4285F4"/>
                                  <path d="M12 6.5L5 11.5V16.5L12 11.5V6.5Z" fill="#34A853"/>
                                  <path d="M12 6.5L19 11.5V16.5L12 11.5V6.5Z" fill="#FBBC04"/>
                                  <path d="M12 11.5L5 16.5H19L12 11.5Z" fill="#EA4335"/>
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-semibold">{meetingInfo.platform}</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                  {meetingInfo.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-blue-500">
                              <p className="font-medium">{meetingInfo.meetingName}</p>
                              <p className="font-medium">Time: {meetingInfo.time}</p>
                              <a 
                                href={meetingInfo.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 block mt-1 break-words"
                              >
                                {meetingInfo.link}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Message actions */}
                      <div className="ml-2">
                        <button 
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => handleReplyClick(message)}
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {/* End of messages marker */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Typing indicator */}
        {typingIndicatorText && (
          <div className="border-t border-gray-200 py-2 px-4 bg-blue-50">
            <p className="text-blue-600 text-sm flex items-center">
              <span className="flex items-center">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </span>
              <span className="ml-2">{typingIndicatorText}</span>
            </p>
          </div>
        )}

        {/* Reply to message indicator */}
        {replyToMessage && (
          <div className="border-t border-gray-200 py-2 px-4 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-1 h-6 bg-blue-500 mr-2"></div>
              <div>
                <p className="text-xs text-gray-500">
                  Replying to {replyToMessage.sender?.firstName || replyToMessage.sender?.email || replyToMessage.senderId}
                </p>
                <p className="text-sm text-gray-700 truncate max-w-xs">
                  {replyToMessage.content}
                </p>
              </div>
            </div>
            <button 
              className="text-gray-500 hover:text-gray-700 text-sm"
              onClick={cancelReply}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Message input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex items-center relative">
            <button 
              type="button" 
              className="absolute left-4 p-2 text-gray-500"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#33363F" strokeWidth="2"/>
                <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="#33363F" strokeWidth="2"/>
                <path d="M4.92993 4.92999L8.99993 8.99999" stroke="#33363F" strokeWidth="2"/>
                <path d="M4.92993 19.07L8.99993 15" stroke="#33363F" strokeWidth="2"/>
                <path d="M19.0699 19.07L15 15" stroke="#33363F" strokeWidth="2"/>
                <path d="M19.0699 4.92999L15 8.99999" stroke="#33363F" strokeWidth="2"/>
              </svg>
            </button>
            <input
              id="message-input"
              type="text"
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                if (e.target.value.trim()) {
                  onUserTyping(); // Trigger typing indicator
                }
              }}
              placeholder={`Message # ${channel?.name || 'Channel'}`}
              className="w-full py-3 px-12 rounded-full border border-gray-300 bg-gray-100"
              disabled={isSending}
            />
            <button 
              type="button" 
              className="absolute right-14 p-2 text-gray-500"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#F1D6AB"/>
                <path d="M7 13C7.55228 13 8 12.5523 8 12C8 11.4477 7.55228 11 7 11C6.44772 11 6 11.4477 6 12C6 12.5523 6.44772 13 7 13Z" fill="#111111"/>
                <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="#111111"/>
                <path d="M17 13C17.5523 13 18 12.5523 18 12C18 11.4477 17.5523 11 17 11C16.4477 11 16 11.4477 16 12C16 12.5523 16.4477 13 17 13Z" fill="#111111"/>
              </svg>
            </button>
            <button 
              type="submit" 
              disabled={!messageText.trim() || isSending}
              className="absolute right-4 p-2 text-gray-700 rounded-full"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.33 3.66996C20.1408 3.48213 19.9035 3.35008 19.6442 3.28789C19.3849 3.2257 19.1135 3.23597 18.86 3.31796L4.23 8.19996C3.95867 8.28919 3.71891 8.45077 3.53539 8.66598C3.35188 8.88119 3.23159 9.14255 3.18739 9.42075C3.14319 9.69896 3.17679 9.98416 3.28411 10.2427C3.39143 10.5013 3.56876 10.724 3.79 10.89L8.33 14.21C8.49575 14.3349 8.6962 14.4112 8.90839 14.4288C9.12059 14.4464 9.33318 14.4046 9.52 14.31L14.77 11.47L11.74 14.08C11.5761 14.2214 11.4562 14.4047 11.3941 14.6076C11.3319 14.8106 11.3299 15.0253 11.388 15.229C11.4462 15.4327 11.5626 15.618 11.7239 15.7621C11.8852 15.9061 12.0845 16.003 12.3 16.04L17.86 16.98C18.0745 17.0182 18.2948 17.0024 18.5005 16.9343C18.7062 16.8662 18.8903 16.7479 19.0356 16.5911C19.1809 16.4343 19.2825 16.2437 19.3313 16.0352C19.38 15.8266 19.3741 15.6072 19.31 15.4L20.94 4.46996C20.9947 4.21343 20.982 3.94711 20.9032 3.69826C20.8245 3.44941 20.683 3.22631 20.49 3.04996L20.33 3.66996Z" stroke="#33363F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 
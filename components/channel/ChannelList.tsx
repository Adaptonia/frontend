'use client'
import React, { useState, useEffect } from 'react';
import { 
  createChannel, 
  getChannels, 
  getUserChannels,
  addChannelMember 
} from '@/src/services/appwrite/channel';
import { MdContactEmergency } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';
import { 
  Hash, 
  MessageSquare, 
  Shield, 
  Bell, 
  ChevronDown, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Channel } from '@/lib/types/messaging';

type ChannelSection = {
  title: string;
  type: string;
  icon: React.ReactNode;
  expanded: boolean;
};

type CreateChannelModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onChannelCreated: (channel: Channel) => void;
};

const CreateChannelModal = ({ isOpen, onClose, onChannelCreated }: CreateChannelModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [type, setType] = useState<'public' | 'private'>('public');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user?.id) return;

    setIsLoading(true);
    try {
      const newChannel = await createChannel(
        name.trim(),
        description,
        isPublic ? 'public' : 'private',
        user.id
      );
      
      onChannelCreated(newChannel);
      onClose();
      toast.success("Channel created", {
        description: `${name} has been created successfully.`
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create channel. Please try again.';
      toast.error("Error", {
        description: errorMessage,
      });
        console.error('Failed to create channel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Channel</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Channel Name</label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter channel name"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter channel description"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Channel Type</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as 'public' | 'private')}
              className="w-full p-2 border rounded"
            >
              <option value="public">Public Channel</option>
              <option value="private">Private Channel</option>
            </select>
          </div>
          
          <div className="mb-4 flex items-center">
            <input 
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isPublic">Public Channel</label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Channel'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ChannelList() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [publicChannels, setPublicChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoiningChannel, setIsJoiningChannel] = useState(false);
  const [sections, setSections] = useState<ChannelSection[]>([
    { 
      title: 'Discussion room', 
      type: 'DISCUSSION', 
      icon: <MessageSquare className="h-4 w-4 text-yellow-500" />, 
      expanded: true 
    },
    { 
      title: 'Start Here', 
      type: 'GROUP', 
      icon: <MessageSquare className="h-4 w-4 text-yellow-500" />, 
      expanded: true 
    },
    { 
      title: 'Updates', 
      type: 'ANNOUNCEMENTS', 
      icon: <Bell className="h-4 w-4 text-yellow-500" />, 
      expanded: true 
    },
    { 
      title: 'Support', 
      type: 'SUPPORT', 
      icon: <Shield className="h-4 w-4 text-green-500" />, 
      expanded: true 
    },
    { 
      title: 'Audio Discussions', 
      type: 'GROUP', 
      icon: <MessageSquare className="h-4 w-4 text-yellow-500" />, 
      expanded: true 
    },
  ]);
  
  const router = useRouter();
  const { socket, isConnected} = useWebSocket();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Track new message notifications for channels
  const [channelNotifications, setChannelNotifications] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const fetchChannels = async () => {
      if (!user?.id) return;
      
      try {
        // Get channels the user is a member of
        const userChannels = await getUserChannels(user.id);
        console.log('User channels:', userChannels);
        setChannels(userChannels);
        
        // Get public channels
        const allChannels = await getChannels();
        const public_channels = allChannels.filter(c => c.type === 'public');
        console.log('Public channels:', public_channels);
        setPublicChannels(public_channels);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch channels:', error);
        setIsLoading(false);
      }
    };

    if (user?.id) {
    fetchChannels();
    }
  }, [user?.id]);

  // Listen for new channel messages via WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'channel_message') {
      // If the user is currently not viewing this channel, increment notification count
      const currentPath = window.location.pathname;
          const isViewingChannel = currentPath.includes(`/channels/${message.data.channelId}`);
      
      if (!isViewingChannel) {
        setChannelNotifications(prev => ({
          ...prev,
              [message.data.channelId]: (prev[message.data.channelId] || 0) + 1
        }));
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.addEventListener('message', handleWebSocketMessage);
    
    return () => {
      socket.removeEventListener('message', handleWebSocketMessage);
    };
  }, [socket, isConnected]);

  // Toggle section expansion
  const toggleSection = (index: number) => {
    setSections(prev => 
      prev.map((section, i) => 
        i === index ? { ...section, expanded: !section.expanded } : section
      )
    );
  };

  // Filter channels based on search term and section
  const getFilteredChannels = (type: string) => {
    return channels
      .filter(channel => 
        channel.type === type && 
        channel.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Function to navigate to a channel
  const navigateToChannel = (channelId: string) => {
    // Clear notifications for this channel when navigating to it
    setChannelNotifications(prev => ({
      ...prev,
      [channelId]: 0
    }));
    
    router.push(`/channels/${channelId}`);
  };

  // Get icon for notification count
  const getNotificationBadge = (channelId: string) => {
    const count = channelNotifications[channelId] || 0;
    if (count <= 0) return null;
    
    return (
      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {count <= 99 ? count : '99+'}
      </span>
    );
  };

  // Add this function to handle channel creation
  const handleChannelCreated = (newChannel: Channel) => {
    setChannels(prev => [...prev, newChannel]);
  };

  // Add function to handle joining a channel
  const handleJoinChannel = async (channelId: string, channelName: string) => {
    if (!user?.id) {
      toast.error("Error", { description: "You must be logged in to join a channel" });
      return;
    }
    
    setIsJoiningChannel(true);
    try {
      const membership = await addChannelMember(channelId, user.id);
      console.log('Successfully joined channel:', membership);
      
      // Add the channel to user's channels list
      const joinedChannel = publicChannels.find(c => c.id === channelId);
      if (joinedChannel) {
        const channelWithRole = {
          ...joinedChannel,
          role: membership.role
        };
        
        // Update the channels list immediately
        setChannels(prev => [...prev, channelWithRole]);
        
        // Show success message
        toast.success("Joined channel", {
          description: `You've successfully joined ${channelName}`
        });
        
        // Navigate to the channel
        navigateToChannel(channelId);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join channel. Please try again.';
      console.error('Failed to join channel:', error);
      
      // Show a user-friendly error message
      toast.error("Couldn't join channel", {
        description: errorMessage,
      });
      
      // Let's try to refresh the user channels to make sure we didn't lose connection
      try {
        if (user?.id) {
          const userChannels = await getUserChannels(user.id);
        setChannels(userChannels);
        }
      } catch (refreshError) {
        console.error('Failed to refresh channels after join error:', refreshError);
      }
    } finally {
      setIsJoiningChannel(false);
    }
  };

  // Function to check if user is a member of a channel
  const isChannelMember = (channelId: string) => {
    return channels.some(channel => channel.id === channelId);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading channels...</div>;
  }

  // Display connection status indicator at the top
  const connectionStatus = isConnected ? (
    <div className="px-4 py-2 bg-green-100 text-green-800 text-xs flex items-center">
      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
      Connected
    </div>
  ) : (
    <div className="px-4 py-2 bg-yellow-100 text-yellow-800 text-xs flex items-center">
      <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></div>
      Connecting...
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white text-black">
      {/* Channel header */}
      <div className="p-8 border-b bg-black text-white border-gray-200 flex items-center">
        <div className="flex-grow">
          <h1 className="text-xl font-light flex items-center justify-center mx-auto">
            <div className="h-6 w-6 mr-2 rounded flex items-center justify-center bg-blue-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="white">
                <path d="M12 0L4.5 6L1.5 4.5V19.5L4.5 18L12 24L19.5 18L22.5 19.5V4.5L19.5 6L12 0Z" />
              </svg>
            </div>
            <span>Finance</span>
          </h1>
        </div>
        
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-white hover:bg-blue-700"
            title="Create Channel"
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* Connection status */}
      {connectionStatus}
      
      {/* Channel info */}
      <div className="p-4 border-b ">
        <h2 className="font-semibold flex items-center">
          <span>Adaptonia Finance</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </h2>
        <div className="text-sm text-gray-400 mt-1">102 members • Channel</div>
      </div>
      
      {/* Search */}
      <div className='flex items-center justify-center gap-2 p-2'>
          <div className="rounded-full text-gray-500" >
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-3 w-full bg-[#F2F2F2] text-black rounded-full"
          />
          </div>
      <div className='flex items-center justify-center'>
      <MdContactEmergency className='h-5 w-5' />
      </div>
      <div className='flex items-center justify-center'>
      <FaCalendarAlt className='h-5 w-5' />
      </div>
      </div>
      
      {/* Channel sections */}
      <div className="overflow-y-auto flex-grow">
        {sections.map((section, index) => (
          <div key={section.title} className="mb-2">
            <button
              onClick={() => toggleSection(index)}
              className="flex items-center w-full px-4 py-2 hover:bg-gray-800"
            >
              {section.expanded ? (
                <ChevronDown className="h-4 w-4 mr-1 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1 text-gray-400" />
              )}
              <div className="flex items-center text-yellow-500">
                {section.icon}
                <span className="ml-2 text-gray-400 text-sm">-- {section.title} --</span>
              </div>
            </button>
            
            {section.expanded && (
              <div>
                {getFilteredChannels(section.type).length === 0 ? (
                  <div className="px-8 py-2 text-gray-500 text-sm">
                    No channels found
                  </div>
                ) : (
                  getFilteredChannels(section.type).map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => navigateToChannel(channel.id)}
                      className="flex items-center justify-between w-full px-8 py-2 hover:bg-gray-800 text-left"
                    >
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{channel.name}</span>
                      </div>
                      {getNotificationBadge(channel.id)}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
        
        {/* Public Channels Section */}
        <div className="mb-4 mt-4">
          <div className="flex items-center w-full px-4 py-2 hover:bg-gray-800">
            <ChevronDown className="h-4 w-4 mr-1 text-gray-400" />
            <div className="flex items-center text-blue-500">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="ml-2 text-gray-400 text-sm">-- Public Channels --</span>
            </div>
          </div>
          
          {publicChannels.length === 0 ? (
            <div className="px-8 py-2 text-gray-500 text-sm">
              No public channels available
            </div>
          ) : (
            publicChannels
              .filter(channel => 
                channel.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(channel => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between w-full px-8 py-2 hover:bg-gray-800 text-left"
                >
                  <div className="flex items-center">
                    <Hash className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{channel.name}</span>
                    {channel.memberCount && channel.memberCount > 0 && (
                      <span className="ml-2 text-xs text-gray-400">
                        {channel.memberCount} {channel.memberCount === 1 ? 'member' : 'members'}
                      </span>
                    )}
                  </div>
                  
                  {!isChannelMember(channel.id) ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-blue-500 hover:bg-blue-600 text-black border-none"
                      disabled={isJoiningChannel}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinChannel(channel.id, channel.name);
                      }}
                    >
                      Join
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white"
                      onClick={() => navigateToChannel(channel.id)}
                    >
                      Open
                    </Button>
                  )}
                </div>
              ))
          )}
        </div>
        
        {/* Example items shown in design */}
        <div className="px-8 py-2 hover:bg-gray-800 flex items-center justify-between">
          <div className="flex items-center">
            <Hash className="h-4 w-4 mr-2 text-gray-400" />
            <span>Welcome 👋</span>
          </div>
          <span className="bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">2</span>
        </div>
        
        <div className="px-8 py-2 hover:bg-gray-800 flex items-center">
          <Hash className="h-4 w-4 mr-2 text-gray-400" />
          <span>Support ✅</span>
        </div>
        
        <div className="px-8 py-2 hover:bg-gray-800 flex items-center">
          <Hash className="h-4 w-4 mr-2 text-gray-400" />
          <span>Channel Rules 📜</span>
        </div>
        
        <div className="px-8 py-2 hover:bg-gray-800 flex items-center justify-between">
          <div className="flex items-center">
            <Hash className="h-4 w-4 mr-2 text-gray-400" />
            <span>About 🐻</span>
          </div>
          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">1</span>
        </div>
        
        <div className="px-8 py-2 hover:bg-gray-800 flex items-center justify-between">
          <div className="flex items-center">
            <Hash className="h-4 w-4 mr-2 text-gray-400" />
            <span>Announcements 📢</span>
          </div>
          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">6</span>
        </div>
        
        <div className="px-8 py-2 hover:bg-gray-800 flex items-center">
          <Hash className="h-4 w-4 mr-2 text-gray-400" />
          <span>FAQs ❓</span>
        </div>
        
        <div className="px-8 py-2 hover:bg-gray-800 flex items-center justify-between">
          <div className="flex items-center">
            <Hash className="h-4 w-4 mr-2 text-gray-400" />
            <span>Social media updates 🌎</span>
          </div>
          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">1</span>
        </div>
        
        <div className="px-8 py-2 hover:bg-gray-800 flex items-center justify-between">
          <div className="flex items-center">
            <Hash className="h-4 w-4 mr-2 text-gray-400" />
            <span>Scam reports 🚨</span>
          </div>
          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">2</span>
        </div>
        
        <div className="px-8 py-2 hover:bg-gray-800 flex items-center">
          <Hash className="h-4 w-4 mr-2 text-gray-400" />
          <span>Idea suggestions 💭</span>
        </div>
        
        <div className="px-8 py-2 hover:bg-gray-800 flex items-center">
          <Hash className="h-4 w-4 mr-2 text-gray-400" />
          <span>Group Events 🐕</span>
        </div>
      </div>
      
      {/* Create Channel Modal */}
      {isAdmin && (
        <CreateChannelModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onChannelCreated={handleChannelCreated}
        />
      )}
    </div>
  );
} 
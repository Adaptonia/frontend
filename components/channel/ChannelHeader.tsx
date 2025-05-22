// components/channel/ChannelHeader.tsx
'use client'
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Channel, channelApi } from '@/lib/api/channel';
import { Copy, Link, X } from 'lucide-react';
import { toast } from 'sonner';

interface ChannelHeaderProps {
  channel: Channel;
  isAdmin: boolean;
}

export function ChannelHeader({ channel, isAdmin }: ChannelHeaderProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateInviteLink = async () => {
    try {
      setIsLoading(true);
      const code = await channelApi.generateInviteCode(channel.id);
      const inviteLink = `${window.location.origin}/channels/join?code=${code}`;
      setInviteCode(inviteLink);
    } catch (error) {
      toast.error('Failed to generate invite link', {
        description: 'Failed to generate invite link',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Copied', {
      description: 'Invite link copied to clipboard',
    });
  };

  return (
    <div className="p-4 border-b bg-black text-white border-gray-200 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-light flex items-center">
          <div className="h-6 w-6 mr-2 rounded flex items-center justify-center bg-blue-500">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="white">
              <path d="M12 0L4.5 6L1.5 4.5V19.5L4.5 18L12 24L19.5 18L22.5 19.5V4.5L19.5 6L12 0Z" />
            </svg>
          </div>
          <span>{channel.name}</span>
        </h1>
        <p className="text-sm text-gray-400">{channel.description}</p>
      </div>
      
      {isAdmin && (
        <>
          <Button 
            variant="outline"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsInviteOpen(true)}
          >
            <Link className="h-4 w-4 mr-2" />
            Invite
          </Button>

          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite to {channel.name}</DialogTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-4 top-4"
                  onClick={() => setIsInviteOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {!inviteCode ? (
                  <Button 
                    onClick={generateInviteLink} 
                    className="w-full"
                    disabled={isLoading}
                  >
                    Generate Invite Link
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={inviteCode} 
                      readOnly 
                      className="flex-1"
                    />
                    <Button size="icon" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <p className="text-sm text-gray-500">
                  This invite link can be used by anyone to join this channel.
                  Only admins and owners can generate invite links.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
import React from 'react'

// Skeleton base component
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
)

// Message skeleton
export const MessageSkeleton: React.FC = () => (
  <div className="flex space-x-3 p-4">
    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
)

// Channel skeleton
export const ChannelSkeleton: React.FC = () => (
  <div className="flex items-center space-x-3 p-3 mx-3 rounded-lg">
    <Skeleton className="w-5 h-5 rounded" />
    <Skeleton className="h-4 flex-1" />
    <Skeleton className="w-6 h-4 rounded-full" />
  </div>
)

// Contact skeleton
export const ContactSkeleton: React.FC = () => (
  <div className="flex flex-col items-center space-y-2">
    <Skeleton className="w-15 h-15 rounded-full" />
    <Skeleton className="h-3 w-12" />
  </div>
)

// Channel list skeleton
export const ChannelListSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="p-4 border-b">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      <div className="relative">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>

    {/* Sections skeleton */}
    <div className="space-y-4">
      {[1, 2, 3].map((section) => (
        <div key={section} className="px-4">
          <div className="flex items-center space-x-2 mb-3">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1">
            {[1, 2, 3].map((channel) => (
              <ChannelSkeleton key={channel} />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Chat list skeleton
export const ChatListSkeleton: React.FC = () => (
  <div className="h-full bg-white">
    {/* Header skeleton */}
    <div className="p-6 border-b">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Contacts skeleton */}
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((contact) => (
          <ContactSkeleton key={contact} />
        ))}
      </div>
    </div>

    {/* Content skeleton */}
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <Skeleton className="w-16 h-16 rounded-full mx-auto" />
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  </div>
)

// Chat interface skeleton
export const ChatInterfaceSkeleton: React.FC = () => (
  <div className="flex-1 flex flex-col bg-white">
    {/* Header skeleton */}
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-2">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="h-6 w-32" />
      </div>
      <Skeleton className="w-5 h-5" />
    </div>

    {/* Messages skeleton */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* New messages divider */}
      <div className="flex items-center justify-center">
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Message skeletons */}
      {[1, 2, 3, 4, 5].map((message) => (
        <MessageSkeleton key={message} />
      ))}
    </div>

    {/* Input skeleton */}
    <div className="p-4 border-t">
      <div className="flex items-center space-x-3">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="flex-1 h-10 rounded-lg" />
        <Skeleton className="w-5 h-5" />
        <Skeleton className="w-5 h-5" />
      </div>
    </div>
  </div>
)

// Loading overlay
export const LoadingOverlay: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => (
  <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 shadow-xl">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
        <span className="text-gray-700">{message}</span>
      </div>
    </div>
  </div>
)

export default Skeleton 

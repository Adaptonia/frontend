'use client'
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, ArrowLeft, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

// This is a mock function - in a real app you would fetch this from your backend
const searchUsers = async (searchTerm: string) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock user data
  const mockUsers = [
    { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
    { id: '3', firstName: 'Alex', lastName: 'Johnson', email: 'alex@example.com' },
    { id: '4', firstName: 'Sarah', lastName: 'Williams', email: 'sarah@example.com' },
    { id: '5', firstName: 'Michael', lastName: 'Brown', email: 'michael@example.com' },
  ];

  if (!searchTerm) return [];

  // Filter users based on search term
  return mockUsers.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export default function AddContact() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsLoading(true);
        const results = await searchUsers(searchTerm);
        setSearchResults(results);
        setIsLoading(false);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const handleAddContact = (userId: string) => {
    // In a real app, you would call an API to add the contact
    console.log(`Adding contact with ID: ${userId}`);
    // Navigate to chat with this user
    router.push(`/chat/${userId}`);
  };

  // Function to get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/chat')}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold flex-grow">Add Contacts</h1>
      </div>
      
      {/* Search input */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>
      
      {/* User list */}
      <div className="overflow-y-auto flex-grow p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-gray-500">Searching...</p>
          </div>
        ) : searchTerm.length < 2 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Enter at least 2 characters to search</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No users found matching {searchTerm}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {searchResults.map(user => (
              <li key={user.id} className="py-4 flex items-center">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName} ${user.lastName}`} />
                  <AvatarFallback>
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="ml-4 flex-grow">
                  <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddContact(user.id)}
                  className="flex items-center"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  <span>Add</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Example contacts displayed as circular avatars */}
      <div className="p-4 border-t">
        <h2 className="text-xl font-bold mb-4">Lorem ipsum dolor sit amet</h2>
        <p className="text-gray-500 mb-4">Lorem ipsum dolor sit amet consectetur adipisecteur</p>
        
        <div className="flex justify-center mt-8">
          <div className="flex items-center justify-center relative">
            {/* Circular avatar examples */}
            <Avatar className="h-20 w-20 absolute" style={{ left: '0px' }}>
              <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=John Doe" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            
            <Avatar className="h-20 w-20 absolute" style={{ left: '60px' }}>
              <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=Jane Smith" />
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
            
            <Avatar className="h-28 w-28 z-10 border-4 border-white" style={{ marginLeft: '40px' }}>
              <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=Alex Johnson" />
              <AvatarFallback>AJ</AvatarFallback>
            </Avatar>
            
            <Avatar className="h-20 w-20 absolute" style={{ right: '60px' }}>
              <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=Sarah Williams" />
              <AvatarFallback>SW</AvatarFallback>
            </Avatar>
            
            <Avatar className="h-20 w-20 absolute" style={{ right: '0px' }}>
              <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=Michael Brown" />
              <AvatarFallback>MB</AvatarFallback>
            </Avatar>
          </div>
        </div>
        
        <div className="mt-16">
          <Button 
            className="w-full py-6 rounded-full text-lg"
            onClick={() => router.push('/chat')}
          >
            Add Contacts
          </Button>
        </div>
      </div>
    </div>
  );
} 
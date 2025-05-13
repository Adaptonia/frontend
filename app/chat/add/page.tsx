import React from 'react';
import AddContact from '@/components/chat/AddContact';

export default function AddContactPage() {
  return (
    <div className="flex flex-col h-screen">
      <main className="flex-grow overflow-hidden">
        <AddContact />
      </main>
    </div>
  );
} 
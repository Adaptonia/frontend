'use client';

import React, { useState } from 'react';
import { usePartnershipRequests } from '@/hooks/usePartnershipRequests';
import PartnershipRequestModal from './PartnershipRequestModal';
import { Partnership } from '@/database/partner-accountability-schema';

const PartnershipRequestHandler: React.FC = () => {
  const { pendingRequests, removeRequest } = usePartnershipRequests();
  const [currentRequestIndex, setCurrentRequestIndex] = useState(0);

  const currentRequest = pendingRequests[currentRequestIndex];

  const handlePartnershipAccepted = (partnership: Partnership) => {
    removeRequest(partnership.id);
    
    // If there are more requests, show the next one
    if (currentRequestIndex < pendingRequests.length - 1) {
      setCurrentRequestIndex(prev => prev + 1);
    } else {
      setCurrentRequestIndex(0);
    }
  };

  const handlePartnershipDeclined = (partnership: Partnership) => {
    removeRequest(partnership.id);
    
    // If there are more requests, show the next one
    if (currentRequestIndex < pendingRequests.length - 1) {
      setCurrentRequestIndex(prev => prev + 1);
    } else {
      setCurrentRequestIndex(0);
    }
  };

  const handleClose = () => {
    // Move to next request or close if no more
    if (currentRequestIndex < pendingRequests.length - 1) {
      setCurrentRequestIndex(prev => prev + 1);
    } else {
      setCurrentRequestIndex(0);
    }
  };

  if (!currentRequest) {
    return null;
  }

  return (
    <PartnershipRequestModal
      partnership={currentRequest.partnership}
      requesterPreferences={currentRequest.requesterPreferences}
      requesterUserDetails={currentRequest.requesterUserDetails}
      isOpen={true}
      onClose={handleClose}
      onPartnershipAccepted={handlePartnershipAccepted}
      onPartnershipDeclined={handlePartnershipDeclined}
    />
  );
};

export default PartnershipRequestHandler;

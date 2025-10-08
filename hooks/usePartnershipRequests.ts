'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { partnershipService } from '@/services/appwrite/partnershipService';
import { userService } from '@/services/userService';
import { Partnership, PartnershipPreferences } from '@/database/partner-accountability-schema';

interface PartnershipRequest {
  partnership: Partnership;
  requesterPreferences: PartnershipPreferences;
  requesterUserDetails?: any;
}

export const usePartnershipRequests = () => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<PartnershipRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const checkForPendingRequests = async () => {
    if (!user?.id || hasChecked) return;

    setLoading(true);
    try {
      // Get user's partnerships
      const partnerships = await partnershipService.getUserPartnerships(user.id);
      
      // Filter for pending partnerships where the current user is not the requester
      const pendingPartnerships = partnerships.filter(
        partnership => partnership.status === 'pending' && partnership.user2Id === user.id
      );

      if (pendingPartnerships.length > 0) {
        // Get requester preferences and user details for each pending partnership
        const requestsWithPreferences = await Promise.all(
          pendingPartnerships.map(async (partnership) => {
            const requesterPreferences = await partnershipService.getPartnerPreferences(partnership.user1Id);
            
            // Fetch requester's user details
            let requesterUserDetails = null;
            try {
              const userResult = await userService.getUserById(partnership.user1Id);
              if (userResult.success && userResult.data) {
                requesterUserDetails = userResult.data;
              }
            } catch (error) {
              console.error(`Error fetching requester user details for ${partnership.user1Id}:`, error);
            }
            
            return {
              partnership,
              requesterPreferences: requesterPreferences!,
              requesterUserDetails
            };
          })
        );

        setPendingRequests(requestsWithPreferences);
      }
    } catch (error) {
      console.error('Error checking for pending partnership requests:', error);
    } finally {
      setLoading(false);
      setHasChecked(true);
    }
  };

  const removeRequest = (partnershipId: string) => {
    setPendingRequests(prev => 
      prev.filter(request => request.partnership.id !== partnershipId)
    );
  };

  const markAsChecked = () => {
    setHasChecked(true);
  };

  useEffect(() => {
    if (user?.id && !hasChecked) {
      checkForPendingRequests();
    }
  }, [user?.id, hasChecked]);

  return {
    pendingRequests,
    loading,
    hasChecked,
    checkForPendingRequests,
    removeRequest,
    markAsChecked
  };
};

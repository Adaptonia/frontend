'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { expertService } from '@/services/appwrite/expertService';
import { ExpertProfile } from '@/database/partner-accountability-schema';

export const useExpertProfile = () => {
  const { user } = useAuth();
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExpert, setIsExpert] = useState(false);

  const loadExpertProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const profile = await expertService.getExpertProfile(user.id);
      setExpertProfile(profile);
      setIsExpert(!!profile);
    } catch (error) {
      console.error('Error loading expert profile:', error);
      setExpertProfile(null);
      setIsExpert(false);
    } finally {
      setLoading(false);
    }
  };

  const createExpertProfile = async (profileData: any) => {
    if (!user?.id) return null;

    setLoading(true);
    try {
      const profile = await expertService.createExpertProfile(profileData);
      setExpertProfile(profile);
      setIsExpert(true);
      return profile;
    } catch (error) {
      console.error('Error creating expert profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateExpertProfile = async (profileData: any) => {
    if (!user?.id || !expertProfile) return null;

    setLoading(true);
    try {
      const profile = await expertService.updateExpertProfile(user.id, profileData);
      setExpertProfile(profile);
      return profile;
    } catch (error) {
      console.error('Error updating expert profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteExpertProfile = async () => {
    if (!user?.id || !expertProfile) return false;

    setLoading(true);
    try {
      const success = await expertService.deleteExpertProfile(user.id);
      if (success) {
        setExpertProfile(null);
        setIsExpert(false);
      }
      return success;
    } catch (error) {
      console.error('Error deleting expert profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadExpertProfile();
    }
  }, [user?.id]);

  return {
    expertProfile,
    isExpert,
    loading,
    loadExpertProfile,
    createExpertProfile,
    updateExpertProfile,
    deleteExpertProfile
  };
};





import { partnershipService } from './appwrite/partnershipService';
import { PartnershipPreferences, Partnership } from '../database/partner-accountability-schema';

export interface MatchingResult {
  success: boolean;
  partnership?: Partnership;
  message: string;
  error?: string;
}

export interface PartnerSearchCriteria {
  category?: string;
  supportStyle?: string;
  timeCommitment?: 'daily' | 'weekly' | 'flexible';
  partnerType?: 'p2p' | 'premium_expert' | 'either';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  maxDistance?: number; // for location-based matching later
}

class PartnerMatchingService {

  /**
   * Main matching function - finds and creates a partnership for a user
   */
  async findAndCreatePartnership(userId: string): Promise<MatchingResult> {
    try {
      // 1. Check if user already has an active partnership
      const existingPartnership = await partnershipService.getUserPartnership(userId);
      if (existingPartnership) {
        return {
          success: false,
          message: 'You already have an active partnership',
          error: 'ALREADY_PARTNERED'
        };
      }

      // 2. Get user's preferences
      const userPreferences = await partnershipService.getPartnerPreferences(userId);
      if (!userPreferences) {
        return {
          success: false,
          message: 'Please set your partner preferences first',
          error: 'NO_PREFERENCES'
        };
      }

      if (!userPreferences.isAvailableForMatching) {
        return {
          success: false,
          message: 'Your account is not set as available for matching',
          error: 'NOT_AVAILABLE'
        };
      }

      // 3. Find best match
      const bestMatch = await partnershipService.findBestMatch(userId);
      if (!bestMatch) {
        return {
          success: false,
          message: 'No compatible partners found at this time. We\'ll notify you when a match becomes available.',
          error: 'NO_MATCHES'
        };
      }

      // 4. Create partnership
      const partnership = await partnershipService.requestPartnership(
        userId,
        bestMatch.userId,
        userPreferences.preferredPartnerType === 'either' ? 'p2p' : userPreferences.preferredPartnerType
      );

      if (!partnership) {
        return {
          success: false,
          message: 'Failed to create partnership. Please try again.',
          error: 'CREATION_FAILED'
        };
      }

      // 5. Calculate compatibility score for user feedback
      const compatibilityScore = await partnershipService.calculateCompatibilityScore(
        userPreferences,
        bestMatch
      );

      return {
        success: true,
        partnership,
        message: `Great match found! You have ${compatibilityScore}% compatibility with your new partner.`
      };

    } catch (error) {
      console.error('Error in findAndCreatePartnership:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while finding your partner',
        error: 'UNEXPECTED_ERROR'
      };
    }
  }

  /**
   * Search for potential partners based on specific criteria
   */
  async searchPotentialPartners(
    userId: string,
    criteria: PartnerSearchCriteria
  ): Promise<{ partners: PartnershipPreferences[]; scores: number[] }> {
    try {
      const userPreferences = await partnershipService.getPartnerPreferences(userId);
      if (!userPreferences) {
        return { partners: [], scores: [] };
      }

      // Build search criteria from user preferences and filters
      const searchCriteria = {
        preferredPartnerType: criteria.partnerType || userPreferences.preferredPartnerType,
        supportStyle: criteria.supportStyle ? [criteria.supportStyle] : userPreferences.supportStyle,
        categories: criteria.category ? [criteria.category] : userPreferences.availableCategories,
        timeCommitment: criteria.timeCommitment || userPreferences.timeCommitment,
        experienceLevel: criteria.experienceLevel || userPreferences.experienceLevel,
        timezone: userPreferences.timezone,
      };

      const potentialPartners = await partnershipService.findPotentialPartners(searchCriteria);

      // Calculate compatibility scores
      const partnersWithScores = await Promise.all(
        potentialPartners
          .filter(partner => partner.userId !== userId) // Don't include self
          .map(async (partner) => ({
            partner,
            score: await partnershipService.calculateCompatibilityScore(userPreferences, partner)
          }))
      );

      // Sort by compatibility score
      partnersWithScores.sort((a, b) => b.score - a.score);

      return {
        partners: partnersWithScores.map(p => p.partner),
        scores: partnersWithScores.map(p => p.score)
      };

    } catch (error) {
      console.error('Error searching potential partners:', error);
      return { partners: [], scores: [] };
    }
  }

  /**
   * Manually request partnership with a specific user
   */
  async requestSpecificPartnership(
    requesterId: string,
    partnerId: string,
    partnershipType: 'p2p' | 'premium_expert' = 'p2p'
  ): Promise<MatchingResult> {
    try {
      // Check if both users are available
      const requesterPrefs = await partnershipService.getPartnerPreferences(requesterId);
      const partnerPrefs = await partnershipService.getPartnerPreferences(partnerId);

      if (!requesterPrefs?.isAvailableForMatching) {
        return {
          success: false,
          message: 'You are not available for matching',
          error: 'REQUESTER_NOT_AVAILABLE'
        };
      }

      if (!partnerPrefs?.isAvailableForMatching) {
        return {
          success: false,
          message: 'The requested partner is not available for matching',
          error: 'PARTNER_NOT_AVAILABLE'
        };
      }

      // Check compatibility
      const compatibilityScore = await partnershipService.calculateCompatibilityScore(
        requesterPrefs,
        partnerPrefs
      );

      if (compatibilityScore < 40) {
        return {
          success: false,
          message: `Low compatibility (${compatibilityScore}%). Consider finding a better match.`,
          error: 'LOW_COMPATIBILITY'
        };
      }

      // Create partnership
      const partnership = await partnershipService.requestPartnership(
        requesterId,
        partnerId,
        partnershipType
      );

      if (!partnership) {
        return {
          success: false,
          message: 'Failed to create partnership',
          error: 'CREATION_FAILED'
        };
      }

      return {
        success: true,
        partnership,
        message: `Partnership request sent! Compatibility: ${compatibilityScore}%`
      };

    } catch (error) {
      console.error('Error requesting specific partnership:', error);
      return {
        success: false,
        message: 'Failed to request partnership',
        error: 'UNEXPECTED_ERROR'
      };
    }
  }

  /**
   * Accept a partnership request
   */
  async acceptPartnership(partnershipId: string, userId: string): Promise<MatchingResult> {
    try {
      const partnership = await partnershipService.getPartnership(partnershipId);
      if (!partnership) {
        return {
          success: false,
          message: 'Partnership not found',
          error: 'NOT_FOUND'
        };
      }

      // Check if user is part of this partnership
      if (partnership.user1Id !== userId && partnership.user2Id !== userId) {
        return {
          success: false,
          message: 'You are not authorized to accept this partnership',
          error: 'NOT_AUTHORIZED'
        };
      }

      // Update status to active
      const success = await partnershipService.updatePartnershipStatus(partnershipId, 'active');
      if (!success) {
        return {
          success: false,
          message: 'Failed to activate partnership',
          error: 'UPDATE_FAILED'
        };
      }

      return {
        success: true,
        partnership: { ...partnership, status: 'active' },
        message: 'Partnership activated! You can now start sharing goals and tasks.'
      };

    } catch (error) {
      console.error('Error accepting partnership:', error);
      return {
        success: false,
        message: 'Failed to accept partnership',
        error: 'UNEXPECTED_ERROR'
      };
    }
  }

  /**
   * Decline a partnership request
   */
  async declinePartnership(partnershipId: string, userId: string): Promise<MatchingResult> {
    try {
      const partnership = await partnershipService.getPartnership(partnershipId);
      if (!partnership) {
        return {
          success: false,
          message: 'Partnership not found',
          error: 'NOT_FOUND'
        };
      }

      // Check if user is part of this partnership
      if (partnership.user1Id !== userId && partnership.user2Id !== userId) {
        return {
          success: false,
          message: 'You are not authorized to decline this partnership',
          error: 'NOT_AUTHORIZED'
        };
      }

      // Update status to ended
      const success = await partnershipService.updatePartnershipStatus(partnershipId, 'ended');
      if (!success) {
        return {
          success: false,
          message: 'Failed to decline partnership',
          error: 'UPDATE_FAILED'
        };
      }

      return {
        success: true,
        message: 'Partnership declined. You are now available for new matches.'
      };

    } catch (error) {
      console.error('Error declining partnership:', error);
      return {
        success: false,
        message: 'Failed to decline partnership',
        error: 'UNEXPECTED_ERROR'
      };
    }
  }

  /**
   * End an active partnership
   */
  async endPartnership(partnershipId: string, userId: string, reason?: string): Promise<MatchingResult> {
    try {
      const partnership = await partnershipService.getPartnership(partnershipId);
      if (!partnership) {
        return {
          success: false,
          message: 'Partnership not found',
          error: 'NOT_FOUND'
        };
      }

      // Check if user is part of this partnership
      if (partnership.user1Id !== userId && partnership.user2Id !== userId) {
        return {
          success: false,
          message: 'You are not authorized to end this partnership',
          error: 'NOT_AUTHORIZED'
        };
      }

      // Update status to ended
      const success = await partnershipService.updatePartnershipStatus(partnershipId, 'ended');
      if (!success) {
        return {
          success: false,
          message: 'Failed to end partnership',
          error: 'UPDATE_FAILED'
        };
      }

      return {
        success: true,
        message: 'Partnership ended. You are now available for new matches.'
      };

    } catch (error) {
      console.error('Error ending partnership:', error);
      return {
        success: false,
        message: 'Failed to end partnership',
        error: 'UNEXPECTED_ERROR'
      };
    }
  }

  /**
   * Get partnership analytics and insights
   */
  async getPartnershipInsights(partnershipId: string): Promise<{
    compatibility: number;
    sharedCategories: string[];
    strengthAreas: string[];
    improvementAreas: string[];
  } | null> {
    try {
      const partnership = await partnershipService.getPartnership(partnershipId);
      if (!partnership) return null;

      const user1Prefs = await partnershipService.getPartnerPreferences(partnership.user1Id);
      const user2Prefs = await partnershipService.getPartnerPreferences(partnership.user2Id);

      if (!user1Prefs || !user2Prefs) return null;

      const compatibility = await partnershipService.calculateCompatibilityScore(user1Prefs, user2Prefs);

      const sharedCategories = user1Prefs.availableCategories.filter(cat =>
        user2Prefs.availableCategories.includes(cat)
      );

      const strengthAreas: string[] = [];
      const improvementAreas: string[] = [];

      // Analyze strengths and areas for improvement
      if (user1Prefs.timeCommitment === user2Prefs.timeCommitment) {
        strengthAreas.push('Time commitment alignment');
      } else {
        improvementAreas.push('Different time commitments');
      }

      if (user1Prefs.experienceLevel === user2Prefs.experienceLevel) {
        strengthAreas.push('Similar experience levels');
      }

      const commonSupportStyles = user1Prefs.supportStyle.filter(style =>
        user2Prefs.supportStyle.includes(style)
      );
      if (commonSupportStyles.length > 0) {
        strengthAreas.push(`Shared support styles: ${commonSupportStyles.join(', ')}`);
      }

      return {
        compatibility,
        sharedCategories,
        strengthAreas,
        improvementAreas
      };

    } catch (error) {
      console.error('Error getting partnership insights:', error);
      return null;
    }
  }
}

export const partnerMatchingService = new PartnerMatchingService();
export default partnerMatchingService;
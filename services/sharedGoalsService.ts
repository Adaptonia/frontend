import { Client, Databases, ID, Query } from 'appwrite';
import { SharedGoal, PartnerTask } from '../database/partner-accountability-schema';

// Initialize Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

// Collection IDs
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTIONS = {
  SHARED_GOALS: process.env.NEXT_PUBLIC_APPWRITE_SHARED_GOALS_COLLECTION_ID!,
  PARTNER_TASKS: process.env.NEXT_PUBLIC_APPWRITE_PARTNER_TASKS_COLLECTION_ID!,
};

export interface CreateSharedGoalData {
  partnershipId: string;
  ownerId: string;
  partnerId: string;
  title: string;
  description?: string;
  category: 'schedule' | 'finance' | 'career' | 'audio_books';
  deadline?: string;
  supportStyle: string;
  verificationRequired?: boolean;
  reminderEnabled?: boolean;
}

export interface CreatePartnerTaskData {
  sharedGoalId: string;
  partnershipId: string;
  ownerId: string;
  partnerId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  estimatedTime?: string;
  tags?: string[];
  verificationRequired?: boolean;
}

export interface TaskVerificationData {
  taskId: string;
  action: 'approve' | 'reject' | 'request_redo';
  comment?: string;
  verifierId: string;
}

class SharedGoalsService {

  // ========== SHARED GOALS ==========

  async createSharedGoal(data: CreateSharedGoalData): Promise<SharedGoal | null> {
    try {
      const now = new Date().toISOString();

      const goalData: Omit<SharedGoal, 'id'> = {
        partnershipId: data.partnershipId,
        ownerId: data.ownerId,
        partnerId: data.partnerId,
        title: data.title,
        description: data.description,
        category: data.category,
        deadline: data.deadline,
        supportStyle: data.supportStyle,
        accountability: JSON.stringify({
          preferredPartnerType: 'p2p', // Default, could be passed in
          verificationRequired: data.verificationRequired ?? true,
          reminderEnabled: data.reminderEnabled ?? true,
        }),
        progress: JSON.stringify({
          totalTasks: 0,
          completedTasks: 0,
          verifiedTasks: 0,
          lastUpdated: now,
        }),
        isCompleted: false,
        isShared: true,
        createdAt: now,
        updatedAt: now,
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_GOALS,
        ID.unique(),
        goalData
      );

      return {
        id: result.$id,
        ...goalData,
        accountability: JSON.parse(goalData.accountability),
        progress: JSON.parse(goalData.progress),
      };
    } catch (error) {
      console.error('Error creating shared goal:', error);
      return null;
    }
  }

  async getSharedGoal(goalId: string): Promise<SharedGoal | null> {
    try {
      const result = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_GOALS,
        goalId
      );

      return {
        id: result.$id,
        partnershipId: result.partnershipId,
        ownerId: result.ownerId,
        partnerId: result.partnerId,
        title: result.title,
        description: result.description,
        category: result.category,
        deadline: result.deadline,
        supportStyle: result.supportStyle,
        accountability: JSON.parse(result.accountability || '{}'),
        progress: JSON.parse(result.progress || '{}'),
        isCompleted: result.isCompleted,
        isShared: result.isShared,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    } catch (error) {
      console.error('Error getting shared goal:', error);
      return null;
    }
  }

  async getPartnershipGoals(partnershipId: string): Promise<SharedGoal[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SHARED_GOALS,
        [
          Query.equal('partnershipId', partnershipId),
          Query.orderDesc('createdAt')
        ]
      );

      return result.documents.map(doc => ({
        id: doc.$id,
        partnershipId: doc.partnershipId,
        ownerId: doc.ownerId,
        partnerId: doc.partnerId,
        title: doc.title,
        description: doc.description,
        category: doc.category,
        deadline: doc.deadline,
        supportStyle: doc.supportStyle,
        accountability: JSON.parse(doc.accountability || '{}'),
        progress: JSON.parse(doc.progress || '{}'),
        isCompleted: doc.isCompleted,
        isShared: doc.isShared,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));
    } catch (error) {
      console.error('Error getting partnership goals:', error);
      return [];
    }
  }

  async getUserSharedGoals(userId: string): Promise<SharedGoal[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SHARED_GOALS,
        [
          Query.or([
            Query.equal('ownerId', userId),
            Query.equal('partnerId', userId)
          ]),
          Query.orderDesc('createdAt')
        ]
      );

      return result.documents.map(doc => ({
        id: doc.$id,
        partnershipId: doc.partnershipId,
        ownerId: doc.ownerId,
        partnerId: doc.partnerId,
        title: doc.title,
        description: doc.description,
        category: doc.category,
        deadline: doc.deadline,
        supportStyle: doc.supportStyle,
        accountability: JSON.parse(doc.accountability || '{}'),
        progress: JSON.parse(doc.progress || '{}'),
        isCompleted: doc.isCompleted,
        isShared: doc.isShared,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));
    } catch (error) {
      console.error('Error getting user shared goals:', error);
      return [];
    }
  }

  async updateSharedGoal(
    goalId: string,
    updates: Partial<CreateSharedGoalData>
  ): Promise<SharedGoal | null> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const result = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_GOALS,
        goalId,
        updateData
      );

      return {
        id: result.$id,
        partnershipId: result.partnershipId,
        ownerId: result.ownerId,
        partnerId: result.partnerId,
        title: result.title,
        description: result.description,
        category: result.category,
        deadline: result.deadline,
        supportStyle: result.supportStyle,
        accountability: JSON.parse(result.accountability || '{}'),
        progress: JSON.parse(result.progress || '{}'),
        isCompleted: result.isCompleted,
        isShared: result.isShared,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    } catch (error) {
      console.error('Error updating shared goal:', error);
      return null;
    }
  }

  async toggleGoalCompletion(goalId: string, userId: string): Promise<SharedGoal | null> {
    try {
      const goal = await this.getSharedGoal(goalId);
      if (!goal) return null;

      // Check if user is authorized to toggle completion
      if (goal.ownerId !== userId && goal.partnerId !== userId) {
        throw new Error('User not authorized to modify this goal');
      }

      const isCompleted = !goal.isCompleted;
      const now = new Date().toISOString();

      const result = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_GOALS,
        goalId,
        {
          isCompleted,
          updatedAt: now,
        }
      );

      return {
        ...goal,
        isCompleted,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Error toggling goal completion:', error);
      return null;
    }
  }

  // ========== PARTNER TASKS ==========

  async createPartnerTask(data: CreatePartnerTaskData): Promise<PartnerTask | null> {
    try {
      const now = new Date().toISOString();

      const taskData: Omit<PartnerTask, 'id'> = {
        sharedGoalId: data.sharedGoalId,
        partnershipId: data.partnershipId,
        ownerId: data.ownerId,
        partnerId: data.partnerId,
        title: data.title,
        description: data.description,
        status: 'pending',
        verificationStatus: data.verificationRequired ? 'not_required' : 'not_required',
        verificationRequired: data.verificationRequired ?? true,
        dueDate: data.dueDate,
        verificationHistory: JSON.stringify([]),
        priority: data.priority || 'medium',
        estimatedTime: data.estimatedTime,
        tags: data.tags || [],
        createdAt: now,
        updatedAt: now,
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PARTNER_TASKS,
        ID.unique(),
        taskData
      );

      // Update goal progress
      await this.updateGoalProgress(data.sharedGoalId);

      return {
        id: result.$id,
        ...taskData,
        verificationHistory: [],
      };
    } catch (error) {
      console.error('Error creating partner task:', error);
      return null;
    }
  }

  async getPartnerTask(taskId: string): Promise<PartnerTask | null> {
    try {
      const result = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PARTNER_TASKS,
        taskId
      );

      return {
        id: result.$id,
        sharedGoalId: result.sharedGoalId,
        partnershipId: result.partnershipId,
        ownerId: result.ownerId,
        partnerId: result.partnerId,
        title: result.title,
        description: result.description,
        status: result.status,
        verificationStatus: result.verificationStatus,
        verificationRequired: result.verificationRequired,
        dueDate: result.dueDate,
        markedDoneAt: result.markedDoneAt,
        verifiedAt: result.verifiedAt,
        verificationComment: result.verificationComment,
        verificationEvidence: result.verificationEvidence,
        verificationHistory: JSON.parse(result.verificationHistory || '[]'),
        priority: result.priority,
        estimatedTime: result.estimatedTime,
        tags: result.tags || [],
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    } catch (error) {
      console.error('Error getting partner task:', error);
      return null;
    }
  }

  async getGoalTasks(goalId: string): Promise<PartnerTask[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PARTNER_TASKS,
        [
          Query.equal('sharedGoalId', goalId),
          Query.orderDesc('createdAt')
        ]
      );

      return result.documents.map(doc => ({
        id: doc.$id,
        sharedGoalId: doc.sharedGoalId,
        partnershipId: doc.partnershipId,
        ownerId: doc.ownerId,
        partnerId: doc.partnerId,
        title: doc.title,
        description: doc.description,
        status: doc.status,
        verificationStatus: doc.verificationStatus,
        verificationRequired: doc.verificationRequired,
        dueDate: doc.dueDate,
        markedDoneAt: doc.markedDoneAt,
        verifiedAt: doc.verifiedAt,
        verificationComment: doc.verificationComment,
        verificationEvidence: doc.verificationEvidence,
        verificationHistory: JSON.parse(doc.verificationHistory || '[]'),
        priority: doc.priority,
        estimatedTime: doc.estimatedTime,
        tags: doc.tags || [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));
    } catch (error) {
      console.error('Error getting goal tasks:', error);
      return [];
    }
  }

  async getPartnershipTasks(partnershipId: string): Promise<PartnerTask[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PARTNER_TASKS,
        [
          Query.equal('partnershipId', partnershipId),
          Query.orderDesc('createdAt')
        ]
      );

      return result.documents.map(doc => ({
        id: doc.$id,
        sharedGoalId: doc.sharedGoalId,
        partnershipId: doc.partnershipId,
        ownerId: doc.ownerId,
        partnerId: doc.partnerId,
        title: doc.title,
        description: doc.description,
        status: doc.status,
        verificationStatus: doc.verificationStatus,
        verificationRequired: doc.verificationRequired,
        dueDate: doc.dueDate,
        markedDoneAt: doc.markedDoneAt,
        verifiedAt: doc.verifiedAt,
        verificationComment: doc.verificationComment,
        verificationEvidence: doc.verificationEvidence,
        verificationHistory: JSON.parse(doc.verificationHistory || '[]'),
        priority: doc.priority,
        estimatedTime: doc.estimatedTime,
        tags: doc.tags || [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));
    } catch (error) {
      console.error('Error getting partnership tasks:', error);
      return [];
    }
  }

  async markTaskAsDone(
    taskId: string,
    userId: string,
    evidence?: string,
    comment?: string
  ): Promise<PartnerTask | null> {
    try {
      const task = await this.getPartnerTask(taskId);
      if (!task) return null;

      // Check if user is the task owner
      if (task.ownerId !== userId) {
        throw new Error('Only task owner can mark as done');
      }

      const now = new Date().toISOString();
      const newStatus = task.verificationRequired ? 'marked_done' : 'verified';
      const newVerificationStatus = task.verificationRequired ? 'pending' : 'approved';

      // Add to verification history
      const history = task.verificationHistory || [];
      history.push({
        action: 'marked_done',
        by: userId,
        at: now,
        comment,
      });

      const updateData = {
        status: newStatus,
        verificationStatus: newVerificationStatus,
        markedDoneAt: now,
        verificationEvidence: evidence,
        verificationHistory: JSON.stringify(history),
        updatedAt: now,
      };

      // If verification is not required, mark as verified immediately
      if (!task.verificationRequired) {
        updateData.verifiedAt = now;
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PARTNER_TASKS,
        taskId,
        updateData
      );

      // Update goal progress
      await this.updateGoalProgress(task.sharedGoalId);

      return {
        ...task,
        ...updateData,
        verificationHistory: history,
      };
    } catch (error) {
      console.error('Error marking task as done:', error);
      return null;
    }
  }

  async verifyTask(data: TaskVerificationData): Promise<PartnerTask | null> {
    try {
      const task = await this.getPartnerTask(data.taskId);
      if (!task) return null;

      // Check if user is the partner (verifier)
      if (task.partnerId !== data.verifierId) {
        throw new Error('Only partner can verify tasks');
      }

      const now = new Date().toISOString();
      let newStatus = task.status;
      let newVerificationStatus = task.verificationStatus;

      // Update status based on verification action
      switch (data.action) {
        case 'approve':
          newStatus = 'verified';
          newVerificationStatus = 'approved';
          break;
        case 'reject':
          newStatus = 'rejected';
          newVerificationStatus = 'rejected';
          break;
        case 'request_redo':
          newStatus = 'pending';
          newVerificationStatus = 'redo_requested';
          break;
      }

      // Add to verification history
      const history = task.verificationHistory || [];
      history.push({
        action: data.action === 'approve' ? 'verified' : data.action === 'reject' ? 'rejected' : 'redo_requested',
        by: data.verifierId,
        at: now,
        comment: data.comment,
      });

      const updateData = {
        status: newStatus,
        verificationStatus: newVerificationStatus,
        verificationComment: data.comment,
        verificationHistory: JSON.stringify(history),
        updatedAt: now,
      };

      if (data.action === 'approve') {
        updateData.verifiedAt = now;
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PARTNER_TASKS,
        data.taskId,
        updateData
      );

      // Update goal progress
      await this.updateGoalProgress(task.sharedGoalId);

      return {
        ...task,
        ...updateData,
        verificationHistory: history,
      };
    } catch (error) {
      console.error('Error verifying task:', error);
      return null;
    }
  }

  async getTasksPendingVerification(partnerId: string): Promise<PartnerTask[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PARTNER_TASKS,
        [
          Query.equal('partnerId', partnerId),
          Query.equal('status', 'marked_done'),
          Query.equal('verificationStatus', 'pending'),
          Query.orderAsc('markedDoneAt')
        ]
      );

      return result.documents.map(doc => ({
        id: doc.$id,
        sharedGoalId: doc.sharedGoalId,
        partnershipId: doc.partnershipId,
        ownerId: doc.ownerId,
        partnerId: doc.partnerId,
        title: doc.title,
        description: doc.description,
        status: doc.status,
        verificationStatus: doc.verificationStatus,
        verificationRequired: doc.verificationRequired,
        dueDate: doc.dueDate,
        markedDoneAt: doc.markedDoneAt,
        verifiedAt: doc.verifiedAt,
        verificationComment: doc.verificationComment,
        verificationEvidence: doc.verificationEvidence,
        verificationHistory: JSON.parse(doc.verificationHistory || '[]'),
        priority: doc.priority,
        estimatedTime: doc.estimatedTime,
        tags: doc.tags || [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));
    } catch (error) {
      console.error('Error getting tasks pending verification:', error);
      return [];
    }
  }

  // ========== HELPER METHODS ==========

  private async updateGoalProgress(goalId: string): Promise<void> {
    try {
      const tasks = await this.getGoalTasks(goalId);
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'verified').length;
      const verifiedTasks = completedTasks; // Same as completed for now

      const progress = {
        totalTasks,
        completedTasks,
        verifiedTasks,
        lastUpdated: new Date().toISOString(),
      };

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_GOALS,
        goalId,
        {
          progress: JSON.stringify(progress),
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  }

  async getPartnershipStats(partnershipId: string): Promise<{
    totalGoals: number;
    completedGoals: number;
    totalTasks: number;
    completedTasks: number;
    pendingVerifications: number;
    completionRate: number;
  }> {
    try {
      const goals = await this.getPartnershipGoals(partnershipId);
      const tasks = await this.getPartnershipTasks(partnershipId);

      const totalGoals = goals.length;
      const completedGoals = goals.filter(g => g.isCompleted).length;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'verified').length;
      const pendingVerifications = tasks.filter(t => t.verificationStatus === 'pending').length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        totalGoals,
        completedGoals,
        totalTasks,
        completedTasks,
        pendingVerifications,
        completionRate: Math.round(completionRate),
      };
    } catch (error) {
      console.error('Error getting partnership stats:', error);
      return {
        totalGoals: 0,
        completedGoals: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingVerifications: 0,
        completionRate: 0,
      };
    }
  }
}

export const sharedGoalsService = new SharedGoalsService();
export default sharedGoalsService;
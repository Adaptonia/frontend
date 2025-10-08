import { databases } from './client';
import { DATABASE_ID, EXPERT_TASKS_COLLECTION_ID, TASK_SUBMISSIONS_COLLECTION_ID } from '@/lib/appwrite/config';
import { ExpertTask, TaskSubmission } from '@/database/partner-accountability-schema';
import { Query } from 'appwrite';

export interface CreateExpertTaskData {
  expertId: string;
  title: string;
  description: string;
  dueDate: string;
  isActive?: boolean;
}

export interface UpdateExpertTaskData {
  title?: string;
  description?: string;
  dueDate?: string;
  isActive?: boolean;
}

export interface CreateTaskSubmissionData {
  taskId: string;
  memberId: string;
  submissionText: string;
  submissionLink?: string;
}

export interface UpdateTaskSubmissionData {
  status?: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  expertComment?: string;
}

class ExpertTaskService {
  // Expert Task CRUD operations
  async createExpertTask(data: CreateExpertTaskData): Promise<ExpertTask> {
    try {
      console.log('🔍 Creating expert task:', data.title);
      
      const result = await databases.createDocument(
        DATABASE_ID,
        EXPERT_TASKS_COLLECTION_ID,
        'unique()',
        {
          expertId: data.expertId,
          taskTitle: data.title,
          description: data.description,
          dueDate: data.dueDate,
          isActive: data.isActive ?? true
        }
      );

      console.log('✅ Expert task created:', result.$id);
      return this.mapDocumentToExpertTask(result);
    } catch (error) {
      console.error('❌ Error creating expert task:', error);
      throw error;
    }
  }

  async getExpertTasks(expertId: string): Promise<ExpertTask[]> {
    try {
      console.log('🔍 Fetching expert tasks for:', expertId);
      
      const result = await databases.listDocuments(
        DATABASE_ID,
        EXPERT_TASKS_COLLECTION_ID,
        [
          Query.equal('expertId', expertId),
          Query.orderDesc('$createdAt')
        ]
      );

      console.log('📊 Found expert tasks:', result.documents.length);
      return result.documents.map(doc => this.mapDocumentToExpertTask(doc));
    } catch (error) {
      console.error('❌ Error fetching expert tasks:', error);
      throw error;
    }
  }

  async getActiveExpertTasks(expertId: string): Promise<ExpertTask[]> {
    try {
      console.log('🔍 Fetching active expert tasks for:', expertId);
      
      const result = await databases.listDocuments(
        DATABASE_ID,
        EXPERT_TASKS_COLLECTION_ID,
        [
          Query.equal('expertId', expertId),
          Query.equal('isActive', true),
          Query.orderDesc('$createdAt')
        ]
      );

      console.log('📊 Found active expert tasks:', result.documents.length);
      return result.documents.map(doc => this.mapDocumentToExpertTask(doc));
    } catch (error) {
      console.error('❌ Error fetching active expert tasks:', error);
      throw error;
    }
  }

  async updateExpertTask(taskId: string, data: UpdateExpertTaskData): Promise<ExpertTask | null> {
    try {
      console.log('🔍 Updating expert task:', taskId);
      
      // Map title to taskTitle for the database
      const updateData: any = { ...data };
      if (data.title) {
        updateData.taskTitle = data.title;
        delete updateData.title;
      }
      
      const result = await databases.updateDocument(
        DATABASE_ID,
        EXPERT_TASKS_COLLECTION_ID,
        taskId,
        updateData
      );

      console.log('✅ Expert task updated:', taskId);
      return this.mapDocumentToExpertTask(result);
    } catch (error) {
      console.error('❌ Error updating expert task:', error);
      throw error;
    }
  }

  async deleteExpertTask(taskId: string): Promise<boolean> {
    try {
      console.log('🔍 Deleting expert task:', taskId);
      
      await databases.deleteDocument(
        DATABASE_ID,
        EXPERT_TASKS_COLLECTION_ID,
        taskId
      );

      console.log('✅ Expert task deleted:', taskId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting expert task:', error);
      throw error;
    }
  }

  // Task Submission operations
  async createTaskSubmission(data: CreateTaskSubmissionData): Promise<TaskSubmission> {
    try {
      console.log('🔍 Creating task submission for task:', data.taskId);
      
      const now = new Date().toISOString();
      const result = await databases.createDocument(
        DATABASE_ID,
        TASK_SUBMISSIONS_COLLECTION_ID,
        'unique()',
        {
          taskId: data.taskId,
          memberId: data.memberId,
          submissionText: data.submissionText,
          submissionLink: data.submissionLink || '',
          status: 'pending',
          submittedAt: now
        }
      );

      console.log('✅ Task submission created:', result.$id);
      return this.mapDocumentToTaskSubmission(result);
    } catch (error) {
      console.error('❌ Error creating task submission:', error);
      throw error;
    }
  }

  async getTaskSubmissions(taskId: string): Promise<TaskSubmission[]> {
    try {
      console.log('🔍 Fetching task submissions for task:', taskId);
      
      const result = await databases.listDocuments(
        DATABASE_ID,
        TASK_SUBMISSIONS_COLLECTION_ID,
        [
          Query.equal('taskId', taskId),
          Query.orderDesc('submittedAt')
        ]
      );

      console.log('📊 Found task submissions:', result.documents.length);
      return result.documents.map(doc => this.mapDocumentToTaskSubmission(doc));
    } catch (error) {
      console.error('❌ Error fetching task submissions:', error);
      throw error;
    }
  }

  async getMemberSubmissions(memberId: string): Promise<TaskSubmission[]> {
    try {
      console.log('🔍 Fetching member submissions for:', memberId);
      
      const result = await databases.listDocuments(
        DATABASE_ID,
        TASK_SUBMISSIONS_COLLECTION_ID,
        [
          Query.equal('memberId', memberId),
          Query.orderDesc('submittedAt')
        ]
      );

      console.log('📊 Found member submissions:', result.documents.length);
      return result.documents.map(doc => this.mapDocumentToTaskSubmission(doc));
    } catch (error) {
      console.error('❌ Error fetching member submissions:', error);
      throw error;
    }
  }

  async updateTaskSubmission(submissionId: string, data: UpdateTaskSubmissionData): Promise<TaskSubmission | null> {
    try {
      console.log('🔍 Updating task submission:', submissionId);
      
      const now = new Date().toISOString();
      const updateData: any = { ...data };
      if (data.status && data.status !== 'pending') {
        updateData.reviewedAt = now;
      }

      const result = await databases.updateDocument(
        DATABASE_ID,
        TASK_SUBMISSIONS_COLLECTION_ID,
        submissionId,
        updateData
      );

      console.log('✅ Task submission updated:', submissionId);
      return this.mapDocumentToTaskSubmission(result);
    } catch (error) {
      console.error('❌ Error updating task submission:', error);
      throw error;
    }
  }

  // Get expert tasks assigned to a specific user (member)
  async getUserAssignedTasks(userId: string): Promise<(ExpertTask & { expertName?: string })[]> {
    try {
      console.log('🔍 Fetching expert tasks assigned to user:', userId);
      
      // Get all expert tasks where the user is a member
      // This would require a members collection or partnership system
      // For now, we'll get all active expert tasks and filter by partnerships
      const result = await databases.listDocuments(
        DATABASE_ID,
        EXPERT_TASKS_COLLECTION_ID,
        [
          Query.equal('isActive', true),
          Query.orderDesc('$createdAt')
        ]
      );

      console.log('📊 Found potential expert tasks:', result.documents.length);
      
      // Map tasks with expert names
      return result.documents.map(doc => {
        const task = this.mapDocumentToExpertTask(doc);
        return {
          ...task,
          expertName: 'Expert' // TODO: Get actual expert name
        };
      });
    } catch (error) {
      console.error('❌ Error fetching user assigned tasks:', error);
      throw error;
    }
  }

  // Get user's task submissions
  async getUserTaskSubmissions(userId: string): Promise<TaskSubmission[]> {
    try {
      console.log('🔍 Fetching user task submissions:', userId);
      
      const result = await databases.listDocuments(
        DATABASE_ID,
        TASK_SUBMISSIONS_COLLECTION_ID,
        [
          Query.equal('memberId', userId),
          Query.orderDesc('submittedAt')
        ]
      );

      console.log('📊 Found user task submissions:', result.documents.length);
      
      return result.documents.map(doc => this.mapDocumentToTaskSubmission(doc));
    } catch (error) {
      console.error('❌ Error fetching user task submissions:', error);
      throw error;
    }
  }

  // Get all submissions for expert's tasks with member details
  async getExpertTaskSubmissions(expertId: string): Promise<(TaskSubmission & { memberName?: string; taskTitle?: string })[]> {
    try {
      console.log('🔍 Fetching all submissions for expert:', expertId);
      
      // First get all expert's tasks
      const tasks = await this.getExpertTasks(expertId);
      const taskIds = tasks.map(task => task.id);
      
      if (taskIds.length === 0) {
        return [];
      }

      // Get all submissions for these tasks
      const result = await databases.listDocuments(
        DATABASE_ID,
        TASK_SUBMISSIONS_COLLECTION_ID,
        [
          Query.equal('taskId', taskIds),
          Query.orderDesc('submittedAt')
        ]
      );

      console.log('📊 Found expert task submissions:', result.documents.length);
      
      // Map submissions with task titles
      return result.documents.map(doc => {
        const submission = this.mapDocumentToTaskSubmission(doc);
        const task = tasks.find(t => t.id === submission.taskId);
        return {
          ...submission,
          taskTitle: task?.title || 'Unknown Task'
        };
      });
    } catch (error) {
      console.error('❌ Error fetching expert task submissions:', error);
      throw error;
    }
  }

  // Helper methods
  private mapDocumentToExpertTask(doc: any): ExpertTask {
    return {
      id: doc.$id,
      expertId: doc.expertId,
      title: doc.taskTitle || doc.title,
      description: doc.description,
      dueDate: doc.dueDate,
      isActive: doc.isActive,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt
    };
  }

  private mapDocumentToTaskSubmission(doc: any): TaskSubmission {
    return {
      id: doc.$id,
      taskId: doc.taskId,
      memberId: doc.memberId,
      submissionText: doc.submissionText,
      submissionLink: doc.submissionLink,
      status: doc.status,
      expertComment: doc.expertComment,
      submittedAt: doc.submittedAt,
      reviewedAt: doc.reviewedAt,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt
    };
  }
}

export const expertTaskService = new ExpertTaskService();

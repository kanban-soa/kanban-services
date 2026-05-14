import { ApiError, ERROR_CODES } from './errors';
import  dotenv  from 'dotenv';
dotenv.config();


export class WorkspaceServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.WORKSPACE_SERVICE_URL || 'http://localhost:9005';
  }

  async validateWorkspace(workspaceId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/internal/workspaces/${workspaceId}`);
      if (!response.ok) {
        throw new ApiError(404, ERROR_CODES.NOT_FOUND, 'Workspace not found');
      }
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to connect to Workspace Service');
    }
  }

  async validateMember(workspaceId: number, memberId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/internal/workspaces/${workspaceId}/members/${memberId}`);
      if (!response.ok) {
        throw new ApiError(403, ERROR_CODES.FORBIDDEN, 'User is not a member of this workspace');
      }
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to validate member context');
    }
  }

  async getMembers(workspaceId: number): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/internal/workspaces/${workspaceId}/members`);
    if (!response.ok) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'Failed to fetch workspace members');
    }
    const result = await response.json();
    return result.data || [];
  }
}

export const workspaceService = new WorkspaceServiceClient();

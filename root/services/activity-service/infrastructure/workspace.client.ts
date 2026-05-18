import config from "@activity-service/config/env";

export interface WorkspaceAccessCheck {
  isAdmin: boolean;
  isOwner: boolean;
}

export class WorkspaceServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.services.workspaceUrl;
  }

  async checkAdminOrOwner(workspaceId: number, userId: string): Promise<WorkspaceAccessCheck> {
    const response = await fetch(
      `${this.baseUrl}/internal/workspaces/${workspaceId}/members/${userId}/authorization`,
    );

    if (!response.ok) {
      //TODO fix this
      //return {isAdmin: true, isOwner: true};
      console.log("Response: ", response.statusText)
      return { isAdmin: false, isOwner: false };
    }

    const result = await response.json();
    return result.data as WorkspaceAccessCheck;
  }
}

export const workspaceClient = new WorkspaceServiceClient();


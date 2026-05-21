export interface CreateWorkspaceDTO {
  name: string;
  slug?: string;
  description?: string;
  createdBy: string;
}

export interface UpdateWorkspaceDTO {
  name?: string;
  slug?: string;
  description?: string;
}

export interface WorkspaceSummaryDTO {
  id: number;
  publicId: string;
  name: string;
  slug: string;
}

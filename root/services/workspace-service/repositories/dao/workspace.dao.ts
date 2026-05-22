export interface CreateWorkspaceInput {
  publicId: string;
  name: string;
  slug: string;
  description?: string;
  plan: any;
  createdBy: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  slug?: string;
  description?: string;
  plan?: any;
  updatedAt?: Date;
}

export interface WorkspaceDao {
  create(input: CreateWorkspaceInput): Promise<any>;
  findById(id: number): Promise<any | null>;
  findByPublicId(publicId: string): Promise<any | null>;
  findBySlug(slug: string): Promise<any | null>;
  findByCreator(userId: string): Promise<any[]>;
  findAll(limit?: number, offset?: number): Promise<any[]>;
  count(): Promise<number>;
  update(id: number, input: UpdateWorkspaceInput): Promise<any | null>;
  softDelete(id: number, deletedBy: string): Promise<any | null>;
  slugExists(slug: string, excludeId?: number): Promise<boolean>;
}

export type { WorkspaceDao as IWorkspaceDao };

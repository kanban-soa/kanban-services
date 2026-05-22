import { MemberRole } from "@workspace-service/config/constants";

export interface CreateMemberInput {
  publicId: string;
  email: string;
  userId?: string;
  workspaceId: number;
  createdBy: string;
  role: any;
  roleId?: number;
  status: any;
}

export interface UpdateMemberInput {
  email?: string;
  userId?: string;
  role?: MemberRole;
  roleId?: number;
  status?: any;
  updatedAt?: Date;
}

export interface MemberDao {
  create(input: CreateMemberInput): Promise<any>;
  findById(id: number): Promise<any | null>;
  findByPublicId(publicId: string): Promise<any | null>;
  findByUserAndWorkspace(userId: string, workspaceId: number): Promise<any | null>;
  findByWorkspace(workspaceId: number, limit?: number, offset?: number): Promise<any[]>;
  countByWorkspace(workspaceId: number): Promise<number>;
  findWorkspacesByUserId(userId: string): Promise<any[]>;
  update(id: number, input: UpdateMemberInput): Promise<any | null>;
  cancelInvitation(publicId: string, workspaceId: number, deletedBy: string): Promise<any | null>;
  softDelete(id: number, deletedBy: string): Promise<any | null>;
  memberExistsByEmail(email: string, workspaceId: number): Promise<boolean>;
  findInvitedByWorkspace(workspaceId: number): Promise<any[]>;
  findAdminsByWorkspace(workspaceId: number): Promise<any[]>;
  findMembersByIds(workspaceId: number, memberIds: number[]): Promise<any[]>;
  findMemberByUserId(memberId: string): Promise<any | null>;
}

export type { MemberDao as IMemberDao };

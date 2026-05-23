export interface CreateRoleInput {
  publicId: string;
  workspaceId: number;
  name: string;
  description?: string;
  hierarchyLevel: number;
  isSystem: boolean;
}

export interface CreateRolePermissionInput {
  workspaceRoleId: number;
  permission: string;
  granted: boolean;
}

export interface CreateMemberPermissionInput {
  workspaceMemberId: number;
  permission: string;
  granted: boolean;
}

export interface PermissionDao {
  createRole(input: CreateRoleInput): Promise<any>;
  getRoleById(id: number): Promise<any | null>;
  getRoleByName(workspaceId: number, name: string): Promise<any | null>;
  getRolesByWorkspace(workspaceId: number): Promise<any[]>;
  updateRole(id: number, data: Partial<CreateRoleInput>): Promise<any | null>;
  createRolePermission(input: CreateRolePermissionInput): Promise<any>;
  getRolePermissions(roleId: number): Promise<any[]>;
  roleHasPermission(roleId: number, permission: string): Promise<boolean>;
  updateRolePermission(id: number, granted: boolean): Promise<any | null>;
  deleteRolePermission(id: number): Promise<any | null>;
  createMemberPermission(input: CreateMemberPermissionInput): Promise<any>;
  getMemberPermissions(memberId: number): Promise<any[]>;
  updateMemberPermission(id: number, granted: boolean): Promise<any | null>;
  deleteMemberPermission(id: number): Promise<any | null>;
}

export type { PermissionDao as IPermissionDao };

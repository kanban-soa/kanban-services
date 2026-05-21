export interface CreateRoleDTO {
  workspaceId: number;
  name: string;
  description?: string;
  hierarchyLevel: number;
  isSystem?: boolean;
}

export interface RolePermissionDTO {
  id?: number;
  workspaceRoleId: number;
  permission: string;
  granted: boolean;
}

export interface MemberPermissionDTO {
  id?: number;
  workspaceMemberId: number;
  permission: string;
  granted: boolean;
}

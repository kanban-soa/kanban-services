/**
 * Permission Types and Constants
 * Define all permission strings used in the system
 */

export const PERMISSION_TYPES = {
  // Workspace permissions
  WORKSPACE_CREATE: "workspace.create",
  WORKSPACE_READ: "workspace.read",
  WORKSPACE_UPDATE: "workspace.update",
  WORKSPACE_DELETE: "workspace.delete",

  // Member permissions
  MEMBER_INVITE: "member.invite",
  MEMBER_READ: "member.read",
  MEMBER_UPDATE: "member.update",
  MEMBER_REMOVE: "member.remove",

  // Board permissions
  BOARD_CREATE: "board.create",
  BOARD_READ: "board.read",
  BOARD_UPDATE: "board.update",
  BOARD_DELETE: "board.delete",

  // Permission management
  PERMISSION_MANAGE: "permission.manage",
} as const;

export type PermissionType = (typeof PERMISSION_TYPES)[keyof typeof PERMISSION_TYPES];

/**
 * Member Roles
 */
export const MEMBER_ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
  GUEST: "guest",
} as const;

export type MemberRole = (typeof MEMBER_ROLES)[keyof typeof MEMBER_ROLES];

/**
 * Member Status
 */
export const MEMBER_STATUS = {
  INVITED: "invited",
  ACTIVE: "active",
  REMOVED: "removed",
  PAUSED: "paused",
} as const;

export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

/**
 * Workspace Plans
 */
export const WORKSPACE_PLANS = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const;

export type WorkspacePlan = (typeof WORKSPACE_PLANS)[keyof typeof WORKSPACE_PLANS];

/**
 * Role-Based Permission Mapping
 * Define which permissions each role has by default
 */
export const ROLE_PERMISSIONS: Record<MemberRole, PermissionType[]> = {
  [MEMBER_ROLES.ADMIN]: [
    PERMISSION_TYPES.WORKSPACE_READ,
    PERMISSION_TYPES.WORKSPACE_UPDATE,
    PERMISSION_TYPES.WORKSPACE_DELETE,
    PERMISSION_TYPES.MEMBER_INVITE,
    PERMISSION_TYPES.MEMBER_READ,
    PERMISSION_TYPES.MEMBER_UPDATE,
    PERMISSION_TYPES.MEMBER_REMOVE,
    PERMISSION_TYPES.BOARD_CREATE,
    PERMISSION_TYPES.BOARD_READ,
    PERMISSION_TYPES.BOARD_UPDATE,
    PERMISSION_TYPES.BOARD_DELETE,
    PERMISSION_TYPES.PERMISSION_MANAGE,
  ],
  [MEMBER_ROLES.MEMBER]: [
    PERMISSION_TYPES.WORKSPACE_READ,
    PERMISSION_TYPES.MEMBER_READ,
    PERMISSION_TYPES.BOARD_CREATE,
    PERMISSION_TYPES.BOARD_READ,
    PERMISSION_TYPES.BOARD_UPDATE,
  ],
  [MEMBER_ROLES.GUEST]: [
    PERMISSION_TYPES.WORKSPACE_READ,
    PERMISSION_TYPES.MEMBER_READ,
    PERMISSION_TYPES.BOARD_READ,
  ],
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  WORKSPACE_NOT_FOUND: "Workspace not found",
  MEMBER_NOT_FOUND: "Member not found",
  PERMISSION_DENIED: "Permission denied",
  UNAUTHORIZED: "Unauthorized access",
  INVALID_INPUT: "Invalid input",
  DUPLICATE_MEMBER: "Member already exists in workspace",
  MEMBER_STILL_ACTIVE: "Cannot delete active member, remove them first",
  WORKSPACE_SLUG_EXISTS: "Workspace slug already exists",
  INVALID_ROLE: "Invalid role",
  INVALID_PERMISSION: "Invalid permission",
  DATABASE_ERROR: "Database error",
} as const;

/**
 * Default ID Length for publicId
 */
export const PUBLIC_ID_LENGTH = 12;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

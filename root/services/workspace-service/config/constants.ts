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
  USER_NOT_FOUND: "User not found",
  SERVICE_UNAVAILABLE: "External service unavailable",
  USER_NOT_REGISTERED: "User with this email is not registered",
  CANNOT_REMOVE_LAST_ADMIN: "Cannot remove the only admin member",
  MEMBER_NOT_INVITED: "Member is not in invited status",
  ROLE_ALREADY_EXISTS: "Role already exists in workspace",
  ROLE_NOT_FOUND: "Role not found",
} as const;

/**
 * Error Codes — unique numeric identifiers for each error.
 * Grouped by domain with gaps for future expansion:
 *   1000-1009  Workspace
 *   1010-1019  Member
 *   1020-1029  Permission
 *   1030-1039  Role
 *   1040-1049  Auth / Input
 *   1050-1059  User
 *   1060-1069  Infrastructure
 *   1070-1079  External services
 */
export const ERROR_CODES = {
  // Workspace (1000-1009)
  WORKSPACE_NOT_FOUND: 1001,
  WORKSPACE_SLUG_EXISTS: 1002,

  // Member (1010-1019)
  MEMBER_NOT_FOUND: 1010,
  DUPLICATE_MEMBER: 1011,
  MEMBER_STILL_ACTIVE: 1012,
  CANNOT_REMOVE_LAST_ADMIN: 1013,
  MEMBER_NOT_INVITED: 1014,

  // Permission (1020-1029)
  PERMISSION_DENIED: 1020,
  INVALID_PERMISSION: 1021,

  // Role (1030-1039)
  INVALID_ROLE: 1030,
  ROLE_ALREADY_EXISTS: 1031,
  ROLE_NOT_FOUND: 1032,

  // Auth / Input (1040-1049)
  UNAUTHORIZED: 1040,
  INVALID_INPUT: 1041,

  // User (1050-1059)
  USER_NOT_FOUND: 1050,
  USER_NOT_REGISTERED: 1051,

  // Infrastructure (1060-1069)
  DATABASE_ERROR: 1060,

  // External services (1070-1079)
  SERVICE_UNAVAILABLE: 1070,
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Error Code Map — resolves each code to its HTTP status and internal message.
 * The message is for INTERNAL logging only; it is NOT sent in HTTP responses.
 */
export const ERROR_CODE_MAP: Record<
  ErrorCode,
  { message: string; httpStatus: number }
> = {
  [ERROR_CODES.WORKSPACE_NOT_FOUND]: {
    message: "Workspace not found",
    httpStatus: HTTP_STATUS.NOT_FOUND,
  },
  [ERROR_CODES.WORKSPACE_SLUG_EXISTS]: {
    message: "Workspace slug already exists",
    httpStatus: HTTP_STATUS.CONFLICT,
  },
  [ERROR_CODES.MEMBER_NOT_FOUND]: {
    message: "Member not found",
    httpStatus: HTTP_STATUS.NOT_FOUND,
  },
  [ERROR_CODES.DUPLICATE_MEMBER]: {
    message: "Member already exists in workspace",
    httpStatus: HTTP_STATUS.CONFLICT,
  },
  [ERROR_CODES.MEMBER_STILL_ACTIVE]: {
    message: "Cannot delete active member, remove them first",
    httpStatus: HTTP_STATUS.BAD_REQUEST,
  },
  [ERROR_CODES.CANNOT_REMOVE_LAST_ADMIN]: {
    message: "Cannot remove the only admin member",
    httpStatus: HTTP_STATUS.BAD_REQUEST,
  },
  [ERROR_CODES.MEMBER_NOT_INVITED]: {
    message: "Member is not in invited status",
    httpStatus: HTTP_STATUS.BAD_REQUEST,
  },
  [ERROR_CODES.PERMISSION_DENIED]: {
    message: "Permission denied",
    httpStatus: HTTP_STATUS.FORBIDDEN,
  },
  [ERROR_CODES.INVALID_PERMISSION]: {
    message: "Invalid permission",
    httpStatus: HTTP_STATUS.BAD_REQUEST,
  },
  [ERROR_CODES.INVALID_ROLE]: {
    message: "Invalid role",
    httpStatus: HTTP_STATUS.BAD_REQUEST,
  },
  [ERROR_CODES.ROLE_ALREADY_EXISTS]: {
    message: "Role already exists in workspace",
    httpStatus: HTTP_STATUS.CONFLICT,
  },
  [ERROR_CODES.ROLE_NOT_FOUND]: {
    message: "Role not found",
    httpStatus: HTTP_STATUS.NOT_FOUND,
  },
  [ERROR_CODES.UNAUTHORIZED]: {
    message: "Unauthorized access",
    httpStatus: HTTP_STATUS.UNAUTHORIZED,
  },
  [ERROR_CODES.INVALID_INPUT]: {
    message: "Invalid input",
    httpStatus: HTTP_STATUS.BAD_REQUEST,
  },
  [ERROR_CODES.USER_NOT_FOUND]: {
    message: "User not found",
    httpStatus: HTTP_STATUS.NOT_FOUND,
  },
  [ERROR_CODES.USER_NOT_REGISTERED]: {
    message: "User with this email is not registered",
    httpStatus: HTTP_STATUS.BAD_REQUEST,
  },
  [ERROR_CODES.DATABASE_ERROR]: {
    message: "Database error",
    httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  },
  [ERROR_CODES.SERVICE_UNAVAILABLE]: {
    message: "External service unavailable",
    httpStatus: HTTP_STATUS.SERVICE_UNAVAILABLE,
  },
};

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

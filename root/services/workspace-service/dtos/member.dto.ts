import { MemberRole, MemberStatus } from "@workspace-service/config/constants";

export interface InviteMemberDTO {
  email: string;
  role?: string;
  workspaceId: number;
  invitedBy: string;
}

export interface UpdateMemberDTO {
  role?: MemberRole;
  status?: MemberStatus;
}

export interface MemberSummaryDTO {
  id: number;
  email: string;
  userId: string | null;
}

export interface MemberRoleDTO {
  id: number;
  name: string;
}

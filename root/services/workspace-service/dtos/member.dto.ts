export interface InviteMemberDTO {
  email: string;
  role?: string;
  workspaceId: number;
  invitedBy: string;
}

export interface UpdateMemberDTO {
  role?: string;
  status?: string;
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

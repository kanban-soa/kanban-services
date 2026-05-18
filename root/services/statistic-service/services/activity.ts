import { createServiceClient } from "../../../common/utils/service-client";

export type ServiceContext = {
  authorization?: string;
  requestId?: string;
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
};

export type ActivityEvent = {
  id: number | string;
  publicId?: string;
  workspaceId: number;
  actorUserId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type ActivityListResponse = {
  items: ActivityEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ActivityQuery = {
  workspaceId: string;
  page?: number;
  limit?: number;
  actionType?: string;
  entityType?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
};

type ActivityServiceResponse = {
  success: boolean;
  message: string;
  data: ActivityListResponse;
};

function requireServiceUrl(name: "ACTIVITY_SERVICE_URL"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function buildAuthHeaders(context?: ServiceContext): Record<string, string> {
  if (!context?.authorization) {
    return {};
  }
  return { authorization: context.authorization };
}

let cachedActivityClient: ReturnType<typeof createServiceClient> | null = null;

function getActivityClient() {
  if (!cachedActivityClient) {
    cachedActivityClient = createServiceClient({
      baseUrl: requireServiceUrl("ACTIVITY_SERVICE_URL"),
      timeoutMs: 8000,
    });
  }
  return cachedActivityClient;
}

export async function getWorkspaceActivities(
  query: ActivityQuery,
  context?: ServiceContext,
): Promise<ActivityListResponse> {
  const response = await getActivityClient().requestJson<ActivityServiceResponse>({
    method: "GET",
    path: `/api/activities/workspaces/${query.workspaceId}`,
    query: {
      page: query.page,
      limit: query.limit,
      actionType: query.actionType,
      entityType: query.entityType,
      actorUserId: query.actorUserId,
      from: query.from,
      to: query.to,
    },
    headers: buildAuthHeaders(context),
    context,
  });

  return response.data.data;
}


import dotenv from "dotenv";

dotenv.config();

export interface ActivityEventPayload {
  workspaceId: number;
  actorUserId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
}

export class ActivityServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.ACTIVITY_SERVICE_URL || "http://localhost:9010";
  }

  async logEvent(payload: ActivityEventPayload): Promise<void> {
    await fetch(`${this.baseUrl}/internal/activities`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }
}

export const activityService = new ActivityServiceClient();


import { BaseClient } from "./base.client";
import config from "@workspace-service/config/env";
import { logger } from "@workspace-service/utils/logger";

/**
 * Notification payload types
 */
export interface CreateNotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  publicId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

/**
 * NotificationClient
 * Communicates with the notification-service for sending notifications.
 *
 * Endpoints:
 *   POST  /api/notifications  → create
 *
 * All notification calls are non-critical — failures should be logged
 * but never block the main business flow.
 */
class NotificationClient extends BaseClient {
  constructor() {
    super(config.services.notificationUrl, "notification-service");
  }

  /**
   * Send a member invited notification
   */
  async sendMemberInvited(
    userId: string,
    workspaceName: string,
    invitedBy: string
  ): Promise<void> {
    try {
      await this.create({
        userId,
        type: "member.invited",
        title: "Workspace Invitation",
        message: `You have been invited to workspace "${workspaceName}"`,
        metadata: { invitedBy, workspaceName },
      });
    } catch (error) {
      logger.warn(`Failed to send member.invited notification to ${userId}`, error);
    }
  }

  /**
   * Send a role changed notification
   */
  async sendRoleChanged(
    userId: string,
    workspaceName: string,
    newRole: string,
    changedBy: string
  ): Promise<void> {
    try {
      await this.create({
        userId,
        type: "member.role_changed",
        title: "Role Updated",
        message: `Your role in workspace "${workspaceName}" has been changed to ${newRole}`,
        metadata: { newRole, changedBy, workspaceName },
      });
    } catch (error) {
      logger.warn(`Failed to send member.role_changed notification to ${userId}`, error);
    }
  }

  /**
   * Send a member removed notification
   */
  async sendMemberRemoved(
    userId: string,
    workspaceName: string,
    removedBy: string
  ): Promise<void> {
    try {
      await this.create({
        userId,
        type: "member.removed",
        title: "Removed from Workspace",
        message: `You have been removed from workspace "${workspaceName}"`,
        metadata: { removedBy, workspaceName },
      });
    } catch (error) {
      logger.warn(`Failed to send member.removed notification to ${userId}`, error);
    }
  }

  /**
   * Send a workspace deleted notification
   */
  async sendWorkspaceDeleted(
    userId: string,
    workspaceName: string
  ): Promise<void> {
    try {
      await this.create({
        userId,
        type: "workspace.deleted",
        title: "Workspace Deleted",
        message: `Workspace "${workspaceName}" has been deleted`,
        metadata: { workspaceName },
      });
    } catch (error) {
      logger.warn(`Failed to send workspace.deleted notification to ${userId}`, error);
    }
  }

  /**
   * Create a notification — internal method
   */
  private async create(payload: CreateNotificationPayload): Promise<Notification> {
    return this.post<Notification>("/api/notifications", payload);
  }
}

export const notificationClient = new NotificationClient();

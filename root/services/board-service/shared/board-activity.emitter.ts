import { activityService } from './activity.client';

export type BoardActivityPayload = {
  workspaceId: number;
  actorUserId: string;
  boardId: string;
  name?: string | null;
  fields?: string[];
};

export interface BoardActivityEmitter {
  boardCreated(payload: BoardActivityPayload): Promise<void>;
  boardUpdated(payload: BoardActivityPayload): Promise<void>;
  boardDeleted(payload: BoardActivityPayload): Promise<void>;
}

export class NoopBoardActivityEmitter implements BoardActivityEmitter {
  async boardCreated(): Promise<void> {}

  async boardUpdated(): Promise<void> {}

  async boardDeleted(): Promise<void> {}
}

export class ActivityBoardEmitter implements BoardActivityEmitter {
  private async emit(
    actionType: 'board.created' | 'board.updated' | 'board.deleted',
    payload: BoardActivityPayload,
  ): Promise<void> {
    try {
      await activityService.logEvent({
        workspaceId: payload.workspaceId,
        actorUserId: payload.actorUserId,
        actionType,
        entityType: 'board',
        entityId: payload.boardId,
        metadata: {
          name: payload.name ?? undefined,
          fields: payload.fields ?? undefined,
        },
      });
    } catch (error) {
      console.warn('Failed to record activity event', error);
    }
  }

  async boardCreated(payload: BoardActivityPayload): Promise<void> {
    await this.emit('board.created', payload);
  }

  async boardUpdated(payload: BoardActivityPayload): Promise<void> {
    await this.emit('board.updated', payload);
  }

  async boardDeleted(payload: BoardActivityPayload): Promise<void> {
    await this.emit('board.deleted', payload);
  }
}


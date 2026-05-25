import { activityService } from './activity.client';

export type CardActivityPayload = {
  workspaceId: number;
  actorUserId: string;
  cardId: string;
  fields?: string[];
  metadata?: Record<string, unknown> | null;
};

export interface CardActivityEmitter {
  cardCreated(payload: CardActivityPayload): Promise<void>;
  cardUpdated(payload: CardActivityPayload): Promise<void>;
  cardDeleted(payload: CardActivityPayload): Promise<void>;
}

export class NoopCardActivityEmitter implements CardActivityEmitter {
  async cardCreated(): Promise<void> {}

  async cardUpdated(): Promise<void> {}

  async cardDeleted(): Promise<void> {}
}

export class ActivityCardEmitter implements CardActivityEmitter {
  private async emit(
    actionType: 'card.created' | 'card.updated' | 'card.deleted',
    payload: CardActivityPayload,
  ): Promise<void> {
    try {
      const metadata = {
        fields: payload.fields ?? undefined,
        ...(payload.metadata ?? {}),
      };

      const hasMetadata = Object.values(metadata).some(
        (value) => value !== undefined,
      );

      await activityService.logEvent({
        workspaceId: payload.workspaceId,
        actorUserId: payload.actorUserId,
        actionType,
        entityType: 'card',
        entityId: payload.cardId,
        metadata: hasMetadata ? metadata : undefined,
      });
    } catch (error) {
      console.warn('Failed to record activity event', error);
    }
  }

  async cardCreated(payload: CardActivityPayload): Promise<void> {
    await this.emit('card.created', payload);
  }

  async cardUpdated(payload: CardActivityPayload): Promise<void> {
    await this.emit('card.updated', payload);
  }

  async cardDeleted(payload: CardActivityPayload): Promise<void> {
    await this.emit('card.deleted', payload);
  }
}


import type { DbOrTx } from '@/board-service/config/database';

import {
  cardActivities,
  type ActivityType,
} from '@/board-service/schema/cards';

import { generatePublicId } from '@/board-service/shared/utils/public-id';

export async function insertCardActivity(
  dbOrTx: DbOrTx,

  input: {
    type: ActivityType;

    cardId: number;

    createdBy: string;

    fromTitle?: string | null;

    toTitle?: string | null;

    fromDescription?: string | null;

    toDescription?: string | null;

    fromIndex?: number | null;

    toIndex?: number | null;

    fromListId?: number | null;

    toListId?: number | null;

    labelId?: number | null;

    workspaceMemberPublicId?:
      | string
      | null;

    fromDueDate?: Date | null;

    toDueDate?: Date | null;
  },
) {
  await dbOrTx
    .insert(cardActivities)
    .values({
      publicId: generatePublicId(),

      type: input.type,

      cardId: input.cardId,

      createdBy: input.createdBy,

      fromTitle:
        input.fromTitle ?? undefined,

      toTitle:
        input.toTitle ?? undefined,

      fromDescription:
        input.fromDescription ??
        undefined,

      toDescription:
        input.toDescription ??
        undefined,

      fromIndex:
        input.fromIndex ?? undefined,

      toIndex:
        input.toIndex ?? undefined,

      fromListId:
        input.fromListId ?? undefined,

      toListId:
        input.toListId ?? undefined,

      labelId:
        input.labelId ?? undefined,

      workspaceMemberPublicId:
        input.workspaceMemberPublicId ??
        undefined,

      fromDueDate:
        input.fromDueDate ?? undefined,

      toDueDate:
        input.toDueDate ?? undefined,
    });
}
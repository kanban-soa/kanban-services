import { CardDetailResponseDto } from '@/board-service/api/dto/card-response.dto';

export class CardMapper {
  static toDetailDto(
    card: any,
  ): CardDetailResponseDto {
    return {
      publicId: card.publicId,
      title: card.title,
      description: card.description,
      dueDate: card.dueDate,
      index: card.index,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      createdBy: card.createdBy,
      /**
       * Current list
       */
      list: {
        publicId: card.list.publicId,
        name: card.list.name,
      },
      /**
       * Current attached labels
       */
      labels: card.labels
        .filter(
          (item: any) =>
            !item.label.deletedAt,
        )
        .map((item: any) => ({
          publicId:
            item.label.publicId,
          name: item.label.name,
          colourCode:
            item.label.colourCode,
        })),

      /**
       * All labels in board
       */
      availableLabels:
        card.list.board.labels
          .filter(
            (label: any) =>
              !label.deletedAt,
          )
          .map((label: any) => ({
            publicId:
              label.publicId,

            name: label.name,

            colourCode:
              label.colourCode,
          })),

      /**
       * Assigned workspace member public ids
       */
      assignedWorkspaceMemberPublicIds:
        card.members.map(
          (member: any) =>
            member.workspaceMemberPublicId,
        ),

      /**
       * All lists in board
       */
      availableLists:
        card.list.board.allLists
          .filter(
            (list: any) =>
              !list.deletedAt,
          )
          .map((list: any) => ({
            publicId:
              list.publicId,

            name: list.name,
          })),
    };
  }
}
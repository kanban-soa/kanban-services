import { BoardDetailResponseDto } from '../dto/board-response.dto';


export class BoardMapper {
  static toDetailDto(board: any): BoardDetailResponseDto {
    const { allLists, ...boardData } = board;

    return {
      ...boardData,

      lists: allLists.map((list: any) => ({
        publicId: list.publicId,
        name: list.name,
        index: list.index,

        cards: list.cards.map((card: any) => ({
          publicId: card.publicId,
          title: card.title,
          description: card.description,
          index: card.index,
          dueDate: card.dueDate,

        labels: card.labels.filter((item: any) => !item.label.deletedAt).map((item: any) => ({
            publicId: item.label.publicId,
            name: item.label.name,
            colourCode: item.label.colourCode,
          })),
        })),
      })),
    };
  }
}
import { CardDto } from './card.dto';

export type ListDto = {
  id: string;
  name: string;
  position: number;

  cardCount: number;

  cards: CardDto[];
};
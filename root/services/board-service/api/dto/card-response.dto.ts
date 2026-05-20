/**
 * =========================================================
 * SHARED DTOs
 * =========================================================
 */

export interface ListOptionDto {
  publicId: string;
  name: string;
}

export interface LabelResponseDto {
  publicId: string;
  name: string;
  colourCode: string;
}

/**
 * =========================================================
 * CARD DETAIL RESPONSE DTO
 * =========================================================
 */

export interface CardDetailResponseDto {
  publicId: string;

  title: string;

  description: string | null;

  dueDate: Date | null;

  index: number;

  createdAt: Date;

  updatedAt: Date | null;

  /**
   * Current list of card
   */
  list: ListOptionDto;

  /**
   * Current attached labels
   */
  labels: LabelResponseDto[];

  /**
   * All labels inside board
   */
  availableLabels: LabelResponseDto[];

  /**
   * Assigned workspace member public ids
   */
  assignedWorkspaceMemberPublicIds: string[];

  /**
   * All lists inside board
   */
  availableLists: ListOptionDto[];
}
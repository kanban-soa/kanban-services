import { LabelRepository } from '@/board-service/repositories/label.repository';
import { ApiError, ERROR_CODES } from '@/board-service/shared/errors';
import { db } from '@/board-service/config/database';
import { LabelResponseDto } from '../api/dto/label-response.dto';
import { LabelMapper } from '../api/mapper/label.mapper';

export class LabelService {
  private readonly labelRepository = new LabelRepository();

  async getLabels(
    _userId: string,
    boardPublicId: string,
  ): Promise<LabelResponseDto[]> {

    /**
     * Validate board existence
     */
    const board = await this.labelRepository.findBoardInternal(boardPublicId);
    if (!board) {
      throw new ApiError(
        404,
        ERROR_CODES.BOARD_NOT_FOUND,
        'Board not found',
      );
    }

    /**
     * Query labels
     */
    const labels = await this.labelRepository.findManyByBoard(board.id);

    /**
     * Transform response dto
     */
    return LabelMapper.toResponseDtos(labels);
  }

  async updateLabel(
    boardPublicId: string,
    labelPublicId: string,
    body: { name?: string; colourCode?: string | null },
  ): Promise<LabelResponseDto> {
    if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'Label name cannot be empty');
    }
    
    const board = await this.labelRepository.findBoardInternal(boardPublicId);
    if (!board) {
      throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
    }

    const label = await this.labelRepository.findByPublicOnBoard(labelPublicId, board.id);
    if (!label) {
      throw new ApiError(404, ERROR_CODES.LABEL_NOT_FOUND, 'Label not found');
    }

    const updated = await db.transaction(async (tx) => {
      return this.labelRepository.update(tx, label.id, {
        name: body.name?.trim(),
        colourCode: body.colourCode ?? null,
      });
    });

    return LabelMapper.toResponseDto(updated);
  }

  async deleteLabel(userId: string, boardPublicId: string, labelPublicId: string): Promise<void> {
    const board = await this.labelRepository.findBoardInternal(boardPublicId);
    if (!board) {
      throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
    }
    const deleted = await this.labelRepository.softDelete(userId, labelPublicId);
    if (!deleted) {
      throw new ApiError(404, ERROR_CODES.LABEL_NOT_FOUND, 'Label not found');
    }
  }


  // async createLabel(
  //   userId: string,
  //   boardPublicId: string,
  //   body: { name: string; colourCode?: string | null },
  // ): Promise<LabelResponseDto> {
  //   if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
  //     throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'Label name is required');
  //   }

  //   const board = await this.labelRepository.findBoardInternal(boardPublicId);
  //   if (!board) {
  //     throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
  //   }

  //   return db.transaction(async (tx) => {
  //     return this.labelRepository.create(tx, {
  //       name: body.name.trim(),
  //       colourCode: body.colourCode ?? null,
  //       boardInternalId: board.id,
  //       createdBy: userId,
  //     });
  //   });
  // }
}

import { LabelResponseDto }
  from '@/board-service/api/dto/label-response.dto';

export class LabelMapper {

  /**
   * =========================================================
   * TO RESPONSE DTO
   * =========================================================
   */

  static toResponseDto(
    label: any,
  ): LabelResponseDto {

    return {
      publicId: label.publicId,

      name: label.name,

      colourCode: label.colourCode,

      createdAt: label.createdAt,
    };
  }

  /**
   * =========================================================
   * TO MANY RESPONSE DTO
   * =========================================================
   */

  static toResponseDtos(
    labels: any[],
  ): LabelResponseDto[] {

    return labels.map((label) =>
      this.toResponseDto(label)
    );
  }
}
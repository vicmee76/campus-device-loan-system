import { ReservationTable } from '../model/reservation.model';
import { ReservationDto } from '../dtos/reservation.dto';

export class ReservationFactory {
  static toDto(reservationTable: ReservationTable): ReservationDto {
    return {
      reservationId: reservationTable.reservation_id,
      userId: reservationTable.user_id,
      deviceId: reservationTable.device_id,
      inventoryId: reservationTable.inventory_id,
      reservedAt: reservationTable.reserved_at,
      dueDate: reservationTable.due_date,
      status: reservationTable.status,
    };
  }

  static toDtoArray(reservationTables: ReservationTable[]): ReservationDto[] {
    return reservationTables.map((reservationTable) => this.toDto(reservationTable));
  }

  static toTable(reservationDto: Partial<ReservationDto>): Partial<ReservationTable> {
    const table: Partial<ReservationTable> = {};

    if (reservationDto.reservationId !== undefined) table.reservation_id = reservationDto.reservationId;
    if (reservationDto.userId !== undefined) table.user_id = reservationDto.userId;
    if (reservationDto.deviceId !== undefined) table.device_id = reservationDto.deviceId;
    if (reservationDto.inventoryId !== undefined) table.inventory_id = reservationDto.inventoryId;
    if (reservationDto.reservedAt !== undefined) table.reserved_at = reservationDto.reservedAt;
    if (reservationDto.dueDate !== undefined) table.due_date = reservationDto.dueDate;
    if (reservationDto.status !== undefined) table.status = reservationDto.status;

    return table;
  }
}

export default ReservationFactory;


import { db } from "../../database/connection";
import { ReservationTable } from "../model/reservation.model";

export class ReservationRepository {
  private readonly tableName = 'reservations';

  async getReservation(reservationId: string): Promise<ReservationTable | undefined> {
    return db(this.tableName)
      .where({ reservation_id: reservationId })
      .first() as Promise<ReservationTable | undefined>;
  }

  async updateStatus(reservationId: string, status: string): Promise<number> {
    return db(this.tableName)
      .update({ status: status })
      .where({ reservation_id: reservationId });
  }
}


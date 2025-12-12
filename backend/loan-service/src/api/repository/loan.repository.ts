import { db } from "../../database/connection";
import { LoanTable } from "../model/loan.model";

export class LoanRepository {
  private readonly tableName = 'loans';

  async createLoan(reservationId: string): Promise<LoanTable> {
    const [loan] = await db(this.tableName)
      .insert({
        loan_id: db.raw("gen_random_uuid()"),
        reservation_id: reservationId,
        collected_at: db.fn.now()
      })
      .returning("*");
    return loan as LoanTable;
  }

  async markReturned(loanId: string): Promise<LoanTable | undefined> {
    const [loan] = await db(this.tableName)
      .update({ returned_at: db.fn.now() })
      .where({ loan_id: loanId })
      .returning("*");
    return loan as LoanTable | undefined;
  }

  async findLoanWithReservation(loanId: string): Promise<any> {
    const result = await db(this.tableName)
      .join("reservations", "reservations.reservation_id", "loans.reservation_id")
      .select(
        "loans.*",
        "reservations.reservation_id",
        "reservations.user_id",
        "reservations.device_id",
        "reservations.inventory_id",
        "reservations.status"
      )
      .where("loans.loan_id", loanId)
      .first();
    return result;
  }

  async findByReservationId(reservationId: string): Promise<LoanTable | undefined> {
    return db(this.tableName)
      .where({ reservation_id: reservationId })
      .first() as Promise<LoanTable | undefined>;
  }
}


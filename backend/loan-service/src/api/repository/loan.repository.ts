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

  async findAllWithDetails(options: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<any[]> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const offset = (page - 1) * pageSize;

    const results = await db(this.tableName)
      .join('reservations', 'reservations.reservation_id', 'loans.reservation_id')
      .join('users', 'reservations.user_id', 'users.user_id')
      .join('devices', 'reservations.device_id', 'devices.device_id')
      .join('device_inventory', 'reservations.inventory_id', 'device_inventory.inventory_id')
      .where('users.is_deleted', false)
      .where('devices.is_deleted', false)
      .select(
        'loans.loan_id',
        'loans.reservation_id',
        'loans.collected_at',
        'loans.returned_at',
        'reservations.reservation_id as reservation_reservation_id',
        'reservations.reserved_at',
        'reservations.due_date',
        'reservations.status',
        'users.email',
        'users.user_id',
        'users.first_name',
        'users.last_name',
        'users.role',
        'devices.device_id',
        'devices.brand',
        'devices.model',
        'devices.category',
        'device_inventory.inventory_id',
        'device_inventory.serial_number',
        'device_inventory.is_available'
      )
      .orderBy('loans.collected_at', 'desc')
      .limit(pageSize)
      .offset(offset);

    return results;
  }

  async countAll(): Promise<number> {
    const result = await db(this.tableName)
      .join('reservations', 'reservations.reservation_id', 'loans.reservation_id')
      .join('users', 'reservations.user_id', 'users.user_id')
      .join('devices', 'reservations.device_id', 'devices.device_id')
      .where('users.is_deleted', false)
      .where('devices.is_deleted', false)
      .count('* as count')
      .first();

    return parseInt((result as { count: string }).count, 10);
  }

  async findByUserIdWithPagination(userId: string, options: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<any[]> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const offset = (page - 1) * pageSize;

    const results = await db(this.tableName)
      .join('reservations', 'reservations.reservation_id', 'loans.reservation_id')
      .join('users', 'reservations.user_id', 'users.user_id')
      .join('devices', 'reservations.device_id', 'devices.device_id')
      .join('device_inventory', 'reservations.inventory_id', 'device_inventory.inventory_id')
      .where('reservations.user_id', userId)
      .where('users.is_deleted', false)
      .where('devices.is_deleted', false)
      .select(
        'loans.loan_id',
        'loans.reservation_id',
        'loans.collected_at',
        'loans.returned_at',
        'reservations.reservation_id as reservation_reservation_id',
        'reservations.reserved_at',
        'reservations.due_date',
        'reservations.status',
        'users.email',
        'users.user_id',
        'users.first_name',
        'users.last_name',
        'users.role',
        'devices.device_id',
        'devices.brand',
        'devices.model',
        'devices.category',
        'device_inventory.inventory_id',
        'device_inventory.serial_number',
        'device_inventory.is_available'
      )
      .orderBy('loans.collected_at', 'desc')
      .limit(pageSize)
      .offset(offset);

    return results;
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await db(this.tableName)
      .join('reservations', 'reservations.reservation_id', 'loans.reservation_id')
      .join('users', 'reservations.user_id', 'users.user_id')
      .join('devices', 'reservations.device_id', 'devices.device_id')
      .where('reservations.user_id', userId)
      .where('users.is_deleted', false)
      .where('devices.is_deleted', false)
      .count('* as count')
      .first();

    return parseInt((result as { count: string }).count, 10);
  }
}


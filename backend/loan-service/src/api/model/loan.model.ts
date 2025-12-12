export interface Loan {
  LoanId: string;
  ReservationId: string;
  CollectedAt: Date;
  ReturnedAt?: Date | null;
}

export interface LoanTable {
  loan_id: string;
  reservation_id: string;
  collected_at: Date;
  returned_at?: Date | null;
}


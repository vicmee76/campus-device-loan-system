import { Response } from 'express';
import { injectable } from 'tsyringe';
import loanService from '../services/loan.service';
import { getStatusCode } from '../utils/controller.utils';
import { AuthenticatedRequest } from '../utils/auth.middleware';

@injectable()
export class LoanController {
  async collect(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { reservationId } = req.params;
    const result = await loanService.collect(reservationId);
    return res.status(getStatusCode(result)).json(result);
  }

  async returnLoan(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { loanId } = req.params;
    const result = await loanService.returnLoan(loanId);
    return res.status(getStatusCode(result)).json(result);
  }
}

export default new LoanController();


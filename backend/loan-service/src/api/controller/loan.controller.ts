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

  async getAllLoans(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;

    const options = {
      page,
      pageSize,
    };

    const result = await loanService.getAllLoans(options);
    return res.status(getStatusCode(result)).json(result);
  }

  async getLoansByUserId(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { userId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;

    const options = {
      page,
      pageSize,
    };

    const result = await loanService.getLoansByUserId(userId, options);
    return res.status(getStatusCode(result)).json(result);
  }
}

export default new LoanController();


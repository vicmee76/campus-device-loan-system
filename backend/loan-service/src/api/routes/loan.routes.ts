import { Router } from 'express';
import loanController from '../controller/loan.controller';
import { authenticate, requireStaff } from '../utils/auth.middleware';

const router = Router();

/**
 * @route PATCH /v1/api/loans/:reservationId/collect
 * @desc Mark a reservation as collected and create a loan record
 * @access Staff only
 */
router.patch('/:reservationId/collect', authenticate, requireStaff, loanController.collect.bind(loanController));

/**
 * @route PATCH /v1/api/loans/:loanId/return
 * @desc Mark a loan as returned, update inventory, and notify waitlist
 * @access Staff only
 */
router.patch('/:loanId/return', authenticate, requireStaff, loanController.returnLoan.bind(loanController));

/**
 * @route GET /v1/api/loans
 * @desc Get all loans with pagination, including reservation, device, inventory, and user details
 * @access Staff only
 */
router.get('/get-all-loans', authenticate, requireStaff, loanController.getAllLoans.bind(loanController));

/**
 * @route GET /v1/api/loans/user/:userId
 * @desc Get loans for a specific user with pagination, including reservation, device, inventory, and user details
 * @access Staff only
 */
router.get('/user/:userId', authenticate, requireStaff, loanController.getLoansByUserId.bind(loanController));

export default router;


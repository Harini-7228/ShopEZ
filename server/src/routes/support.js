import express from 'express';
const router = express.Router();
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/roleCheck.js';
import { createTicket, getMyTickets, getAllTickets, getTicketById, replyToTicket, updateTicketStatus, } from '../controllers/supportController.js';

// All routes require authentication
router.use(protect);

// Customer specific actions
router.post('/', restrictTo('customer'), createTicket);
router.get('/my', restrictTo('customer'), getMyTickets);

// Admin specific actions
router.get('/all', restrictTo('admin'), getAllTickets);
router.patch('/:id/status', restrictTo('admin'), updateTicketStatus);

// Shared actions (Customer & Admin)
router.get('/:id', restrictTo('customer', 'admin'), getTicketById);
router.post('/:id/reply', restrictTo('customer', 'admin'), replyToTicket);

export default router;

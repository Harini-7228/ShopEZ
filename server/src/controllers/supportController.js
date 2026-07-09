import SupportTicket from '../models/SupportTicket.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc    Create a new support ticket
 * @route   POST /api/v1/support
 * @access  Private (Customer only)
 */
export const createTicket = asyncHandler(async (req, res) => {
  const { subject, category, priority, message } = req.body;

  if (!subject || !category || !message) {
    return sendError(res, 'Subject, category, and message content are required.', 400);
  }

  const ticket = await SupportTicket.create({
    user: req.user._id,
    subject,
    category,
    priority: priority || 'medium',
    status: 'open',
    messages: [{ sender: req.user._id, message }],
  });

  sendSuccess(res, ticket, 'Support ticket created successfully.', 201);
});

/**
 * @desc    Get support tickets for logged-in customer
 * @route   GET /api/v1/support/my
 * @access  Private (Customer only)
 */
export const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({ user: req.user._id }).sort({ updatedAt: -1 });
  sendSuccess(res, tickets, 'Customer support tickets retrieved.');
});

/**
 * @desc    Get all support tickets (Platform-wide)
 * @route   GET /api/v1/support/all
 * @access  Private (Admin only)
 */
export const getAllTickets = asyncHandler(async (req, res) => {
  const filter = {};
  const { status, priority, category } = req.query;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  const tickets = await SupportTicket.find(filter)
    .populate('user', 'name email role')
    .sort({ updatedAt: -1 });

  sendSuccess(res, tickets, 'All support tickets retrieved.');
});

/**
 * @desc    Get single support ticket by ID
 * @route   GET /api/v1/support/:id
 * @access  Private (Customer & Admin)
 */
export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate('user', 'name email role')
    .populate('messages.sender', 'name email role');

  if (!ticket) {
    return sendError(res, 'Support ticket not found.', 404);
  }

  if (ticket.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return sendError(res, 'Forbidden: You are not authorized to view this support ticket.', 403);
  }

  sendSuccess(res, ticket, 'Support ticket retrieved successfully.');
});

/**
 * @desc    Reply to a support ticket
 * @route   POST /api/v1/support/:id/reply
 * @access  Private (Customer & Admin)
 */
export const replyToTicket = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return sendError(res, 'Reply message cannot be empty.', 400);
  }

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    return sendError(res, 'Support ticket not found.', 404);
  }

  if (ticket.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return sendError(res, 'Forbidden: You are not authorized to reply to this support ticket.', 403);
  }

  ticket.messages.push({ sender: req.user._id, message });

  if (req.user.role === 'admin') {
    ticket.status = 'in-progress';
  } else if (ticket.status === 'resolved') {
    ticket.status = 'open';
  }

  await ticket.save();

  const updated = await SupportTicket.findById(req.params.id)
    .populate('user', 'name email role')
    .populate('messages.sender', 'name email role');

  sendSuccess(res, updated, 'Reply sent successfully.');
});

/**
 * @desc    Update support ticket status
 * @route   PATCH /api/v1/support/:id/status
 * @access  Private (Admin only)
 */
export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const VALID_STATUSES = ['open', 'in-progress', 'resolved'];

  if (!status || !VALID_STATUSES.includes(status)) {
    return sendError(res, 'A valid status (open, in-progress, resolved) must be provided.', 400);
  }

  const ticket = await SupportTicket.findByIdAndUpdate(
    req.params.id,
    { $set: { status } },
    { new: true }
  )
    .populate('user', 'name email role')
    .populate('messages.sender', 'name email role');

  if (!ticket) {
    return sendError(res, 'Support ticket not found.', 404);
  }

  sendSuccess(res, ticket, 'Support ticket status updated.');
});

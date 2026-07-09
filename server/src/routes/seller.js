import express from 'express';
import { getSellerDashboard } from '../controllers/sellerController.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/roleCheck.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('seller', 'admin'));

// Seller dashboard needs the full user document to recalculate trust score
// using the real DB _id. loadFullUser() is a no-op if already loaded.
router.get(
  '/dashboard',
  asyncHandler(async (req, res, next) => {
    await req.loadFullUser();
    next();
  }),
  getSellerDashboard
);

export default router;

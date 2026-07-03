const express = require('express');
const { getSellerDashboard } = require('../controllers/sellerController');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/roleCheck');

const router = express.Router();

router.use(protect);
router.use(restrictTo('seller', 'admin'));

router.get('/dashboard', getSellerDashboard);

module.exports = router;

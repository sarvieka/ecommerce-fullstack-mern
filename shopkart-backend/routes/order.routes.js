const express = require("express");

const {
    createPaymentOrder,
    verifyPayment
} = require("../controllers/order.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
    "/create-payment-order",
    authMiddleware,
    createPaymentOrder
);

router.post(
    "/verify-payment",
    authMiddleware,
    verifyPayment
);

module.exports = router;
const crypto = require("crypto");
const mongoose = require("mongoose");

const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const razorpay = require("../config/razorpay");

// Create ShopKart order + Razorpay order
const createPaymentOrder = async (req, res) => {
    try {
        const { shippingAddress } = req.body;

        // 1. Validate shipping address
        if (
            !shippingAddress ||
            !shippingAddress.fullName ||
            !shippingAddress.phone ||
            !shippingAddress.addressLine ||
            !shippingAddress.city ||
            !shippingAddress.state ||
            !shippingAddress.pincode
        ) {
            return res.status(400).json({
                success: false,
                message: "Complete shipping address is required"
            });
        }

        // 2. Find authenticated customer
        const customer = await Customer.findById(req.customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // 3. Check whether cart is empty
        if (!customer.cart || customer.cart.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        const orderItems = [];
        let totalAmount = 0;

        // 4. Verify every cart item using latest Product data
        for (const cartItem of customer.cart) {

            // Validate product ID
            if (!mongoose.Types.ObjectId.isValid(cartItem.product)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product in cart"
                });
            }

            // Get latest product information
            const product = await Product.findById(cartItem.product);

            // Product may have been deleted after adding to cart
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: "A product in your cart no longer exists"
                });
            }

            // Check latest stock
            if (cartItem.quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}`
                });
            }

            // 5. Create order item snapshot
            const orderItem = {
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: cartItem.quantity,
                image: product.image
            };

            orderItems.push(orderItem);

            // 6. Calculate total on the server
            totalAmount += product.price * cartItem.quantity;
        }

        // 7. Create ShopKart order
        const order = await Order.create({
            user: customer._id,
            items: orderItems,
            shippingAddress,
            totalAmount,
            paymentStatus: "PENDING",
            status: "PENDING_PAYMENT"
        });

        try {
            // 8. Create Razorpay order
            const razorpayOrder = await razorpay.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: "INR",
                receipt: `order_${order._id}`
            });

            // 9. Save Razorpay order ID
            order.razorpayOrderId = razorpayOrder.id;
            await order.save();

            // 10. Return payment information
            return res.status(201).json({
                success: true,
                message: "Payment order created",
                order: {
                    id: order._id,
                    totalAmount: order.totalAmount,
                    paymentStatus: order.paymentStatus,
                    status: order.status
                },
                razorpay: {
                    orderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    keyId: process.env.RAZORPAY_KEY_ID
                }
            });

        } catch (razorpayError) {

            // Razorpay order creation failed.
            // Remove the pending ShopKart order.
            await Order.findByIdAndDelete(order._id);

            console.error("Razorpay order creation error:", razorpayError);

            return res.status(500).json({
                success: false,
                message: "Unable to create payment order"
            });
        }

    } catch (error) {
        console.error("Create payment order error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Verify Razorpay payment signature and confirm order
const verifyPayment = async (req, res) => {
    try {
        const {
            shopKartOrderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // 1. Validate that all required fields are present
        if (
            !shopKartOrderId ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "All payment verification fields are required"
            });
        }

        // Validate ShopKart order ID format
        if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        // 2. Find ShopKart order owned by the authenticated customer
        const order = await Order.findOne({
            _id: shopKartOrderId,
            user: req.customerId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // 3. Verify client's razorpay_order_id matches the trusted razorpayOrderId stored in the order
        if (order.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({
                success: false,
                message: "Razorpay order ID mismatch"
            });
        }

        // 4. Generate expected HMAC SHA256 signature using Razorpay secret and trusted razorpayOrderId
        const body = order.razorpayOrderId + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        // 5. Compare signatures — if invalid, do not mark PAID and do not clear cart
        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        // 6. Update order status upon successful signature verification
        order.paymentStatus = "PAID";
        order.status = "PLACED";
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();

        // 7. Clear the authenticated customer's cart only after successful verification
        const customer = await Customer.findById(req.customerId);
        if (customer) {
            customer.cart = [];
            await customer.save();
        }

        // 8. Return success response with confirmed order details
        return res.status(200).json({
            success: true,
            message: "Payment verified and order placed",
            order: {
                id: order._id,
                totalAmount: order.totalAmount,
                paymentStatus: order.paymentStatus,
                status: order.status,
                razorpayPaymentId: order.razorpayPaymentId
            }
        });

    } catch (error) {
        console.error("Verify payment error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    createPaymentOrder,
    verifyPayment
};
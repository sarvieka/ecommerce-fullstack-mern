const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        // User who placed the order
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },

        // Products purchased in this order
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },

                // Snapshot of product information at purchase time
                name: {
                    type: String,
                    required: true
                },

                price: {
                    type: Number,
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true
                },

                image: {
                    type: String
                }
            }
        ],

        // Shipping information
        shippingAddress: {
            fullName: {
                type: String,
                required: true
            },

            phone: {
                type: String,
                required: true
            },

            addressLine: {
                type: String,
                required: true
            },

            city: {
                type: String,
                required: true
            },

            state: {
                type: String,
                required: true
            },

            pincode: {
                type: String,
                required: true
            }
        },

        // Calculated by the backend
        totalAmount: {
            type: Number,
            required: true
        },

        // Payment status
        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED"],
            default: "PENDING"
        },

        // Order status
        status: {
            type: String,
            enum: [
                "PENDING_PAYMENT",
                "PLACED",
                "CONFIRMED",
                "SHIPPED",
                "DELIVERED"
            ],
            default: "PENDING_PAYMENT"
        },

        // Razorpay information
        razorpayOrderId: {
            type: String
        },

        razorpayPaymentId: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
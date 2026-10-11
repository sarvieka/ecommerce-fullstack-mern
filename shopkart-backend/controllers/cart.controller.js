const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// Add product to cart
const addToCart = async (req, res) => {
    try {
        const { productId } = req.params;

        // 1. Validate product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        // 2. Find the product
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // 3. Find authenticated customer
        const customer = await Customer.findById(req.customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // 4. Check whether product is already in cart
        const cartItem = customer.cart.find(
            item => item.product.toString() === productId
        );

        let newQuantity;

        if (cartItem) {
            newQuantity = cartItem.quantity + 1;
        } else {
            newQuantity = 1;
        }

        // 5. Check stock
        if (newQuantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: "Requested quantity exceeds available stock"
            });
        }

        // 6. Update cart
        if (cartItem) {
            cartItem.quantity = newQuantity;
        } else {
            customer.cart.push({
                product: productId,
                quantity: 1
            });
        }

        // 7. Save customer
        await customer.save();

        // 8. Populate product information
        await customer.populate({
            path: "cart.product",
            select: "name price image stock"
        });

        // 9. Return updated cart
        return res.status(200).json({
            success: true,
            message: "Cart updated",
            cart: customer.cart
        });

    } catch (error) {
        console.error("Add to cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get current user's cart
const getCart = async (req, res) => {
    try {
        const customer = await Customer.findById(req.customerId)
            .populate({
                path: "cart.product",
                select: "name price image stock"
            });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        return res.status(200).json({
            success: true,
            cart: customer.cart
        });

    } catch (error) {
        console.error("Get cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Task 4: Update product quantity
const updateCartQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        // 1. Validate product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        // 2. Validate quantity
        if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be an integer of at least 1"
            });
        }

        // 3. Find product
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // 4. Check stock
        if (quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: "Requested quantity exceeds available stock"
            });
        }

        // 5. Find authenticated customer
        const customer = await Customer.findById(req.customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // 6. Find product in cart
        const cartItem = customer.cart.find(
            item => item.product.toString() === productId
        );

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart"
            });
        }

        // 7. Update quantity
        cartItem.quantity = quantity;

        // 8. Save customer
        await customer.save();

        // 9. Populate product information
        await customer.populate({
            path: "cart.product",
            select: "name price image stock"
        });

        return res.status(200).json({
            success: true,
            message: "Cart quantity updated",
            cart: customer.cart
        });

    } catch (error) {
        console.error("Update cart quantity error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Task 5: Remove product from cart
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        // 1. Validate product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
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

        // 3. Check whether product exists in cart
        const cartItem = customer.cart.find(
            item => item.product.toString() === productId
        );

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart"
            });
        }

        // 4. Remove product from cart
        customer.cart = customer.cart.filter(
            item => item.product.toString() !== productId
        );

        // 5. Save customer
        await customer.save();

        // 6. Populate remaining products
        await customer.populate({
            path: "cart.product",
            select: "name price image stock"
        });

        // 7. Return updated cart
        return res.status(200).json({
            success: true,
            message: "Product removed from cart",
            cart: customer.cart
        });

    } catch (error) {
        console.error("Remove from cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


module.exports = {
    addToCart,
    getCart,
    updateCartQuantity,
    removeFromCart
};
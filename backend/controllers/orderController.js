import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import { evaluateCoupon } from "./couponController.js";

export const createOrder = async (req, res) => {
  try {
    const { address, phone, paymentMethod = "cod", deliveryFee = 0, couponCode, redeemPoints } = req.body;

    if (!address || address.trim().length < 12) {
      return res.status(400).json({ error: "Complete delivery address is required" });
    }

    if (!/^\d{10}$/.test(String(phone || ""))) {
      return res.status(400).json({ error: "Valid 10-digit phone number is required" });
    }

    if (!["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const safeDeliveryFee = Math.max(0, Number(deliveryFee) || 0);

    // Re-validate and recompute any coupon discount on the server. The client
    // cannot be trusted to send a discount amount, so we look the coupon up
    // fresh and run the same engine used by the validate endpoint.
    let discount = 0;
    let appliedCoupon = null;
    if (couponCode && String(couponCode).trim()) {
      const coupon = await Coupon.findOne({
        code: String(couponCode).trim().toUpperCase(),
      });
      const result = evaluateCoupon(coupon, subtotal);
      if (!result.ok) {
        return res.status(400).json({ error: result.reason });
      }
      discount = result.discount;
      appliedCoupon = coupon;
    }

    // Loyalty Points redemption calculation
    const dbUser = await User.findById(req.user._id);
    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    let loyaltyPointsRedeemed = 0;
    if (redeemPoints) {
      const maxRedeemable = Math.max(0, subtotal - discount);
      loyaltyPointsRedeemed = Math.min(dbUser.loyaltyPoints || 0, maxRedeemable);
    }

    const totalAmount = subtotal - discount - loyaltyPointsRedeemed + safeDeliveryFee;
    const loyaltyPointsEarned = Math.floor(Math.max(0, subtotal - discount - loyaltyPointsRedeemed) / 10);

    const order = await Order.create({
      user: req.user._id,
      items: cart.items.map((item) => item.toObject()),
      subtotal,
      deliveryFee: safeDeliveryFee,
      discount,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      loyaltyPointsRedeemed,
      loyaltyPointsEarned,
      loyaltyPointsCredited: false,
      totalAmount,
      address: address.trim(),
      phone: String(phone),
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "cod" : "pending",
      orderStatus: "placed",
    });

    if (loyaltyPointsRedeemed > 0) {
      dbUser.loyaltyPoints -= loyaltyPointsRedeemed;
      dbUser.loyaltyHistory.push({
        points: -loyaltyPointsRedeemed,
        type: "redeem",
        description: `Redeemed on Order #${order._id.toString().slice(-6).toUpperCase()}`,
        orderId: order._id,
        createdAt: new Date(),
      });
      await dbUser.save();
    }

    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      await appliedCoupon.save();
    }

    if (paymentMethod === "cod") {
      cart.items = [];
      await cart.save();
    }

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== "admin") query.user = req.user._id;

    const order = await Order.findOne(query).populate("user", "name email");
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort("-createdAt");
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const allowedStatuses = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = req.body.status;

    // Credit loyalty points on delivery
    if (req.body.status === "delivered") {
      await creditLoyaltyPoints(order);
    }

    // Handle refund/reversion on cancellation
    if (req.body.status === "cancelled" && oldStatus !== "cancelled") {
      await handleCancelledOrderLoyalty(order);
    }

    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

// Helper to credit loyalty points earned from an order
export const creditLoyaltyPoints = async (order) => {
  if (!order || order.loyaltyPointsCredited || order.loyaltyPointsEarned <= 0) {
    return;
  }
  try {
    const user = await User.findById(order.user);
    if (user) {
      user.loyaltyPoints = (user.loyaltyPoints || 0) + order.loyaltyPointsEarned;
      user.loyaltyHistory.push({
        points: order.loyaltyPointsEarned,
        type: "earn",
        description: `Earned from Order #${order._id.toString().slice(-6).toUpperCase()}`,
        orderId: order._id,
        createdAt: new Date(),
      });
      await user.save();
      order.loyaltyPointsCredited = true;
      await order.save();
    }
  } catch (error) {
    console.error("Error crediting loyalty points:", error);
  }
};

// Helper to handle cancelled orders (refund redeemed points and deduct earned points if credited)
export const handleCancelledOrderLoyalty = async (order) => {
  if (!order) return;
  try {
    const user = await User.findById(order.user);
    if (!user) return;

    let userUpdated = false;

    // 1. Refund redeemed points
    if (order.loyaltyPointsRedeemed > 0) {
      user.loyaltyPoints = (user.loyaltyPoints || 0) + order.loyaltyPointsRedeemed;
      user.loyaltyHistory.push({
        points: order.loyaltyPointsRedeemed,
        type: "refund",
        description: `Refunded from cancelled Order #${order._id.toString().slice(-6).toUpperCase()}`,
        orderId: order._id,
        createdAt: new Date(),
      });
      userUpdated = true;
    }

    // 2. Deduct earned points if they were already credited
    if (order.loyaltyPointsCredited && order.loyaltyPointsEarned > 0) {
      user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - order.loyaltyPointsEarned);
      user.loyaltyHistory.push({
        points: -order.loyaltyPointsEarned,
        type: "refund",
        description: `Deducted for cancelled Order #${order._id.toString().slice(-6).toUpperCase()}`,
        orderId: order._id,
        createdAt: new Date(),
      });
      order.loyaltyPointsCredited = false;
      userUpdated = true;
    }

    if (userUpdated) {
      await user.save();
      await order.save();
    }
  } catch (error) {
    console.error("Error handling cancelled order loyalty points:", error);
  }
};
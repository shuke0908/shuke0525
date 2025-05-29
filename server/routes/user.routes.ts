import type { Express } from "express";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
import { authenticate } from "../auth";
import { catchAsync } from "./middleware/common";

export function setupUserRoutes(app: Express) {
  // Get user profile
  app.get("/api/user/profile", authenticate, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user profile
      return res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        balance: user.balance,
        vipLevel: user.vipLevel,
        kycStatus: user.kycStatus,
        profileImageUrl: user.profileImageUrl,
        withdrawalPassword: user.withdrawalPassword,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });
  
  // Update user profile
  app.put("/api/user/profile", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { firstName, lastName } = req.body;
      
      // Update user profile
      const updatedUser = await storage.updateUser(user.id, {
        firstName,
        lastName,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return updated user profile
      return res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        balance: updatedUser.balance,
        vipLevel: updatedUser.vipLevel,
        kycStatus: updatedUser.kycStatus,
        profileImageUrl: updatedUser.profileImageUrl,
        withdrawalPassword: updatedUser.withdrawalPassword,
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Set withdrawal password
  app.put("/api/user/withdrawal-password", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { withdrawalPassword } = req.body;
      
      if (!withdrawalPassword || withdrawalPassword.length < 6) {
        return res.status(400).json({ message: "Withdrawal password must be at least 6 characters" });
      }
      
      console.log(`[WithdrawalPassword] Setting withdrawal password for user ${user.id}`);
      
      // Hash withdrawal password
      const hashedPassword = await bcrypt.hash(withdrawalPassword, 10);
      
      // Update user's withdrawal password
      const updatedUser = await storage.updateUser(user.id, {
        withdrawalPassword: hashedPassword
      });
      
      if (!updatedUser) {
        console.error(`[WithdrawalPassword] User not found: ${user.id}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`[WithdrawalPassword] Successfully updated withdrawal password for user ${user.id}`);
      
      return res.json({ 
        message: "Withdrawal password updated successfully",
        hasWithdrawalPassword: true
      });
    } catch (error) {
      console.error("[WithdrawalPassword] Error setting withdrawal password:", error);
      next(error);
    }
  });

  // Get user transactions
  app.get("/api/transactions", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const transactions = await storage.getUserTransactions(user.id);
      
      return res.json({ transactions });
    } catch (error) {
      next(error);
    }
  });

  // Mark notification as read
  app.put("/api/notifications/:id/read", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const notificationId = parseInt(req.params.id);
      
      await storage.markNotificationAsRead(notificationId, user.id);
      
      return res.json({ message: "Notification marked as read" });
    } catch (error) {
      next(error);
    }
  });

  // Get user notifications
  app.get("/api/notifications", authenticate, catchAsync(async (req, res) => {
    const user = (req as any).user;
    const notifications = await storage.getUserNotifications(user.id);
    res.json({ notifications });
  }));

  // Mark notification as read
  app.patch("/api/notifications/:id/read", authenticate, catchAsync(async (req, res) => {
    const user = (req as any).user;
    const notificationId = parseInt(req.params.id);
    
    await storage.markNotificationAsRead(notificationId, user.id);
    res.json({ message: "Notification marked as read" });
  }));

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", authenticate, catchAsync(async (req, res) => {
    const user = (req as any).user;
    await storage.markAllNotificationsAsRead(user.id);
    res.json({ message: "All notifications marked as read" });
  }));
} 
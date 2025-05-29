import type { Express } from "express";
import { storage } from "../storage";
import { authenticate, requireRole } from "../auth";
import { validate, catchAsync } from "./middleware/common";
import { broadcastToAuthenticated } from '../ws';

export function setupAdminRoutes(app: Express) {
  // Admin Dashboard Stats
  app.get("/api/admin/dashboard/stats", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      // 대시보드 통계 데이터 조회
      const stats = {
        totalUsers: await storage.getTotalUserCount(),
        activeUsers: await storage.getActiveUserCount(),
        totalTrades: await storage.getTotalTradeCount(),
        totalVolume: await storage.getTotalTradeVolume(),
        pendingDeposits: await storage.getPendingDepositsCount(),
        pendingWithdrawals: await storage.getPendingWithdrawalsCount(),
        systemHealth: {
          webSocketConnections: 0, // TODO: get from WebSocket manager
          serverLoad: 0.25,
          dbResponseTime: 150
        }
      };

      return res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  });

  // User Management
  app.get("/api/admin/users", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const { users, total } = await storage.getUsersWithPagination({
        page,
        limit,
        search,
        status
      });

      return res.json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/users/:id", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // 사용자 상세 정보 (거래 내역, 입출금 내역 등 포함)
      const userDetails = {
        ...user,
        tradeHistory: await storage.getUserTradeHistory(userId, 1, 10),
        depositHistory: await storage.getUserDepositHistory(userId, 1, 10),
        withdrawalHistory: await storage.getUserWithdrawalHistory(userId, 1, 10)
      };

      return res.json({ success: true, data: userDetails });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/users/:id", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const updateData = req.body;

      await storage.updateUser(userId, updateData);
      
      return res.json({
        success: true,
        message: "User updated successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Balance Management
  app.post("/api/admin/users/:id/balance", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount, type, reason } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentBalance = parseFloat(user.balance);
      let newBalance;

      if (type === 'add') {
        newBalance = currentBalance + amount;
      } else if (type === 'subtract') {
        newBalance = Math.max(0, currentBalance - amount);
      } else {
        return res.status(400).json({ error: "Invalid type. Must be 'add' or 'subtract'" });
      }

      await storage.updateUser(userId, { balance: newBalance.toString() });

      // 로그 기록
      await storage.createAdminAction({
        adminId: (req as any).user.id,
        action: 'balance_adjustment',
        targetUserId: userId,
        details: { amount, type, reason, oldBalance: currentBalance, newBalance }
      });

      return res.json({
        success: true,
        message: "Balance updated successfully",
        data: { oldBalance: currentBalance, newBalance }
      });
    } catch (error) {
      next(error);
    }
  });

  // Flash Trade Management
  app.post("/api/admin/flash-trade/:id/result", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const tradeId = parseInt(req.params.id);
      const { result } = req.body;

      if (!['win', 'lose'].includes(result)) {
        return res.status(400).json({ error: "Result must be 'win' or 'lose'" });
      }

      await storage.setFlashTradeResult(tradeId, result);

      // 실시간 알림
      broadcastToAuthenticated({
        type: 'flash_trade_result_set',
        data: { tradeId, result }
      });

      return res.json({
        success: true,
        message: `Flash trade result set to ${result}`
      });
    } catch (error) {
      next(error);
    }
  });

  // Deposit Management
  app.get("/api/admin/deposits", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;

      const { deposits, total } = await storage.getDepositsWithPagination({
        page,
        limit,
        status
      });

      return res.json({
        success: true,
        data: deposits,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/deposits/:id", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const depositId = parseInt(req.params.id);
      const { status, rejectionReason } = req.body;

      await storage.updateDepositStatus(depositId, status, rejectionReason);

      return res.json({
        success: true,
        message: "Deposit status updated successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Withdrawal Management  
  app.get("/api/admin/withdrawals", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;

      const { withdrawals, total } = await storage.getWithdrawalsWithPagination({
        page,
        limit,
        status
      });

      return res.json({
        success: true,
        data: withdrawals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/withdrawals/:id", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const { status, rejectionReason, txHash } = req.body;

      await storage.updateWithdrawalStatus(withdrawalId, status, rejectionReason, txHash);

      return res.json({
        success: true,
        message: "Withdrawal status updated successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // System Settings
  app.get("/api/admin/settings", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const settings = await storage.getSystemSettings();
      return res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/settings", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const settings = req.body;
      await storage.updateSystemSettings(settings);

      return res.json({
        success: true,
        message: "System settings updated successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Analytics
  app.get("/api/admin/analytics", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const period = req.query.period as string || '7d';
      
      const analytics = {
        userGrowth: await storage.getUserGrowthAnalytics(period),
        tradeVolume: await storage.getTradeVolumeAnalytics(period),
        revenue: await storage.getRevenueAnalytics(period),
        topUsers: await storage.getTopUsersByVolume(10)
      };

      return res.json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  });

  // Push Notifications
  app.post("/api/admin/notifications/push", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const { title, message, targetType, targetIds } = req.body;

      // 푸시 알림 전송 로직
      if (targetType === 'all') {
        broadcastToAuthenticated({
          type: 'push_notification',
          data: { title, message }
        });
      } else if (targetType === 'specific' && targetIds) {
        // 특정 사용자들에게만 전송
        for (const userId of targetIds) {
          // TODO: implement targeted push notification
        }
      }

      return res.json({
        success: true,
        message: "Push notification sent successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Logs
  app.get("/api/admin/logs", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const level = req.query.level as string;
      const module = req.query.module as string;

      const { logs, total } = await storage.getSystemLogs({
        page,
        limit,
        level,
        module
      });

      return res.json({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  });
} 
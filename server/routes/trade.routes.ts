import type { Express } from "express";
import { storage } from "../storage";
import { authenticate } from "../auth";
import { validate, catchAsync } from "./middleware/common";
// @shared/schema 대신 직접 schema를 정의하거나 다른 방법 사용
import { broadcastToAuthenticated, calculateProfit } from '../ws';

// Flash Trade 스키마 정의 (임시)
const insertFlashTradeSchema = {
  parse: (data: any) => data // 임시로 단순 통과
};

const insertQuantAIInvestmentSchema = {
  parse: (data: any) => data // 임시로 단순 통과
};

export function setupTradeRoutes(app: Express) {
  // Flash Trade Settings
  app.get("/api/flash-trade/settings", async (req, res, next) => {
    try {
      const settings = await storage.getFlashTradeSettings();
      return res.json({ settings });
    } catch (error) {
      next(error);
    }
  });

  // Start Flash Trade
  app.post("/api/flash-trade/start", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { pair, amount, direction, duration } = req.body;

      console.log(`[FlashTrade] User ${user.id} starting trade:`, { pair, amount, direction, duration });

      // Validate input
      if (!pair || !amount || !direction || !duration) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (amount <= 0) {
        return res.status(400).json({ message: "Amount must be positive" });
      }

      if (!['up', 'down'].includes(direction)) {
        return res.status(400).json({ message: "Direction must be 'up' or 'down'" });
      }

      // Check if user has sufficient balance
      const currentUser = await storage.getUser(user.id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (parseFloat(currentUser.balance) < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Get current price
      const currentPrice = await storage.getCurrentPrice(pair);
      if (!currentPrice) {
        return res.status(400).json({ message: "Unable to get current price" });
      }

      // Deduct amount from user balance
      const newBalance = (parseFloat(currentUser.balance) - amount).toString();
      await storage.updateUser(user.id, { balance: newBalance });

      // Create flash trade
      const trade = await storage.createFlashTrade({
        userId: user.id,
        pair,
        amount: amount.toString(),
        direction,
        duration: parseInt(duration),
        entryPrice: currentPrice.toString(),
        status: 'active'
      });

      console.log(`[FlashTrade] Created trade ${trade.id} for user ${user.id}`);

      // Broadcast trade update
      broadcastToAuthenticated({
        type: 'flash_trade_started',
        data: {
          tradeId: trade.id,
          pair,
          amount,
          direction,
          duration,
          entryPrice: currentPrice
        }
      });

      return res.json({
        message: "Flash trade started successfully",
        trade: {
          id: trade.id,
          pair,
          amount,
          direction,
          duration,
          entryPrice: currentPrice,
          status: 'active'
        }
      });
    } catch (error) {
      console.error("[FlashTrade] Error starting trade:", error);
      next(error);
    }
  });

  // Get Active Flash Trades
  app.get("/api/flash-trade/active", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const trades = await storage.getActiveFlashTrades(user.id);
      
      return res.json({ trades });
    } catch (error) {
      next(error);
    }
  });

  // Get Flash Trade History
  app.get("/api/flash-trade/history", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const { trades, total } = await storage.getFlashTradeHistory(user.id, page, limit);
      
      return res.json({
        trades,
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

  // Quant AI Settings
  app.get("/api/quant-ai/settings", authenticate, async (req, res, next) => {
    try {
      const settings = await storage.getQuantAISettings();
      return res.json({ settings });
    } catch (error) {
      next(error);
    }
  });

  // Invest in Quant AI
  app.post("/api/quant-ai/invest", authenticate, validate(insertQuantAIInvestmentSchema), async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { strategyId, amount } = req.body;

      console.log(`[QuantAI] User ${user.id} investing:`, { strategyId, amount });

      // Check if user has sufficient balance
      const currentUser = await storage.getUser(user.id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (parseFloat(currentUser.balance) < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Get strategy details
      const strategy = await storage.getQuantAIStrategy(strategyId);
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }

      // Deduct amount from user balance
      const newBalance = (parseFloat(currentUser.balance) - amount).toString();
      await storage.updateUser(user.id, { balance: newBalance });

      // Create investment
      const investment = await storage.createQuantAIInvestment({
        userId: user.id,
        strategyId,
        amount: amount.toString(),
        status: 'active'
      });

      console.log(`[QuantAI] Created investment ${investment.id} for user ${user.id}`);

      return res.json({
        message: "Investment created successfully",
        investment: {
          id: investment.id,
          strategyId,
          amount,
          status: 'active',
          strategy: strategy
        }
      });
    } catch (error) {
      console.error("[QuantAI] Error creating investment:", error);
      next(error);
    }
  });

  // Get Quant AI Investments
  app.get("/api/quant-ai/investments", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const investments = await storage.getQuantAIInvestments(user.id);
      
      return res.json({ investments });
    } catch (error) {
      next(error);
    }
  });

  // Get crypto rates
  app.get("/api/crypto/rates", async (_req, res) => {
    try {
      const rates = await storage.getCryptoRates();
      return res.json({ rates });
    } catch (error) {
      console.error("Error fetching crypto rates:", error);
      return res.status(500).json({ message: "Failed to fetch crypto rates" });
    }
  });
} 
import type { Express } from "express";
import { storage } from "../storage";
import { authenticate } from "../auth";
import { validate, catchAsync } from "./middleware/common";
import { broadcastToAuthenticated } from '../ws';

export function setupWalletRoutes(app: Express) {
  // Get User Balance
  app.get("/api/wallet/balance", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const userDetails = await storage.getUser(user.id);
      
      if (!userDetails) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        success: true,
        data: {
          balance: userDetails.balance,
          frozenBalance: userDetails.frozenBalance || "0"
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Get Coin Balances
  app.get("/api/wallet/coin-balances", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const coinBalances = await storage.getUserCoinBalances(user.id);
      
      return res.json({
        success: true,
        data: coinBalances
      });
    } catch (error) {
      next(error);
    }
  });

  // Get Transaction History
  app.get("/api/wallet/transactions", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string; // 'deposit', 'withdrawal', 'all'

      const { transactions, total } = await storage.getWalletTransactions(user.id, {
        page,
        limit,
        type
      });

      return res.json({
        success: true,
        data: transactions,
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

  // Generate Deposit Address
  app.post("/api/wallet/deposit/generate-address", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { coin, network } = req.body;

      if (!coin || !network) {
        return res.status(400).json({ error: "Coin and network are required" });
      }

      // 입금 주소 생성 로직
      const depositAddress = await storage.generateDepositAddress(user.id, coin, network);

      return res.json({
        success: true,
        data: depositAddress,
        message: "Deposit address generated successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Submit Deposit Proof
  app.post("/api/wallet/deposit/submit-proof", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { coin, network, amount, txHash, notes } = req.body;

      if (!coin || !network || !txHash) {
        return res.status(400).json({ 
          error: "Coin, network, and transaction hash are required" 
        });
      }

      // 입금 증빙 제출
      const depositRequest = await storage.createDepositRequest({
        userId: user.id,
        coin,
        network,
        amount: amount ? parseFloat(amount) : 0,
        txHash,
        notes,
        status: 'pending'
      });

      return res.json({
        success: true,
        data: depositRequest,
        message: "Deposit proof submitted successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Get Deposit History
  app.get("/api/wallet/deposits", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const { deposits, total } = await storage.getUserDeposits(user.id, {
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

  // Create Withdrawal Request
  app.post("/api/wallet/withdraw", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { coin, network, amount, address, tag } = req.body;

      if (!coin || !network || !amount || !address) {
        return res.status(400).json({ 
          error: "Coin, network, amount, and address are required" 
        });
      }

      // 사용자 잔액 확인
      const userDetails = await storage.getUser(user.id);
      if (!userDetails) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentBalance = parseFloat(userDetails.balance);
      if (currentBalance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // 출금 요청 생성
      const withdrawalRequest = await storage.createWithdrawalRequest({
        userId: user.id,
        coin,
        network,
        amount,
        address,
        tag,
        status: 'pending'
      });

      // 잔액에서 출금 금액 차감 (보류 상태로)
      await storage.updateUser(user.id, { 
        balance: (currentBalance - amount).toString(),
        frozenBalance: ((parseFloat(userDetails.frozenBalance || "0")) + amount).toString()
      });

      return res.json({
        success: true,
        data: withdrawalRequest,
        message: "Withdrawal request submitted successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Get Withdrawal History
  app.get("/api/wallet/withdrawals", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const { withdrawals, total } = await storage.getUserWithdrawals(user.id, {
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

  // Cancel Withdrawal
  app.post("/api/wallet/withdrawals/:id/cancel", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const withdrawalId = parseInt(req.params.id);

      const withdrawal = await storage.getWithdrawal(withdrawalId);
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }

      if (withdrawal.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (withdrawal.status !== 'pending') {
        return res.status(400).json({ error: "Can only cancel pending withdrawals" });
      }

      // 출금 취소 처리
      await storage.updateWithdrawalStatus(withdrawalId, 'cancelled');

      // 잔액 복구
      const userDetails = await storage.getUser(user.id);
      if (userDetails) {
        const currentBalance = parseFloat(userDetails.balance);
        const frozenBalance = parseFloat(userDetails.frozenBalance || "0");
        
        await storage.updateUser(user.id, {
          balance: (currentBalance + withdrawal.amount).toString(),
          frozenBalance: Math.max(0, frozenBalance - withdrawal.amount).toString()
        });
      }

      return res.json({
        success: true,
        message: "Withdrawal cancelled successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Get Supported Coins
  app.get("/api/wallet/supported-coins", async (req, res, next) => {
    try {
      const supportedCoins = await storage.getSupportedCoins();
      
      return res.json({
        success: true,
        data: supportedCoins
      });
    } catch (error) {
      next(error);
    }
  });

  // Get Coin Networks
  app.get("/api/wallet/coin-networks/:coin", async (req, res, next) => {
    try {
      const coin = req.params.coin;
      const networks = await storage.getCoinNetworks(coin);
      
      return res.json({
        success: true,
        data: networks
      });
    } catch (error) {
      next(error);
    }
  });

  // Get Wallet Overview (총 자산, 코인별 잔액 등)
  app.get("/api/wallet/overview", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      
      // 사용자의 모든 코인 잔액 조회
      const coinBalances = await storage.getUserCoinBalances(user.id);
      
      // 코인 가격 정보 조회
      const coinPrices = await storage.getCoinPrices();
      
      // 총 자산 가치 계산
      let totalAssetValue = 0;
      const assetBreakdown = coinBalances.map((balance: any) => {
        const price = coinPrices[balance.coin] || 0;
        const usdValue = balance.balance * price;
        totalAssetValue += usdValue;
        
        return {
          ...balance,
          currentPrice: price,
          usdValue
        };
      });

      return res.json({
        success: true,
        data: {
          totalAssetValue,
          coinBalances: assetBreakdown,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  });
} 
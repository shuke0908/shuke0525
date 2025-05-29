import type { Express } from "express";
import { storage } from "../storage";
import { authenticate, requireRole } from "../auth";
import { validate, catchAsync } from "./middleware/common";
import { broadcastToAuthenticated } from '../ws';

export function setupBonusRoutes(app: Express) {
  // Get User Bonuses
  app.get("/api/bonuses", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const { bonuses, total } = await storage.getUserBonuses(user.id, {
        page,
        limit,
        status
      });

      return res.json({
        success: true,
        data: bonuses,
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

  // Claim Bonus
  app.post("/api/bonuses/:id/claim", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const bonusId = parseInt(req.params.id);

      const bonus = await storage.getBonus(bonusId);
      if (!bonus) {
        return res.status(404).json({ error: "Bonus not found" });
      }

      if (bonus.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (bonus.status !== 'pending') {
        return res.status(400).json({ error: "Bonus is not claimable" });
      }

      // 보너스 클레임 처리
      await storage.claimBonus(bonusId);

      // 사용자 잔액에 보너스 금액 추가
      const userDetails = await storage.getUser(user.id);
      if (userDetails) {
        const newBalance = parseFloat(userDetails.balance) + bonus.amount;
        await storage.updateUser(user.id, { balance: newBalance.toString() });
      }

      return res.json({
        success: true,
        message: "Bonus claimed successfully",
        data: { amount: bonus.amount }
      });
    } catch (error) {
      next(error);
    }
  });

  // Get Available Promotions
  app.get("/api/bonuses/promotions", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const promotions = await storage.getAvailablePromotions(user.id);

      return res.json({
        success: true,
        data: promotions
      });
    } catch (error) {
      next(error);
    }
  });

  // Participate in Promotion
  app.post("/api/bonuses/promotions/:id/participate", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const promotionId = parseInt(req.params.id);

      const promotion = await storage.getPromotion(promotionId);
      if (!promotion) {
        return res.status(404).json({ error: "Promotion not found" });
      }

      if (!promotion.isActive) {
        return res.status(400).json({ error: "Promotion is not active" });
      }

      // 이미 참여했는지 확인
      const existingParticipation = await storage.getPromotionParticipation(user.id, promotionId);
      if (existingParticipation) {
        return res.status(400).json({ error: "Already participating in this promotion" });
      }

      // 프로모션 참여 처리
      const participation = await storage.createPromotionParticipation({
        userId: user.id,
        promotionId,
        participatedAt: new Date()
      });

      return res.json({
        success: true,
        data: participation,
        message: "Successfully joined promotion"
      });
    } catch (error) {
      next(error);
    }
  });

  // Get Referral Information
  app.get("/api/bonuses/referral", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const referralInfo = await storage.getUserReferralInfo(user.id);

      return res.json({
        success: true,
        data: referralInfo
      });
    } catch (error) {
      next(error);
    }
  });

  // Generate Referral Code
  app.post("/api/bonuses/referral/generate", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      
      // 기존 추천 코드가 있는지 확인
      const existingCode = await storage.getUserReferralCode(user.id);
      if (existingCode) {
        return res.json({
          success: true,
          data: { referralCode: existingCode.code },
          message: "Referral code already exists"
        });
      }

      // 새 추천 코드 생성
      const referralCode = await storage.generateReferralCode(user.id);

      return res.json({
        success: true,
        data: { referralCode: referralCode.code },
        message: "Referral code generated successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Get Daily Check-in Status
  app.get("/api/bonuses/daily-checkin", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const checkinStatus = await storage.getDailyCheckinStatus(user.id);

      return res.json({
        success: true,
        data: checkinStatus
      });
    } catch (error) {
      next(error);
    }
  });

  // Perform Daily Check-in
  app.post("/api/bonuses/daily-checkin", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;

      // 오늘 이미 체크인했는지 확인
      const todayCheckin = await storage.getTodayCheckin(user.id);
      if (todayCheckin) {
        return res.status(400).json({ error: "Already checked in today" });
      }

      // 연속 체크인 일수 계산
      const consecutiveDays = await storage.getConsecutiveCheckinDays(user.id);
      
      // 체크인 보상 계산
      const reward = calculateCheckinReward(consecutiveDays + 1);

      // 체크인 기록
      const checkin = await storage.createDailyCheckin({
        userId: user.id,
        consecutiveDays: consecutiveDays + 1,
        reward,
        checkinDate: new Date()
      });

      // 보너스 지급
      await storage.createBonus({
        userId: user.id,
        type: 'daily_checkin',
        amount: reward,
        status: 'completed',
        description: `Daily check-in bonus (Day ${consecutiveDays + 1})`
      });

      // 사용자 잔액 업데이트
      const userDetails = await storage.getUser(user.id);
      if (userDetails) {
        const newBalance = parseFloat(userDetails.balance) + reward;
        await storage.updateUser(user.id, { balance: newBalance.toString() });
      }

      return res.json({
        success: true,
        data: {
          consecutiveDays: consecutiveDays + 1,
          reward,
          checkin
        },
        message: "Daily check-in completed successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Create Bonus
  app.post("/api/admin/bonuses", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const { userId, type, amount, description, expiresAt } = req.body;

      if (!userId || !type || !amount || !description) {
        return res.status(400).json({ 
          error: "UserId, type, amount, and description are required" 
        });
      }

      const bonus = await storage.createBonus({
        userId,
        type,
        amount,
        description,
        status: 'pending',
        expiresAt: expiresAt ? new Date(expiresAt) : null
      });

      // 사용자에게 알림
      broadcastToAuthenticated({
        type: 'bonus_received',
        data: { bonus, userId }
      });

      return res.json({
        success: true,
        data: bonus,
        message: "Bonus created successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Create Promotion
  app.post("/api/admin/bonuses/promotions", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const promotionData = req.body;

      const promotion = await storage.createPromotion(promotionData);

      return res.json({
        success: true,
        data: promotion,
        message: "Promotion created successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get Bonus Statistics
  app.get("/api/admin/bonuses/stats", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const period = req.query.period as string || '7d';
      
      const stats = {
        totalBonusesIssued: await storage.getTotalBonusesIssued(period),
        totalBonusAmount: await storage.getTotalBonusAmount(period),
        bonusesByType: await storage.getBonusesByType(period),
        topBonusReceivers: await storage.getTopBonusReceivers(period, 10)
      };

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  });
}

// 체크인 보상 계산 함수
function calculateCheckinReward(consecutiveDays: number): number {
  const baseReward = 1; // $1 기본 보상
  
  if (consecutiveDays <= 7) {
    return baseReward * consecutiveDays;
  } else if (consecutiveDays <= 14) {
    return baseReward * 2 * (consecutiveDays - 7) + 28; // 7일차까지 보상 + 2배 보상
  } else if (consecutiveDays <= 30) {
    return baseReward * 3 * (consecutiveDays - 14) + 42; // 14일차까지 보상 + 3배 보상
  } else {
    return baseReward * 5 * (consecutiveDays - 30) + 90; // 30일차까지 보상 + 5배 보상
  }
} 
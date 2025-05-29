import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import setupWebSocket, { broadcastToAuthenticated, getWebSocketServer, calculateProfit } from './ws';
import { WebSocket } from 'ws';
import { storage } from "./storage";
import * as z from "zod";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { setupAuth, authenticate, adminOnly, superAdminOnly } from "./auth";
import { ipRestrictionMiddleware, getClientIP, updateLoginInfo, validateSecuritySettings } from "./security";
import { 
  insertUserSchema, 
  insertDepositSchema, 
  insertWithdrawalSchema,
  insertFlashTradeSchema,
  insertQuantAIInvestmentSchema,
  insertSupportTicketSchema,
  insertSupportMessageSchema
} from "@shared/schema";

// Helper function to catch async errors
const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Setup upload directory
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Set up multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + randomUUID();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: uploadStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and JPG files are allowed'));
    }
    cb(null, true);
  }
});

// Authentication middlewares are now imported from ./auth.ts

// Validation middleware
const validate = (schema: z.ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      next(error);
    }
  };
};

// Error handling middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  return res.status(500).json({ message: err.message || "Internal server error" });
};

import { BonusManager } from './bonus';

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup Auth middleware
  setupAuth(app);
  
  // Apply IP restriction middleware to protected routes
  app.use('/api', ipRestrictionMiddleware);
  
  // Setup WebSocket server (includes automatic trade processing)
  setupWebSocket(httpServer);
  
  // User Routes
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
        withdrawalPassword: user.withdrawalPassword, // Include withdrawal password status
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });
  
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
  
  // KYC Routes
  app.post(
    "/api/kyc/upload", 
    authenticate, 
    upload.fields([
      { name: 'idFront', maxCount: 1 },
      { name: 'idBack', maxCount: 1 },
      { name: 'addressProof', maxCount: 1 }
    ]), 
    async (req, res, next) => {
      try {
        const user = (req as any).user;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        // Check if all required files are present
        if (!files.idFront || !files.idBack || !files.addressProof) {
          return res.status(400).json({ message: "All documents are required" });
        }
        
        // Create KYC document
        const kycDocument = await storage.createKycDocument({
          userId: user.id,
          idFrontPath: files.idFront[0].path,
          idBackPath: files.idBack[0].path,
          addressProofPath: files.addressProof[0].path,
          status: 'pending'
        });
        
        // Create notification for admin
        await storage.createNotification({
          userId: user.id,
          title: "New KYC Submission",
          message: `${user.firstName || user.email} has submitted KYC documents for verification.`,
          type: "info",
          isRead: false
        });
        
        // Broadcast to admin websocket
        broadcastToAuthenticated('admin-notification', {
          action: 'new-kyc',
          userId: user.id,
          username: user.username,
          documentId: kycDocument.id,
          timestamp: new Date()
        });
        
        return res.status(201).json({
          message: "KYC documents uploaded successfully",
          kycDocument: {
            id: kycDocument.id,
            status: kycDocument.status,
            createdAt: kycDocument.createdAt
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  app.get("/api/kyc", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      
      const kycDocuments = await storage.getKycDocumentsByUserId(user.id);
      
      if (kycDocuments.length === 0) {
        return res.json({
          idVerification: "not_started",
          addressVerification: "not_started"
        });
      }
      
      // Get the latest KYC document
      const latestKyc = kycDocuments.reduce((latest, current) => {
        return latest.createdAt > current.createdAt ? latest : current;
      });
      
      return res.json({
        idVerification: latestKyc.status,
        addressVerification: latestKyc.status,
        submittedAt: latestKyc.createdAt,
        updatedAt: latestKyc.updatedAt,
        feedback: latestKyc.rejectionReason
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Keep the old endpoint for backward compatibility
  app.get("/api/kyc/status", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      
      const kycDocuments = await storage.getKycDocumentsByUserId(user.id);
      
      if (kycDocuments.length === 0) {
        return res.json({ status: "not-submitted" });
      }
      
      // Get the latest KYC document
      const latestKyc = kycDocuments.reduce((latest, current) => {
        return latest.createdAt > current.createdAt ? latest : current;
      });
      
      return res.json({
        status: latestKyc.status,
        submittedAt: latestKyc.createdAt,
        updatedAt: latestKyc.updatedAt,
        rejectionReason: latestKyc.rejectionReason
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Add individual document upload endpoints
  app.post(
    "/api/kyc/id-verification",
    authenticate,
    upload.single('idDocument'),
    async (req, res, next) => {
      try {
        const user = (req as any).user;
        const file = req.file;
        
        if (!file) {
          return res.status(400).json({ message: "ID document is required" });
        }
        
        // Get existing KYC document or create new one
        const existingDocuments = await storage.getKycDocumentsByUserId(user.id);
        let kycDocument;
        
        if (existingDocuments.length > 0) {
          // Update existing document
          const latestDoc = existingDocuments[0];
          kycDocument = await storage.updateKycDocument(latestDoc.id, {
            idFrontPath: file.path,
            status: 'pending'
          });
        } else {
          // Create new document with just ID front path
          kycDocument = await storage.createKycDocument({
            userId: user.id,
            idFrontPath: file.path,
            idBackPath: file.path, // Use same path as placeholder
            addressProofPath: 'placeholder', // Placeholder until address verification
            status: 'pending'
          });
        }
        
        // Update user KYC status
        await storage.updateUser(user.id, {
          kycStatus: 'pending'
        });
        
        // Notify admins of new KYC document
        broadcastToAuthenticated('admin-notification', {
          action: 'new-kyc',
          userId: user.id,
          email: user.email,
          documentId: kycDocument.id,
          type: 'id-verification',
          timestamp: new Date()
        });
        
        return res.status(201).json({
          message: "ID verification document uploaded successfully",
          idVerification: "pending"
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Upload address verification only
  app.post(
    "/api/kyc/address-verification",
    authenticate,
    upload.single('addressDocument'),
    async (req, res, next) => {
      try {
        const user = (req as any).user;
        const file = req.file;
        
        if (!file) {
          return res.status(400).json({ message: "Address document is required" });
        }
        
        // Get existing KYC document or create new one
        const existingDocuments = await storage.getKycDocumentsByUserId(user.id);
        let kycDocument;
        
        if (existingDocuments.length > 0) {
          // Update existing document
          const latestDoc = existingDocuments[0];
          kycDocument = await storage.updateKycDocument(latestDoc.id, {
            addressProofPath: file.path,
            status: 'pending'
          });
        } else {
          // Create new document with just address proof path
          kycDocument = await storage.createKycDocument({
            userId: user.id,
            idFrontPath: 'placeholder', // Placeholder until ID verification
            idBackPath: 'placeholder', // Placeholder until ID verification
            addressProofPath: file.path,
            status: 'pending'
          });
        }
        
        // Update user KYC status
        await storage.updateUser(user.id, {
          kycStatus: 'pending'
        });
        
        // Notify admins of new KYC document
        broadcastToAuthenticated('admin-notification', {
          action: 'new-kyc',
          userId: user.id,
          email: user.email,
          documentId: kycDocument.id,
          type: 'address-verification',
          timestamp: new Date()
        });
        
        return res.status(201).json({
          message: "Address verification document uploaded successfully",
          addressVerification: "pending"
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Bonus Routes
  app.get('/api/bonus/programs', authenticate, catchAsync(async (req, res) => {
    const programs = await storage.getActiveBonusPrograms();
    return res.json({ programs });
  }));

  app.get('/api/bonus/user-bonuses', authenticate, catchAsync(async (req, res) => {
    const bonuses = await storage.getUserBonuses(req.user!.id);
    return res.json({ bonuses });
  }));

  app.post('/api/bonus/redeem-promotion', authenticate, catchAsync(async (req, res) => {
    const { promotionCode } = req.body;
    
    if (!promotionCode) {
      return res.status(400).json({ message: 'Promotion code is required' });
    }
    
    const success = await BonusManager.processSpecialPromotionBonus(req.user!.id, promotionCode);
    
    if (success) {
      return res.json({ 
        success: true, 
        message: 'Promotion code redeemed successfully' 
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired promotion code' 
      });
    }
  }));
  
  // Admin Bonus Routes
  app.get('/api/admin/bonus/programs', authenticate, adminOnly, catchAsync(async (req, res) => {
    const programs = await storage.getActiveBonusPrograms();
    return res.json({ programs });
  }));
  
  app.post('/api/admin/bonus/programs', authenticate, adminOnly, catchAsync(async (req, res) => {
    const data = req.body;
    
    // Validate data
    if (!data.name || !data.type || !data.startDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Set creator
    data.createdBy = req.user!.id;
    
    const program = await storage.createBonusProgram(data);
    return res.status(201).json({ program });
  }));
  
  app.put('/api/admin/bonus/programs/:id', authenticate, adminOnly, catchAsync(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    
    const program = await storage.updateBonusProgram(parseInt(id), data);
    
    if (!program) {
      return res.status(404).json({ message: 'Bonus program not found' });
    }
    
    return res.json({ program });
  }));
  
  app.put('/api/admin/bonus/programs/:id/toggle', authenticate, adminOnly, catchAsync(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }
    
    const program = await storage.toggleBonusProgramActive(parseInt(id), isActive);
    
    if (!program) {
      return res.status(404).json({ message: 'Bonus program not found' });
    }
    
    return res.json({ program });
  }));
  
  app.get('/api/admin/bonus/user-bonuses', authenticate, adminOnly, catchAsync(async (req, res) => {
    const userBonuses = await storage.getActiveUserBonuses();
    return res.json({ userBonuses });
  }));
  
  app.put('/api/admin/bonus/user-bonuses/:id/status', authenticate, adminOnly, catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'active', 'completed', 'expired', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const bonus = await storage.updateUserBonusStatus(parseInt(id), status);
    
    if (!bonus) {
      return res.status(404).json({ message: 'User bonus not found' });
    }
    
    return res.json({ bonus });
  }));

  // Deposit Routes
  app.post(
    "/api/deposits", 
    authenticate, 
    upload.single('screenshot'), 
    async (req, res, next) => {
      try {
        const user = (req as any).user;
        console.log("Deposit request received:", { 
          body: req.body,
          file: req.file,
          user: user.id
        });
        
        const { amount, coin } = req.body;
        
        if (!req.file) {
          console.log("Deposit validation error: Screenshot is required");
          return res.status(400).json({ message: "Screenshot is required" });
        }
        
        if (!amount || isNaN(parseFloat(amount))) {
          console.log("Deposit validation error: Invalid amount", amount);
          return res.status(400).json({ message: "Valid amount is required" });
        }
        
        if (!coin) {
          console.log("Deposit validation error: Coin not selected");
          return res.status(400).json({ message: "Coin selection is required" });
        }
        
        // Create deposit
        const deposit = await storage.createDeposit({
          userId: user.id,
          amount,
          coin: coin as any,
          screenshotPath: req.file.path,
          status: 'pending'
        });
        
        console.log("Deposit created successfully:", deposit);
        
        // Create notification for admin
        await storage.createNotification({
          userId: user.id,
          title: "New Deposit Request",
          message: `A user has submitted a deposit request for ${amount} ${coin}.`,
          type: "info",
          isRead: false
        });
        
        // Broadcast to admin websocket
        broadcastToAuthenticated('admin-notification', {
          action: 'new-deposit',
          userId: user.id,
          email: user.email,
          depositId: deposit.id,
          amount,
          coin,
          timestamp: new Date()
        });
        
        return res.status(201).json({
          message: "Deposit request submitted successfully",
          deposit: {
            id: deposit.id,
            amount: deposit.amount,
            coin: deposit.coin,
            status: deposit.status,
            createdAt: deposit.createdAt
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  app.get("/api/deposits", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      
      const deposits = await storage.getDepositsByUserId(user.id);
      
      return res.json({
        deposits: deposits.map(deposit => ({
          id: deposit.id,
          amount: deposit.amount,
          coin: deposit.coin,
          status: deposit.status,
          createdAt: deposit.createdAt,
          updatedAt: deposit.updatedAt,
          rejectionReason: deposit.rejectionReason
        }))
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Withdrawal Routes
  app.post("/api/withdrawals", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      
      // Manually validate the request body, but add userId if it's missing
      const withdrawalData = {
        ...req.body,
        userId: req.body.userId || user.id // Use userId from request body if available, otherwise from authenticated user
      };
      
      try {
        // Validate the withdrawal data with the schema
        insertWithdrawalSchema.parse(withdrawalData);
      } catch (validationError: any) {
        console.error('Withdrawal validation error:', validationError);
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationError.errors || [{ message: "Invalid withdrawal data" }]
        });
      }
      
      const { amount, coin, destinationAddress, withdrawalPassword } = withdrawalData;
      
      console.log(`User ${user.id} (${user.email}) requesting withdrawal of ${amount} ${coin}`);
      
      // Check if withdrawal password is set
      if (!user.withdrawalPassword) {
        console.error(`User ${user.id} has no withdrawal password set`);
        return res.status(400).json({ message: "Withdrawal password not set" });
      }
      
      // Verify withdrawal password
      const isPasswordValid = await bcrypt.compare(withdrawalPassword, user.withdrawalPassword);
      if (!isPasswordValid) {
        console.error(`User ${user.id} provided invalid withdrawal password`);
        return res.status(401).json({ message: "Invalid withdrawal password" });
      }
      
      // Check if KYC is approved
      if (user.kycStatus !== 'approved') {
        console.error(`User ${user.id} KYC status is ${user.kycStatus}, not approved`);
        return res.status(400).json({ message: "KYC approval required for withdrawals" });
      }
      
      console.log(`User balance check: ${user.balance}, withdrawal amount: ${amount}`);
      
      // Check if user has sufficient balance
      const currentBalance = parseFloat(user.balance);
      const withdrawalAmount = parseFloat(amount);
      
      if (currentBalance < withdrawalAmount) {
        console.error(`User ${user.id} has insufficient balance: ${currentBalance} < ${withdrawalAmount}`);
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // We will NOT deduct the balance when withdrawal is requested, 
      // only when it's approved by admin
      console.log(`No balance update for now. Balance will be deducted upon admin approval`);
      
      // Store current balance for transaction record
      const newBalance = currentBalance;
      
      // Create withdrawal request
      const withdrawal = await storage.createWithdrawal({
        userId: user.id,
        amount,
        coin: coin as any,
        destinationAddress,
        status: 'pending'
      });
      
      // Create transaction record for withdrawal request (no balance change yet)
      await storage.createTransaction({
        userId: user.id,
        type: 'withdrawal_pending',
        amount: amount,
        balanceBefore: user.balance,
        balanceAfter: user.balance, // No balance change at request time
        description: `Withdrawal request of ${amount} ${coin} created (pending admin approval)`,
        metadata: {
          withdrawalId: withdrawal.id,
          destinationAddress
        }
      });
      
      // Create notification for admin
      await storage.createNotification({
        userId: user.id,
        title: "New Withdrawal Request",
        message: `${user.username} has requested a withdrawal of ${amount} ${coin}.`,
        type: "info",
        isRead: false
      });
      
      // Broadcast to admin websocket
      broadcastToAuthenticated('admin-notification', {
        action: 'new-withdrawal',
        userId: user.id,
        username: user.username,
        withdrawalId: withdrawal.id,
        amount,
        coin,
        timestamp: new Date()
      });
      
      return res.status(201).json({
        message: "Withdrawal request submitted successfully",
        withdrawal: {
          id: withdrawal.id,
          amount: withdrawal.amount,
          coin: withdrawal.coin,
          status: withdrawal.status,
          createdAt: withdrawal.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/withdrawals", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      
      const withdrawals = await storage.getWithdrawalsByUserId(user.id);
      
      return res.json({
        withdrawals: withdrawals.map(withdrawal => ({
          id: withdrawal.id,
          amount: withdrawal.amount,
          coin: withdrawal.coin,
          destinationAddress: withdrawal.destinationAddress,
          status: withdrawal.status,
          createdAt: withdrawal.createdAt,
          updatedAt: withdrawal.updatedAt,
          rejectionReason: withdrawal.rejectionReason
        }))
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Flash Trade Routes
  app.get("/api/flash-trade/settings", async (req, res, next) => {
    try {
      const settings = await storage.getAllFlashTradeSettings();
      
      // Only return active settings
      const activeSettings = settings.filter(setting => setting.isActive);
      
      console.log('[DEBUG] Flash trade settings requested:', activeSettings);
      
      return res.json({
        settings: activeSettings.map(setting => ({
          id: setting.id,
          duration: setting.duration,
          returnRate: setting.returnRate,
          minAmount: setting.minAmount,
          maxAmount: setting.maxAmount
        }))
      });
    } catch (error) {
      console.error('[ERROR] Failed to get flash trade settings:', error);
      next(error);
    }
  });
  
  app.post("/api/flash-trade/start", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      
      if (!user || !user.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Update req.body to include userId
      req.body.userId = user.id;
      
      // Validate using schema
      try {
        insertFlashTradeSchema.parse(req.body);
      } catch (error: any) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: error.errors || [{ message: "Invalid request data" }] 
        });
      }
      
      const { amount, direction, duration, returnRate, entryPrice, potentialProfit } = req.body;
      
      // Check if user is allowed to use flash trade
      if (user.allowedTradingTypes && !user.allowedTradingTypes.includes('flash')) {
        return res.status(403).json({ message: "Flash Trade is not available for your account" });
      }
      
      // Get flash trade setting for validation
      const settings = await storage.getAllFlashTradeSettings();
      const setting = settings.find(s => 
        s.isActive && s.duration === parseInt(duration) && 
        parseFloat(s.returnRate) === parseFloat(returnRate)
      );
      
      if (!setting) {
        return res.status(400).json({ message: "Invalid flash trade settings" });
      }
      
      // Validate amount against min/max
      if (parseFloat(amount) < parseFloat(setting.minAmount) || 
          parseFloat(amount) > parseFloat(setting.maxAmount)) {
        return res.status(400).json({ 
          message: `Amount must be between ${setting.minAmount} and ${setting.maxAmount}` 
        });
      }
      
      // Check if user has sufficient balance
      if (parseFloat(user.balance) < parseFloat(amount)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Deduct amount from user's balance
      console.log(`[FlashTrade] User: ${user.id}, Current balance: ${user.balance}, Trade amount: ${amount}`);
      
      // Parse values with proper error handling
      const currentBalance = parseFloat(user.balance);
      const tradeAmount = parseFloat(amount);
      
      if (isNaN(currentBalance) || isNaN(tradeAmount)) {
        console.error(`[FlashTrade] Invalid numbers - Balance: ${user.balance}, Amount: ${amount}`);
        return res.status(400).json({ message: "Invalid balance or amount values" });
      }
      
      // Calculate with precision and format as string with fixed decimal places
      const newBalanceValue = currentBalance - tradeAmount;
      const newBalance = newBalanceValue.toFixed(8);
      
      console.log(`[FlashTrade] New balance calculation: ${currentBalance} - ${tradeAmount} = ${newBalanceValue} (formatted: ${newBalance})`);
      
      try {
        await storage.updateUserBalance(user.id, newBalance);
        console.log(`[FlashTrade] Balance updated for user ${user.id} to ${newBalance}`);
      } catch (error) {
        console.error(`[FlashTrade] Failed to update balance:`, error);
        return res.status(500).json({ message: "Failed to update balance" });
      }
      
      // Create flash trade
      const flashTrade = await storage.createFlashTrade({
        userId: user.id,
        amount,
        direction: direction === 'up' ? 'up' : 'down', // Ensure direction is properly validated
        duration,
        returnRate,
        entryPrice,
        potentialProfit,
        status: 'active',
        startTime: new Date()
      });
      
      // Create transaction record
      await storage.createTransaction({
        userId: user.id,
        type: 'flash_trade_start',
        amount: '-' + amount,
        balanceBefore: user.balance,
        balanceAfter: newBalance,
        description: `Started a ${duration}s Flash Trade`,
        metadata: {
          tradeId: flashTrade.id,
          direction,
          duration,
          returnRate
        }
      });
      
      // Broadcast to websocket
      broadcastToAuthenticated({
        type: 'flash-trade',
        action: 'new',
        data: {
          tradeId: flashTrade.id,
          userId: user.id,
          username: user.username,
          amount,
          direction,
          duration,
          returnRate,
          potentialProfit,
          startTime: flashTrade.startTime
        }
      });
      
      return res.status(201).json({
        message: "Flash trade created successfully",
        flashTrade: {
          id: flashTrade.id,
          amount: flashTrade.amount,
          direction: flashTrade.direction,
          duration: flashTrade.duration,
          returnRate: flashTrade.returnRate,
          entryPrice: flashTrade.entryPrice,
          potentialProfit: flashTrade.potentialProfit,
          status: flashTrade.status,
          startTime: flashTrade.startTime
        },
        newBalance
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/flash-trade/active", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      
      if (!user || !user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const flashTrades = await storage.getFlashTradesByUserId(user.id);
      const activeTrades = flashTrades.filter(trade => trade.status === 'active');
      
      const now = Date.now();
      
      return res.json({
        activeTrades: activeTrades.map(trade => {
          // Convert startTime to Date if it's a string
          const startTimeDate = typeof trade.startTime === 'string' 
            ? new Date(trade.startTime) 
            : trade.startTime;
            
          // Calculate elapsed seconds
          const elapsedSeconds = Math.floor((now - startTimeDate.getTime()) / 1000);
          
          // Calculate remaining time (duration minus elapsed time)
          const remainingTime = Math.max(0, trade.duration - elapsedSeconds);
          
          return {
            id: trade.id,
            amount: trade.amount,
            direction: trade.direction,
            duration: trade.duration,
            returnRate: trade.returnRate,
            entryPrice: trade.entryPrice,
            potentialProfit: trade.potentialProfit,
            startTime: trade.startTime,
            remainingTime: remainingTime
          };
        })
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/flash-trade/history", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      
      const flashTrades = await storage.getFlashTradesByUserId(user.id);
      const completedTrades = flashTrades.filter(trade => trade.status !== 'active');
      
      return res.json({
        trades: completedTrades.map(trade => ({
          id: trade.id,
          amount: trade.amount,
          direction: trade.direction,
          duration: trade.duration,
          returnRate: trade.returnRate,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          potentialProfit: trade.potentialProfit,
          status: trade.status,
          startTime: trade.startTime,
          endTime: trade.endTime
        }))
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Second duplicate endpoint removed
  
  // Quant AI Routes
  app.get("/api/quant-ai/settings", authenticate, async (req, res, next) => {
    try {
      const settings = await storage.getAllQuantAISettings();
      
      // Only return active settings
      const activeSettings = settings.filter(setting => setting.isActive);
      
      return res.json({
        settings: activeSettings.map(setting => ({
          id: setting.id,
          strategy: setting.strategy,
          duration: setting.duration,
          dailyReturn: setting.dailyReturn,
          totalReturn: setting.totalReturn,
          minAmount: setting.minAmount,
          maxAmount: setting.maxAmount
        }))
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/quant-ai/invest", authenticate, validate(insertQuantAIInvestmentSchema), async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { strategyId, amount, duration, dailyReturn, totalReturn } = req.body;
      
      // Check if user is allowed to use quant AI
      if (user.allowedTradingTypes && !user.allowedTradingTypes.includes('quant')) {
        return res.status(403).json({ message: "Quant AI is not available for your account" });
      }
      
      // Get strategy for validation
      const settings = await storage.getAllQuantAISettings();
      const strategy = settings.find(s => 
        s.isActive && s.id === parseInt(strategyId) && 
        s.duration === parseInt(duration) &&
        parseFloat(s.dailyReturn) === parseFloat(dailyReturn) &&
        parseFloat(s.totalReturn) === parseFloat(totalReturn)
      );
      
      if (!strategy) {
        return res.status(400).json({ message: "Invalid strategy settings" });
      }
      
      // Validate amount against min/max
      if (parseFloat(amount) < parseFloat(strategy.minAmount) || 
          parseFloat(amount) > parseFloat(strategy.maxAmount)) {
        return res.status(400).json({ 
          message: `Amount must be between ${strategy.minAmount} and ${strategy.maxAmount}` 
        });
      }
      
      // Check if user has sufficient balance
      if (parseFloat(user.balance) < parseFloat(amount)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Calculate start and end dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(duration));
      
      // Deduct amount from user's balance
      console.log(`[QuantAI Investment] User: ${user.id}, Current balance: ${user.balance}, Investment amount: ${amount}`);
      
      // Parse values with proper error handling
      const currentBalance = parseFloat(user.balance);
      const investmentAmount = parseFloat(amount);
      
      if (isNaN(currentBalance) || isNaN(investmentAmount)) {
        console.error(`[QuantAI Investment] Invalid numbers - Balance: ${user.balance}, Amount: ${amount}`);
        return res.status(400).json({ message: "Invalid balance or amount values" });
      }
      
      // Calculate with precision and format as string with fixed decimal places
      const newBalanceValue = currentBalance - investmentAmount;
      const newBalance = newBalanceValue.toFixed(8);
      
      console.log(`[QuantAI Investment] New balance calculation: ${currentBalance} - ${investmentAmount} = ${newBalanceValue} (formatted: ${newBalance})`);
      
      try {
        await storage.updateUserBalance(user.id, newBalance);
        console.log(`[QuantAI Investment] Balance updated for user ${user.id} to ${newBalance}`);
      } catch (error) {
        console.error(`[QuantAI Investment] Failed to update balance:`, error);
        return res.status(500).json({ message: "Failed to update balance" });
      }
      
      // Create quant AI investment
      const investment = await storage.createQuantAIInvestment({
        userId: user.id,
        strategyId: parseInt(strategyId),
        amount,
        duration: parseInt(duration),
        dailyReturn,
        totalReturn,
        currentValue: amount, // Initial value same as investment amount
        startDate,
        endDate,
        isCompleted: false,
        dailyReturnHistory: []
      });
      
      // Create transaction record
      await storage.createTransaction({
        userId: user.id,
        type: 'quant_ai_investment',
        amount: '-' + amount,
        balanceBefore: user.balance,
        balanceAfter: newBalance,
        description: `Started a ${duration}-day Quant AI investment`,
        metadata: {
          investmentId: investment.id,
          strategy: strategy.strategy,
          duration,
          dailyReturn,
          totalReturn
        }
      });
      
      return res.status(201).json({
        message: "Quant AI investment created successfully",
        investment: {
          id: investment.id,
          amount: investment.amount,
          strategy: strategy.strategy,
          duration: investment.duration,
          dailyReturn: investment.dailyReturn,
          totalReturn: investment.totalReturn,
          currentValue: investment.currentValue,
          startDate: investment.startDate,
          endDate: investment.endDate
        },
        newBalance
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/quant-ai/investments", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      
      const activeInvestments = await storage.getActiveQuantAIInvestmentsByUserId(user.id);
      
      // Get strategy details for each investment
      const strategies = await storage.getAllQuantAISettings();
      
      return res.json({
        investments: await Promise.all(activeInvestments.map(async (investment) => {
          const strategy = strategies.find(s => s.id === investment.strategyId);
          return {
            id: investment.id,
            amount: investment.amount,
            strategy: strategy?.strategy || 'unknown',
            duration: investment.duration,
            dailyReturn: investment.dailyReturn,
            totalReturn: investment.totalReturn,
            currentValue: investment.currentValue,
            startDate: investment.startDate,
            endDate: investment.endDate,
            // Calculate days completed
            daysCompleted: Math.min(
              investment.duration,
              Math.floor((Date.now() - investment.startDate.getTime()) / (24 * 60 * 60 * 1000))
            ),
            dailyReturnHistory: investment.dailyReturnHistory
          };
        }))
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Complete Quant AI investment endpoint
  app.post("/api/quant-ai/complete/:id", authenticate, adminOnly, async (req, res, next) => {
    try {
      const investmentId = parseInt(req.params.id);
      const adminUser = (req as any).user;
      const { finalValue } = req.body;
      
      if (!finalValue) {
        return res.status(400).json({ message: "Final value is required" });
      }
      
      // Get the investment
      const activeInvestments = await storage.getAllActiveQuantAIInvestments();
      const investment = activeInvestments.find(inv => inv.id === investmentId);
      
      if (!investment) {
        return res.status(404).json({ message: "Investment not found or already completed" });
      }
      
      // Get user
      const user = await storage.getUser(investment.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update investment value
      await storage.updateQuantAIInvestmentValue(investmentId, finalValue);
      
      // Mark investment as completed
      const completedInvestment = await storage.completeQuantAIInvestment(investmentId);
      
      if (!completedInvestment) {
        return res.status(500).json({ message: "Failed to complete investment" });
      }
      
      // Add the final value to user's balance
      const newBalance = (parseFloat(user.balance) + parseFloat(finalValue)).toString();
      await storage.updateUserBalance(user.id, newBalance);
      
      // Calculate profit/loss
      const initialAmount = parseFloat(investment.amount);
      const finalAmount = parseFloat(finalValue);
      const profitAmount = finalAmount - initialAmount;
      const profitPercentage = (profitAmount / initialAmount) * 100;
      
      // Create transaction record
      await storage.createTransaction({
        userId: user.id,
        type: 'quant_ai_complete',
        amount: finalValue,
        balanceBefore: user.balance,
        balanceAfter: newBalance,
        description: `Completed ${investment.duration}-day Quant AI investment with ${profitAmount >= 0 ? 'profit' : 'loss'}`,
        metadata: {
          investmentId,
          initialAmount: investment.amount,
          finalAmount: finalValue,
          profitAmount: profitAmount.toString(),
          profitPercentage: profitPercentage.toString(),
          processedBy: adminUser.id
        }
      });
      
      // Create notification for user
      await storage.createNotification({
        userId: user.id,
        title: "Quant AI Investment Completed",
        message: `Your ${investment.duration}-day Quant AI investment has completed. ${
          profitAmount >= 0 
            ? `You earned a profit of $${profitAmount.toFixed(2)} (${profitPercentage.toFixed(2)}%).` 
            : `The investment resulted in a loss of $${Math.abs(profitAmount).toFixed(2)} (${Math.abs(profitPercentage).toFixed(2)}%).`
        }`,
        type: profitAmount >= 0 ? "success" : "warning",
        isRead: false
      });
      
      // Send websocket message if supported
      // WebSocket notification is now handled through the ws.ts module
      
      return res.json({
        message: "Investment completed successfully",
        investment: {
          id: completedInvestment.id,
          isCompleted: completedInvestment.isCompleted,
          finalValue
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Transaction History Routes
  app.get("/api/transactions", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const transactions = await storage.getTransactionsByUserId(user.id, limit);
      
      return res.json({
        transactions: transactions.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          createdAt: tx.createdAt,
          metadata: tx.metadata
        }))
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Notification Routes are now handled in the modern section below
  
  app.put("/api/notifications/:id/read", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const notificationId = parseInt(req.params.id);
      
      await storage.markNotificationAsRead(notificationId);
      
      return res.json({ message: "Notification marked as read" });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin Routes
  
  // Admin Dashboard Summary
  app.get("/api/admin/dashboard/summary", authenticate, adminOnly, async (req, res, next) => {
    try {
      // Get counts for pending items
      const pendingDeposits = await storage.getPendingDeposits();
      const pendingWithdrawals = await storage.getPendingWithdrawals();
      const pendingKyc = await storage.getPendingKycDocuments();
      
      // Get active flash trades
      const activeFlashTrades = await storage.getActiveFlashTrades();
      
      // Get all users count
      const allUsers = await storage.getAllUsers(1000);
      
      return res.json({
        pendingDepositsCount: pendingDeposits.length,
        pendingWithdrawalsCount: pendingWithdrawals.length,
        pendingKycCount: pendingKyc.length,
        activeFlashTradesCount: activeFlashTrades.length,
        totalUsersCount: allUsers.length
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin User Management
  
  // Create new user (admin only)
  app.post("/api/admin/users", authenticate, adminOnly, async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      
      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Only superadmin can create admin users
      if (role === 'admin' || role === 'superadmin') {
        if (req.user.role !== 'superadmin') {
          return res.status(403).json({ message: "Only superadmins can create admin accounts" });
        }
      }
      
      // Hash password
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      // Create user with UUID
      const newUser = await storage.upsertUser({
        id: randomUUID(),
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: role || 'user'
      });
      
      if (!newUser) {
        return res.status(500).json({ message: "Failed to create user" });
      }
      
      // Log the creation
      console.log(`Admin ${req.user.id} created new user ${newUser.id} with role ${newUser.role}`);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      
      return res.json({
        message: "User created successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/admin/users", authenticate, adminOnly, async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const users = await storage.getAllUsers(limit, offset);
      
      return res.json({
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          username: user.email, // Use email as username
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          balance: user.balance,
          vipLevel: user.vipLevel,
          kycStatus: user.kycStatus,
          isActive: user.isActive,
          flashTradeWinRate: user.flashTradeWinRate,
          flashTradeOutcome: user.flashTradeOutcome,
          allowedTradingTypes: user.allowedTradingTypes,
          lastLoginIp: user.lastLoginIp,
          lastLoginTime: user.lastLoginTime,
          assignedAdminId: user.assignedAdminId,
          adminNotes: user.adminNotes,
          createdAt: user.createdAt
        }))
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/admin/users/:id", authenticate, adminOnly, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          balance: user.balance,
          vipLevel: user.vipLevel,
          kycStatus: user.kycStatus,
          isActive: user.isActive,
          flashTradeWinRate: user.flashTradeWinRate,
          allowedTradingTypes: user.allowedTradingTypes,
          lastLoginIp: user.lastLoginIp,
          lastLoginTime: user.lastLoginTime,
          assignedAdminId: user.assignedAdminId,
          adminNotes: user.adminNotes,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/admin/users/:id", authenticate, adminOnly, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const adminUser = (req as any).user;
      
      // For security, don't allow changing role or password through this endpoint
      const { 
        firstName, lastName, vipLevel, isActive, flashTradeWinRate, 
        allowedTradingTypes, assignedAdminId, adminNotes 
      } = req.body;
      
      // Update user
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        vipLevel: vipLevel as any,
        isActive,
        flashTradeWinRate,
        allowedTradingTypes,
        assignedAdminId,
        adminNotes
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({
        message: "User updated successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          balance: updatedUser.balance,
          vipLevel: updatedUser.vipLevel,
          kycStatus: updatedUser.kycStatus,
          isActive: updatedUser.isActive,
          flashTradeWinRate: updatedUser.flashTradeWinRate,
          allowedTradingTypes: updatedUser.allowedTradingTypes,
          assignedAdminId: updatedUser.assignedAdminId,
          adminNotes: updatedUser.adminNotes
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // User Ban/Unban
  // Delete user endpoint
  app.delete("/api/admin/users/:id", authenticate, adminOnly, async (req, res, next) => {
    try {
      const userId = req.params.id;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only superadmin can delete admin users
      if ((user.role === 'admin' || user.role === 'superadmin') && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: "Only superadmins can delete administrator accounts" });
      }
      
      // Delete user
      await storage.deleteUser(userId);
      
      // Log the deletion
      console.log(`Admin ${req.user.id} deleted user ${userId}`);
      
      return res.json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/users/:id/ban", authenticate, adminOnly, async (req, res, next) => {
    try {
      const userId = req.params.id;
      const adminUser = req.user;
      
      // Get current user status
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if admin is trying to ban another admin or superadmin
      if ((user.role === 'admin' || user.role === 'superadmin') && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: "You don't have permission to ban administrators" });
      }
      
      // Toggle active status
      const newStatus = !user.isActive;
      const updatedUser = await storage.toggleUserActiveStatus(userId, newStatus);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user status" });
      }
      
      // Create admin log
      console.log(`Admin ${adminUser.id} (${adminUser.email}) ${newStatus ? 'unbanned' : 'banned'} user ${userId}`);
      
      // Create notification for user
      await storage.createNotification({
        userId: userId,
        title: newStatus ? 'Account Activated' : 'Account Suspended',
        message: newStatus 
          ? 'Your account has been reactivated by an administrator.'
          : 'Your account has been suspended. Please contact support for assistance.',
        type: 'account',
        isRead: false
      });
      
      return res.json({
        message: newStatus ? "User unbanned successfully" : "User banned successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          isActive: updatedUser.isActive
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Promote User to Admin
  app.post("/api/admin/users/:id/promote", authenticate, superAdminOnly, async (req, res, next) => {
    try {
      const userId = req.params.id;
      const adminUser = req.user;
      
      // Get current user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is already an admin
      if (user.role === 'admin' || user.role === 'superadmin') {
        return res.status(400).json({ message: "User is already an administrator" });
      }
      
      // Promote to admin
      const updatedUser = await storage.promoteUserToAdmin(userId);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to promote user" });
      }
      
      // Create admin log
      console.log(`Superadmin ${adminUser.id} (${adminUser.email}) promoted user ${userId} to admin role`);
      
      // Create notification for user
      await storage.createNotification({
        userId: userId,
        title: 'Administrator Privileges Granted',
        message: 'You have been granted administrator privileges on the platform.',
        type: 'account',
        isRead: false
      });
      
      return res.json({
        message: "User promoted to admin successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin Balance Adjustment
  app.post("/api/admin/users/:id/adjust-balance", authenticate, adminOnly, async (req, res, next) => {
    try {
      const userId = req.params.id;
      const adminUser = req.user;
      const { type, amount, reason } = req.body;
      
      // Validate input
      if (!amount || !reason || !type) {
        return res.status(400).json({ message: "Amount, type, and reason are required" });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Calculate new balance based on adjustment type
      const currentBalance = parseFloat(user.balance);
      const adjustmentAmount = parseFloat(amount);
      
      // Make sure type is treated as a string and compared exactly
      console.log(`Adjusting balance: type=${type}, currentBalance=${currentBalance}, adjustmentAmount=${adjustmentAmount}`);
      
      // If type is decrease, subtract the amount; otherwise add it
      let newBalance;
      if (type === 'decrease') {
        newBalance = (currentBalance - adjustmentAmount).toString();
        console.log(`Decreasing balance: ${currentBalance} - ${adjustmentAmount} = ${newBalance}`);
      } else {
        newBalance = (currentBalance + adjustmentAmount).toString();
        console.log(`Increasing balance: ${currentBalance} + ${adjustmentAmount} = ${newBalance}`);
      }
      
      // Update user balance
      const updatedUser = await storage.updateUserBalance(userId, newBalance);
      
      // Create transaction record
      await storage.createTransaction({
        userId: userId,
        type: 'admin_adjustment',
        amount: type === 'decrease' ? `-${amount.toString()}` : amount.toString(),
        balanceBefore: user.balance,
        balanceAfter: newBalance,
        description: `Admin balance ${type}: ${reason}`,
        metadata: {
          adminId: adminUser.id,
          reason,
          adjustmentType: type
        }
      });
      
      // Create notification for user
      await storage.createNotification({
        userId: userId,
        title: "Balance Adjustment",
        message: `Your balance has been ${type === 'decrease' ? 'decreased by' : 'increased by'} ${amount} USDT. Reason: ${reason}`,
        type: type === 'decrease' ? "info" : "success",
        isRead: false
      });
      
      return res.json({
        message: "Balance adjusted successfully",
        user: {
          id: updatedUser?.id,
          email: updatedUser?.email,
          previousBalance: user.balance,
          newBalance: updatedUser?.balance,
          adjustment: amount
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin Flash Trade Outcome Settings
  app.post("/api/admin/users/:id/flash-trade-outcome", authenticate, adminOnly, async (req, res) => {
    try {
      const userId = req.params.id;
      const adminUser = req.user;
      const { outcome, winRate } = req.body;
      
      console.log(`플래시 트레이드 결과 설정 요청: userId=${userId}, outcome=${outcome}, winRate=${winRate}`);
      
      // Validate input
      if (!outcome || !['default', 'win', 'loss'].includes(outcome)) {
        console.log('유효하지 않은 결과 유형:', outcome);
        return res.status(400).json({ message: "Valid outcome (default, win, loss) is required" });
      }
      
      // If outcome is default, winRate is required
      if (outcome === 'default' && (winRate === undefined || winRate === null)) {
        console.log('기본값 설정 시 승률이 필요함');
        return res.status(400).json({ message: "Win rate is required for default outcome" });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        console.log('사용자를 찾을 수 없음:', userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`사용자 ${userId}의 플래시 트레이드 결과를 ${outcome}로 업데이트 중`);
      
      // Update user's flash trade outcome settings
      const updatedUser = await storage.updateUserFlashTradeOutcome(
        userId, 
        outcome,
        outcome === 'default' ? parseFloat(winRate) : undefined
      );
      
      if (!updatedUser) {
        console.log('사용자 설정 업데이트 실패');
        return res.status(500).json({ message: "Failed to update user flash trade settings" });
      }
      
      // Log admin action
      try {
        await storage.logAdminAction(adminUser.id, `Updated flash trade outcome settings for user ${userId} to ${outcome}${outcome === 'default' ? ` with win rate ${winRate}%` : ''}`, req);
      } catch (logError) {
        console.error('관리자 액션 로깅 실패:', logError);
        // 로깅 실패해도 응답은 성공으로 처리
      }
      
      console.log('플래시 트레이드 설정 업데이트 성공:', updatedUser.id);
      
      // 명시적으로 Content-Type 헤더 설정
      res.setHeader('Content-Type', 'application/json');
      
      // JSON 응답 반환 (출력 간소화)
      return res.status(200).json({
        message: "Flash trade outcome settings updated successfully",
        success: true
      });
    } catch (error) {
      console.error('플래시 트레이드 결과 설정 오류:', error);
      
      // 명시적으로 Content-Type 헤더 설정
      res.setHeader('Content-Type', 'application/json');
      
      return res.status(500).json({ 
        message: "Internal server error updating flash trade settings",
        error: error.message
      });
    }
  });
  
  // Admin Deposit Management
  app.get("/api/admin/deposits", authenticate, adminOnly, async (req, res, next) => {
    try {
      const pendingDeposits = await storage.getPendingDeposits();
      
      // Get user details for each deposit
      const depositsWithUser = await Promise.all(pendingDeposits.map(async (deposit) => {
        const user = await storage.getUser(deposit.userId);
        return {
          id: deposit.id,
          userId: deposit.userId,
          username: user?.username,
          amount: deposit.amount,
          coin: deposit.coin,
          screenshotPath: deposit.screenshotPath,
          status: deposit.status,
          createdAt: deposit.createdAt
        };
      }));
      
      return res.json({
        deposits: depositsWithUser
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/admin/deposits/:id/screenshot", authenticate, adminOnly, async (req, res, next) => {
    try {
      const depositId = parseInt(req.params.id);
      
      const deposit = await storage.getDepositById(depositId);
      
      if (!deposit) {
        return res.status(404).json({ message: "Deposit not found" });
      }
      
      const screenshotPath = deposit.screenshotPath;
      
      // Check if file exists
      if (!fs.existsSync(screenshotPath)) {
        return res.status(404).json({ message: "Screenshot not found" });
      }
      
      // Return file
      return res.sendFile(screenshotPath);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/deposits/:id/approve", authenticate, adminOnly, async (req, res, next) => {
    try {
      const depositId = parseInt(req.params.id);
      const adminUser = (req as any).user;
      
      console.log(`Admin ${adminUser.id} (${adminUser.email}) approving deposit #${depositId}`);
      
      const deposit = await storage.getDepositById(depositId);
      
      if (!deposit) {
        console.error(`Deposit #${depositId} not found`);
        return res.status(404).json({ message: "Deposit not found" });
      }
      
      if (deposit.status !== 'pending') {
        console.error(`Deposit #${depositId} is in ${deposit.status} state, not pending`);
        return res.status(400).json({ message: "Deposit is not in pending state" });
      }
      
      console.log(`Processing deposit #${depositId} for user ID ${deposit.userId}, amount: ${deposit.amount} ${deposit.coin}`);
      
      // Get user first to get current balance
      const user = await storage.getUser(deposit.userId);
      
      if (!user) {
        console.error(`User ID ${deposit.userId} not found when approving deposit #${depositId}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`User found: ${user.email}, current balance: ${user.balance}`);
      
      // Calculate new balance - ensure proper decimal handling
      const currentBalance = parseFloat(user.balance);
      const depositAmount = parseFloat(deposit.amount);
      const newBalance = (currentBalance + depositAmount).toFixed(8);
      
      console.log(`Calculated new balance: ${currentBalance} + ${depositAmount} = ${newBalance}`);
      
      // Update user balance
      const updatedUser = await storage.updateUserBalance(user.id, newBalance);
      
      if (!updatedUser) {
        console.error(`Failed to update balance for user ID ${user.id}`);
        return res.status(500).json({ message: "Failed to update user balance" });
      }
      
      console.log(`User balance updated. New balance: ${updatedUser.balance}`);
      
      // Update deposit status - do this AFTER balance update
      const updatedDeposit = await storage.updateDepositStatus(
        depositId, 
        'approved', 
        undefined, 
        adminUser.id
      );
      
      // Create transaction record
      await storage.createTransaction({
        userId: user.id,
        type: 'deposit',
        amount: deposit.amount,
        balanceBefore: user.balance,
        balanceAfter: updatedUser.balance,
        description: `Deposit of ${deposit.amount} ${deposit.coin} approved`,
        metadata: {
          depositId,
          adminId: adminUser.id,
          adminEmail: adminUser.email
        }
      });
      
      console.log(`Transaction record created for deposit #${depositId}`);
      
      // Create notification for user
      await storage.createNotification({
        userId: user.id,
        title: "Deposit Approved",
        message: `Your deposit of ${deposit.amount} ${deposit.coin} has been approved.`,
        type: "success",
        isRead: false
      });
      
      console.log(`Notification created for user ID ${user.id}`);
      
      // Check for first deposit bonus eligibility
      try {
        console.log(`Checking first deposit bonus eligibility for user ID ${user.id}, amount: ${depositAmount}`);
        const isFirstDepositBonus = await BonusManager.processFirstDepositBonus(user.id, depositAmount);
        
        if (isFirstDepositBonus) {
          console.log(`First deposit bonus processed for user ID ${user.id}`);
          // Create additional notification for the bonus
          await storage.createNotification({
            userId: user.id,
            title: "First Deposit Bonus",
            message: "Congratulations! You've received a first deposit bonus. Check your account for details.",
            type: "bonus",
            isRead: false
          });
          
          console.log(`First deposit bonus notification created for user ID ${user.id}`);
        } else {
          console.log(`User ID ${user.id} not eligible for first deposit bonus`);
        }
      } catch (error) {
        // Log but don't fail the deposit approval if bonus processing fails
        console.error(`Error processing first deposit bonus for user ID ${user.id}:`, error);
      }
      
      // Broadcast to websocket
      broadcastToAuthenticated({
        type: 'deposit-status',
        action: 'approved',
        data: {
          depositId,
          userId: user.id,
          username: user.username,
          amount: deposit.amount,
          coin: deposit.coin,
          timestamp: new Date()
        }
      });
      
      return res.json({
        message: "Deposit approved successfully",
        deposit: {
          id: updatedDeposit?.id,
          status: updatedDeposit?.status,
          updatedAt: updatedDeposit?.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/deposits/:id/reject", authenticate, adminOnly, async (req, res, next) => {
    try {
      const depositId = parseInt(req.params.id);
      const adminUser = (req as any).user;
      const { rejectionReason } = req.body;
      
      if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      const deposit = await storage.getDepositById(depositId);
      
      if (!deposit) {
        return res.status(404).json({ message: "Deposit not found" });
      }
      
      if (deposit.status !== 'pending') {
        return res.status(400).json({ message: "Deposit is not in pending state" });
      }
      
      // Update deposit status
      const updatedDeposit = await storage.updateDepositStatus(
        depositId, 
        'rejected', 
        rejectionReason, 
        adminUser.id
      );
      
      // Create notification for user
      await storage.createNotification({
        userId: deposit.userId,
        title: "Deposit Rejected",
        message: `Your deposit of ${deposit.amount} ${deposit.coin} has been rejected. Reason: ${rejectionReason}`,
        type: "error",
        isRead: false
      });
      
      // Broadcast to websocket
      broadcastToAuthenticated({
        type: 'deposit-status',
        action: 'rejected',
        data: {
          depositId,
          userId: deposit.userId,
          amount: deposit.amount,
          coin: deposit.coin,
          reason: rejectionReason,
          timestamp: new Date()
        }
      });
      
      return res.json({
        message: "Deposit rejected successfully",
        deposit: {
          id: updatedDeposit?.id,
          status: updatedDeposit?.status,
          rejectionReason: updatedDeposit?.rejectionReason,
          updatedAt: updatedDeposit?.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin Withdrawal Management
  app.get("/api/admin/withdrawals", authenticate, adminOnly, async (req, res, next) => {
    try {
      const pendingWithdrawals = await storage.getPendingWithdrawals();
      
      // Get user details for each withdrawal
      const withdrawalsWithUser = await Promise.all(pendingWithdrawals.map(async (withdrawal) => {
        const user = await storage.getUser(withdrawal.userId);
        return {
          id: withdrawal.id,
          userId: withdrawal.userId,
          username: user?.username,
          amount: withdrawal.amount,
          coin: withdrawal.coin,
          destinationAddress: withdrawal.destinationAddress,
          status: withdrawal.status,
          createdAt: withdrawal.createdAt
        };
      }));
      
      return res.json({
        withdrawals: withdrawalsWithUser
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/withdrawals/:id/approve", authenticate, adminOnly, async (req, res, next) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const adminUser = (req as any).user;
      
      console.log(`Admin ${adminUser.id} (${adminUser.email}) approving withdrawal #${withdrawalId}`);
      
      const withdrawal = await storage.getWithdrawalById(withdrawalId);
      
      if (!withdrawal) {
        console.error(`Withdrawal #${withdrawalId} not found`);
        return res.status(404).json({ message: "Withdrawal not found" });
      }
      
      if (withdrawal.status !== 'pending') {
        console.error(`Withdrawal #${withdrawalId} is in ${withdrawal.status} state, not pending`);
        return res.status(400).json({ message: "Withdrawal is not in pending state" });
      }
      
      console.log(`Processing withdrawal #${withdrawalId} for user ID ${withdrawal.userId}, amount: ${withdrawal.amount} ${withdrawal.coin}`);
      
      // Get user
      const user = await storage.getUser(withdrawal.userId);
      
      if (!user) {
        console.error(`User ID ${withdrawal.userId} not found when approving withdrawal #${withdrawalId}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`User found: ${user.email}, current balance: ${user.balance}`);
      
      // Now we deduct the balance when withdrawal is approved
      const currentBalance = parseFloat(user.balance);
      const withdrawalAmount = parseFloat(withdrawal.amount);
      
      // Calculate new balance
      const newBalance = (currentBalance - withdrawalAmount).toFixed(8);
      console.log(`Deducting withdrawal amount now: ${currentBalance} - ${withdrawalAmount} = ${newBalance}`);
      
      // Update user balance
      const updatedUser = await storage.updateUserBalance(user.id, newBalance);
      
      if (!updatedUser) {
        console.error(`Failed to update balance for user ID ${user.id}`);
        return res.status(500).json({ message: "Failed to update user balance" });
      }
      
      console.log(`User balance updated. New balance: ${updatedUser.balance}`);
      
      // Update withdrawal status - AFTER balance update
      const updatedWithdrawal = await storage.updateWithdrawalStatus(
        withdrawalId, 
        'approved', 
        undefined, 
        adminUser.id
      );
      
      console.log(`Withdrawal status updated to 'approved'`);
      
      // Create transaction record - balance now deducted at approval time
      await storage.createTransaction({
        userId: user.id,
        type: 'withdrawal_approved',
        amount: withdrawal.amount,
        balanceBefore: currentBalance.toString(),
        balanceAfter: updatedUser.balance, // New balance after deduction
        description: `Withdrawal of ${withdrawal.amount} ${withdrawal.coin} approved and sent`,
        metadata: {
          withdrawalId,
          adminId: adminUser.id,
          adminEmail: adminUser.email,
          destinationAddress: withdrawal.destinationAddress
        }
      });
      
      console.log(`Transaction record created for withdrawal #${withdrawalId}`);
      
      // Create notification for user
      await storage.createNotification({
        userId: user.id,
        title: "Withdrawal Approved and Processed",
        message: `Your withdrawal of ${withdrawal.amount} ${withdrawal.coin} has been approved and sent to your wallet address.`,
        type: "success",
        isRead: false
      });
      
      console.log(`Notification created for user ID ${user.id}`);
      
      // Broadcast to websocket
      broadcastToAuthenticated({
        type: 'withdrawal-status',
        action: 'approved',
        data: {
          withdrawalId,
          userId: user.id,
          email: user.email,
          amount: withdrawal.amount,
          coin: withdrawal.coin,
          timestamp: new Date()
        }
      });
      
      console.log(`WebSocket notification broadcast for withdrawal #${withdrawalId}`);
      
      return res.json({
        message: "Withdrawal approved successfully",
        withdrawal: {
          id: updatedWithdrawal?.id,
          status: updatedWithdrawal?.status,
          updatedAt: updatedWithdrawal?.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/withdrawals/:id/reject", authenticate, adminOnly, async (req, res, next) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const adminUser = (req as any).user;
      const { rejectionReason } = req.body;
      
      console.log(`Admin ${adminUser.id} (${adminUser.email}) rejecting withdrawal #${withdrawalId}`);
      
      if (!rejectionReason) {
        console.error(`Missing rejection reason for withdrawal #${withdrawalId}`);
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      const withdrawal = await storage.getWithdrawalById(withdrawalId);
      
      if (!withdrawal) {
        console.error(`Withdrawal #${withdrawalId} not found`);
        return res.status(404).json({ message: "Withdrawal not found" });
      }
      
      if (withdrawal.status !== 'pending') {
        console.error(`Withdrawal #${withdrawalId} is in ${withdrawal.status} state, not pending`);
        return res.status(400).json({ message: "Withdrawal is not in pending state" });
      }
      
      console.log(`Processing rejection for withdrawal #${withdrawalId}, user ID: ${withdrawal.userId}, amount: ${withdrawal.amount} ${withdrawal.coin}`);
      
      // Get user first to get current balance
      const user = await storage.getUser(withdrawal.userId);
      
      if (!user) {
        console.error(`User ID ${withdrawal.userId} not found when rejecting withdrawal #${withdrawalId}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`User found: ${user.email}, current balance: ${user.balance}`);
      
      // Calculate new balance - refund the withdrawal amount
      const currentBalance = parseFloat(user.balance);
      const withdrawalAmount = parseFloat(withdrawal.amount);
      const newBalance = (currentBalance + withdrawalAmount).toFixed(8);
      
      console.log(`Calculated new balance for refund: ${currentBalance} + ${withdrawalAmount} = ${newBalance}`);
      
      // Update user balance
      const updatedUser = await storage.updateUserBalance(user.id, newBalance);
      
      if (!updatedUser) {
        console.error(`Failed to update balance for user ID ${user.id}`);
        return res.status(500).json({ message: "Failed to update user balance" });
      }
      
      console.log(`User balance updated. New balance: ${updatedUser.balance}`);
      
      // Update withdrawal status - do this AFTER balance update
      const updatedWithdrawal = await storage.updateWithdrawalStatus(
        withdrawalId, 
        'rejected', 
        rejectionReason, 
        adminUser.id
      );
      
      console.log(`Withdrawal status updated to 'rejected'`);
      
      // Create transaction record for refund
      await storage.createTransaction({
        userId: user.id,
        type: 'withdrawal_refund',
        amount: withdrawal.amount,
        balanceBefore: user.balance,
        balanceAfter: updatedUser.balance,
        description: `Withdrawal of ${withdrawal.amount} ${withdrawal.coin} rejected, amount refunded`,
        metadata: {
          withdrawalId,
          adminId: adminUser.id,
          adminEmail: adminUser.email,
          rejectionReason
        }
      });
      
      console.log(`Transaction record created for withdrawal rejection #${withdrawalId}`);
      
      // Create notification for user
      await storage.createNotification({
        userId: user.id,
        title: "Withdrawal Rejected",
        message: `Your withdrawal of ${withdrawal.amount} ${withdrawal.coin} has been rejected. Reason: ${rejectionReason}. The amount has been refunded to your account.`,
        type: "error",
        isRead: false
      });
      
      console.log(`Notification created for user ID ${user.id}`);
      
      // Broadcast to websocket
      broadcastToAuthenticated({
        type: 'withdrawal-status',
        action: 'rejected',
        data: {
          withdrawalId,
          userId: user.id,
          email: user.email,
          amount: withdrawal.amount,
          coin: withdrawal.coin,
          reason: rejectionReason,
          timestamp: new Date()
        }
      });
      
      console.log(`WebSocket notification broadcast for withdrawal rejection #${withdrawalId}`);
      
      return res.json({
        message: "Withdrawal rejected successfully",
        withdrawal: {
          id: updatedWithdrawal?.id,
          status: updatedWithdrawal?.status,
          rejectionReason: updatedWithdrawal?.rejectionReason,
          updatedAt: updatedWithdrawal?.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin KYC Management
  app.get("/api/admin/kyc", authenticate, adminOnly, async (req, res, next) => {
    try {
      const allKyc = await storage.getAllKycDocuments();
      
      // Get user details for each KYC document
      const kycWithUser = await Promise.all(allKyc.map(async (kyc) => {
        const user = await storage.getUser(kyc.userId);
        return {
          id: kyc.id,
          userId: kyc.userId,
          username: user?.username,
          idFrontPath: kyc.idFrontPath,
          idBackPath: kyc.idBackPath,
          addressProofPath: kyc.addressProofPath,
          status: kyc.status,
          createdAt: kyc.createdAt
        };
      }));
      
      return res.json({
        kycDocuments: kycWithUser
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Helper to serve KYC documents
  const serveDocument = (req: Request, res: Response, next: NextFunction, documentPath: string) => {
    try {
      // Check if file exists
      if (!fs.existsSync(documentPath)) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Return file
      return res.sendFile(documentPath);
    } catch (error) {
      next(error);
    }
  };
  
  app.get("/api/admin/kyc/:id/id-front", authenticate, adminOnly, async (req, res, next) => {
    try {
      const kycId = parseInt(req.params.id);
      
      const kycList = await storage.getPendingKycDocuments();
      const kyc = kycList.find(k => k.id === kycId);
      
      if (!kyc) {
        return res.status(404).json({ message: "KYC document not found" });
      }
      
      return serveDocument(req, res, next, kyc.idFrontPath);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/admin/kyc/:id/id-back", authenticate, adminOnly, async (req, res, next) => {
    try {
      const kycId = parseInt(req.params.id);
      
      const kycList = await storage.getPendingKycDocuments();
      const kyc = kycList.find(k => k.id === kycId);
      
      if (!kyc) {
        return res.status(404).json({ message: "KYC document not found" });
      }
      
      return serveDocument(req, res, next, kyc.idBackPath);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/admin/kyc/:id/address-proof", authenticate, adminOnly, async (req, res, next) => {
    try {
      const kycId = parseInt(req.params.id);
      
      const kycList = await storage.getPendingKycDocuments();
      const kyc = kycList.find(k => k.id === kycId);
      
      if (!kyc) {
        return res.status(404).json({ message: "KYC document not found" });
      }
      
      return serveDocument(req, res, next, kyc.addressProofPath);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/kyc/:id/approve", authenticate, adminOnly, async (req, res, next) => {
    try {
      const kycId = parseInt(req.params.id);
      const adminUser = (req as any).user;
      
      const kycList = await storage.getPendingKycDocuments();
      const kyc = kycList.find(k => k.id === kycId);
      
      if (!kyc) {
        return res.status(404).json({ message: "KYC document not found" });
      }
      
      if (kyc.status !== 'pending') {
        return res.status(400).json({ message: "KYC document is not in pending state" });
      }
      
      // Update KYC status
      const updatedKyc = await storage.updateKycStatus(
        kycId, 
        'approved', 
        undefined, 
        adminUser.id
      );
      
      // Get user
      const user = await storage.getUser(kyc.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user's KYC status
      await storage.updateUser(user.id, {
        kycStatus: 'approved'
      });
      
      // Create notification for user
      await storage.createNotification({
        userId: user.id,
        title: "KYC Approved",
        message: "Your KYC verification has been approved. You now have full access to all platform features.",
        type: "success",
        isRead: false
      });
      
      // Broadcast to websocket
      broadcastToAuthenticated({
        type: 'kyc-status',
        action: 'approved',
        data: {
          kycId,
          userId: user.id,
          username: user.username,
          timestamp: new Date()
        }
      });
      
      return res.json({
        message: "KYC approved successfully",
        kyc: {
          id: updatedKyc?.id,
          status: updatedKyc?.status,
          updatedAt: updatedKyc?.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/kyc/:id/reject", authenticate, adminOnly, async (req, res, next) => {
    try {
      const kycId = parseInt(req.params.id);
      const adminUser = (req as any).user;
      const { rejectionReason } = req.body;
      
      if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      const kycList = await storage.getPendingKycDocuments();
      const kyc = kycList.find(k => k.id === kycId);
      
      if (!kyc) {
        return res.status(404).json({ message: "KYC document not found" });
      }
      
      if (kyc.status !== 'pending') {
        return res.status(400).json({ message: "KYC document is not in pending state" });
      }
      
      // Update KYC status
      const updatedKyc = await storage.updateKycStatus(
        kycId, 
        'rejected', 
        rejectionReason, 
        adminUser.id
      );
      
      // Get user
      const user = await storage.getUser(kyc.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user's KYC status
      await storage.updateUser(user.id, {
        kycStatus: 'rejected'
      });
      
      // Create notification for user
      await storage.createNotification({
        userId: user.id,
        title: "KYC Rejected",
        message: `Your KYC verification has been rejected. Reason: ${rejectionReason}. Please resubmit with the correct documents.`,
        type: "error",
        isRead: false
      });
      
      // Broadcast to websocket
      broadcastToAuthenticated({
        type: 'kyc-status',
        action: 'rejected',
        data: {
          kycId,
          userId: user.id,
          username: user.username,
          reason: rejectionReason,
          timestamp: new Date()
        }
      });
      
      return res.json({
        message: "KYC rejected successfully",
        kyc: {
          id: updatedKyc?.id,
          status: updatedKyc?.status,
          rejectionReason: updatedKyc?.rejectionReason,
          updatedAt: updatedKyc?.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin Flash Trade Management
  app.get("/api/admin/flash-trades", authenticate, adminOnly, async (req, res, next) => {
    try {
      const activeFlashTrades = await storage.getActiveFlashTrades();
      
      // Get user details for each flash trade
      const tradesWithUser = await Promise.all(activeFlashTrades.map(async (trade) => {
        const user = await storage.getUser(trade.userId);
        return {
          id: trade.id,
          userId: trade.userId,
          username: user?.username,
          amount: trade.amount,
          direction: trade.direction,
          duration: trade.duration,
          returnRate: trade.returnRate,
          entryPrice: trade.entryPrice,
          potentialProfit: trade.potentialProfit,
          startTime: trade.startTime,
          // Calculate remaining time
          remainingTime: Math.max(0, 
            trade.duration - Math.floor((Date.now() - (typeof trade.startTime === 'string' 
              ? new Date(trade.startTime).getTime() 
              : trade.startTime.getTime())) / 1000)
          ),
          // Get user's configured win rate if available
          configuredWinRate: user?.flashTradeWinRate
        };
      }));
      
      return res.json({
        flashTrades: tradesWithUser
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin Active Flash Trades endpoint
  app.get("/api/admin/flash-trades/active", authenticate, adminOnly, async (req, res, next) => {
    try {
      const activeFlashTrades = await storage.getActiveFlashTrades();
      
      // Get user details for each flash trade
      const tradesWithUser = await Promise.all(activeFlashTrades.map(async (trade) => {
        const user = await storage.getUser(trade.userId);
        return {
          id: trade.id,
          userId: trade.userId,
          username: user?.username,
          amount: trade.amount,
          direction: trade.direction,
          duration: trade.duration,
          returnRate: trade.returnRate,
          entryPrice: trade.entryPrice,
          potentialProfit: trade.potentialProfit,
          startTime: trade.startTime,
          // Calculate remaining time
          remainingTime: Math.max(0, 
            trade.duration - Math.floor((Date.now() - (typeof trade.startTime === 'string' 
              ? new Date(trade.startTime).getTime() 
              : trade.startTime.getTime())) / 1000)
          ),
          // Get user's configured win rate if available
          configuredWinRate: user?.flashTradeWinRate,
          // Add outcome override if exists
          outcomeOverride: user?.flashTradeOutcome
        };
      }));
      
      return res.json({
        trades: tradesWithUser
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Endpoint to force a trade outcome from the admin panel
  app.put("/api/admin/flash-trades/:id/force-outcome", authenticate, adminOnly, async (req, res, next) => {
    try {
      const tradeId = parseInt(req.params.id);
      const adminUser = (req as any).user;
      const { outcome } = req.body;
      
      // Normalize outcome to either 'win' or 'loss'
      const normalizedOutcome = outcome === 'lose' ? 'loss' : outcome;
      
      if (!['win', 'loss'].includes(normalizedOutcome)) {
        return res.status(400).json({ message: "Outcome must be either 'win' or 'loss'" });
      }
      
      // Get the trade first
      const trade = await storage.getFlashTradeById(tradeId);
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      if (trade.status !== 'active') {
        return res.status(400).json({ message: "Can only force outcome for active trades" });
      }
      
      // Check if trade is close to completion (10 seconds remaining)
      const startTimeDate = typeof trade.startTime === 'string' 
        ? new Date(trade.startTime) 
        : trade.startTime;
        
      const durationMs = parseInt(trade.duration.toString()) * 1000;
      const endTime = new Date(startTimeDate.getTime() + durationMs);
      const remainingMs = endTime.getTime() - Date.now();
      
      // Allow forcing outcome only if there's at least 10 seconds remaining
      if (remainingMs < 10000) {
        return res.status(400).json({ 
          message: "Cannot change outcome when less than 10 seconds remaining",
          remainingMs
        });
      }
      
      // Log the action
      console.log(`[ADMIN ACTION] Admin ${adminUser.id} (${adminUser.email}) forced outcome for trade ${tradeId} to ${normalizedOutcome}`);
      
      // Send message via WebSocket to update the trade outcome
      const wss = getWebSocketServer();
      
      // Create WebSocket message for the outcome
      const exitPrice = trade.entryPrice; // Use entry price as exit price
      const profit = normalizedOutcome === 'win' 
        ? calculateProfit(trade.amount, trade.returnRate)
        : '0';
        
      // Send WebSocket message to all clients including admins
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'flash-trade',
            action: 'result',
            data: {
              tradeId,
              result: normalizedOutcome,
              exitPrice,
              profit
            }
          }));
        }
      });
      
      // Update trade in database with forced outcome
      await storage.updateFlashTrade(tradeId, {
        forcedOutcome: normalizedOutcome,
        forcedBy: adminUser.id,
        forcedAt: new Date()
      });
      
      return res.status(200).json({ 
        message: `Trade outcome forced to ${normalizedOutcome}`,
        trade: {
          id: tradeId,
          outcome: normalizedOutcome
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/flash-trades/:id/result", authenticate, adminOnly, async (req, res, next) => {
    try {
      const tradeId = parseInt(req.params.id);
      const adminUser = (req as any).user;
      const { result, exitPrice } = req.body;
      
      // 'lose'를 'loss'로 통일하기
      const normalizedResult = result === 'lose' ? 'loss' : result;
      
      if (!['win', 'loss'].includes(normalizedResult)) {
        return res.status(400).json({ message: "Result must be either 'win' or 'loss'" });
      }
      
      if (!exitPrice) {
        return res.status(400).json({ message: "Exit price is required" });
      }
      
      const flashTrades = await storage.getActiveFlashTrades();
      const trade = flashTrades.find(t => t.id === tradeId);
      
      if (!trade) {
        return res.status(404).json({ message: "Flash trade not found" });
      }
      
      // Update trade status
      const updatedTrade = await storage.updateFlashTradeStatus(
        tradeId, 
        normalizedResult, 
        exitPrice
      );
      
      // Get user
      const user = await storage.getUser(trade.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Handle trade result
      let newBalance = parseFloat(user.balance);
      let profitLoss = 0;
      
      if (normalizedResult === 'win') {
        // If win, add original amount + profit to user's balance
        profitLoss = parseFloat(trade.potentialProfit);
        newBalance += parseFloat(trade.amount) + profitLoss;
      }
      
      // Update user balance
      await storage.updateUserBalance(user.id, newBalance.toString());
      
      // Create transaction record
      await storage.createTransaction({
        userId: user.id,
        type: `flash_trade_${normalizedResult}`,
        amount: normalizedResult === 'win' ? 
          (parseFloat(trade.amount) + profitLoss).toString() : 
          '0', // Amount was already deducted when trade was created
        balanceBefore: user.balance,
        balanceAfter: newBalance.toString(),
        description: `Flash Trade ${normalizedResult === 'win' ? 'win' : 'loss'} - ${trade.duration}s ${trade.direction.toUpperCase()}`,
        metadata: {
          tradeId,
          adminId: adminUser.id,
          adminUsername: adminUser.username,
          direction: trade.direction,
          duration: trade.duration,
          entryPrice: trade.entryPrice,
          exitPrice,
          returnRate: trade.returnRate
        }
      });
      
      // Create notification for user
      await storage.createNotification({
        userId: user.id,
        title: `Flash Trade ${result === 'win' ? 'Win' : 'Loss'}`,
        message: result === 'win' ?
          `Your ${trade.duration}s Flash Trade has completed successfully. You've won ${profitLoss} USDT!` :
          `Your ${trade.duration}s Flash Trade has ended. Unfortunately, this position resulted in a loss.`,
        type: result === 'win' ? "success" : "error",
        isRead: false
      });
      
      // Broadcast to websocket
      broadcastToAuthenticated({
        type: 'flash-trade',
        action: 'result',
        data: {
          tradeId,
          userId: user.id,
          username: user.username,
          result,
          direction: trade.direction,
          duration: trade.duration,
          entryPrice: trade.entryPrice,
          exitPrice,
          amount: trade.amount,
          profit: result === 'win' ? profitLoss : 0,
          newBalance: newBalance.toString(),
          timestamp: new Date()
        }
      });
      
      return res.json({
        message: `Flash trade marked as ${result}`,
        trade: {
          id: updatedTrade?.id,
          status: updatedTrade?.status,
          exitPrice: updatedTrade?.exitPrice,
          endTime: updatedTrade?.endTime
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin Flash Trade Settings
  app.get("/api/admin/flash-trade-settings", authenticate, adminOnly, async (req, res, next) => {
    try {
      const settings = await storage.getAllFlashTradeSettings();
      
      return res.json({
        settings: settings.map(setting => ({
          id: setting.id,
          duration: setting.duration,
          returnRate: setting.returnRate,
          minAmount: setting.minAmount,
          maxAmount: setting.maxAmount,
          isActive: setting.isActive
        }))
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/flash-trade-settings", authenticate, adminOnly, async (req, res, next) => {
    try {
      const adminUser = (req as any).user;
      const { duration, returnRate, minAmount, maxAmount, isActive } = req.body;
      
      // Validate input
      if (!duration || !returnRate || !minAmount || !maxAmount) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Create flash trade setting
      const setting = await storage.createFlashTradeSetting({
        duration,
        returnRate,
        minAmount,
        maxAmount,
        isActive: isActive !== false
      });
      
      return res.status(201).json({
        message: "Flash trade setting created successfully",
        setting: {
          id: setting.id,
          duration: setting.duration,
          returnRate: setting.returnRate,
          minAmount: setting.minAmount,
          maxAmount: setting.maxAmount,
          isActive: setting.isActive
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/admin/flash-trade-settings/:id", authenticate, adminOnly, async (req, res, next) => {
    try {
      const settingId = parseInt(req.params.id);
      const adminUser = (req as any).user;
      const { duration, returnRate, minAmount, maxAmount, isActive } = req.body;
      
      // Update flash trade setting
      const updatedSetting = await storage.updateFlashTradeSetting(settingId, {
        duration,
        returnRate,
        minAmount,
        maxAmount,
        isActive
      });
      
      if (!updatedSetting) {
        return res.status(404).json({ message: "Flash trade setting not found" });
      }
      
      return res.json({
        message: "Flash trade setting updated successfully",
        setting: {
          id: updatedSetting.id,
          duration: updatedSetting.duration,
          returnRate: updatedSetting.returnRate,
          minAmount: updatedSetting.minAmount,
          maxAmount: updatedSetting.maxAmount,
          isActive: updatedSetting.isActive
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Delete flash trade setting
  app.delete("/api/admin/flash-trade-settings/:id", authenticate, adminOnly, async (req, res, next) => {
    try {
      const settingId = parseInt(req.params.id);
      const adminUser = (req as any).user;
      
      // Check if setting exists
      const setting = await storage.getFlashTradeSettingById(settingId);
      if (!setting) {
        return res.status(404).json({ message: "Flash trade setting not found" });
      }
      
      // Delete the setting
      await storage.deleteFlashTradeSetting(settingId);
      
      return res.json({
        message: "Flash trade setting deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin Quant AI Settings
  app.get("/api/admin/quant-ai-settings", authenticate, adminOnly, async (req, res, next) => {
    try {
      const settings = await storage.getAllQuantAISettings();
      
      return res.json({
        settings: settings.map(setting => ({
          id: setting.id,
          strategy: setting.strategy,
          duration: setting.duration,
          dailyReturn: setting.dailyReturn,
          totalReturn: setting.totalReturn,
          minAmount: setting.minAmount,
          maxAmount: setting.maxAmount,
          isActive: setting.isActive
        }))
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get all active Quant AI investments for admin
  app.get("/api/admin/quant-ai/investments", authenticate, adminOnly, async (req, res, next) => {
    try {
      // Get all active investments
      const activeInvestments = await storage.getAllActiveQuantAIInvestments();
      
      // Get strategy details for each investment
      const strategies = await storage.getAllQuantAISettings();
      
      // Get user details for each investment
      const userIds = [...new Set(activeInvestments.map(inv => inv.userId))];
      const users: Record<string, schema.User> = {};
      
      for (const userId of userIds) {
        const user = await storage.getUser(userId);
        if (user) {
          users[userId] = user;
        }
      }
      
      return res.json({
        investments: await Promise.all(activeInvestments.map(async (investment) => {
          const strategy = strategies.find(s => s.id === investment.strategyId);
          const user = users[investment.userId];
          const currentDate = new Date();
          const startDate = new Date(investment.startDate);
          
          // Calculate days completed and progress
          const daysCompleted = Math.min(
            investment.duration,
            Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
          );
          
          const progress = Math.round((daysCompleted / investment.duration) * 100);
          
          // Calculate expected final value based on total return
          const initialAmount = parseFloat(investment.amount);
          const returnRate = parseFloat(investment.totalReturn) / 100;
          const expectedFinalValue = initialAmount + (initialAmount * returnRate);
          
          return {
            id: investment.id,
            userId: investment.userId,
            userEmail: user?.email || 'Unknown',
            userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown',
            strategy: strategy?.strategy || 'unknown',
            amount: investment.amount,
            currentValue: investment.currentValue,
            duration: investment.duration,
            daysCompleted,
            progress,
            dailyReturn: investment.dailyReturn,
            totalReturn: investment.totalReturn,
            expectedFinalValue: expectedFinalValue.toFixed(2),
            startDate: investment.startDate,
            endDate: investment.endDate,
            isReadyToComplete: daysCompleted >= investment.duration
          };
        }))
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/quant-ai-settings", authenticate, adminOnly, async (req, res, next) => {
    try {
      const adminUser = (req as any).user;
      const { strategy, duration, dailyReturn, totalReturn, minAmount, maxAmount, isActive } = req.body;
      
      // Validate input
      if (!strategy || !duration || !dailyReturn || !totalReturn || !minAmount || !maxAmount) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Create quant AI setting
      const setting = await storage.createQuantAISetting({
        strategy: strategy as any,
        duration,
        dailyReturn,
        totalReturn,
        minAmount,
        maxAmount,
        isActive: isActive !== false
      });
      
      return res.status(201).json({
        message: "Quant AI setting created successfully",
        setting: {
          id: setting.id,
          strategy: setting.strategy,
          duration: setting.duration,
          dailyReturn: setting.dailyReturn,
          totalReturn: setting.totalReturn,
          minAmount: setting.minAmount,
          maxAmount: setting.maxAmount,
          isActive: setting.isActive
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/admin/quant-ai-settings/:id", authenticate, adminOnly, async (req, res, next) => {
    try {
      const settingId = parseInt(req.params.id);
      const adminUser = (req as any).user;
      const { strategy, duration, dailyReturn, totalReturn, minAmount, maxAmount, isActive } = req.body;
      
      // Update quant AI setting
      const updatedSetting = await storage.updateQuantAISetting(settingId, {
        strategy: strategy as any,
        duration,
        dailyReturn,
        totalReturn,
        minAmount,
        maxAmount,
        isActive
      });
      
      if (!updatedSetting) {
        return res.status(404).json({ message: "Quant AI setting not found" });
      }
      
      return res.json({
        message: "Quant AI setting updated successfully",
        setting: {
          id: updatedSetting.id,
          strategy: updatedSetting.strategy,
          duration: updatedSetting.duration,
          dailyReturn: updatedSetting.dailyReturn,
          totalReturn: updatedSetting.totalReturn,
          minAmount: updatedSetting.minAmount,
          maxAmount: updatedSetting.maxAmount,
          isActive: updatedSetting.isActive
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin System Settings
  app.get("/api/admin/system-settings", authenticate, adminOnly, async (req, res, next) => {
    try {
      const settings = await storage.getAllSettings();
      
      return res.json({
        settings: settings.map(setting => ({
          key: setting.key,
          value: setting.value,
          description: setting.description,
          updatedAt: setting.updatedAt
        }))
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Notification Settings API
  // Get notification settings
  app.get("/api/admin/settings/notifications", authenticate, adminOnly, catchAsync(async (req, res) => {
    const setting = await storage.getPlatformSetting("notifications_settings");
    if (!setting) {
      // Create default notification settings if they don't exist
      const defaultSettings = {
        system: {
          newUser: true,
          serverStatus: true,
          securityAlert: true,
          databaseBackup: false,
          performanceIssue: true
        },
        admin: {
          loginAttempt: true,
          settingsChanged: true,
          userBlocked: true,
          apiKeyUpdated: false,
          maintenanceMode: true
        },
        user: {
          tradeCompleted: true,
          depositApproved: true,
          withdrawalProcessed: true,
          accountUpdated: false,
          kycStatusChanged: true
        },
        email: {
          enabled: true,
          welcomeEmail: true,
          securityAlerts: true,
          marketingUpdates: false,
          tradeConfirmations: true
        }
      };
      
      const newSetting = await storage.updatePlatformSetting("notifications_settings", JSON.stringify(defaultSettings));
      return res.json(JSON.parse(newSetting.value));
    }
    
    return res.json(JSON.parse(setting.value));
  }));
  
  // Update notification settings
  app.put("/api/admin/settings/notifications", authenticate, adminOnly, catchAsync(async (req, res) => {
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({ message: "Settings object is required" });
    }
    
    const updatedSetting = await storage.updatePlatformSetting(
      "notifications_settings", 
      JSON.stringify(settings)
    );
    
    return res.json(JSON.parse(updatedSetting.value));
  }));

  app.get("/api/admin/security-settings", authenticate, adminOnly, async (req, res, next) => {
    try {
      const ipRestrictionsSetting = await storage.getSetting('ip_restrictions');
      let ipRestrictions = {
        enabled: false,
        allowedCountries: [],
        allowedIPs: [],
        blockedIPs: []
      };
      
      if (ipRestrictionsSetting && ipRestrictionsSetting.value) {
        try {
          ipRestrictions = JSON.parse(ipRestrictionsSetting.value);
        } catch (e) {
          console.error('Error parsing IP restrictions setting:', e);
        }
      }
      
      // Get login activity 
      const users = await storage.getAllUsers(100, 0);
      const recentLogins = users
        .filter(user => user.lastLoginTime && user.lastLoginIp)
        .map(user => ({
          userId: user.id,
          email: user.email,
          lastLoginTime: user.lastLoginTime,
          lastLoginIp: user.lastLoginIp
        }))
        .sort((a, b) => {
          const dateA = a.lastLoginTime ? new Date(a.lastLoginTime).getTime() : 0;
          const dateB = b.lastLoginTime ? new Date(b.lastLoginTime).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 20);
      
      return res.json({
        ipRestrictions,
        recentLogins
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Update security settings
  app.put("/api/admin/security-settings/ip-restrictions", authenticate, superAdminOnly, async (req, res, next) => {
    try {
      // 직접 req.body를 사용 (ipRestrictions 객체 아님)
      const adminUser = (req as any).user;
      
      // 디버깅
      console.log("Security settings update received:", req.body);
      
      // Validate IP restrictions object
      const validationResult = validateSecuritySettings(req.body);
      if (!validationResult.valid) {
        return res.status(400).json({ 
          message: "Invalid security settings", 
          error: validationResult.message 
        });
      }
      
      // Save IP restrictions to database
      const settingValue = JSON.stringify(req.body);
      const updatedSetting = await storage.updateSetting(
        'ip_restrictions', 
        settingValue, 
        adminUser.id
      );
      
      // Create notification for all admins
      const admins = await storage.getAllUsers();
      const adminUsers = admins.filter(user => 
        user.role === 'admin' || user.role === 'superadmin'
      );
      
      // Create notifications for all admins
      for (const admin of adminUsers) {
        await storage.createNotification({
          userId: admin.id,
          title: "Security Settings Updated",
          message: `IP restriction settings were updated by ${adminUser.email}`,
          type: "warning",
          isRead: false
        });
      }
      
      return res.json({
        message: "Security settings updated successfully",
        setting: updatedSetting
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Block specific IP
  app.post("/api/admin/security-settings/block-ip", authenticate, adminOnly, async (req, res, next) => {
    try {
      const { ip } = req.body;
      const adminUser = (req as any).user;
      
      if (!ip) {
        return res.status(400).json({ message: "IP address is required" });
      }
      
      // Get current IP restrictions
      const ipRestrictionsSetting = await storage.getSetting('ip_restrictions');
      let ipRestrictions = {
        enabled: true,
        allowedCountries: [],
        allowedIPs: [],
        blockedIPs: []
      };
      
      if (ipRestrictionsSetting && ipRestrictionsSetting.value) {
        try {
          ipRestrictions = JSON.parse(ipRestrictionsSetting.value);
        } catch (e) {
          console.error('Error parsing IP restrictions setting:', e);
        }
      }
      
      // Enable restrictions if not already enabled
      ipRestrictions.enabled = true;
      
      // Add IP to blockedIPs if not already there
      if (!ipRestrictions.blockedIPs.includes(ip)) {
        ipRestrictions.blockedIPs.push(ip);
      }
      
      // Remove from allowedIPs if present
      ipRestrictions.allowedIPs = ipRestrictions.allowedIPs.filter(
        allowedIP => allowedIP !== ip
      );
      
      // Save updated restrictions
      const settingValue = JSON.stringify(ipRestrictions);
      const updatedSetting = await storage.updateSetting(
        'ip_restrictions', 
        settingValue, 
        adminUser.id
      );
      
      return res.json({
        message: `IP address ${ip} has been blocked`,
        setting: updatedSetting
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/admin/system-settings/:key", authenticate, adminOnly, async (req, res, next) => {
    try {
      const key = req.params.key;
      const adminUser = (req as any).user;
      const { value, description } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      // Update system setting
      const updatedSetting = await storage.updateSetting(key, value, adminUser.id);
      
      return res.json({
        message: "System setting updated successfully",
        setting: {
          key: updatedSetting?.key,
          value: updatedSetting?.value,
          description: updatedSetting?.description,
          updatedAt: updatedSetting?.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin Supported Coins
  app.get("/api/admin/supported-coins", authenticate, adminOnly, async (req, res, next) => {
    try {
      const coins = await storage.getAllSupportedCoins();
      
      return res.json({
        coins: coins.map(coin => ({
          id: coin.id,
          coin: coin.coin,
          name: coin.name,
          isActive: coin.isActive,
          withdrawalFee: coin.withdrawalFee,
          minWithdrawal: coin.minWithdrawal
        }))
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/admin/supported-coins/:id", authenticate, adminOnly, async (req, res, next) => {
    try {
      const coinId = parseInt(req.params.id);
      const adminUser = (req as any).user;
      const { isActive, withdrawalFee, minWithdrawal } = req.body;
      
      // Update supported coin
      const updatedCoin = await storage.updateSupportedCoin(coinId, {
        isActive,
        withdrawalFee,
        minWithdrawal
      });
      
      if (!updatedCoin) {
        return res.status(404).json({ message: "Supported coin not found" });
      }
      
      return res.json({
        message: "Supported coin updated successfully",
        coin: {
          id: updatedCoin.id,
          coin: updatedCoin.coin,
          name: updatedCoin.name,
          isActive: updatedCoin.isActive,
          withdrawalFee: updatedCoin.withdrawalFee,
          minWithdrawal: updatedCoin.minWithdrawal
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Crypto conversion rates
  app.get("/api/crypto/rates", async (_req, res) => {
    try {
      // First, try to get rates from supported coins in database
      const dbCoins = await storage.getAllSupportedCoins();
      
      // If we have coins in the database with prices, use them
      if (dbCoins.length > 0 && dbCoins.some(coin => coin.price)) {
        const rates = dbCoins.map(coin => ({
          id: coin.id.toString(),
          name: coin.name,
          symbol: coin.symbol,
          image: coin.logoUrl || `https://cryptologos.cc/logos/${coin.symbol.toLowerCase()}-${coin.symbol.toLowerCase()}-logo.png`,
          current_price: parseFloat(coin.price || "0")
        })).filter(coin => coin.current_price > 0);
        
        return res.json({ rates });
      }
      
      // As a fallback, use some default data
      const defaultRates = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png', current_price: 62341.23 },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', image: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', current_price: 3045.67 },
        { id: 'tether', name: 'Tether', symbol: 'USDT', image: 'https://cryptologos.cc/logos/tether-usdt-logo.png', current_price: 1.00 },
        { id: 'binancecoin', name: 'Binance Coin', symbol: 'BNB', image: 'https://cryptologos.cc/logos/bnb-bnb-logo.png', current_price: 567.89 },
        { id: 'solana', name: 'Solana', symbol: 'SOL', image: 'https://cryptologos.cc/logos/solana-sol-logo.png', current_price: 134.56 },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA', image: 'https://cryptologos.cc/logos/cardano-ada-logo.png', current_price: 0.44 },
        { id: 'xrp', name: 'XRP', symbol: 'XRP', image: 'https://cryptologos.cc/logos/xrp-xrp-logo.png', current_price: 0.51 }
      ];
      
      return res.json({ rates: defaultRates });
    } catch (error) {
      console.error("Error fetching crypto rates:", error);
      return res.status(500).json({ message: "Failed to fetch crypto rates" });
    }
  });

  // Live Support Chat Endpoints
  
  // Create a support ticket
  app.post("/api/support-tickets", authenticate, catchAsync(async (req, res) => {
    const data = schema.insertSupportTicketSchema.parse(req.body);
    const ticket = await storage.createSupportTicket({
      ...data,
      userId: req.user.id
    });
    res.status(201).json(ticket);
  }));
  
  // Get user's support tickets
  app.get("/api/support-tickets", authenticate, catchAsync(async (req, res) => {
    const tickets = await storage.getSupportTicketsByUserId(req.user.id);
    res.json(tickets);
  }));
  
  // Get a specific support ticket
  app.get("/api/support-tickets/:id", authenticate, catchAsync(async (req, res) => {
    const ticketId = parseInt(req.params.id);
    const ticket = await storage.getSupportTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" });
    }
    
    // Only ticket owner or admin can view the ticket
    if (ticket.userId !== req.user.id && !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to view this ticket" });
    }
    
    res.json(ticket);
  }));
  
  // Admin: Get open support tickets
  app.get("/api/admin/support-tickets/open", authenticate, adminOnly, catchAsync(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const tickets = await storage.getOpenSupportTickets(limit, offset);
    res.json(tickets);
  }));
  
  // Admin: Get assigned support tickets
  app.get("/api/admin/support-tickets/assigned", authenticate, adminOnly, catchAsync(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const tickets = await storage.getAssignedSupportTickets(req.user.id, limit, offset);
    res.json(tickets);
  }));
  
  // Update ticket status (assign or close)
  app.patch("/api/support-tickets/:id/status", authenticate, adminOnly, catchAsync(async (req, res) => {
    const ticketId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!["open", "assigned", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    let assignedToId = null;
    if (status === "assigned") {
      assignedToId = req.user.id;
    }
    
    const updatedTicket = await storage.updateSupportTicketStatus(ticketId, status, assignedToId);
    
    if (!updatedTicket) {
      return res.status(404).json({ message: "Support ticket not found" });
    }
    
    res.json(updatedTicket);
  }));
  
  // Get messages for a ticket
  app.get("/api/support-tickets/:id/messages", authenticate, catchAsync(async (req, res) => {
    const ticketId = parseInt(req.params.id);
    const ticket = await storage.getSupportTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" });
    }
    
    // Only ticket owner or assigned admin can view messages
    if (ticket.userId !== req.user.id && ticket.assignedToId !== req.user.id && !["superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to view these messages" });
    }
    
    const messages = await storage.getSupportMessagesByTicketId(ticketId);
    
    // Mark messages as read
    await storage.markSupportMessagesAsRead(ticketId, req.user.id);
    
    res.json(messages);
  }));
  
  // Send a message in a ticket
  app.post("/api/support-tickets/:id/messages", authenticate, catchAsync(async (req, res) => {
    const ticketId = parseInt(req.params.id);
    const ticket = await storage.getSupportTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" });
    }
    
    // Only ticket owner or assigned admin can send messages
    if (ticket.userId !== req.user.id && ticket.assignedToId !== req.user.id && !["superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to send messages in this ticket" });
    }
    
    const data = schema.insertSupportMessageSchema.parse(req.body);
    const message = await storage.createSupportMessage({
      ...data,
      ticketId,
      senderId: req.user.id
    });
    
    res.status(201).json(message);
  }));
  
  // Notification Endpoints
  
  // Get user notifications
  app.get("/api/notifications", authenticate, catchAsync(async (req, res) => {
    const notifications = await storage.getUnreadNotificationsByUserId(req.user.id);
    res.json({ notifications });
  }));
  
  // Mark notification as read
  app.patch("/api/notifications/:id/read", authenticate, catchAsync(async (req, res) => {
    const notificationId = parseInt(req.params.id);
    const notification = await storage.markNotificationAsRead(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.json(notification);
  }));
  
  // Mark all notifications as read
  app.patch("/api/notifications/read-all", authenticate, catchAsync(async (req, res) => {
    const notifications = await storage.getUnreadNotificationsByUserId(req.user.id);
    
    for (const notification of notifications) {
      await storage.markNotificationAsRead(notification.id);
    }
    
    res.json({ message: "All notifications marked as read" });
  }));

  // Platform settings endpoints
  app.get("/api/admin/platform-settings", authenticate, adminOnly, catchAsync(async (req, res) => {
    const settings = await storage.getPlatformSettings();
    res.json({ settings });
  }));
  
  // Update flash trade default win rate
  app.put("/api/admin/platform-settings/flash-trade", authenticate, adminOnly, catchAsync(async (req, res) => {
    const { winRate } = req.body;
    
    if (winRate === undefined || isNaN(parseInt(winRate))) {
      return res.status(400).json({ message: "Valid win rate is required" });
    }
    
    // Ensure win rate is between 0 and 100
    const validatedWinRate = Math.max(0, Math.min(100, parseInt(winRate)));
    
    // Update the platform setting
    const updatedSetting = await storage.updatePlatformSetting(
      'flash_trade_default_win_rate', 
      validatedWinRate.toString(),
      {
        category: 'trading',
        description: 'Default win rate for flash trades when users are set to default setting'
      }
    );
    
    // Log the change
    const adminUser = (req as any).user;
    await storage.logAdminAction(
      adminUser.id, 
      `Updated platform-wide Flash Trade default win rate to ${validatedWinRate}%`, 
      req
    );
    
    res.json({ 
      message: "Flash Trade default win rate updated successfully",
      setting: updatedSetting
    });
  }));

  app.patch("/api/admin/platform-settings/:key", authenticate, adminOnly, catchAsync(async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ message: 'Key and value are required' });
    }
    
    const updatedSetting = await storage.updatePlatformSetting(key, value);
    
    // Log admin action
    if (req.user) {
      await storage.logAdminAction(req.user.id, `Updated platform setting: ${key}`, req);
    }
    
    res.json(updatedSetting);
  }));
  
  // Admin access management endpoints
  app.get("/api/admin/access/admins", authenticate, superAdminOnly, catchAsync(async (req, res) => {
    const admins = await storage.getAdminUsers();
    res.json({ admins });
  }));
  
  app.post("/api/admin/access/admins", authenticate, superAdminOnly, catchAsync(async (req, res) => {
    const { email, password, firstName, lastName, role, permissions } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check if email already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const newAdmin = await storage.createAdminUser({
      email,
      password,
      firstName,
      lastName,
      role: role || 'admin',
      permissions: permissions || [],
    });
    
    // Log admin action
    if (req.user) {
      await storage.logAdminAction(req.user.id, `Created new admin: ${email}`, req);
    }
    
    res.status(201).json(newAdmin);
  }));
  
  app.delete("/api/admin/access/admins/:id", authenticate, superAdminOnly, catchAsync(async (req, res) => {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (req.user && req.user.id === id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    const adminUser = await storage.getUserById(id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    await storage.deleteUser(id);
    
    // Log admin action
    if (req.user) {
      await storage.logAdminAction(req.user.id, `Deleted admin: ${adminUser.email}`, req);
    }
    
    res.json({ success: true });
  }));
  
  app.patch("/api/admin/access/admins/:id/permissions", authenticate, superAdminOnly, catchAsync(async (req, res) => {
    const { id } = req.params;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: 'Permissions must be an array' });
    }
    
    const adminUser = await storage.getUserById(id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    const updatedAdmin = await storage.updateAdminPermissions(id, permissions);
    
    // Log admin action
    if (req.user) {
      await storage.logAdminAction(req.user.id, `Updated permissions for admin: ${adminUser.email}`, req);
    }
    
    res.json(updatedAdmin);
  }));
  
  app.get("/api/admin/access/logs", authenticate, superAdminOnly, catchAsync(async (req, res) => {
    const logs = await storage.getAdminAccessLogs(20); // Get latest 20 logs
    res.json({ logs });
  }));
  
  // Admin notification management
  app.post("/api/admin/notifications", authenticate, adminOnly, catchAsync(async (req, res) => {
    const { userId, title, message, type } = req.body;
    
    if (!userId || !title || !message || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Check if user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const notification = await storage.createNotification({
      userId,
      title,
      message,
      type,
      isRead: false
    });
    
    res.status(201).json(notification);
  }));
  
  // Admin send notification to all users
  app.post("/api/admin/notifications/broadcast", authenticate, superAdminOnly, catchAsync(async (req, res) => {
    const { title, message, type } = req.body;
    
    if (!title || !message || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Get all users
    const users = await storage.getAllUsers();
    const notifications = [];
    
    for (const user of users) {
      const notification = await storage.createNotification({
        userId: user.id,
        title,
        message,
        type,
        isRead: false
      });
      notifications.push(notification);
    }
    
    res.status(201).json({ 
      message: `Sent notification to ${notifications.length} users`, 
      count: notifications.length 
    });
  }));
  
  // Error handler middleware
  app.use(errorHandler);
  
  return httpServer;
}

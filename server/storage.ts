import { eq, and, desc, or, gte, lte, sql, asc, not } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import { randomBytes, scrypt, randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<schema.User | undefined>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  upsertUser(user: { id: string, email?: string, firstName?: string, lastName?: string, profileImageUrl?: string, password?: string, role?: string }): Promise<schema.User>;
  updateUser(id: string, user: Partial<schema.InsertUser>): Promise<schema.User | undefined>;
  getAllUsers(limit?: number, offset?: number): Promise<schema.User[]>;
  updateUserBalance(userId: string, newBalance: string): Promise<schema.User | undefined>;
  updateUserFlashTradeOutcome(userId: string, outcome: 'default' | 'win' | 'lose', winRate?: number): Promise<schema.User | undefined>;
  toggleUserActiveStatus(userId: string, isActive: boolean): Promise<schema.User | undefined>;
  promoteUserToAdmin(userId: string): Promise<schema.User | undefined>;
  deleteUser(userId: string): Promise<void>;
  
  // KYC operations
  createKycDocument(document: schema.InsertKycDocument): Promise<schema.KycDocument>;
  getKycDocumentsByUserId(userId: string): Promise<schema.KycDocument[]>;
  updateKycStatus(documentId: number, status: string, rejectionReason?: string, processedBy?: string): Promise<schema.KycDocument | undefined>;
  updateKycDocument(documentId: number, updateData: Partial<schema.InsertKycDocument>): Promise<schema.KycDocument | undefined>;
  getPendingKycDocuments(): Promise<schema.KycDocument[]>;
  getAllKycDocuments(): Promise<schema.KycDocument[]>;
  
  // Deposit operations
  createDeposit(deposit: schema.InsertDeposit): Promise<schema.Deposit>;
  getDepositById(id: number): Promise<schema.Deposit | undefined>;
  getDepositsByUserId(userId: string): Promise<schema.Deposit[]>;
  updateDepositStatus(depositId: number, status: string, rejectionReason?: string, processedBy?: string): Promise<schema.Deposit | undefined>;
  getPendingDeposits(): Promise<schema.Deposit[]>;
  
  // Withdrawal operations
  createWithdrawal(withdrawal: schema.InsertWithdrawal): Promise<schema.Withdrawal>;
  getWithdrawalById(id: number): Promise<schema.Withdrawal | undefined>;
  getWithdrawalsByUserId(userId: string): Promise<schema.Withdrawal[]>;
  updateWithdrawalStatus(withdrawalId: number, status: string, rejectionReason?: string, processedBy?: string): Promise<schema.Withdrawal | undefined>;
  getPendingWithdrawals(): Promise<schema.Withdrawal[]>;
  
  // Support Chat operations
  createSupportTicket(ticket: schema.InsertSupportTicket): Promise<schema.SupportTicket>;
  getSupportTicketById(id: number): Promise<schema.SupportTicket | undefined>;
  getSupportTicketsByUserId(userId: string): Promise<schema.SupportTicket[]>;
  getOpenSupportTickets(limit?: number, offset?: number): Promise<schema.SupportTicket[]>;
  getAssignedSupportTickets(adminId: string, limit?: number, offset?: number): Promise<schema.SupportTicket[]>;
  updateSupportTicketStatus(ticketId: number, status: string, assignedToId?: string): Promise<schema.SupportTicket | undefined>;
  
  // Support Message operations
  createSupportMessage(message: schema.InsertSupportMessage): Promise<schema.SupportMessage>;
  getSupportMessagesByTicketId(ticketId: number): Promise<schema.SupportMessage[]>;
  markSupportMessagesAsRead(ticketId: number, userId: string): Promise<void>;
  
  // Flash Trade operations
  createFlashTradeSetting(setting: schema.InsertFlashTradeSetting): Promise<schema.FlashTradeSetting>;
  getAllFlashTradeSettings(): Promise<schema.FlashTradeSetting[]>;
  getFlashTradeSettingById(id: number): Promise<schema.FlashTradeSetting | undefined>;
  updateFlashTradeSetting(id: number, setting: Partial<schema.InsertFlashTradeSetting>): Promise<schema.FlashTradeSetting | undefined>;
  deleteFlashTradeSetting(id: number): Promise<void>;
  createFlashTrade(trade: schema.InsertFlashTrade): Promise<schema.FlashTrade>;
  getActiveFlashTrades(): Promise<schema.FlashTrade[]>;
  getFlashTradesByUserId(userId: string): Promise<schema.FlashTrade[]>;
  getFlashTradeById(tradeId: number): Promise<schema.FlashTrade | undefined>;
  updateFlashTradeStatus(tradeId: number, status: string, exitPrice?: string): Promise<schema.FlashTrade | undefined>;
  updateFlashTrade(tradeId: number, data: Record<string, any>): Promise<schema.FlashTrade | undefined>;
  
  // Quant AI operations
  createQuantAISetting(setting: schema.InsertQuantAISetting): Promise<schema.QuantAISetting>;
  getAllQuantAISettings(): Promise<schema.QuantAISetting[]>;
  updateQuantAISetting(id: number, setting: Partial<schema.InsertQuantAISetting>): Promise<schema.QuantAISetting | undefined>;
  createQuantAIInvestment(investment: schema.InsertQuantAIInvestment): Promise<schema.QuantAIInvestment>;
  getActiveQuantAIInvestmentsByUserId(userId: string): Promise<schema.QuantAIInvestment[]>;
  getAllActiveQuantAIInvestments(): Promise<schema.QuantAIInvestment[]>;
  updateQuantAIInvestmentValue(investmentId: number, newValue: string): Promise<schema.QuantAIInvestment | undefined>;
  completeQuantAIInvestment(investmentId: number): Promise<schema.QuantAIInvestment | undefined>;
  
  // Transaction operations
  createTransaction(transaction: schema.InsertTransaction): Promise<schema.Transaction>;
  getTransactionsByUserId(userId: string, limit?: number): Promise<schema.Transaction[]>;
  
  // Notification operations
  createNotification(notification: schema.InsertNotification): Promise<schema.Notification>;
  getUnreadNotificationsByUserId(userId: string): Promise<schema.Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<schema.Notification | undefined>;
  
  // System Settings operations
  getSetting(key: string): Promise<schema.SystemSetting | undefined>;
  updateSetting(key: string, value: string, updatedBy: string): Promise<schema.SystemSetting | undefined>;
  getAllSettings(): Promise<schema.SystemSetting[]>;
  
  // Supported Coins operations
  getAllSupportedCoins(): Promise<schema.SupportedCoin[]>;
  updateSupportedCoin(id: number, coin: Partial<schema.InsertSupportedCoin>): Promise<schema.SupportedCoin | undefined>;

  // Platform Settings operations
  getPlatformSettings(): Promise<schema.PlatformSetting[]>;
  getPlatformSettingByKey(key: string): Promise<schema.PlatformSetting | undefined>;
  getPlatformSetting(key: string): Promise<schema.PlatformSetting | undefined>;
  updatePlatformSetting(key: string, value: string): Promise<schema.PlatformSetting>;
  updatePlatformSettings(key: string, value: string): Promise<schema.PlatformSetting>;
  
  // Admin operations
  getAdminUsers(): Promise<schema.User[]>;
  createAdminUser(admin: { email: string, password: string, firstName?: string, lastName?: string, role: string, permissions: string[] }): Promise<schema.User>;
  updateAdminPermissions(adminId: string, permissions: string[]): Promise<schema.User | undefined>;
  logAdminAction(adminId: string, action: string, req: any): Promise<void>;
  getAdminAccessLogs(limit?: number): Promise<schema.AdminAccessLog[]>;
  
  // Security Settings operations
  getSecuritySettings(): Promise<schema.SecuritySetting>;
  updateSecuritySettings(settings: Partial<schema.SecuritySetting>): Promise<schema.SecuritySetting>;
  
  // Bonus operations
  getActiveBonusPrograms(): Promise<schema.BonusProgram[]>;
  getBonusProgramById(id: number): Promise<schema.BonusProgram | undefined>;
  createBonusProgram(program: schema.InsertBonusProgram): Promise<schema.BonusProgram>;
  updateBonusProgram(id: number, data: Partial<schema.InsertBonusProgram>): Promise<schema.BonusProgram | undefined>;
  toggleBonusProgramActive(id: number, isActive: boolean): Promise<schema.BonusProgram | undefined>;
  
  // User Bonus operations
  getUserBonusByType(userId: string, type: string): Promise<schema.UserBonus | undefined>;
  getUserBonusByPromotionCode(userId: string, code: string): Promise<schema.UserBonus | undefined>;
  createUserBonus(bonus: schema.InsertUserBonus): Promise<schema.UserBonus>;
  getUserBonuses(userId: string): Promise<schema.UserBonus[]>;
  getActiveUserBonuses(): Promise<schema.UserBonus[]>;
  updateUserBonusStatus(id: number, status: string): Promise<schema.UserBonus | undefined>;
  
  // Utility for managing user balance
  adjustUserBalance(userId: string, amount: number, operation: 'increase' | 'decrease', reason: string): Promise<schema.User | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }
  
  // Delete a user and all associated data
  async deleteUser(userId: string): Promise<void> {
    // First check if the user exists
    const user = await this.getUser(userId);
    if (!user) {
      return;
    }
    
    try {
      // Begin a transaction
      await db.transaction(async (tx) => {
        // Delete related records first (in reverse order of dependency)
        
        // First, find and delete all dependencies in a way that handles cases where tables might not exist
        // or where there are no records
        try {
          // 1. Delete notifications for this user
          await tx.delete(schema.notifications).where(eq(schema.notifications.userId, userId));
        } catch (e) {
          console.log(`No notifications to delete for user ${userId}`);
        }
        
        try {
          // 2. Delete transactions for this user
          await tx.delete(schema.transactions).where(eq(schema.transactions.userId, userId));
        } catch (e) {
          console.log(`No transactions to delete for user ${userId}`);
        }
        
        try {
          // 3. Delete deposits for this user
          await tx.delete(schema.deposits).where(eq(schema.deposits.userId, userId));
        } catch (e) {
          console.log(`No deposits to delete for user ${userId}`);
        }
        
        try {
          // 4. Delete withdrawals for this user
          await tx.delete(schema.withdrawals).where(eq(schema.withdrawals.userId, userId));
        } catch (e) {
          console.log(`No withdrawals to delete for user ${userId}`);
        }
        
        try {
          // 5. Delete KYC documents for this user
          await tx.delete(schema.kycDocuments).where(eq(schema.kycDocuments.userId, userId));
        } catch (e) {
          console.log(`No KYC documents to delete for user ${userId}`);
        }
        
        try {
          // 6. Delete flash trades for this user
          await tx.delete(schema.flashTrades).where(eq(schema.flashTrades.userId, userId));
        } catch (e) {
          console.log(`No flash trades to delete for user ${userId}`);
        }
        
        try {
          // 7. Delete quant AI investments for this user
          await tx.delete(schema.quantAIInvestments).where(eq(schema.quantAIInvestments.userId, userId));
        } catch (e) {
          console.log(`No quant AI investments to delete for user ${userId}`);
        }
        
        try {
          // 8. Delete support tickets and messages for this user
          const tickets = await tx.select().from(schema.supportTickets).where(eq(schema.supportTickets.userId, userId));
          for (const ticket of tickets) {
            await tx.delete(schema.supportMessages).where(eq(schema.supportMessages.ticketId, ticket.id));
          }
          await tx.delete(schema.supportTickets).where(eq(schema.supportTickets.userId, userId));
        } catch (e) {
          console.log(`No support tickets to delete for user ${userId}`);
        }
        
        try {
          // 9. Delete user bonuses for this user
          await tx.delete(schema.userBonuses).where(eq(schema.userBonuses.userId, userId));
        } catch (e) {
          console.log(`No user bonuses to delete for user ${userId}`);
        }
        
        // Finally, delete the user
        await tx.delete(schema.users).where(eq(schema.users.id, userId));
      });
      
      // Log the deletion
      console.log(`User ${userId} has been deleted from the system along with all associated data`);
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async upsertUser(user: { id: string, email?: string, firstName?: string, lastName?: string, profileImageUrl?: string, password?: string, role?: "user" | "admin" | "superadmin" }): Promise<schema.User> {
    const { id, ...userData } = user;
    
    const [updatedUser] = await db
      .insert(schema.users)
      .values({
        id,
        ...userData,
        role: (userData.role as "user" | "admin" | "superadmin") || 'user',
        balance: "0",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          ...userData,
          role: userData.role ? (userData.role as "user" | "admin" | "superadmin") : undefined,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return updatedUser;
  }

  async updateUser(id: string, user: Partial<Omit<schema.InsertUser, 'role'>> & { role?: "user" | "admin" | "superadmin" }): Promise<schema.User | undefined> {
    const [updatedUser] = await db
      .update(schema.users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(limit = 100, offset = 0): Promise<schema.User[]> {
    return db.select().from(schema.users).limit(limit).offset(offset);
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<schema.User | undefined> {
    console.log(`Updating user ${userId} balance to: ${newBalance}`);
    
    try {
      // Convert to string to ensure proper decimal handling
      const formattedBalance = parseFloat(newBalance).toFixed(8);
      console.log(`Formatted balance: ${formattedBalance}`);
      
      const [updatedUser] = await db
        .update(schema.users)
        .set({ 
          balance: formattedBalance, 
          updatedAt: new Date() 
        })
        .where(eq(schema.users.id, userId))
        .returning();
      
      console.log(`User balance updated. New balance: ${updatedUser?.balance}`);
      return updatedUser;
    } catch (error) {
      console.error(`Error updating user balance: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async updateUserFlashTradeOutcome(userId: string, outcome: 'default' | 'win' | 'lose', winRate?: number): Promise<schema.User | undefined> {
    console.log(`Updating user ${userId} flash trade outcome to: ${outcome}, win rate: ${winRate || 'default'}`);
    
    try {
      // Prepare the update data
      const updateData: Record<string, any> = {
        flashTradeOutcome: outcome,
        updatedAt: new Date()
      };
      
      // Only set winRate if outcome is 'default' and winRate is provided
      if (outcome === 'default' && typeof winRate === 'number') {
        updateData.flashTradeWinRate = winRate;
      }
      
      const [updatedUser] = await db
        .update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, userId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error("Error updating user flash trade outcome:", error);
      throw error;
    }
  }
  
  async toggleUserActiveStatus(userId: string, isActive: boolean): Promise<schema.User | undefined> {
    try {
      console.log(`${isActive ? 'Activating' : 'Deactivating'} user ${userId}`);
      
      const [updatedUser] = await db
        .update(schema.users)
        .set({ 
          isActive: isActive, 
          updatedAt: new Date() 
        })
        .where(eq(schema.users.id, userId))
        .returning();
      
      console.log(`User ${userId} active status updated to: ${isActive}`);
      return updatedUser;
    } catch (error) {
      console.error(`Error ${isActive ? 'activating' : 'deactivating'} user:`, error);
      throw error;
    }
  }
  
  async promoteUserToAdmin(userId: string): Promise<schema.User | undefined> {
    try {
      console.log(`Promoting user ${userId} to admin role`);
      
      // Make sure user exists and is not already an admin
      const user = await this.getUser(userId);
      if (!user) {
        console.error(`User ${userId} not found`);
        return undefined;
      }
      
      if (user.role === 'admin' || user.role === 'superadmin') {
        console.log(`User ${userId} is already an admin or superadmin`);
        return user;
      }
      
      const [updatedUser] = await db
        .update(schema.users)
        .set({ 
          role: 'admin', 
          updatedAt: new Date() 
        })
        .where(eq(schema.users.id, userId))
        .returning();
      
      console.log(`User ${userId} promoted to admin role`);
      return updatedUser;
    } catch (error) {
      console.error("Error promoting user to admin:", error);
      throw error;
    }
  }

  // KYC operations
  async createKycDocument(document: schema.InsertKycDocument): Promise<schema.KycDocument> {
    const [newDocument] = await db.insert(schema.kycDocuments).values(document).returning();
    return newDocument;
  }

  async getKycDocumentsByUserId(userId: string): Promise<schema.KycDocument[]> {
    return db.select().from(schema.kycDocuments).where(eq(schema.kycDocuments.userId, userId));
  }

  async updateKycStatus(documentId: number, status: string, rejectionReason?: string, processedBy?: string): Promise<schema.KycDocument | undefined> {
    const [updatedDocument] = await db
      .update(schema.kycDocuments)
      .set({ 
        status: status as any, 
        rejectionReason, 
        processedBy, 
        updatedAt: new Date() 
      })
      .where(eq(schema.kycDocuments.id, documentId))
      .returning();
    return updatedDocument;
  }
  
  async updateKycDocument(documentId: number, updateData: Partial<schema.InsertKycDocument>): Promise<schema.KycDocument | undefined> {
    const [updatedDocument] = await db
      .update(schema.kycDocuments)
      .set({ 
        ...updateData,
        updatedAt: new Date() 
      })
      .where(eq(schema.kycDocuments.id, documentId))
      .returning();
    return updatedDocument;
  }

  async getPendingKycDocuments(): Promise<schema.KycDocument[]> {
    return db
      .select()
      .from(schema.kycDocuments)
      .where(eq(schema.kycDocuments.status, 'pending'))
      .orderBy(asc(schema.kycDocuments.createdAt));
  }
  
  async getAllKycDocuments(): Promise<schema.KycDocument[]> {
    return db
      .select()
      .from(schema.kycDocuments)
      .orderBy(desc(schema.kycDocuments.updatedAt));
  }

  // Deposit operations
  async createDeposit(deposit: schema.InsertDeposit): Promise<schema.Deposit> {
    const [newDeposit] = await db.insert(schema.deposits).values(deposit).returning();
    return newDeposit;
  }

  async getDepositById(id: number): Promise<schema.Deposit | undefined> {
    const [deposit] = await db.select().from(schema.deposits).where(eq(schema.deposits.id, id));
    return deposit;
  }

  async getDepositsByUserId(userId: string): Promise<schema.Deposit[]> {
    return db
      .select()
      .from(schema.deposits)
      .where(eq(schema.deposits.userId, userId))
      .orderBy(desc(schema.deposits.createdAt));
  }

  async updateDepositStatus(depositId: number, status: string, rejectionReason?: string, processedBy?: string): Promise<schema.Deposit | undefined> {
    const [updatedDeposit] = await db
      .update(schema.deposits)
      .set({ 
        status: status as any, 
        rejectionReason, 
        processedBy, 
        updatedAt: new Date() 
      })
      .where(eq(schema.deposits.id, depositId))
      .returning();
    return updatedDeposit;
  }

  async getPendingDeposits(): Promise<schema.Deposit[]> {
    return db
      .select()
      .from(schema.deposits)
      .where(eq(schema.deposits.status, 'pending'))
      .orderBy(asc(schema.deposits.createdAt));
  }

  // Withdrawal operations
  async createWithdrawal(withdrawal: schema.InsertWithdrawal): Promise<schema.Withdrawal> {
    const [newWithdrawal] = await db.insert(schema.withdrawals).values(withdrawal).returning();
    return newWithdrawal;
  }

  async getWithdrawalById(id: number): Promise<schema.Withdrawal | undefined> {
    const [withdrawal] = await db.select().from(schema.withdrawals).where(eq(schema.withdrawals.id, id));
    return withdrawal;
  }

  async getWithdrawalsByUserId(userId: string): Promise<schema.Withdrawal[]> {
    return db
      .select()
      .from(schema.withdrawals)
      .where(eq(schema.withdrawals.userId, userId))
      .orderBy(desc(schema.withdrawals.createdAt));
  }

  async updateWithdrawalStatus(withdrawalId: number, status: string, rejectionReason?: string, processedBy?: string): Promise<schema.Withdrawal | undefined> {
    const [updatedWithdrawal] = await db
      .update(schema.withdrawals)
      .set({ 
        status: status as any, 
        rejectionReason, 
        processedBy, 
        updatedAt: new Date() 
      })
      .where(eq(schema.withdrawals.id, withdrawalId))
      .returning();
    return updatedWithdrawal;
  }

  async getPendingWithdrawals(): Promise<schema.Withdrawal[]> {
    return db
      .select()
      .from(schema.withdrawals)
      .where(eq(schema.withdrawals.status, 'pending'))
      .orderBy(asc(schema.withdrawals.createdAt));
  }

  // Flash Trade operations
  async createFlashTradeSetting(setting: schema.InsertFlashTradeSetting): Promise<schema.FlashTradeSetting> {
    const [newSetting] = await db.insert(schema.flashTradeSettings).values(setting).returning();
    return newSetting;
  }

  async getAllFlashTradeSettings(): Promise<schema.FlashTradeSetting[]> {
    return db.select().from(schema.flashTradeSettings);
  }
  
  async getFlashTradeSettingById(id: number): Promise<schema.FlashTradeSetting | undefined> {
    const [setting] = await db
      .select()
      .from(schema.flashTradeSettings)
      .where(eq(schema.flashTradeSettings.id, id));
    return setting;
  }

  async updateFlashTradeSetting(id: number, setting: Partial<schema.InsertFlashTradeSetting>): Promise<schema.FlashTradeSetting | undefined> {
    const [updatedSetting] = await db
      .update(schema.flashTradeSettings)
      .set({ ...setting, updatedAt: new Date() })
      .where(eq(schema.flashTradeSettings.id, id))
      .returning();
    return updatedSetting;
  }
  
  async deleteFlashTradeSetting(id: number): Promise<void> {
    await db
      .delete(schema.flashTradeSettings)
      .where(eq(schema.flashTradeSettings.id, id));
  }

  async createFlashTrade(trade: schema.InsertFlashTrade): Promise<schema.FlashTrade> {
    const [newTrade] = await db.insert(schema.flashTrades).values(trade).returning();
    return newTrade;
  }

  async getActiveFlashTrades(): Promise<schema.FlashTrade[]> {
    return db
      .select()
      .from(schema.flashTrades)
      .where(eq(schema.flashTrades.status, 'active'))
      .orderBy(asc(schema.flashTrades.startTime));
  }
  
  async getActiveFlashTradesForUser(userId: string): Promise<schema.FlashTrade[]> {
    return db
      .select()
      .from(schema.flashTrades)
      .where(and(
        eq(schema.flashTrades.userId, userId),
        eq(schema.flashTrades.status, 'active')
      ))
      .orderBy(asc(schema.flashTrades.startTime));
  }
  
  async getFlashTradeById(tradeId: number): Promise<schema.FlashTrade | undefined> {
    const [trade] = await db
      .select()
      .from(schema.flashTrades)
      .where(eq(schema.flashTrades.id, tradeId));
    
    return trade;
  }

  async getFlashTradesByUserId(userId: string): Promise<schema.FlashTrade[]> {
    return db
      .select()
      .from(schema.flashTrades)
      .where(eq(schema.flashTrades.userId, userId))
      .orderBy(desc(schema.flashTrades.createdAt));
  }

  async updateFlashTradeStatus(tradeId: number, status: string, exitPrice?: string): Promise<schema.FlashTrade | undefined> {
    // 일관된 결과 표기를 위해 'lose'를 'loss'로 정규화
    const normalizedStatus = status === 'lose' ? 'loss' : status;
    
    const [updatedTrade] = await db
      .update(schema.flashTrades)
      .set({ 
        status: normalizedStatus as any, 
        exitPrice, 
        endTime: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(schema.flashTrades.id, tradeId))
      .returning();
    return updatedTrade;
  }
  
  async updateFlashTrade(tradeId: number, data: Record<string, any>): Promise<schema.FlashTrade | undefined> {
    // Add updatedAt timestamp to ensure it's always updated
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    const [updatedTrade] = await db
      .update(schema.flashTrades)
      .set(updateData as any)
      .where(eq(schema.flashTrades.id, tradeId))
      .returning();
    
    return updatedTrade;
  }
  
  async createFlashTradeResult(tradeId: number, result: 'win' | 'loss', profit: number): Promise<schema.FlashTrade | undefined> {
    // 중요: 서버에서 'win'/'loss'로 결과를 사용하므로 DB에도 같은 형식으로 저장
    // 'win'은 'win'으로, 'loss'는 'loss'로 저장 (중간 변환 없음)
    const status = result; // 'win' => 'win', 'loss' => 'loss'로 직접 매핑
    console.log(`[Storage] createFlashTradeResult - 서버 결과값(${result})을 저장 상태값(${status})로 변환`);
    
    const trade = await this.getFlashTradeById(tradeId);
    
    if (!trade) {
      throw new Error(`Flash trade with ID ${tradeId} not found`);
    }
    
    // Generate a realistic exit price based on the direction and result
    const entryPrice = parseFloat(trade.entryPrice.toString());
    let exitPriceValue: number;
    
    if ((trade.direction === 'up' && result === 'win') || (trade.direction === 'down' && result === 'loss')) {
      // Price went up
      exitPriceValue = entryPrice * (1 + (Math.random() * 0.05 + 0.01));
    } else {
      // Price went down
      exitPriceValue = entryPrice * (1 - (Math.random() * 0.05 + 0.01));
    }
    
    const exitPrice = exitPriceValue.toFixed(2);
    
    // Update the trade status with consistent terminology
    return this.updateFlashTradeStatus(tradeId, status, exitPrice);
  }
  
  async getFlashTradeById(id: number): Promise<schema.FlashTrade | undefined> {
    const [trade] = await db.select().from(schema.flashTrades).where(eq(schema.flashTrades.id, id));
    return trade;
  }

  // Quant AI operations
  async createQuantAISetting(setting: schema.InsertQuantAISetting): Promise<schema.QuantAISetting> {
    const [newSetting] = await db.insert(schema.quantAISettings).values(setting).returning();
    return newSetting;
  }

  async getAllQuantAISettings(): Promise<schema.QuantAISetting[]> {
    return db.select().from(schema.quantAISettings);
  }

  async updateQuantAISetting(id: number, setting: Partial<schema.InsertQuantAISetting>): Promise<schema.QuantAISetting | undefined> {
    const [updatedSetting] = await db
      .update(schema.quantAISettings)
      .set({ ...setting, updatedAt: new Date() })
      .where(eq(schema.quantAISettings.id, id))
      .returning();
    return updatedSetting;
  }

  async createQuantAIInvestment(investment: schema.InsertQuantAIInvestment): Promise<schema.QuantAIInvestment> {
    const [newInvestment] = await db.insert(schema.quantAIInvestments).values(investment).returning();
    return newInvestment;
  }

  async getActiveQuantAIInvestmentsByUserId(userId: string): Promise<schema.QuantAIInvestment[]> {
    return db
      .select()
      .from(schema.quantAIInvestments)
      .where(
        and(
          eq(schema.quantAIInvestments.userId, userId),
          eq(schema.quantAIInvestments.isCompleted, false)
        )
      )
      .orderBy(desc(schema.quantAIInvestments.createdAt));
  }
  
  async getActiveQuantAIInvestmentsForUser(userId: string): Promise<schema.QuantAIInvestment[]> {
    return this.getActiveQuantAIInvestmentsByUserId(userId);
  }
  
  async getQuantAIInvestment(id: number): Promise<schema.QuantAIInvestment | undefined> {
    const [investment] = await db
      .select()
      .from(schema.quantAIInvestments)
      .where(eq(schema.quantAIInvestments.id, id));
    return investment;
  }
  
  async getAllActiveQuantAIInvestments(): Promise<schema.QuantAIInvestment[]> {
    return db
      .select()
      .from(schema.quantAIInvestments)
      .where(eq(schema.quantAIInvestments.isCompleted, false))
      .orderBy(desc(schema.quantAIInvestments.createdAt));
  }

  async updateQuantAIInvestmentValue(investmentId: number, newValue: string): Promise<schema.QuantAIInvestment | undefined> {
    const [updatedInvestment] = await db
      .update(schema.quantAIInvestments)
      .set({ 
        currentValue: newValue, 
        updatedAt: new Date() 
      })
      .where(eq(schema.quantAIInvestments.id, investmentId))
      .returning();
    return updatedInvestment;
  }

  async completeQuantAIInvestment(investmentId: number): Promise<schema.QuantAIInvestment | undefined> {
    const [completedInvestment] = await db
      .update(schema.quantAIInvestments)
      .set({ 
        isCompleted: true, 
        updatedAt: new Date() 
      })
      .where(eq(schema.quantAIInvestments.id, investmentId))
      .returning();
    return completedInvestment;
  }

  // Transaction operations
  async createTransaction(transaction: schema.InsertTransaction): Promise<schema.Transaction> {
    const [newTransaction] = await db.insert(schema.transactions).values(transaction).returning();
    return newTransaction;
  }

  async getTransactionsByUserId(userId: string, limit = 10): Promise<schema.Transaction[]> {
    return db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId))
      .orderBy(desc(schema.transactions.createdAt))
      .limit(limit);
  }

  // Notification operations
  async createNotification(notification: schema.InsertNotification): Promise<schema.Notification> {
    const [newNotification] = await db.insert(schema.notifications).values(notification).returning();
    return newNotification;
  }

  async getUnreadNotificationsByUserId(userId: string): Promise<schema.Notification[]> {
    return db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, false)
        )
      )
      .orderBy(desc(schema.notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: number): Promise<schema.Notification | undefined> {
    const [updatedNotification] = await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.id, notificationId))
      .returning();
    return updatedNotification;
  }

  // System Settings operations
  async getSetting(key: string): Promise<schema.SystemSetting | undefined> {
    const [setting] = await db
      .select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, key));
    return setting;
  }

  async updateSetting(key: string, value: string, updatedBy: string): Promise<schema.SystemSetting | undefined> {
    // Check if setting exists
    const existingSetting = await this.getSetting(key);
    
    if (existingSetting) {
      // Update existing setting
      const [updatedSetting] = await db
        .update(schema.systemSettings)
        .set({ 
          value, 
          updatedBy, 
          updatedAt: new Date() 
        })
        .where(eq(schema.systemSettings.key, key))
        .returning();
      return updatedSetting;
    } else {
      // Create new setting
      const [newSetting] = await db
        .insert(schema.systemSettings)
        .values({ 
          key, 
          value, 
          updatedBy 
        })
        .returning();
      return newSetting;
    }
  }

  async getAllSettings(): Promise<schema.SystemSetting[]> {
    return db.select().from(schema.systemSettings);
  }

  // Supported Coins operations
  async getAllSupportedCoins(): Promise<schema.SupportedCoin[]> {
    return db.select().from(schema.supportedCoins);
  }

  async updateSupportedCoin(id: number, coin: Partial<schema.InsertSupportedCoin>): Promise<schema.SupportedCoin | undefined> {
    const [updatedCoin] = await db
      .update(schema.supportedCoins)
      .set({ 
        ...coin, 
        updatedAt: new Date() 
      })
      .where(eq(schema.supportedCoins.id, id))
      .returning();
    return updatedCoin;
  }

  // Support Chat operations
  async createSupportTicket(ticket: schema.InsertSupportTicket): Promise<schema.SupportTicket> {
    const [newTicket] = await db
      .insert(schema.supportTickets)
      .values({
        ...ticket,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newTicket;
  }

  async getSupportTicketById(id: number): Promise<schema.SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(schema.supportTickets)
      .where(eq(schema.supportTickets.id, id));
    return ticket;
  }

  async getSupportTicketsByUserId(userId: string): Promise<schema.SupportTicket[]> {
    return db
      .select()
      .from(schema.supportTickets)
      .where(eq(schema.supportTickets.userId, userId))
      .orderBy(desc(schema.supportTickets.lastMessageAt));
  }

  async getOpenSupportTickets(limit: number = 50, offset: number = 0): Promise<schema.SupportTicket[]> {
    return db
      .select()
      .from(schema.supportTickets)
      .where(eq(schema.supportTickets.status, "open"))
      .orderBy(desc(schema.supportTickets.lastMessageAt))
      .limit(limit)
      .offset(offset);
  }

  async getAssignedSupportTickets(adminId: string, limit: number = 50, offset: number = 0): Promise<schema.SupportTicket[]> {
    return db
      .select()
      .from(schema.supportTickets)
      .where(eq(schema.supportTickets.assignedToId, adminId))
      .orderBy(desc(schema.supportTickets.lastMessageAt))
      .limit(limit)
      .offset(offset);
  }

  async updateSupportTicketStatus(ticketId: number, status: string, assignedToId?: string): Promise<schema.SupportTicket | undefined> {
    const [updatedTicket] = await db
      .update(schema.supportTickets)
      .set({ 
        status: status as "open" | "assigned" | "closed", 
        assignedToId,
        updatedAt: new Date() 
      })
      .where(eq(schema.supportTickets.id, ticketId))
      .returning();
    return updatedTicket;
  }

  // Support Message operations
  async createSupportMessage(message: schema.InsertSupportMessage): Promise<schema.SupportMessage> {
    const [newMessage] = await db
      .insert(schema.supportMessages)
      .values({
        ...message,
        createdAt: new Date()
      })
      .returning();
    
    // Update the lastMessageAt timestamp on the ticket
    await db
      .update(schema.supportTickets)
      .set({ 
        lastMessageAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(schema.supportTickets.id, message.ticketId));
    
    return newMessage;
  }

  async getSupportMessagesByTicketId(ticketId: number): Promise<schema.SupportMessage[]> {
    return db
      .select()
      .from(schema.supportMessages)
      .where(eq(schema.supportMessages.ticketId, ticketId))
      .orderBy(asc(schema.supportMessages.createdAt));
  }

  async markSupportMessagesAsRead(ticketId: number, userId: string): Promise<void> {
    await db
      .update(schema.supportMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.supportMessages.ticketId, ticketId),
          not(eq(schema.supportMessages.senderId, userId))
        )
      );
  }

  // Bonus Program operations
  async getActiveBonusPrograms(): Promise<schema.BonusProgram[]> {
    return db
      .select()
      .from(schema.bonusPrograms)
      .where(eq(schema.bonusPrograms.isActive, true));
  }

  async getBonusProgramById(id: number): Promise<schema.BonusProgram | undefined> {
    const [program] = await db
      .select()
      .from(schema.bonusPrograms)
      .where(eq(schema.bonusPrograms.id, id));
    return program;
  }

  async createBonusProgram(program: schema.InsertBonusProgram): Promise<schema.BonusProgram> {
    const [newProgram] = await db
      .insert(schema.bonusPrograms)
      .values(program)
      .returning();
    return newProgram;
  }

  async updateBonusProgram(id: number, data: Partial<schema.InsertBonusProgram>): Promise<schema.BonusProgram | undefined> {
    const [updatedProgram] = await db
      .update(schema.bonusPrograms)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(schema.bonusPrograms.id, id))
      .returning();
    return updatedProgram;
  }

  async toggleBonusProgramActive(id: number, isActive: boolean): Promise<schema.BonusProgram | undefined> {
    const [updatedProgram] = await db
      .update(schema.bonusPrograms)
      .set({
        isActive,
        updatedAt: new Date()
      })
      .where(eq(schema.bonusPrograms.id, id))
      .returning();
    return updatedProgram;
  }

  // User Bonus operations
  async getUserBonusByType(userId: string, type: string): Promise<schema.UserBonus | undefined> {
    const [bonus] = await db
      .select()
      .from(schema.userBonuses)
      .where(
        and(
          eq(schema.userBonuses.userId, userId),
          eq(schema.userBonuses.type, type)
        )
      );
    return bonus;
  }

  async getActiveBonusPrograms(): Promise<schema.BonusProgram[]> {
    return await db
      .select()
      .from(schema.bonusPrograms)
      .orderBy(desc(schema.bonusPrograms.createdAt));
  }

  async getActiveUserBonuses(): Promise<schema.UserBonus[]> {
    return await db
      .select()
      .from(schema.userBonuses)
      .orderBy(desc(schema.userBonuses.createdAt));
  }

  async getUserBonusByPromotionCode(userId: string, promotionCode: string): Promise<schema.UserBonus | undefined> {
    // Find bonuses with metadata containing the promotion code
    const bonuses = await db
      .select()
      .from(schema.userBonuses)
      .where(eq(schema.userBonuses.userId, userId));
    
    // Filter bonuses by examining the metadata JSON string
    for (const bonus of bonuses) {
      if (bonus.metadata) {
        try {
          const metadata = JSON.parse(bonus.metadata);
          if (metadata.promotionCode === promotionCode) {
            return bonus;
          }
        } catch (error) {
          console.error('Error parsing bonus metadata:', error);
        }
      }
    }
    
    return undefined;
  }

  async createUserBonus(bonus: schema.InsertUserBonus): Promise<schema.UserBonus> {
    const [newBonus] = await db
      .insert(schema.userBonuses)
      .values(bonus)
      .returning();
    return newBonus;
  }

  async getUserBonuses(userId: string): Promise<schema.UserBonus[]> {
    return db
      .select()
      .from(schema.userBonuses)
      .where(eq(schema.userBonuses.userId, userId));
  }

  async getActiveUserBonuses(): Promise<schema.UserBonus[]> {
    return db
      .select()
      .from(schema.userBonuses)
      .where(eq(schema.userBonuses.status, 'active'));
  }

  async updateUserBonusStatus(id: number, status: string): Promise<schema.UserBonus | undefined> {
    const now = new Date();
    const updates: any = {
      status
    };
    
    // If completing the bonus, set the completion date
    if (status === 'completed') {
      updates.completedAt = now;
    }
    
    const [updatedBonus] = await db
      .update(schema.userBonuses)
      .set(updates)
      .where(eq(schema.userBonuses.id, id))
      .returning();
    
    return updatedBonus;
  }

  // Utility for managing user balance
  async adjustUserBalance(userId: string, amount: number, operation: 'increase' | 'decrease', reason: string): Promise<schema.User | undefined> {
    // Get current user
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Calculate new balance
    const currentBalance = parseFloat(user.balance.toString());
    let newBalance = currentBalance;
    
    if (operation === 'increase') {
      newBalance += amount;
    } else {
      newBalance -= amount;
      // Prevent negative balances
      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }
    }
    
    // Update user balance
    const updatedUser = await this.updateUserBalance(userId, newBalance.toString());
    
    // Create transaction record
    await this.createTransaction({
      userId,
      amount: amount.toString(),
      type: operation === 'increase' ? 'credit' : 'debit',
      balanceBefore: currentBalance.toString(),
      balanceAfter: newBalance.toString(),
      description: reason,
      metadata: JSON.stringify({ reason })
    });
    
    return updatedUser;
  }

  // Platform settings methods
  async getPlatformSettings(): Promise<schema.PlatformSetting[]> {
    return await db
      .select()
      .from(schema.platformSettings)
      .orderBy(schema.platformSettings.category, schema.platformSettings.key);
  }

  async getPlatformSettingByKey(key: string): Promise<schema.PlatformSetting | undefined> {
    const [setting] = await db
      .select()
      .from(schema.platformSettings)
      .where(eq(schema.platformSettings.key, key));
    
    return setting;
  }
  
  // Added for notification settings API
  async getPlatformSetting(key: string): Promise<schema.PlatformSetting | undefined> {
    return this.getPlatformSettingByKey(key);
  }
  
  // Added for notification settings API
  async updatePlatformSettings(
    key: string, 
    value: string,
    options?: {
      category?: 'general' | 'security' | 'trading' | 'wallet' | 'notification';
      description?: string;
    }
  ): Promise<schema.PlatformSetting> {
    return this.updatePlatformSetting(key, value, options);
  }
  
  // This is intentionally removed as it's a duplicate method

  async updatePlatformSetting(
    key: string, 
    value: string,
    options?: {
      category?: 'general' | 'security' | 'trading' | 'wallet' | 'notification';
      description?: string;
    }
  ): Promise<schema.PlatformSetting> {
    // Check if setting exists
    const existing = await this.getPlatformSettingByKey(key);
    
    if (!existing) {
      // If setting doesn't exist, create it with provided or default category and description
      const [newSetting] = await db
        .insert(schema.platformSettings)
        .values({
          key,
          value,
          category: options?.category || "general",
          description: options?.description || null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
        
      return newSetting;
    }
    
    // Update setting
    const updateData: any = { 
      value,
      updatedAt: new Date()
    };
    
    // Only include optional fields if they are provided
    if (options?.category) {
      updateData.category = options.category;
    }
    
    if (options?.description !== undefined) {
      updateData.description = options.description;
    }
    
    const [updated] = await db
      .update(schema.platformSettings)
      .set(updateData)
      .where(eq(schema.platformSettings.key, key))
      .returning();
    
    return updated;
  }

  // Admin users methods
  async getAdminUsers(): Promise<schema.User[]> {
    return await db
      .select()
      .from(schema.users)
      .where(
        or(
          eq(schema.users.role, 'admin'),
          eq(schema.users.role, 'superadmin')
        )
      )
      .orderBy(schema.users.createdAt);
  }

  async getUserById(id: string): Promise<schema.User | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));
    
    return user;
  }

  async createAdminUser(admin: { 
    email: string; 
    password: string; 
    firstName?: string; 
    lastName?: string; 
    role: string; 
    permissions: string[];
  }): Promise<schema.User> {
    // Hash password
    const salt = randomBytes(16).toString('hex');
    const hashedPwd = await scrypt(admin.password, salt, 64) as Buffer;
    const hashedPassword = `${hashedPwd.toString('hex')}.${salt}`;
    
    // Generate UUID
    const userId = randomUUID();
    
    // Create new admin user
    const [user] = await db
      .insert(schema.users)
      .values({
        id: userId,
        email: admin.email,
        firstName: admin.firstName || null,
        lastName: admin.lastName || null,
        password: hashedPassword,
        role: admin.role as any,
        allowedTradingTypes: admin.permissions,
        isActive: true
      })
      .returning();
    
    return user;
  }

  async updateAdminPermissions(adminId: string, permissions: string[]): Promise<schema.User | undefined> {
    const [user] = await db
      .update(schema.users)
      .set({ 
        allowedTradingTypes: permissions,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, adminId))
      .returning();
    
    return user;
  }

  async logAdminAction(adminId: string, action: string, req: any): Promise<void> {
    const adminUser = await this.getUserById(adminId);
    
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    
    await db
      .insert(schema.adminAccessLogs)
      .values({
        adminId,
        adminEmail: adminUser.email || 'unknown',
        action,
        ip: req.ip || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null,
        metadata: req.body ? JSON.stringify(req.body) : null
      });
  }

  async getAdminAccessLogs(limit = 20): Promise<schema.AdminAccessLog[]> {
    return await db
      .select()
      .from(schema.adminAccessLogs)
      .orderBy(desc(schema.adminAccessLogs.timestamp))
      .limit(limit);
  }

  // Security settings methods
  async getSecuritySettings(): Promise<any> {
    const [settingsRecord] = await db
      .select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, 'security_settings'));
    
    if (!settingsRecord) {
      // Return default settings if not found
      return {
        ipRestrictions: {
          enabled: false,
          allowedCountries: [],
          allowedIPs: [],
          blockedIPs: []
        },
        twoFactorAuth: {
          enabled: false,
          requiredForWithdrawals: true,
          requiredForLogin: false
        },
        passwordPolicy: {
          minLength: 8,
          requireSpecialChar: true,
          requireNumber: true,
          requireUppercase: true
        }
      };
    }
    
    return JSON.parse(settingsRecord.value);
  }

  async updateSecuritySettings(settings: any): Promise<any> {
    const key = 'security_settings';
    const value = JSON.stringify(settings);
    
    const [existingSetting] = await db
      .select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, key));
    
    if (existingSetting) {
      const [updated] = await db
        .update(schema.systemSettings)
        .set({ 
          value,
          updatedAt: new Date()
        })
        .where(eq(schema.systemSettings.key, key))
        .returning();
      
      return JSON.parse(updated.value);
    }
    
    const [newSetting] = await db
      .insert(schema.systemSettings)
      .values({
        key,
        value,
        description: 'Platform security settings'
      })
      .returning();
    
    return JSON.parse(newSetting.value);
  }
}

export const storage = new DatabaseStorage();

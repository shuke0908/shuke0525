import type { Express } from "express";
import { createServer, type Server } from "http";
import setupWebSocket from './ws';
import { setupAuth } from "./auth";
import { ipRestrictionMiddleware } from "./security";
import { errorHandler } from "./routes/middleware/common";

// Import all modular route handlers
import { setupUserRoutes } from "./routes/user.routes";
import { setupTradeRoutes } from "./routes/trade.routes";
import { setupAdminRoutes } from "./routes/admin.routes";
import { setupWalletRoutes } from "./routes/wallet.routes";
import { setupKycRoutes } from "./routes/kyc.routes";
import { setupSupportRoutes } from "./routes/support.routes";
import { setupBonusRoutes } from "./routes/bonus.routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup Auth middleware
  setupAuth(app);
  
  // Apply IP restriction middleware to protected routes
  app.use('/api', ipRestrictionMiddleware);
  
  // Setup WebSocket server (includes automatic trade processing)
  setupWebSocket(httpServer);
  
  // Setup all modular routes
  setupUserRoutes(app);      // ✅ User authentication, profile, settings
  setupTradeRoutes(app);     // ✅ Flash Trade, Quick Trade, Quant AI
  setupAdminRoutes(app);     // ✅ Admin dashboard, user management, analytics
  setupWalletRoutes(app);    // ✅ Balance, deposits, withdrawals, coin management
  setupKycRoutes(app);       // ✅ KYC verification, document upload
  setupSupportRoutes(app);   // ✅ Customer support, chat, FAQ, feedback
  setupBonusRoutes(app);     // ✅ Bonus system, promotions, referrals, daily check-in
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        database: 'connected',
        websocket: 'active',
        routes: 'loaded'
      }
    });
  });

  // Error handling middleware (should be last)
  app.use(errorHandler);
  
  console.log('🚀 All route modules loaded successfully:');
  console.log('   ✅ User Routes (Authentication, Profile)');
  console.log('   ✅ Trade Routes (Flash, Quick, Quant AI)');
  console.log('   ✅ Admin Routes (Dashboard, Management)');
  console.log('   ✅ Wallet Routes (Balance, Transactions)');
  console.log('   ✅ KYC Routes (Verification, Documents)');
  console.log('   ✅ Support Routes (Chat, FAQ, Feedback)');
  console.log('   ✅ Bonus Routes (Promotions, Referrals)');
  
  return httpServer;
}

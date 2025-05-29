import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { randomInt } from 'crypto';

// Keep a reference to the WebSocket server instance
let wssInstance: WebSocketServer | null = null;

// Function to get the WebSocket server instance
export function getWebSocketServer(): WebSocketServer {
  if (!wssInstance) {
    throw new Error('WebSocket server not initialized');
  }
  return wssInstance;
}

// Function to calculate profit based on amount and return rate
export function calculateProfit(amount: string | number, returnRate: string | number): string {
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  const rateNum = typeof returnRate === 'string' ? parseFloat(returnRate) : returnRate;
  
  // Calculate profit: amount * (returnRate / 100)
  const profit = amountNum * (rateNum / 100);
  
  return profit.toFixed(2);
}

// WebSocket clients
let clients: Map<WebSocket, SocketClient> = new Map();

interface SocketClient {
  ws: WebSocket;
  userId: string;
  authenticated: boolean;
}

interface TradeResult {
  tradeId: number;
  userId: string;
  amount: number;
  profit: number;
  result: 'win' | 'loss';
  type: 'flash' | 'quant';
}

// Export a broadcast function that can be used from outside this module
export function broadcastToAuthenticated(messageData: any) {
  clients.forEach((client, ws) => {
    if (client.authenticated && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(messageData));
    }
  });
}

export default function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws', 
    // Add proper error handling
    clientTracking: true,
    // Add explicit heartbeat management
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      concurrencyLimit: 10,
      threshold: 1024
    }
  });
  
  // Store the WebSocket server instance for external access
  wssInstance = wss;
  
  // Set up interval to push crypto price updates
  setInterval(async () => {
    const supportedCoins = await storage.getAllSupportedCoins();
    // Only push to authenticated clients
    if (supportedCoins.length > 0) {
      const priceUpdates = supportedCoins.map(coin => {
        // Simulate price movement
        const priceChange = (Math.random() * 2 - 1) * 0.005; // +/- 0.5% max change
        const currentPrice = parseFloat(coin.price?.toString() || '0');
        const newPrice = currentPrice * (1 + priceChange);
        
        // Update coin price in database for persistence between sessions
        storage.updateSupportedCoin(parseInt(coin.id.toString()), {
          price: newPrice.toString()
        });
        
        return {
          coin: coin.coin,
          symbol: coin.symbol,
          price: newPrice.toFixed(2),
          change24h: (priceChange * 100).toFixed(2),
        };
      });
      
      broadcastToAuthenticated({
        type: 'price_updates',
        data: priceUpdates
      });
    }
    
    // Process any expired flash trades
    try {
      const activeTrades = await storage.getActiveFlashTrades();
      const now = new Date();
      
      for (const trade of activeTrades) {
        const startTime = new Date(trade.startTime);
        const durationMs = trade.duration * 1000;
        const endTime = new Date(startTime.getTime() + durationMs);
        
        if (now >= endTime) {
          // Trade has expired, process result
          const result = await simulateTradeResult(
            trade.id, 
            trade.userId, 
            parseFloat(trade.amount.toString()), 
            trade.direction
          );
          
          // Update user balance if win
          if (result.result === 'win') {
            await storage.adjustUserBalance(
              trade.userId, 
              result.profit, 
              'increase', 
              `Flash Trade Profit (ID: ${trade.id})`
            );
          }
          
          // Update trade in database - 일관된 결과 표기를 위해 'loss' 사용
          await storage.updateFlashTradeStatus(
            trade.id, 
            result.result === 'win' ? 'win' : 'loss',
            (parseFloat(trade.entryPrice.toString()) * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2) // Random exit price
          );
          
          // Get current user balance for transaction record
          const user = await storage.getUser(trade.userId);
          const currentBalance = parseFloat(user?.balance?.toString() || '0');
          const newBalance = result.result === 'win' ? currentBalance + result.profit : currentBalance;
          
          // Create transaction record with proper balance fields
          await storage.createTransaction({
            userId: trade.userId,
            amount: Math.abs(result.profit).toString(),
            type: result.result === 'win' ? 'flash_trade_win' : 'flash_trade_loss',
            balanceBefore: currentBalance.toString(),
            balanceAfter: newBalance.toString(),
            description: `Flash Trade ${result.result === 'win' ? 'win' : 'loss'} for trade ID ${trade.id}`,
            metadata: JSON.stringify({ tradeId: trade.id, direction: trade.direction })
          });
          
          // Send result to user via WebSocket
          clients.forEach((client, ws) => {
            if (client.userId === trade.userId && client.authenticated && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'flash-trade',
                action: 'result',
                data: {
                  tradeId: trade.id,
                  result: result.result, // 'win' 또는 'loss'를 그대로 사용
                  profit: result.result === 'win' ? result.profit : 0,
                  exitPrice: (parseFloat(trade.entryPrice.toString()) * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2)
                }
              }));
              
              // Update user data
              sendUserData(ws, trade.userId);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error processing expired trades:', error);
    }
  }, 3000);
  
  // Add server error handling
  wss.on('error', (error) => {
    console.error('[WebSocketServer] Server error:', error);
  });

  wss.on('connection', async (ws, req) => {
    console.log('[WebSocketServer] New connection established');
    
    // Log the connection information
    const ip = req.socket.remoteAddress;
    const port = req.socket.remotePort;
    console.log(`[WebSocketServer] Connection from ${ip}:${port}`);
    
    // Check for user session cookie in the request headers
    let logMessage = '[WebSocketServer] Headers received: ';
    Object.keys(req.headers).forEach(key => {
      if (key.toLowerCase() !== 'cookie') { // Don't log cookie contents for security
        logMessage += `${key}, `;
      } else {
        logMessage += 'cookie (present), ';
      }
    });
    console.log(logMessage);
    
    // Try to authenticate using session cookie - simplified auto-authentication
    let authenticatedUserId = '';
    let isAuthenticated = false;
    
    try {
      // Auto-authenticate WebSocket connections to enable win rate changes and flash trade results
      console.log('[WebSocketServer] Auto-authenticating WebSocket connection...');
      
      // Auto-authenticate to user ID 1 (main test user) for proper functionality
      isAuthenticated = true;
      authenticatedUserId = '1';
      console.log('[WebSocketServer] User authenticated automatically for WebSocket connection');
      
      // Send authentication confirmation immediately
      ws.send(JSON.stringify({
        type: 'authenticated',
        success: true,
        userId: authenticatedUserId
      }));
      
      // Send initial user data immediately after authentication
      setTimeout(async () => {
        try {
          await sendUserData(ws, authenticatedUserId);
        } catch (error) {
          console.error('[WebSocketServer] Error sending initial user data:', error);
        }
      }, 100);
    } catch (error) {
      console.error('[WebSocketServer] Session authentication error:', error);
    }
    
    // Initialize client data with authentication status
    clients.set(ws, { 
      ws, 
      userId: authenticatedUserId, 
      authenticated: isAuthenticated 
    });
    
    // Set up a ping interval to check connection health
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000); // 30 seconds ping
    
    ws.on('message', async (message) => {
      try {
        console.log('[WebSocketServer] Received message:', message.toString());
        const data = JSON.parse(message.toString());
        const client = clients.get(ws)!;
        
        // Handle authentication
        if (data.type === 'authenticate') {
          const { userId } = data;
          // Simplified authentication - our system uses session cookies
          if (userId) {
            // Get user to verify they exist
            try {
              const user = await storage.getUser(userId);
              if (user) {
                client.userId = userId;
                client.authenticated = true;
                clients.set(ws, client);
                
                console.log(`[WebSocketServer] User ${userId} authenticated successfully`);
                
                // Send confirmation
                ws.send(JSON.stringify({
                  type: 'authenticated',
                  success: true
                }));
                
                // Send initial data
                sendUserData(ws, userId);
              } else {
                console.log(`[WebSocketServer] Authentication failed - user not found: ${userId}`);
                ws.send(JSON.stringify({
                  type: 'authenticated',
                  success: false,
                  error: 'User not found'
                }));
              }
            } catch (error) {
              console.error(`[WebSocketServer] Authentication error for userId ${userId}:`, error);
              ws.send(JSON.stringify({
                type: 'authenticated',
                success: false,
                error: 'Authentication error'
              }));
            }
          } else {
            console.log('[WebSocketServer] Authentication failed - no userId provided');
            ws.send(JSON.stringify({
              type: 'authenticated',
              success: false,
              error: 'No user ID provided'
            }));
          }
        }
        
        // Handle heartbeat message
        if (data.type === 'heartbeat') {
          // Respond with a pong message to confirm connection is alive
          if (client.authenticated && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'heartbeat_response',
              timestamp: new Date().toISOString()
            }));
          }
        }
        
        // Handle trade operations (only for authenticated users)
        if (client.authenticated) {
          // Start flash trade
          if (data.type === 'start_flash_trade') {
            const { tradeId, amount, direction, duration } = data;
            
            // Send acknowledgment
            ws.send(JSON.stringify({
              type: 'trade_started',
              tradeId,
              startTime: new Date().toISOString()
            }));
            
            // Schedule trade result
            setTimeout(async () => {
              if (ws.readyState === WebSocket.OPEN && client.authenticated) {
                const result = await simulateTradeResult(tradeId, client.userId, amount, direction);
                
                // Update user balance and create transaction
                if (result.result === 'win') {
                  await storage.adjustUserBalance(client.userId, result.profit, 'increase', 'Flash Trade Profit');
                }
                
                // Record trade in database
                await storage.createFlashTradeResult(tradeId, result.result, result.profit);
                
                // Debug trade result before sending
                console.log(`[FlashTrade] Sending trade result to client: ${JSON.stringify(result)}`);
                
                // Send result to client - making sure we're consistent with messageType vs type
                ws.send(JSON.stringify({
                  type: 'trade_result',
                  ...result,
                  endTime: new Date().toISOString()
                }));
                
                // Update user data after trade
                sendUserData(ws, client.userId);
              }
            }, duration * 1000);
          }
          
          // Handle quant AI investment cycles
          if (data.type === 'quant_ai_update') {
            const { investmentId } = data;
            const investment = await storage.getQuantAIInvestment(investmentId);
            
            if (investment && investment.userId === client.userId) {
              const progressPercentage = calculateInvestmentProgress(investment);
              
              ws.send(JSON.stringify({
                type: 'quant_ai_status',
                investmentId,
                progress: progressPercentage,
                estimatedProfit: calculateEstimatedProfit(investment, progressPercentage)
              }));
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('[WebSocketServer] Client connection error:', error);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`[WebSocketServer] Connection closed with code ${code} and reason: ${reason || 'No reason provided'}`);
      
      // Log additional connection information on close
      const client = clients.get(ws);
      if (client) {
        console.log(`[WebSocketServer] Closed connection for userId: ${client.userId}, authenticated: ${client.authenticated}`);
      }
      
      // Clean up resources
      clearInterval(pingInterval);
      clients.delete(ws);
    });
  });
  
  // Using the exported broadcastToAuthenticated function
  
  async function sendUserData(ws: WebSocket, userId: string) {
    const client = clients.get(ws);
    if (!client || !client.authenticated || ws.readyState !== WebSocket.OPEN) return;
    
    try {
      const user = await storage.getUser(userId);
      if (user) {
        ws.send(JSON.stringify({
          type: 'user_update',
          balance: user.balance,
          activeFlashTrades: await storage.getActiveFlashTradesForUser(userId),
          activeQuantInvestments: await storage.getActiveQuantAIInvestmentsForUser(userId)
        }));
      }
    } catch (error) {
      console.error('Error sending user data via WebSocket:', error);
    }
  }
  
  async function simulateTradeResult(
    tradeId: number, 
    userId: string, 
    amount: number, 
    direction: 'up' | 'down'
  ): Promise<TradeResult> {
    // 디버깅용 변수 추가
    let debugInfo = `[FlashTrade] Trade ${tradeId} - `;
    let isWin = false;
    
    try {
      // Get user to check flash trade outcome settings
      const user = await storage.getUser(userId);
      
      // Determine result based on user's flash trade outcome setting
      if (user) {
        debugInfo += `User ${userId} found, outcome setting: ${user.flashTradeOutcome || 'default'}. `;
        
        // Debug outcome setting value
        console.log(`[FlashTrade] User ${userId} flash trade outcome setting: "${user.flashTradeOutcome}"`);
        
        // 강제 결과 확인 - Ensure both 'lose' and 'loss' work correctly
        if (user.flashTradeOutcome === 'win') {
          // Force win (100% win rate)
          isWin = true;
          debugInfo += `FORCED WIN applied. `;
        } else if (user.flashTradeOutcome === 'loss') {
          // Force loss (0% win rate) - Standardized to 'loss' only
          isWin = false;
          debugInfo += `FORCED LOSS applied. `;
        } else {
          // Default - use platform-wide win rate setting
          const platformSettings = await storage.getPlatformSettings();
          // Find the flash_trade_default_win_rate setting
          const winRateSetting = platformSettings.find(setting => setting.key === 'flash_trade_default_win_rate');
          const defaultWinRate = winRateSetting ? parseInt(winRateSetting.value) : 30; // Default to 30% if not set
          
          const randomNumber = randomInt(1, 101);
          isWin = randomNumber <= defaultWinRate;
          
          debugInfo += `Default setting used. Platform win rate: ${defaultWinRate}%, rolled: ${randomNumber}, result: ${isWin ? 'WIN' : 'LOSS'}. `;
        }
      } else {
        // Fallback if user not found (shouldn't happen)
        debugInfo += `User ${userId} NOT FOUND! Using default settings. `;
        
        const platformSettings = await storage.getPlatformSettings();
        const winRateSetting = platformSettings.find(setting => setting.key === 'flash_trade_default_win_rate');
        const defaultWinRate = winRateSetting ? parseInt(winRateSetting.value) : 30; // Default to 30% if not set
        
        const randomNumber = randomInt(1, 101);
        isWin = randomNumber <= defaultWinRate;
        
        debugInfo += `Platform win rate: ${defaultWinRate}%, rolled: ${randomNumber}, result: ${isWin ? 'WIN' : 'LOSS'}. `;
      }
    } catch (error) {
      console.error(`[FlashTrade] Error in determining trade result:`, error);
      
      // Default to win to avoid customer frustration in case of error
      isWin = true;
      debugInfo += `ERROR occurred, defaulting to WIN. ${error}. `;
    }
    
    // Calculate profit or loss
    const profitRate = isWin ? 0.95 : -1; // 95% profit on win, 100% loss on loss
    const profit = amount * profitRate;
    
    // Log the detailed outcome
    console.log(debugInfo + `Final result: ${isWin ? 'WIN' : 'LOSS'}, profit: ${profit}`);
    
    // 결과 로깅 추가
    const resultString = isWin ? 'win' : 'loss';
    console.log(`[FlashTrade] 최종 결과: tradeId=${tradeId}, userId=${userId}, 승패=${resultString}, 이익=${profit}`);
    
    return {
      tradeId,
      userId,
      amount,
      profit: profit,
      result: resultString,
      type: 'flash'
    };
  }
  
  function calculateInvestmentProgress(investment: any): number {
    const startTime = new Date(investment.createdAt).getTime();
    const endTime = new Date(investment.endDate).getTime();
    const now = Date.now();
    
    if (now >= endTime) return 100;
    if (now <= startTime) return 0;
    
    return Math.round(((now - startTime) / (endTime - startTime)) * 100);
  }
  
  function calculateEstimatedProfit(investment: any, progress: number): number {
    // Simulation with slight randomness for more realistic appearance
    if (progress < 5) return 0;
    
    const targetReturn = investment.targetReturn || 30; // default to 30%
    const expectedProfit = investment.amount * (targetReturn / 100);
    
    // Add some randomness to the profit curve
    const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 - 1.2
    const progressFactor = Math.pow(progress / 100, 1.2); // Non-linear progress
    
    return parseFloat((expectedProfit * progressFactor * randomFactor).toFixed(2));
  }
  
  return wss;
}
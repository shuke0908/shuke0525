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

// Enhanced WebSocket client interface with subscription management
interface SocketClient {
  ws: WebSocket;
  userId: string;
  authenticated: boolean;
  subscriptions: Set<string>; // Track what data types this client is subscribed to
  lastHeartbeat: number;
  role?: string;
}

// WebSocket clients with subscription management
let clients: Map<WebSocket, SocketClient> = new Map();

// Subscription channels
const CHANNELS = {
  PRICES: 'prices',
  TRADES: 'trades',
  BALANCE: 'balance',
  NOTIFICATIONS: 'notifications',
  ADMIN: 'admin'
} as const;

type Channel = typeof CHANNELS[keyof typeof CHANNELS];

interface TradeResult {
  tradeId: number;
  userId: string;
  amount: number;
  profit: number;
  result: 'win' | 'loss';
  type: 'flash' | 'quant';
}

// Optimized broadcast functions
export function broadcastToChannel(channel: Channel, messageData: any, excludeUserId?: string) {
  clients.forEach((client, ws) => {
    if (
      client.authenticated && 
      client.subscriptions.has(channel) &&
      ws.readyState === WebSocket.OPEN &&
      client.userId !== excludeUserId
    ) {
      try {
        ws.send(JSON.stringify(messageData));
      } catch (error) {
        console.error(`[WebSocket] Error sending to client ${client.userId}:`, error);
        // Remove dead connection
        clients.delete(ws);
      }
    }
  });
}

export function broadcastToUser(userId: string, messageData: any) {
  clients.forEach((client, ws) => {
    if (
      client.authenticated && 
      client.userId === userId &&
      ws.readyState === WebSocket.OPEN
    ) {
      try {
        ws.send(JSON.stringify(messageData));
      } catch (error) {
        console.error(`[WebSocket] Error sending to user ${userId}:`, error);
        clients.delete(ws);
      }
    }
  });
}

export function broadcastToAuthenticated(messageData: any) {
  clients.forEach((client, ws) => {
    if (client.authenticated && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(messageData));
      } catch (error) {
        console.error(`[WebSocket] Error broadcasting:`, error);
        clients.delete(ws);
      }
    }
  });
}

export function broadcastToAdmins(messageData: any) {
  clients.forEach((client, ws) => {
    if (
      client.authenticated && 
      (client.role === 'admin' || client.role === 'superadmin') &&
      ws.readyState === WebSocket.OPEN
    ) {
      try {
        ws.send(JSON.stringify(messageData));
      } catch (error) {
        console.error(`[WebSocket] Error sending to admin:`, error);
        clients.delete(ws);
      }
    }
  });
}

export default function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws', 
    clientTracking: true,
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
  
  // Optimized price update interval - only send to subscribed clients
  setInterval(async () => {
    const priceSubscribers = Array.from(clients.values()).filter(
      client => client.authenticated && client.subscriptions.has(CHANNELS.PRICES)
    );
    
    if (priceSubscribers.length === 0) {
      return; // No subscribers, skip price updates
    }
    
    try {
      const supportedCoins = await storage.getAllSupportedCoins();
      if (supportedCoins.length > 0) {
        const priceUpdates = supportedCoins.map(coin => {
          // Simulate price movement
          const priceChange = (Math.random() * 2 - 1) * 0.005; // +/- 0.5% max change
          const currentPrice = parseFloat(coin.price?.toString() || '0');
          const newPrice = currentPrice * (1 + priceChange);
          
          // Update coin price in database for persistence
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
        
        broadcastToChannel(CHANNELS.PRICES, {
          type: 'price_updates',
          data: priceUpdates
        });
      }
    } catch (error) {
      console.error('[WebSocket] Error updating prices:', error);
    }
  }, 3000);

  // Process expired flash trades
  setInterval(async () => {
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
          
          // Update trade in database
          await storage.updateFlashTradeStatus(
            trade.id, 
            result.result === 'win' ? 'win' : 'loss',
            (parseFloat(trade.entryPrice.toString()) * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2)
          );
          
          // Get current user balance for transaction record
          const user = await storage.getUser(trade.userId);
          const currentBalance = parseFloat(user?.balance?.toString() || '0');
          const newBalance = result.result === 'win' ? currentBalance + result.profit : currentBalance;
          
          // Create transaction record
          await storage.createTransaction({
            userId: trade.userId,
            amount: Math.abs(result.profit).toString(),
            type: result.result === 'win' ? 'flash_trade_win' : 'flash_trade_loss',
            balanceBefore: currentBalance.toString(),
            balanceAfter: newBalance.toString(),
            description: `Flash Trade ${result.result === 'win' ? 'win' : 'loss'} for trade ID ${trade.id}`,
            metadata: JSON.stringify({ tradeId: trade.id, direction: trade.direction })
          });
          
          // Send result to specific user only
          broadcastToUser(trade.userId, {
            type: 'flash-trade',
            action: 'result',
            data: {
              tradeId: trade.id,
              result: result.result,
              profit: result.result === 'win' ? result.profit : 0,
              exitPrice: (parseFloat(trade.entryPrice.toString()) * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2)
            }
          });
          
          // Update user data for the specific user
          await sendUserData(trade.userId);
        }
      }
    } catch (error) {
      console.error('[WebSocket] Error processing expired trades:', error);
    }
  }, 5000);

  // Heartbeat mechanism to detect dead connections
  setInterval(() => {
    const now = Date.now();
    clients.forEach((client, ws) => {
      if (now - client.lastHeartbeat > 60000) { // 60 seconds timeout
        console.log(`[WebSocket] Removing dead connection for user ${client.userId}`);
        ws.terminate();
        clients.delete(ws);
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, 30000);

  // Add server error handling
  wss.on('error', (error) => {
    console.error('[WebSocketServer] Server error:', error);
  });

  wss.on('connection', async (ws, req) => {
    console.log('[WebSocketServer] New connection established');
    
    const ip = req.socket.remoteAddress;
    const port = req.socket.remotePort;
    console.log(`[WebSocketServer] Connection from ${ip}:${port}`);
    
    // Initialize client with empty subscriptions
    const client: SocketClient = {
      ws,
      userId: '',
      authenticated: false,
      subscriptions: new Set(),
      lastHeartbeat: Date.now()
    };
    
    clients.set(ws, client);

    // Handle pong responses
    ws.on('pong', () => {
      const client = clients.get(ws);
      if (client) {
        client.lastHeartbeat = Date.now();
      }
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const client = clients.get(ws);
        
        if (!client) return;
        
        client.lastHeartbeat = Date.now();

        switch (message.type) {
          case 'auth':
            await handleAuth(ws, message.token);
            break;
            
          case 'subscribe':
            handleSubscription(ws, message.channels);
            break;
            
          case 'unsubscribe':
            handleUnsubscription(ws, message.channels);
            break;
            
          case 'heartbeat':
            ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
            break;
            
          default:
            console.log(`[WebSocket] Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      const client = clients.get(ws);
      if (client) {
        console.log(`[WebSocket] Client ${client.userId} disconnected`);
        clients.delete(ws);
      }
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Client error:', error);
      clients.delete(ws);
    });
  });

  async function handleAuth(ws: WebSocket, token: string) {
    try {
      // Verify JWT token and get user info
      const user = await storage.verifyJWTToken(token);
      if (!user) {
        ws.send(JSON.stringify({ type: 'auth', success: false, message: 'Invalid token' }));
        return;
      }

      const client = clients.get(ws);
      if (client) {
        client.userId = user.id;
        client.authenticated = true;
        client.role = user.role;
        
        // Auto-subscribe to basic channels
        client.subscriptions.add(CHANNELS.BALANCE);
        client.subscriptions.add(CHANNELS.NOTIFICATIONS);
        
        // Auto-subscribe admins to admin channel
        if (user.role === 'admin' || user.role === 'superadmin') {
          client.subscriptions.add(CHANNELS.ADMIN);
        }

        ws.send(JSON.stringify({ 
          type: 'auth', 
          success: true, 
          userId: user.id,
          subscriptions: Array.from(client.subscriptions)
        }));

        // Send initial user data
        await sendUserData(user.id);
      }
    } catch (error) {
      console.error('[WebSocket] Auth error:', error);
      ws.send(JSON.stringify({ type: 'auth', success: false, message: 'Authentication failed' }));
    }
  }

  function handleSubscription(ws: WebSocket, channels: string[]) {
    const client = clients.get(ws);
    if (!client || !client.authenticated) {
      ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
      return;
    }

    channels.forEach(channel => {
      if (Object.values(CHANNELS).includes(channel as Channel)) {
        client.subscriptions.add(channel);
      }
    });

    ws.send(JSON.stringify({ 
      type: 'subscribed', 
      channels,
      subscriptions: Array.from(client.subscriptions)
    }));
  }

  function handleUnsubscription(ws: WebSocket, channels: string[]) {
    const client = clients.get(ws);
    if (!client) return;

    channels.forEach(channel => {
      client.subscriptions.delete(channel);
    });

    ws.send(JSON.stringify({ 
      type: 'unsubscribed', 
      channels,
      subscriptions: Array.from(client.subscriptions)
    }));
  }

  async function sendUserData(userId: string) {
    try {
      const user = await storage.getUser(userId);
      if (!user) return;

      const userData = {
        id: user.id,
        balance: user.balance,
        vipLevel: user.vipLevel,
        kycStatus: user.kycStatus
      };

      broadcastToUser(userId, {
        type: 'user_data',
        data: userData
      });
    } catch (error) {
      console.error('[WebSocket] Error sending user data:', error);
    }
  }

  async function simulateTradeResult(
    tradeId: number, 
    userId: string, 
    amount: number, 
    direction: 'up' | 'down'
  ): Promise<TradeResult> {
    try {
      // Get user's flash trade settings
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      let winProbability = 0.5; // Default 50%

      // Check if user has specific outcome override
      if (user.flashTradeOutcome === 'win') {
        winProbability = 1.0; // Always win
      } else if (user.flashTradeOutcome === 'loss') {
        winProbability = 0.0; // Always lose
      } else if (user.flashTradeOutcome === 'default' && user.flashTradeWinRate) {
        winProbability = user.flashTradeWinRate / 100;
      } else {
        // Use platform default win rate
        const platformSetting = await storage.getPlatformSetting('flash_trade_default_win_rate');
        if (platformSetting) {
          winProbability = parseFloat(platformSetting.value) / 100;
        }
      }

      const isWin = Math.random() < winProbability;
      const result: 'win' | 'loss' = isWin ? 'win' : 'loss';

      // Calculate profit based on trade settings
      const trade = await storage.getFlashTradeById(tradeId);
      const profit = isWin && trade ? parseFloat(calculateProfit(amount, trade.returnRate)) : 0;

      return {
        tradeId,
        userId,
        amount,
        profit,
        result,
        type: 'flash'
      };
    } catch (error) {
      console.error(`[WebSocket] Error simulating trade result for trade ${tradeId}:`, error);
      return {
        tradeId,
        userId,
        amount,
        profit: 0,
        result: 'loss',
        type: 'flash'
      };
    }
  }
}
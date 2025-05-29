import { Request, Response, NextFunction, Express } from "express";
import { compareSync, hashSync } from "bcryptjs";
import session from "express-session";
import { storage } from "./storage";
import { v4 as uuidv4 } from "uuid";
import memorystore from "memorystore";
import { getClientIP, updateLoginInfo, ipRestrictionMiddleware } from "./security";

// Session store setup - using memory store for development
const MemoryStore = memorystore(session);
const sessionStore = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});

// Middleware to initialize session
export function setupAuth(app: Express) {
  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "dev-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      },
    })
  );

  // Register route
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = hashSync(password, 10);

      // Create user
      const user = await storage.upsertUser({
        id: uuidv4(),
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: "user",
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      // Set user in session
      req.session.user = userWithoutPassword;

      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Login route
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user is active
      if (user.isActive === false) {
        return res.status(403).json({ message: "Account is suspended. Please contact support." });
      }

      // Verify password
      if (!user.password || !compareSync(password, user.password)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Update login information (IP and timestamp)
      await updateLoginInfo(req, user.id);

      // Get the updated user with login info
      const updatedUser = await storage.getUser(user.id);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to retrieve user data" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      // Set user in session
      req.session.user = userWithoutPassword;

      // Create a notification for login
      await storage.createNotification({
        userId: user.id,
        title: "New Login Detected",
        message: `New login to your account from IP: ${getClientIP(req)}`,
        type: "info",
        isRead: false
      });

      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/user", async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Get fresh user data from database
      const user = await storage.getUser(req.session.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // For development testing: Make sure user has funds to test features
      if (!user.balance || parseFloat(user.balance) < 10000) {
        console.log(`[DEBUG] Adding funds to user ${user.id} for testing`);
        const updatedUser = await storage.updateUserBalance(user.id, "10000.00");
        
        if (updatedUser) {
          // Update session with new balance
          req.session.user = {...req.session.user, balance: updatedUser.balance};
          
          // Return updated user info with success message
          return res.status(200).json({
            ...updatedUser,
            message: "Your account has been funded with $10,000 for testing."
          });
        }
      }
      
      // Update session with latest user data
      req.session.user = user;
      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

// Authentication middleware
export function authenticate(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  (req as any).user = req.session.user;
  next();
}

// Admin-only middleware
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.session.user.role !== "admin" && req.session.user.role !== "superadmin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Super Admin-only middleware
export function superAdminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.session.user.role !== "superadmin") {
    return res.status(403).json({ message: "Super Admin access required" });
  }
  next();
}

// Add session types
declare module "express-session" {
  interface SessionData {
    user: {
      id: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      role: string;
      [key: string]: any;
    };
  }
}
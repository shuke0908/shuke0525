import type { Express } from "express";
import { storage } from "../storage";
import { authenticate, requireRole } from "../auth";
import { validate, catchAsync } from "./middleware/common";
import { broadcastToAuthenticated } from '../ws';

export function setupSupportRoutes(app: Express) {
  // Get Support Chats
  app.get("/api/support/chats", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const chats = await storage.getUserSupportChats(user.id);
      
      return res.json({
        success: true,
        data: chats
      });
    } catch (error) {
      next(error);
    }
  });

  // Create Support Chat
  app.post("/api/support/chats", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { subject, priority, initialMessage } = req.body;

      if (!subject || !priority || !initialMessage) {
        return res.status(400).json({ 
          error: "Subject, priority, and initial message are required" 
        });
      }

      const chat = await storage.createSupportChat({
        userId: user.id,
        subject,
        priority,
        status: 'pending'
      });

      // 초기 메시지 추가
      await storage.createSupportMessage({
        chatId: chat.id,
        senderId: user.id,
        senderType: 'user',
        message: initialMessage
      });

      return res.json({
        success: true,
        data: chat,
        message: "Support chat created successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Get Chat Messages
  app.get("/api/support/chats/:chatId/messages", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const chatId = req.params.chatId;

      // 사용자가 이 채팅의 소유자인지 확인
      const chat = await storage.getSupportChat(chatId);
      if (!chat || chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const messages = await storage.getSupportChatMessages(chatId);

      return res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  });

  // Send Message to Chat
  app.post("/api/support/chats/:chatId/messages", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const chatId = req.params.chatId;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // 사용자가 이 채팅의 소유자인지 확인
      const chat = await storage.getSupportChat(chatId);
      if (!chat || chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const newMessage = await storage.createSupportMessage({
        chatId,
        senderId: user.id,
        senderType: 'user',
        message
      });

      // 채팅 상태를 active로 업데이트
      await storage.updateSupportChatStatus(chatId, 'active');

      // 관리자들에게 실시간 알림
      broadcastToAuthenticated({
        type: 'support_message_received',
        data: {
          chatId,
          message: newMessage,
          userId: user.id,
          userName: user.username || 'User'
        }
      });

      return res.json({
        success: true,
        data: newMessage,
        message: "Message sent successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Close Support Chat
  app.post("/api/support/chats/:chatId/close", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const chatId = req.params.chatId;

      // 사용자가 이 채팅의 소유자인지 확인
      const chat = await storage.getSupportChat(chatId);
      if (!chat || chat.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.updateSupportChatStatus(chatId, 'closed');

      return res.json({
        success: true,
        message: "Chat closed successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Get FAQ
  app.get("/api/support/faq", async (req, res, next) => {
    try {
      const category = req.query.category as string;
      const faq = await storage.getFaq(category);
      
      return res.json({
        success: true,
        data: faq
      });
    } catch (error) {
      next(error);
    }
  });

  // Submit Feedback
  app.post("/api/support/feedback", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { type, subject, message, rating } = req.body;

      if (!type || !subject || !message) {
        return res.status(400).json({ 
          error: "Type, subject, and message are required" 
        });
      }

      const feedback = await storage.createFeedback({
        userId: user.id,
        type,
        subject,
        message,
        rating: rating || null
      });

      return res.json({
        success: true,
        data: feedback,
        message: "Feedback submitted successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get All Support Chats
  app.get("/api/admin/support/chats", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;
      const priority = req.query.priority as string;

      const { chats, total } = await storage.getAllSupportChatsWithPagination({
        page,
        limit,
        status,
        priority
      });

      return res.json({
        success: true,
        data: chats,
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

  // Admin: Assign Chat to Admin
  app.post("/api/admin/support/chats/:chatId/assign", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const chatId = req.params.chatId;
      const adminId = (req as any).user.id;

      await storage.assignSupportChatToAdmin(chatId, adminId);
      await storage.updateSupportChatStatus(chatId, 'active');

      return res.json({
        success: true,
        message: "Chat assigned successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Reply to Support Chat
  app.post("/api/admin/support/chats/:chatId/reply", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const chatId = req.params.chatId;
      const adminId = (req as any).user.id;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const newMessage = await storage.createSupportMessage({
        chatId,
        senderId: adminId,
        senderType: 'admin',
        message
      });

      // 사용자에게 실시간 알림
      const chat = await storage.getSupportChat(chatId);
      if (chat) {
        broadcastToAuthenticated({
          type: 'support_admin_reply',
          data: {
            chatId,
            message: newMessage,
            userId: chat.userId
          }
        });
      }

      return res.json({
        success: true,
        data: newMessage,
        message: "Reply sent successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Update Chat Status
  app.put("/api/admin/support/chats/:chatId/status", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const chatId = req.params.chatId;
      const { status } = req.body;

      const allowedStatuses = ['pending', 'active', 'resolved', 'closed'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await storage.updateSupportChatStatus(chatId, status);

      return res.json({
        success: true,
        message: "Chat status updated successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get Feedback
  app.get("/api/admin/support/feedback", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const type = req.query.type as string;

      const { feedback, total } = await storage.getFeedbackWithPagination({
        page,
        limit,
        type
      });

      return res.json({
        success: true,
        data: feedback,
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

  // Admin: Manage FAQ
  app.post("/api/admin/support/faq", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const { category, question, answer, order } = req.body;

      if (!category || !question || !answer) {
        return res.status(400).json({ 
          error: "Category, question, and answer are required" 
        });
      }

      const faqItem = await storage.createFaqItem({
        category,
        question,
        answer,
        order: order || 0,
        isActive: true
      });

      return res.json({
        success: true,
        data: faqItem,
        message: "FAQ item created successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/support/faq/:id", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const faqId = parseInt(req.params.id);
      const updateData = req.body;

      await storage.updateFaqItem(faqId, updateData);

      return res.json({
        success: true,
        message: "FAQ item updated successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/support/faq/:id", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const faqId = parseInt(req.params.id);

      await storage.deleteFaqItem(faqId);

      return res.json({
        success: true,
        message: "FAQ item deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  });
} 
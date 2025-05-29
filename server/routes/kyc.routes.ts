import type { Express } from "express";
import { storage } from "../storage";
import { authenticate, requireRole } from "../auth";
import { validate, catchAsync } from "./middleware/common";

export function setupKycRoutes(app: Express) {
  // Get KYC Status
  app.get("/api/kyc/status", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const kycStatus = await storage.getUserKycStatus(user.id);
      
      return res.json({
        success: true,
        data: kycStatus
      });
    } catch (error) {
      next(error);
    }
  });

  // Submit Personal Information
  app.post("/api/kyc/personal-info", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const personalInfo = req.body;

      // 필수 필드 검증
      const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'nationality', 'address', 'city', 'postalCode', 'country'];
      for (const field of requiredFields) {
        if (!personalInfo[field]) {
          return res.status(400).json({ error: `${field} is required` });
        }
      }

      await storage.updateUserKycPersonalInfo(user.id, personalInfo);

      return res.json({
        success: true,
        message: "Personal information submitted successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Upload KYC Document
  app.post("/api/kyc/upload-document", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { documentType, documentUrl } = req.body;

      if (!documentType || !documentUrl) {
        return res.status(400).json({ error: "Document type and URL are required" });
      }

      const allowedTypes = ['identity', 'address', 'selfie'];
      if (!allowedTypes.includes(documentType)) {
        return res.status(400).json({ error: "Invalid document type" });
      }

      const document = await storage.createKycDocument({
        userId: user.id,
        type: documentType,
        documentUrl,
        status: 'pending'
      });

      return res.json({
        success: true,
        data: document,
        message: "Document uploaded successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Get KYC Documents
  app.get("/api/kyc/documents", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const documents = await storage.getUserKycDocuments(user.id);
      
      return res.json({
        success: true,
        data: documents
      });
    } catch (error) {
      next(error);
    }
  });

  // Submit KYC Application
  app.post("/api/kyc/submit", authenticate, async (req, res, next) => {
    try {
      const user = (req as any).user;
      
      // KYC 신청서 제출
      await storage.submitKycApplication(user.id);

      return res.json({
        success: true,
        message: "KYC application submitted successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get KYC Applications
  app.get("/api/admin/kyc/applications", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;

      const { applications, total } = await storage.getKycApplicationsWithPagination({
        page,
        limit,
        status
      });

      return res.json({
        success: true,
        data: applications,
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

  // Admin: Review KYC Application
  app.put("/api/admin/kyc/applications/:id", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status, rejectionReason } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      }

      if (status === 'rejected' && !rejectionReason) {
        return res.status(400).json({ error: "Rejection reason is required" });
      }

      await storage.updateKycApplicationStatus(applicationId, status, rejectionReason);

      return res.json({
        success: true,
        message: `KYC application ${status} successfully`
      });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get KYC Application Details
  app.get("/api/admin/kyc/applications/:id", authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getKycApplicationDetails(applicationId);

      if (!application) {
        return res.status(404).json({ error: "KYC application not found" });
      }

      return res.json({
        success: true,
        data: application
      });
    } catch (error) {
      next(error);
    }
  });
} 
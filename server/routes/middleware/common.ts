import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodType } from "zod";

// Helper function to catch async errors
export const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation middleware
export const validate = (schema: ZodType<any, any>) => {
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
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  return res.status(500).json({ message: err.message || "Internal server error" });
}; 
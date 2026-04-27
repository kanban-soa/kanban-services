import { Request, Response } from 'express';
import { AuthService } from '@/auth-service/services/auth.service';

export const AuthController = {
  createSession: async (req: Request, res: Response) => {
    try {
      const session = await AuthService.createSession(req.body);
      res.status(201).json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getSession: async (req: Request, res: Response) => {
    try {
      const session = await AuthService.getSession(req.params.token);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getSessionWithUser: async (req: Request, res: Response) => {
    try {
      const result = await AuthService.getSessionWithUser(req.params.token);
      if (!result) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteSession: async (req: Request, res: Response) => {
    try {
      await AuthService.deleteSession(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteUserSessions: async (req: Request, res: Response) => {
    try {
      await AuthService.deleteUserSessions(req.params.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  linkAccount: async (req: Request, res: Response) => {
    try {
      const account = await AuthService.linkAccount(req.body);
      res.status(201).json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  unlinkAccount: async (req: Request, res: Response) => {
    try {
      const { userId, providerId } = req.params;
      await AuthService.unlinkAccount(userId, providerId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getUserAccounts: async (req: Request, res: Response) => {
    try {
      const accounts = await AuthService.getUserAccounts(req.params.userId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  createVerification: async (req: Request, res: Response) => {
    try {
      const verification = await AuthService.createVerification(req.body);
      res.status(201).json(verification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  verifyCode: async (req: Request, res: Response) => {
    try {
      const { identifier, code } = req.body;
      await AuthService.verifyCode(identifier, code);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};

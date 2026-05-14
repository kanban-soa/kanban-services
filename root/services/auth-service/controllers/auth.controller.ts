import { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { AuthService } from '@/auth-service/services/auth.service';
import { generateToken } from '@/auth-service/lib';

export const AuthController = {
  refreshSession: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const session = await AuthService.getSession(refreshToken);
      if (!session) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      const user = await AuthService.getUserById(session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const newAccessToken = generateToken({ id: user.id, email: user.email });
      
      res.json({
        token: newAccessToken,
        refreshToken: session.token
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  logout: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      await AuthService.deleteSessionByToken(refreshToken);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

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
      const session = await AuthService.getSession(req.params.token as string);
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
      const result = await AuthService.getSessionWithUser(req.params.token as string);
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
      await AuthService.deleteSession(parseInt(req.params.id as string));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteUserSessions: async (req: Request, res: Response) => {
    try {
      await AuthService.deleteUserSessions(req.params.userId as string);
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
      await AuthService.unlinkAccount(userId as string, providerId as string);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getUserAccounts: async (req: Request, res: Response) => {
    try {
      const accounts = await AuthService.getUserAccounts(req.params.userId as string);
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

  verifyJwt: async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

      if (!token) {
        return res.status(401).json({ error: 'Authorization token is required' });
      }

      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

      const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

      const userId = payload.id ?? payload.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Token is missing subject' });
      }

      const user = await AuthService.getUserById(String(userId));
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token: {
          sub: userId,
          email: payload.email,
          role: payload.role,
          iat: payload.iat,
          exp: payload.exp,
        },
      });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return res.status(401).json({ error: 'Token has expired' });
      }
      res.status(401).json({ error: 'Invalid token' });
    }
  },
};

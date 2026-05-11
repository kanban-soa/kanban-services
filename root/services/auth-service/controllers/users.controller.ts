import { Request, Response } from 'express';
import { UsersService } from '@/auth-service/services/users.service';
import { AuthService } from '@/auth-service/services/auth.service';
import { generateToken } from '@/auth-service/lib';

export const UsersController = {
  createUser: async (req: Request, res: Response) => {
    try {
      const user = await UsersService.createUser(req.body);
      const token = generateToken({ id: user.id, email: user.email });
      const session = await AuthService.createSession({ userId: user.id });
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ token, refreshToken: session.token, user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await UsersService.login(email, password);
      const token = generateToken({ id: user.id, email: user.email });
      const session = await AuthService.createSession({ userId: user.id });
      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, refreshToken: session.token, user: userWithoutPassword });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  },

  forgotPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await UsersService.getUserByEmail(email);
      if (!user) {
        return res.json({ success: true, message: 'If the email is registered, a password reset code has been sent.' });
      }

      const verification = await AuthService.createVerification({ identifier: user.email });
      // In a real application, you would send this code via email.
      // For development/testing, we return it in the response.
      res.json({ 
        success: true, 
        message: 'If the email is registered, a password reset code has been sent.',
        _devCode: verification.value 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: 'Email, code, and new password are required' });
      }

      await AuthService.verifyCode(email, code);
      const user = await UsersService.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await UsersService.resetPassword(user.id, newPassword);
      // Invalidate all existing sessions after password reset
      await AuthService.deleteUserSessions(user.id);

      res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  getUser: async (req: Request, res: Response) => {
    try {
      const user = await UsersService.getUserById(req.params.id as string);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getUserByEmail: async (req: Request, res: Response) => {
    try {
      const user = await UsersService.getUserByEmail(req.query.email as string);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  updateUser: async (req: Request, res: Response) => {
    try {
      const user = await UsersService.updateUser(req.params.id as string, req.body);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteUser: async (req: Request, res: Response) => {
    try {
      await UsersService.deleteUser(req.params.id as string);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};

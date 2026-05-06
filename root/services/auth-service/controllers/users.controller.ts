import { Request, Response } from 'express';
import { UsersService } from '@/auth-service/services/users.service';
import { generateToken } from '@/auth-service/lib';

export const UsersController = {
  createUser: async (req: Request, res: Response) => {
    try {
      const user = await UsersService.createUser(req.body);
      const token = generateToken({ id: user.id, email: user.email });
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ token, user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await UsersService.login(email, password);
      const token = generateToken({ id: user.id, email: user.email });
      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
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

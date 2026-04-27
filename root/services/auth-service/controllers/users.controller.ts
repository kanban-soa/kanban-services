import { Request, Response } from 'express';
import { UsersService } from '@/auth-service/services/users.service';

export const UsersController = {
  createUser: async (req: Request, res: Response) => {
    try {
      const user = await UsersService.createUser(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await UsersService.login(email, password);
      res.json(user);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  },

  getUser: async (req: Request, res: Response) => {
    try {
      const user = await UsersService.getUserById(req.params.id);
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
      const user = await UsersService.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteUser: async (req: Request, res: Response) => {
    try {
      await UsersService.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};

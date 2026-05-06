import { z } from 'zod';

export const createBoardSchema = z.object({
  name: z.string({ required_error: 'Name is required' }),
  workspaceId: z.string({ required_error: 'Workspace ID is required' }),
  description: z.string().optional(),
});

export const updateBoardSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
});

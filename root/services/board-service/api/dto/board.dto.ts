import { z } from 'zod';

export const createBoardSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Board name is required'),
    workspaceId: z.number().int('Workspace ID must be an integer'),
    // Add other fields as necessary
  }),
});

export const updateBoardSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Board name is required').optional(),
    description: z.string().optional(),
    visibility: z.enum(['private', 'public']).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Board ID must be a number'),
  }),
});
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import routes from '../../api/routes';
import { errorHandler } from '../../middlewares/error.middleware';
import { db, pool } from '../../config/database';
import { boards, lists } from '../../schema';
import { eq } from 'drizzle-orm';

const app = express();
app.use(express.json());
app.use('/', routes);
app.use(errorHandler);

describe('List Integration', () => {
  let boardPublicId: string;
  let createdListId: string;

  const workspaceId = 9999;
  const userId = '00000000-0000-4000-8000-000000000001';

  beforeAll(async () => {
    const boardRes = await request(app)
      .post('/')
      .set('x-user-id', userId)
      .send({
        workspaceId,
        name: 'List Integration Board',
        visibility: 'private',
        type: 'regular',
      });

    boardPublicId = boardRes.body.data.publicId;
  });

  afterAll(async () => {
    if (createdListId) {
      await db.delete(lists).where(eq(lists.publicId, createdListId));
    }
    await db.delete(boards).where(eq(boards.publicId, boardPublicId));
    await pool.end();
  });

  it('IT-026 should create a list successfully and persist in database', async () => {
    const res = await request(app)
      .post(`/${boardPublicId}/lists`)
      .set('x-user-id', userId)
      .send({ name: 'Todo' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('publicId');
    expect(res.body.data.name).toBe('Todo');

    createdListId = res.body.data.publicId;

    const list = await db.query.lists.findFirst({
      where: eq(lists.publicId, createdListId),
    });
    expect(list).not.toBeNull();
    expect(list!.name).toBe('Todo');
  });

  it('IT-027 should return 400 when name is empty string', async () => {
    const res = await request(app)
      .post(`/${boardPublicId}/lists`)
      .set('x-user-id', userId)
      .send({ name: '' });

    expect(res.status).toBe(400);
  });

  it('IT-028 should return 400 when name is not a string', async () => {
    const res = await request(app)
      .post(`/${boardPublicId}/lists`)
      .set('x-user-id', userId)
      .send({ name: 123 });

    expect(res.status).toBe(400);
  });

  it('IT-029 should return 404 when board does not exist', async () => {
    const res = await request(app)
      .post('/invalid-board/lists')
      .set('x-user-id', userId)
      .send({ name: 'Todo' });

    expect(res.status).toBe(404);
  });

  describe('Delete List', () => {
    let deleteListId: string;

    beforeAll(async () => {
      const listRes = await request(app)
        .post(`/${boardPublicId}/lists`)
        .set('x-user-id', userId)
        .send({ name: 'Delete Test List' });

      deleteListId = listRes.body.data.publicId;
    });

    it('IT-040 should soft delete list and set deletedAt', async () => {
      const res = await request(app)
        .delete(`/lists/${deleteListId}`)
        .set('x-user-id', userId);

      expect(res.status).toBe(204);

      const list = await db.query.lists.findFirst({
        where: eq(lists.publicId, deleteListId),
      });
      expect(list).not.toBeNull();
      expect(list!.deletedAt).not.toBeNull();
    });

    it('IT-041 should return 404 for non-existent list', async () => {
      const res = await request(app)
        .delete('/lists/invalid-list')
        .set('x-user-id', userId);

      expect(res.status).toBe(404);
    });

    it('IT-042 should return 204 on first delete and 404 on second delete', async () => {
      const listRes = await request(app)
        .post(`/${boardPublicId}/lists`)
        .set('x-user-id', userId)
        .send({ name: 'Delete Twice List' });
      const listId = listRes.body.data.publicId;

      const res1 = await request(app)
        .delete(`/lists/${listId}`)
        .set('x-user-id', userId);
      expect(res1.status).toBe(204);

      const list1 = await db.query.lists.findFirst({
        where: eq(lists.publicId, listId),
      });
      expect(list1).not.toBeNull();
      expect(list1!.deletedAt).not.toBeNull();

      const res2 = await request(app)
        .delete(`/lists/${listId}`)
        .set('x-user-id', userId);
      expect(res2.status).toBe(404);
    });
  });

  describe('Update List', () => {
    it('IT-030 should update list name successfully and persist in database', async () => {
      const res = await request(app)
        .patch(`/lists/${createdListId}`)
        .set('x-user-id', userId)
        .send({ name: 'Doing' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Doing');

      const list = await db.query.lists.findFirst({
        where: eq(lists.publicId, createdListId),
      });
      expect(list).not.toBeNull();
      expect(list!.name).toBe('Doing');
    });

    it('IT-031 should return 400 when name is empty string', async () => {
      const res = await request(app)
        .patch(`/lists/${createdListId}`)
        .set('x-user-id', userId)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    it('IT-032 should return 400 when name is not a string', async () => {
      const res = await request(app)
        .patch(`/lists/${createdListId}`)
        .set('x-user-id', userId)
        .send({ name: 123 });

      expect(res.status).toBe(400);
    });

    it('IT-033 should return 404 when list does not exist', async () => {
      const res = await request(app)
        .patch('/lists/invalid-list')
        .set('x-user-id', userId)
        .send({ name: 'Doing' });

      expect(res.status).toBe(404);
    });
  });
});

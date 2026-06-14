import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import routes from '../../api/routes';
import { errorHandler } from '../../middlewares/error.middleware';
import { db, pool } from '../../config/database';
import { boards, lists, cards, labels, cardsToLabels } from '../../schema';
import { eq } from 'drizzle-orm';

const app = express();
app.use(express.json());
app.use('/', routes);
app.use(errorHandler);

describe('Label Integration', () => {
  let boardPublicId: string;
  let listPublicId: string;
  let cardPublicId: string;
  let labelPublicId: string;
  let createdAndAttachedLabelId: string;

  const workspaceId = 9999;
  const userId = '00000000-0000-4000-8000-000000000001';

  beforeAll(async () => {
    const boardRes = await request(app)
      .post('/')
      .set('x-user-id', userId)
      .send({
        workspaceId,
        name: 'Label Integration Board',
        visibility: 'private',
        type: 'regular',
      });

    boardPublicId = boardRes.body.data.publicId;

    const listRes = await request(app)
      .post(`/${boardPublicId}/lists`)
      .set('x-user-id', userId)
      .send({ name: 'Todo' });

    listPublicId = listRes.body.data.publicId;

    const cardRes = await request(app)
      .post(`/lists/${listPublicId}/cards`)
      .set('x-user-id', userId)
      .send({ title: 'Integration Card' });

    cardPublicId = cardRes.body.data.publicId;
  });

  afterAll(async () => {
    await db.delete(cardsToLabels);
    await db.delete(cards).where(eq(cards.publicId, cardPublicId));
    await db.delete(labels);
    await db.delete(lists).where(eq(lists.publicId, listPublicId));
    await db.delete(boards).where(eq(boards.publicId, boardPublicId));
    await pool.end();
  });

  describe('Create Label', () => {
    it('IT-016 should create a label successfully and persist in database', async () => {
      const res = await request(app)
        .post(`/${boardPublicId}/labels`)
        .set('x-user-id', userId)
        .send({ name: 'Bug', colourCode: '#FF0000' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('publicId');
      expect(res.body.data.name).toBe('Bug');

      labelPublicId = res.body.data.publicId;

      const label = await db.query.labels.findFirst({
        where: eq(labels.publicId, labelPublicId),
      });
      expect(label).not.toBeNull();
      expect(label!.name).toBe('Bug');
    });

    it('IT-017 should return 404 for invalid boardId', async () => {
      const res = await request(app)
        .post('/invalid-board/labels')
        .set('x-user-id', userId)
        .send({ name: 'Bug' });

      expect(res.status).toBe(404);
    });

    it('IT-018 should return 400 when name is empty', async () => {
      const res = await request(app)
        .post(`/${boardPublicId}/labels`)
        .set('x-user-id', userId)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('Attach Existing Label', () => {
    it('IT-019 should attach existing label to card and persist relation', async () => {
      const res = await request(app)
        .post(`/cards/${cardPublicId}/labels`)
        .set('x-user-id', userId)
        .send({ labelId: labelPublicId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const card = await db.query.cards.findFirst({
        where: eq(cards.publicId, cardPublicId),
      });
      expect(card).not.toBeNull();

      const label = await db.query.labels.findFirst({
        where: eq(labels.publicId, labelPublicId),
      });
      expect(label).not.toBeNull();

      const relation = await db.query.cardsToLabels.findFirst({
        where: eq(cardsToLabels.cardId, card!.id),
      });
      expect(relation).not.toBeNull();
      expect(relation!.labelId).toBe(label!.id);
    });

    it('IT-021 should return 404 for invalid labelId', async () => {
      const res = await request(app)
        .post(`/cards/${cardPublicId}/labels`)
        .set('x-user-id', userId)
        .send({ labelId: 'invalid-label-id' });

      expect(res.status).toBe(404);
    });
  });

  describe('Create And Attach Label', () => {
    it('IT-020 should create a new label and attach to card', async () => {
      const res = await request(app)
        .post(`/cards/${cardPublicId}/labels`)
        .set('x-user-id', userId)
        .send({ name: 'Feature', colourCode: '#00FF00' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('publicId');
      expect(res.body.data.name).toBe('Feature');

      createdAndAttachedLabelId = res.body.data.publicId;

      const label = await db.query.labels.findFirst({
        where: eq(labels.publicId, createdAndAttachedLabelId),
      });
      expect(label).not.toBeNull();
      expect(label!.name).toBe('Feature');

      const card = await db.query.cards.findFirst({
        where: eq(cards.publicId, cardPublicId),
      });
      expect(card).not.toBeNull();

      const relation = await db.query.cardsToLabels.findFirst({
        where: eq(cardsToLabels.labelId, label!.id),
      });
      expect(relation).not.toBeNull();
      expect(relation!.cardId).toBe(card!.id);
    });
  });

  describe('Detach Label', () => {
    it('IT-022 should detach label from card and remove relation', async () => {
      const res = await request(app)
        .delete(`/cards/${cardPublicId}/labels/${createdAndAttachedLabelId}`)
        .set('x-user-id', userId);

      expect(res.status).toBe(204);

      const label = await db.query.labels.findFirst({
        where: eq(labels.publicId, createdAndAttachedLabelId),
      });
      expect(label).not.toBeNull();

      const relation = await db.query.cardsToLabels.findFirst({
        where: eq(cardsToLabels.labelId, label!.id),
      });
      expect(relation).toBeUndefined();
    });
  });
});

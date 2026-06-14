import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import routes from '../../api/routes';
import { errorHandler } from '../../middlewares/error.middleware';
import { db, pool } from '../../config/database';
import { boards, lists, cards, cardToWorkspaceMembers, labels, cardsToLabels } from '../../schema';
import { eq, and } from 'drizzle-orm';

const app = express();
app.use(express.json());
app.use('/', routes);
app.use(errorHandler);

describe('Card CRUD Integration', () => {
  let boardId: string;
  let listId: string;
  let createdCardId: string;

  const workspaceId = 9999;
  const userId = '00000000-0000-4000-8000-000000000001';

  beforeAll(async () => {
    const boardRes = await request(app)
      .post('/')
      .set('x-user-id', userId)
      .send({
        workspaceId,
        name: 'Card Integration Board',
        visibility: 'private',
        type: 'regular',
      });

    boardId = boardRes.body.data.publicId;

    const listRes = await request(app)
      .post(`/${boardId}/lists`)
      .set('x-user-id', userId)
      .send({ name: 'Card Test List' });

    listId = listRes.body.data.publicId;
  });

  afterAll(async () => {
    await db.delete(boards).where(eq(boards.publicId, boardId));
    await pool.end();
  });

  describe('Create Card', () => {
    it('IT-001 should create a card successfully and persist in database', async () => {
      const res = await request(app)
        .post(`/lists/${listId}/cards`)
        .set('x-user-id', userId)
        .send({ title: 'Integration Card' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('publicId');
      expect(res.body.data.title).toBe('Integration Card');

      createdCardId = res.body.data.publicId;

      const card = await db.query.cards.findFirst({
        where: eq(cards.publicId, createdCardId),
      });
      expect(card).not.toBeNull();
      expect(card!.title).toBe('Integration Card');
    });

    it('IT-002 should return 400 when title is empty', async () => {
      const res = await request(app)
        .post(`/lists/${listId}/cards`)
        .set('x-user-id', userId)
        .send({ title: '' });

      expect(res.status).toBe(400);
    });

    it('IT-003 should return 400 when title is whitespace only', async () => {
      const res = await request(app)
        .post(`/lists/${listId}/cards`)
        .set('x-user-id', userId)
        .send({ title: '     ' });

      expect(res.status).toBe(400);
    });

    it('IT-004 should return 404 for invalid listId', async () => {
      const res = await request(app)
        .post('/lists/nonexistent/cards')
        .set('x-user-id', userId)
        .send({ title: 'Should Fail' });

      expect(res.status).toBe(404);
    });
  });

  describe('Update Card', () => {
    it('IT-005 should update card title', async () => {
      const res = await request(app)
        .patch(`/cards/${createdCardId}`)
        .set('x-user-id', userId)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
    });

    it('IT-006 should update card description', async () => {
      const res = await request(app)
        .patch(`/cards/${createdCardId}`)
        .set('x-user-id', userId)
        .send({ description: 'Updated Description' });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated Description');
    });

    it('IT-007 should return 400 when title is empty string', async () => {
      const res = await request(app)
        .patch(`/cards/${createdCardId}`)
        .set('x-user-id', userId)
        .send({ title: '' });

      expect(res.status).toBe(400);
    });

    it('IT-008 should return 404 for invalid cardId', async () => {
      const res = await request(app)
        .patch('/cards/nonexistent')
        .set('x-user-id', userId)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(404);
    });
  });

  describe('Delete Card', () => {
    let deleteCardId: string;

    beforeAll(async () => {
      const cardRes = await request(app)
        .post(`/lists/${listId}/cards`)
        .set('x-user-id', userId)
        .send({ title: 'Delete Test Card' });

      deleteCardId = cardRes.body.data.publicId;
    });

    it('IT-009 should return 204 and soft delete the card', async () => {
      const res = await request(app)
        .delete(`/cards/${deleteCardId}`)
        .set('x-user-id', userId);

      expect(res.status).toBe(204);
    });

    it('IT-010 should return 404 for non-existent card', async () => {
      const res = await request(app)
        .delete('/cards/nonexistent')
        .set('x-user-id', userId);

      expect(res.status).toBe(404);
    });

    it('IT-011 should return 204 on first delete and 404 on second delete', async () => {
      const cardRes = await request(app)
        .post(`/lists/${listId}/cards`)
        .set('x-user-id', userId)
        .send({ title: 'Delete Twice Card' });
      const cardId = cardRes.body.data.publicId;

      const res1 = await request(app)
        .delete(`/cards/${cardId}`)
        .set('x-user-id', userId);
      expect(res1.status).toBe(204);

      const res2 = await request(app)
        .delete(`/cards/${cardId}`)
        .set('x-user-id', userId);
      expect(res2.status).toBe(404);
    });
  });

  describe('Card Member Assignment', () => {
    const workspaceMemberAPublicId = 'mem_a_000001';
    const workspaceMemberBPublicId = 'mem_a_000002';

    describe('Assign Member', () => {
      it('IT-012 should return 400 when body is empty', async () => {
        const res = await request(app)
          .post(`/cards/${createdCardId}/members`)
          .set('x-user-id', userId)
          .send({});

        expect(res.status).toBe(400);
      });

      it('IT-013 should assign member successfully and persist in database', async () => {
        const res = await request(app)
          .post(`/cards/${createdCardId}/members`)
          .set('x-user-id', userId)
          .send({ workspaceMemberPublicId: workspaceMemberAPublicId });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);

        const card = await db.query.cards.findFirst({
          where: eq(cards.publicId, createdCardId),
        });
        expect(card).not.toBeNull();

        const assignment = await db.query.cardToWorkspaceMembers.findFirst({
          where: and(
            eq(cardToWorkspaceMembers.cardId, card!.id),
            eq(cardToWorkspaceMembers.workspaceMemberId, workspaceMemberAPublicId),
          ),
        });
        expect(assignment).not.toBeNull();
      });
    });

    describe('Remove Member', () => {
      it('IT-014 should remove assigned member and return 204', async () => {
        const res = await request(app)
          .delete(`/cards/${createdCardId}/members/${workspaceMemberAPublicId}`)
          .set('x-user-id', userId);

        expect(res.status).toBe(204);

        const card = await db.query.cards.findFirst({
          where: eq(cards.publicId, createdCardId),
        });
        expect(card).not.toBeNull();

        const assignment = await db.query.cardToWorkspaceMembers.findFirst({
          where: and(
            eq(cardToWorkspaceMembers.cardId, card!.id),
            eq(cardToWorkspaceMembers.workspaceMemberId, workspaceMemberAPublicId),
          ),
        });
        expect(assignment).toBeUndefined();
      });

      it('IT-015 should return 404 when member is not assigned', async () => {
        const res = await request(app)
          .delete(`/cards/${createdCardId}/members/${workspaceMemberBPublicId}`)
          .set('x-user-id', userId);

        expect(res.status).toBe(404);
      });
    });
  });

  describe('Label Management', () => {
    let labelPublicId: string;

    it('IT-016 should create a label successfully and persist in database', async () => {
      const res = await request(app)
        .post(`/${boardId}/labels`)
        .set('x-user-id', userId)
        .send({ name: 'Bug', colourCode: '#FF0000' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('publicId');
      expect(res.body.data.name).toBe('Bug');
      expect(res.body.data.colourCode).toBe('#FF0000');

      labelPublicId = res.body.data.publicId;

      const label = await db.query.labels.findFirst({
        where: eq(labels.publicId, labelPublicId),
      });
      expect(label).not.toBeNull();
      expect(label!.name).toBe('Bug');
      expect(label!.colourCode).toBe('#FF0000');
    });

    it('IT-017 should return 404 for invalid boardId', async () => {
      const res = await request(app)
        .post('/invalid-board/labels')
        .set('x-user-id', userId)
        .send({ name: 'Bug', colourCode: '#FF0000' });

      expect(res.status).toBe(404);
    });

    it('IT-018 should return 400 when label name is empty', async () => {
      const res = await request(app)
        .post(`/${boardId}/labels`)
        .set('x-user-id', userId)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    describe('Attach Label', () => {
      it('IT-019 should attach existing label to card and persist relation', async () => {
        const res = await request(app)
          .post(`/cards/${createdCardId}/labels/`)
          .set('x-user-id', userId)
          .send({ labelId: labelPublicId });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);

        const card = await db.query.cards.findFirst({
          where: eq(cards.publicId, createdCardId),
        });
        expect(card).not.toBeNull();

        const label = await db.query.labels.findFirst({
          where: eq(labels.publicId, labelPublicId),
        });
        expect(label).not.toBeNull();

        const relation = await db.query.cardsToLabels.findFirst({
          where: and(
            eq(cardsToLabels.cardId, card!.id),
            eq(cardsToLabels.labelId, label!.id),
          ),
        });
        expect(relation).not.toBeNull();
      });

      it('IT-020 should create a new label and attach to card', async () => {
        const res = await request(app)
          .post(`/cards/${createdCardId}/labels/`)
          .set('x-user-id', userId)
          .send({ name: 'Feature', colourCode: '#00FF00' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('publicId');
        expect(res.body.data.name).toBe('Feature');
        expect(res.body.data.colourCode).toBe('#00FF00');

        const newLabelId = res.body.data.publicId;

        const label = await db.query.labels.findFirst({
          where: eq(labels.publicId, newLabelId),
        });
        expect(label).not.toBeNull();
        expect(label!.name).toBe('Feature');

        const card = await db.query.cards.findFirst({
          where: eq(cards.publicId, createdCardId),
        });
        expect(card).not.toBeNull();

        const relation = await db.query.cardsToLabels.findFirst({
          where: and(
            eq(cardsToLabels.cardId, card!.id),
            eq(cardsToLabels.labelId, label!.id),
          ),
        });
        expect(relation).not.toBeNull();
      });

      it('IT-021 should return 404 for invalid labelId', async () => {
        const res = await request(app)
          .post(`/cards/${createdCardId}/labels/`)
          .set('x-user-id', userId)
          .send({ labelId: 'invalid-label' });

        expect(res.status).toBe(404);
      });
    });

    describe('Remove Label', () => {
      it('IT-022 should detach label from card and remove relation', async () => {
        const res = await request(app)
          .delete(`/cards/${createdCardId}/labels/${labelPublicId}`)
          .set('x-user-id', userId);

        expect(res.status).toBe(204);

        const card = await db.query.cards.findFirst({
          where: eq(cards.publicId, createdCardId),
        });
        expect(card).not.toBeNull();

        const label = await db.query.labels.findFirst({
          where: eq(labels.publicId, labelPublicId),
        });
        expect(label).not.toBeNull();

        const relation = await db.query.cardsToLabels.findFirst({
          where: and(
            eq(cardsToLabels.cardId, card!.id),
            eq(cardsToLabels.labelId, label!.id),
          ),
        });
        expect(relation).toBeUndefined();
      });
    });
  });

  describe('Due Date Management', () => {
    it('IT-023 should set due date successfully and persist in database', async () => {
      const dueDate = '2030-01-01T00:00:00.000Z';

      const res = await request(app)
        .patch(`/cards/${createdCardId}/due-date`)
        .set('x-user-id', userId)
        .send({ dueDate });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('dueDate');

      const card = await db.query.cards.findFirst({
        where: eq(cards.publicId, createdCardId),
      });
      expect(card).not.toBeNull();
      expect(card!.dueDate).not.toBeNull();
      expect(new Date(card!.dueDate!).toISOString()).toBe(dueDate);
    });

    it('IT-024 should return 404 for invalid cardId', async () => {
      const res = await request(app)
        .patch('/cards/invalid/due-date')
        .set('x-user-id', userId)
        .send({ dueDate: '2030-01-01T00:00:00.000Z' });

      expect(res.status).toBe(404);
    });

    it('IT-025 should remove due date successfully', async () => {
      const res = await request(app)
        .delete(`/cards/${createdCardId}/due-date`)
        .set('x-user-id', userId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const card = await db.query.cards.findFirst({
        where: eq(cards.publicId, createdCardId),
      });
      expect(card).not.toBeNull();
      expect(card!.dueDate).toBeNull();
    });
  });

  describe('Move Card', () => {
    let listAPublicId: string;
    let listBPublicId: string;
    let card1PublicId: string;
    let card2PublicId: string;
    let card3PublicId: string;

    beforeAll(async () => {
      const listARes = await request(app)
        .post(`/${boardId}/lists`)
        .set('x-user-id', userId)
        .send({ name: 'Move List A' });

      listAPublicId = listARes.body.data.publicId;

      const listBRes = await request(app)
        .post(`/${boardId}/lists`)
        .set('x-user-id', userId)
        .send({ name: 'Move List B' });

      listBPublicId = listBRes.body.data.publicId;

      const card1Res = await request(app)
        .post(`/lists/${listAPublicId}/cards`)
        .set('x-user-id', userId)
        .send({ title: 'Move Card 1' });

      card1PublicId = card1Res.body.data.publicId;

      const card2Res = await request(app)
        .post(`/lists/${listAPublicId}/cards`)
        .set('x-user-id', userId)
        .send({ title: 'Move Card 2' });

      card2PublicId = card2Res.body.data.publicId;

      const card3Res = await request(app)
        .post(`/lists/${listAPublicId}/cards`)
        .set('x-user-id', userId)
        .send({ title: 'Move Card 3' });

      card3PublicId = card3Res.body.data.publicId;
    });

    it('IT-034 should return 404 when target list does not exist', async () => {
      const res = await request(app)
        .patch(`/cards/${card1PublicId}/move`)
        .set('x-user-id', userId)
        .send({ targetListId: 'invalid-list', newIndex: 0 });

      expect(res.status).toBe(404);
    });

    it('IT-035 should return 404 when card does not exist', async () => {
      const res = await request(app)
        .patch('/cards/invalid-card/move')
        .set('x-user-id', userId)
        .send({ targetListId: listBPublicId, newIndex: 0 });

      expect(res.status).toBe(404);
    });

    it('IT-036 should return 400 when targetListId is missing', async () => {
      const res = await request(app)
        .patch(`/cards/${card1PublicId}/move`)
        .set('x-user-id', userId)
        .send({ newIndex: 0 });

      expect(res.status).toBe(400);
    });

    it('IT-037 should return 400 when newIndex is negative', async () => {
      const res = await request(app)
        .patch(`/cards/${card1PublicId}/move`)
        .set('x-user-id', userId)
        .send({ targetListId: listBPublicId, newIndex: -1 });

      expect(res.status).toBe(400);
    });

    it('IT-038 should move card to different list and update listId', async () => {
      const res = await request(app)
        .patch(`/cards/${card1PublicId}/move`)
        .set('x-user-id', userId)
        .send({ targetListId: listBPublicId, newIndex: 0 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const card = await db.query.cards.findFirst({
        where: eq(cards.publicId, card1PublicId),
      });
      expect(card).not.toBeNull();

      const listB = await db.query.lists.findFirst({
        where: eq(lists.publicId, listBPublicId),
      });
      expect(listB).not.toBeNull();

      expect(card!.listId).toBe(listB!.id);
      expect(card!.index).toBe(0);
    });

    it('IT-039 should reorder card within same list and update indices correctly', async () => {
      const res = await request(app)
        .patch(`/cards/${card3PublicId}/move`)
        .set('x-user-id', userId)
        .send({ targetListId: listAPublicId, newIndex: 0 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const card2 = await db.query.cards.findFirst({
        where: eq(cards.publicId, card2PublicId),
      });
      const card3 = await db.query.cards.findFirst({
        where: eq(cards.publicId, card3PublicId),
      });
      expect(card2).not.toBeNull();
      expect(card3).not.toBeNull();

      expect(card3!.index).toBe(0);
      expect(card2!.index).toBe(1);
    });
  });
});

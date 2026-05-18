
import { sql } from 'drizzle-orm';

import { db } from '@/board-service/config';

import {
  boards,
  lists,
  cards,
  labels,
  cardsToLabels,
  cardToWorkspaceMembers,
  cardActivities,
  userBoardFavorites,
} from '@/board-service/schema';

async function seed() {
  console.log('🌱 Seeding board-service database...');

  /**
   * =========================================================
   * CLEAN DATABASE
   * =========================================================
   */

  await db.execute(sql`
    TRUNCATE TABLE
      card_activity,
      _card_labels,
      _card_workspace_members,
      card,
      list,
      label,
      user_board_favorites,
      board
    RESTART IDENTITY CASCADE;
  `);

  /**
   * =========================================================
   * MOCK DATA
   * =========================================================
   */

  const workspaceId = 1;

  const adminUserId =
    '550e8400-e29b-41d4-a716-446655440000';

  /**
   * =========================================================
   * CREATE BOARDS
   * =========================================================
   */

  const [backendBoard] = await db
    .insert(boards)
    .values({
      publicId: 'brd001',
      name: 'Backend Sprint',
      description: 'Main backend sprint board',
      slug: 'backend-sprint',
      createdBy: adminUserId,
      workspaceId,
      visibility: 'private',
      type: 'regular',
    })
    .returning();

  const [mobileBoard] = await db
    .insert(boards)
    .values({
      publicId: 'brd002',
      name: 'Mobile Sprint',
      description: 'Mobile development board',
      slug: 'mobile-sprint',
      createdBy: adminUserId,
      workspaceId,
      visibility: 'private',
      type: 'regular',
    })
    .returning();

  /**
   * =========================================================
   * FAVORITES
   * =========================================================
   */

  await db.insert(userBoardFavorites).values({
    userId: adminUserId,
    boardId: backendBoard.id,
  });

  /**
   * =========================================================
   * LABELS
   * =========================================================
   */

  const insertedLabels = await db
    .insert(labels)
    .values([
      {
        publicId: 'lbl001',
        name: 'Bug',
        colourCode: '#ef4444',
        createdBy: adminUserId,
        boardId: backendBoard.id,
      },
      {
        publicId: 'lbl002',
        name: 'Feature',
        colourCode: '#22c55e',
        createdBy: adminUserId,
        boardId: backendBoard.id,
      },
      {
        publicId: 'lbl003',
        name: 'Urgent',
        colourCode: '#f97316',
        createdBy: adminUserId,
        boardId: backendBoard.id,
      },
    ])
    .returning();

  const bugLabel = insertedLabels[0];
  const featureLabel = insertedLabels[1];
  const urgentLabel = insertedLabels[2];

  /**
   * =========================================================
   * LISTS
   * =========================================================
   */

  const insertedLists = await db
    .insert(lists)
    .values([
      {
        publicId: 'lst001',
        name: 'Todo',
        index: 1000,
        createdBy: adminUserId,
        boardId: backendBoard.id,
      },
      {
        publicId: 'lst002',
        name: 'In Progress',
        index: 2000,
        createdBy: adminUserId,
        boardId: backendBoard.id,
      },
      {
        publicId: 'lst003',
        name: 'Review',
        index: 3000,
        createdBy: adminUserId,
        boardId: backendBoard.id,
      },
      {
        publicId: 'lst004',
        name: 'Done',
        index: 4000,
        createdBy: adminUserId,
        boardId: backendBoard.id,
      },
    ])
    .returning();

  const todoList = insertedLists[0];
  const doingList = insertedLists[1];
  const reviewList = insertedLists[2];
  const doneList = insertedLists[3];

  /**
   * =========================================================
   * CARDS
   * =========================================================
   */

  const insertedCards = await db
    .insert(cards)
    .values([
      {
        publicId: 'crd001',
        title: 'Implement JWT authentication',
        description:
          'Support access token & refresh token',
        index: 1000,
        createdBy: adminUserId,
        listId: todoList.id,
        dueDate: new Date(
          '2026-05-20T23:59:00Z',
        ),
      },
      {
        publicId: 'crd002',
        title: 'Integrate Redis caching',
        description: 'Improve API performance',
        index: 2000,
        createdBy: adminUserId,
        listId: doingList.id,
      },
      {
        publicId: 'crd003',
        title: 'Setup websocket gateway',
        description: 'Realtime synchronization',
        index: 3000,
        createdBy: adminUserId,
        listId: reviewList.id,
      },
      {
        publicId: 'crd004',
        title: 'Setup CI/CD pipeline',
        description: 'Github Actions deployment',
        index: 4000,
        createdBy: adminUserId,
        listId: doneList.id,
      },
    ])
    .returning();

  const authCard = insertedCards[0];
  const redisCard = insertedCards[1];
  const socketCard = insertedCards[2];

  /**
   * =========================================================
   * CARD LABELS
   * =========================================================
   */

  await db.insert(cardsToLabels).values([
    {
      cardId: authCard.id,
      labelId: featureLabel.id,
    },
    {
      cardId: authCard.id,
      labelId: urgentLabel.id,
    },
    {
      cardId: redisCard.id,
      labelId: featureLabel.id,
    },
    {
      cardId: socketCard.id,
      labelId: bugLabel.id,
    },
  ]);

  /**
   * =========================================================
   * CARD MEMBERS
   * =========================================================
   */

  await db.insert(cardToWorkspaceMembers).values([
    {
      cardId: authCard.id,
      workspaceMemberId: 1,
    },
    {
      cardId: redisCard.id,
      workspaceMemberId: 2,
    },
    {
      cardId: socketCard.id,
      workspaceMemberId: 1,
    },
  ]);

  /**
   * =========================================================
   * CARD ACTIVITIES
   * =========================================================
   */

  await db.insert(cardActivities).values([
    {
      publicId: 'act001',
      type: 'card.created',
      cardId: authCard.id,
      createdBy: adminUserId,
    },

    {
      publicId: 'act002',
      type: 'card.updated.title',
      cardId: authCard.id,
      fromTitle: 'Setup auth',
      toTitle: 'Implement JWT authentication',
      createdBy: adminUserId,
    },

    {
      publicId: 'act003',
      type: 'card.updated.list',
      cardId: redisCard.id,
      fromListId: todoList.id,
      toListId: doingList.id,
      fromIndex: 1000,
      toIndex: 2000,
      createdBy: adminUserId,
    },

    {
      publicId: 'act004',
      type: 'card.updated.dueDate.added',
      cardId: authCard.id,
      toDueDate: new Date(
        '2026-05-20T23:59:00Z',
      ),
      createdBy: adminUserId,
    },

    {
      publicId: 'act005',
      type: 'card.updated.member.added',
      cardId: authCard.id,
      workspaceMemberId: 1,
      createdBy: adminUserId,
    },

    {
      publicId: 'act006',
      type: 'card.updated.label.added',
      cardId: authCard.id,
      labelId: urgentLabel.id,
      createdBy: adminUserId,
    },
  ]);

  console.log(
    '✅ Board-service seed completed successfully!',
  );

  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});


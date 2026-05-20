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

import { generatePublicId } from '@/board-service/shared/utils/public-id';

async function seed() {
  console.log('🌱 Seeding board-service database...');

  /**
   * =====================================================
   * CLEAN DATABASE
   * =====================================================
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
   * =====================================================
   * MOCK USERS
   * =====================================================
   */

  const workspaceId = 1;

  const ownerUserId =
    '550e8400-e29b-41d4-a716-446655440000';

  const member1UserId =
    '550e8400-e29b-41d4-a716-446655440001';

  const member2UserId =
    '550e8400-e29b-41d4-a716-446655440002';

  /**
   * =====================================================
   * WORKSPACE MEMBER PUBLIC IDS
   * =====================================================
   */

  const ownerMemberPublicId =
    generatePublicId();

  const devMemberPublicId =
    generatePublicId();

  const qaMemberPublicId =
    generatePublicId();

  /**
   * =====================================================
   * CREATE BOARDS
   * =====================================================
   */

  const insertedBoards = await db
    .insert(boards)
    .values([
      {
        publicId: generatePublicId(),
        name: 'Backend Sprint',
        description:
          'Backend microservice development',
        slug: 'backend-sprint',
        createdBy: ownerUserId,
        workspaceId,
      },

      {
        publicId: generatePublicId(),
        name: 'Frontend Sprint',
        description:
          'Frontend kanban implementation',
        slug: 'frontend-sprint',
        createdBy: ownerUserId,
        workspaceId,
      },

      {
        publicId: generatePublicId(),
        name: 'Bug Tracking',
        description:
          'Production issue tracking',
        slug: 'bug-tracking',
        createdBy: ownerUserId,
        workspaceId,
      },
    ])
    .returning();

  const [
    backendBoard,
    frontendBoard,
    bugBoard,
  ] = insertedBoards;

  /**
   * =====================================================
   * FAVORITES
   * =====================================================
   */

  await db.insert(userBoardFavorites).values([
    {
      userId: ownerUserId,
      boardId: backendBoard.id,
    },

    {
      userId: member1UserId,
      boardId: frontendBoard.id,
    },

    {
      userId: member2UserId,
      boardId: bugBoard.id,
    },
  ]);

  /**
   * =====================================================
   * LABELS
   * =====================================================
   */

  const insertedLabels = await db
    .insert(labels)
    .values([
      {
        publicId: generatePublicId(),
        name: 'Bug',
        colourCode: '#ef4444',
        boardId: backendBoard.id,
        createdBy: ownerUserId,
      },

      {
        publicId: generatePublicId(),
        name: 'Feature',
        colourCode: '#22c55e',
        boardId: backendBoard.id,
        createdBy: ownerUserId,
      },

      {
        publicId: generatePublicId(),
        name: 'Urgent',
        colourCode: '#f97316',
        boardId: backendBoard.id,
        createdBy: ownerUserId,
      },

      {
        publicId: generatePublicId(),
        name: 'Refactor',
        colourCode: '#3b82f6',
        boardId: backendBoard.id,
        createdBy: ownerUserId,
      },

      {
        publicId: generatePublicId(),
        name: 'Testing',
        colourCode: '#14b8a6',
        boardId: backendBoard.id,
        createdBy: ownerUserId,
      },
    ])
    .returning();

  const [
    bugLabel,
    featureLabel,
    urgentLabel,
    refactorLabel,
    testingLabel,
  ] = insertedLabels;

  /**
   * =====================================================
   * LISTS
   * =====================================================
   */

  const insertedLists = await db
    .insert(lists)
    .values([
      {
        publicId: generatePublicId(),
        name: 'Backlog',
        index: 1000,
        boardId: backendBoard.id,
        createdBy: ownerUserId,
      },

      {
        publicId: generatePublicId(),
        name: 'Todo',
        index: 2000,
        boardId: backendBoard.id,
        createdBy: ownerUserId,
      },

      {
        publicId: generatePublicId(),
        name: 'In Progress',
        index: 3000,
        boardId: backendBoard.id,
        createdBy: ownerUserId,
      },

      {
        publicId: generatePublicId(),
        name: 'Review',
        index: 4000,
        boardId: backendBoard.id,
        createdBy: ownerUserId,
      },

      {
        publicId: generatePublicId(),
        name: 'Done',
        index: 5000,
        boardId: backendBoard.id,
        createdBy: ownerUserId,
      },
    ])
    .returning();

  const [
    backlogList,
    todoList,
    doingList,
    reviewList,
    doneList,
  ] = insertedLists;

  /**
   * =====================================================
   * CARDS
   * =====================================================
   */

  const insertedCards = await db
    .insert(cards)
    .values([
      {
        publicId: generatePublicId(),
        title:
          'Implement JWT authentication',
        description:
          'Support access token and refresh token',
        index: 1000,
        listId: todoList.id,
        createdBy: ownerUserId,
        dueDate: new Date(
          '2026-06-10T23:59:00Z',
        ),
      },

      {
        publicId: generatePublicId(),
        title: 'Integrate Redis caching',
        description:
          'Improve API performance',
        index: 2000,
        listId: doingList.id,
        createdBy: member1UserId,
      },

      {
        publicId: generatePublicId(),
        title: 'Setup websocket gateway',
        description:
          'Realtime collaboration sync',
        index: 3000,
        listId: reviewList.id,
        createdBy: member2UserId,
      },

      {
        publicId: generatePublicId(),
        title: 'Setup CI/CD pipeline',
        description:
          'Github Actions deployment',
        index: 4000,
        listId: doneList.id,
        createdBy: ownerUserId,
      },

      {
        publicId: generatePublicId(),
        title: 'Fix drag and drop issue',
        description:
          'Card flickering after reorder',
        index: 5000,
        listId: backlogList.id,
        createdBy: member1UserId,
      },
    ])
    .returning();

  const [
    authCard,
    redisCard,
    socketCard,
    cicdCard,
    dndCard,
  ] = insertedCards;

  /**
   * =====================================================
   * CARD LABELS
   * =====================================================
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
      labelId: refactorLabel.id,
    },

    {
      cardId: socketCard.id,
      labelId: testingLabel.id,
    },

    {
      cardId: dndCard.id,
      labelId: bugLabel.id,
    },

    {
      cardId: cicdCard.id,
      labelId: featureLabel.id,
    },
  ]);

  /**
   * =====================================================
   * CARD MEMBERS
   * =====================================================
   */

  await db.insert(
    cardToWorkspaceMembers,
  ).values([
    {
      cardId: authCard.id,
      workspaceMemberPublicId:
        ownerMemberPublicId,
    },

    {
      cardId: authCard.id,
      workspaceMemberPublicId:
        devMemberPublicId,
    },

    {
      cardId: redisCard.id,
      workspaceMemberPublicId:
        devMemberPublicId,
    },

    {
      cardId: socketCard.id,
      workspaceMemberPublicId:
        qaMemberPublicId,
    },

    {
      cardId: cicdCard.id,
      workspaceMemberPublicId:
        ownerMemberPublicId,
    },

    {
      cardId: dndCard.id,
      workspaceMemberPublicId:
        devMemberPublicId,
    },
  ]);

  /**
   * =====================================================
   * CARD ACTIVITIES
   * =====================================================
   */

  await db.insert(cardActivities).values([
    {
      publicId: generatePublicId(),
      type: 'card.created',
      cardId: authCard.id,
      createdBy: ownerUserId,
    },

    {
      publicId: generatePublicId(),
      type: 'card.updated.title',
      cardId: authCard.id,
      fromTitle: 'Setup auth',
      toTitle:
        'Implement JWT authentication',
      createdBy: ownerUserId,
    },

    {
      publicId: generatePublicId(),
      type: 'card.updated.description',
      cardId: redisCard.id,
      fromDescription:
        'Improve performance',
      toDescription:
        'Improve API performance',
      createdBy: member1UserId,
    },

    {
      publicId: generatePublicId(),
      type: 'card.updated.list',
      cardId: socketCard.id,
      fromListId: todoList.id,
      toListId: reviewList.id,
      fromIndex: 1000,
      toIndex: 3000,
      createdBy: member2UserId,
    },

    {
      publicId: generatePublicId(),
      type:
        'card.updated.dueDate.added',
      cardId: authCard.id,
      toDueDate: new Date(
        '2026-06-10T23:59:00Z',
      ),
      createdBy: ownerUserId,
    },

    {
      publicId: generatePublicId(),
      type:
        'card.updated.member.added',
      cardId: authCard.id,
      workspaceMemberPublicId:
        devMemberPublicId,
      createdBy: ownerUserId,
    },

    {
      publicId: generatePublicId(),
      type:
        'card.updated.label.added',
      cardId: authCard.id,
      labelId: urgentLabel.id,
      createdBy: ownerUserId,
    },

    {
      publicId: generatePublicId(),
      type:
        'card.updated.member.added',
      cardId: socketCard.id,
      workspaceMemberPublicId:
        qaMemberPublicId,
      createdBy: member2UserId,
    },

    {
      publicId: generatePublicId(),
      type:
        'card.updated.label.added',
      cardId: dndCard.id,
      labelId: bugLabel.id,
      createdBy: member1UserId,
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
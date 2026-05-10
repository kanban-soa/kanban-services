#!/usr/bin/env node
"use strict";

require("dotenv/config");

const { Pool } = require("pg");
const { randomBytes, randomUUID } = require("crypto");

const workspaceUrl =
  process.env.WORKSPACE_DATABASE_URL || process.env.DATABASE_URL;
const boardUrl = process.env.BOARD_DATABASE_URL || process.env.BOARD_URL;

if (!workspaceUrl || !boardUrl) {
  console.error(
    "Missing database connection strings. Set DATABASE_URL (workspace) and BOARD_URL (board), " +
      "or use WORKSPACE_DATABASE_URL and BOARD_DATABASE_URL.",
  );
  process.exit(1);
}

const now = new Date();

function publicId() {
  return randomBytes(9).toString("base64url");
}

function daysAgo(days) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date;
}

function activityDate(createdDaysAgo, offsetDays) {
  const daysAgoValue = Math.max(0, createdDaysAgo - offsetDays);
  return daysAgo(daysAgoValue);
}

const labelTemplates = [
  { name: "Urgent", color: "#ef4444" },
  { name: "High Priority", color: "#f97316" },
  { name: "Normal", color: "#60a5fa" },
];

const listTemplates = ["Backlog", "In Progress", "Done"];

const cardTemplates = [
  {
    list: "Backlog",
    title: "Define objectives",
    label: "High Priority",
    createdDaysAgo: 6,
    dueDaysAgo: 2,
    assigned: [0],
    updatedAfterDays: 2,
  },
  {
    list: "Backlog",
    title: "Collect requirements",
    label: "Normal",
    createdDaysAgo: 5,
    assigned: [1],
  },
  {
    list: "In Progress",
    title: "Design workflow",
    label: "Urgent",
    createdDaysAgo: 4,
    dueDaysAgo: 1,
    assigned: [0, 2],
    updatedAfterDays: 1,
  },
  {
    list: "In Progress",
    title: "Implement API",
    label: "High Priority",
    createdDaysAgo: 3,
    assigned: [1],
    updatedAfterDays: 1,
  },
  {
    list: "Done",
    title: "Ship v1",
    label: "Normal",
    createdDaysAgo: 2,
    assigned: [0],
    archivedAfterDays: 1,
  },
  {
    list: "Done",
    title: "Run retrospective",
    label: "Normal",
    createdDaysAgo: 1,
    assigned: [2],
    archivedAfterDays: 1,
  },
  {
    list: "Done",
    title: "Legacy cleanup",
    label: "Normal",
    createdDaysAgo: 12,
    assigned: [1],
    archivedAfterDays: 2,
  },
];

const sampleWorkspaces = [
  {
    slug: "stats-acme",
    name: "Acme Analytics",
    description: "Sample workspace for statistics testing.",
    plan: "pro",
    members: [
      { email: "owner+acme@example.com", role: "admin" },
      { email: "alex+acme@example.com", role: "member" },
      { email: "jordan+acme@example.com", role: "member" },
    ],
    boards: [
      {
        name: "Product Roadmap",
        slug: "product-roadmap",
        description: "Sample board for product planning.",
      },
      {
        name: "Marketing Sprint",
        slug: "marketing-sprint",
        description: "Sample board for marketing execution.",
      },
    ],
  },
  {
    slug: "stats-orbit",
    name: "Orbit Labs",
    description: "Sample workspace for statistics testing.",
    plan: "free",
    members: [
      { email: "owner+orbit@example.com", role: "admin" },
      { email: "sam+orbit@example.com", role: "member" },
      { email: "lee+orbit@example.com", role: "member" },
    ],
    boards: [
      {
        name: "Customer Success",
        slug: "customer-success",
        description: "Sample board for customer success initiatives.",
      },
      {
        name: "Growth Experiments",
        slug: "growth-experiments",
        description: "Sample board for growth experiments.",
      },
    ],
  },
];

async function upsertWorkspace(client, workspace, ownerUserId) {
  const existing = await client.query(
    `SELECT id FROM workspace WHERE slug = $1 AND "deletedAt" IS NULL`,
    [workspace.slug],
  );

  if (existing.rows.length > 0) {
    const workspaceId = Number(existing.rows[0].id);
    await client.query(
      `UPDATE workspace
       SET name = $1,
           description = $2,
           plan = $3,
           "showEmailsToMembers" = $4,
           "updatedAt" = $5
       WHERE id = $6`,
      [
        workspace.name,
        workspace.description,
        workspace.plan,
        true,
        now,
        workspaceId,
      ],
    );
    return workspaceId;
  }

  const inserted = await client.query(
    `INSERT INTO workspace
      ("publicId", name, description, slug, plan, "showEmailsToMembers", "createdBy", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      publicId(),
      workspace.name,
      workspace.description,
      workspace.slug,
      workspace.plan,
      true,
      ownerUserId,
      now,
    ],
  );

  return Number(inserted.rows[0].id);
}

async function seedWorkspaceData(client) {
  const results = [];

  for (const workspace of sampleWorkspaces) {
    const ownerUserId = randomUUID();
    const workspaceId = await upsertWorkspace(client, workspace, ownerUserId);

    await client.query(
      `DELETE FROM workspace_member_permissions
       WHERE "workspaceMemberId" IN (
         SELECT id FROM workspace_members WHERE "workspaceId" = $1
       )`,
      [workspaceId],
    );
    await client.query(`DELETE FROM workspace_members WHERE "workspaceId" = $1`, [
      workspaceId,
    ]);

    const members = [];

    for (let index = 0; index < workspace.members.length; index += 1) {
      const member = workspace.members[index];
      const userId = index === 0 ? ownerUserId : randomUUID();
      const inserted = await client.query(
        `INSERT INTO workspace_members
          ("publicId", email, "userId", "workspaceId", "createdBy", "createdAt", role, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          publicId(),
          member.email,
          userId,
          workspaceId,
          ownerUserId,
          now,
          member.role,
          "active",
        ],
      );

      members.push({
        id: Number(inserted.rows[0].id),
        email: member.email,
        userId,
      });
    }

    results.push({
      workspaceId,
      ownerUserId,
      members,
      config: workspace,
    });
  }

  return results;
}

async function seedBoardData(client, workspaceSeeds) {
  for (const seed of workspaceSeeds) {
    const { workspaceId, ownerUserId, members, config } = seed;

    await client.query(`DELETE FROM board WHERE "workspaceId" = $1`, [
      workspaceId,
    ]);

    for (const board of config.boards) {
      const boardInserted = await client.query(
        `INSERT INTO board
          ("publicId", name, description, slug, "createdBy", "workspaceId", visibility, type, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          publicId(),
          board.name,
          board.description,
          board.slug,
          ownerUserId,
          workspaceId,
          "private",
          "regular",
          now,
        ],
      );
      const boardId = Number(boardInserted.rows[0].id);

      const labelIds = new Map();
      for (const label of labelTemplates) {
        const labelInserted = await client.query(
          `INSERT INTO label
            ("publicId", name, "colourCode", "createdBy", "createdAt", "boardId")
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            publicId(),
            label.name,
            label.color,
            ownerUserId,
            now,
            boardId,
          ],
        );
        labelIds.set(label.name, Number(labelInserted.rows[0].id));
      }

      const listIds = new Map();
      for (let index = 0; index < listTemplates.length; index += 1) {
        const name = listTemplates[index];
        const listInserted = await client.query(
          `INSERT INTO list
            ("publicId", name, "index", "createdBy", "createdAt", "boardId")
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [publicId(), name, index, ownerUserId, now, boardId],
        );
        listIds.set(name, Number(listInserted.rows[0].id));
      }

      const listCardIndex = new Map();

      for (const template of cardTemplates) {
        const listId = listIds.get(template.list);
        if (!listId) {
          continue;
        }
        const createdAt = daysAgo(template.createdDaysAgo);
        const dueDate =
          typeof template.dueDaysAgo === "number"
            ? daysAgo(template.dueDaysAgo)
            : null;
        const index = listCardIndex.get(template.list) ?? 0;
        listCardIndex.set(template.list, index + 1);

        const cardInserted = await client.query(
          `INSERT INTO card
            ("publicId", title, description, "index", "createdBy", "createdAt", "listId", "dueDate")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            publicId(),
            `${board.name}: ${template.title}`,
            `Sample card for ${board.name}.`,
            index,
            ownerUserId,
            createdAt,
            listId,
            dueDate,
          ],
        );
        const cardId = Number(cardInserted.rows[0].id);

        const assignedMembers = (template.assigned || []).map(
          (memberIndex) => members[memberIndex % members.length],
        );

        for (const member of assignedMembers) {
          await client.query(
            `INSERT INTO _card_workspace_members ("cardId", "workspaceMemberId")
             VALUES ($1, $2)`,
            [cardId, member.id],
          );
        }

        const labelId = labelIds.get(template.label);
        if (labelId) {
          await client.query(
            `INSERT INTO _card_labels ("cardId", "labelId") VALUES ($1, $2)`,
            [cardId, labelId],
          );
        }

        const activityMemberId = assignedMembers[0]?.id ?? null;

        await client.query(
          `INSERT INTO card_activity
            ("publicId", type, "cardId", "workspaceMemberId", "createdAt")
           VALUES ($1, $2, $3, $4, $5)`,
          [publicId(), "card.created", cardId, activityMemberId, createdAt],
        );

        if (typeof template.updatedAfterDays === "number") {
          await client.query(
            `INSERT INTO card_activity
              ("publicId", type, "cardId", "workspaceMemberId", "createdAt")
             VALUES ($1, $2, $3, $4, $5)`,
            [
              publicId(),
              "card.updated.title",
              cardId,
              activityMemberId,
              activityDate(template.createdDaysAgo, template.updatedAfterDays),
            ],
          );
        }

        if (typeof template.archivedAfterDays === "number") {
          await client.query(
            `INSERT INTO card_activity
              ("publicId", type, "cardId", "workspaceMemberId", "createdAt")
             VALUES ($1, $2, $3, $4, $5)`,
            [
              publicId(),
              "card.archived",
              cardId,
              activityMemberId,
              activityDate(template.createdDaysAgo, template.archivedAfterDays),
            ],
          );
        }
      }
    }
  }
}

async function main() {
  const workspacePool = new Pool({ connectionString: workspaceUrl });
  const boardPool = new Pool({ connectionString: boardUrl });

  console.log(workspaceUrl);
  console.log(boardUrl);


  const workspaceClient = await workspacePool.connect();
  const boardClient = await boardPool.connect();

  try {
    await workspaceClient.query("BEGIN");
    const workspaceSeeds = await seedWorkspaceData(workspaceClient);
    await workspaceClient.query("COMMIT");

    await boardClient.query("BEGIN");
    await seedBoardData(boardClient, workspaceSeeds);
    await boardClient.query("COMMIT");

    console.log("Seeded statistics sample data:");
    for (const seed of workspaceSeeds) {
      console.log(
        `- workspaceId=${seed.workspaceId} slug=${seed.config.slug} members=${seed.members.length} boards=${seed.config.boards.length}`,
      );
    }
  } catch (error) {
    await workspaceClient.query("ROLLBACK");
    await boardClient.query("ROLLBACK");
    console.error("Failed to seed statistics data:", error);
    process.exitCode = 1;
  } finally {
    workspaceClient.release();
    boardClient.release();
    await workspacePool.end();
    await boardPool.end();
  }
}

main();

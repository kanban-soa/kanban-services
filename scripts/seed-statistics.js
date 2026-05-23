#!/usr/bin/env node
"use strict";

require("dotenv/config");

const { Pool } = require("pg");
const { randomBytes, randomUUID } = require("crypto");
const bcrypt = require("bcrypt");

// --- Configuration ---

const authUrl = process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;
const workspaceUrl =
  process.env.WORKSPACE_DATABASE_URL || process.env.DATABASE_URL;
const boardUrl = process.env.BOARD_DATABASE_URL || process.env.BOARD_URL;

if (!authUrl || !workspaceUrl || !boardUrl) {
  console.error(
    "Missing database connection strings. Set AUTH_DATABASE_URL, WORKSPACE_DATABASE_URL, and BOARD_DATABASE_URL.",
  );
  process.exit(1);
}

const now = new Date();
const SALT_ROUNDS = 10;

// --- Data Templates ---

const smokeWorkspace = {
  slug: "smoke-test-workspace",
  name: "Project Phoenix (Smoke Test)",
  description:
    "A sample workspace with rich data to demonstrate all functional features.",
  plan: "pro",
  members: [
    { email: "smoke-admin@example.com", role: "admin", name: "Smoke Admin" },
    { email: "smoke-user-1@example.com", role: "member", name: "Smoke User 1" },
    { email: "smoke-user-2@example.com", role: "member", name: "Smoke User 2" },
  ],
  boards: [
    {
      name: "Q3 Engineering Sprint",
      slug: "q3-eng-sprint",
      description: "Tasks and objectives for the current engineering sprint.",
    },
    {
      name: "Marketing Launch Plan",
      slug: "marketing-launch",
      description: "Activities related to the upcoming product launch.",
    },
  ],
};

const labelTemplates = [
  { name: "Urgent", color: "#ef4444" },
  { name: "High Priority", color: "#f97316" },
  { name: "Normal", color: "#60a5fa" },
  { name: "Bug", color: "#f87171" },
  { name: "Feature", color: "#34d399" },
];

const listTemplates = ["Todo", "In Progress", "In Review", "Done"];

const cardTemplates = [
  // Engineering Sprint Board
  {
    boardSlug: "q3-eng-sprint",
    list: "Todo",
    title: "Fix authentication bug",
    label: "Bug",
    createdDaysAgo: 10,
    assigned: [1],
  },
  {
    boardSlug: "q3-eng-sprint",
    list: "In Progress",
    title: "Develop statistics export feature",
    label: "Feature",
    createdDaysAgo: 8,
    dueDaysAgo: 2,
    assigned: [1, 2],
    updatedAfterDays: 3,
  },
  {
    boardSlug: "q3-eng-sprint",
    list: "In Review",
    title: "Refactor database connection pool",
    label: "High Priority",
    createdDaysAgo: 5,
    assigned: [0],
    updatedAfterDays: 2,
  },
  {
    boardSlug: "q3-eng-sprint",
    list: "Done",
    title: "Initial project setup",
    label: "Normal",
    createdDaysAgo: 30,
    assigned: [0],
    archivedAfterDays: 28,
  },
  // Marketing Launch Board
  {
    boardSlug: "marketing-launch",
    list: "Todo",
    title: "Draft press release",
    label: "Urgent",
    createdDaysAgo: 7,
    dueDaysAgo: 1,
    assigned: [2],
  },
  {
    boardSlug: "marketing-launch",
    list: "In Progress",
    title: "Create social media campaign",
    label: "High Priority",
    createdDaysAgo: 4,
    assigned: [1],
    updatedAfterDays: 1,
  },
  {
    boardSlug: "marketing-launch",
    list: "Done",
    title: "Finalize launch date",
    label: "Normal",
    createdDaysAgo: 14,
    assigned: [0],
    archivedAfterDays: 10,
  },
];

// --- Utility Functions ---

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

// --- Seeding Logic ---

async function seedAuthData(client) {
  const users = [];
  const hashedPassword = await bcrypt.hash("password", SALT_ROUNDS);

  for (const member of smokeWorkspace.members) {
    // Clear existing user to avoid conflicts
    await client.query(`DELETE FROM users WHERE email = $1`, [member.email]);

    const inserted = await client.query(
      `INSERT INTO users (name, email, password, role, "emailVerified")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [member.name, member.email, hashedPassword, member.role, true],
    );
    users.push({
      id: inserted.rows[0].id,
      email: member.email,
      role: member.role,
    });
  }
  return users;
}

async function upsertWorkspace(client, workspace, ownerUserId) {
  const existing = await client.query(
    `SELECT id FROM workspace WHERE slug = $1 AND "deletedAt" IS NULL`,
    [workspace.slug],
  );

  if (existing.rows.length > 0) {
    const workspaceId = Number(existing.rows[0].id);
    await client.query(
      `UPDATE workspace
       SET name = $1, description = $2, plan = $3, "updatedAt" = $4
       WHERE id = $5`,
      [workspace.name, workspace.description, workspace.plan, now, workspaceId],
    );
    return workspaceId;
  }

  const inserted = await client.query(
    `INSERT INTO workspace
      ("publicId", name, description, slug, plan, "createdBy", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      publicId(),
      workspace.name,
      workspace.description,
      workspace.slug,
      workspace.plan,
      ownerUserId,
      now,
    ],
  );

  return Number(inserted.rows[0].id);
}

async function seedWorkspaceData(client, authUsers) {
  const owner = authUsers.find((u) => u.role === "admin");
  if (!owner) {
    throw new Error("No admin user found in authUsers to own the workspace.");
  }

  const workspaceId = await upsertWorkspace(client, smokeWorkspace, owner.id);

  // Clear existing members to avoid conflicts
  await client.query(`DELETE FROM workspace_members WHERE "workspaceId" = $1`, [
    workspaceId,
  ]);

  const members = [];
  for (const authUser of authUsers) {
    const memberConfig = smokeWorkspace.members.find(
      (m) => m.email === authUser.email,
    );
    const inserted = await client.query(
      `INSERT INTO workspace_members
        ("publicId", email, "userId", "workspaceId", "createdBy", "createdAt", role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        publicId(),
        authUser.email,
        authUser.id,
        workspaceId,
        owner.id,
        now,
        memberConfig.role,
        "active",
      ],
    );
    members.push({
      id: Number(inserted.rows[0].id),
      email: authUser.email,
      userId: authUser.id,
    });
  }

  return {
    workspaceId,
    ownerUserId: owner.id,
    members,
    config: smokeWorkspace,
  };
}

async function seedBoardData(client, workspaceSeed) {
  const { workspaceId, ownerUserId, members, config } = workspaceSeed;

  // Clear existing boards and related data for this workspace
  await client.query(`DELETE FROM board WHERE "workspaceId" = $1`, [
    workspaceId,
  ]);

  const boardIdMap = new Map();

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
    boardIdMap.set(board.slug, boardId);

    const labelIds = new Map();
    for (const label of labelTemplates) {
      const labelInserted = await client.query(
        `INSERT INTO label
          ("publicId", name, "colourCode", "createdBy", "createdAt", "boardId")
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [publicId(), label.name, label.color, ownerUserId, now, boardId],
      );
      labelIds.set(label.name, Number(labelInserted.rows[0].id));
    }

    const listIds = new Map();
    for (let i = 0; i < listTemplates.length; i++) {
      const name = listTemplates[i];
      const listInserted = await client.query(
        `INSERT INTO list
          ("publicId", name, "index", "createdBy", "createdAt", "boardId")
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [publicId(), name, i, ownerUserId, now, boardId],
      );
      listIds.set(name, Number(listInserted.rows[0].id));
    }

    const listCardIndex = new Map();
    for (const template of cardTemplates.filter(
      (c) => c.boardSlug === board.slug,
    )) {
      const listId = listIds.get(template.list);
      if (!listId) continue;

      const createdAt = daysAgo(template.createdDaysAgo);
      const dueDate =
        template.dueDaysAgo != null ? daysAgo(template.dueDaysAgo) : null;
      const index = listCardIndex.get(template.list) || 0;
      listCardIndex.set(template.list, index + 1);

      const cardInserted = await client.query(
        `INSERT INTO card
          ("publicId", title, "index", "createdBy", "createdAt", "listId", "dueDate")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          publicId(),
          template.title,
          index,
          ownerUserId,
          createdAt,
          listId,
          dueDate,
        ],
      );
      const cardId = Number(cardInserted.rows[0].id);

      // Assign members
      for (const memberIndex of template.assigned) {
        const member = members[memberIndex % members.length];
        await client.query(
          `INSERT INTO _card_workspace_members ("cardId", "workspaceMemberPublicId") VALUES ($1, $2)`,
          [cardId, member.id],
        );
      }

      // Assign label
      const labelId = labelIds.get(template.label);
      if (labelId) {
        await client.query(
          `INSERT INTO _card_labels ("cardId", "labelId") VALUES ($1, $2)`,
          [cardId, labelId],
        );
      }

      // Simulate activities
      const activityMemberId =
        members[template.assigned[0] % members.length]?.id || null;
      await client.query(
        `INSERT INTO card_activity ("publicId", type, "cardId", "workspaceMemberPublicId", "createdAt") VALUES ($1, $2, $3, $4, $5)`,
        [publicId(), "card.created", cardId, activityMemberId, createdAt],
      );

      if (template.updatedAfterDays != null) {
        await client.query(
          `INSERT INTO card_activity ("publicId", type, "cardId", "workspaceMemberPublicId", "createdAt") VALUES ($1, $2, $3, $4, $5)`,
          [
            publicId(),
            "card.updated.description",
            cardId,
            activityMemberId,
            activityDate(template.createdDaysAgo, template.updatedAfterDays),
          ],
        );
      }

      if (template.archivedAfterDays != null) {
        await client.query(
          `INSERT INTO card_activity ("publicId", type, "cardId", "workspaceMemberPublicId", "createdAt") VALUES ($1, $2, $3, $4, $5)`,
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

async function main() {
  const authPool = new Pool({ connectionString: authUrl });
  const workspacePool = new Pool({ connectionString: workspaceUrl });
  const boardPool = new Pool({ connectionString: boardUrl });

  const authClient = await authPool.connect();
  const workspaceClient = await workspacePool.connect();
  const boardClient = await boardPool.connect();

  try {
    console.log("Beginning database seeding for smoke test account...");

    await authClient.query("BEGIN");
    const authUsers = await seedAuthData(authClient);
    await authClient.query("COMMIT");

    await workspaceClient.query("BEGIN");
    const workspaceSeed = await seedWorkspaceData(workspaceClient, authUsers);
    await workspaceClient.query("COMMIT");

    await boardClient.query("BEGIN");
    await seedBoardData(boardClient, workspaceSeed);
    await boardClient.query("COMMIT");

    console.log("\nSeeding complete!");
    console.log(
      `Workspace "${workspaceSeed.config.name}" (ID: ${workspaceSeed.workspaceId}) is ready for smoke testing.`,
    );
    console.log("Members created (password for all is 'password'):");
    workspaceSeed.members.forEach((m) =>
      console.log(
        `- ${m.email} (Role: ${smokeWorkspace.members.find((c) => c.email === m.email).role})`,
      ),
    );
  } catch (error) {
    console.error("\nError during seeding process. Rolling back changes.");
    await authClient.query("ROLLBACK");
    await workspaceClient.query("ROLLBACK");
    await boardClient.query("ROLLBACK");
    console.error(error);
    process.exitCode = 1;
  } finally {
    authClient.release();
    workspaceClient.release();
    boardClient.release();
    await authPool.end();
    await workspacePool.end();
    await boardPool.end();
  }
}

main();

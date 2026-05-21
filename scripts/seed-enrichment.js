#!/usr/bin/env node
"use strict";

const { Pool } = require("pg");
const { randomBytes, randomUUID } = require("crypto");

// Configuration
const authUrl = process.env.AUTH_DATABASE_URL || "postgres://admin:admin@localhost:5432/auth_db";
const workspaceUrl = process.env.WORKSPACE_DATABASE_URL || "postgres://admin:admin@localhost:5432/workspace_db";
const boardUrl = process.env.BOARD_DATABASE_URL || "postgres://admin:admin@localhost:5432/board_db";

const now = new Date();

function publicId() {
  return randomBytes(9).toString("base64url").slice(0, 12);
}

const sampleData = {
  users: [
    { id: randomUUID(), name: "Alice Smith", email: "alice@example.com", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" },
    { id: randomUUID(), name: "Bob Jones", email: "bob@example.com", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" },
    { id: randomUUID(), name: "Charlie Brown", email: "charlie@example.com", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie" },
  ],
  workspace: {
    name: "Engineering Team",
    slug: "engineering",
    description: "Core engineering workspace"
  },
  board: {
    name: "Sprint 1",
    slug: "sprint-1",
    description: "Active sprint board"
  }
};

async function seed() {
  const authPool = new Pool({ connectionString: authUrl });
  const workspacePool = new Pool({ connectionString: workspaceUrl });
  const boardPool = new Pool({ connectionString: boardUrl });

  const authClient = await authPool.connect();
  const workspaceClient = await workspacePool.connect();
  const boardClient = await boardPool.connect();

  try {
    console.log("Cleaning up existing data...");
    await boardClient.query("DELETE FROM card_activity");
    await boardClient.query("DELETE FROM _card_workspace_members");
    await boardClient.query("DELETE FROM card");
    await boardClient.query("DELETE FROM list");
    await boardClient.query("DELETE FROM label");
    await boardClient.query("DELETE FROM board");

    await workspaceClient.query("DELETE FROM workspace_members");
    await workspaceClient.query("DELETE FROM workspace");

    await authClient.query("DELETE FROM users");

    console.log("Seeding Auth Service users...");
    for (const user of sampleData.users) {
      await authClient.query(
        "INSERT INTO users (id, name, email, image, \"emailVerified\", role, \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [user.id, user.name, user.email, user.image, true, "user", now, now]
      );
    }

    console.log("Seeding Workspace Service...");
    const wsResult = await workspaceClient.query(
      "INSERT INTO workspace (\"publicId\", name, slug, description, \"createdBy\", \"createdAt\", plan) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [publicId(), sampleData.workspace.name, sampleData.workspace.slug, sampleData.workspace.description, sampleData.users[0].id, now, "pro"]
    );
    const workspaceId = wsResult.rows[0].id;

    const memberMap = new Map();
    for (let i = 0; i < sampleData.users.length; i++) {
      const user = sampleData.users[i];
      const pId = publicId();
      const res = await workspaceClient.query(
        "INSERT INTO workspace_members (\"publicId\", email, \"userId\", \"workspaceId\", \"createdBy\", \"createdAt\", role, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
        [pId, user.email, user.id, workspaceId, sampleData.users[0].id, now, i === 0 ? "admin" : "member", "active"]
      );
      memberMap.set(user.id, { id: res.rows[0].id, publicId: pId, userId: user.id, name: user.name });
    }

    console.log("Seeding Board Service...");
    const boardResult = await boardClient.query(
      "INSERT INTO board (\"publicId\", name, slug, description, \"createdBy\", \"workspaceId\", visibility, type, \"createdAt\") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, \"publicId\"",
      [publicId(), sampleData.board.name, sampleData.board.slug, sampleData.board.description, sampleData.users[0].id, workspaceId, "public", "regular", now]
    );
    const boardId = boardResult.rows[0].id;
    const boardPublicId = boardResult.rows[0].publicId;

    const listResult = await boardClient.query(
      "INSERT INTO list (\"publicId\", name, \"index\", \"createdBy\", \"createdAt\", \"boardId\") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [publicId(), "To Do", 0, sampleData.users[0].id, now, boardId]
    );
    const listId = listResult.rows[0].id;

    const cardResult = await boardClient.query(
      "INSERT INTO card (\"publicId\", title, description, \"index\", \"createdBy\", \"createdAt\", \"listId\") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, \"publicId\"",
      [publicId(), "Implement Auth Enrichment", "We need to enrich creators and assignees with names and avatars", 0, sampleData.users[0].id, now, listId]
    );
    const cardId = cardResult.rows[0].id;
    const cardPublicId = cardResult.rows[0].publicId;

    console.log("Assigning members to card...");
    const membersToAssign = [sampleData.users[0].id, sampleData.users[1].id];
    for (const userId of membersToAssign) {
      const member = memberMap.get(userId);
      await boardClient.query(
        "INSERT INTO _card_workspace_members (\"cardId\", \"workspaceMemberPublicId\") VALUES ($1, $2)",
        [cardId, member.publicId]
      );
    }

    console.log("Adding card activity...");
    await boardClient.query(
      "INSERT INTO card_activity (\"publicId\", type, \"cardId\", \"workspaceMemberPublicId\", \"createdBy\", \"createdAt\") VALUES ($1, $2, $3, $4, $5, $6)",
      [publicId(), "card.created", cardId, memberMap.get(sampleData.users[0].id).publicId, sampleData.users[0].id, now]
    );

    console.log("Seed completed successfully!");
    console.log("\n--- TEST DATA ---");
    console.log(`Workspace ID:  ${workspaceId}`);
    console.log(`Workspace Slug: ${sampleData.workspace.slug}`);
    console.log(`Board Public ID: ${boardPublicId}`);
    console.log(`Card Public ID:  ${cardPublicId}`);
    console.log("\nUsers & Members:");
    for (const [userId, member] of memberMap) {
      console.log(`- ${member.name}: UserID=${userId}, MemberPublicID=${member.publicId}`);
    }

  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    authClient.release();
    workspaceClient.release();
    boardClient.release();
    await authPool.end();
    await workspacePool.end();
    await boardPool.end();
  }
}

seed();

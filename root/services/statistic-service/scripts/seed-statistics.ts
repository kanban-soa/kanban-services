import "dotenv/config";
import { eq } from "drizzle-orm";
import {
  boards,
  cardActivities,
  cards,
  cardsToLabels,
  cardToWorkspaceMembers,
  labels,
  lists,
  users,
  workspaceMembers,
  workspaces,
} from "../schema";
import { db } from "../config/database";

const seedSlug = "stats-dashboard";
const seedDescription = "seed:stats-dashboard";

const now = new Date();
let publicIdCounter = 0;

function makePublicId(): string {
  const raw = `${Date.now().toString(36)}${(publicIdCounter++).toString(36)}`;
  return raw.slice(0, 12).padEnd(12, "0");
}

function daysAgo(days: number): Date {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date;
}

function hoursAgo(hours: number): Date {
  const date = new Date(now);
  date.setHours(date.getHours() - hours);
  return date;
}

function pick<T>(items: T[], index: number): T {
  return items[index % items.length];
}

async function resetSeed(): Promise<void> {
  await db.delete(workspaces).where(eq(workspaces.slug, seedSlug));
}

async function seedStatistics(): Promise<void> {
  const [owner, member, guest] = await db
    .insert(users)
    .values([
      {
        name: "Aki Tanaka",
        email: "aki.tanaka@example.com",
        emailVerified: true,
      },
      {
        name: "Ren Ito",
        email: "ren.ito@example.com",
        emailVerified: true,
      },
      {
        name: "Mira Sato",
        email: "mira.sato@example.com",
        emailVerified: true,
      },
    ])
    .returning();

  const [workspace] = await db
    .insert(workspaces)
    .values({
      publicId: makePublicId(),
      name: "Statistics Demo Workspace",
      description: seedDescription,
      slug: seedSlug,
      plan: "pro",
      showEmailsToMembers: true,
      createdBy: owner.id,
      createdAt: daysAgo(40),
    })
    .returning();

  const members = await db
    .insert(workspaceMembers)
    .values([
      {
        publicId: makePublicId(),
        email: owner.email,
        userId: owner.id,
        workspaceId: workspace.id,
        createdBy: owner.id,
        role: "admin",
        status: "active",
        createdAt: daysAgo(40),
      },
      {
        publicId: makePublicId(),
        email: member.email,
        userId: member.id,
        workspaceId: workspace.id,
        createdBy: owner.id,
        role: "member",
        status: "active",
        createdAt: daysAgo(35),
      },
      {
        publicId: makePublicId(),
        email: guest.email,
        userId: guest.id,
        workspaceId: workspace.id,
        createdBy: owner.id,
        role: "guest",
        status: "active",
        createdAt: daysAgo(20),
      },
    ])
    .returning();

  const [board] = await db
    .insert(boards)
    .values({
      publicId: makePublicId(),
      name: "Operations Board",
      description: "Seeded board for statistics dashboard",
      slug: "operations",
      createdBy: owner.id,
      createdAt: daysAgo(35),
      workspaceId: workspace.id,
      visibility: "private",
      type: "regular",
    })
    .returning();

  const boardLists = await db
    .insert(lists)
    .values([
      {
        publicId: makePublicId(),
        name: "Backlog",
        index: 0,
        createdBy: owner.id,
        createdAt: daysAgo(35),
        boardId: board.id,
      },
      {
        publicId: makePublicId(),
        name: "In Progress",
        index: 1,
        createdBy: owner.id,
        createdAt: daysAgo(35),
        boardId: board.id,
      },
      {
        publicId: makePublicId(),
        name: "Done",
        index: 2,
        createdBy: owner.id,
        createdAt: daysAgo(35),
        boardId: board.id,
      },
    ])
    .returning();

  const labelRows = await db
    .insert(labels)
    .values([
      {
        publicId: makePublicId(),
        name: "Urgent",
        colourCode: "#ef4444",
        createdBy: owner.id,
        createdAt: daysAgo(34),
        boardId: board.id,
      },
      {
        publicId: makePublicId(),
        name: "High Priority",
        colourCode: "#6366f1",
        createdBy: owner.id,
        createdAt: daysAgo(34),
        boardId: board.id,
      },
      {
        publicId: makePublicId(),
        name: "Normal",
        colourCode: "#a5b4fc",
        createdBy: owner.id,
        createdAt: daysAgo(34),
        boardId: board.id,
      },
    ])
    .returning();

  const listIndexMap = new Map<number, number>();
  const createdAtOffsets = [
    1, 1, 2, 2, 3, 3, 4, 5, 6, 6, 7, 7, 10, 11, 12, 13, 14, 16, 20, 22, 28, 31, 36, 45,
  ];

  const cardRows = await db
    .insert(cards)
    .values(
      createdAtOffsets.map((offset, idx) => {
        const list = pick(boardLists, idx);
        const listIndex = listIndexMap.get(list.id) ?? 0;
        listIndexMap.set(list.id, listIndex + 1);

        const createdAt = daysAgo(offset);
        const dueDate = idx % 6 === 0 ? daysAgo(2) : idx % 5 === 0 ? daysAgo(6) : null;

        return {
          publicId: makePublicId(),
          title: `Seeded task ${idx + 1}`,
          description: `Statistics seed card #${idx + 1}.`,
          index: listIndex,
          createdBy: pick([owner, member, guest], idx).id,
          createdAt,
          listId: list.id,
          dueDate,
        };
      }),
    )
    .returning();

  await db.insert(cardsToLabels).values(
    cardRows.map((card, idx) => ({
      cardId: card.id,
      labelId: labelRows[idx % labelRows.length]?.id ?? labelRows[0]?.id,
    })),
  );

  const memberAssignments = members.flatMap((workspaceMember) =>
    cardRows
      .filter((_, idx) => idx % members.length === members.indexOf(workspaceMember))
      .map((card) => ({
        cardId: card.id,
        workspaceMemberId: workspaceMember.id,
      })),
  );

  await db.insert(cardToWorkspaceMembers).values(memberAssignments);

  const activityRows = cardRows.flatMap((card, idx) => {
    const creator = pick([owner, member, guest], idx);
    const createdAt = card.createdAt ?? daysAgo(7);
    const activityEntries = [
      {
        publicId: makePublicId(),
        type: "card.created" as const,
        cardId: card.id,
        createdBy: creator.id,
        createdAt,
        workspaceMemberId: members[idx % members.length]?.id,
      },
    ];

    if (idx % 2 === 0) {
      activityEntries.push({
        publicId: makePublicId(),
        type: "card.updated.title" as const,
        cardId: card.id,
        createdBy: creator.id,
        createdAt: hoursAgo(12 + idx),
        fromTitle: card.title,
        toTitle: `${card.title} (updated)`,
        workspaceMemberId: members[(idx + 1) % members.length]?.id,
      });
    }

    if (idx % 5 === 0) {
      activityEntries.push({
        publicId: makePublicId(),
        type: "card.archived" as const,
        cardId: card.id,
        createdBy: creator.id,
        createdAt: hoursAgo(6 + idx),
        workspaceMemberId: members[(idx + 2) % members.length]?.id,
      });
    }

    return activityEntries;
  });

  await db.insert(cardActivities).values(activityRows);

  console.log("✅ Seeded statistics dashboard data.");
  console.log(`Workspace slug: ${seedSlug}`);
  console.log(`Workspace id: ${workspace.id}`);
  console.log(`Board id: ${board.id}`);
}

async function main(): Promise<void> {
  const shouldReset = process.argv.includes("--reset");

  if (shouldReset) {
    console.log("🧹 Removing previous seed workspace...");
    await resetSeed();
  }

  await seedStatistics();
}

main().catch((error) => {
  console.error("❌ Failed to seed statistics dashboard data.");
  console.error(error);
  process.exit(1);
});


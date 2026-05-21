const baseUrl = process.env.ACTIVITY_BASE_URL || "http://localhost:9010";
const workspaceId = process.env.ACTIVITY_WORKSPACE_ID || "1";
const userId = process.env.ACTIVITY_USER_ID || "00000000-0000-0000-0000-000000000000";

async function run() {
  const createResponse = await fetch(`${baseUrl}/internal/activities`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      workspaceId: Number(workspaceId),
      actorUserId: userId,
      actionType: "board.created",
      entityType: "board",
      entityId: "demo-board",
      metadata: { name: "Demo Board" },
    }),
  });

  const created = await createResponse.json();
  console.log("Create response:", created);

  const listResponse = await fetch(
    `${baseUrl}/api/activities/workspaces/${workspaceId}?limit=5&page=1`,
    {
      headers: {
        "x-user-id": userId,
        "x-user-email": "demo@example.com",
        "x-user-role": "admin",
      },
    },
  );

  const listed = await listResponse.json();
  console.log("List response:", listed);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});


const activityBaseUrl = process.env.ACTIVITY_BASE_URL || "http://localhost:9010";
const boardBaseUrl = process.env.BOARD_SERVICE_URL || "http://localhost:9003";
const boardCreatePath = process.env.BOARD_CREATE_PATH || "/boards";

const workspaceId = Number(process.env.ACTIVITY_WORKSPACE_ID || "1");
const userId = process.env.ACTIVITY_USER_ID || "00000000-0000-0000-0000-000000000000";
const userEmail = process.env.ACTIVITY_USER_EMAIL || "demo@example.com";
const userRole = process.env.ACTIVITY_USER_ROLE || "admin";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createBoard() {
  const response = await fetch(`${boardBaseUrl}${boardCreatePath}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-id": userId,
      "x-workspace-id": String(workspaceId),
    },
    body: JSON.stringify({
      name: `Smoke Board ${Date.now()}`,
      description: "Smoke test board",
      visibility: "private",
      type: "regular",
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.data) {
    throw new Error(`Board create failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload.data;
}

async function listActivities() {
  const response = await fetch(
    `${activityBaseUrl}/api/activities/workspaces/${workspaceId}?limit=10&page=1`,
    {
      headers: {
        "x-user-id": userId,
        "x-user-email": userEmail,
        "x-user-role": userRole,
      },
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Activity list failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload?.data?.items || [];
}

async function run() {
  const board = await createBoard();
  console.log("Created board:", board);

  // Allow the async emit to complete before listing.
  await sleep(300);

  const activities = await listActivities();
  const match = activities.find(
    (item) => item.actionType === "board.created" && item.entityId === board.publicId,
  );

  if (!match) {
    throw new Error("Expected board.created activity not found");
  }

  console.log("Found activity:", match);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});


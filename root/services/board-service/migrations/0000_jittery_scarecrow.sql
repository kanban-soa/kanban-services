CREATE TYPE "public"."board_type" AS ENUM('regular', 'template');--> statement-breakpoint
CREATE TYPE "public"."board_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TYPE "public"."card_activity_type" AS ENUM('card.created', 'card.updated.title', 'card.updated.description', 'card.updated.index', 'card.updated.list', 'card.updated.label.added', 'card.updated.label.removed', 'card.updated.member.added', 'card.updated.member.removed', 'card.updated.comment.added', 'card.updated.comment.updated', 'card.updated.comment.deleted', 'card.updated.checklist.added', 'card.updated.checklist.renamed', 'card.updated.checklist.deleted', 'card.updated.checklist.item.added', 'card.updated.checklist.item.updated', 'card.updated.checklist.item.completed', 'card.updated.checklist.item.uncompleted', 'card.updated.checklist.item.deleted', 'card.updated.attachment.added', 'card.updated.attachment.removed', 'card.updated.dueDate.added', 'card.updated.dueDate.updated', 'card.updated.dueDate.removed', 'card.archived');--> statement-breakpoint
CREATE TABLE "board" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"publicId" varchar(12) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(255) NOT NULL,
	"createdBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp,
	"deletedAt" timestamp,
	"deletedBy" uuid,
	"importId" bigint,
	"workspaceId" bigint NOT NULL,
	"visibility" "board_visibility" DEFAULT 'private' NOT NULL,
	"type" "board_type" DEFAULT 'regular' NOT NULL,
	"sourceBoardId" bigint,
	CONSTRAINT "board_publicId_unique" UNIQUE("publicId")
);
--> statement-breakpoint
ALTER TABLE "board" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_board_favorites" (
	"userId" uuid NOT NULL,
	"boardId" bigint NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_board_favorites_userId_boardId_pk" PRIMARY KEY("userId","boardId")
);
--> statement-breakpoint
CREATE TABLE "label" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"publicId" varchar(12) NOT NULL,
	"name" varchar(255) NOT NULL,
	"colourCode" varchar(12),
	"createdBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp,
	"boardId" bigint NOT NULL,
	"importId" bigint,
	"deletedAt" timestamp,
	"deletedBy" uuid,
	CONSTRAINT "label_publicId_unique" UNIQUE("publicId")
);
--> statement-breakpoint
ALTER TABLE "label" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "list" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"publicId" varchar(12) NOT NULL,
	"name" varchar(255) NOT NULL,
	"index" integer NOT NULL,
	"createdBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp,
	"deletedAt" timestamp,
	"deletedBy" uuid,
	"boardId" bigint NOT NULL,
	"importId" bigint,
	CONSTRAINT "list_publicId_unique" UNIQUE("publicId")
);
--> statement-breakpoint
ALTER TABLE "list" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "card_activity" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"publicId" varchar(12) NOT NULL,
	"type" "card_activity_type" NOT NULL,
	"cardId" bigint NOT NULL,
	"fromIndex" integer,
	"toIndex" integer,
	"fromListId" bigint,
	"toListId" bigint,
	"labelId" bigint,
	"workspaceMemberPublicId" varchar(12),
	"fromTitle" text,
	"toTitle" text,
	"fromDescription" text,
	"toDescription" text,
	"createdBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"commentId" bigint,
	"fromComment" text,
	"toComment" text,
	"fromDueDate" timestamp,
	"toDueDate" timestamp,
	"sourceBoardId" bigint,
	"attachmentId" bigint,
	CONSTRAINT "card_activity_publicId_unique" UNIQUE("publicId")
);
--> statement-breakpoint
ALTER TABLE "card_activity" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "_card_workspace_members" (
	"cardId" bigint NOT NULL,
	"workspaceMemberPublicId" varchar(12) NOT NULL,
	CONSTRAINT "_card_workspace_members_cardId_workspaceMemberPublicId_pk" PRIMARY KEY("cardId","workspaceMemberPublicId")
);
--> statement-breakpoint
ALTER TABLE "_card_workspace_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "card" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"publicId" varchar(12) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"index" integer NOT NULL,
	"createdBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp,
	"deletedAt" timestamp,
	"deletedBy" uuid,
	"listId" bigint NOT NULL,
	"importId" bigint,
	"dueDate" timestamp,
	CONSTRAINT "card_publicId_unique" UNIQUE("publicId")
);
--> statement-breakpoint
ALTER TABLE "card" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "_card_labels" (
	"cardId" bigint NOT NULL,
	"labelId" bigint NOT NULL,
	CONSTRAINT "_card_labels_cardId_labelId_pk" PRIMARY KEY("cardId","labelId")
);
--> statement-breakpoint
ALTER TABLE "_card_labels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_board_favorites" ADD CONSTRAINT "user_board_favorites_boardId_board_id_fk" FOREIGN KEY ("boardId") REFERENCES "public"."board"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label" ADD CONSTRAINT "label_boardId_board_id_fk" FOREIGN KEY ("boardId") REFERENCES "public"."board"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list" ADD CONSTRAINT "list_boardId_board_id_fk" FOREIGN KEY ("boardId") REFERENCES "public"."board"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_activity" ADD CONSTRAINT "card_activity_cardId_card_id_fk" FOREIGN KEY ("cardId") REFERENCES "public"."card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_activity" ADD CONSTRAINT "card_activity_fromListId_list_id_fk" FOREIGN KEY ("fromListId") REFERENCES "public"."list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_activity" ADD CONSTRAINT "card_activity_toListId_list_id_fk" FOREIGN KEY ("toListId") REFERENCES "public"."list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_activity" ADD CONSTRAINT "card_activity_labelId_label_id_fk" FOREIGN KEY ("labelId") REFERENCES "public"."label"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_activity" ADD CONSTRAINT "card_activity_sourceBoardId_board_id_fk" FOREIGN KEY ("sourceBoardId") REFERENCES "public"."board"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_card_workspace_members" ADD CONSTRAINT "_card_workspace_members_cardId_card_id_fk" FOREIGN KEY ("cardId") REFERENCES "public"."card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card" ADD CONSTRAINT "card_listId_list_id_fk" FOREIGN KEY ("listId") REFERENCES "public"."list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_card_labels" ADD CONSTRAINT "_card_labels_cardId_card_id_fk" FOREIGN KEY ("cardId") REFERENCES "public"."card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_card_labels" ADD CONSTRAINT "_card_labels_labelId_label_id_fk" FOREIGN KEY ("labelId") REFERENCES "public"."label"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "board_visibility_idx" ON "board" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "board_type_idx" ON "board" USING btree ("type");--> statement-breakpoint
CREATE INDEX "board_source_idx" ON "board" USING btree ("sourceBoardId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_slug_per_workspace" ON "board" USING btree ("workspaceId","slug") WHERE "board"."deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "user_board_favorite_user_idx" ON "user_board_favorites" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_board_favorite_board_idx" ON "user_board_favorites" USING btree ("boardId");
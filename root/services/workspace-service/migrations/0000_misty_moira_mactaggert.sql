CREATE TYPE "public"."workspace_plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."board_type" AS ENUM('regular', 'template');--> statement-breakpoint
CREATE TYPE "public"."board_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'member', 'observer', 'owner');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('invited', 'active', 'removed', 'paused');--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"publicId" varchar(12) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(255) NOT NULL,
	"plan" "workspace_plan" DEFAULT 'free' NOT NULL,
	"showEmailsToMembers" boolean DEFAULT true NOT NULL,
	"createdBy" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp,
	"deletedAt" timestamp,
	"deletedBy" uuid,
	CONSTRAINT "workspace_publicId_unique" UNIQUE("publicId"),
	CONSTRAINT "workspace_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "workspace" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE TABLE "workspace_members" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"publicId" varchar(12) NOT NULL,
	"email" varchar(255) NOT NULL,
	"userId" uuid,
	"workspaceId" bigint NOT NULL,
	"createdBy" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp,
	"deletedAt" timestamp,
	"deletedBy" uuid,
	"role" "role" NOT NULL,
	"roleId" bigint,
	"status" "member_status" DEFAULT 'invited' NOT NULL,
	CONSTRAINT "workspace_members_publicId_unique" UNIQUE("publicId")
);
--> statement-breakpoint
ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspace_member_permissions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"workspaceMemberId" bigint NOT NULL,
	"permission" varchar(64) NOT NULL,
	"granted" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "workspace_member_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspace_role_permissions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"workspaceRoleId" bigint NOT NULL,
	"permission" varchar(64) NOT NULL,
	"granted" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_role_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspace_roles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"publicId" varchar(12) NOT NULL,
	"workspaceId" bigint NOT NULL,
	"name" varchar(64) NOT NULL,
	"description" varchar(255),
	"hierarchyLevel" integer NOT NULL,
	"isSystem" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp,
	CONSTRAINT "workspace_roles_publicId_unique" UNIQUE("publicId")
);
--> statement-breakpoint
ALTER TABLE "workspace_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "board" ADD CONSTRAINT "board_workspaceId_workspace_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_workspace_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_roleId_workspace_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."workspace_roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_role_permissions" ADD CONSTRAINT "workspace_role_permissions_workspaceRoleId_workspace_roles_id_fk" FOREIGN KEY ("workspaceRoleId") REFERENCES "public"."workspace_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_roles" ADD CONSTRAINT "workspace_roles_workspaceId_workspace_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_created_by_idx" ON "workspace" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "workspace_deleted_by_idx" ON "workspace" USING btree ("deletedBy");--> statement-breakpoint
CREATE INDEX "workspace_deleted_at_idx" ON "workspace" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "board_visibility_idx" ON "board" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "board_type_idx" ON "board" USING btree ("type");--> statement-breakpoint
CREATE INDEX "board_source_idx" ON "board" USING btree ("sourceBoardId");--> statement-breakpoint
CREATE INDEX "board_workspace_idx" ON "board" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX "board_created_by_idx" ON "board" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "board_deleted_by_idx" ON "board" USING btree ("deletedBy");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_slug_per_workspace" ON "board" USING btree ("workspaceId","slug") WHERE "board"."deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "workspace_members_workspace_idx" ON "workspace_members" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX "workspace_members_user_idx" ON "workspace_members" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "workspace_members_role_idx" ON "workspace_members" USING btree ("roleId");--> statement-breakpoint
CREATE INDEX "workspace_members_deleted_at_idx" ON "workspace_members" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "workspace_members_created_by_idx" ON "workspace_members" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "workspace_members_deleted_by_idx" ON "workspace_members" USING btree ("deletedBy");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_member_permission" ON "workspace_member_permissions" USING btree ("workspaceMemberId","permission");--> statement-breakpoint
CREATE INDEX "permission_member_idx" ON "workspace_member_permissions" USING btree ("workspaceMemberId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_role_permission" ON "workspace_role_permissions" USING btree ("workspaceRoleId","permission");--> statement-breakpoint
CREATE INDEX "role_permissions_role_idx" ON "workspace_role_permissions" USING btree ("workspaceRoleId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_role_per_workspace" ON "workspace_roles" USING btree ("workspaceId","name");--> statement-breakpoint
CREATE INDEX "workspace_roles_workspace_idx" ON "workspace_roles" USING btree ("workspaceId");
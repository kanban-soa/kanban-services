CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publicId" varchar(12) NOT NULL,
	"type" varchar(255) NOT NULL,
	"userId" uuid NOT NULL,
	"cardId" uuid NOT NULL,
	"commentId" uuid NOT NULL,
	"workspaceId" uuid NOT NULL,
	"metadata" text,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "notifications_publicId_unique" UNIQUE("publicId")
);

ALTER TABLE "commentary" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "commentary_created_at_idx" ON "commentary" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "match_created_at_idx" ON "matches" USING btree ("created_at");
CREATE TABLE "beta_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"tester_id" text,
	"email" text NOT NULL,
	"app_version" text NOT NULL,
	"device_model" text NOT NULL,
	"android_version" text NOT NULL,
	"flows_tested" text NOT NULL,
	"rating_overall" integer NOT NULL,
	"rating_ux" integer NOT NULL,
	"rating_perf" integer NOT NULL,
	"bugs" text,
	"fav" text,
	"missing" text,
	"keep_using" text,
	"testimonial" text,
	"testimonial_opt_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beta_tester" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"play_email" text,
	"device_model" text,
	"android_version" text,
	"status" text DEFAULT 'invited' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "beta_tester_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "beta_feedback" ADD CONSTRAINT "beta_feedback_tester_id_beta_tester_id_fk" FOREIGN KEY ("tester_id") REFERENCES "public"."beta_tester"("id") ON DELETE cascade ON UPDATE no action;
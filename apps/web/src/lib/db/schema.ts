import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  tier: text("tier").notNull().default("free"),
  apiKey: text("api_key").unique(),
  dodoCustomerId: text("dodo_customer_id").unique(),
  dodoSubscriptionId: text("dodo_subscription_id").unique(),
  subscriptionStatus: text("subscription_status"),
  subscriptionProductId: text("subscription_product_id"),
  subscriptionRenewsAt: timestamp("subscription_renews_at"),
  subscriptionCancelAtPeriodEnd: boolean("subscription_cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const dodoWebhookEvent = pgTable("dodo_webhook_event", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const waitlist = pgTable("waitlist", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const deviceSession = pgTable("device_session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  deviceName: text("device_name"),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const accountNotificationSettings = pgTable("account_notification_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  agentResponseCompleted: boolean("agent_response_completed").notNull().default(true),
  agentQuestionInterruption: boolean("agent_question_interruption").notNull().default(true),
  agentPermissionInterruption: boolean("agent_permission_interruption").notNull().default(true),
  agentErrorInterruption: boolean("agent_error_interruption").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const betaTester = pgTable("beta_tester", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  playEmail: text("play_email"),
  deviceModel: text("device_model"),
  androidVersion: text("android_version"),
  status: text("status").notNull().default("invited"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const betaFeedback = pgTable("beta_feedback", {
  id: text("id").primaryKey(),
  testerId: text("tester_id").references(() => betaTester.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  appVersion: text("app_version").notNull(),
  deviceModel: text("device_model").notNull(),
  androidVersion: text("android_version").notNull(),
  flowsTested: text("flows_tested").notNull(),
  ratingOverall: integer("rating_overall").notNull(),
  ratingUx: integer("rating_ux").notNull(),
  ratingPerf: integer("rating_perf").notNull(),
  bugs: text("bugs"),
  fav: text("fav"),
  missing: text("missing"),
  keepUsing: text("keep_using"),
  testimonial: text("testimonial"),
  testimonialOptIn: boolean("testimonial_opt_in").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const pushDevice = pgTable("push_device", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  deviceSessionId: text("device_session_id")
    .references(() => deviceSession.id, { onDelete: "cascade" }),
  expoPushToken: text("expo_push_token").notNull().unique(),
  platform: text("platform").notNull(),
  deviceName: text("device_name"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

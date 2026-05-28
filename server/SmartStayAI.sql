CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "email" varchar(255) UNIQUE NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "full_name" varchar(255) NOT NULL,
  "phone" varchar(20),
  "avatar_url" text,
  "role" enum NOT NULL,
  "status" enum NOT NULL,
  "email_verified_at" timestamp,
  "last_login_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now()),
  "deleted_at" timestamp
);

CREATE TABLE "user_profiles" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid UNIQUE NOT NULL,
  "date_of_birth" date,
  "nationality" varchar(100),
  "id_card_number" varchar(50),
  "passport_number" varchar(50),
  "preferred_language" enum,
  "preferred_currency" enum,
  "marketing_opt_in" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "user_sessions" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "refresh_token_hash" varchar(255) NOT NULL,
  "device_info" jsonb,
  "ip_address" inet,
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "push_tokens" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "token" text NOT NULL,
  "platform" enum NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "hotel_partners" (
  "id" uuid PRIMARY KEY,
  "owner_id" uuid NOT NULL,
  "business_name" varchar(255) NOT NULL,
  "business_license" varchar(100) UNIQUE,
  "contact_email" varchar(255),
  "contact_phone" varchar(20),
  "status" enum NOT NULL,
  "commission_rate" decimal(5,2) NOT NULL,
  "approved_by" uuid,
  "approved_at" timestamp,
  "rejection_reason" text,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now()),
  "deleted_at" timestamp
);

CREATE TABLE "hotels" (
  "id" uuid PRIMARY KEY,
  "partner_id" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "slug" varchar(255) UNIQUE,
  "description" text,
  "address" text NOT NULL,
  "city" varchar(100) NOT NULL,
  "country" varchar(100) NOT NULL,
  "latitude" decimal(10,8),
  "longitude" decimal(11,8),
  "star_rating" smallint,
  "check_in_time" time,
  "check_out_time" time,
  "is_active" boolean NOT NULL DEFAULT true,
  "is_listed" boolean NOT NULL DEFAULT false,
  "settings" jsonb,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now()),
  "deleted_at" timestamp
);

CREATE TABLE "hotel_images" (
  "id" uuid PRIMARY KEY,
  "hotel_id" uuid NOT NULL,
  "url" text NOT NULL,
  "caption" varchar(255),
  "is_primary" boolean DEFAULT false,
  "sort_order" smallint DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "hotel_staff_assignments" (
  "id" uuid PRIMARY KEY,
  "hotel_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "assigned_role" enum NOT NULL,
  "assigned_at" timestamp NOT NULL DEFAULT (now()),
  "unassigned_at" timestamp
);

CREATE TABLE "amenities" (
  "id" uuid PRIMARY KEY,
  "name" varchar(100) UNIQUE NOT NULL,
  "icon" varchar(50),
  "category" enum NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "hotel_amenities" (
  "hotel_id" uuid NOT NULL,
  "amenity_id" uuid NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("hotel_id", "amenity_id")
);

CREATE TABLE "room_types" (
  "id" uuid PRIMARY KEY,
  "hotel_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" text,
  "max_occupancy" smallint NOT NULL,
  "base_price" decimal(12,2) NOT NULL,
  "area_sqm" decimal(6,2),
  "bed_type" varchar(50),
  "view_type" varchar(50),
  "is_active" boolean NOT NULL DEFAULT true,
  "embedding" vector(1536),
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "room_type_amenities" (
  "room_type_id" uuid NOT NULL,
  "amenity_id" uuid NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("room_type_id", "amenity_id")
);

CREATE TABLE "room_type_images" (
  "id" uuid PRIMARY KEY,
  "room_type_id" uuid NOT NULL,
  "url" text NOT NULL,
  "is_primary" boolean DEFAULT false,
  "sort_order" smallint DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "rooms" (
  "id" uuid PRIMARY KEY,
  "hotel_id" uuid NOT NULL,
  "room_type_id" uuid NOT NULL,
  "room_number" varchar(20) NOT NULL,
  "floor" smallint,
  "status" enum NOT NULL,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "room_availability" (
  "id" uuid PRIMARY KEY,
  "room_type_id" uuid NOT NULL,
  "hotel_id" uuid NOT NULL,
  "date" date NOT NULL,
  "total_rooms" smallint NOT NULL,
  "booked_rooms" smallint NOT NULL DEFAULT 0,
  "available_rooms" smallint,
  "price_override" decimal(12,2),
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "pricing_rules" (
  "id" uuid PRIMARY KEY,
  "hotel_id" uuid NOT NULL,
  "room_type_id" uuid,
  "name" varchar(100) NOT NULL,
  "rule_type" enum NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "day_of_week" smallint[],
  "occupancy_threshold" smallint,
  "adjustment_type" enum NOT NULL,
  "adjustment_value" decimal(10,2) NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "bookings" (
  "id" uuid PRIMARY KEY,
  "booking_code" varchar(20) UNIQUE NOT NULL,
  "customer_id" uuid NOT NULL,
  "hotel_id" uuid NOT NULL,
  "room_type_id" uuid NOT NULL,
  "check_in_date" date NOT NULL,
  "check_out_date" date NOT NULL,
  "num_nights" smallint NOT NULL,
  "num_guests" smallint NOT NULL,
  "base_price_per_night" decimal(12,2) NOT NULL,
  "subtotal" decimal(12,2) NOT NULL,
  "discount_amount" decimal(12,2) NOT NULL DEFAULT 0,
  "total_amount" decimal(12,2) NOT NULL,
  "status" enum NOT NULL,
  "source" enum NOT NULL,
  "special_requests" text,
  "cancellation_reason" text,
  "checked_in_at" timestamp,
  "checked_out_at" timestamp,
  "cancelled_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "booking_rooms" (
  "id" uuid PRIMARY KEY,
  "booking_id" uuid NOT NULL,
  "room_id" uuid NOT NULL,
  "assigned_at" timestamp NOT NULL
);

CREATE TABLE "booking_vouchers" (
  "id" uuid PRIMARY KEY,
  "booking_id" uuid UNIQUE NOT NULL,
  "voucher_code" varchar(50) UNIQUE NOT NULL,
  "qr_data" text NOT NULL,
  "issued_at" timestamp NOT NULL DEFAULT (now()),
  "used_at" timestamp,
  "expires_at" timestamp NOT NULL
);

CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY,
  "booking_id" uuid NOT NULL,
  "payment_method" enum NOT NULL,
  "transaction_id" varchar(255) UNIQUE NOT NULL,
  "amount" decimal(12,2) NOT NULL,
  "currency" varchar(10) NOT NULL DEFAULT 'VND',
  "status" enum NOT NULL,
  "gateway_response" jsonb,
  "paid_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "refunds" (
  "id" uuid PRIMARY KEY,
  "payment_id" uuid NOT NULL,
  "requested_by" uuid NOT NULL,
  "amount" decimal(12,2) NOT NULL,
  "reason" text NOT NULL,
  "status" enum NOT NULL,
  "refund_transaction_id" varchar(255),
  "processed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "invoices" (
  "id" uuid PRIMARY KEY,
  "booking_id" uuid UNIQUE NOT NULL,
  "invoice_number" varchar(50) UNIQUE NOT NULL,
  "issued_at" timestamp NOT NULL DEFAULT (now()),
  "pdf_url" text,
  "subtotal" decimal(12,2) NOT NULL,
  "tax_amount" decimal(12,2) NOT NULL DEFAULT 0,
  "total_amount" decimal(12,2) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "platform_commissions" (
  "id" uuid PRIMARY KEY,
  "booking_id" uuid UNIQUE NOT NULL,
  "partner_id" uuid NOT NULL,
  "payment_id" uuid NOT NULL,
  "commission_rate" decimal(5,2) NOT NULL,
  "commission_amount" decimal(12,2) NOT NULL,
  "status" enum NOT NULL,
  "settled_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "reviews" (
  "id" uuid PRIMARY KEY,
  "booking_id" uuid UNIQUE NOT NULL,
  "customer_id" uuid NOT NULL,
  "hotel_id" uuid NOT NULL,
  "overall_rating" smallint NOT NULL,
  "cleanliness_rating" smallint NOT NULL,
  "service_rating" smallint NOT NULL,
  "location_rating" smallint NOT NULL,
  "value_rating" smallint NOT NULL,
  "title" varchar(255),
  "content" text NOT NULL,
  "sentiment_label" enum,
  "sentiment_score" decimal(4,3),
  "sentiment_analyzed_at" timestamp,
  "is_verified" boolean NOT NULL DEFAULT true,
  "is_flagged" boolean NOT NULL DEFAULT false,
  "manager_response" text,
  "status" enum NOT NULL DEFAULT 'pending',
  "embedding" vector(1536),
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "review_images" (
  "id" uuid PRIMARY KEY,
  "review_id" uuid NOT NULL,
  "url" text NOT NULL,
  "uploaded_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "smart_alerts" (
  "id" uuid PRIMARY KEY,
  "hotel_id" uuid,
  "alert_type" enum NOT NULL,
  "severity" enum NOT NULL,
  "title" varchar(255) NOT NULL,
  "message" text NOT NULL,
  "data" jsonb,
  "target_role" enum NOT NULL,
  "is_read" boolean NOT NULL DEFAULT false,
  "read_by" uuid,
  "read_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "conversations" (
  "id" uuid PRIMARY KEY,
  "hotel_id" uuid NOT NULL,
  "user_id" uuid,
  "booking_id" uuid,
  "channel" enum NOT NULL,
  "status" enum NOT NULL,
  "assigned_to" uuid,
  "subject" varchar(255),
  "started_at" timestamp NOT NULL DEFAULT (now()),
  "resolved_at" timestamp,
  "last_message_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "messages" (
  "id" uuid PRIMARY KEY,
  "conversation_id" uuid NOT NULL,
  "sender_type" enum NOT NULL,
  "sender_id" uuid,
  "content" text NOT NULL,
  "message_type" enum NOT NULL,
  "metadata" jsonb,
  "is_ai_suggested" boolean NOT NULL DEFAULT false,
  "is_approved" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "ai_function_calls" (
  "id" uuid PRIMARY KEY,
  "conversation_id" uuid NOT NULL,
  "message_id" uuid NOT NULL,
  "function_name" varchar(100) NOT NULL,
  "parameters" jsonb NOT NULL,
  "result" jsonb,
  "success" boolean NOT NULL,
  "execution_time_ms" integer,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "faq_knowledge_base" (
  "id" uuid PRIMARY KEY,
  "hotel_id" uuid NOT NULL,
  "category" varchar(100),
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "embedding" vector(1536) NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "ai_prompt_templates" (
  "id" uuid PRIMARY KEY,
  "hotel_id" uuid,
  "template_type" enum NOT NULL,
  "name" varchar(100) NOT NULL,
  "content" text NOT NULL,
  "variables" jsonb,
  "is_active" boolean NOT NULL DEFAULT true,
  "version" smallint NOT NULL DEFAULT 1,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "type" enum NOT NULL,
  "title" varchar(255) NOT NULL,
  "body" text NOT NULL,
  "data" jsonb,
  "channel" enum NOT NULL,
  "status" enum NOT NULL,
  "sent_at" timestamp,
  "read_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "loyalty_accounts" (
  "id" uuid PRIMARY KEY,
  "customer_id" uuid UNIQUE NOT NULL,
  "total_points" integer NOT NULL DEFAULT 0,
  "tier" enum NOT NULL DEFAULT 'bronze',
  "tier_updated_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "loyalty_transactions" (
  "id" uuid PRIMARY KEY,
  "account_id" uuid NOT NULL,
  "booking_id" uuid,
  "type" enum NOT NULL,
  "points" integer NOT NULL,
  "description" text,
  "expires_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "promotions" (
  "id" uuid PRIMARY KEY,
  "hotel_id" uuid NOT NULL,
  "created_by" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "code" varchar(50) UNIQUE NOT NULL,
  "description" text,
  "discount_type" enum NOT NULL,
  "discount_value" decimal(10,2) NOT NULL,
  "min_nights" smallint,
  "max_uses" integer,
  "used_count" integer NOT NULL DEFAULT 0,
  "start_date" timestamp NOT NULL,
  "end_date" timestamp NOT NULL,
  "applicable_room_type_ids" uuid[],
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "booking_promotions" (
  "booking_id" uuid NOT NULL,
  "promotion_id" uuid NOT NULL,
  "discount_applied" decimal(12,2) NOT NULL,
  "applied_at" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("booking_id", "promotion_id")
);

CREATE TABLE "social_accounts" (
  "id" uuid PRIMARY KEY,
  "hotel_id" uuid NOT NULL,
  "platform" enum NOT NULL,
  "account_name" varchar(255) NOT NULL,
  "account_id" varchar(255),
  "access_token_encrypted" text NOT NULL,
  "token_expires_at" timestamp,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "content_drafts" (
  "id" uuid PRIMARY KEY,
  "hotel_id" uuid NOT NULL,
  "created_by" uuid NOT NULL,
  "content_type" enum NOT NULL,
  "platform" enum NOT NULL,
  "topic" varchar(255),
  "ai_prompt_used" text,
  "content" text NOT NULL,
  "edited_content" text,
  "status" enum NOT NULL DEFAULT 'draft',
  "approved_by" uuid,
  "approved_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "scheduled_posts" (
  "id" uuid PRIMARY KEY,
  "content_draft_id" uuid NOT NULL,
  "social_account_id" uuid NOT NULL,
  "scheduled_at" timestamp NOT NULL,
  "published_at" timestamp,
  "platform_post_id" varchar(255),
  "status" enum NOT NULL DEFAULT 'scheduled',
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "content_metrics" (
  "id" uuid PRIMARY KEY,
  "scheduled_post_id" uuid,
  "hotel_id" uuid NOT NULL,
  "date" date,
  "reach" integer,
  "impressions" integer,
  "engagement" integer,
  "click_through" integer,
  "bookings_attributed" integer,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "action" varchar(100) NOT NULL,
  "entity_type" varchar(50) NOT NULL,
  "entity_id" uuid NOT NULL,
  "old_value" jsonb,
  "new_value" jsonb,
  "ip_address" inet,
  "user_agent" text,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "daily_occupancy_stats" (
  "id" uuid PRIMARY KEY,
  "hotel_id" uuid NOT NULL,
  "date" date NOT NULL,
  "total_rooms" integer NOT NULL,
  "occupied_rooms" integer NOT NULL,
  "occupancy_rate" decimal(5,2),
  "revenue" decimal(12,2),
  "adr" decimal(12,2),
  "revpar" decimal(12,2),
  "new_bookings" integer,
  "cancellations" integer,
  "calculated_at" timestamp NOT NULL
);

CREATE TABLE "platform_revenue_stats" (
  "id" uuid PRIMARY KEY,
  "date" date NOT NULL,
  "total_bookings" integer NOT NULL,
  "total_gmv" decimal(12,2),
  "total_commission" decimal(12,2),
  "active_hotels" integer,
  "active_partners" integer,
  "new_partners" integer,
  "calculated_at" timestamp NOT NULL
);

COMMENT ON COLUMN "users"."role" IS 'guest, customer, staff, marketer, hotel_partner, platform_manager, admin';

COMMENT ON COLUMN "users"."status" IS 'active, inactive, suspended';

COMMENT ON COLUMN "user_profiles"."preferred_language" IS 'vi, en';

COMMENT ON COLUMN "user_profiles"."preferred_currency" IS 'VND, USD';

COMMENT ON COLUMN "push_tokens"."platform" IS 'ios, android, web';

COMMENT ON COLUMN "hotel_partners"."status" IS 'pending, approved, suspended, rejected';

COMMENT ON COLUMN "hotels"."star_rating" IS '1-5';

COMMENT ON COLUMN "hotel_staff_assignments"."assigned_role" IS 'staff, marketer';

COMMENT ON COLUMN "amenities"."category" IS 'room, hotel, service';

COMMENT ON COLUMN "room_types"."embedding" IS 'pgvector - semantic search';

COMMENT ON COLUMN "rooms"."status" IS 'available, occupied, maintenance, cleaning';

COMMENT ON COLUMN "room_availability"."available_rooms" IS 'GENERATED: total_rooms - booked_rooms';

COMMENT ON COLUMN "pricing_rules"."rule_type" IS 'seasonal, weekend, occupancy, early_bird';

COMMENT ON COLUMN "pricing_rules"."occupancy_threshold" IS '0-100%';

COMMENT ON COLUMN "pricing_rules"."adjustment_type" IS 'percentage, fixed';

COMMENT ON COLUMN "bookings"."status" IS 'pending, confirmed, checked_in, checked_out, cancelled, no_show';

COMMENT ON COLUMN "bookings"."source" IS 'website, mobile_app, chatbot, walk_in, staff';

COMMENT ON COLUMN "payments"."payment_method" IS 'vnpay, sepay, stripe, cash';

COMMENT ON COLUMN "payments"."status" IS 'pending, completed, failed, refunded';

COMMENT ON COLUMN "refunds"."status" IS 'pending, approved, processed, rejected';

COMMENT ON COLUMN "platform_commissions"."status" IS 'pending, settled, disputed';

COMMENT ON COLUMN "reviews"."overall_rating" IS '1-5';

COMMENT ON COLUMN "reviews"."cleanliness_rating" IS '1-5';

COMMENT ON COLUMN "reviews"."service_rating" IS '1-5';

COMMENT ON COLUMN "reviews"."location_rating" IS '1-5';

COMMENT ON COLUMN "reviews"."value_rating" IS '1-5';

COMMENT ON COLUMN "reviews"."sentiment_label" IS 'positive, neutral, negative';

COMMENT ON COLUMN "reviews"."sentiment_score" IS '0.0-1.0';

COMMENT ON COLUMN "reviews"."status" IS 'pending, published, hidden';

COMMENT ON COLUMN "reviews"."embedding" IS 'pgvector - review similarity';

COMMENT ON COLUMN "smart_alerts"."alert_type" IS 'low_occupancy, negative_review_spike, unusual_booking, payment_issue, policy_violation';

COMMENT ON COLUMN "smart_alerts"."severity" IS 'low, medium, high, critical';

COMMENT ON COLUMN "smart_alerts"."target_role" IS 'hotel_partner, platform_manager, admin';

COMMENT ON COLUMN "conversations"."channel" IS 'chatbot, inbox, email, facebook, instagram';

COMMENT ON COLUMN "conversations"."status" IS 'active, resolved, escalated, closed';

COMMENT ON COLUMN "messages"."sender_type" IS 'user, ai_bot, staff, system';

COMMENT ON COLUMN "messages"."message_type" IS 'text, image, quick_reply, booking_card';

COMMENT ON COLUMN "faq_knowledge_base"."embedding" IS 'pgvector - RAG retrieval';

COMMENT ON COLUMN "ai_prompt_templates"."template_type" IS 'chatbot_system, marketing_content, review_response';

COMMENT ON COLUMN "notifications"."type" IS 'booking_confirmed, payment_success, check_in_reminder, review_request, alert, promotion';

COMMENT ON COLUMN "notifications"."channel" IS 'push, email, sms, in_app';

COMMENT ON COLUMN "notifications"."status" IS 'pending, sent, failed, read';

COMMENT ON COLUMN "loyalty_accounts"."tier" IS 'bronze, silver, gold, platinum';

COMMENT ON COLUMN "loyalty_transactions"."type" IS 'earn, redeem, expire, adjustment';

COMMENT ON COLUMN "promotions"."discount_type" IS 'percentage, fixed_amount, free_night';

COMMENT ON COLUMN "social_accounts"."platform" IS 'facebook, instagram';

COMMENT ON COLUMN "content_drafts"."content_type" IS 'caption, blog_post, hashtag_set, ad_copy';

COMMENT ON COLUMN "content_drafts"."platform" IS 'facebook, instagram, blog';

COMMENT ON COLUMN "content_drafts"."status" IS 'draft, approved, rejected, scheduled, published';

COMMENT ON COLUMN "scheduled_posts"."status" IS 'scheduled, published, failed';

ALTER TABLE "user_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_sessions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "push_tokens" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "hotel_partners" ADD FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "hotel_partners" ADD FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "smart_alerts" ADD FOREIGN KEY ("read_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "audit_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "loyalty_accounts" ADD FOREIGN KEY ("customer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "promotions" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "content_drafts" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "content_drafts" ADD FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "conversations" ADD FOREIGN KEY ("assigned_to") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "refunds" ADD FOREIGN KEY ("requested_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "hotels" ADD FOREIGN KEY ("partner_id") REFERENCES "hotel_partners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "platform_commissions" ADD FOREIGN KEY ("partner_id") REFERENCES "hotel_partners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "hotel_images" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "hotel_staff_assignments" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "room_types" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "rooms" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "room_availability" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pricing_rules" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "bookings" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reviews" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "smart_alerts" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "conversations" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "faq_knowledge_base" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ai_prompt_templates" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "promotions" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "social_accounts" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "content_drafts" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "daily_occupancy_stats" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "content_metrics" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "hotel_amenities" ADD FOREIGN KEY ("amenity_id") REFERENCES "amenities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "hotel_amenities" ADD FOREIGN KEY ("hotel_id") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "room_type_amenities" ADD FOREIGN KEY ("amenity_id") REFERENCES "amenities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "room_type_amenities" ADD FOREIGN KEY ("room_type_id") REFERENCES "room_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "room_type_images" ADD FOREIGN KEY ("room_type_id") REFERENCES "room_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "rooms" ADD FOREIGN KEY ("room_type_id") REFERENCES "room_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "room_availability" ADD FOREIGN KEY ("room_type_id") REFERENCES "room_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pricing_rules" ADD FOREIGN KEY ("room_type_id") REFERENCES "room_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "bookings" ADD FOREIGN KEY ("room_type_id") REFERENCES "room_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "booking_rooms" ADD FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "booking_rooms" ADD FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "booking_vouchers" ADD FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "payments" ADD FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "invoices" ADD FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "platform_commissions" ADD FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reviews" ADD FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "loyalty_transactions" ADD FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "conversations" ADD FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "booking_promotions" ADD FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "bookings" ADD FOREIGN KEY ("customer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "refunds" ADD FOREIGN KEY ("payment_id") REFERENCES "payments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "loyalty_transactions" ADD FOREIGN KEY ("account_id") REFERENCES "loyalty_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "messages" ADD FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ai_function_calls" ADD FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ai_function_calls" ADD FOREIGN KEY ("message_id") REFERENCES "messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "messages" ADD FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "review_images" ADD FOREIGN KEY ("review_id") REFERENCES "reviews" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "booking_promotions" ADD FOREIGN KEY ("promotion_id") REFERENCES "promotions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "scheduled_posts" ADD FOREIGN KEY ("content_draft_id") REFERENCES "content_drafts" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "scheduled_posts" ADD FOREIGN KEY ("social_account_id") REFERENCES "social_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "content_metrics" ADD FOREIGN KEY ("scheduled_post_id") REFERENCES "scheduled_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "users" ADD FOREIGN KEY ("id") REFERENCES "hotel_staff_assignments" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

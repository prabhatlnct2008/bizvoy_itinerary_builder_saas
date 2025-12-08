BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "agencies" (
	"id"	VARCHAR NOT NULL,
	"name"	VARCHAR(255) NOT NULL,
	"subdomain"	VARCHAR(100),
	"logo_url"	VARCHAR(500),
	"contact_email"	VARCHAR(255) NOT NULL,
	"contact_phone"	VARCHAR(50),
	"is_active"	BOOLEAN NOT NULL,
	"created_at"	DATETIME NOT NULL,
	"updated_at"	DATETIME NOT NULL,
	"legal_name"	VARCHAR(255),
	"country"	VARCHAR(100),
	"timezone"	VARCHAR(100),
	"default_currency"	VARCHAR(10),
	"website_url"	VARCHAR(500),
	"internal_notes"	TEXT,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "permissions" (
	"id"	VARCHAR NOT NULL,
	"module"	VARCHAR(100) NOT NULL,
	"action"	VARCHAR(50) NOT NULL,
	"codename"	VARCHAR(150) NOT NULL,
	PRIMARY KEY("id"),
	CONSTRAINT "_module_action_uc" UNIQUE("module","action")
);
CREATE TABLE IF NOT EXISTS "users" (
	"id"	VARCHAR NOT NULL,
	"agency_id"	VARCHAR,
	"email"	VARCHAR(255) NOT NULL,
	"hashed_password"	VARCHAR(255) NOT NULL,
	"full_name"	VARCHAR(255) NOT NULL,
	"is_active"	BOOLEAN NOT NULL,
	"is_superuser"	BOOLEAN NOT NULL,
	"created_at"	DATETIME NOT NULL,
	"updated_at"	DATETIME NOT NULL,
	"phone"	VARCHAR(50),
	"is_bizvoy_admin"	BOOLEAN NOT NULL,
	"force_password_reset"	BOOLEAN NOT NULL,
	CONSTRAINT "_agency_email_uc" UNIQUE("agency_id","email"),
	PRIMARY KEY("id"),
	FOREIGN KEY("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "roles" (
	"id"	VARCHAR NOT NULL,
	"agency_id"	VARCHAR NOT NULL,
	"name"	VARCHAR(100) NOT NULL,
	"description"	TEXT,
	"created_at"	DATETIME NOT NULL,
	"updated_at"	DATETIME NOT NULL,
	PRIMARY KEY("id"),
	CONSTRAINT "_agency_role_name_uc" UNIQUE("agency_id","name"),
	FOREIGN KEY("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "activity_types" (
	"id"	VARCHAR(36) NOT NULL,
	"agency_id"	VARCHAR(36) NOT NULL,
	"name"	VARCHAR(50) NOT NULL,
	"description"	TEXT,
	"icon"	VARCHAR(50),
	"created_at"	DATETIME NOT NULL,
	"updated_at"	DATETIME NOT NULL,
	CONSTRAINT "uq_activity_type_agency_name" UNIQUE("agency_id","name"),
	PRIMARY KEY("id"),
	FOREIGN KEY("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "company_profiles" (
	"id"	VARCHAR(36) NOT NULL,
	"agency_id"	VARCHAR(36) NOT NULL,
	"company_name"	VARCHAR(200),
	"tagline"	VARCHAR(200),
	"description"	TEXT,
	"logo_path"	VARCHAR(500),
	"email"	VARCHAR(200),
	"phone"	VARCHAR(50),
	"website_url"	VARCHAR(300),
	"whatsapp_number"	VARCHAR(50),
	"show_phone"	BOOLEAN NOT NULL,
	"show_email"	BOOLEAN NOT NULL,
	"show_website"	BOOLEAN NOT NULL,
	"payment_qr_path"	VARCHAR(500),
	"payment_note"	TEXT,
	"bank_account_name"	VARCHAR(200),
	"bank_name"	VARCHAR(200),
	"bank_account_number"	VARCHAR(100),
	"bank_ifsc_swift"	VARCHAR(50),
	"bank_reference_note"	TEXT,
	"created_at"	DATETIME NOT NULL,
	"updated_at"	DATETIME NOT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "role_permissions" (
	"id"	VARCHAR NOT NULL,
	"role_id"	VARCHAR NOT NULL,
	"permission_id"	VARCHAR NOT NULL,
	PRIMARY KEY("id"),
	CONSTRAINT "_role_permission_uc" UNIQUE("role_id","permission_id"),
	FOREIGN KEY("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
	FOREIGN KEY("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "user_roles" (
	"id"	VARCHAR NOT NULL,
	"user_id"	VARCHAR NOT NULL,
	"role_id"	VARCHAR NOT NULL,
	CONSTRAINT "_user_role_uc" UNIQUE("user_id","role_id"),
	PRIMARY KEY("id"),
	FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
	FOREIGN KEY("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "activities" (
	"id"	VARCHAR(36) NOT NULL,
	"agency_id"	VARCHAR(36) NOT NULL,
	"activity_type_id"	VARCHAR(36) NOT NULL,
	"created_by_id"	VARCHAR(36),
	"name"	VARCHAR(200) NOT NULL,
	"category_label"	VARCHAR(50),
	"location_display"	VARCHAR(200),
	"short_description"	TEXT,
	"client_description"	TEXT,
	"default_duration_value"	INTEGER,
	"default_duration_unit"	VARCHAR(7),
	"rating"	NUMERIC(2, 1),
	"group_size_label"	VARCHAR(50),
	"cost_type"	VARCHAR(8) NOT NULL,
	"cost_display"	VARCHAR(100),
	"highlights"	JSON,
	"tags"	JSON,
	"is_active"	BOOLEAN NOT NULL,
	"internal_notes"	TEXT,
	"created_at"	DATETIME NOT NULL,
	"updated_at"	DATETIME NOT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE,
	FOREIGN KEY("activity_type_id") REFERENCES "activity_types"("id") ON DELETE RESTRICT,
	FOREIGN KEY("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS "templates" (
	"id"	VARCHAR NOT NULL,
	"agency_id"	VARCHAR NOT NULL,
	"name"	VARCHAR(255) NOT NULL,
	"destination"	VARCHAR(255) NOT NULL,
	"duration_days"	INTEGER NOT NULL,
	"duration_nights"	INTEGER NOT NULL,
	"description"	TEXT,
	"approximate_price"	NUMERIC(10, 2),
	"status"	VARCHAR(9) NOT NULL,
	"created_by"	VARCHAR,
	"created_at"	DATETIME NOT NULL,
	"updated_at"	DATETIME NOT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE,
	FOREIGN KEY("created_by") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS "activity_images" (
	"id"	VARCHAR(36) NOT NULL,
	"activity_id"	VARCHAR(36) NOT NULL,
	"file_path"	VARCHAR(500) NOT NULL,
	"file_url"	VARCHAR(500),
	"display_order"	INTEGER NOT NULL,
	"is_primary"	BOOLEAN NOT NULL,
	"is_hero"	BOOLEAN NOT NULL,
	"uploaded_at"	DATETIME NOT NULL,
	CONSTRAINT "uq_activity_image_display_order" UNIQUE("activity_id","display_order"),
	PRIMARY KEY("id"),
	FOREIGN KEY("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "template_days" (
	"id"	VARCHAR NOT NULL,
	"template_id"	VARCHAR NOT NULL,
	"day_number"	INTEGER NOT NULL,
	"title"	VARCHAR(255),
	"notes"	TEXT,
	PRIMARY KEY("id"),
	CONSTRAINT "_template_day_uc" UNIQUE("template_id","day_number"),
	FOREIGN KEY("template_id") REFERENCES "templates"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "itineraries" (
	"id"	VARCHAR NOT NULL,
	"agency_id"	VARCHAR NOT NULL,
	"template_id"	VARCHAR,
	"trip_name"	VARCHAR(255) NOT NULL,
	"client_name"	VARCHAR(255) NOT NULL,
	"client_email"	VARCHAR(255),
	"client_phone"	VARCHAR(50),
	"destination"	VARCHAR(255) NOT NULL,
	"start_date"	DATE NOT NULL,
	"end_date"	DATE NOT NULL,
	"num_adults"	INTEGER NOT NULL,
	"num_children"	INTEGER NOT NULL,
	"status"	VARCHAR(9) NOT NULL,
	"total_price"	NUMERIC(10, 2),
	"special_notes"	TEXT,
	"created_by"	VARCHAR,
	"created_at"	DATETIME NOT NULL,
	"updated_at"	DATETIME NOT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE,
	FOREIGN KEY("template_id") REFERENCES "templates"("id") ON DELETE SET NULL,
	FOREIGN KEY("created_by") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS "template_day_activities" (
	"id"	VARCHAR NOT NULL,
	"template_day_id"	VARCHAR NOT NULL,
	"activity_id"	VARCHAR NOT NULL,
	"display_order"	INTEGER NOT NULL,
	"time_slot"	VARCHAR(50),
	"custom_notes"	TEXT,
	CONSTRAINT "_template_day_activity_uc" UNIQUE("template_day_id","activity_id"),
	PRIMARY KEY("id"),
	FOREIGN KEY("template_day_id") REFERENCES "template_days"("id") ON DELETE CASCADE,
	FOREIGN KEY("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS "itinerary_days" (
	"id"	VARCHAR NOT NULL,
	"itinerary_id"	VARCHAR NOT NULL,
	"day_number"	INTEGER NOT NULL,
	"actual_date"	DATE NOT NULL,
	"title"	VARCHAR(255),
	"notes"	TEXT,
	PRIMARY KEY("id"),
	CONSTRAINT "_itinerary_day_uc" UNIQUE("itinerary_id","day_number"),
	FOREIGN KEY("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "itinerary_pricing" (
	"id"	VARCHAR(36) NOT NULL,
	"itinerary_id"	VARCHAR(36) NOT NULL,
	"base_package"	NUMERIC(10, 2),
	"taxes_fees"	NUMERIC(10, 2),
	"discount_code"	VARCHAR(50),
	"discount_amount"	NUMERIC(10, 2),
	"total"	NUMERIC(10, 2),
	"currency"	VARCHAR(10) NOT NULL,
	"pricing_notes"	TEXT,
	"created_at"	DATETIME NOT NULL,
	"updated_at"	DATETIME NOT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "share_links" (
	"id"	VARCHAR NOT NULL,
	"itinerary_id"	VARCHAR NOT NULL,
	"token"	VARCHAR(100) NOT NULL,
	"is_active"	BOOLEAN NOT NULL,
	"live_updates_enabled"	BOOLEAN NOT NULL,
	"expires_at"	DATETIME,
	"view_count"	INTEGER NOT NULL,
	"last_viewed_at"	DATETIME,
	"created_at"	DATETIME NOT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "pdf_exports" (
	"id"	VARCHAR NOT NULL,
	"itinerary_id"	VARCHAR NOT NULL,
	"file_path"	VARCHAR(500) NOT NULL,
	"generated_by"	VARCHAR,
	"generated_at"	DATETIME NOT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE,
	FOREIGN KEY("generated_by") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS "itinerary_day_activities" (
	"id"	VARCHAR NOT NULL,
	"itinerary_day_id"	VARCHAR NOT NULL,
	"activity_id"	VARCHAR NOT NULL,
	"display_order"	INTEGER NOT NULL,
	"time_slot"	VARCHAR(50),
	"custom_notes"	TEXT,
	"custom_price"	NUMERIC(10, 2),
	CONSTRAINT "_itinerary_day_activity_uc" UNIQUE("itinerary_day_id","activity_id"),
	PRIMARY KEY("id"),
	FOREIGN KEY("itinerary_day_id") REFERENCES "itinerary_days"("id") ON DELETE CASCADE,
	FOREIGN KEY("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS "ix_agencies_name" ON "agencies" (
	"name"
);
CREATE UNIQUE INDEX IF NOT EXISTS "ix_agencies_subdomain" ON "agencies" (
	"subdomain"
);
CREATE INDEX IF NOT EXISTS "ix_permissions_module" ON "permissions" (
	"module"
);
CREATE UNIQUE INDEX IF NOT EXISTS "ix_permissions_codename" ON "permissions" (
	"codename"
);
CREATE INDEX IF NOT EXISTS "ix_users_agency_id" ON "users" (
	"agency_id"
);
CREATE INDEX IF NOT EXISTS "ix_users_email" ON "users" (
	"email"
);
CREATE INDEX IF NOT EXISTS "ix_roles_name" ON "roles" (
	"name"
);
CREATE INDEX IF NOT EXISTS "ix_roles_agency_id" ON "roles" (
	"agency_id"
);
CREATE UNIQUE INDEX IF NOT EXISTS "ix_company_profiles_agency_id" ON "company_profiles" (
	"agency_id"
);
CREATE INDEX IF NOT EXISTS "ix_activities_location_display" ON "activities" (
	"location_display"
);
CREATE INDEX IF NOT EXISTS "ix_activities_name" ON "activities" (
	"name"
);
CREATE INDEX IF NOT EXISTS "ix_activities_is_active" ON "activities" (
	"is_active"
);
CREATE INDEX IF NOT EXISTS "ix_activities_agency_id" ON "activities" (
	"agency_id"
);
CREATE INDEX IF NOT EXISTS "ix_templates_agency_id" ON "templates" (
	"agency_id"
);
CREATE INDEX IF NOT EXISTS "ix_templates_name" ON "templates" (
	"name"
);
CREATE INDEX IF NOT EXISTS "ix_templates_status" ON "templates" (
	"status"
);
CREATE INDEX IF NOT EXISTS "ix_activity_images_activity_id" ON "activity_images" (
	"activity_id"
);
CREATE INDEX IF NOT EXISTS "ix_itineraries_trip_name" ON "itineraries" (
	"trip_name"
);
CREATE INDEX IF NOT EXISTS "ix_itineraries_status" ON "itineraries" (
	"status"
);
CREATE INDEX IF NOT EXISTS "ix_itineraries_agency_id" ON "itineraries" (
	"agency_id"
);
CREATE INDEX IF NOT EXISTS "ix_itineraries_start_date" ON "itineraries" (
	"start_date"
);
CREATE UNIQUE INDEX IF NOT EXISTS "ix_itinerary_pricing_itinerary_id" ON "itinerary_pricing" (
	"itinerary_id"
);
CREATE UNIQUE INDEX IF NOT EXISTS "ix_share_links_token" ON "share_links" (
	"token"
);
COMMIT;

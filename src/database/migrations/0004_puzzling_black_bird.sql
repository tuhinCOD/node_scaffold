CREATE TABLE "clients" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "clients_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"city_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"image" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;
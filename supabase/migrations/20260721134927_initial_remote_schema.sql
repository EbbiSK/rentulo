


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."offer_status" AS ENUM (
    'draft',
    'active',
    'hidden',
    'deleted'
);


ALTER TYPE "public"."offer_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'paid',
    'failed',
    'cancelled',
    'refunded'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."reservation_status" AS ENUM (
    'pending',
    'approved',
    'paid',
    'picked_up',
    'returned',
    'rejected',
    'cancelled'
);


ALTER TYPE "public"."reservation_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_create_reservation"("target_offer_id" "uuid", "target_owner_id" "uuid", "target_renter_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.offers
    where offers.id = target_offer_id
      and offers.owner_id = target_owner_id
      and offers.status = 'active'
      and target_owner_id <> target_renter_id
  );
$$;


ALTER FUNCTION "public"."can_create_reservation"("target_offer_id" "uuid", "target_owner_id" "uuid", "target_renter_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fill_reservation_pickup_data"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  offer_row public.offers%rowtype;
  full_address_from_offer text;
begin
  select *
  into offer_row
  from public.offers
  where id = new.offer_id;

  if found then
    full_address_from_offer := concat_ws(', ',
      nullif(offer_row.pickup_street, ''),
      nullif(coalesce(offer_row.pickup_city, offer_row.city), ''),
      nullif(coalesce(offer_row.pickup_postal_code, offer_row.postal_code), '')
    );

    new.pickup_phone = coalesce(nullif(new.pickup_phone, ''), offer_row.pickup_phone);
    new.owner_phone = coalesce(nullif(new.owner_phone, ''), offer_row.pickup_phone);

    new.pickup_street = coalesce(nullif(new.pickup_street, ''), offer_row.pickup_street);
    new.pickup_city = coalesce(nullif(new.pickup_city, ''), offer_row.pickup_city, offer_row.city);
    new.pickup_postal_code = coalesce(nullif(new.pickup_postal_code, ''), offer_row.pickup_postal_code, offer_row.postal_code);
    new.pickup_note = coalesce(nullif(new.pickup_note, ''), offer_row.pickup_note);

    if nullif(full_address_from_offer, '') is not null then
      new.pickup_full_address = full_address_from_offer;
    else
      new.pickup_full_address = nullif(new.pickup_full_address, '');
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."fill_reservation_pickup_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    street,
    city,
    postal_code
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'street', ''),
    coalesce(new.raw_user_meta_data->>'city', ''),
    coalesce(new.raw_user_meta_data->>'postal_code', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prepare_payment_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_reservation public.reservations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  select *
  into v_reservation
  from public.reservations
  where id = new.reservation_id;

  if not found then
    raise exception 'Reservation does not exist';
  end if;

  if auth.uid() <> v_reservation.renter_id then
    raise exception 'Only the renter can create a payment';
  end if;

  if v_reservation.status <> 'approved' then
    raise exception 'Payment can be created only for an approved reservation';
  end if;

  new.payer_id := v_reservation.renter_id;
  new.owner_id := v_reservation.owner_id;
  new.amount_total := v_reservation.total_price;
  new.platform_fee_amount := v_reservation.platform_fee_amount;
  new.owner_payout := v_reservation.owner_payout;
  new.status := 'pending';
  new.paid_at := null;

  return new;
end;
$$;


ALTER FUNCTION "public"."prepare_payment_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prepare_reservation_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_offer public.offers%rowtype;
  v_owner_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  select *
  into v_offer
  from public.offers
  where id = new.offer_id;

  if not found then
    raise exception 'Offer does not exist';
  end if;

  if v_offer.status <> 'active' then
    raise exception 'Offer is not active';
  end if;

  if v_offer.owner_id = auth.uid() then
    raise exception 'Owner cannot reserve own offer';
  end if;

  if new.start_date is null
     or new.end_date is null
     or new.end_date <= new.start_date then
    raise exception 'Invalid reservation dates';
  end if;

  -- Zamedzi tomu, aby dve súbežné požiadavky na rovnakú ponuku
  -- prešli kontrolou prekrytia v rovnakom čase.
  perform pg_advisory_xact_lock(hashtext(new.offer_id::text));

  if exists (
    select 1
    from public.reservations existing
    where existing.offer_id = new.offer_id
      and existing.status::text in (
        'pending',
        'approved',
        'paid',
        'picked_up'
      )
      and new.start_date < existing.end_date
      and new.end_date > existing.start_date
  ) then
    raise exception
      'Selected reservation dates overlap an existing reservation';
  end if;

  select *
  into v_owner_profile
  from public.profiles
  where id = v_offer.owner_id;

  new.owner_id := v_offer.owner_id;
  new.renter_id := auth.uid();

  -- Dátum vrátenia je koniec výpožičky:
  -- 22. 7. až 23. 7. = 1 deň.
  new.days := greatest(1, new.end_date - new.start_date);
  new.total_days := new.days;

  new.price_per_day := v_offer.price_per_day;
  new.deposit := 0;
  new.total_price := new.days * new.price_per_day;
  new.platform_fee_percent := 10;
  new.platform_fee_amount :=
    round(new.total_price * new.platform_fee_percent / 100.0)::integer;
  new.owner_payout :=
    new.total_price - new.platform_fee_amount;

  new.offer_name := v_offer.name;
  new.category := v_offer.category;
  new.city := v_offer.city;

  new.owner_name :=
    coalesce(nullif(v_owner_profile.full_name, ''), 'Majitel');

  new.owner_email :=
    coalesce(v_owner_profile.email, '');

  new.owner_phone :=
    coalesce(v_owner_profile.phone, '');

  new.pickup_phone :=
    coalesce(
      nullif(v_offer.pickup_phone, ''),
      v_owner_profile.phone,
      ''
    );

  new.pickup_street :=
    coalesce(
      nullif(v_offer.pickup_street, ''),
      v_owner_profile.street,
      ''
    );

  new.pickup_city :=
    coalesce(
      nullif(v_offer.pickup_city, ''),
      v_offer.city,
      ''
    );

  new.pickup_postal_code :=
    coalesce(
      nullif(v_offer.pickup_postal_code, ''),
      v_owner_profile.postal_code,
      ''
    );

  new.pickup_note :=
    coalesce(v_offer.pickup_note, '');

  new.status := 'pending'::public.reservation_status;
  new.contact_visible := false;
  new.contact_visible_after_payment := false;

  return new;
end;
$$;


ALTER FUNCTION "public"."prepare_reservation_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prepare_review_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_reservation public.reservations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  select *
  into v_reservation
  from public.reservations
  where id = new.reservation_id;

  if not found then
    raise exception 'Reservation does not exist';
  end if;

  if v_reservation.status <> 'returned' then
    raise exception 'Review is allowed only after reservation is returned';
  end if;

  if auth.uid() = v_reservation.renter_id then
    new.reviewer_id := v_reservation.renter_id;
    new.reviewed_user_id := v_reservation.owner_id;
  elsif auth.uid() = v_reservation.owner_id then
    new.reviewer_id := v_reservation.owner_id;
    new.reviewed_user_id := v_reservation.renter_id;
  else
    raise exception 'User is not related to this reservation';
  end if;

  new.offer_id := v_reservation.offer_id;

  return new;
end;
$$;


ALTER FUNCTION "public"."prepare_review_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_notification_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.user_id is distinct from old.user_id
     or new.type is distinct from old.type
     or new.title is distinct from old.title
     or new.message is distinct from old.message
     or new.related_reservation_id is distinct from old.related_reservation_id
     or new.related_offer_id is distinct from old.related_offer_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Only notification read status can be changed';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."protect_notification_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_profile_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.id is distinct from old.id
     or new.is_verified is distinct from old.is_verified
     or new.created_at is distinct from old.created_at then
    raise exception 'Protected profile fields cannot be changed';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."protect_profile_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_reservation_immutable_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if new.id is distinct from old.id
    or new.offer_id is distinct from old.offer_id
    or new.owner_id is distinct from old.owner_id
    or new.renter_id is distinct from old.renter_id
    or new.start_date is distinct from old.start_date
    or new.end_date is distinct from old.end_date
    or new.days is distinct from old.days
    or new.price_per_day is distinct from old.price_per_day
    or new.total_price is distinct from old.total_price
    or new.deposit is distinct from old.deposit
    or new.platform_fee_percent is distinct from old.platform_fee_percent
    or new.platform_fee_amount is distinct from old.platform_fee_amount
    or new.owner_payout is distinct from old.owner_payout
    or new.created_at is distinct from old.created_at
    or new.offer_name is distinct from old.offer_name
    or new.category is distinct from old.category
    or new.city is distinct from old.city
    or new.total_days is distinct from old.total_days
    or new.renter_name is distinct from old.renter_name
    or new.renter_email is distinct from old.renter_email
    or new.renter_phone is distinct from old.renter_phone
    or new.owner_name is distinct from old.owner_name
    or new.owner_phone is distinct from old.owner_phone
    or new.pickup_phone is distinct from old.pickup_phone
    or new.pickup_street is distinct from old.pickup_street
    or new.pickup_city is distinct from old.pickup_city
    or new.pickup_postal_code is distinct from old.pickup_postal_code
    or new.pickup_full_address is distinct from old.pickup_full_address
    or new.pickup_note is distinct from old.pickup_note
  then
    raise exception 'Immutable reservation fields cannot be changed';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."protect_reservation_immutable_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_reservation_status_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.status = old.status then
    return new;
  end if;

  if auth.uid() = old.owner_id then
    if
      (old.status = 'pending' and new.status in ('approved', 'rejected'))
      or (old.status = 'paid' and new.status = 'picked_up')
      or (old.status = 'picked_up' and new.status = 'returned')
    then
      return new;
    end if;

    raise exception
      'Owner is not allowed to change reservation status from % to %',
      old.status,
      new.status;
  end if;

  if auth.uid() = old.renter_id then
    if
      (old.status = 'approved' and new.status = 'paid')
      or (
        old.status in ('pending', 'approved')
        and new.status = 'cancelled'
      )
    then
      return new;
    end if;

    raise exception
      'Renter is not allowed to change reservation status from % to %',
      old.status,
      new.status;
  end if;

  raise exception 'User is not related to this reservation';
end;
$$;


ALTER FUNCTION "public"."protect_reservation_status_transition"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_review_immutable_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.reservation_id is distinct from old.reservation_id
     or new.reviewer_id is distinct from old.reviewer_id
     or new.reviewed_user_id is distinct from old.reviewed_user_id
     or new.offer_id is distinct from old.offer_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Immutable review fields cannot be changed';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."protect_review_immutable_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_reservation_contact_visibility"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.status in ('paid', 'picked_up', 'returned') then
    new.contact_visible = true;
    new.contact_visible_after_payment = true;
  else
    new.contact_visible = false;
    new.contact_visible_after_payment = false;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."sync_reservation_contact_visibility"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" DEFAULT ''::"text" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "message" "text" DEFAULT ''::"text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "related_reservation_id" "uuid",
    "related_offer_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "city" "text" DEFAULT ''::"text" NOT NULL,
    "postal_code" "text" DEFAULT ''::"text" NOT NULL,
    "price_per_day" integer NOT NULL,
    "deposit" integer DEFAULT 0 NOT NULL,
    "status" "public"."offer_status" DEFAULT 'active'::"public"."offer_status" NOT NULL,
    "photo_url" "text" DEFAULT ''::"text",
    "pickup_mode" "text" DEFAULT 'profile'::"text" NOT NULL,
    "pickup_street" "text" DEFAULT ''::"text" NOT NULL,
    "pickup_city" "text" DEFAULT ''::"text" NOT NULL,
    "pickup_postal_code" "text" DEFAULT ''::"text" NOT NULL,
    "pickup_note" "text" DEFAULT ''::"text" NOT NULL,
    "pickup_phone" "text" DEFAULT ''::"text" NOT NULL,
    "pickup_latitude" double precision,
    "pickup_longitude" double precision,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "offers_deposit_check" CHECK (("deposit" >= 0)),
    CONSTRAINT "offers_price_per_day_check" CHECK (("price_per_day" > 0))
);


ALTER TABLE "public"."offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reservation_id" "uuid" NOT NULL,
    "payer_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "amount_total" integer NOT NULL,
    "platform_fee_amount" integer DEFAULT 0 NOT NULL,
    "owner_payout" integer DEFAULT 0 NOT NULL,
    "provider" "text" DEFAULT 'manual_test'::"text" NOT NULL,
    "provider_payment_id" "text" DEFAULT ''::"text" NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payments_amount_total_check" CHECK (("amount_total" >= 0)),
    CONSTRAINT "payments_owner_payout_check" CHECK (("owner_payout" >= 0)),
    CONSTRAINT "payments_platform_fee_amount_check" CHECK (("platform_fee_amount" >= 0))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" DEFAULT ''::"text" NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "phone" "text" DEFAULT ''::"text" NOT NULL,
    "street" "text" DEFAULT ''::"text" NOT NULL,
    "city" "text" DEFAULT ''::"text" NOT NULL,
    "postal_code" "text" DEFAULT ''::"text" NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."public_offers" WITH ("security_invoker"='true') AS
 SELECT "id",
    "owner_id",
    "name",
    "category",
    "description",
    "city",
    "postal_code",
    "price_per_day",
    "deposit",
    "status",
    "photo_url",
    "pickup_mode",
    "created_at",
    "updated_at"
   FROM "public"."offers"
  WHERE ("status" = 'active'::"public"."offer_status");


ALTER VIEW "public"."public_offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "offer_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "renter_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "days" integer NOT NULL,
    "price_per_day" integer NOT NULL,
    "total_price" integer NOT NULL,
    "deposit" integer DEFAULT 0 NOT NULL,
    "platform_fee_percent" integer DEFAULT 10 NOT NULL,
    "platform_fee_amount" integer DEFAULT 0 NOT NULL,
    "owner_payout" integer DEFAULT 0 NOT NULL,
    "status" "public"."reservation_status" DEFAULT 'pending'::"public"."reservation_status" NOT NULL,
    "contact_visible" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "offer_name" "text",
    "category" "text",
    "city" "text",
    "total_days" integer DEFAULT 0 NOT NULL,
    "renter_name" "text",
    "renter_email" "text",
    "renter_phone" "text",
    "owner_name" "text",
    "contact_visible_after_payment" boolean DEFAULT false NOT NULL,
    "date_from" "date",
    "date_to" "date",
    "paid_at" timestamp with time zone,
    "payment_provider_status" "text",
    "owner_phone" "text",
    "pickup_phone" "text",
    "pickup_street" "text",
    "pickup_city" "text",
    "pickup_postal_code" "text",
    "pickup_full_address" "text",
    "pickup_note" "text",
    CONSTRAINT "reservation_dates_valid" CHECK (("end_date" > "start_date")),
    CONSTRAINT "reservations_days_check" CHECK (("days" > 0)),
    CONSTRAINT "reservations_deposit_check" CHECK (("deposit" >= 0)),
    CONSTRAINT "reservations_owner_payout_check" CHECK (("owner_payout" >= 0)),
    CONSTRAINT "reservations_platform_fee_amount_check" CHECK (("platform_fee_amount" >= 0)),
    CONSTRAINT "reservations_price_per_day_check" CHECK (("price_per_day" > 0)),
    CONSTRAINT "reservations_total_price_check" CHECK (("total_price" >= 0))
);


ALTER TABLE "public"."reservations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reservation_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "reviewed_user_id" "uuid" NOT NULL,
    "offer_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "text" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_rating_summary" WITH ("security_invoker"='true') AS
 SELECT "reviewed_user_id" AS "user_id",
    "round"("avg"("rating"), 1) AS "average_rating",
    "count"(*) AS "rating_count"
   FROM "public"."reviews"
  GROUP BY "reviewed_user_id";


ALTER VIEW "public"."user_rating_summary" OWNER TO "postgres";


ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_one_review_per_reservation_reviewer" UNIQUE ("reservation_id", "reviewer_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



CREATE INDEX "notifications_user_id_idx" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "offers_category_idx" ON "public"."offers" USING "btree" ("category");



CREATE INDEX "offers_city_idx" ON "public"."offers" USING "btree" ("city");



CREATE INDEX "offers_owner_id_idx" ON "public"."offers" USING "btree" ("owner_id");



CREATE INDEX "offers_status_idx" ON "public"."offers" USING "btree" ("status");



CREATE UNIQUE INDEX "payments_one_per_reservation" ON "public"."payments" USING "btree" ("reservation_id");



CREATE INDEX "payments_reservation_id_idx" ON "public"."payments" USING "btree" ("reservation_id");



CREATE INDEX "reservations_offer_id_idx" ON "public"."reservations" USING "btree" ("offer_id");



CREATE INDEX "reservations_owner_id_idx" ON "public"."reservations" USING "btree" ("owner_id");



CREATE INDEX "reservations_renter_id_idx" ON "public"."reservations" USING "btree" ("renter_id");



CREATE INDEX "reservations_status_idx" ON "public"."reservations" USING "btree" ("status");



CREATE INDEX "reviews_offer_id_idx" ON "public"."reviews" USING "btree" ("offer_id");



CREATE OR REPLACE TRIGGER "prepare_payment_before_insert" BEFORE INSERT ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."prepare_payment_insert"();



CREATE OR REPLACE TRIGGER "prepare_reservation_before_insert" BEFORE INSERT ON "public"."reservations" FOR EACH ROW EXECUTE FUNCTION "public"."prepare_reservation_insert"();



CREATE OR REPLACE TRIGGER "prepare_review_before_insert" BEFORE INSERT ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."prepare_review_insert"();



CREATE OR REPLACE TRIGGER "protect_notification_before_update" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."protect_notification_update"();



CREATE OR REPLACE TRIGGER "protect_profile_before_update" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."protect_profile_update"();



CREATE OR REPLACE TRIGGER "protect_review_immutable_fields_before_update" BEFORE UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."protect_review_immutable_fields"();



CREATE OR REPLACE TRIGGER "sync_reservation_contact_visibility_trigger" BEFORE INSERT OR UPDATE ON "public"."reservations" FOR EACH ROW EXECUTE FUNCTION "public"."sync_reservation_contact_visibility"();



CREATE OR REPLACE TRIGGER "trg_fill_reservation_pickup_data" BEFORE INSERT ON "public"."reservations" FOR EACH ROW EXECUTE FUNCTION "public"."fill_reservation_pickup_data"();



CREATE OR REPLACE TRIGGER "trg_protect_reservation_immutable_fields" BEFORE UPDATE ON "public"."reservations" FOR EACH ROW EXECUTE FUNCTION "public"."protect_reservation_immutable_fields"();



CREATE OR REPLACE TRIGGER "trg_protect_reservation_status_transition" BEFORE UPDATE OF "status" ON "public"."reservations" FOR EACH ROW EXECUTE FUNCTION "public"."protect_reservation_status_transition"();



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_offer_id_fkey" FOREIGN KEY ("related_offer_id") REFERENCES "public"."offers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_reservation_id_fkey" FOREIGN KEY ("related_reservation_id") REFERENCES "public"."reservations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewed_user_id_fkey" FOREIGN KEY ("reviewed_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_delete_own" ON "public"."notifications" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "notifications_select_own" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "notifications_update_own" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "offers_delete_own" ON "public"."offers" FOR DELETE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "offers_insert_own" ON "public"."offers" FOR INSERT TO "authenticated" WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "offers_select_active_public" ON "public"."offers" FOR SELECT TO "authenticated", "anon" USING (("status" = 'active'::"public"."offer_status"));



CREATE POLICY "offers_select_own" ON "public"."offers" FOR SELECT TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "offers_update_own" ON "public"."offers" FOR UPDATE TO "authenticated" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payments_insert_as_payer" ON "public"."payments" FOR INSERT TO "authenticated" WITH CHECK (("payer_id" = "auth"."uid"()));



CREATE POLICY "payments_select_related" ON "public"."payments" FOR SELECT TO "authenticated" USING ((("payer_id" = "auth"."uid"()) OR ("owner_id" = "auth"."uid"())));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reservations_insert_as_renter" ON "public"."reservations" FOR INSERT TO "authenticated" WITH CHECK ((("renter_id" = "auth"."uid"()) AND "public"."can_create_reservation"("offer_id", "owner_id", "renter_id")));



CREATE POLICY "reservations_select_related" ON "public"."reservations" FOR SELECT TO "authenticated" USING ((("renter_id" = "auth"."uid"()) OR ("owner_id" = "auth"."uid"())));



CREATE POLICY "reservations_update_related" ON "public"."reservations" FOR UPDATE TO "authenticated" USING ((("renter_id" = "auth"."uid"()) OR ("owner_id" = "auth"."uid"()))) WITH CHECK ((("renter_id" = "auth"."uid"()) OR ("owner_id" = "auth"."uid"())));



ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reviews_delete_own" ON "public"."reviews" FOR DELETE TO "authenticated" USING (("reviewer_id" = "auth"."uid"()));



CREATE POLICY "reviews_insert_own" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK (("reviewer_id" = "auth"."uid"()));



CREATE POLICY "reviews_select_public" ON "public"."reviews" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "reviews_update_own" ON "public"."reviews" FOR UPDATE TO "authenticated" USING (("reviewer_id" = "auth"."uid"())) WITH CHECK (("reviewer_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."can_create_reservation"("target_offer_id" "uuid", "target_owner_id" "uuid", "target_renter_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_create_reservation"("target_offer_id" "uuid", "target_owner_id" "uuid", "target_renter_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_create_reservation"("target_offer_id" "uuid", "target_owner_id" "uuid", "target_renter_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."fill_reservation_pickup_data"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fill_reservation_pickup_data"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."prepare_payment_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prepare_payment_insert"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."prepare_reservation_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prepare_reservation_insert"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."prepare_review_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prepare_review_insert"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."protect_notification_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."protect_notification_update"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."protect_profile_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."protect_profile_update"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."protect_reservation_immutable_fields"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."protect_reservation_immutable_fields"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."protect_reservation_status_transition"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."protect_reservation_status_transition"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."protect_review_immutable_fields"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."protect_review_immutable_fields"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_reservation_contact_visibility"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_reservation_contact_visibility"() TO "service_role";


















GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."notifications" TO "anon";
GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."offers" TO "anon";
GRANT ALL ON TABLE "public"."offers" TO "authenticated";
GRANT ALL ON TABLE "public"."offers" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."payments" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."public_offers" TO "service_role";
GRANT SELECT ON TABLE "public"."public_offers" TO "anon";
GRANT SELECT ON TABLE "public"."public_offers" TO "authenticated";



GRANT ALL ON TABLE "public"."reservations" TO "anon";
GRANT ALL ON TABLE "public"."reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."reservations" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."user_rating_summary" TO "service_role";
GRANT SELECT ON TABLE "public"."user_rating_summary" TO "anon";
GRANT SELECT ON TABLE "public"."user_rating_summary" TO "authenticated";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop policy "offers_select_active_public" on "public"."offers";

drop policy "reviews_select_public" on "public"."reviews";


  create policy "offers_select_active_public"
  on "public"."offers"
  as permissive
  for select
  to anon, authenticated
using ((status = 'active'::public.offer_status));



  create policy "reviews_select_public"
  on "public"."reviews"
  as permissive
  for select
  to anon, authenticated
using (true);


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "offer_photos_delete_own"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'offer-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "offer_photos_insert_own"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'offer-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "offer_photos_update_own"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'offer-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
with check (((bucket_id = 'offer-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));




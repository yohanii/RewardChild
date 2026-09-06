SET local check_function_bodies = off;

CREATE SEQUENCE "public"."bank_items_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE SEQUENCE "public"."bank_purchases_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE SEQUENCE "public"."quests_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE SEQUENCE "public"."relations_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE SEQUENCE "public"."shop_items_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE SEQUENCE "public"."shop_purchases_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE SEQUENCE "public"."transactions_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE SEQUENCE "public"."users_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE TABLE "public"."balances" (
  "id"         bigint                      GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id"    bigint                      NOT NULL,
  "amount"     integer                     NOT NULL DEFAULT 0,
  "updated_at" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT "balances_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."balances"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."bank_items" (
  "id"         bigint                   NOT NULL DEFAULT nextval('public.bank_items_id_seq'::regclass),
  "parent_id"  bigint,
  "title"      text                     NOT NULL,
  "content"    text,
  "price"      integer                  NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "bank_items_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."bank_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."bank_purchases" (
  "id"            bigint                   NOT NULL DEFAULT nextval('public.bank_purchases_id_seq'::regclass),
  "parent_id"     bigint                   NOT NULL,
  "bank_item_id"  bigint                   NOT NULL,
  "amount"        integer                  NOT NULL,
  "coins_granted" integer                  NOT NULL DEFAULT 0,
  "created_at"    timestamp with time zone DEFAULT now(),
  CONSTRAINT "bank_purchases_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."bank_purchases"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."quests" (
  "id"           bigint                   NOT NULL DEFAULT nextval('public.quests_id_seq'::regclass),
  "relation_id"  bigint                   NOT NULL,
  "parent_id"    bigint                   NOT NULL,
  "child_id"     bigint                   NOT NULL,
  "title"        text                     NOT NULL,
  "content"      text,
  "reward"       integer                  NOT NULL DEFAULT 0,
  "created_at"   timestamp with time zone DEFAULT now(),
  "updated_at"   timestamp with time zone DEFAULT now(),
  "completed_at" timestamp with time zone,
  CONSTRAINT "quests_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."quests"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."relations" (
  "id"         bigint                   NOT NULL DEFAULT nextval('public.relations_id_seq'::regclass),
  "parent_id"  bigint                   NOT NULL,
  "child_id"   bigint                   NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "relations_parent_id_child_id_key" UNIQUE (parent_id, child_id),
  CONSTRAINT "relations_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."relations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."shop_items" (
  "id"         bigint                   NOT NULL DEFAULT nextval('public.shop_items_id_seq'::regclass),
  "parent_id"  bigint                   NOT NULL,
  "title"      text                     NOT NULL,
  "content"    text,
  "price"      integer                  NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "is_active"  boolean                  NOT NULL DEFAULT true,
  "sort_order" integer                  NOT NULL DEFAULT 0,
  CONSTRAINT "shop_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "shop_items_price_check" CHECK ((price > 0))
);

ALTER TABLE "public"."shop_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."shop_purchases" (
  "id"           bigint                   NOT NULL DEFAULT nextval('public.shop_purchases_id_seq'::regclass),
  "child_id"     bigint                   NOT NULL,
  "shop_item_id" bigint                   NOT NULL,
  "price_paid"   integer                  NOT NULL,
  "quantity"     integer                  NOT NULL DEFAULT 1,
  "created_at"   timestamp with time zone DEFAULT now(),
  CONSTRAINT "shop_purchases_pkey" PRIMARY KEY (id),
  CONSTRAINT "shop_purchases_quantity_check" CHECK ((quantity > 0))
);

ALTER TABLE "public"."shop_purchases"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."transactions" (
  "id"           bigint                   NOT NULL DEFAULT nextval('public.transactions_id_seq'::regclass),
  "user_id"      bigint                   NOT NULL,
  "amount"       integer                  NOT NULL,
  "reference_id" bigint,
  "note"         text,
  "created_at"   timestamp with time zone DEFAULT now(),
  CONSTRAINT "transactions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."transactions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_map" (
  "user_id"      bigint NOT NULL,
  "auth_user_id" uuid   NOT NULL,
  CONSTRAINT "user_map_auth_user_id_key" UNIQUE (auth_user_id),
  CONSTRAINT "user_map_pkey" PRIMARY KEY (user_id)
);

CREATE TABLE "public"."users" (
  "id"           bigint                   NOT NULL DEFAULT nextval('public.users_id_seq'::regclass),
  "auth_user_id" uuid,
  "nickname"     text,
  "tag"          character varying(8),
  "created_at"   timestamp with time zone DEFAULT now(),
  "updated_at"   timestamp with time zone DEFAULT now(),
  CONSTRAINT "chk_tag_format" CHECK ((char_length((tag)::text) <= 8)),
  CONSTRAINT "unique_nickname_tag" UNIQUE (nickname, TAG),
  CONSTRAINT "users_auth_user_id_key" UNIQUE (auth_user_id),
  CONSTRAINT "users_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."users"
  ENABLE ROW LEVEL SECURITY;

ALTER SEQUENCE "public"."bank_items_id_seq" OWNED BY "public"."bank_items"."id";

ALTER SEQUENCE "public"."bank_purchases_id_seq" OWNED BY "public"."bank_purchases"."id";

ALTER SEQUENCE "public"."quests_id_seq" OWNED BY "public"."quests"."id";

ALTER SEQUENCE "public"."relations_id_seq" OWNED BY "public"."relations"."id";

ALTER SEQUENCE "public"."shop_items_id_seq" OWNED BY "public"."shop_items"."id";

ALTER SEQUENCE "public"."shop_purchases_id_seq" OWNED BY "public"."shop_purchases"."id";

ALTER SEQUENCE "public"."transactions_id_seq" OWNED BY "public"."transactions"."id";

ALTER SEQUENCE "public"."users_id_seq" OWNED BY "public"."users"."id";

CREATE TYPE "public"."balance_type" AS ENUM (
  'ATTENDANCE',
  'CASH'
);

ALTER TABLE "public"."balances"
  ADD COLUMN "type" public.balance_type NOT NULL;

CREATE TYPE "public"."currency_unit" AS ENUM (
  'COIN',
  'KRW'
);

ALTER TABLE "public"."bank_items"
  ADD COLUMN "currency" public.currency_unit DEFAULT 'KRW'::public.currency_unit;

ALTER TABLE "public"."bank_purchases"
  ADD COLUMN "currency" public.currency_unit DEFAULT 'KRW'::public.currency_unit;

ALTER TABLE "public"."shop_items"
  ADD COLUMN "currency" public.currency_unit NOT NULL DEFAULT 'COIN'::public.currency_unit;

CREATE TYPE "public"."quest_status" AS ENUM (
  'REGISTERED',
  'REQUESTED',
  'COMPLETED',
  'REJECTED'
);

ALTER TABLE "public"."quests"
  ADD COLUMN "status" public.quest_status DEFAULT 'REGISTERED'::public.quest_status;

CREATE TYPE "public"."reference_type" AS ENUM (
  'QUEST',
  'SHOP_PURCHASE',
  'BANK_PURCHASE'
);

ALTER TABLE "public"."transactions"
  ADD COLUMN "reference_type" public.reference_type;

CREATE TYPE "public"."relation_status" AS ENUM (
  'PENDING',
  'ACTIVE',
  'BLOCKED'
);

ALTER TABLE "public"."relations"
  ADD COLUMN "status" public.relation_status DEFAULT 'ACTIVE'::public.relation_status;

CREATE TYPE "public"."transaction_type" AS ENUM (
  'QUEST_REWARD',
  'SHOP_PURCHASE',
  'BANK_PURCHASE',
  'ADJUSTMENT',
  'INITIAL_CREDIT',
  'ATTENDANCE_REWARD',
  'SPEND_ATTENDANCE',
  'SPEND_CASH'
);

ALTER TABLE "public"."transactions"
  ADD COLUMN "type" public.transaction_type NOT NULL;

CREATE TYPE "public"."user_role" AS ENUM (
  'DEFAULT',
  'PARENT',
  'CHILD'
);

ALTER TABLE "public"."users"
  ADD COLUMN "role" public.user_role NOT NULL DEFAULT 'DEFAULT'::public.user_role;

CREATE OR REPLACE FUNCTION public.apply_initial_credit_on_role_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  IF NEW.role = 'PARENT'::public.user_role
     AND (OLD.role IS DISTINCT FROM 'PARENT'::public.user_role) THEN

    INSERT INTO public.transactions (
      user_id,
      type,
      amount,
      reference_type,
      reference_id,
      created_at
    )
    VALUES (
      NEW.id,
      'INITIAL_CREDIT',
      200,
      NULL,
      NULL,
      now()
    )
    ON CONFLICT (user_id)
      WHERE (type = 'INITIAL_CREDIT'::public.transaction_type)
      DO NOTHING;
  END IF;

  -- CHILD로 바뀔 때 balances 직접 건드릴 필요 없음
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_transaction_to_balance()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$DECLARE
  v_bucket_type public.balance_type;
  v_new_amount integer;
BEGIN
  -- 1) transaction_type → balance.type 매핑
  CASE NEW.type
    WHEN 'INITIAL_CREDIT'    THEN v_bucket_type := 'ATTENDANCE';
    WHEN 'ATTENDANCE_REWARD' THEN v_bucket_type := 'ATTENDANCE';
    WHEN 'SPEND_ATTENDANCE'  THEN v_bucket_type := 'ATTENDANCE';
    WHEN 'SPEND_CASH'        THEN v_bucket_type := 'CASH';
    ELSE
      -- 기타 타입은 일단 CASH 버킷으로 처리
      v_bucket_type := 'CASH';
  END CASE;

  -- 2) balances upsert: 해당 버킷(amount) 누적
  INSERT INTO public.balances (user_id, type, amount)
  VALUES (NEW.user_id, v_bucket_type, NEW.amount)
  ON CONFLICT (user_id, type)
  DO UPDATE
  SET amount     = public.balances.amount + EXCLUDED.amount,
      updated_at = now()
  RETURNING amount INTO v_new_amount;

  -- 3) 버킷이 마이너스로 내려가는 것 방지 (오버스펜드 보호)
  IF v_new_amount < 0 THEN
    RAISE EXCEPTION
      'Balance would become negative for user % (bucket %)',
      NEW.user_id, v_bucket_type;
  END IF;

  RETURN NEW;
END;$function$;

CREATE OR REPLACE FUNCTION public.approve_quest_with_reward (
  p_quest_id bigint
)
  RETURNS public.quests
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
  v_quest   public.quests%ROWTYPE;
  v_updated public.quests%ROWTYPE;
BEGIN
  -- 1) 퀘스트 조회 + 잠금 (동시에 두 번 승인 방지)
  SELECT *
  INTO v_quest
  FROM public.quests
  WHERE id = p_quest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUEST_NOT_FOUND';
  END IF;

  -- 이미 완료된 퀘스트면 다시 지급하지 않기
  IF v_quest.status = 'COMPLETED' THEN
    RETURN v_quest;
  END IF;

  -- 요청 상태가 아닌 경우 방어 (원하면 조건 완화 가능)
  IF v_quest.status <> 'REQUESTED' THEN
    RAISE EXCEPTION 'QUEST_NOT_REQUESTED';
  END IF;

  -- 2) 퀘스트 상태를 COMPLETED로 업데이트
  UPDATE public.quests
  SET
    status       = 'COMPLETED',
    completed_at = now()
  WHERE id = p_quest_id
  RETURNING * INTO v_updated;

  -- 3) 자녀에게 보상 트랜잭션 생성
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    reference_type,
    reference_id,
    note
  )
  VALUES (
    v_updated.child_id,
    'QUEST_REWARD',     -- transaction_type에 이 값이 있어야 함
    v_updated.reward,
    'QUEST',            -- reference_type에 'QUEST'가 있다면
    v_updated.id,
    '퀘스트 보상 지급'
  );

  -- 4) balances는 trg_apply_transaction_to_balance 트리거가 자동 반영

  RETURN v_updated;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_initial_credit_tx()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  IF NEW.role = 'PARENT'::public.user_role THEN
    INSERT INTO public.transactions (
      user_id,
      type,
      amount,
      reference_type,
      reference_id,
      created_at
    )
    VALUES (
      NEW.id,
      'INITIAL_CREDIT',
      200,
      NULL,
      NULL,
      now()
    )
    ON CONFLICT (user_id)
      WHERE (type = 'INITIAL_CREDIT'::public.transaction_type)
      DO NOTHING;
  END IF;

  -- CHILD는 별도 balances row를 만들 필요 없음 (없으면 0으로 간주)
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.find_child_by_tag (
  _nickname text,
  _tag      text
)
  RETURNS TABLE (
    id       bigint,
    nickname text,
    tag      text
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select u.id, u.nickname, u.tag
  from public.users u
  where u.role = 'CHILD'::user_role
    and u.nickname = _nickname
    and u.tag = _tag
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.give_attendance (
  p_user_id bigint,
  p_cap     integer DEFAULT 200
)
  RETURNS integer
  LANGUAGE plpgsql
  AS $function$
DECLARE
  v_role text;
  v_current_att integer;
  v_delta integer;
BEGIN
  -- 1) 부모인지 확인
  SELECT role
  INTO v_role
  FROM public.users
  WHERE id = p_user_id;

  IF v_role IS DISTINCT FROM 'PARENT' THEN
    -- 부모가 아니면 아무 것도 안 함
    RETURN 0;
  END IF;

  -- 2) 현재 ATTENDANCE 잔액 조회 (없으면 0)
  SELECT amount
  INTO v_current_att
  FROM public.balances
  WHERE user_id = p_user_id
    AND type = 'ATTENDANCE';

  IF v_current_att IS NULL THEN
    v_current_att := 0;
  END IF;

  -- 3) 이번에 채워줄 양 계산: cap(기본 200)까지 top-up
  v_delta := p_cap - v_current_att;

  IF v_delta <= 0 THEN
    -- 이미 cap 이상이면 줄 코인이 없음
    RETURN 0;
  END IF;

  -- 4) 부족분만큼 출석 트랜잭션 INSERT
  --    balances는 trg_apply_transaction_to_balance 트리거가 알아서 업데이트
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    reference_type,
    reference_id,
    note
  )
  VALUES (
    p_user_id,
    'ATTENDANCE_REWARD',   -- ↑ 위에서 추가한 transaction_type 값
    v_delta,
    NULL,                  -- 필요하면 나중에 적절한 reference_type 추가
    NULL,
    'Daily attendance top-up'
  );

  RETURN v_delta;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'auth'
  AS $function$
BEGIN
  -- 중복 생성 방지 (idempotent)
  IF EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- 최소 정보만 넣어서 생성 (nickname/tag 모두 NULL)
  INSERT INTO public.users (
    auth_user_id,
    nickname,
    tag,
    role
  )
  VALUES (
    NEW.id,
    NULL,
    NULL,
    DEFAULT
  );

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
BEGIN
  -- public.users 스키마 가정: id(bigint, identity), auth_user_id(uuid UNIQUE), role, nickname, tag 등
  INSERT INTO public.users (auth_user_id, role, nickname, tag)
  VALUES (
    NEW.id,                                    -- auth.users.id (uuid)
    'CHILD',                                   -- 기본 롤(임시). 이후 앱에서 변경
    CONCAT('user_', LEFT(NEW.id::text, 8)),    -- 임시 닉네임
    LPAD(FLOOR(random()*65536)::int::text, 4, '0') -- 임시 tag 0000~9999
  )
  ON CONFLICT (auth_user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Auth 저장을 막지 않도록 예외는 삼킵니다. 필요하면 NOTIFY로 로깅
  PERFORM pg_notify('handle_new_user_error', SQLERRM);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_me_user_id (
  target_user_id bigint
)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_map m
    WHERE m.user_id = target_user_id
      AND m.auth_user_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.spend_coins (
  p_user_id        bigint,
  p_amount         integer,
  p_reference_type public.reference_type DEFAULT NULL::public.reference_type,
  p_reference_id   bigint                DEFAULT NULL::bigint,
  p_note           text                  DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  AS $function$
DECLARE
  v_att integer;
  v_cash integer;
  v_total integer;
  v_use_att integer;
  v_use_cash integer;
BEGIN
  -- 0) 유효성 검사
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be a positive integer';
  END IF;

  -- 1) 현재 ATTENDANCE 잔액 조회 (없으면 0)
  SELECT amount
  INTO v_att
  FROM public.balances
  WHERE user_id = p_user_id
    AND type = 'ATTENDANCE';

  IF v_att IS NULL THEN
    v_att := 0;
  END IF;

  -- 2) 현재 CASH 잔액 조회 (없으면 0)
  SELECT amount
  INTO v_cash
  FROM public.balances
  WHERE user_id = p_user_id
    AND type = 'CASH';

  IF v_cash IS NULL THEN
    v_cash := 0;
  END IF;

  v_total := v_att + v_cash;

  -- 3) 전체 잔액 부족 시 에러
  IF v_total < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS: available %, required %', v_total, p_amount
      USING ERRCODE = 'P0001'; -- 사용자 정의 예외 코드
  END IF;

  -- 4) ATTENDANCE 먼저 사용
  v_use_att := LEAST(v_att, p_amount);
  v_use_cash := p_amount - v_use_att;

  -- 5) ATTENDANCE에서 차감될 부분 트랜잭션 기록
  IF v_use_att > 0 THEN
    INSERT INTO public.transactions (
      user_id,
      type,
      amount,
      reference_type,
      reference_id,
      note
    )
    VALUES (
      p_user_id,
      'SPEND_ATTENDANCE',
      -v_use_att,      -- 음수: 차감
      p_reference_type,
      p_reference_id,
      COALESCE(p_note, 'Spend from ATTENDANCE bucket')
    );
  END IF;

  -- 6) CASH에서 차감될 부분 트랜잭션 기록
  IF v_use_cash > 0 THEN
    INSERT INTO public.transactions (
      user_id,
      type,
      amount,
      reference_type,
      reference_id,
      note
    )
    VALUES (
      p_user_id,
      'SPEND_CASH',
      -v_use_cash,     -- 음수: 차감
      p_reference_type,
      p_reference_id,
      COALESCE(p_note, 'Spend from CASH bucket')
    );
  END IF;

  -- 7) balances는 trg_apply_transaction_to_balance 트리거가 알아서 업데이트
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_user_map()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
BEGIN
  INSERT INTO public.user_map(user_id, auth_user_id)
  VALUES (NEW.id, NEW.auth_user_id)
  ON CONFLICT (user_id) DO UPDATE
  SET auth_user_id = EXCLUDED.auth_user_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.uid_to_user_id (
  uid uuid
)
  RETURNS bigint
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  SELECT m.user_id FROM public.user_map m WHERE m.auth_user_id = uid LIMIT 1
$function$;

ALTER TABLE "public"."balances"
  ADD CONSTRAINT "balances_user_id_type_key" UNIQUE (user_id, TYPE);

ALTER TABLE "public"."bank_purchases"
  ADD CONSTRAINT "bank_purchases_bank_item_id_fkey" FOREIGN KEY (bank_item_id) REFERENCES public.bank_items(id) ON DELETE RESTRICT;

ALTER TABLE "public"."quests"
  ADD CONSTRAINT "quests_relation_id_fkey" FOREIGN KEY (relation_id) REFERENCES public.relations(id) ON DELETE CASCADE;

ALTER TABLE "public"."shop_purchases"
  ADD CONSTRAINT "shop_purchases_shop_item_id_fkey" FOREIGN KEY (shop_item_id) REFERENCES public.shop_items(id) ON DELETE RESTRICT;

ALTER TABLE "public"."balances"
  ADD CONSTRAINT "balances_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE "public"."bank_purchases"
  ADD CONSTRAINT "fk_bank_purchases_parent" FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."relations"
  ADD CONSTRAINT "fk_relations_child" FOREIGN KEY (child_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."relations"
  ADD CONSTRAINT "fk_relations_parent" FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."shop_items"
  ADD CONSTRAINT "fk_shop_items_parent" FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."shop_purchases"
  ADD CONSTRAINT "fk_shop_purchases_child" FOREIGN KEY (child_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "fk_transactions_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

CREATE INDEX idx_bank_purchases_parent_id ON public.bank_purchases USING btree (parent_id);

CREATE INDEX idx_quests_relation_id ON public.quests USING btree (relation_id);

CREATE INDEX idx_relations_child ON public.relations USING btree (child_id);

CREATE INDEX idx_relations_parent ON public.relations USING btree (parent_id);

CREATE INDEX idx_shop_items_active_sort ON public.shop_items USING btree (is_active, sort_order, id);

CREATE INDEX idx_shop_items_parent_id ON public.shop_items USING btree (parent_id);

CREATE INDEX idx_shop_purchases_child_id ON public.shop_purchases USING btree (child_id);

CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);

CREATE INDEX idx_user_map_auth_uid ON public.user_map USING btree (auth_user_id);

CREATE UNIQUE INDEX ux_tx_initial_credit_once ON public.transactions USING btree (user_id)
  WHERE (TYPE = 'INITIAL_CREDIT'::public.transaction_type);

CREATE TRIGGER trg_handle_new_auth_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

CREATE TRIGGER trg_set_updated_at_bank_items
  BEFORE UPDATE ON public.bank_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_set_updated_at_quests
  BEFORE UPDATE ON public.quests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_set_updated_at_shop_items
  BEFORE UPDATE ON public.shop_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_apply_transaction_to_balance
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_transaction_to_balance();

CREATE TRIGGER trg_create_initial_credit_tx
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_initial_credit_tx();

CREATE TRIGGER trg_sync_user_map
  AFTER INSERT OR DELETE OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_map();

ALTER TABLE "public"."users"
  DISABLE TRIGGER "trg_sync_user_map";

CREATE TRIGGER trg_user_role_change
  AFTER UPDATE OF ROLE ON public.users
  FOR EACH ROW
  WHEN ((old.role IS DISTINCT FROM new.role))
  EXECUTE FUNCTION public.apply_initial_credit_on_role_change();

CREATE TRIGGER trg_users_to_user_map
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_map();

CREATE POLICY "balances_insert_policy" ON "public"."balances"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = public.uid_to_user_id(auth.uid())));

CREATE POLICY "balances_select_policy" ON "public"."balances"
  FOR SELECT
  TO "authenticated"
  USING ((public.is_me_user_id(user_id) OR (EXISTS ( SELECT 1
   FROM public.relations r
  WHERE
    ((r.status = 'ACTIVE'::public.relation_status) AND (((r.parent_id = public.uid_to_user_id(auth.uid())) AND (r.child_id = balances.user_id)) OR ((r.child_id =
    public.uid_to_user_id(auth.uid())) AND (r.parent_id = balances.user_id))))))));

CREATE POLICY "balances_update_policy" ON "public"."balances"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = public.uid_to_user_id(auth.uid())))
  WITH CHECK ((user_id = public.uid_to_user_id(auth.uid())));

CREATE POLICY "Everyone can view bank items" ON "public"."bank_items"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Only service_role can modify bank items" ON "public"."bank_items"
  FOR ALL
  TO PUBLIC
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

CREATE POLICY "quests_delete_parent_only" ON "public"."quests"
  FOR DELETE
  TO PUBLIC
  USING ((public.uid_to_user_id(auth.uid()) = parent_id));

CREATE POLICY "quests_insert_parent_only" ON "public"."quests"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((public.uid_to_user_id(auth.uid()) = parent_id) AND (EXISTS ( SELECT 1
   FROM public.relations r
  WHERE ((r.parent_id = quests.parent_id) AND (r.child_id = quests.child_id) AND (r.status = 'ACTIVE'::public.relation_status))))));

CREATE POLICY "quests_select_related" ON "public"."quests"
  FOR SELECT
  TO PUBLIC
  USING (((public.uid_to_user_id(auth.uid()) = parent_id) OR (public.uid_to_user_id(auth.uid()) = child_id)));

CREATE POLICY "quests_update_related" ON "public"."quests"
  FOR UPDATE
  TO PUBLIC
  USING (((public.uid_to_user_id(auth.uid()) = parent_id) OR (public.uid_to_user_id(auth.uid()) = child_id)))
  WITH CHECK (((public.uid_to_user_id(auth.uid()) = parent_id) OR (public.uid_to_user_id(auth.uid()) = child_id)));

CREATE POLICY "Parents can insert relations" ON "public"."relations"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = relations.parent_id) AND (u.auth_user_id = auth.uid()) AND (u.role = 'PARENT'::public.user_role)))));

CREATE POLICY "parent or child can delete relations" ON "public"."relations"
  FOR DELETE
  TO "authenticated"
  USING ((public.is_me_user_id(parent_id) OR public.is_me_user_id(child_id)));

CREATE POLICY "parent or child can update relations" ON "public"."relations"
  FOR UPDATE
  TO "authenticated"
  USING ((public.is_me_user_id(parent_id) OR public.is_me_user_id(child_id)))
  WITH CHECK ((public.is_me_user_id(parent_id) OR public.is_me_user_id(child_id)));

CREATE POLICY "parent or child can view relations" ON "public"."relations"
  FOR SELECT
  TO "authenticated"
  USING ((public.is_me_user_id(parent_id) OR public.is_me_user_id(child_id)));

CREATE POLICY "Everyone can view shop items" ON "public"."shop_items"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "transactions_insert_policy" ON "public"."transactions"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = public.uid_to_user_id(auth.uid())));

CREATE POLICY "transactions_select_policy" ON "public"."transactions"
  FOR SELECT
  TO "authenticated"
  USING ((public.is_me_user_id(user_id) OR (EXISTS ( SELECT 1
   FROM public.relations r
  WHERE
    ((r.status = 'ACTIVE'::public.relation_status) AND (((r.parent_id = public.uid_to_user_id(auth.uid())) AND (r.child_id = transactions.user_id)) OR ((r.child_id =
    public.uid_to_user_id(auth.uid())) AND (r.parent_id = transactions.user_id))))))));

CREATE POLICY "Users can update only their own data" ON "public"."users"
  FOR UPDATE
  TO PUBLIC
  USING ((auth_user_id = auth.uid()));

CREATE POLICY "Users can view only their own data" ON "public"."users"
  FOR SELECT
  TO PUBLIC
  USING ((auth_user_id = auth.uid()));

CREATE POLICY "Users: parent of my incoming relation" ON "public"."users"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.relations r
  WHERE ((r.parent_id = users.id) AND public.is_me_user_id(r.child_id) AND (r.status = ANY (ARRAY['PENDING'::public.relation_status, 'ACTIVE'::public.relation_status]))))));

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."relations";

GRANT EXECUTE ON FUNCTION "public"."apply_initial_credit_on_role_change"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."apply_transaction_to_balance"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."approve_quest_with_reward"(bigint) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."create_initial_credit_tx"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."find_child_by_tag"(text, text) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."give_attendance"(bigint, integer) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_auth_user"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_me_user_id"(bigint) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."spend_coins"(bigint, integer, public.reference_type, bigint, text) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."sync_user_map"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."uid_to_user_id"(uuid) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."bank_items_id_seq" TO "anon", "authenticated", "postgres", "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."bank_purchases_id_seq" TO "anon", "authenticated", "postgres", "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."quests_id_seq" TO "anon", "authenticated", "postgres", "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."relations_id_seq" TO "anon", "authenticated", "postgres", "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."shop_items_id_seq" TO "anon", "authenticated", "postgres", "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."shop_purchases_id_seq" TO "anon", "authenticated", "postgres", "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."transactions_id_seq" TO "anon", "authenticated", "postgres", "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."users_id_seq" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."balances" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bank_items" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bank_purchases" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quests" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."relations" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."shop_items" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."shop_purchases" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."transactions" TO "anon";

REVOKE ALL ON TABLE "public"."transactions" FROM "authenticated";

GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."transactions" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."transactions" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_map" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "anon", "authenticated", "postgres", "service_role";

GRANT USAGE ON TYPE "public"."balance_type" TO "postgres";

GRANT USAGE ON TYPE "public"."currency_unit" TO "postgres";

GRANT USAGE ON TYPE "public"."quest_status" TO "postgres";

GRANT USAGE ON TYPE "public"."reference_type" TO "postgres";

GRANT USAGE ON TYPE "public"."relation_status" TO "postgres";

GRANT USAGE ON TYPE "public"."transaction_type" TO "postgres";

GRANT USAGE ON TYPE "public"."user_role" TO "postgres";


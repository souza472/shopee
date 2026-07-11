
-- 1. VIP tiers config
CREATE TABLE public.vip_tiers (
  level int PRIMARY KEY,
  name text NOT NULL,
  min_deposited_cents bigint NOT NULL,
  daily_tasks int NOT NULL,
  checkin_bonus_cents bigint NOT NULL DEFAULT 50
);
GRANT SELECT ON public.vip_tiers TO anon, authenticated;
GRANT ALL ON public.vip_tiers TO service_role;
ALTER TABLE public.vip_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vip_tiers public read" ON public.vip_tiers FOR SELECT USING (true);

INSERT INTO public.vip_tiers(level, name, min_deposited_cents, daily_tasks, checkin_bonus_cents) VALUES
  (0, 'Free',  1000,   5,   50),
  (1, 'VIP 1', 5000,   10,  100),
  (2, 'VIP 2', 15000,  20,  200),
  (3, 'VIP 3', 50000,  40,  350),
  (4, 'VIP 4', 150000, 80,  500),
  (5, 'VIP 5', 500000, 150, 800);

-- 2. Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vip_level int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vip_at_last_withdrawal int NOT NULL DEFAULT -1,
  ADD COLUMN IF NOT EXISTS last_deposit_notified_id uuid,
  ADD COLUMN IF NOT EXISTS last_checkin_date date;

-- 3. daily_checkins
CREATE TABLE public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  amount_cents bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
GRANT SELECT ON public.daily_checkins TO authenticated;
GRANT ALL ON public.daily_checkins TO service_role;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ci self select" ON public.daily_checkins FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. site_assets
CREATE TABLE public.site_assets (
  key text PRIMARY KEY,
  url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_assets TO anon, authenticated;
GRANT ALL ON public.site_assets TO service_role;
ALTER TABLE public.site_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assets public read" ON public.site_assets FOR SELECT USING (true);

-- 5. Recalc VIP function
CREATE OR REPLACE FUNCTION public.recalc_vip(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _lvl int;
BEGIN
  SELECT COALESCE(MAX(t.level),0) INTO _lvl
    FROM public.vip_tiers t, public.profiles p
   WHERE p.id = _user_id AND p.total_deposited_cents >= t.min_deposited_cents;
  UPDATE public.profiles SET vip_level = _lvl WHERE id = _user_id;
END; $$;

-- 6. Update admin_credit_deposit to recalc VIP
CREATE OR REPLACE FUNCTION public.admin_credit_deposit(_tx_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tx public.pix_transactions%ROWTYPE;
BEGIN
  SELECT * INTO _tx FROM public.pix_transactions WHERE id = _tx_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transação não encontrada'; END IF;
  IF _tx.status = 'COMPLETE' THEN RETURN; END IF;
  UPDATE public.pix_transactions SET status='COMPLETE', paid_at=COALESCE(paid_at, now()) WHERE id=_tx_id;
  UPDATE public.profiles
     SET balance_cents = balance_cents + _tx.amount_cents,
         total_deposited_cents = total_deposited_cents + _tx.amount_cents
   WHERE id = _tx.user_id;
  PERFORM public.maybe_activate(_tx.user_id);
  PERFORM public.recalc_vip(_tx.user_id);
END; $$;

-- 7. Update complete_task with VIP daily limit
CREATE OR REPLACE FUNCTION public.complete_task(_user_id uuid, _product_id uuid, _reward_cents bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _limit int; _done int; _lvl int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=_user_id AND activated=true AND blocked=false) THEN
    RAISE EXCEPTION 'Conta não ativada';
  END IF;
  SELECT vip_level INTO _lvl FROM public.profiles WHERE id=_user_id;
  SELECT daily_tasks INTO _limit FROM public.vip_tiers WHERE level=_lvl;
  SELECT count(*) INTO _done FROM public.task_completions
    WHERE user_id=_user_id AND created_at >= (now() AT TIME ZONE 'utc')::date;
  IF _done >= _limit THEN
    RAISE EXCEPTION 'Limite diário atingido (% tarefas). Faça upgrade de VIP para liberar mais.', _limit;
  END IF;
  INSERT INTO public.task_completions(user_id, product_id, reward_cents) VALUES (_user_id, _product_id, _reward_cents);
  UPDATE public.profiles
     SET balance_cents = balance_cents + _reward_cents,
         total_earned_cents = total_earned_cents + _reward_cents
   WHERE id = _user_id;
END; $$;

-- 8. Check-in function
CREATE OR REPLACE FUNCTION public.do_checkin(_user_id uuid)
RETURNS TABLE(amount_cents bigint) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bonus bigint; _lvl int; _today date := (now() AT TIME ZONE 'utc')::date;
BEGIN
  IF EXISTS (SELECT 1 FROM public.daily_checkins WHERE user_id=_user_id AND date=_today) THEN
    RAISE EXCEPTION 'Check-in de hoje já realizado';
  END IF;
  SELECT vip_level INTO _lvl FROM public.profiles WHERE id=_user_id;
  SELECT checkin_bonus_cents INTO _bonus FROM public.vip_tiers WHERE level=COALESCE(_lvl,0);
  INSERT INTO public.daily_checkins(user_id, date, amount_cents) VALUES (_user_id, _today, _bonus);
  UPDATE public.profiles
     SET balance_cents = balance_cents + _bonus,
         last_checkin_date = _today
   WHERE id = _user_id;
  RETURN QUERY SELECT _bonus;
END; $$;

REVOKE ALL ON FUNCTION public.recalc_vip(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.do_checkin(uuid) FROM PUBLIC, anon, authenticated;

-- 9. Backfill VIP for existing users
DO $$ DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.recalc_vip(r.id);
  END LOOP;
END $$;

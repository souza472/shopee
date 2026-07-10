
-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS activated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_withdrawal_done boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS total_deposited_cents bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_earned_cents bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS withdraw_password_hash text;

-- Handle new user: also credit R$5 bonus and generate promo code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, name, document, balance_cents, promo_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'document',
    500, -- R$5 bônus de boas-vindas
    upper(substr(md5(NEW.id::text || clock_timestamp()::text), 1, 6)),
    NEW.raw_user_meta_data->>'referred_by'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Activate account when total confirmed deposits >= R$10
CREATE OR REPLACE FUNCTION public.maybe_activate(_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
     SET activated = true
   WHERE id = _user_id AND total_deposited_cents >= 1000;
$$;

-- Products (Shopee items to review)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  price_cents bigint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (active = true);

-- Task completions
CREATE TABLE IF NOT EXISTS public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  reward_cents bigint NOT NULL DEFAULT 250,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.task_completions TO authenticated;
GRANT ALL ON public.task_completions TO service_role;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tc self select" ON public.task_completions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Withdrawals
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents bigint NOT NULL,
  fee_cents bigint NOT NULL DEFAULT 0,
  net_cents bigint NOT NULL,
  pix_key_type text NOT NULL,
  pix_key text NOT NULL,
  holder_name text NOT NULL,
  holder_document text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wd self select" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Task complete RPC (checks activation, credits balance, records)
CREATE OR REPLACE FUNCTION public.complete_task(_user_id uuid, _product_id uuid, _reward_cents bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND activated = true AND blocked = false) THEN
    RAISE EXCEPTION 'Conta não ativada';
  END IF;
  INSERT INTO public.task_completions (user_id, product_id, reward_cents)
    VALUES (_user_id, _product_id, _reward_cents);
  UPDATE public.profiles
     SET balance_cents = balance_cents + _reward_cents,
         total_earned_cents = total_earned_cents + _reward_cents
   WHERE id = _user_id;
END;
$$;

-- Seed some Shopee-like products
INSERT INTO public.products (title, image_url, price_cents) VALUES
  ('Fone Bluetooth TWS Pro', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400', 8990),
  ('Smartwatch D20', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 5990),
  ('Câmera de Segurança Wi-Fi', 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400', 12990),
  ('Mochila Casual Impermeável', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 7500),
  ('Kit Skincare Facial', 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400', 4990),
  ('Ventilador Portátil USB', 'https://images.unsplash.com/photo-1586952518485-11b180e92764?w=400', 3990),
  ('Luminária LED de Mesa', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', 4590),
  ('Tênis Esportivo Runner', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 15990)
ON CONFLICT DO NOTHING;

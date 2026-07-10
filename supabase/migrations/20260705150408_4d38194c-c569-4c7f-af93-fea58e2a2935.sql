
-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  document TEXT,
  balance_cents BIGINT NOT NULL DEFAULT 0,
  blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup: phone/name/document read from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, name, document)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'document'
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Admin users
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
-- no policies: only service role can access

-- Gateway settings (singleton)
CREATE TABLE public.gateway_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  api_key_encrypted TEXT,
  webhook_secret TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.gateway_settings (id) VALUES (1);
GRANT ALL ON public.gateway_settings TO service_role;
ALTER TABLE public.gateway_settings ENABLE ROW LEVEL SECURITY;

-- PIX transactions
CREATE TABLE public.pix_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT UNIQUE NOT NULL,
  provider_id TEXT,
  amount_cents BIGINT NOT NULL,
  net_amount_cents BIGINT,
  fee_cents BIGINT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  description TEXT,
  pix_copy_paste TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX pix_tx_user_idx ON public.pix_transactions(user_id, created_at DESC);
GRANT SELECT ON public.pix_transactions TO authenticated;
GRANT ALL ON public.pix_transactions TO service_role;
ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx self select" ON public.pix_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Webhook events
CREATE TABLE public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.pix_transactions(id) ON DELETE SET NULL,
  external_id TEXT,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Credit balance atomically
CREATE OR REPLACE FUNCTION public.credit_balance(_user_id UUID, _amount_cents BIGINT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles SET balance_cents = balance_cents + _amount_cents WHERE id = _user_id;
$$;

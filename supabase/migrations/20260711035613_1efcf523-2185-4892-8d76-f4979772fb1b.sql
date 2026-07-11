CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _code text;
BEGIN
  _code := upper(substring(md5(random()::text) FROM 1 FOR 8));
  INSERT INTO public.profiles (id, phone, name, document, balance_cents, promo_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'document', ''),
    0,
    _code,
    NULLIF(NEW.raw_user_meta_data->>'referred_by','')
  );
  RETURN NEW;
END;
$$;
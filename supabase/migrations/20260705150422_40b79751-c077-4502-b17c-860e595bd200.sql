
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_balance(UUID, BIGINT) FROM PUBLIC, anon, authenticated;

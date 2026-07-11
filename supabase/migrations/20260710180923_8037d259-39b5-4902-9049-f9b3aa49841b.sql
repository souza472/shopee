
REVOKE ALL ON FUNCTION public.admin_credit_deposit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_cancel_deposit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_finalize_withdrawal(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_credit_deposit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_cancel_deposit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_finalize_withdrawal(uuid, boolean) TO service_role;

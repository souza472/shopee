
-- Admin-side helpers: idempotent deposit approval and withdrawal finalization.

CREATE OR REPLACE FUNCTION public.admin_credit_deposit(_tx_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tx public.pix_transactions%ROWTYPE;
BEGIN
  SELECT * INTO _tx FROM public.pix_transactions WHERE id = _tx_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transação não encontrada'; END IF;
  IF _tx.status = 'COMPLETE' THEN RETURN; END IF;

  UPDATE public.pix_transactions
     SET status = 'COMPLETE',
         paid_at = COALESCE(paid_at, now())
   WHERE id = _tx_id;

  UPDATE public.profiles
     SET balance_cents = balance_cents + _tx.amount_cents,
         total_deposited_cents = total_deposited_cents + _tx.amount_cents
   WHERE id = _tx.user_id;

  PERFORM public.maybe_activate(_tx.user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_cancel_deposit(_tx_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pix_transactions
     SET status = 'CANCELED'
   WHERE id = _tx_id AND status = 'PENDING';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_finalize_withdrawal(_wd_id uuid, _approve boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _wd public.withdrawals%ROWTYPE;
BEGIN
  SELECT * INTO _wd FROM public.withdrawals WHERE id = _wd_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Saque não encontrado'; END IF;
  IF _wd.status <> 'PENDING' THEN RETURN; END IF;

  IF _approve THEN
    UPDATE public.withdrawals
       SET status = 'COMPLETED', processed_at = now()
     WHERE id = _wd_id;
  ELSE
    UPDATE public.withdrawals
       SET status = 'FAILED', processed_at = now()
     WHERE id = _wd_id;
    UPDATE public.profiles
       SET balance_cents = balance_cents + _wd.amount_cents + _wd.fee_cents,
           first_withdrawal_done = false
     WHERE id = _wd.user_id;
  END IF;
END;
$$;

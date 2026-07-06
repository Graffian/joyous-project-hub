
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'received';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'preparing';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'completed';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS received_at timestamptz,
  ADD COLUMN IF NOT EXISTS preparing_at timestamptz,
  ADD COLUMN IF NOT EXISTS out_for_delivery_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Backfill received_at from created_at for existing rows
UPDATE public.orders SET received_at = created_at WHERE received_at IS NULL;

CREATE OR REPLACE FUNCTION public.stamp_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.received_at IS NULL AND NEW.status::text IN ('pending','received') THEN
      NEW.received_at := now();
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    CASE NEW.status::text
      WHEN 'received' THEN NEW.received_at := COALESCE(NEW.received_at, now());
      WHEN 'preparing' THEN NEW.preparing_at := now();
      WHEN 'out_for_delivery' THEN NEW.out_for_delivery_at := now();
      WHEN 'completed', 'delivered' THEN NEW.completed_at := now();
      WHEN 'cancelled' THEN NEW.cancelled_at := now();
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_order_status ON public.orders;
CREATE TRIGGER trg_stamp_order_status
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.stamp_order_status();

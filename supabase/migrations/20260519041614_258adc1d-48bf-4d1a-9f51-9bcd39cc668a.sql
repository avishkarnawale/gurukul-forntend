
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_student_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_student_class_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.recalc_fee_status() FROM PUBLIC, anon, authenticated;

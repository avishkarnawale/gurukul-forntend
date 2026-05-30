
-- Board enum
CREATE TYPE public.board_type AS ENUM ('SSC', 'CBSE');

-- Add board to classes
ALTER TABLE public.classes ADD COLUMN board public.board_type NOT NULL DEFAULT 'SSC';

-- Seed classes 1-10 for both boards (skip duplicates of existing names)
INSERT INTO public.classes (name, division, board)
SELECT 'Class ' || n::text, 'A', b::public.board_type
FROM generate_series(1, 10) AS n
CROSS JOIN (VALUES ('SSC'), ('CBSE')) AS boards(b)
ON CONFLICT DO NOTHING;

-- Notes table
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  board public.board_type,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes read" ON public.notes FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'staff') OR
  class_id IS NULL OR
  class_id = public.current_student_class_id()
);

CREATE POLICY "notes staff manage" ON public.notes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- PYQs table
CREATE TABLE public.pyqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  year INT,
  description TEXT,
  file_url TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  board public.board_type,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pyqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pyqs read" ON public.pyqs FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'staff') OR
  class_id IS NULL OR
  class_id = public.current_student_class_id()
);

CREATE POLICY "pyqs staff manage" ON public.pyqs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "study-materials public read" ON storage.objects FOR SELECT
USING (bucket_id = 'study-materials');

CREATE POLICY "study-materials staff upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'study-materials' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
);

CREATE POLICY "study-materials staff update" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'study-materials' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
);

CREATE POLICY "study-materials staff delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'study-materials' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
);

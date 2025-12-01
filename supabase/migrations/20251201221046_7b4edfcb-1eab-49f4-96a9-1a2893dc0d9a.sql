-- Create storage bucket for clothing images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clothing-images', 'clothing-images', true);

-- Create clothing_items table
CREATE TABLE public.clothing_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT, -- camisa, calça, vestido, etc
  color TEXT,
  pattern TEXT, -- liso, xadrez, listrado, etc
  material TEXT,
  style TEXT,
  category TEXT NOT NULL, -- superior, inferior, sapato, acessório
  description_short TEXT,
  description_long TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create looks table
CREATE TABLE public.looks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  occasion TEXT, -- casual, trabalho, festa, etc
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create look_items junction table
CREATE TABLE public.look_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  look_id UUID NOT NULL REFERENCES public.looks(id) ON DELETE CASCADE,
  clothing_item_id UUID NOT NULL REFERENCES public.clothing_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(look_id, clothing_item_id)
);

-- Enable Row Level Security
ALTER TABLE public.clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.looks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.look_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clothing_items
CREATE POLICY "Users can view their own clothing items"
  ON public.clothing_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clothing items"
  ON public.clothing_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clothing items"
  ON public.clothing_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clothing items"
  ON public.clothing_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for looks
CREATE POLICY "Users can view their own looks"
  ON public.looks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own looks"
  ON public.looks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own looks"
  ON public.looks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own looks"
  ON public.looks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for look_items
CREATE POLICY "Users can view their own look items"
  ON public.look_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.looks
      WHERE looks.id = look_items.look_id
      AND looks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own look items"
  ON public.look_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.looks
      WHERE looks.id = look_items.look_id
      AND looks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own look items"
  ON public.look_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.looks
      WHERE looks.id = look_items.look_id
      AND looks.user_id = auth.uid()
    )
  );

-- Storage policies for clothing images
CREATE POLICY "Users can view their own clothing images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own clothing images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own clothing images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own clothing images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clothing_items_updated_at
  BEFORE UPDATE ON public.clothing_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_looks_updated_at
  BEFORE UPDATE ON public.looks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
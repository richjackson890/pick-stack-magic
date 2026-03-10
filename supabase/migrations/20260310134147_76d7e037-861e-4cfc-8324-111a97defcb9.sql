
ALTER TABLE public.creator_channels DROP CONSTRAINT creator_channels_user_id_fkey;
ALTER TABLE public.content_ideas DROP CONSTRAINT content_ideas_user_id_fkey;
ALTER TABLE public.content_ideas DROP CONSTRAINT content_ideas_channel_id_fkey;
ALTER TABLE public.content_ideas ADD CONSTRAINT content_ideas_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.creator_channels(id) ON DELETE CASCADE;

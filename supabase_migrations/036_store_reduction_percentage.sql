-- Add reduction_percentage column to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS reduction_percentage INTEGER DEFAULT 0 CHECK (reduction_percentage >= 0 AND reduction_percentage <= 100);

/*
  # Create Config Files Storage Bucket
  
  1. New Storage Bucket
    - Creates `config-files` bucket for system configuration files
    - Public access enabled for logo and favicon
*/

-- Create the config-files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('config-files', 'config-files', true)
ON CONFLICT (id) DO NOTHING;

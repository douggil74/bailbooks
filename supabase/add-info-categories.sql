ALTER TABLE applications
ADD COLUMN IF NOT EXISTS indemnitor_info_categories TEXT
DEFAULT 'personal,address,employer,id_photos';

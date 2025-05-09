-- Create a new schema for PostGIS tables
CREATE SCHEMA IF NOT EXISTS postgis;

-- Move the spatial_ref_sys table to the postgis schema
ALTER TABLE public.spatial_ref_sys SET SCHEMA postgis;

-- Grant usage on the postgis schema to authenticated users
GRANT USAGE ON SCHEMA postgis TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA postgis TO authenticated;

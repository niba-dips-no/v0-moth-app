-- Create a function to update observation status directly
CREATE OR REPLACE FUNCTION public.update_observation_status(
  observation_id UUID,
  new_status TEXT,
  reviewed_at TIMESTAMPTZ DEFAULT now()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
BEGIN
  UPDATE public.observations
  SET 
    status = new_status,
    reviewed_at = $3
  WHERE id = observation_id;
  
  RETURN FOUND; -- Returns true if a row was updated
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_observation_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_observation_status TO anon;

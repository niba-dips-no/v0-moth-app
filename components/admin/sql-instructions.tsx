"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clipboard, Check } from "lucide-react"

export function SqlInstructions() {
  const [copied, setCopied] = useState(false)

  const sqlScript = `-- This script fixes the infinite recursion issue by simplifying the policies
-- Run this in the Supabase SQL Editor

-- Disable RLS temporarily to fix the policies
ALTER TABLE IF EXISTS public.observations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might be causing recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update observations" ON public.observations;
DROP POLICY IF EXISTS "Anyone can update observations" ON public.observations;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create simplified policies without circular references
-- For profiles table
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update profiles" 
ON public.profiles FOR UPDATE 
USING (true);

-- For observations table - make it simple for now
CREATE POLICY "Anyone can select observations" 
ON public.observations FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert observations" 
ON public.observations FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update observations" 
ON public.observations FOR UPDATE 
USING (true);

-- Re-enable RLS
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verify the policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM 
    pg_policies 
WHERE 
    schemaname = 'public' AND 
    (tablename = 'observations' OR tablename = 'profiles');`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Fix Database Policies</CardTitle>
        <Button variant="outline" size="sm" onClick={copyToClipboard}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Clipboard className="h-4 w-4 mr-2" />}
          {copied ? "Copied!" : "Copy SQL"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>To fix the infinite recursion issue, you need to run the SQL script below in the Supabase SQL Editor:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Go to your Supabase dashboard</li>
            <li>Click on "SQL Editor" in the left sidebar</li>
            <li>Create a "New Query"</li>
            <li>Paste the SQL script below</li>
            <li>Click "Run" to execute the script</li>
            <li>Return to this app and try updating an observation status again</li>
          </ol>

          <div className="bg-muted p-4 rounded-md overflow-auto max-h-[300px]">
            <pre className="text-xs">{sqlScript}</pre>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
            <p className="text-amber-800 text-sm">
              <strong>Note:</strong> This script will simplify your database policies to fix the infinite recursion
              issue. In a production environment, you would want to implement more restrictive policies after fixing the
              issue.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      observations: {
        Row: {
          id: string
          created_at: string
          user_id: string | null
          image_url: string
          comment: string
          latitude: number
          longitude: number
          accuracy: number | null
          device_info: Json
          status: "Pending" | "Approved" | "Rejected"
          reviewer_id: string | null
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string | null
          image_url: string
          comment: string
          latitude: number
          longitude: number
          accuracy?: number | null
          device_info: Json
          status?: "Pending" | "Approved" | "Rejected"
          reviewer_id?: string | null
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string | null
          image_url?: string
          comment?: string
          latitude?: number
          longitude?: number
          accuracy?: number | null
          device_info?: Json
          status?: "Pending" | "Approved" | "Rejected"
          reviewer_id?: string | null
          reviewed_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          name: string | null
          avatar_url: string | null
          role: "user" | "admin"
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          role?: "user" | "admin"
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          role?: "user" | "admin"
        }
      }
      newsletter_subscribers: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          name?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

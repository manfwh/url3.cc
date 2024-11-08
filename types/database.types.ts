export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      links: {
        Row: {
          created_at: string
          domain: string | null
          id: number
          key: string
          project_id: number | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: number
          key: string
          project_id?: number | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: number
          key?: string
          project_id?: number | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'links_project_id_fkey'
            columns: ['project_id']
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'links_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      project_users: {
        Row: {
          created_at: string
          id: number
          project_id: number
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          project_id: number
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          project_id?: number
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_users_project_id_fkey'
            columns: ['project_id']
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_users_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: number
          name: string | null
          owner_id: string | null
          slug: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
          owner_id?: string | null
          slug?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
          owner_id?: string | null
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'projects_owner_id_fkey'
            columns: ['owner_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      projects_teams: {
        Row: {
          project_id: number
          team_id: number
        }
        Insert: {
          project_id: number
          team_id: number
        }
        Update: {
          project_id?: number
          team_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'projects_teams_project_id_fkey'
            columns: ['project_id']
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projects_teams_team_id_fkey'
            columns: ['team_id']
            referencedRelation: 'teams'
            referencedColumns: ['id']
          }
        ]
      }
      teams: {
        Row: {
          id: number
          name: string | null
        }
        Insert: {
          id: number
          name?: string | null
        }
        Update: {
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          emial: string | null
          id: string
          image: string | null
          name: string | null
        }
        Insert: {
          emial?: string | null
          id: string
          image?: string | null
          name?: string | null
        }
        Update: {
          emial?: string | null
          id?: string
          image?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey'
            columns: ['id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      users_teams: {
        Row: {
          team_id: number
          user_id: string
        }
        Insert: {
          team_id: number
          user_id: string
        }
        Update: {
          team_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'users_teams_team_id_fkey'
            columns: ['team_id']
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'users_teams_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

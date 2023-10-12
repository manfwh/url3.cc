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
      assets: {
        Row: {
          created_at: string
          description: string | null
          id: number
          key: string | null
          owner_id: string | null
          project_id: number | null
          title: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          key?: string | null
          owner_id?: string | null
          project_id?: number | null
          title?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          key?: string | null
          owner_id?: string | null
          project_id?: number | null
          title?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'assets_owner_id_fkey'
            columns: ['owner_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assets_project_id_fkey'
            columns: ['project_id']
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      links: {
        Row: {
          android: string | null
          android_asset_id: number | null
          android_image: string | null
          asset_id: number | null
          clicks: number | null
          created_at: string
          description: string | null
          domain: string | null
          id: number
          image: string | null
          ios: string | null
          ios_asset_id: number | null
          ios_image: string | null
          key: string
          password: string | null
          project_id: number | null
          title: string | null
          type: Database['public']['Enums']['link_type']
          url: string | null
          user_id: string | null
        }
        Insert: {
          android?: string | null
          android_asset_id?: number | null
          android_image?: string | null
          asset_id?: number | null
          clicks?: number | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: number
          image?: string | null
          ios?: string | null
          ios_asset_id?: number | null
          ios_image?: string | null
          key: string
          password?: string | null
          project_id?: number | null
          title?: string | null
          type?: Database['public']['Enums']['link_type']
          url?: string | null
          user_id?: string | null
        }
        Update: {
          android?: string | null
          android_asset_id?: number | null
          android_image?: string | null
          asset_id?: number | null
          clicks?: number | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: number
          image?: string | null
          ios?: string | null
          ios_asset_id?: number | null
          ios_image?: string | null
          key?: string
          password?: string | null
          project_id?: number | null
          title?: string | null
          type?: Database['public']['Enums']['link_type']
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'links_android_asset_id_fkey'
            columns: ['android_asset_id']
            referencedRelation: 'assets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'links_asset_id_fkey'
            columns: ['asset_id']
            referencedRelation: 'assets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'links_ios_asset_id_fkey'
            columns: ['ios_asset_id']
            referencedRelation: 'assets'
            referencedColumns: ['id']
          },
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
      add_planet: {
        Args: {
          name: string
        }
        Returns: number
      }
      update_clicks: {
        Args: {
          key: string
        }
        Returns: undefined
      }
      update_link_clicks: {
        Args: {
          key: string
        }
        Returns: string
      }
    }
    Enums: {
      link_type: 'url' | 'image'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

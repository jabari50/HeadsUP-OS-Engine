export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      academic_profiles: {
        Row: {
          act_score: number | null
          athlete_id: string | null
          class_rank: string | null
          created_at: string | null
          gpa: number | null
          id: string
          intended_major: string | null
          notes: string | null
          sat_score: number | null
          scholarship_ready: boolean | null
          target_grad_year: number | null
          uil_eligible: boolean | null
          updated_at: string | null
        }
        Insert: {
          act_score?: number | null
          athlete_id?: string | null
          class_rank?: string | null
          created_at?: string | null
          gpa?: number | null
          id?: string
          intended_major?: string | null
          notes?: string | null
          sat_score?: number | null
          scholarship_ready?: boolean | null
          target_grad_year?: number | null
          uil_eligible?: boolean | null
          updated_at?: string | null
        }
        Update: {
          act_score?: number | null
          athlete_id?: string | null
          class_rank?: string | null
          created_at?: string | null
          gpa?: number | null
          id?: string
          intended_major?: string | null
          notes?: string | null
          sat_score?: number | null
          scholarship_ready?: boolean | null
          target_grad_year?: number | null
          uil_eligible?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_profiles_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_profiles_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_profiles_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          account_type: string
          assessment_answers: Json | null
          authenticity_score: number | null
          authority_loop_status: string
          badges_earned: string[] | null
          behavioral_evidence: Json | null
          blind_arb_posted_at: string | null
          completed_quests: string[] | null
          confidence_band: string | null
          created_at: string | null
          entry_source: string | null
          entry_status: string | null
          event_context: string | null
          founder_notes: string | null
          full_name: string
          gpa: number | null
          graduation_year: number
          historical_eval_date: string | null
          historical_source: string | null
          id: string
          injury_notes: string | null
          injury_status: boolean | null
          intel_timestamp: string | null
          is_demo: boolean
          is_historical: boolean
          key_quote: string | null
          leadership_identity: string | null
          llm_analysis: string | null
          llm_analysis_at: string | null
          location_city: string | null
          location_state: string | null
          locus_of_control: string | null
          market_position: string | null
          media_consent: boolean | null
          neck_down_metrics: Json
          neck_up_coachability: number | null
          neck_up_cognitive_stability: number | null
          neck_up_culture_equity: number | null
          neck_up_defense: number | null
          neck_up_markers: Json
          neck_up_ner: number | null
          neck_up_physical_output: number | null
          neck_up_playmaking: number | null
          neck_up_pro_score: number | null
          neck_up_resilience: number | null
          nil_score: number | null
          ovr: number | null
          placement_interest: string | null
          position: string | null
          profile_public: boolean | null
          profile_slug: string | null
          program_id: string | null
          questions_answered: number | null
          questions_total: number | null
          school: string | null
          secondary_tags: string[] | null
          self_awareness_gap: Json | null
          self_awareness_score: number | null
          self_report_analysis: Json | null
          self_report_at: string | null
          self_report_responses: Json | null
          social_following: number | null
          sovereign_verified: boolean | null
          sport: string
          sport_specific_metrics: Json | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_plan: string | null
          superagent_unlocked: boolean
          uil_eligible: boolean | null
          updated_at: string | null
          user_id: string | null
          verification_source: string | null
          xp_total: number | null
        }
        Insert: {
          account_type?: string
          assessment_answers?: Json | null
          authenticity_score?: number | null
          authority_loop_status?: string
          badges_earned?: string[] | null
          behavioral_evidence?: Json | null
          blind_arb_posted_at?: string | null
          completed_quests?: string[] | null
          confidence_band?: string | null
          created_at?: string | null
          entry_source?: string | null
          entry_status?: string | null
          event_context?: string | null
          founder_notes?: string | null
          full_name: string
          gpa?: number | null
          graduation_year: number
          historical_eval_date?: string | null
          historical_source?: string | null
          id?: string
          injury_notes?: string | null
          injury_status?: boolean | null
          intel_timestamp?: string | null
          is_demo?: boolean
          is_historical?: boolean
          key_quote?: string | null
          leadership_identity?: string | null
          llm_analysis?: string | null
          llm_analysis_at?: string | null
          location_city?: string | null
          location_state?: string | null
          locus_of_control?: string | null
          market_position?: string | null
          media_consent?: boolean | null
          neck_down_metrics?: Json
          neck_up_coachability?: number | null
          neck_up_cognitive_stability?: number | null
          neck_up_culture_equity?: number | null
          neck_up_defense?: number | null
          neck_up_markers?: Json
          neck_up_ner?: number | null
          neck_up_physical_output?: number | null
          neck_up_playmaking?: number | null
          neck_up_pro_score?: number | null
          neck_up_resilience?: number | null
          nil_score?: number | null
          ovr?: number | null
          placement_interest?: string | null
          position?: string | null
          profile_public?: boolean | null
          profile_slug?: string | null
          program_id?: string | null
          questions_answered?: number | null
          questions_total?: number | null
          school?: string | null
          secondary_tags?: string[] | null
          self_awareness_gap?: Json | null
          self_awareness_score?: number | null
          self_report_analysis?: Json | null
          self_report_at?: string | null
          self_report_responses?: Json | null
          social_following?: number | null
          sovereign_verified?: boolean | null
          sport?: string
          sport_specific_metrics?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          superagent_unlocked?: boolean
          uil_eligible?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          verification_source?: string | null
          xp_total?: number | null
        }
        Update: {
          account_type?: string
          assessment_answers?: Json | null
          authenticity_score?: number | null
          authority_loop_status?: string
          badges_earned?: string[] | null
          behavioral_evidence?: Json | null
          blind_arb_posted_at?: string | null
          completed_quests?: string[] | null
          confidence_band?: string | null
          created_at?: string | null
          entry_source?: string | null
          entry_status?: string | null
          event_context?: string | null
          founder_notes?: string | null
          full_name?: string
          gpa?: number | null
          graduation_year?: number
          historical_eval_date?: string | null
          historical_source?: string | null
          id?: string
          injury_notes?: string | null
          injury_status?: boolean | null
          intel_timestamp?: string | null
          is_demo?: boolean
          is_historical?: boolean
          key_quote?: string | null
          leadership_identity?: string | null
          llm_analysis?: string | null
          llm_analysis_at?: string | null
          location_city?: string | null
          location_state?: string | null
          locus_of_control?: string | null
          market_position?: string | null
          media_consent?: boolean | null
          neck_down_metrics?: Json
          neck_up_coachability?: number | null
          neck_up_cognitive_stability?: number | null
          neck_up_culture_equity?: number | null
          neck_up_defense?: number | null
          neck_up_markers?: Json
          neck_up_ner?: number | null
          neck_up_physical_output?: number | null
          neck_up_playmaking?: number | null
          neck_up_pro_score?: number | null
          neck_up_resilience?: number | null
          nil_score?: number | null
          ovr?: number | null
          placement_interest?: string | null
          position?: string | null
          profile_public?: boolean | null
          profile_slug?: string | null
          program_id?: string | null
          questions_answered?: number | null
          questions_total?: number | null
          school?: string | null
          secondary_tags?: string[] | null
          self_awareness_gap?: Json | null
          self_awareness_score?: number | null
          self_report_analysis?: Json | null
          self_report_at?: string | null
          self_report_responses?: Json | null
          social_following?: number | null
          sovereign_verified?: boolean | null
          sport?: string
          sport_specific_metrics?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          superagent_unlocked?: boolean
          uil_eligible?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          verification_source?: string | null
          xp_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athletes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_history: {
        Row: {
          athlete_id: string | null
          audit_timestamp: string | null
          confidence_band: string | null
          deficiency_flags: Json | null
          engine_version: string | null
          id: string
          market_position: string | null
          neck_up_coachability: number | null
          neck_up_culture_equity: number | null
          neck_up_defense: number | null
          neck_up_ner: number | null
          neck_up_physical_output: number | null
          neck_up_playmaking: number | null
          neck_up_pro_score: number | null
          neck_up_resilience: number | null
          ovr: number | null
          quests_assigned: number | null
        }
        Insert: {
          athlete_id?: string | null
          audit_timestamp?: string | null
          confidence_band?: string | null
          deficiency_flags?: Json | null
          engine_version?: string | null
          id?: string
          market_position?: string | null
          neck_up_coachability?: number | null
          neck_up_culture_equity?: number | null
          neck_up_defense?: number | null
          neck_up_ner?: number | null
          neck_up_physical_output?: number | null
          neck_up_playmaking?: number | null
          neck_up_pro_score?: number | null
          neck_up_resilience?: number | null
          ovr?: number | null
          quests_assigned?: number | null
        }
        Update: {
          athlete_id?: string | null
          audit_timestamp?: string | null
          confidence_band?: string | null
          deficiency_flags?: Json | null
          engine_version?: string | null
          id?: string
          market_position?: string | null
          neck_up_coachability?: number | null
          neck_up_culture_equity?: number | null
          neck_up_defense?: number | null
          neck_up_ner?: number | null
          neck_up_physical_output?: number | null
          neck_up_playmaking?: number | null
          neck_up_pro_score?: number | null
          neck_up_resilience?: number | null
          ovr?: number | null
          quests_assigned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_history_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_history_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_history_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      circuit_athlete_links: {
        Row: {
          athlete_id: string | null
          circuit_player_id: string
          id: string
          match_confidence: string
          matched_at: string
          matched_by: string
          notes: string | null
        }
        Insert: {
          athlete_id?: string | null
          circuit_player_id: string
          id?: string
          match_confidence?: string
          matched_at?: string
          matched_by?: string
          notes?: string | null
        }
        Update: {
          athlete_id?: string | null
          circuit_player_id?: string
          id?: string
          match_confidence?: string
          matched_at?: string
          matched_by?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "circuit_athlete_links_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circuit_athlete_links_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circuit_athlete_links_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circuit_athlete_links_circuit_player_id_fkey"
            columns: ["circuit_player_id"]
            isOneToOne: false
            referencedRelation: "circuit_player_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      circuit_player_stats: {
        Row: {
          apg: number | null
          bpg: number | null
          circuit: string
          circuit_team: string | null
          fg_pct: number | null
          ft_pct: number | null
          full_name: string
          gp: number | null
          graduation_year: number | null
          height_raw: string | null
          id: string
          mpg: number | null
          pfpg: number | null
          position: string | null
          ppg: number | null
          rpg: number | null
          scrape_session_id: string | null
          scraped_at: string
          season_year: number
          session_id: string
          source_url: string | null
          spg: number | null
          three_pt_pct: number | null
          topg: number | null
        }
        Insert: {
          apg?: number | null
          bpg?: number | null
          circuit: string
          circuit_team?: string | null
          fg_pct?: number | null
          ft_pct?: number | null
          full_name: string
          gp?: number | null
          graduation_year?: number | null
          height_raw?: string | null
          id?: string
          mpg?: number | null
          pfpg?: number | null
          position?: string | null
          ppg?: number | null
          rpg?: number | null
          scrape_session_id?: string | null
          scraped_at?: string
          season_year: number
          session_id: string
          source_url?: string | null
          spg?: number | null
          three_pt_pct?: number | null
          topg?: number | null
        }
        Update: {
          apg?: number | null
          bpg?: number | null
          circuit?: string
          circuit_team?: string | null
          fg_pct?: number | null
          ft_pct?: number | null
          full_name?: string
          gp?: number | null
          graduation_year?: number | null
          height_raw?: string | null
          id?: string
          mpg?: number | null
          pfpg?: number | null
          position?: string | null
          ppg?: number | null
          rpg?: number | null
          scrape_session_id?: string | null
          scraped_at?: string
          season_year?: number
          session_id?: string
          source_url?: string | null
          spg?: number | null
          three_pt_pct?: number | null
          topg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "circuit_player_stats_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "circuit_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      circuit_prospects: {
        Row: {
          athlete_id: string | null
          circuit: string
          circuit_team: string | null
          created_at: string
          enrichment_at: string | null
          enrichment_status: string
          full_name: string
          graduation_year: number
          height_raw: string | null
          id: string
          is_dfw_priority: boolean
          location_city: string | null
          location_state: string | null
          name_key: string
          position: string | null
          ranking_247: string | null
          ranking_on3: string | null
          school_maxpreps: string | null
          source_url: string | null
          stars_247: number | null
          stars_on3: number | null
          state_rank_maxpreps: number | null
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          circuit: string
          circuit_team?: string | null
          created_at?: string
          enrichment_at?: string | null
          enrichment_status?: string
          full_name: string
          graduation_year?: number
          height_raw?: string | null
          id?: string
          is_dfw_priority?: boolean
          location_city?: string | null
          location_state?: string | null
          name_key: string
          position?: string | null
          ranking_247?: string | null
          ranking_on3?: string | null
          school_maxpreps?: string | null
          source_url?: string | null
          stars_247?: number | null
          stars_on3?: number | null
          state_rank_maxpreps?: number | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          circuit?: string
          circuit_team?: string | null
          created_at?: string
          enrichment_at?: string | null
          enrichment_status?: string
          full_name?: string
          graduation_year?: number
          height_raw?: string | null
          id?: string
          is_dfw_priority?: boolean
          location_city?: string | null
          location_state?: string | null
          name_key?: string
          position?: string | null
          ranking_247?: string | null
          ranking_on3?: string | null
          school_maxpreps?: string | null
          source_url?: string | null
          stars_247?: number | null
          stars_on3?: number | null
          state_rank_maxpreps?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circuit_prospects_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circuit_prospects_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circuit_prospects_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      circuit_scrape_log: {
        Row: {
          context: Json
          id: string
          log_level: string
          logged_at: string
          message: string
          session_id: string
        }
        Insert: {
          context?: Json
          id?: string
          log_level?: string
          logged_at?: string
          message: string
          session_id: string
        }
        Update: {
          context?: Json
          id?: string
          log_level?: string
          logged_at?: string
          message?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circuit_scrape_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "circuit_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      circuit_sessions: {
        Row: {
          circuit: string
          created_at: string
          error_message: string | null
          id: string
          records_written: number | null
          scrape_completed_at: string | null
          scrape_started_at: string | null
          scrape_status: string
          scrape_triggered_by: string
          season_year: number
          session_name: string
          session_number: number | null
          updated_at: string
        }
        Insert: {
          circuit: string
          created_at?: string
          error_message?: string | null
          id?: string
          records_written?: number | null
          scrape_completed_at?: string | null
          scrape_started_at?: string | null
          scrape_status?: string
          scrape_triggered_by?: string
          season_year: number
          session_name: string
          session_number?: number | null
          updated_at?: string
        }
        Update: {
          circuit?: string
          created_at?: string
          error_message?: string | null
          id?: string
          records_written?: number | null
          scrape_completed_at?: string | null
          scrape_started_at?: string | null
          scrape_status?: string
          scrape_triggered_by?: string
          season_year?: number
          session_name?: string
          session_number?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      circuit_stats: {
        Row: {
          apg: number | null
          bpg: number | null
          circuit: string
          circuit_prospect_id: string
          fg_pct: number | null
          ft_pct: number | null
          gp: number | null
          id: string
          mpg: number | null
          pfpg: number | null
          ppg: number | null
          rpg: number | null
          scraped_at: string
          season_year: number | null
          session_id: string
          source_url: string | null
          spg: number | null
          three_pt_pct: number | null
          topg: number | null
        }
        Insert: {
          apg?: number | null
          bpg?: number | null
          circuit: string
          circuit_prospect_id: string
          fg_pct?: number | null
          ft_pct?: number | null
          gp?: number | null
          id?: string
          mpg?: number | null
          pfpg?: number | null
          ppg?: number | null
          rpg?: number | null
          scraped_at?: string
          season_year?: number | null
          session_id: string
          source_url?: string | null
          spg?: number | null
          three_pt_pct?: number | null
          topg?: number | null
        }
        Update: {
          apg?: number | null
          bpg?: number | null
          circuit?: string
          circuit_prospect_id?: string
          fg_pct?: number | null
          ft_pct?: number | null
          gp?: number | null
          id?: string
          mpg?: number | null
          pfpg?: number | null
          ppg?: number | null
          rpg?: number | null
          scraped_at?: string
          season_year?: number | null
          session_id?: string
          source_url?: string | null
          spg?: number | null
          three_pt_pct?: number | null
          topg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "circuit_stats_circuit_prospect_id_fkey"
            columns: ["circuit_prospect_id"]
            isOneToOne: false
            referencedRelation: "circuit_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circuit_stats_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "circuit_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_access_log: {
        Row: {
          access_timestamp: string | null
          athlete_id_viewed: string | null
          created_at: string | null
          division: string | null
          email: string
          first_name: string | null
          id: string
          institution: string
          ip_address: string | null
          last_name: string | null
          payment_status: string | null
          plan_selected: string | null
          referrer: string | null
          role: string | null
          stripe_payment_id: string | null
        }
        Insert: {
          access_timestamp?: string | null
          athlete_id_viewed?: string | null
          created_at?: string | null
          division?: string | null
          email: string
          first_name?: string | null
          id?: string
          institution: string
          ip_address?: string | null
          last_name?: string | null
          payment_status?: string | null
          plan_selected?: string | null
          referrer?: string | null
          role?: string | null
          stripe_payment_id?: string | null
        }
        Update: {
          access_timestamp?: string | null
          athlete_id_viewed?: string | null
          created_at?: string | null
          division?: string | null
          email?: string
          first_name?: string | null
          id?: string
          institution?: string
          ip_address?: string | null
          last_name?: string | null
          payment_status?: string | null
          plan_selected?: string | null
          referrer?: string | null
          role?: string | null
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_access_log_athlete_id_viewed_fkey"
            columns: ["athlete_id_viewed"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_access_log_athlete_id_viewed_fkey"
            columns: ["athlete_id_viewed"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_access_log_athlete_id_viewed_fkey"
            columns: ["athlete_id_viewed"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_athlete_links: {
        Row: {
          athlete_id: string | null
          coach_id: string | null
          id: string
          linked_at: string | null
        }
        Insert: {
          athlete_id?: string | null
          coach_id?: string | null
          id?: string
          linked_at?: string | null
        }
        Update: {
          athlete_id?: string | null
          coach_id?: string | null
          id?: string
          linked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_athlete_links_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_athlete_links_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_athlete_links_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_athlete_links_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_notes: {
        Row: {
          athlete_id: string | null
          coach_id: string | null
          created_at: string | null
          id: string
          note_text: string
          updated_at: string | null
        }
        Insert: {
          athlete_id?: string | null
          coach_id?: string | null
          created_at?: string | null
          id?: string
          note_text: string
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string | null
          coach_id?: string | null
          created_at?: string | null
          id?: string
          note_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_notes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_notes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_notes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_notes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_profiles: {
        Row: {
          bio: string | null
          contact_email: string | null
          created_at: string | null
          full_name: string
          id: string
          program: string | null
          role_title: string | null
          school: string | null
          sport: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          contact_email?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          program?: string | null
          role_title?: string | null
          school?: string | null
          sport?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          contact_email?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          program?: string | null
          role_title?: string | null
          school?: string | null
          sport?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      curriculum_modules: {
        Row: {
          active: boolean | null
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          duration_min: number | null
          id: string
          order_index: number | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          duration_min?: number | null
          id?: string
          order_index?: number | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          duration_min?: number | null
          id?: string
          order_index?: number | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          athlete_id: string | null
          checked_in: boolean | null
          checked_in_at: string | null
          created_at: string | null
          event_id: string | null
          id: string
          qr_code: string | null
        }
        Insert: {
          athlete_id?: string | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          qr_code?: string | null
        }
        Update: {
          athlete_id?: string | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          qr_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          event_date: string
          event_name: string
          id: string
          location: string | null
          sport: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          event_date: string
          event_name: string
          id?: string
          location?: string | null
          sport?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          event_date?: string
          event_name?: string
          id?: string
          location?: string | null
          sport?: string | null
        }
        Relationships: []
      }
      follow_lists: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          note: string | null
          scout_user_id: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          note?: string | null
          scout_user_id: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          note?: string | null
          scout_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_lists_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "prospect_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      hu_os_demo_athletes: {
        Row: {
          class_year: string
          classification: string
          created_at: string
          name: string
          ovr: number
          player_id: string
          position: string
          profile: Json
          school: string
          tier: string
        }
        Insert: {
          class_year: string
          classification: string
          created_at?: string
          name: string
          ovr: number
          player_id: string
          position: string
          profile: Json
          school: string
          tier: string
        }
        Update: {
          class_year?: string
          classification?: string
          created_at?: string
          name?: string
          ovr?: number
          player_id?: string
          position?: string
          profile?: Json
          school?: string
          tier?: string
        }
        Relationships: []
      }
      intel_drop_log: {
        Row: {
          action: string
          athlete_id: string | null
          dropped_at: string | null
          dropped_by: string | null
          id: string
          metadata: Json | null
          status_after: string | null
          status_before: string | null
        }
        Insert: {
          action: string
          athlete_id?: string | null
          dropped_at?: string | null
          dropped_by?: string | null
          id?: string
          metadata?: Json | null
          status_after?: string | null
          status_before?: string | null
        }
        Update: {
          action?: string
          athlete_id?: string | null
          dropped_at?: string | null
          dropped_by?: string | null
          id?: string
          metadata?: Json | null
          status_after?: string | null
          status_before?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intel_drop_log_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intel_drop_log_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intel_drop_log_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_analysis_log: {
        Row: {
          analysis_type: string
          athlete_id: string | null
          completion_tokens: number | null
          created_at: string | null
          fallback_used: boolean | null
          id: string
          model_used: string
          prompt_tokens: number | null
          result_json: Json | null
          result_text: string | null
          schema_valid: boolean | null
        }
        Insert: {
          analysis_type: string
          athlete_id?: string | null
          completion_tokens?: number | null
          created_at?: string | null
          fallback_used?: boolean | null
          id?: string
          model_used: string
          prompt_tokens?: number | null
          result_json?: Json | null
          result_text?: string | null
          schema_valid?: boolean | null
        }
        Update: {
          analysis_type?: string
          athlete_id?: string | null
          completion_tokens?: number | null
          created_at?: string | null
          fallback_used?: boolean | null
          id?: string
          model_used?: string
          prompt_tokens?: number | null
          result_json?: Json | null
          result_text?: string | null
          schema_valid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_analysis_log_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_analysis_log_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_analysis_log_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      match_requests: {
        Row: {
          class_year: string | null
          created_at: string
          height_max: number | null
          height_min: number | null
          id: string
          operator_id: string
          position: string
          status: string
        }
        Insert: {
          class_year?: string | null
          created_at?: string
          height_max?: number | null
          height_min?: number | null
          id?: string
          operator_id: string
          position: string
          status?: string
        }
        Update: {
          class_year?: string | null
          created_at?: string
          height_max?: number | null
          height_min?: number | null
          id?: string
          operator_id?: string
          position?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_requests_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      media_features: {
        Row: {
          air_date: string | null
          athlete_id: string | null
          consent_at: string | null
          consent_given: boolean | null
          created_at: string | null
          episode_number: number | null
          episode_title: string | null
          feature_type: string | null
          id: string
        }
        Insert: {
          air_date?: string | null
          athlete_id?: string | null
          consent_at?: string | null
          consent_given?: boolean | null
          created_at?: string | null
          episode_number?: number | null
          episode_title?: string | null
          feature_type?: string | null
          id?: string
        }
        Update: {
          air_date?: string | null
          athlete_id?: string | null
          consent_at?: string | null
          consent_given?: boolean | null
          created_at?: string | null
          episode_number?: number | null
          episode_title?: string | null
          feature_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_features_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_features_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_features_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      module_completions: {
        Row: {
          athlete_id: string | null
          completed_at: string | null
          id: string
          module_id: string | null
        }
        Insert: {
          athlete_id?: string | null
          completed_at?: string | null
          id?: string
          module_id?: string | null
        }
        Update: {
          athlete_id?: string | null
          completed_at?: string | null
          id?: string
          module_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_completions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_completions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_completions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_completions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      neural_audit_log: {
        Row: {
          actor_id: string | null
          actor_label: string | null
          athlete_id: string | null
          audit_timestamp: string | null
          confidence_band: string | null
          conversation_id: string | null
          created_at: string
          engine_version: string | null
          escalation_required: boolean | null
          event_type: string
          id: string
          log_source: string | null
          metrics_snapshot: Json
          payload: Json
          quests_assigned: string[] | null
          sovereign_query: string | null
          tier: number | null
          user_role: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_label?: string | null
          athlete_id?: string | null
          audit_timestamp?: string | null
          confidence_band?: string | null
          conversation_id?: string | null
          created_at?: string
          engine_version?: string | null
          escalation_required?: boolean | null
          event_type?: string
          id?: string
          log_source?: string | null
          metrics_snapshot: Json
          payload?: Json
          quests_assigned?: string[] | null
          sovereign_query?: string | null
          tier?: number | null
          user_role?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_label?: string | null
          athlete_id?: string | null
          audit_timestamp?: string | null
          confidence_band?: string | null
          conversation_id?: string | null
          created_at?: string
          engine_version?: string | null
          escalation_required?: boolean | null
          event_type?: string
          id?: string
          log_source?: string | null
          metrics_snapshot?: Json
          payload?: Json
          quests_assigned?: string[] | null
          sovereign_query?: string | null
          tier?: number | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "neural_audit_log_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neural_audit_log_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neural_audit_log_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      nil_profiles: {
        Row: {
          active_deals: number | null
          athlete_id: string | null
          brand_readiness: number | null
          created_at: string | null
          estimated_value_mo: number | null
          id: string
          media_presence: number | null
          nil_notes: string | null
          nil_score: number | null
          social_following: number | null
          state_eligibility: string | null
          updated_at: string | null
        }
        Insert: {
          active_deals?: number | null
          athlete_id?: string | null
          brand_readiness?: number | null
          created_at?: string | null
          estimated_value_mo?: number | null
          id?: string
          media_presence?: number | null
          nil_notes?: string | null
          nil_score?: number | null
          social_following?: number | null
          state_eligibility?: string | null
          updated_at?: string | null
        }
        Update: {
          active_deals?: number | null
          athlete_id?: string | null
          brand_readiness?: number | null
          created_at?: string | null
          estimated_value_mo?: number | null
          id?: string
          media_presence?: number | null
          nil_notes?: string | null
          nil_score?: number | null
          social_following?: number | null
          state_eligibility?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nil_profiles_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nil_profiles_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nil_profiles_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          license_tier: string
          name: string
          stripe_customer_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id: string
          license_tier?: string
          name: string
          stripe_customer_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          license_tier?: string
          name?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      parent_athlete_links: {
        Row: {
          athlete_id: string | null
          id: string
          linked_at: string | null
          parent_user_id: string | null
        }
        Insert: {
          athlete_id?: string | null
          id?: string
          linked_at?: string | null
          parent_user_id?: string | null
        }
        Update: {
          athlete_id?: string | null
          id?: string
          linked_at?: string | null
          parent_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_athlete_links_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_athlete_links_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_athlete_links_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_intel: {
        Row: {
          agent_prompt: string | null
          built_at: string | null
          id: string
          intel_doc: string | null
          persona_key: string
          persona_name: string
          pushed_to_hu_os: boolean | null
          research_raw: string | null
          user_id: string | null
        }
        Insert: {
          agent_prompt?: string | null
          built_at?: string | null
          id?: string
          intel_doc?: string | null
          persona_key: string
          persona_name: string
          pushed_to_hu_os?: boolean | null
          research_raw?: string | null
          user_id?: string | null
        }
        Update: {
          agent_prompt?: string | null
          built_at?: string | null
          id?: string
          intel_doc?: string | null
          persona_key?: string
          persona_name?: string
          pushed_to_hu_os?: boolean | null
          research_raw?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      programs: {
        Row: {
          classification: string | null
          created_at: string
          head_coach_user_id: string | null
          id: string
          is_demo: boolean
          is_historical: boolean
          name: string
          school: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_tier: string
          uil_district: string | null
          updated_at: string
        }
        Insert: {
          classification?: string | null
          created_at?: string
          head_coach_user_id?: string | null
          id?: string
          is_demo?: boolean
          is_historical?: boolean
          name: string
          school?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_tier?: string
          uil_district?: string | null
          updated_at?: string
        }
        Update: {
          classification?: string | null
          created_at?: string
          head_coach_user_id?: string | null
          id?: string
          is_demo?: boolean
          is_historical?: boolean
          name?: string
          school?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_tier?: string
          uil_district?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prospect_ledger: {
        Row: {
          authority_loop_status: Database["public"]["Enums"]["authority_loop_status"]
          college_commitment: string | null
          completed_quests: string[]
          created_at: string
          deficiency_flags: string[]
          graduation_year: number | null
          height: string | null
          high_school: string
          id: string
          injury_status: boolean
          is_verified: boolean
          last_neural_audit: string | null
          neck_down_metrics: Json
          neck_up_markers: Json
          ner: number | null
          neural_market_position: Database["public"]["Enums"]["neural_market_position"]
          ovr: number | null
          player_name: string
          position: string | null
          pro_score: number | null
          status: Database["public"]["Enums"]["athlete_status"]
          updated_at: string
          verification_source: string
          weight_lbs: number | null
          xp_total: number
        }
        Insert: {
          authority_loop_status?: Database["public"]["Enums"]["authority_loop_status"]
          college_commitment?: string | null
          completed_quests?: string[]
          created_at?: string
          deficiency_flags?: string[]
          graduation_year?: number | null
          height?: string | null
          high_school: string
          id?: string
          injury_status?: boolean
          is_verified?: boolean
          last_neural_audit?: string | null
          neck_down_metrics?: Json
          neck_up_markers?: Json
          ner?: number | null
          neural_market_position?: Database["public"]["Enums"]["neural_market_position"]
          ovr?: number | null
          player_name: string
          position?: string | null
          pro_score?: number | null
          status?: Database["public"]["Enums"]["athlete_status"]
          updated_at?: string
          verification_source: string
          weight_lbs?: number | null
          xp_total?: number
        }
        Update: {
          authority_loop_status?: Database["public"]["Enums"]["authority_loop_status"]
          college_commitment?: string | null
          completed_quests?: string[]
          created_at?: string
          deficiency_flags?: string[]
          graduation_year?: number | null
          height?: string | null
          high_school?: string
          id?: string
          injury_status?: boolean
          is_verified?: boolean
          last_neural_audit?: string | null
          neck_down_metrics?: Json
          neck_up_markers?: Json
          ner?: number | null
          neural_market_position?: Database["public"]["Enums"]["neural_market_position"]
          ovr?: number | null
          player_name?: string
          position?: string | null
          pro_score?: number | null
          status?: Database["public"]["Enums"]["athlete_status"]
          updated_at?: string
          verification_source?: string
          weight_lbs?: number | null
          xp_total?: number
        }
        Relationships: []
      }
      quest_evidence: {
        Row: {
          athlete_id: string | null
          content: string
          created_at: string | null
          evidence_type: string | null
          id: string
          quest_id: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          athlete_id?: string | null
          content: string
          created_at?: string | null
          evidence_type?: string | null
          id?: string
          quest_id?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          athlete_id?: string | null
          content?: string
          created_at?: string | null
          evidence_type?: string | null
          id?: string
          quest_id?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_evidence_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_evidence_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_evidence_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_evidence_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_evidence_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          athlete_id: string | null
          auto_generated: boolean | null
          career_pathway: string | null
          completed_at: string | null
          created_at: string | null
          engine_version: string | null
          id: string
          neck_up_metric: string
          quest_title: string
          scenario_text: string
          status: string | null
          xp_reward: number
        }
        Insert: {
          athlete_id?: string | null
          auto_generated?: boolean | null
          career_pathway?: string | null
          completed_at?: string | null
          created_at?: string | null
          engine_version?: string | null
          id?: string
          neck_up_metric: string
          quest_title: string
          scenario_text: string
          status?: string | null
          xp_reward?: number
        }
        Update: {
          athlete_id?: string | null
          auto_generated?: boolean | null
          career_pathway?: string | null
          completed_at?: string | null
          created_at?: string | null
          engine_version?: string | null
          id?: string
          neck_up_metric?: string
          quest_title?: string
          scenario_text?: string
          status?: string | null
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quests_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiting_pipeline: {
        Row: {
          athlete_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          scout_user_id: string | null
          stage: string | null
          updated_at: string | null
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          scout_user_id?: string | null
          stage?: string | null
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          scout_user_id?: string | null
          stage?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_pipeline_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_pipeline_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_pipeline_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      rosters: {
        Row: {
          activation_status: string
          added_at: string
          athlete_id: string
          id: string
          operator_id: string
        }
        Insert: {
          activation_status?: string
          added_at?: string
          athlete_id: string
          id?: string
          operator_id: string
        }
        Update: {
          activation_status?: string
          added_at?: string
          athlete_id?: string
          id?: string
          operator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rosters_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rosters_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rosters_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rosters_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      scout_bookmarks: {
        Row: {
          athlete_id: string | null
          created_at: string | null
          id: string
          scout_user_id: string | null
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string | null
          id?: string
          scout_user_id?: string | null
        }
        Update: {
          athlete_id?: string | null
          created_at?: string | null
          id?: string
          scout_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scout_bookmarks_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scout_bookmarks_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scout_bookmarks_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      scout_notes: {
        Row: {
          athlete_id: string | null
          created_at: string | null
          id: string
          note_text: string
          scout_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string | null
          id?: string
          note_text: string
          scout_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string | null
          created_at?: string | null
          id?: string
          note_text?: string
          scout_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scout_notes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scout_notes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scout_notes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      sovereign_escalation_queue: {
        Row: {
          athlete_id: string | null
          audit_log_id: string | null
          confidence_band: string
          conversation_id: string | null
          created_at: string
          document_type: string | null
          draft_response: string
          final_response: string | null
          id: string
          jabari_notes: string | null
          query: string
          reviewed_at: string | null
          risk_flags: string[]
          risk_level: string | null
          risk_score: number | null
          status: string
          tier_reason: string
          user_role: string
        }
        Insert: {
          athlete_id?: string | null
          audit_log_id?: string | null
          confidence_band: string
          conversation_id?: string | null
          created_at?: string
          document_type?: string | null
          draft_response: string
          final_response?: string | null
          id?: string
          jabari_notes?: string | null
          query: string
          reviewed_at?: string | null
          risk_flags?: string[]
          risk_level?: string | null
          risk_score?: number | null
          status?: string
          tier_reason: string
          user_role: string
        }
        Update: {
          athlete_id?: string | null
          audit_log_id?: string | null
          confidence_band?: string
          conversation_id?: string | null
          created_at?: string
          document_type?: string | null
          draft_response?: string
          final_response?: string | null
          id?: string
          jabari_notes?: string | null
          query?: string
          reviewed_at?: string | null
          risk_flags?: string[]
          risk_level?: string | null
          risk_score?: number | null
          status?: string
          tier_reason?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "sovereign_escalation_queue_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sovereign_escalation_queue_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sovereign_escalation_queue_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sovereign_escalation_queue_audit_log_id_fkey"
            columns: ["audit_log_id"]
            isOneToOne: false
            referencedRelation: "neural_audit_log"
            referencedColumns: ["id"]
          },
        ]
      }
      sovereign_profile_views: {
        Row: {
          athlete_id: string | null
          converted: boolean | null
          id: string
          plan_selected: string | null
          viewed_at: string | null
          viewer_email: string | null
        }
        Insert: {
          athlete_id?: string | null
          converted?: boolean | null
          id?: string
          plan_selected?: string | null
          viewed_at?: string | null
          viewer_email?: string | null
        }
        Update: {
          athlete_id?: string | null
          converted?: boolean | null
          id?: string
          plan_selected?: string | null
          viewed_at?: string | null
          viewer_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sovereign_profile_views_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sovereign_profile_views_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "scout_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sovereign_profile_views_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "self_awareness_report"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          id: string
          plan: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_sub_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_sub_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_sub_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          role: string
          user_id: string
        }
        Update: {
          granted_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      vgm_activation_locks: {
        Row: {
          athlete_id: string
          created_at: string
          credits_consumed: number
          exclusive_expires_at: string | null
          id: string
          lock_state: string
          operator_id: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          credits_consumed?: number
          exclusive_expires_at?: string | null
          id?: string
          lock_state?: string
          operator_id: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          credits_consumed?: number
          exclusive_expires_at?: string | null
          id?: string
          lock_state?: string
          operator_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vgm_activation_locks_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "vgm_operator_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      vgm_matchmaking_log: {
        Row: {
          created_at: string
          gm_recommendation: string | null
          id: string
          open_need: string | null
          operator_id: string
          query_mode: string
          response_payload: Json | null
          result_count: number
          subject_athlete_id: string | null
          subject_program_id: string | null
          top_fit_score: number | null
          top_result_name: string | null
        }
        Insert: {
          created_at?: string
          gm_recommendation?: string | null
          id?: string
          open_need?: string | null
          operator_id: string
          query_mode: string
          response_payload?: Json | null
          result_count?: number
          subject_athlete_id?: string | null
          subject_program_id?: string | null
          top_fit_score?: number | null
          top_result_name?: string | null
        }
        Update: {
          created_at?: string
          gm_recommendation?: string | null
          id?: string
          open_need?: string | null
          operator_id?: string
          query_mode?: string
          response_payload?: Json | null
          result_count?: number
          subject_athlete_id?: string | null
          subject_program_id?: string | null
          top_fit_score?: number | null
          top_result_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vgm_matchmaking_log_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "vgm_operator_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      vgm_operator_licenses: {
        Row: {
          contact_email: string
          contact_name: string
          created_at: string
          custom_brand_logo: string | null
          custom_brand_name: string | null
          data_confidentiality_accepted: boolean
          id: string
          is_active: boolean
          notes: string | null
          organization_name: string
          seat_count: number
          term_end: string
          term_start: string
          tier: string
          unlock_credits_total: number
          unlock_credits_used: number
          updated_at: string
        }
        Insert: {
          contact_email: string
          contact_name: string
          created_at?: string
          custom_brand_logo?: string | null
          custom_brand_name?: string | null
          data_confidentiality_accepted?: boolean
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_name: string
          seat_count: number
          term_end: string
          term_start: string
          tier: string
          unlock_credits_total?: number
          unlock_credits_used?: number
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_name?: string
          created_at?: string
          custom_brand_logo?: string | null
          custom_brand_name?: string | null
          data_confidentiality_accepted?: boolean
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_name?: string
          seat_count?: number
          term_end?: string
          term_start?: string
          tier?: string
          unlock_credits_total?: number
          unlock_credits_used?: number
          updated_at?: string
        }
        Relationships: []
      }
      vgm_programs: {
        Row: {
          competition_level: string
          conference: string | null
          created_at: string
          culture_signals: Json
          current_record_l: number
          current_record_w: number
          custom_brand_logo: string | null
          custom_brand_name: string | null
          head_coach: string
          id: string
          primary_system: string
          program_name: string
          roster_gaps: Json
          season_year: number
          updated_at: string
        }
        Insert: {
          competition_level: string
          conference?: string | null
          created_at?: string
          culture_signals?: Json
          current_record_l?: number
          current_record_w?: number
          custom_brand_logo?: string | null
          custom_brand_name?: string | null
          head_coach: string
          id?: string
          primary_system: string
          program_name: string
          roster_gaps?: Json
          season_year: number
          updated_at?: string
        }
        Update: {
          competition_level?: string
          conference?: string | null
          created_at?: string
          culture_signals?: Json
          current_record_l?: number
          current_record_w?: number
          custom_brand_logo?: string | null
          custom_brand_name?: string | null
          head_coach?: string
          id?: string
          primary_system?: string
          program_name?: string
          roster_gaps?: Json
          season_year?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      coach_intelligence_summary: {
        Row: {
          conversion_rate_pct: number | null
          division: string | null
          institution: string | null
          last_activity: string | null
          paid_conversions: number | null
          total_views: number | null
          unique_athletes_viewed: number | null
        }
        Relationships: []
      }
      scout_ledger: {
        Row: {
          audit_ready: boolean | null
          authority_loop_status: string | null
          confidence_band: string | null
          entry_source: string | null
          entry_status: string | null
          event_context: string | null
          founder_notes: string | null
          full_name: string | null
          graduation_year: number | null
          has_self_report: boolean | null
          id: string | null
          intel_timestamp: string | null
          leadership_identity: string | null
          llm_analysis: string | null
          location_city: string | null
          location_state: string | null
          locus_of_control: string | null
          market_position: string | null
          neck_down_metrics: Json | null
          neck_up_coachability: number | null
          neck_up_cognitive_stability: number | null
          neck_up_culture_equity: number | null
          neck_up_defense: number | null
          neck_up_markers: Json | null
          neck_up_ner: number | null
          neck_up_physical_output: number | null
          neck_up_playmaking: number | null
          neck_up_pro_score: number | null
          neck_up_resilience: number | null
          ovr: number | null
          placement_interest: string | null
          position: string | null
          quest_count: number | null
          questions_answered: number | null
          questions_total: number | null
          school: string | null
          secondary_tags: string[] | null
          self_awareness_score: number | null
          sovereign_verified: boolean | null
          verification_source: string | null
        }
        Insert: {
          audit_ready?: never
          authority_loop_status?: string | null
          confidence_band?: string | null
          entry_source?: string | null
          entry_status?: string | null
          event_context?: string | null
          founder_notes?: string | null
          full_name?: string | null
          graduation_year?: number | null
          has_self_report?: never
          id?: string | null
          intel_timestamp?: string | null
          leadership_identity?: string | null
          llm_analysis?: string | null
          location_city?: string | null
          location_state?: string | null
          locus_of_control?: string | null
          market_position?: string | null
          neck_down_metrics?: Json | null
          neck_up_coachability?: number | null
          neck_up_cognitive_stability?: number | null
          neck_up_culture_equity?: number | null
          neck_up_defense?: number | null
          neck_up_markers?: Json | null
          neck_up_ner?: number | null
          neck_up_physical_output?: number | null
          neck_up_playmaking?: number | null
          neck_up_pro_score?: number | null
          neck_up_resilience?: number | null
          ovr?: number | null
          placement_interest?: string | null
          position?: string | null
          quest_count?: never
          questions_answered?: number | null
          questions_total?: number | null
          school?: string | null
          secondary_tags?: string[] | null
          self_awareness_score?: number | null
          sovereign_verified?: boolean | null
          verification_source?: string | null
        }
        Update: {
          audit_ready?: never
          authority_loop_status?: string | null
          confidence_band?: string | null
          entry_source?: string | null
          entry_status?: string | null
          event_context?: string | null
          founder_notes?: string | null
          full_name?: string | null
          graduation_year?: number | null
          has_self_report?: never
          id?: string | null
          intel_timestamp?: string | null
          leadership_identity?: string | null
          llm_analysis?: string | null
          location_city?: string | null
          location_state?: string | null
          locus_of_control?: string | null
          market_position?: string | null
          neck_down_metrics?: Json | null
          neck_up_coachability?: number | null
          neck_up_cognitive_stability?: number | null
          neck_up_culture_equity?: number | null
          neck_up_defense?: number | null
          neck_up_markers?: Json | null
          neck_up_ner?: number | null
          neck_up_physical_output?: number | null
          neck_up_playmaking?: number | null
          neck_up_pro_score?: number | null
          neck_up_resilience?: number | null
          ovr?: number | null
          placement_interest?: string | null
          position?: string | null
          quest_count?: never
          questions_answered?: number | null
          questions_total?: number | null
          school?: string | null
          secondary_tags?: string[] | null
          self_awareness_score?: number | null
          sovereign_verified?: boolean | null
          verification_source?: string | null
        }
        Relationships: []
      }
      self_awareness_report: {
        Row: {
          authenticity_score: number | null
          full_name: string | null
          gap_coachability: number | null
          gap_culture: number | null
          gap_resilience: number | null
          id: string | null
          key_quote: string | null
          leadership_identity: string | null
          llm_narrative: string | null
          locus_of_control: string | null
          neck_up_coachability: number | null
          neck_up_cognitive_stability: number | null
          neck_up_culture_equity: number | null
          neck_up_defense: number | null
          neck_up_physical_output: number | null
          neck_up_playmaking: number | null
          neck_up_resilience: number | null
          self_awareness_score: number | null
          self_report_at: string | null
          sr_coachability: number | null
          sr_culture_equity: number | null
          sr_defense: number | null
          sr_physical: number | null
          sr_playmaking: number | null
          sr_resilience: number | null
        }
        Insert: {
          authenticity_score?: number | null
          full_name?: string | null
          gap_coachability?: never
          gap_culture?: never
          gap_resilience?: never
          id?: string | null
          key_quote?: string | null
          leadership_identity?: string | null
          llm_narrative?: never
          locus_of_control?: string | null
          neck_up_coachability?: number | null
          neck_up_cognitive_stability?: number | null
          neck_up_culture_equity?: number | null
          neck_up_defense?: number | null
          neck_up_physical_output?: number | null
          neck_up_playmaking?: number | null
          neck_up_resilience?: number | null
          self_awareness_score?: number | null
          self_report_at?: string | null
          sr_coachability?: never
          sr_culture_equity?: never
          sr_defense?: never
          sr_physical?: never
          sr_playmaking?: never
          sr_resilience?: never
        }
        Update: {
          authenticity_score?: number | null
          full_name?: string | null
          gap_coachability?: never
          gap_culture?: never
          gap_resilience?: never
          id?: string | null
          key_quote?: string | null
          leadership_identity?: string | null
          llm_narrative?: never
          locus_of_control?: string | null
          neck_up_coachability?: number | null
          neck_up_cognitive_stability?: number | null
          neck_up_culture_equity?: number | null
          neck_up_defense?: number | null
          neck_up_physical_output?: number | null
          neck_up_playmaking?: number | null
          neck_up_resilience?: number | null
          self_awareness_score?: number | null
          self_report_at?: string | null
          sr_coachability?: never
          sr_culture_equity?: never
          sr_defense?: never
          sr_physical?: never
          sr_playmaking?: never
          sr_resilience?: never
        }
        Relationships: []
      }
    }
    Functions: {
      compute_cog_stability_modifier: {
        Args: { cog_score: number }
        Returns: number
      }
      compute_confidence_band: {
        Args: { answered: number; total: number }
        Returns: string
      }
      has_role: { Args: { target_role: string }; Returns: boolean }
      hu_access_role: { Args: never; Returns: string }
      hu_os_demo_onboard: {
        Args: { p_profile: Json; p_write_key: string }
        Returns: Json
      }
      is_super_admin: { Args: never; Returns: boolean }
      merge_sport_specific_metrics: {
        Args: { p_athlete_id: string; p_metrics: Json }
        Returns: undefined
      }
    }
    Enums: {
      access_role:
        | "public"
        | "athlete"
        | "tactical"
        | "pro_level"
        | "scout"
        | "admin"
      athlete_status:
        | "unsigned_senior"
        | "unsigned_underclassman"
        | "committed"
        | "signed"
        | "enrolled"
        | "transfer_portal"
        | "pro"
        | "inactive"
      authority_loop_status: "open" | "locked"
      neural_market_position: "developmental" | "tactical" | "pro_level"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_role: [
        "public",
        "athlete",
        "tactical",
        "pro_level",
        "scout",
        "admin",
      ],
      athlete_status: [
        "unsigned_senior",
        "unsigned_underclassman",
        "committed",
        "signed",
        "enrolled",
        "transfer_portal",
        "pro",
        "inactive",
      ],
      authority_loop_status: ["open", "locked"],
      neural_market_position: ["developmental", "tactical", "pro_level"],
    },
  },
} as const

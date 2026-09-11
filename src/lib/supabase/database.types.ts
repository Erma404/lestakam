/**
 * Description des tables de la base, telle que définie dans
 * `supabase/01-structure.sql`. Elle permet de repérer une faute de frappe
 * sur un nom de colonne avant même de lancer l'application.
 */

export type MemberRow = {
  id: string;
  household_id: string;
  user_id: string | null;
  first_name: string;
  role: "parent" | "enfant";
  avatar_emoji: string;
  photo_url: string | null;
  accent: "sky" | "rose" | "sage" | "terracotta" | "lilac" | "sun";
  warmth_preference: "frileux" | "normal" | "chaud";
  birth_year: number | null;
  sort_order: number;
  created_at: string;
};

export type EventRow = {
  id: string;
  household_id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  category: "activite" | "ecole" | "sante" | "travail" | "famille" | "repas" | "autre";
  member_ids: string[];
  repeats_weekly: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ReminderRow = {
  id: string;
  household_id: string;
  label: string;
  due_date: string | null;
  member_ids: string[];
  done: boolean;
  created_at: string;
};

export type RitualRow = {
  id: string;
  household_id: string;
  member_id: string;
  label: string;
  emoji: string;
  moment: "matin" | "apres-midi" | "soir";
  scheduled_time: string | null;
  stars: number;
  needs_parent_approval: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type RitualStatusRow = {
  id: string;
  household_id: string;
  ritual_id: string;
  status_date: string;
  state: "coche" | "valide";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
};

export type RewardGoalRow = {
  id: string;
  household_id: string;
  member_id: string;
  label: string;
  emoji: string;
  stars_required: number;
  achieved_on: string | null;
  sort_order: number;
  created_at: string;
};

export type HouseholdRow = {
  id: string;
  name: string;
  weather_location_name: string;
  weather_latitude: number;
  weather_longitude: number;
  created_at: string;
};

/** Décrit une table dont on lit, insère et met à jour les lignes. */
type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      households: Table<HouseholdRow>;
      members: Table<MemberRow>;
      events: Table<EventRow>;
      reminders: Table<ReminderRow>;
      rituals: Table<RitualRow>;
      ritual_status: Table<RitualStatusRow>;
      reward_goals: Table<RewardGoalRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

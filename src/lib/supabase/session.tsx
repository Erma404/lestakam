"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "./client";
import { isSupabaseConfigured } from "./config";
import type { MemberRow } from "./database.types";

export interface SessionState {
  /** Faux tant que la base de données partagée n'est pas configurée. */
  configured: boolean;
  loading: boolean;
  session: Session | null;
  /** Le membre de la famille correspondant à la personne connectée. */
  member: MemberRow | null;
  /** Tous les membres du foyer. */
  members: MemberRow[];
  householdId: string | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadMembers = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("sort_order", { ascending: true });

    setMembers(error ? [] : ((data ?? []) as MemberRow[]));
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    // Sans base configurée, `loading` vaut déjà faux : rien à attendre.
    if (!supabase) return;

    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await loadMembers();
      if (active) setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, next) => {
      if (!active) return;
      setSession(next);
      if (next) {
        await loadMembers();
      } else {
        setMembers([]);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadMembers]);

  const signOut = useCallback(async () => {
    await getSupabaseClient()?.auth.signOut();
    setSession(null);
    setMembers([]);
  }, []);

  const value = useMemo<SessionState>(() => {
    const member = session
      ? (members.find((row) => row.user_id === session.user.id) ?? null)
      : null;

    return {
      configured: isSupabaseConfigured,
      loading,
      session,
      member,
      members,
      householdId: member?.household_id ?? members[0]?.household_id ?? null,
      signOut,
      refresh: loadMembers,
    };
  }, [session, members, loading, signOut, loadMembers]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession doit être utilisé à l'intérieur de SessionProvider.");
  }
  return context;
}

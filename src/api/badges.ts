import { supabase } from './supabase';
import type { Badge } from '../lib/impact';

/** G5.4 badge catalog (seeded in supabase/seed.sql), lowest threshold first within each type. */
export async function listBadges(): Promise<Badge[]> {
  const { data, error } = await supabase.from('badges').select('id, type, threshold').order('type', { ascending: false }).order('threshold');
  if (error) throw error;
  return (data as { id: string; type: Badge['type']; threshold: number | string }[]).map((b) => ({
    id: b.id,
    type: b.type,
    threshold: Number(b.threshold),
  }));
}

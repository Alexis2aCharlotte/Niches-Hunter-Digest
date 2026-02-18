import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
    }
    
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

// ===========================================
// TYPES
// ===========================================

export interface Newsletter {
  id: string;
  content: string;
  title: string;
  run_date: string;
  created_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

// ===========================================
// SUBSCRIBERS TABLE (configurable via env)
// ⚠️  Currently set to TEST table
// ===========================================

/**
 * Get the subscribers table name from env
 * Default: newsletter_subscribers_test (TEST MODE)
 * Production: newsletter_subscribers
 */
function getSubscribersTable(): string {
  return process.env.SUBSCRIBERS_TABLE || 'newsletter_subscribers_test';
}

// ===========================================
// NEWSLETTER FUNCTIONS
// ===========================================

/**
 * Get recent newsletters from the database
 * Fetches the last N newsletters from newsletters_v2 (ordered by most recent)
 */
export async function getRecentNewsletters(limit: number = 3): Promise<Newsletter[]> {
  console.log(`   🔍 Fetching last ${limit} newsletters from newsletters_v2...`);
  
  const { data, error } = await getSupabase()
    .from('newsletters_v2')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent newsletters:', error);
    throw error;
  }

  console.log(`   ✅ Found ${data?.length || 0} newsletters`);
  return data || [];
}

// ===========================================
// SUBSCRIBERS FUNCTIONS
// ===========================================

/**
 * Get all active subscribers with pagination to bypass Supabase's 1000-row default limit.
 * Fetches in batches of 1000 until all subscribers are retrieved.
 * ⚠️  Uses SUBSCRIBERS_TABLE env var (test or production)
 */
export async function getActiveSubscribers(): Promise<Subscriber[]> {
  const tableName = getSubscribersTable();
  const PAGE_SIZE = 1000;
  
  console.log(`   📋 Using subscribers table: ${tableName}`);
  
  const allSubscribers: Subscriber[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await getSupabase()
      .from(tableName)
      .select('*')
      .eq('status', 'subscribed')
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching subscribers:', error);
      throw error;
    }

    const batch = data || [];
    allSubscribers.push(...batch);

    if (batch.length < PAGE_SIZE) {
      hasMore = false;
    } else {
      from += PAGE_SIZE;
      console.log(`   📋 Fetched ${allSubscribers.length} subscribers so far, loading more...`);
    }
  }

  console.log(`   ✅ Found ${allSubscribers.length} active subscribers (total)`);
  return allSubscribers;
}

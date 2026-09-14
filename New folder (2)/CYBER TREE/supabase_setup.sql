-- Supabase Configuration Setup
-- Run these queries in the Supabase Dashboard SQL Editor to configure Row Level Security (RLS)
-- and add the required database RPC functions for the Next.js frontend dashboard.

-- 1. Configure Row Level Security (RLS)
-- Enable RLS to secure sensitive operational tables while allowing read-only access to threat-intel graphs.
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS nodes_public_select ON nodes;
DROP POLICY IF EXISTS relationships_public_select ON relationships;
DROP POLICY IF EXISTS sources_public_select ON sources;
DROP POLICY IF EXISTS trends_public_select ON trends;
DROP POLICY IF EXISTS learning_metrics_public_select ON learning_metrics;
DROP POLICY IF EXISTS job_logs_admin_all ON job_logs;
DROP POLICY IF EXISTS raw_sources_admin_all ON raw_sources;
DROP POLICY IF EXISTS predictions_admin_all ON predictions;
DROP POLICY IF EXISTS sources_admin_all ON sources;

-- Public SELECT policies (allow anonymous read access to the threat intel corpus)
CREATE POLICY nodes_public_select ON nodes FOR SELECT TO public USING (true);
CREATE POLICY relationships_public_select ON relationships FOR SELECT TO public USING (true);
CREATE POLICY trends_public_select ON trends FOR SELECT TO public USING (true);
CREATE POLICY learning_metrics_public_select ON learning_metrics FOR SELECT TO public USING (true);

-- Restricted operational policies (only authenticated admins or service role can read/write logs, sources, and predictions)
CREATE POLICY job_logs_admin_all ON job_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY raw_sources_admin_all ON raw_sources FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY predictions_admin_all ON predictions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY sources_admin_all ON sources FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 2. Create RPC Function: count_nodes_by_type
-- Used on the dashboard page to get node counts grouped by type.
CREATE OR REPLACE FUNCTION count_nodes_by_type()
RETURNS TABLE (type TEXT, count BIGINT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT node_type AS type, COUNT(*)::BIGINT AS count
    FROM nodes
    GROUP BY node_type;
END;
$$;

-- 3. Create RPC Function: match_nodes
-- Used for semantic vector similarity search using pgvector.
-- Updated in Phase 3 to support 384-dimensional embeddings (sentence-transformers).
DROP FUNCTION IF EXISTS match_nodes(vector, float, int, text);
DROP FUNCTION IF EXISTS match_nodes(vector(1536), float, int, text);
DROP FUNCTION IF EXISTS match_nodes(vector(384), float, int, text);

CREATE OR REPLACE FUNCTION match_nodes (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_type text DEFAULT 'all'
)
RETURNS TABLE (
  id UUID,
  node_type TEXT,
  title TEXT,
  summary TEXT,
  content TEXT,
  tags TEXT[],
  confidence FLOAT,
  source_url TEXT,
  source_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  external_id TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    nodes.id,
    nodes.node_type,
    nodes.title,
    nodes.summary,
    nodes.content,
    nodes.tags,
    nodes.confidence,
    nodes.source_url,
    nodes.source_name,
    nodes.created_at,
    nodes.updated_at,
    nodes.external_id,
    nodes.metadata,
    1 - (nodes.embedding <=> query_embedding) AS similarity
  FROM nodes
  WHERE (filter_type = 'all' OR nodes.node_type = filter_type)
    AND nodes.embedding IS NOT NULL
    AND 1 - (nodes.embedding <=> query_embedding) > match_threshold
  ORDER BY nodes.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Phase 2: Full-Text Search Migration
-- Create a generated column and GIN index for combined title and summary searches.
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS title_summary_fts tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))
) STORED;

CREATE INDEX IF NOT EXISTS idx_nodes_title_summary_fts ON nodes USING gin(title_summary_fts);

-- 5. RPC Function: update_node_metadata_batch
-- Performs high-performance batch updates to node metadata JSON values
CREATE OR REPLACE FUNCTION update_node_metadata_batch(updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE nodes n
  SET metadata = u.metadata
  FROM (
    SELECT (elem->>'id')::uuid AS id, (elem->'metadata') AS metadata
    FROM jsonb_array_elements(updates) AS elem
  ) u
  WHERE n.id = u.id;
END;
$$;


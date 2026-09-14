-- CYBER TREE Database Schema Migration
-- Enables vector extension for semantic similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- TABLE: raw_sources (Store all raw crawled datasets before processing)
CREATE TABLE IF NOT EXISTS raw_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url TEXT NOT NULL,
    source_name TEXT NOT NULL,
    raw_content TEXT,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    processed BOOLEAN DEFAULT false,
    processing_error TEXT,
    checksum TEXT UNIQUE -- prevents duplicate collections
);

-- TABLE: nodes (Structured cybersecurity knowledge entities)
CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_type TEXT NOT NULL, -- threat_actor | incident | vulnerability | malware | technique | tool | defense | technology | weakness | research | news
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    tags TEXT[],
    confidence FLOAT DEFAULT 0.5,
    source_url TEXT,
    source_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    embedding vector(384), -- for semantic search (sentence-transformers all-MiniLM-L6-v2 384-dim)
    external_id TEXT, -- CVE-XXXX-XXXX, T1234, etc.
    metadata JSONB
);

-- TABLE: relationships (Connections between nodes)
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    to_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL, -- USED | TARGETED | EXPLOITED | RELATED_TO | SIMILAR_TO | MITIGATED_BY | OBSERVED_IN
    confidence FLOAT DEFAULT 0.5,
    evidence TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABLE: sources (Source registry with reliability scores)
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    category TEXT, -- blog | advisory | research | feed | database
    reliability FLOAT DEFAULT 0.5,
    total_articles INT DEFAULT 0,
    last_checked TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT
);

-- TABLE: predictions (Hypotheses and validation tracking)
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    hypothesis TEXT NOT NULL,
    related_nodes UUID[],
    confidence FLOAT DEFAULT 0.5,
    status TEXT DEFAULT 'pending', -- pending | partial | confirmed | disproven
    evidence_for TEXT[],
    evidence_against TEXT[],
    technology_context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- TABLE: job_logs (Tracks all background cron job executions)
CREATE TABLE IF NOT EXISTS job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    finished_at TIMESTAMP WITH TIME ZONE,
    status TEXT, -- success | failed | partial
    rows_collected INT DEFAULT 0,
    rows_processed INT DEFAULT 0,
    error_message TEXT,
    notes TEXT
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_raw_sources_checksum ON raw_sources(checksum);
CREATE INDEX IF NOT EXISTS idx_raw_sources_processed ON raw_sources(processed) WHERE processed = false;

CREATE INDEX IF NOT EXISTS idx_nodes_node_type ON nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_nodes_external_id ON nodes(external_id);
CREATE INDEX IF NOT EXISTS idx_nodes_title ON nodes USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_nodes_summary ON nodes USING gin(to_tsvector('english', summary));

CREATE INDEX IF NOT EXISTS idx_relationships_from ON relationships(from_node_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON relationships(to_node_id);
CREATE INDEX IF NOT EXISTS idx_relationships_pair ON relationships(from_node_id, to_node_id);

CREATE INDEX IF NOT EXISTS idx_sources_url ON sources(url);
CREATE INDEX IF NOT EXISTS idx_job_logs_name_date ON job_logs(job_name, started_at DESC);

-- TABLE: trends (Discovered clusters and WoW growth metrics)
CREATE TABLE IF NOT EXISTS trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type TEXT NOT NULL,  -- cluster | trend | summary
    description TEXT NOT NULL,
    supporting_nodes UUID[],
    confidence FLOAT DEFAULT 0.5,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_trends_pattern_type ON trends(pattern_type);
CREATE INDEX IF NOT EXISTS idx_trends_detected_at ON trends(detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);

-- TABLE: learning_metrics (Tracks model accuracy, retraining, and pattern confirmations)
CREATE TABLE IF NOT EXISTS learning_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL,
    value FLOAT NOT NULL,
    context JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_learning_metrics_type_date ON learning_metrics(metric_type, recorded_at DESC);



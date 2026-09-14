import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const useSupabase = !!(supabaseUrl && supabaseAnonKey);

let supabase: any = null;
let sqliteDb: any = null;

if (useSupabase) {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!);
} else {
  try {
    const { DatabaseSync } = require('node:sqlite');
    const path = require('path');
    // The DB file is located in the root Next.js app directory
    const dbPath = path.resolve(process.cwd(), './cyber_tree_local.db');
    sqliteDb = new DatabaseSync(dbPath);
    console.log(`Frontend DB connected locally to SQLite at ${dbPath}`);
  } catch (err) {
    console.error('Failed to load local database:', err);
  }
}

// 1. Dashboard statistics
export async function getDashboardStats() {
  if (useSupabase) {
    const { count: nodeCount } = await supabase.from('nodes').select('*', { count: 'exact', head: true }).or("metadata->>archived_reason.is.null,metadata->>archived_reason.neq.synthetic-mock-data-phase13-removal");
    const { count: relCount } = await supabase.from('relationships').select('*', { count: 'exact', head: true });
    
    // Nodes last 24h
    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: newNodesCount } = await supabase.from('nodes').select('*', { count: 'exact', head: true }).gt('created_at', past24h).or("metadata->>archived_reason.is.null,metadata->>archived_reason.neq.synthetic-mock-data-phase13-removal");
    
    // Type distributions
    const { data: nodesGrouped } = await supabase.rpc('count_nodes_by_type'); // User needs to define this if they use Supabase, or we fallback
    
    // Last job runs
    const { data: jobs } = await supabase.from('job_logs').select('*').order('started_at', { ascending: false }).limit(150);
    
    // Top 5 most connected nodes (represented by relationships)
    // In Supabase, this can be retrieved via custom RPC or complex select. Fallback to sample for now
    const { data: topNodes } = await supabase.from('nodes').select('id, title, node_type').or("metadata->>archived_reason.is.null,metadata->>archived_reason.neq.synthetic-mock-data-phase13-removal").limit(5); 

    // Recent 10 nodes
    const { data: recentNodes } = await supabase.from('nodes').select('id, title, node_type, created_at, source_name').or("metadata->>archived_reason.is.null,metadata->>archived_reason.neq.synthetic-mock-data-phase13-removal").order('created_at', { ascending: false }).limit(10);

    return {
      nodeCount: nodeCount || 0,
      relationshipCount: relCount || 0,
      newNodesCount: newNodesCount || 0,
      recentNodes: recentNodes || [],
      recentJobs: jobs || [],
      typeDistribution: nodesGrouped || [],
      topNodes: topNodes || []
    };
  } else {
    if (!sqliteDb) {
      return { nodeCount: 0, relationshipCount: 0, newNodesCount: 0, recentNodes: [], recentJobs: [], typeDistribution: [], topNodes: [] };
    }
    
    // Nodes total
    const nodeCount = sqliteDb.prepare("SELECT COUNT(*) as count FROM nodes WHERE JSON_EXTRACT(metadata, '$.archived_reason') IS NULL OR JSON_EXTRACT(metadata, '$.archived_reason') != 'synthetic-mock-data-phase13-removal'").get().count;
    // Relationships total
    const relCount = sqliteDb.prepare("SELECT COUNT(*) as count FROM relationships").get().count;
    
    // Nodes last 24h
    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const newNodesCount = sqliteDb.prepare("SELECT COUNT(*) as count FROM nodes WHERE created_at > ? AND (JSON_EXTRACT(metadata, '$.archived_reason') IS NULL OR JSON_EXTRACT(metadata, '$.archived_reason') != 'synthetic-mock-data-phase13-removal')").get(past24h).count;
    
    // Recent 10 nodes
    const recentNodes = sqliteDb.prepare("SELECT id, title, node_type, created_at, source_name FROM nodes WHERE (JSON_EXTRACT(metadata, '$.archived_reason') IS NULL OR JSON_EXTRACT(metadata, '$.archived_reason') != 'synthetic-mock-data-phase13-removal') ORDER BY created_at DESC LIMIT 10").all();
    
    // Last job runs
    const recentJobs = sqliteDb.prepare("SELECT * FROM job_logs ORDER BY started_at DESC LIMIT 150").all();
    
    // Node type distributions
    const typeDistribution = sqliteDb.prepare("SELECT node_type as type, COUNT(*) as count FROM nodes WHERE (JSON_EXTRACT(metadata, '$.archived_reason') IS NULL OR JSON_EXTRACT(metadata, '$.archived_reason') != 'synthetic-mock-data-phase13-removal') GROUP BY node_type").all();
    
    // Top 5 most-connected nodes
    const topNodesQuery = `
      SELECT n.id, n.title, n.node_type, COUNT(r.id) as connections
      FROM nodes n
      LEFT JOIN relationships r ON (n.id = r.from_node_id OR n.id = r.to_node_id)
      GROUP BY n.id
      ORDER BY connections DESC
      LIMIT 5
    `;
    const topNodes = sqliteDb.prepare(topNodesQuery).all();
    
    return {
      nodeCount,
      relationshipCount: relCount,
      newNodesCount,
      recentNodes: recentNodes.map((n: any) => ({ ...n })),
      recentJobs: recentJobs.map((j: any) => ({ ...j })),
      typeDistribution,
      topNodes: topNodes.map((t: any) => ({ ...t }))
    };
  }
}

// 2. Search nodes
export async function queryNodes(options: {
  type?: string;
  search?: string;
  limit?: number;
  offset?: number;
  tag?: string;
  semantic?: boolean;
  embeddingVector?: number[];
  threshold?: number;
}) {
  const limit = options.limit || 25;
  const offset = options.offset || 0;
  
  if (useSupabase) {
    if (options.semantic && options.embeddingVector) {
      // Supabase RPC for semantic matching with optional type filter
      const threshold = options.threshold ?? 0.5;
      const { data: rawData, error } = await supabase.rpc('match_nodes', {
        query_embedding: options.embeddingVector,
        match_threshold: threshold,
        match_count: limit,
        filter_type: options.type && options.type !== 'all' ? options.type : 'all'
      });
      if (error) throw error;
      const data = (rawData || []).filter((n: any) => !n.metadata || n.metadata.archived_reason !== 'synthetic-mock-data-phase13-removal');
      return data || [];
    }
    
    let query = supabase.from('nodes').select('*').or("metadata->>archived_reason.is.null,metadata->>archived_reason.neq.synthetic-mock-data-phase13-removal");
    if (options.type && options.type !== 'all') {
      query = query.eq('node_type', options.type);
    }
    if (options.search) {
      // Use full-text search on the generated title_summary_fts column
      query = query.textSearch('title_summary_fts', options.search, {
        config: 'english',
        type: 'websearch'
      });
    }
    if (options.tag) {
      query = query.contains('tags', [options.tag]);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) throw error;
    return data || [];
  } else {
    if (!sqliteDb) return [];
    
    if (options.semantic && options.embeddingVector) {
      // SQLite fallback: retrieve all nodes that have embeddings and compute cosine similarity in JavaScript
      const stmt = sqliteDb.prepare("SELECT id, title, summary, node_type, embedding, tags, source_name, created_at, metadata FROM nodes WHERE embedding IS NOT NULL");
      const rows = stmt.all();
      const queryVec = np_array(options.embeddingVector);
      
      let results = rows.map((r: any) => {
        try {
          const emb = JSON.parse(r.embedding);
          if (!emb) return null;
          const sim = get_cosine_similarity(queryVec, emb);
          return {
            id: r.id,
            title: r.title,
            summary: r.summary,
            node_type: r.node_type,
            source_name: r.source_name,
            created_at: r.created_at,
            similarity: sim,
            tags: JSON.parse(r.tags || '[]'),
            metadata: JSON.parse(r.metadata || '{}')
          };
        } catch {
          return null;
        }
      }).filter((r: any) => r !== null && r.similarity > 0.65 && (!r.metadata || r.metadata.archived_reason !== 'synthetic-mock-data-phase13-removal'));
      
      // Filter by type if requested
      if (options.type && options.type !== 'all') {
        results = results.filter((r: any) => r.node_type === options.type);
      }
      
      // Sort and paginate
      results.sort((a: any, b: any) => b.similarity - a.similarity);
      return results.slice(offset, offset + limit);
    }
    
    let queryStr = "SELECT * FROM nodes";
    const params: any[] = [];
    const conditions: string[] = ["(JSON_EXTRACT(metadata, '$.archived_reason') IS NULL OR JSON_EXTRACT(metadata, '$.archived_reason') != 'synthetic-mock-data-phase13-removal')"];
    
    if (options.type && options.type !== 'all') {
      conditions.push("node_type = ?");
      params.push(options.type);
    }
    if (options.search) {
      conditions.push("(title LIKE ? OR summary LIKE ? OR content LIKE ?)");
      params.push(`%${options.search}%`);
      params.push(`%${options.search}%`);
      params.push(`%${options.search}%`);
    }
    if (options.tag) {
      conditions.push("tags LIKE ?");
      params.push(`%"${options.tag}"%`);
    }
    
    if (conditions.length > 0) {
      queryStr += " WHERE " + conditions.join(" AND ");
    }
    
    queryStr += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit);
    params.push(offset);
    
    const stmt = sqliteDb.prepare(queryStr);
    const rows = stmt.all(...params);
    return rows.map((r: any) => ({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
      metadata: JSON.parse(r.metadata || '{}'),
      embedding: r.embedding ? JSON.parse(r.embedding) : null
    }));
  }
}

// 3. Get node details and its relationships
export async function getNodeDetails(nodeId: string) {
  if (useSupabase) {
    const { data: node } = await supabase.from('nodes').select('*').eq('id', nodeId).single();
    if (!node || (node.metadata && node.metadata.archived_reason === 'synthetic-mock-data-phase13-removal')) return null;
    
    // Fetch relationships along with endpoint node metadata to filter out archived ones
    const { data: rels } = await supabase
      .from('relationships')
      .select('*, from_node:nodes!relationships_from_node_id_fkey(title, node_type, metadata), to_node:nodes!relationships_to_node_id_fkey(title, node_type, metadata)')
      .or(`from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`);
      
    const filteredRels = (rels || []).filter((rel: any) => {
      const fromArchived = rel.from_node?.metadata?.archived_reason === 'synthetic-mock-data-phase13-removal';
      const toArchived = rel.to_node?.metadata?.archived_reason === 'synthetic-mock-data-phase13-removal';
      return !fromArchived && !toArchived;
    });

    return {
      node,
      relationships: filteredRels
    };
  } else {
    if (!sqliteDb) return null;
    
    const nodeRow = sqliteDb.prepare("SELECT * FROM nodes WHERE id = ?").get(nodeId);
    if (!nodeRow) return null;
    
    const node = {
      ...nodeRow,
      tags: JSON.parse(nodeRow.tags || '[]'),
      metadata: JSON.parse(nodeRow.metadata || '{}'),
      embedding: nodeRow.embedding ? JSON.parse(nodeRow.embedding) : null
    };
    if (node.metadata && node.metadata.archived_reason === 'synthetic-mock-data-phase13-removal') return null;
    
    // Fetch relationships along with source and target node titles and metadata
    const relsQuery = `
      SELECT r.*, 
             fn.title as from_title, fn.node_type as from_type, fn.metadata as from_metadata,
             tn.title as to_title, tn.node_type as to_type, tn.metadata as to_metadata
      FROM relationships r
      JOIN nodes fn ON r.from_node_id = fn.id
      JOIN nodes tn ON r.to_node_id = tn.id
      WHERE r.from_node_id = ? OR r.to_node_id = ?
    `;
    const relRows = sqliteDb.prepare(relsQuery).all(nodeId, nodeId);
    
    const relationships = relRows.map((r: any) => {
      const fromMeta = JSON.parse(r.from_metadata || '{}');
      const toMeta = JSON.parse(r.to_metadata || '{}');
      return {
        id: r.id,
        from_node_id: r.from_node_id,
        to_node_id: r.to_node_id,
        relationship: r.relationship,
        confidence: r.confidence,
        evidence: r.evidence,
        created_at: r.created_at,
        from_node: { title: r.from_title, node_type: r.from_type, metadata: fromMeta },
        to_node: { title: r.to_title, node_type: r.to_type, metadata: toMeta }
      };
    }).filter((rel: any) => {
      const fromArchived = rel.from_node?.metadata?.archived_reason === 'synthetic-mock-data-phase13-removal';
      const toArchived = rel.to_node?.metadata?.archived_reason === 'synthetic-mock-data-phase13-removal';
      return !fromArchived && !toArchived;
    });
    
    return {
      node,
      relationships
    };
  }
}

// 4. Incident Timeline
export async function getIncidentTimeline() {
  if (useSupabase) {
    const { data } = await supabase
      .from('nodes')
      .select('id, title, summary, created_at, source_name, tags')
      .eq('node_type', 'incident')
      .or("metadata->>archived_reason.is.null,metadata->>archived_reason.neq.synthetic-mock-data-phase13-removal")
      .order('created_at', { ascending: false })
      .limit(50);
    return data || [];
  } else {
    if (!sqliteDb) return [];
    const rows = sqliteDb.prepare("SELECT id, title, summary, created_at, source_name, tags FROM nodes WHERE node_type = 'incident' AND (JSON_EXTRACT(metadata, '$.archived_reason') IS NULL OR JSON_EXTRACT(metadata, '$.archived_reason') != 'synthetic-mock-data-phase13-removal') ORDER BY created_at DESC LIMIT 50").all();
    return rows.map((r: any) => ({
      ...r,
      tags: JSON.parse(r.tags || '[]')
    }));
  }
}

// 5. Threat Actors profiles
export async function getThreatActors() {
  if (useSupabase) {
    const { data } = await supabase
      .from('nodes')
      .select('id, title, summary, external_id, tags')
      .eq('node_type', 'threat_actor')
      .or("metadata->>archived_reason.is.null,metadata->>archived_reason.neq.synthetic-mock-data-phase13-removal")
      .order('title', { ascending: true })
      .limit(100);
    return data || [];
  } else {
    if (!sqliteDb) return [];
    const rows = sqliteDb.prepare("SELECT id, title, summary, external_id, tags FROM nodes WHERE node_type = 'threat_actor' AND (JSON_EXTRACT(metadata, '$.archived_reason') IS NULL OR JSON_EXTRACT(metadata, '$.archived_reason') != 'synthetic-mock-data-phase13-removal') ORDER BY title ASC LIMIT 100").all();
    return rows.map((r: any) => ({
      ...r,
      tags: JSON.parse(r.tags || '[]')
    }));
  }
}

// 6. Graph Visualizer helpers (getSubgraph & getDefaultGraph)
export async function getSubgraph(centerNodeId: string, depth: number = 1, maxNodes = 80) {
  if (useSupabase) {
    let nodeIds = new Set<string>([centerNodeId]);
    let traversedIds = new Set<string>();
    let relationshipsList: any[] = [];
    
    for (let d = 0; d < depth; d++) {
      const currentIdsToTraverse = Array.from(nodeIds).filter(id => !traversedIds.has(id));
      if (currentIdsToTraverse.length === 0) break;
      
      currentIdsToTraverse.forEach(id => traversedIds.add(id));
      
      // Query relationships in chunks of 10 nodes to avoid massive URI/parameter lists in PostgREST
      const chunkSize = 10;
      for (let i = 0; i < currentIdsToTraverse.length; i += chunkSize) {
        const chunk = currentIdsToTraverse.slice(i, i + chunkSize);
        const orCondition = chunk.map(id => `from_node_id.eq.${id},to_node_id.eq.${id}`).join(',');
        
        const { data: rels, error } = await supabase
          .from('relationships')
          .select('*, from_node:nodes!relationships_from_node_id_fkey(title, node_type, metadata), to_node:nodes!relationships_to_node_id_fkey(title, node_type, metadata)')
          .or(orCondition);
          
        if (error) throw error;
        
        if (rels) {
          for (const rel of rels) {
            const fromArchived = rel.from_node?.metadata?.archived_reason === 'synthetic-mock-data-phase13-removal';
            const toArchived = rel.to_node?.metadata?.archived_reason === 'synthetic-mock-data-phase13-removal';
            if (fromArchived || toArchived) continue;
            
            if (!relationshipsList.some(r => r.id === rel.id)) {
              relationshipsList.push(rel);
              nodeIds.add(rel.from_node_id);
              nodeIds.add(rel.to_node_id);
            }
          }
        }
      }
      
      if (nodeIds.size >= maxNodes) break;
    }
    
    // Fetch node details
    const idsArray = Array.from(nodeIds).slice(0, maxNodes);
    const { data: nodes, error: nodesError } = await supabase
      .from('nodes')
      .select('id, title, node_type, summary, confidence, external_id, metadata')
      .in('id', idsArray);
      
    if (nodesError) throw nodesError;
    
    const finalNodes = (nodes || []).filter((n: any) => !n.metadata || n.metadata.archived_reason !== 'synthetic-mock-data-phase13-removal');
    const finalNodeIds = new Set(finalNodes.map((n: any) => n.id));
    const finalRels = relationshipsList.filter(r => finalNodeIds.has(r.from_node_id) && finalNodeIds.has(r.to_node_id));
    
    return {
      nodes: finalNodes.map((n: any) => {
        const { metadata, ...rest } = n;
        return rest;
      }),
      relationships: finalRels.map(r => ({
        id: r.id,
        from_node_id: r.from_node_id,
        to_node_id: r.to_node_id,
        relationship: r.relationship,
        confidence: r.confidence,
        evidence: r.evidence,
        from_node: { title: r.from_node.title, node_type: r.from_node.node_type },
        to_node: { title: r.to_node.title, node_type: r.to_node.node_type }
      }))
    };
  } else {
    if (!sqliteDb) return { nodes: [], relationships: [] };
    
    let nodeIds = new Set<string>([centerNodeId]);
    let traversedIds = new Set<string>();
    let relationshipsList: any[] = [];
    
    for (let d = 0; d < depth; d++) {
      const currentIdsToTraverse = Array.from(nodeIds).filter(id => !traversedIds.has(id));
      if (currentIdsToTraverse.length === 0) break;
      
      currentIdsToTraverse.forEach(id => traversedIds.add(id));
      
      const placeholders = currentIdsToTraverse.map(() => '?').join(',');
      const queryStr = `
        SELECT r.*, 
               fn.title as from_title, fn.node_type as from_type, fn.metadata as from_metadata,
               tn.title as to_title, tn.node_type as to_type, tn.metadata as to_metadata
        FROM relationships r
        JOIN nodes fn ON r.from_node_id = fn.id
        JOIN nodes tn ON r.to_node_id = tn.id
        WHERE r.from_node_id IN (${placeholders}) OR r.to_node_id IN (${placeholders})
      `;
      const params = [...currentIdsToTraverse, ...currentIdsToTraverse];
      const relRows = sqliteDb.prepare(queryStr).all(...params);
      
      for (const r of relRows) {
        const fromMeta = JSON.parse(r.from_metadata || '{}');
        const toMeta = JSON.parse(r.to_metadata || '{}');
        const fromArchived = fromMeta?.archived_reason === 'synthetic-mock-data-phase13-removal';
        const toArchived = toMeta?.archived_reason === 'synthetic-mock-data-phase13-removal';
        if (fromArchived || toArchived) continue;
        
        if (!relationshipsList.some(rel => rel.id === r.id)) {
          relationshipsList.push({
            id: r.id,
            from_node_id: r.from_node_id,
            to_node_id: r.to_node_id,
            relationship: r.relationship,
            confidence: r.confidence,
            evidence: r.evidence,
            from_node: { title: r.from_title, node_type: r.from_type },
            to_node: { title: r.to_title, node_type: r.to_type }
          });
          nodeIds.add(r.from_node_id);
          nodeIds.add(r.to_node_id);
        }
      }
      
      if (nodeIds.size >= maxNodes) break;
    }
    
    const idsArray = Array.from(nodeIds).slice(0, maxNodes);
    const placeholders = idsArray.map(() => '?').join(',');
    const nodesRows = sqliteDb.prepare(`SELECT id, title, node_type, summary, confidence, external_id, metadata FROM nodes WHERE id IN (${placeholders})`).all(...idsArray);
    
    const finalNodes = nodesRows.map((n: any) => ({
      ...n,
      metadata: JSON.parse(n.metadata || '{}')
    })).filter((n: any) => !n.metadata || n.metadata.archived_reason !== 'synthetic-mock-data-phase13-removal');
    
    const finalNodeIds = new Set(finalNodes.map((n: any) => n.id));
    const finalRels = relationshipsList.filter(r => finalNodeIds.has(r.from_node_id) && finalNodeIds.has(r.to_node_id));
    
    return {
      nodes: finalNodes.map((n: any) => {
        const { metadata, ...rest } = n;
        return rest;
      }),
      relationships: finalRels
    };
  }
}

export async function getDefaultGraph(limit = 25) {
  if (useSupabase) {
    // Select the 25 most recently created nodes that are threat_actors, techniques, or malware
    const { data: nodes, error } = await supabase
      .from('nodes')
      .select('id, title, node_type, summary, confidence, external_id')
      .in('node_type', ['threat_actor', 'malware', 'technique'])
      .or("metadata->>archived_reason.is.null,metadata->>archived_reason.neq.synthetic-mock-data-phase13-removal")
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    if (!nodes || nodes.length === 0) return { nodes: [], relationships: [] };
    
    const nodeIds = nodes.map((n: any) => n.id);
    // Fetch any relationships between these nodes
    const { data: rels, error: relError } = await supabase
      .from('relationships')
      .select('*, from_node:nodes!relationships_from_node_id_fkey(title, node_type), to_node:nodes!relationships_to_node_id_fkey(title, node_type)')
      .in('from_node_id', nodeIds);
      
    if (relError) throw relError;
    
    // Filter to relations where both endpoints are in our nodes list
    const finalRels = (rels || []).filter((r: any) => nodeIds.includes(r.to_node_id));
    
    return {
      nodes,
      relationships: finalRels.map((r: any) => ({
        id: r.id,
        from_node_id: r.from_node_id,
        to_node_id: r.to_node_id,
        relationship: r.relationship,
        confidence: r.confidence,
        evidence: r.evidence,
        from_node: r.from_node,
        to_node: r.to_node
      }))
    };
  } else {
    if (!sqliteDb) return { nodes: [], relationships: [] };
    
    const nodes = sqliteDb.prepare(`
      SELECT id, title, node_type, summary, confidence, external_id 
      FROM nodes 
      WHERE node_type IN ('threat_actor', 'malware', 'technique')
        AND (JSON_EXTRACT(metadata, '$.archived_reason') IS NULL OR JSON_EXTRACT(metadata, '$.archived_reason') != 'synthetic-mock-data-phase13-removal')
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit);
    
    const nodeIds = nodes.map((n: any) => n.id);
    if (nodeIds.length === 0) return { nodes: [], relationships: [] };
    
    const placeholders = nodeIds.map(() => '?').join(',');
    const relRows = sqliteDb.prepare(`
      SELECT r.*, 
             fn.title as from_title, fn.node_type as from_type,
             tn.title as to_title, tn.node_type as to_type
      FROM relationships r
      JOIN nodes fn ON r.from_node_id = fn.id
      JOIN nodes tn ON r.to_node_id = tn.id
      WHERE r.from_node_id IN (${placeholders}) AND r.to_node_id IN (${placeholders})
    `).all(...nodeIds, ...nodeIds);
    
    const relationships = relRows.map((r: any) => ({
      id: r.id,
      from_node_id: r.from_node_id,
      to_node_id: r.to_node_id,
      relationship: r.relationship,
      confidence: r.confidence,
      evidence: r.evidence,
      from_node: { title: r.from_title, node_type: r.from_type },
      to_node: { title: r.to_title, node_type: r.to_type }
    }));
    
    return {
      nodes: nodes.map((n: any) => ({ ...n })),
      relationships
    };
  }
}

// 7. Get semantically similar nodes for /similar/[id]
export async function getSimilarNodes(
  nodeId: string,
  threshold: number = 0.5,
  limit: number = 10
): Promise<any[]> {
  if (!useSupabase) return [];

  // First, fetch this node's embedding
  const { data: node, error: nodeErr } = await supabase
    .from('nodes')
    .select('id, title, node_type, embedding')
    .eq('id', nodeId)
    .single();

  if (nodeErr || !node) return [];
  if (!node.embedding) return []; // node not yet embedded

  // Robustly parse the embedding to a numeric array if it is returned as a string
  let embeddingVector = node.embedding;
  if (typeof embeddingVector === 'string') {
    try {
      embeddingVector = JSON.parse(embeddingVector);
    } catch {
      embeddingVector = embeddingVector.replace(/[\[\]\s]/g, '').split(',').map(Number);
    }
  }

  // Call match_nodes with the node's own embedding, exclude self
  const { data, error } = await supabase.rpc('match_nodes', {
    query_embedding: embeddingVector,
    match_threshold: threshold,
    match_count: limit + 1,  // fetch one extra to exclude self
    filter_type: 'all'
  });

  if (error) throw error;

  // Exclude the source node itself from results and remove archived synthetic nodes
  const results = (data || [])
    .filter((n: any) => n.id !== nodeId && (!n.metadata || n.metadata.archived_reason !== 'synthetic-mock-data-phase13-removal'))
    .slice(0, limit);
  return results;
}

// Math helpers for SQLite cosine similarity
function np_array(vec: number[]): number[] {
  return vec;
}

function get_cosine_similarity(v1: number[], v2: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    normA += v1[i] * v1[i];
    normB += v2[i] * v2[i];
  }
  if (normA === 0 || normB === 0) return 0.0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 8. Get trends and weekly patterns data
export async function getPatternsData() {
  if (useSupabase) {
    // Query latest summary reports
    const { data: summaries } = await supabase
      .from('trends')
      .select('*')
      .eq('pattern_type', 'summary')
      .order('detected_at', { ascending: false })
      .limit(5);

    // Query latest trends
    const { data: trends } = await supabase
      .from('trends')
      .select('*')
      .eq('pattern_type', 'trend')
      .order('detected_at', { ascending: false })
      .limit(30);

    return {
      summaries: summaries || [],
      trends: trends || []
    };
  } else {
    if (!sqliteDb) {
      return { summaries: [], trends: [] };
    }
    try {
      // Ensure trends table exists in local SQLite
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS trends (
          id TEXT PRIMARY KEY,
          pattern_type TEXT NOT NULL,
          description TEXT NOT NULL,
          supporting_nodes TEXT,
          confidence REAL DEFAULT 0.5,
          detected_at TEXT,
          metadata TEXT
        )
      `);
      
      const summaryRows = sqliteDb.prepare("SELECT * FROM trends WHERE pattern_type = 'summary' ORDER BY detected_at DESC LIMIT 5").all();
      const trendRows = sqliteDb.prepare("SELECT * FROM trends WHERE pattern_type = 'trend' ORDER BY detected_at DESC LIMIT 30").all();
      
      const summaries = summaryRows.map((s: any) => ({
        id: s.id,
        pattern_type: s.pattern_type,
        description: s.description,
        supporting_nodes: JSON.parse(s.supporting_nodes || '[]'),
        confidence: s.confidence,
        detected_at: s.detected_at,
        metadata: JSON.parse(s.metadata || '{}')
      }));

      const trends = trendRows.map((t: any) => ({
        id: t.id,
        pattern_type: t.pattern_type,
        description: t.description,
        supporting_nodes: JSON.parse(t.supporting_nodes || '[]'),
        confidence: t.confidence,
        detected_at: t.detected_at,
        metadata: JSON.parse(t.metadata || '{}')
      }));
      
      return { summaries, trends };
    } catch (err) {
      console.error("SQLite patterns query failed:", err);
      return { summaries: [], trends: [] };
    }
  }
}

// 9. Get predictions
export async function getPredictions(statusFilter?: string) {
  if (useSupabase) {
    let query = supabase.from('predictions').select('*').order('confidence', { ascending: false });
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } else {
    if (!sqliteDb) return [];
    try {
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS predictions (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          hypothesis TEXT NOT NULL,
          related_nodes TEXT,
          confidence REAL DEFAULT 0.5,
          status TEXT DEFAULT 'pending',
          evidence_for TEXT,
          evidence_against TEXT,
          technology_context TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          resolved_at TEXT,
          metadata TEXT
        )
      `);
      let rows;
      if (statusFilter && statusFilter !== 'all') {
        rows = sqliteDb.prepare("SELECT * FROM predictions WHERE status = ? ORDER BY confidence DESC").all(statusFilter);
      } else {
        rows = sqliteDb.prepare("SELECT * FROM predictions ORDER BY confidence DESC").all();
      }
      return rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        hypothesis: r.hypothesis,
        related_nodes: JSON.parse(r.related_nodes || '[]'),
        confidence: r.confidence,
        status: r.status,
        evidence_for: JSON.parse(r.evidence_for || '[]'),
        evidence_against: JSON.parse(r.evidence_against || '[]'),
        technology_context: r.technology_context,
        created_at: r.created_at,
        resolved_at: r.resolved_at,
        metadata: JSON.parse(r.metadata || '{}')
      }));
    } catch (err) {
      console.error("SQLite predictions query failed:", err);
      return [];
    }
  }
}

// 10. Get prediction detail by ID
export async function getPredictionById(id: string) {
  if (useSupabase) {
    const { data, error } = await supabase.from('predictions').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  } else {
    if (!sqliteDb) return null;
    try {
      const row = sqliteDb.prepare("SELECT * FROM predictions WHERE id = ?").get(id);
      if (!row) return null;
      return {
        id: row.id,
        title: row.title,
        hypothesis: row.hypothesis,
        related_nodes: JSON.parse(row.related_nodes || '[]'),
        confidence: row.confidence,
        status: row.status,
        evidence_for: JSON.parse(row.evidence_for || '[]'),
        evidence_against: JSON.parse(row.evidence_against || '[]'),
        technology_context: row.technology_context,
        created_at: row.created_at,
        resolved_at: row.resolved_at,
        metadata: JSON.parse(row.metadata || '{}')
      };
    } catch (err) {
      console.error("SQLite prediction by ID query failed:", err);
      return null;
    }
  }
}

// 11. Get intelligence / learning metrics
export async function getIntelligence() {
  if (useSupabase) {
    const { data: accuracyRows } = await supabase
      .from('learning_metrics')
      .select('*')
      .eq('metric_type', 'accuracy_score')
      .order('recorded_at', { ascending: false })
      .limit(20);

    const { data: patternRows } = await supabase
      .from('learning_metrics')
      .select('*')
      .eq('metric_type', 'pattern_confirmation_rate')
      .order('recorded_at', { ascending: false })
      .limit(100);

    const { data: retrainRows } = await supabase
      .from('learning_metrics')
      .select('*')
      .eq('metric_type', 'model_retrain')
      .order('recorded_at', { ascending: false })
      .limit(10);

    const { data: nodeConf } = await supabase
      .from('nodes')
      .select('confidence, node_type')
      .not('confidence', 'is', null)
      .or("metadata->>archived_reason.is.null,metadata->>archived_reason.neq.synthetic-mock-data-phase13-removal");

    const { data: predCounts } = await supabase
      .from('predictions')
      .select('status');

    // Deduplicate patterns — keep latest per pattern name
    const latestPatterns: Record<string, any> = {};
    for (const row of (patternRows || [])) {
      const pattern = row.context?.pattern;
      if (pattern && !latestPatterns[pattern]) latestPatterns[pattern] = row;
    }

    // Confidence distribution buckets
    const confBuckets: Record<string, number> = {
      '0.0–0.2': 0, '0.2–0.4': 0, '0.4–0.6': 0, '0.6–0.8': 0, '0.8–1.0': 0
    };
    for (const n of (nodeConf || [])) {
      const c = parseFloat(n.confidence) || 0;
      if (c < 0.2)      confBuckets['0.0–0.2']++;
      else if (c < 0.4) confBuckets['0.2–0.4']++;
      else if (c < 0.6) confBuckets['0.4–0.6']++;
      else if (c < 0.8) confBuckets['0.6–0.8']++;
      else              confBuckets['0.8–1.0']++;
    }

    const statusSummary: Record<string, number> = {};
    for (const p of (predCounts || [])) {
      statusSummary[p.status] = (statusSummary[p.status] || 0) + 1;
    }

    const latestAccuracy = accuracyRows?.[0];
    const latestRetrain  = retrainRows?.[0];

    return {
      overall_accuracy:        latestAccuracy?.value ?? null,
      accuracy_history:        (accuracyRows || []).map((r: any) => ({
        date:     r.recorded_at,
        accuracy: r.value,
        samples:  r.context?.sample_size,
      })).reverse(),
      pattern_rates:           Object.values(latestPatterns).map((r: any) => ({
        pattern:     r.context?.pattern,
        rate:        r.value,
        sample_size: r.context?.sample_size,
        confirmed:   r.context?.confirmed,
        partial:     r.context?.partial,
        disproven:   r.context?.disproven,
      })).sort((a: any, b: any) => b.rate - a.rate),
      model_version:           latestRetrain?.context?.model_version ?? null,
      last_retrain:            latestRetrain?.recorded_at ?? null,
      last_retrain_accuracy:   latestRetrain?.value ?? null,
      retrain_history:         (retrainRows || []).map((r: any) => ({
        date:     r.recorded_at,
        accuracy: r.value,
        result:   r.context?.result,
        version:  r.context?.model_version,
      })),
      confidence_distribution: Object.entries(confBuckets).map(([bucket, count]) => ({ bucket, count })),
      prediction_status:       statusSummary,
    };
  } else {
    return {
      overall_accuracy:        null,
      accuracy_history:        [],
      pattern_rates:           [],
      model_version:           null,
      last_retrain:            null,
      last_retrain_accuracy:   null,
      retrain_history:         [],
      confidence_distribution: [],
      prediction_status:       {},
    };
  }
}

// 8. Sources and Feed Management
export async function getSources() {
  if (useSupabase) {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .order('reliability', { ascending: false });
    if (error) throw error;
    return data || [];
  } else {
    if (!sqliteDb) return [];
    const stmt = sqliteDb.prepare("SELECT * FROM sources ORDER BY reliability DESC");
    const rows = stmt.all();
    return rows.map((r: any) => ({
      ...r,
      is_active: r.is_active === 1 || r.is_active === true
    }));
  }
}

export async function getSourceById(id: string) {
  if (useSupabase) {
    const { data: source, error } = await supabase
      .from('sources')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!source) return null;
    
    const domain = extractDomain(source.url);
    const sourceNameKeyword = source.name.split(' ')[0];
    
    const { data: nodes, error: nodesError } = await supabase
      .from('nodes')
      .select('id, title, node_type, created_at, source_url, source_name, confidence')
      .or(`source_name.ilike.%${sourceNameKeyword}%,source_url.ilike.%${domain}%`)
      .or("metadata->>archived_reason.is.null,metadata->>archived_reason.neq.synthetic-mock-data-phase13-removal")
      .order('created_at', { ascending: false })
      .limit(10);
      
    return {
      source,
      recentNodes: nodes || []
    };
  } else {
    if (!sqliteDb) return null;
    const source = sqliteDb.prepare("SELECT * FROM sources WHERE id = ?").get(id);
    if (!source) return null;
    
    const domain = extractDomain(source.url);
    const sourceNameKeyword = source.name.split(' ')[0];
    
    const nodes = sqliteDb.prepare(`
      SELECT id, title, node_type, created_at, source_url, source_name, confidence 
      FROM nodes 
      WHERE (source_name LIKE ? OR source_url LIKE ?)
        AND (JSON_EXTRACT(metadata, '$.archived_reason') IS NULL OR JSON_EXTRACT(metadata, '$.archived_reason') != 'synthetic-mock-data-phase13-removal')
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(`%${sourceNameKeyword}%`, `%${domain}%`);
    
    return {
      source: {
        ...source,
        is_active: source.is_active === 1 || source.is_active === true
      },
      recentNodes: nodes.map((n: any) => ({ ...n }))
    };
  }
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    let hostname = parsed.hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    return hostname;
  } catch {
    const match = url.match(/https?:\/\/([^\/\s?#]+)/);
    if (match) {
      let d = match[1];
      if (d.startsWith('www.')) d = d.substring(4);
      return d;
    }
    return url;
  }
}

export async function getFullTextSearch(query: string, limit: number = 10) {
  if (useSupabase) {
    const { data, error } = await supabase
      .from('nodes')
      .select('id, title, summary, node_type, confidence, source_url, source_name, tags')
      .textSearch('title_summary_fts', query, {
        config: 'english',
        type: 'websearch'
      })
      .or("metadata->>archived_reason.is.null,metadata->>archived_reason.neq.synthetic-mock-data-phase13-removal")
      .range(0, limit - 1);
    if (error) throw error;
    return data || [];
  } else {
    if (!sqliteDb) return [];
    const stmt = sqliteDb.prepare(`
      SELECT id, title, summary, node_type, confidence, source_url, source_name, tags 
      FROM nodes 
      WHERE (title LIKE ? OR summary LIKE ? OR content LIKE ?)
        AND (JSON_EXTRACT(metadata, '$.archived_reason') IS NULL OR JSON_EXTRACT(metadata, '$.archived_reason') != 'synthetic-mock-data-phase13-removal')
      LIMIT ?
    `);
    const rows = stmt.all(`%${query}%`, `%${query}%`, `%${query}%`, limit);
    return rows.map((r: any) => ({
      ...r,
      tags: JSON.parse(r.tags || '[]')
    }));
  }
}

export async function globalSearch(query: string) {
  const cleanQuery = query ? query.trim() : '';
  if (!cleanQuery) {
    return { nodes: [], predictions: [], trends: [], sources: [] };
  }

  if (useSupabase) {
    const [nodesRes, predictionsRes, trendsRes, sourcesRes] = await Promise.all([
      supabase
        .from('nodes')
        .select('id, title, node_type')
        .or(`title.ilike.%${cleanQuery}%,summary.ilike.%${cleanQuery}%`)
        .or("metadata->>archived_reason.is.null,metadata->>archived_reason.neq.synthetic-mock-data-phase13-removal")
        .limit(5),
      supabase
        .from('predictions')
        .select('id, title, hypothesis, status')
        .or(`title.ilike.%${cleanQuery}%,hypothesis.ilike.%${cleanQuery}%`)
        .limit(5),
      supabase
        .from('trends')
        .select('id, description, pattern_type')
        .ilike('description', `%${cleanQuery}%`)
        .limit(5),
      supabase
        .from('sources')
        .select('id, name, url, is_active')
        .or(`name.ilike.%${cleanQuery}%,url.ilike.%${cleanQuery}%`)
        .limit(5)
    ]);

    return {
      nodes: nodesRes.data || [],
      predictions: predictionsRes.data || [],
      trends: trendsRes.data || [],
      sources: sourcesRes.data || [],
    };
  } else {
    if (!sqliteDb) {
      return { nodes: [], predictions: [], trends: [], sources: [] };
    }
    const nodes = sqliteDb.prepare(`
      SELECT id, title, node_type 
      FROM nodes 
      WHERE (title LIKE ? OR summary LIKE ?)
        AND (JSON_EXTRACT(metadata, '$.archived_reason') IS NULL OR JSON_EXTRACT(metadata, '$.archived_reason') != 'synthetic-mock-data-phase13-removal')
      LIMIT 5
    `).all(`%${cleanQuery}%`, `%${cleanQuery}%`);

    let predictions: any[] = [];
    try {
      predictions = sqliteDb.prepare(`
        SELECT id, title, hypothesis, status 
        FROM predictions 
        WHERE title LIKE ? OR hypothesis LIKE ? 
        LIMIT 5
      `).all(`%${cleanQuery}%`, `%${cleanQuery}%`);
    } catch (err) {
      console.warn("SQLite globalSearch predictions failed:", err);
    }

    let trends: any[] = [];
    try {
      trends = sqliteDb.prepare(`
        SELECT id, description, pattern_type 
        FROM trends 
        WHERE description LIKE ? 
        LIMIT 5
      `).all(`%${cleanQuery}%`);
    } catch (err) {
      console.warn("SQLite globalSearch trends failed:", err);
    }

    let sources: any[] = [];
    try {
      sources = sqliteDb.prepare(`
        SELECT id, name, url, is_active 
        FROM sources 
        WHERE name LIKE ? OR url LIKE ? 
        LIMIT 5
      `).all(`%${cleanQuery}%`, `%${cleanQuery}%`);
    } catch (err) {
      console.warn("SQLite globalSearch sources failed:", err);
    }

    return {
      nodes: nodes.map((n: any) => ({ ...n })),
      predictions: predictions.map((p: any) => ({ ...p })),
      trends: trends.map((t: any) => ({ ...t })),
      sources: sources.map((s: any) => ({
        ...s,
        is_active: s.is_active === 1 || s.is_active === true
      }))
    };
  }
}






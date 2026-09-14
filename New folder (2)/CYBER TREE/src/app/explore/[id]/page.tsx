import { getNodeDetails, queryNodes } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NodeDetailsPage({ params }: PageProps) {
  // Resolving params
  const { id } = await params;
  const data = await getNodeDetails(id);
  
  if (!data || !data.node) {
    notFound();
  }

  const { node, relationships } = data;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'threat_actor':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'vulnerability':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'malware':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'technique':
        return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
      case 'incident':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'weakness':
        return 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20';
      case 'research':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'news':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (conf >= 0.70) return 'text-violet-400 bg-violet-500/10 border-violet-500/30';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  };

  // Fetch similar nodes using embedding vector if available
  let similarNodes: any[] = [];
  if (node.embedding) {
    try {
      similarNodes = await queryNodes({
        semantic: true,
        embeddingVector: node.embedding,
        limit: 4
      });
      // Filter out the current node from similarity list
      similarNodes = similarNodes.filter((s: any) => s.id !== node.id);
    } catch (err) {
      console.error("Failed to query similar nodes:", err);
    }
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link 
          href="/search" 
          className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← BACK TO INTEL DIRECTORY
        </Link>
      </div>

      {/* Header Info */}
      <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900/80 space-y-4">
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getNodeTypeColor(node.node_type)}`}>
            {node.node_type.replace('_', ' ')}
          </span>
          {node.external_id && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 border border-slate-800 text-slate-400">
              {node.external_id}
            </span>
          )}
          {node.metadata?.degraded_relevance && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center space-x-1">
              <span>⚠️</span>
              <span>Degraded Relevance</span>
            </span>
          )}
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase tracking-wider ${getConfidenceColor(node.confidence)}`}>
            CONFIDENCE: {(node.confidence * 100).toFixed(0)}%
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white">{node.title}</h1>
        
        <p className="text-sm text-slate-300 italic leading-relaxed">
          {node.summary}
        </p>

        <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-900/60 font-mono text-[10px] text-slate-500">
          <div>Source: <span className="text-slate-400">{node.source_name || 'N/A'}</span></div>
          <div>Created: <span className="text-slate-400">{formatDate(node.created_at)}</span></div>
          {node.source_url && (
            <div>
              URL: <a href={node.source_url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">Link</a>
            </div>
          )}
        </div>
      </div>

      {/* Two columns: Content vs. Relationships & Similars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Full Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/10 border border-slate-900/80 space-y-4">
            <h2 className="text-lg font-bold">Analysis / Technical Details</h2>
            <div className="text-sm text-slate-300 space-y-4 leading-relaxed font-sans whitespace-pre-wrap">
              {node.content || "No extended analysis available."}
            </div>
            
            {/* Tag List */}
            {node.tags && node.tags.length > 0 && (
              <div className="pt-4 border-t border-slate-900/60">
                <p className="text-xs font-mono text-slate-500 mb-2">TAGS</p>
                <div className="flex flex-wrap gap-1.5">
                  {node.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] font-mono text-slate-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Relationships & Similar nodes */}
        <div className="space-y-8">
          
          {/* Relationships Mapping */}
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900/80 space-y-4">
            <h2 className="text-lg font-bold">Relationships Map</h2>
            <div className="space-y-3">
              {relationships.length === 0 ? (
                <p className="text-sm text-slate-500 font-mono py-2">No explicit links mapped.</p>
              ) : (
                relationships.map((rel: any) => {
                  const isFromCurrent = rel.from_node_id === node.id;
                  const targetTitle = isFromCurrent ? rel.to_node.title : rel.from_node.title;
                  const targetId = isFromCurrent ? rel.to_node_id : rel.from_node_id;
                  const targetType = isFromCurrent ? rel.to_node.node_type : rel.from_node.node_type;
                  
                  return (
                    <div key={rel.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-900/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          {rel.relationship}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Confidence: {(rel.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-slate-500 text-xs">
                          {isFromCurrent ? "Links to: " : "Linked from: "}
                        </span>
                        <Link 
                          href={`/explore/${targetId}`} 
                          className="font-bold text-slate-200 hover:text-white hover:underline transition-all block mt-0.5"
                        >
                          {targetTitle}
                        </Link>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{targetType.replace('_', ' ')}</span>
                      </div>

                      {rel.evidence && (
                        <p className="text-[10px] font-mono text-slate-500 italic border-t border-slate-900/60 pt-1.5 mt-1.5">
                          {rel.evidence}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Similar Intelligence nodes */}
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900/80 space-y-4">
            <h2 className="text-lg font-bold">Semantic Neighbors</h2>
            <div className="space-y-3">
              {similarNodes.length === 0 ? (
                <p className="text-sm text-slate-500 font-mono py-2">No similar patterns detected.</p>
              ) : (
                similarNodes.map((s: any) => (
                  <Link 
                    key={s.id}
                    href={`/explore/${s.id}`}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/10 block transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase ${getNodeTypeColor(s.node_type)}`}>
                        {s.node_type.replace('_', ' ')}
                      </span>
                      {s.similarity && (
                        <span className="text-[9px] font-mono text-violet-400">
                          {(s.similarity * 100).toFixed(0)}% Similarity
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-white truncate mt-1.5">{s.title}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 leading-relaxed">{s.summary}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

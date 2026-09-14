import { getPatternsData } from '@/lib/db';
import PatternsCharts from './charts';
import Link from 'next/link';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export default async function PatternsPage() {
  const { summaries, trends } = await getPatternsData();

  // Load cluster summary from local models folder
  let clusterData: Record<string, any> = {};
  try {
    const filePath = path.join(process.cwd(), 'models/cluster_summary.json');
    const fileContent = await fs.readFile(filePath, 'utf8');
    clusterData = JSON.parse(fileContent);
  } catch (err) {
    console.log("No cluster_summary.json found, or failed to read.");
  }

  // Format chart data from trends
  const typeChartData = trends
    .filter((t: any) => t.metadata?.item_type === 'node_type')
    .map((t: any) => ({
      name: (t.metadata.item_value as string).replace('_', ' ').toUpperCase(),
      current: t.metadata.current_week_count || 0,
      previous: t.metadata.previous_week_count || 0,
      growth: t.metadata.growth_rate || 0,
    }))
    .slice(0, 5); // Take top 5

  const tagChartData = trends
    .filter((t: any) => t.metadata?.item_type === 'tag')
    .map((t: any) => ({
      name: t.metadata.item_value as string,
      current: t.metadata.current_week_count || 0,
      previous: t.metadata.previous_week_count || 0,
      growth: t.metadata.growth_rate || 0,
    }))
    .slice(0, 5); // Take top 5

  // Sorted list of clusters (largest first)
  const sortedClusters = Object.values(clusterData).sort(
    (a: any, b: any) => (b.size || 0) - (a.size || 0)
  );

  const formatPercent = (val: number) => {
    return `${(val * 100).toFixed(0)}%`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-10">
      {/* Title */}
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Pattern Intelligence</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">PHASE 5</span>
        </div>
        <p className="mt-2 text-slate-400 max-w-2xl text-sm sm:text-base">
          Unsupervised clustering of high-dimensional node embeddings combined with Week-over-Week trend analysis.
        </p>
      </div>

      {/* Latest Intelligence Summary Card */}
      {summaries.length > 0 && (
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-violet-950/20 via-slate-900/40 to-emerald-950/10 border border-violet-500/20 shadow-xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-emerald-300">
              Latest System Synthesis
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Detected: {formatDate(summaries[0].detected_at)}
            </span>
          </div>
          
          <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
            {summaries[0].description}
          </p>

          {summaries[0].supporting_nodes && summaries[0].supporting_nodes.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-900/60">
              <span className="text-xs font-mono text-slate-500 block mb-3">Supporting Entities:</span>
              <div className="flex flex-wrap gap-2">
                {summaries[0].supporting_nodes.slice(0, 10).map((id: string, idx: number) => (
                  <Link
                    key={id}
                    href={`/explore/${id}`}
                    className="px-2.5 py-1 rounded text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors duration-150"
                  >
                    Entity #{idx + 1}
                  </Link>
                ))}
                {summaries[0].supporting_nodes.length > 10 && (
                  <span className="text-xs text-slate-600 self-center">
                    + {summaries[0].supporting_nodes.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WoW Growth Chart Section */}
      <PatternsCharts typeData={typeChartData} tagData={tagChartData} />

      {/* Discovered Clusters Grid */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Discovered Knowledge Clusters</h2>
        {sortedClusters.length === 0 ? (
          <div className="p-12 rounded-2xl border border-slate-800/80 bg-slate-900/10 text-center">
            <p className="text-slate-500 font-mono text-sm">
              No clusters mapped. Run the weekly clustering pipeline (cluster_nodes.py) to generate.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedClusters.map((cluster: any) => (
              <div
                key={cluster.id}
                className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900/80 hover:border-slate-800/80 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-slate-500">CLUSTER #{cluster.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      {cluster.size} nodes
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-200 line-clamp-1 mb-2">
                    {cluster.label.split(': ').slice(1).join(': ')}
                  </h3>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {cluster.top_tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800 font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Examples */}
                  <div className="space-y-2 mt-4">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                      Exemplar Nodes:
                    </span>
                    {cluster.example_nodes.map((node: any) => (
                      <Link
                        key={node.id}
                        href={`/explore/${node.id}`}
                        className="flex items-center justify-between p-2 rounded bg-slate-900/40 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 transition-colors duration-150 text-xs"
                      >
                        <span className="text-slate-300 font-medium truncate max-w-[150px]">{node.title}</span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase px-1 py-0.2 bg-slate-950 rounded border border-slate-900">
                          {node.node_type.replace('_', ' ')}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-900/60">
                  <Link
                    href={`/search?q=${encodeURIComponent(cluster.top_tags[0] || '')}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all duration-200"
                  >
                    View Cluster Nodes in Search
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detected Trends List */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Recent Trends History</h2>
        {trends.length === 0 ? (
          <div className="p-12 rounded-2xl border border-slate-800/80 bg-slate-900/10 text-center">
            <p className="text-slate-500 font-mono text-sm">No trends detected yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trends.map((trend: any) => (
              <div
                key={trend.id}
                className="p-5 rounded-2xl bg-slate-900/20 border border-slate-900/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      trend.metadata?.growth_rate >= 1.0
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {formatPercent(trend.metadata?.growth_rate || 0)} growth
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Detected: {formatDate(trend.detected_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 font-medium">{trend.description}</p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] font-mono text-slate-500 block">CONFIDENCE</span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {(trend.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  {trend.supporting_nodes && trend.supporting_nodes.length > 0 && (
                    <Link
                      href={`/explore/${trend.supporting_nodes[0]}`}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all duration-200 whitespace-nowrap"
                    >
                      Investigate Node
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

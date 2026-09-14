import { getIncidentTimeline } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TimelinePage() {
  const incidents = await getIncidentTimeline();

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
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Incident Timeline</h1>
        <p className="mt-2 text-slate-400 text-sm">
          Chronological index of recorded breaches, active campaigns, and public security alerts.
        </p>
      </div>

      {/* Timeline container */}
      <div className="relative border-l border-slate-900 ml-4 md:ml-6 space-y-8 py-4">
        {incidents.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-900 rounded-2xl ml-6">
            <p className="text-sm text-slate-500 font-mono">No incidents recorded in timeline yet. Run the collector pipeline to populate feeds.</p>
          </div>
        ) : (
          incidents.map((incident: any, idx: number) => (
            <div key={incident.id} className="relative pl-6 md:pl-8 group">
              {/* Timeline marker */}
              <div className="absolute -left-[6px] top-1.5 h-3 w-3 rounded-full bg-slate-950 border-2 border-slate-800 group-hover:border-violet-400 group-hover:scale-125 transition-all duration-300" />
              
              <div className="space-y-2 p-5 rounded-2xl bg-slate-900/10 border border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/20 transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[10px] text-slate-500">
                  <div className="flex items-center space-x-2">
                    <span className="text-violet-400 font-bold">{formatDate(incident.created_at)}</span>
                    <span>•</span>
                    <span>{incident.source_name || 'Public Feed'}</span>
                  </div>
                </div>
                
                <Link 
                  href={`/explore/${incident.id}`} 
                  className="text-base font-bold text-slate-200 hover:text-white hover:underline transition-all block mt-1"
                >
                  {incident.title}
                </Link>
                
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {incident.summary}
                </p>

                {incident.tags && incident.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {incident.tags.slice(0, 4).map((tag: string, tidx: number) => (
                      <span key={tidx} className="px-1.5 py-0.5 rounded-full bg-slate-950 text-[9px] font-mono text-slate-500">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

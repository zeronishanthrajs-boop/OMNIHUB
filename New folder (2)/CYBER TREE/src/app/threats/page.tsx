import { getThreatActors } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ThreatsPage() {
  const actors = await getThreatActors();

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Threat Actor Profiles</h1>
        <p className="mt-2 text-slate-400 text-sm">
          Active threat groups, nation-state actors, and ransomware syndicates compiled from MITRE ATT&CK.
        </p>
      </div>

      {/* Grid of Threat Actors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actors.length === 0 ? (
          <div className="md:col-span-2 p-6 text-center border border-dashed border-slate-900 rounded-2xl">
            <p className="text-sm text-slate-500 font-mono">No threat actors indexed yet.</p>
          </div>
        ) : (
          actors.map((actor: any) => (
            <div 
              key={actor.id} 
              className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/30 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-rose-500/20 bg-rose-500/10 text-rose-400 uppercase">
                    THREAT ACTOR
                  </span>
                  {actor.external_id && (
                    <span className="font-mono text-xs text-slate-500">{actor.external_id}</span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-200">{actor.title}</h2>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {actor.summary || "No profile details compiled yet."}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-900/60 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5">
                  {actor.tags && actor.tags.slice(0, 3).map((tag: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] font-mono text-slate-500">
                      #{tag}
                    </span>
                  ))}
                </div>
                <Link 
                  href={`/explore/${actor.id}`} 
                  className="font-mono text-[10px] text-violet-400 hover:text-violet-300 font-bold shrink-0"
                >
                  MAP CAMPAIGNS →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

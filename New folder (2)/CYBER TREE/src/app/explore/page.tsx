'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function ExploreGraphPage() {
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);
  const [depth, setDepth] = useState<number>(1);
  const [graphData, setGraphData] = useState<{ nodes: any[]; relationships: any[] }>({ nodes: [], relationships: [] });
  
  const [focusedNode, setFocusedNode] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [d3Loaded, setD3Loaded] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<any>(null);

  // 1. Dynamic D3.js loading from CDN (Zero dependencies, robust build)
  useEffect(() => {
    if ((window as any).d3) {
      setD3Loaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://d3js.org/d3.v7.min.js';
    script.async = true;
    script.onload = () => setD3Loaded(true);
    document.body.appendChild(script);
    return () => {
      // Cleanup script is optional, script stays in body for page transitions
    };
  }, []);

  // 2. Fetch Graph data from API
  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (centerNodeId) {
          params.append('centerNodeId', centerNodeId);
          params.append('depth', depth.toString());
        }
        const res = await fetch(`/api/graph?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setGraphData(data);
          
          // Set focused node to center node if available
          if (centerNodeId) {
            const center = data.nodes.find((n: any) => n.id === centerNodeId);
            if (center) setFocusedNode(center);
          } else if (data.nodes.length > 0) {
            // Otherwise focus first node as default
            setFocusedNode(data.nodes[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load graph data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [centerNodeId, depth]);

  // 3. Search query suggestions
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/nodes?search=${encodeURIComponent(searchQuery)}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Search query failed:", err);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // 4. Render D3 Graph
  useEffect(() => {
    if (!d3Loaded || !svgRef.current || !graphData.nodes) return;

    const d3 = (window as any).d3;
    if (!d3) return;

    const svgElement = svgRef.current;
    const width = svgElement.clientWidth || 800;
    const height = svgElement.clientHeight || 500;

    // Reset SVG content
    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    // Create container for panning/zooming
    const container = svg.append('g').attr('class', 'graph-container');

    // Zoom and pan behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event: any) => {
        container.attr('transform', event.transform);
      });
    
    svg.call(zoom);

    // Initial positioning: Translate to center
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85));

    // Map relationships to D3 links
    const links = graphData.relationships.map((r: any) => ({
      id: r.id,
      source: r.from_node_id,
      target: r.to_node_id,
      relationship: r.relationship,
      confidence: r.confidence
    })).filter((l: any) => 
      graphData.nodes.some((n: any) => n.id === l.source) &&
      graphData.nodes.some((n: any) => n.id === l.target)
    );

    // Deep copy nodes for D3 simulation
    const nodes = graphData.nodes.map((n: any) => ({ ...n }));

    // Define colors by node type
    const getNodeColor = (type: string) => {
      switch (type) {
        case 'threat_actor': return '#f43f5e'; // rose-500
        case 'vulnerability': return '#f59e0b'; // amber-500
        case 'malware': return '#ef4444'; // red-500
        case 'technique': return '#8b5cf6'; // violet-500
        case 'incident': return '#06b6d4'; // cyan-500
        case 'weakness': return '#d946ef'; // fuchsia-500
        case 'research': return '#10b981'; // emerald-500
        case 'news': return '#3b82f6'; // blue-500
        default: return '#64748b'; // slate-500
      }
    };

    // Initialize Force Simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('collision', d3.forceCollide().radius(40))
      .force('center', d3.forceCenter(0, 0));

    simulationRef.current = simulation;

    // Draw links (lines)
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('class', 'transition-all duration-300');

    // Draw nodes groups (circle + label)
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'cursor-pointer group')
      .on('click', (event: any, d: any) => {
        setFocusedNode(d);
      })
      .on('dblclick', (event: any, d: any) => {
        // Double-click to traverse (set as center node)
        setCenterNodeId(d.id);
      })
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    // Draw Node Circles
    node.append('circle')
      .attr('r', (d: any) => d.id === centerNodeId ? 18 : 12)
      .attr('fill', (d: any) => getNodeColor(d.node_type))
      .attr('stroke', (d: any) => d.id === centerNodeId ? '#c084fc' : '#0f172a')
      .attr('stroke-width', (d: any) => d.id === centerNodeId ? 3.5 : 1.5)
      .attr('filter', (d: any) => d.id === centerNodeId ? 'drop-shadow(0 0 8px rgba(192, 132, 252, 0.6))' : 'none')
      .attr('class', 'transition-all duration-200 hover:scale-125');

    // Draw Node Labels (External ID or shortened Title)
    node.append('text')
      .text((d: any) => d.external_id || (d.title.length > 15 ? d.title.substring(0, 12) + '...' : d.title))
      .attr('x', 0)
      .attr('y', 24)
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', (d: any) => d.id === centerNodeId ? 'bold' : 'normal')
      .attr('pointer-events', 'none');

    // Update coordinates on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
    });

    // Drag handlers
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [graphData, centerNodeId, d3Loaded]);

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'threat_actor': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'vulnerability': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'malware': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'technique': return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
      case 'incident': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'weakness': return 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20';
      case 'research': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'news': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Search and Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Interactive Graph</h1>
          <p className="mt-1 text-slate-400 text-xs">
            Double-click a node to traverse connections. Single-click to view analytical details.
          </p>
        </div>

        {/* Start Node Search bar */}
        <div className="relative w-full md:w-80 z-20">
          <input 
            type="text" 
            placeholder="Search starting node..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-violet-500/60 transition-all font-mono"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-950 border border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto z-30 font-mono text-[10px] divide-y divide-slate-900">
              {searchResults.map((node) => (
                <button 
                  key={node.id}
                  className="w-full text-left px-4 py-2 hover:bg-slate-900/60 text-slate-300 hover:text-white transition-all flex items-center justify-between"
                  onClick={() => {
                    setCenterNodeId(node.id);
                    setSearchQuery('');
                    setShowDropdown(false);
                  }}
                >
                  <span className="truncate max-w-[180px]">{node.title}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-900 text-slate-500 border border-slate-800 uppercase shrink-0 text-[8px]">
                    {node.node_type.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Graph Work Area */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Visual Graph View Canvas (Left 3 cols) */}
        <div className="lg:col-span-3 rounded-2xl bg-slate-950/50 border border-slate-900/80 relative flex flex-col overflow-hidden group">
          {/* Depth / Reset Controls */}
          <div className="absolute top-4 left-4 flex items-center space-x-2 z-10 flex-wrap gap-y-2">
            <span className="text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-900">
              DEPTH
            </span>
            <div className="bg-slate-950/80 border border-slate-900 rounded-md p-0.5 flex space-x-1">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  disabled={!centerNodeId}
                  className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    !centerNodeId 
                      ? 'text-slate-700 cursor-not-allowed'
                      : depth === d
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d} Hop{d > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            
            {centerNodeId && (
              <button
                onClick={() => {
                  setCenterNodeId(null);
                  setDepth(1);
                  setFocusedNode(null);
                }}
                className="px-2.5 py-1.5 rounded-md bg-slate-950/80 text-[10px] font-mono text-rose-400 hover:text-rose-300 border border-slate-900 hover:border-rose-950 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/60"
              >
                RESET VIEW
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="bg-slate-950/80 border border-slate-900 rounded-md p-0.5 flex space-x-1">
              <button
                onClick={() => setViewMode('graph')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/60 ${
                  viewMode === 'graph'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                GRAPH
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/60 ${
                  viewMode === 'list'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LIST
              </button>
            </div>
          </div>

          {viewMode === 'graph' && (
            <div className="absolute bottom-4 right-4 flex flex-wrap gap-2 text-[9px] font-mono bg-slate-950/80 px-3 py-2 rounded-md border border-slate-900 text-slate-400 z-10 pointer-events-none">
              <div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-[#f43f5e]"></span><span>Actor</span></div>
              <div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-[#ef4444]"></span><span>Malware</span></div>
              <div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span><span>Vuln</span></div>
              <div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-[#8b5cf6]"></span><span>Tech</span></div>
              <div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-[#06b6d4]"></span><span>Incident</span></div>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-300">
              <div className="text-center space-y-2">
                <div className="inline-block animate-spin h-6 w-6 border-2 border-t-transparent border-violet-500 rounded-full" />
                <p className="text-[10px] font-mono text-slate-500">Traversing connections...</p>
              </div>
            </div>
          )}

          {!d3Loaded ? (
            <div className="flex-1 flex items-center justify-center font-mono text-xs text-slate-500">
              Loading graphics engine (D3.js)...
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center font-mono text-xs text-slate-500">
              No graph data found. Select a start node above.
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex-1 overflow-y-auto p-6 pt-16 space-y-3 bg-slate-950/20 max-h-[70vh]">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Navigable Nodes Directory</h3>
                <span className="text-[10px] text-slate-500 font-mono">{graphData.nodes.length} Nodes in Subgraph</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {graphData.nodes.map((n) => {
                  const isFocused = focusedNode?.id === n.id;
                  const isCenter = centerNodeId === n.id;
                  return (
                    <div 
                      key={n.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                        isFocused 
                          ? 'bg-violet-950/25 border-violet-500/50 shadow-md shadow-violet-500/5' 
                          : 'bg-slate-900/10 border-slate-900/80 hover:bg-slate-900/20 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between space-x-2">
                        <span className={`px-2 py-0.2 rounded text-[8px] font-mono font-bold border uppercase ${getNodeTypeColor(n.node_type)}`}>
                          {n.node_type.replace('_', ' ')}
                        </span>
                        {isCenter && (
                          <span className="px-2 py-0.2 rounded text-[8px] font-mono font-bold bg-violet-600/20 text-violet-400 border border-violet-500/20 uppercase">
                            Center Node
                          </span>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{n.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{n.summary || 'No summary available.'}</p>
                      </div>

                      <div className="flex items-center space-x-2 pt-2 border-t border-slate-950/40">
                        <button
                          onClick={() => setFocusedNode(n)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-900 text-[10px] font-bold font-mono transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/80 cursor-pointer"
                        >
                          Focus Details
                        </button>
                        <button
                          onClick={() => {
                            setCenterNodeId(n.id);
                            setDepth(1);
                          }}
                          disabled={isCenter}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 hover:text-violet-300 border border-violet-500/20 disabled:opacity-40 disabled:pointer-events-none text-[10px] font-bold font-mono transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/80 cursor-pointer"
                        >
                          Traverse Graph
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <svg 
              ref={svgRef} 
              className="flex-1 w-full h-full bg-slate-950/30 cursor-grab active:cursor-grabbing"
            />
          )}
        </div>

        {/* Node Detail Side Card (Right 1 col) */}
        <div className="lg:col-span-1 rounded-2xl bg-slate-900/30 border border-slate-900/80 p-5 flex flex-col h-full overflow-hidden shrink-0 space-y-4">
          <h2 className="text-sm font-extrabold tracking-wider text-slate-400 font-mono uppercase border-b border-slate-900 pb-2">
            Intelligence Details
          </h2>
          
          {focusedNode ? (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto space-y-4 pr-1">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getNodeTypeColor(focusedNode.node_type)}`}>
                    {focusedNode.node_type.replace('_', ' ')}
                  </span>
                  {focusedNode.external_id && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-950 border border-slate-800 text-slate-400">
                      {focusedNode.external_id}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white leading-snug">{focusedNode.title}</h3>
                
                <p className="text-xs text-slate-400 leading-relaxed font-sans whitespace-pre-line italic">
                  {focusedNode.summary || "No description provided."}
                </p>
                
                <div className="pt-2 border-t border-slate-900/60 font-mono text-[9px] text-slate-500 space-y-1">
                  <div>Confidence: <span className="text-violet-400 font-bold">{(focusedNode.confidence * 100).toFixed(0)}%</span></div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-900">
                <button
                  onClick={() => setCenterNodeId(focusedNode.id)}
                  disabled={focusedNode.id === centerNodeId}
                  className={`w-full py-2 px-3 rounded-xl text-center text-xs font-mono font-bold transition-all border ${
                    focusedNode.id === centerNodeId
                      ? 'bg-slate-950 text-slate-600 border-slate-900 cursor-default'
                      : 'bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white border-violet-500/20 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-950/20'
                  }`}
                >
                  CENTER ON NODE
                </button>
                <Link
                  href={`/explore/${focusedNode.id}`}
                  className="block w-full py-2 px-3 rounded-xl bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-center text-xs font-mono font-bold transition-all"
                >
                  FULL ANALYSIS →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <p className="text-xs text-slate-500 font-mono leading-relaxed">
                Click any node in the graph to show its analysis details, or double-click to traverse the connections.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

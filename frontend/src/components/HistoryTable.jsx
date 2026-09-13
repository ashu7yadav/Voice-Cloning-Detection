import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Trash2, Eye, Download, ShieldAlert, ShieldCheck, 
  HelpCircle, RefreshCw, FileText, ArrowUpDown
} from 'lucide-react';
import api from '../services/api';
import PDFReportModal from './PDFReportModal';

export default function HistoryTable({ onSelectAnalysis }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedForPdf, setSelectedForPdf] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getHistory(search, riskFilter);
      if (res.status === 'success') {
        setHistoryItems(res.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [riskFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this scan record permanently?')) return;

    try {
      await api.deleteHistory(id);
      setHistoryItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const getRiskBadge = (risk) => {
    if (risk === 'HIGH') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-cyber-rose/10 border border-cyber-rose/30 text-cyber-rose text-[11px] font-mono font-bold inline-flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> HIGH RISK
        </span>
      );
    }
    if (risk === 'LOW') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald text-[11px] font-mono font-bold inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> LOW RISK
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[11px] font-mono font-bold inline-flex items-center gap-1">
        <HelpCircle className="w-3 h-3" /> UNCERTAIN
      </span>
    );
  };

  return (
    <div className="w-full space-y-5">
      
      {/* Search & Filter Header Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search scans by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-900/80 rounded-xl border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyber-violet"
          />
        </form>

        {/* Risk Filter Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => (
            <button
              key={risk}
              onClick={() => setRiskFilter(risk)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                riskFilter === risk
                  ? 'bg-cyber-violet/20 border border-cyber-violet/40 text-white shadow-sm'
                  : 'glass-pill text-slate-400 hover:text-white'
              }`}
            >
              {risk === '' ? 'All Scans' : `${risk} Risk`}
            </button>
          ))}

          <button
            onClick={fetchHistory}
            className="p-2 rounded-xl glass-pill text-slate-400 hover:text-white transition-colors"
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      {/* History Records Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-dark-900/60 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Filename</th>
                <th className="py-3.5 px-4">Prediction</th>
                <th className="py-3.5 px-4">Synthetic %</th>
                <th className="py-3.5 px-4">Risk Level</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-mono">
                    Loading scan history...
                  </td>
                </tr>
              ) : historyItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No historical scans match your query.
                  </td>
                </tr>
              ) : (
                historyItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectAnalysis && onSelectAnalysis(item)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-white flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-cyber-cyan shrink-0" />
                      <span className="truncate max-w-xs">{item.filename}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className={item.prediction === 'AI_GENERATED' ? 'text-cyber-rose font-semibold' : 'text-cyber-emerald font-semibold'}>
                        {item.prediction}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {Math.round(item.synthetic_likelihood * 100)}%
                    </td>

                    <td className="py-3.5 px-4">
                      {getRiskBadge(item.risk_level)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {item.duration_seconds}s
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectAnalysis && onSelectAnalysis(item)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyber-cyan transition-colors"
                          title="View Full Report"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedForPdf(item)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyber-violet transition-colors"
                          title="Export PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 rounded-lg hover:bg-cyber-rose/10 text-slate-400 hover:text-cyber-rose transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Export Modal */}
      {selectedForPdf && (
        <PDFReportModal
          isOpen={true}
          onClose={() => setSelectedForPdf(null)}
          analysis={selectedForPdf}
        />
      )}

    </div>
  );
}

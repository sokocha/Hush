import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { storageService } from '../services/storageService';
import {
  Shield, Clock, CheckCircle, XCircle, Calendar,
  ArrowLeft, User, MapPin, Camera, Phone, MessageSquare,
  RefreshCw, ChevronDown, ChevronUp, X,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const TABS = [
  { id: 'pending', label: 'Pending', icon: Clock, color: 'gray' },
  { id: 'scheduled', label: 'Upcoming Calls', icon: Calendar, color: 'blue' },
  { id: 'under_review', label: 'Under Review', icon: Clock, color: 'purple' },
  { id: 'denied', label: 'Denied', icon: XCircle, color: 'red' },
  { id: 'disputed', label: 'Disputes', icon: MessageSquare, color: 'amber' },
  { id: 'approved', label: 'Approved', icon: CheckCircle, color: 'green' },
];

const STATUS_COLORS = {
  pending: { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-300', badge: 'bg-gray-500' },
  scheduled: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300', badge: 'bg-blue-500' },
  under_review: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-300', badge: 'bg-purple-500' },
  approved: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300', badge: 'bg-green-500' },
  denied: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-300', badge: 'bg-red-500' },
};

// ═══════════════════════════════════════════════════════════
// MODAL COMPONENT
// ═══════════════════════════════════════════════════════════

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// CREATOR CARD
// ═══════════════════════════════════════════════════════════

const CreatorCard = ({ creator, onApprove, onDeny, onReschedule, _onViewDetail }) => {
  const [expanded, setExpanded] = useState(false);
  const user = creator.users;
  const photos = creator.creator_photos || [];
  const areas = creator.creator_areas?.map(a => a.area) || [];
  const previewPhoto = photos.find(p => p.is_preview) || photos[0];
  const colors = STATUS_COLORS[creator.verification_status] || STATUS_COLORS.pending;
  const scheduledAt = creator.verification_call_scheduled_at
    ? new Date(creator.verification_call_scheduled_at)
    : null;

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl overflow-hidden transition-all`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-white/10 flex-shrink-0 overflow-hidden">
            {previewPhoto ? (
              <img
                src={storageService.getPhotoUrl(previewPhoto.storage_path)}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={20} className="text-white/30" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold truncate">{user?.name || 'Unknown'}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${colors.badge}`}>
                {creator.verification_status}
              </span>
            </div>
            <p className="text-white/50 text-sm">@{user?.username}</p>
            <div className="flex items-center gap-3 mt-1 text-white/40 text-xs">
              {creator.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {creator.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Camera size={12} /> {photos.length} photos
              </span>
              {user?.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={12} /> {user.phone}
                </span>
              )}
            </div>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Scheduled time */}
        {scheduledAt && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Calendar size={14} className={colors.text} />
            <span className={colors.text}>
              {scheduledAt.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
              {' at '}
              {scheduledAt.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Dispute message */}
        {creator.dispute_message && (
          <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-amber-300 text-xs font-medium mb-1">Dispute message:</p>
            <p className="text-amber-200/70 text-sm">{creator.dispute_message}</p>
          </div>
        )}

        {/* Denial reason */}
        {creator.verification_denied_reason && !creator.dispute_message && (
          <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-300 text-xs font-medium mb-1">Denial reason:</p>
            <p className="text-red-200/70 text-sm">{creator.verification_denied_reason}</p>
          </div>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Areas */}
          {areas.length > 0 && (
            <div>
              <p className="text-white/40 text-xs mb-1">Areas</p>
              <div className="flex flex-wrap gap-1">
                {areas.map(a => (
                  <span key={a} className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/70">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Physical */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {creator.body_type && (
              <div><span className="text-white/40">Body:</span> <span className="text-white/70">{creator.body_type}</span></div>
            )}
            {creator.age && (
              <div><span className="text-white/40">Age:</span> <span className="text-white/70">{creator.age}</span></div>
            )}
            {creator.skin_tone && (
              <div><span className="text-white/40">Skin:</span> <span className="text-white/70">{creator.skin_tone}</span></div>
            )}
            {creator.height && (
              <div><span className="text-white/40">Height:</span> <span className="text-white/70">{creator.height}</span></div>
            )}
          </div>

          {/* Bio */}
          {creator.bio && (
            <div>
              <p className="text-white/40 text-xs mb-1">Bio</p>
              <p className="text-white/60 text-sm">{creator.bio}</p>
            </div>
          )}

          {/* Photos gallery */}
          {photos.length > 0 && (
            <div>
              <p className="text-white/40 text-xs mb-1">Photos</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map(photo => (
                  <img
                    key={photo.id}
                    src={storageService.getPhotoUrl(photo.storage_path)}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pricing */}
          {creator.pricing && (
            <div>
              <p className="text-white/40 text-xs mb-1">Pricing</p>
              <div className="text-xs text-white/60 space-y-0.5">
                {creator.pricing.meetupIncall?.['1'] > 0 && <p>1hr Incall: N{Number(creator.pricing.meetupIncall['1']).toLocaleString()}</p>}
                {creator.pricing.meetupOutcall?.['1'] > 0 && <p>1hr Outcall: N{Number(creator.pricing.meetupOutcall['1']).toLocaleString()}</p>}
              </div>
            </div>
          )}

          {/* Registered */}
          <p className="text-white/30 text-xs">
            Registered {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
      )}

      {/* Actions */}
      {creator.verification_status !== 'approved' && (
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={() => onApprove(creator)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-300 text-sm font-medium transition-colors"
          >
            <CheckCircle size={14} /> Approve
          </button>
          {creator.verification_status !== 'denied' && (
            <button
              onClick={() => onDeny(creator)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 text-sm font-medium transition-colors"
            >
              <XCircle size={14} /> Deny
            </button>
          )}
          <button
            onClick={() => onReschedule(creator)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 text-sm font-medium transition-colors"
          >
            <Calendar size={14} /> Reschedule
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('pending');
  const [creators, setCreators] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Modals
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [denyReason, setDenyReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Access control
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isSuperAdmin)) {
      navigate('/explore/all', { replace: true });
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, navigate]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [queueResult, statsResult] = await Promise.all([
      adminService.getVerificationQueue(activeTab),
      adminService.getDashboardStats(),
    ]);
    if (queueResult.success) {
      setCreators(queueResult.creators);
    } else {
      console.error('[AdminDashboard] Queue fetch failed:', queueResult.error);
      setCreators([]);
    }
    if (statsResult.success) {
      setStats(statsResult.stats);
    } else {
      console.error('[AdminDashboard] Stats fetch failed:', statsResult.error);
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    if (isSuperAdmin) fetchData();
  }, [isSuperAdmin, fetchData]);

  // Actions
  const handleApprove = async (creator) => {
    if (!confirm(`Approve ${creator.users?.name || 'this creator'}?`)) return;
    setActionLoading(creator.id);
    const result = await adminService.approveCreator(creator.id);
    setActionLoading(null);
    if (result.success) fetchData();
  };

  const handleDenyClick = (creator) => {
    setSelectedCreator(creator);
    setDenyReason('');
    setShowDenyModal(true);
  };

  const handleDenySubmit = async () => {
    if (!denyReason.trim()) return;
    setActionLoading(selectedCreator.id);
    const result = await adminService.denyCreator(selectedCreator.id, denyReason.trim());
    setActionLoading(null);
    if (result.success) {
      setShowDenyModal(false);
      fetchData();
    }
  };

  const handleRescheduleClick = (creator) => {
    setSelectedCreator(creator);
    // Default to tomorrow at 10:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRescheduleDate(tomorrow.toISOString().split('T')[0]);
    setRescheduleTime('10:00');
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleDate || !rescheduleTime) return;
    setActionLoading(selectedCreator.id);
    const scheduledAt = new Date(`${rescheduleDate}T${rescheduleTime}`).toISOString();
    const result = await adminService.rescheduleCreator(selectedCreator.id, scheduledAt);
    setActionLoading(null);
    if (result.success) {
      setShowRescheduleModal(false);
      fetchData();
    }
  };

  if (authLoading || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                <Shield size={24} className="text-purple-400" />
                <div>
                  <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
                  <p className="text-white/40 text-xs">Creator Verification</p>
                </div>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[
              { label: 'Pending', value: stats.pending, color: 'text-gray-400' },
              { label: 'Scheduled', value: stats.scheduled, color: 'text-blue-400' },
              { label: 'Review', value: stats.under_review, color: 'text-purple-400' },
              { label: 'Approved', value: stats.approved, color: 'text-green-400' },
              { label: 'Denied', value: stats.denied, color: 'text-red-400' },
              { label: 'Disputes', value: stats.disputed, color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-white/40 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const count = stats?.[tab.id] || 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Creator list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-1/3" />
                    <div className="h-3 bg-white/10 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              {activeTab === 'approved' ? (
                <CheckCircle size={32} className="text-green-400/50" />
              ) : activeTab === 'denied' ? (
                <XCircle size={32} className="text-red-400/50" />
              ) : (
                <Calendar size={32} className="text-white/20" />
              )}
            </div>
            <p className="text-white/40 text-sm">
              {activeTab === 'pending' && 'No pending creators'}
              {activeTab === 'scheduled' && 'No upcoming verification calls'}
              {activeTab === 'under_review' && 'No creators under review'}
              {activeTab === 'approved' && 'No approved creators yet'}
              {activeTab === 'denied' && 'No denied creators'}
              {activeTab === 'disputed' && 'No active disputes'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {creators.map(creator => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                onApprove={handleApprove}
                onDeny={handleDenyClick}
                onReschedule={handleRescheduleClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Deny Modal */}
      <Modal isOpen={showDenyModal} onClose={() => setShowDenyModal(false)} title="Deny Verification">
        <div className="space-y-4">
          <p className="text-white/60 text-sm">
            Denying <span className="text-white font-medium">{selectedCreator?.users?.name}</span>'s verification.
            Their profile will be hidden from the platform. They can dispute this decision.
          </p>
          <div className="space-y-2">
            <label className="text-white/70 text-sm">Reason for denial</label>
            <textarea
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              placeholder="e.g. Photos don't match video appearance, suspicious activity..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-red-500 focus:outline-none resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDenyModal(false)}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDenySubmit}
              disabled={!denyReason.trim() || actionLoading === selectedCreator?.id}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                denyReason.trim()
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {actionLoading === selectedCreator?.id ? 'Denying...' : 'Deny Creator'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={showRescheduleModal} onClose={() => setShowRescheduleModal(false)} title="Reschedule Call">
        <div className="space-y-4">
          <p className="text-white/60 text-sm">
            Reschedule verification call for <span className="text-white font-medium">{selectedCreator?.users?.name}</span>.
          </p>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-white/70 text-sm">Date</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-white/70 text-sm">Time</label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRescheduleModal(false)}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRescheduleSubmit}
              disabled={!rescheduleDate || !rescheduleTime || actionLoading === selectedCreator?.id}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                rescheduleDate && rescheduleTime
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {actionLoading === selectedCreator?.id ? 'Rescheduling...' : 'Reschedule'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

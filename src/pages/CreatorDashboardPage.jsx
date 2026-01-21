import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Crown, Shield, Video, Camera, DollarSign, Calendar,
  CheckCircle, Clock, AlertTriangle, Star, Users, Heart,
  Settings, LogOut, Edit3, ChevronLeft, ChevronRight,
  MapPin, Target, TrendingUp, Eye, Phone, MessageCircle,
  Ban, Sparkles, Award, X, Plus
} from 'lucide-react';
import { PLATFORM_CONFIG } from '../data/models';
import { useAuth } from '../context/AuthContext';

const formatNaira = (amount) => `₦${amount.toLocaleString()}`;

// Modal component
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className={`bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full ${size === 'lg' ? 'max-w-lg' : 'max-w-md'} max-h-[90vh] overflow-hidden flex flex-col animate-slideUp`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
};

// Stat card component
const StatCard = ({ icon: Icon, label, value, subValue, color = "purple" }) => {
  const colorClasses = {
    purple: { bg: "bg-purple-500/20", text: "text-purple-400" },
    green: { bg: "bg-green-500/20", text: "text-green-400" },
    pink: { bg: "bg-pink-500/20", text: "text-pink-400" },
    blue: { bg: "bg-blue-500/20", text: "text-blue-400" },
    amber: { bg: "bg-amber-500/20", text: "text-amber-400" },
  };
  const colors = colorClasses[color] || colorClasses.purple;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon size={20} className={colors.text} />
        </div>
        <div className="flex-1">
          <p className="text-white/50 text-xs">{label}</p>
          <p className="text-white font-bold text-lg">{value}</p>
          {subValue && <p className="text-white/40 text-xs">{subValue}</p>}
        </div>
      </div>
    </div>
  );
};

// Verification step component
const VerificationStep = ({ icon: Icon, title, description, status, action, onAction }) => {
  const statusColors = {
    pending: { bg: "bg-amber-500/20", border: "border-amber-500/30", icon: "text-amber-400" },
    in_progress: { bg: "bg-blue-500/20", border: "border-blue-500/30", icon: "text-blue-400" },
    completed: { bg: "bg-green-500/20", border: "border-green-500/30", icon: "text-green-400" },
  };
  const colors = statusColors[status] || statusColors.pending;

  return (
    <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon size={20} className={colors.icon} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-medium">{title}</h4>
            {status === 'completed' && (
              <CheckCircle size={16} className="text-green-400" />
            )}
            {status === 'in_progress' && (
              <Clock size={16} className="text-blue-400" />
            )}
          </div>
          <p className="text-white/50 text-sm mb-2">{description}</p>
          {status !== 'completed' && action && (
            <button
              onClick={onAction}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                status === 'pending'
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {action}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CreatorDashboardPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser, isCreator } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editData, setEditData] = useState({});

  // Redirect if not a creator
  if (!user || !isCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/60 mb-6">This page is only for registered creators/models.</p>
          <Link to="/auth" className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium transition-colors">
            Register / Login
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleEditProfile = () => {
    setEditData({
      name: user.name || '',
      tagline: user.tagline || '',
      bio: user.bio || '',
    });
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = () => {
    updateUser(editData);
    setShowEditProfileModal(false);
  };

  // Calculate verification progress
  const verificationSteps = [
    { id: 'phone', completed: true },
    { id: 'video', completed: user.isVideoVerified },
    { id: 'studio', completed: user.isStudioVerified },
    { id: 'pricing', completed: user.pricing?.meetupIncall?.[1] > 0 },
  ];
  const completedSteps = verificationSteps.filter(s => s.completed).length;
  const verificationProgress = (completedSteps / verificationSteps.length) * 100;

  const memberSince = user.registeredAt
    ? new Date(user.registeredAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Crown },
    { id: 'verification', label: 'Verification', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/explore/all" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronLeft size={20} className="text-white" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Creator Dashboard</h1>
              <p className="text-white/50 text-sm">@{user.username || 'username'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-3 bg-white/10 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors text-white/60"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{(user.name || 'U').slice(0, 2).toUpperCase()}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white font-bold text-xl truncate">{user.name || 'Your Name'}</h2>
                {user.isVideoVerified && (
                  <span className="p-1 bg-blue-500/20 rounded-full">
                    <Video size={14} className="text-blue-400" />
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm mb-2">{user.tagline || 'Add a tagline...'}</p>
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {user.location || 'Location'}
                </span>
                <span>•</span>
                <span>Joined {memberSince}</span>
              </div>
            </div>
          </div>

          {/* Verification Progress */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Profile Completion</span>
              <span className="text-purple-300 text-sm font-medium">{Math.round(verificationProgress)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
                style={{ width: `${verificationProgress}%` }}
              />
            </div>
            {verificationProgress < 100 && (
              <p className="text-white/40 text-xs mt-2">
                Complete verification to appear in search results
              </p>
            )}
          </div>
        </div>

        {/* Pending Verification Banner */}
        {user.pendingVerification && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-amber-300 font-medium mb-1">Verification Pending</h3>
                <p className="text-amber-300/70 text-sm">
                  Complete video verification and upload studio photos to go live on the platform.
                </p>
                <button
                  onClick={() => setActiveTab('verification')}
                  className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  Complete Verification
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Eye}
                label="Profile Views"
                value={user.stats?.profileViews || 0}
                subValue="This month"
                color="purple"
              />
              <StatCard
                icon={Star}
                label="Rating"
                value={user.stats?.rating || "—"}
                subValue={`${user.stats?.reviews || 0} reviews`}
                color="amber"
              />
              <StatCard
                icon={Target}
                label="Verified Meetups"
                value={user.stats?.verifiedMeetups || 0}
                subValue={`${user.stats?.meetupSuccessRate || 0}% success`}
                color="green"
              />
              <StatCard
                icon={Heart}
                label="Repeat Clients"
                value={user.stats?.repeatClients || 0}
                subValue="Loyal clients"
                color="pink"
              />
            </div>

            {/* Profile Summary */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Crown size={18} className="text-purple-400" />
                  My Profile
                </h3>
                <button
                  onClick={handleEditProfile}
                  className="text-purple-400 text-sm flex items-center gap-1 hover:text-purple-300"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Display Name</span>
                  <span className="text-white font-medium">{user.name || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Username</span>
                  <span className="text-white font-medium">@{user.username || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Location</span>
                  <span className="text-white font-medium">{user.location || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Areas</span>
                  <span className="text-white font-medium text-right">
                    {user.areas?.length > 0 ? user.areas.slice(0, 2).join(', ') : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Status</span>
                  <span className={`text-sm font-medium ${user.pendingVerification ? 'text-amber-400' : 'text-green-400'}`}>
                    {user.pendingVerification ? 'Pending Verification' : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Services */}
            {user.services?.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-400" />
                  Services Offered
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.services.map(service => (
                    <span key={service} className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Boundaries */}
            {user.boundaries?.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Ban size={18} className="text-red-400" />
                  Boundaries
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.boundaries.map(boundary => (
                    <span key={boundary} className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs">
                      {boundary}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold mb-4">Verification Steps</h2>
            <p className="text-white/50 text-sm mb-4">
              Complete these steps to activate your profile and appear in search results.
            </p>

            <VerificationStep
              icon={Phone}
              title="Phone Verification"
              description="Verify your identity with your phone number"
              status="completed"
            />

            <VerificationStep
              icon={Video}
              title="Video Verification"
              description="Complete a live video call with our team to verify your identity"
              status={user.isVideoVerified ? 'completed' : 'pending'}
              action="Schedule Call"
              onAction={() => alert('Video verification scheduling would open here')}
            />

            <VerificationStep
              icon={Camera}
              title="Studio Photos"
              description="Upload professional photos taken at our partner studios"
              status={user.isStudioVerified ? 'completed' : 'pending'}
              action="Book Session"
              onAction={() => alert('Studio booking would open here')}
            />

            <VerificationStep
              icon={DollarSign}
              title="Set Pricing"
              description="Configure your rates for different services"
              status={user.pricing?.meetupIncall?.[1] > 0 ? 'completed' : 'pending'}
              action="Set Prices"
              onAction={() => alert('Pricing configuration would open here')}
            />

            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <h4 className="text-purple-300 font-medium mb-2">Why verification matters</h4>
              <ul className="text-purple-300/70 text-sm space-y-1">
                <li>• Build trust with potential clients</li>
                <li>• Appear higher in search results</li>
                <li>• Access premium platform features</li>
                <li>• Get the verified badge on your profile</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold mb-4">Account Settings</h2>

            {/* Edit Profile */}
            <button
              onClick={handleEditProfile}
              className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Edit3 size={18} className="text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Edit Profile</p>
                  <p className="text-white/50 text-sm">Update your name, tagline, and bio</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-white/30" />
            </button>

            {/* Logout */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <LogOut size={18} className="text-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-red-300 font-medium">Sign Out</p>
                  <p className="text-red-300/50 text-sm">Log out of your account</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-red-300/30" />
            </button>

            {/* Switch to client */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-white/50 text-sm mb-3">Want to browse as a client instead?</p>
              <button
                onClick={() => {
                  logout();
                  navigate('/auth');
                }}
                className="text-purple-400 text-sm hover:text-purple-300 transition-colors"
              >
                Sign out and register as a Client →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          <Link to="/explore/all" className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors">
            <Users size={20} />
            <span className="text-xs">Browse</span>
          </Link>
          <Link to="/reviews" className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors">
            <Star size={20} />
            <span className="text-xs">Reviews</span>
          </Link>
          <Link to="/creator-dashboard" className="flex flex-col items-center gap-1 text-purple-400">
            <Crown size={20} />
            <span className="text-xs">Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        title="✏️ Edit Profile"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-white/70 text-sm">Display Name</label>
            <input
              type="text"
              value={editData.name || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Destiny"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/70 text-sm">Tagline</label>
            <input
              type="text"
              value={editData.tagline || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="e.g. Your favorite girl 💋"
              maxLength={50}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/70 text-sm">Bio</label>
            <textarea
              value={editData.bio || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value.slice(0, 200) }))}
              placeholder="Tell clients about yourself..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none resize-none h-24"
            />
            <p className="text-white/40 text-xs text-right">{(editData.bio || '').length}/200</p>
          </div>

          <button
            onClick={handleSaveProfile}
            className="w-full py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-semibold transition-all"
          >
            Save Changes
          </button>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Sign Out"
      >
        <div className="space-y-4">
          <p className="text-white/70">
            Are you sure you want to sign out? You'll need to verify your phone number again to log back in.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-semibold transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

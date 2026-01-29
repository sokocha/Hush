import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, DollarSign, Video, CheckCircle, Users,
  ChevronRight, ArrowLeft, Sparkles, Star, Clock, Lock
} from 'lucide-react';

export default function ForModelsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/explore/all" className="p-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors">
            <ArrowLeft size={20} className="text-white" />
          </Link>
          <h1 className="text-lg font-semibold text-white">For Models</h1>
        </div>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
            <Sparkles size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">List on Hush</h2>
          <p className="text-white/60 text-base max-w-sm mx-auto">
            Set your own rates, get verified clients, and earn on your terms. Go live in under 10 minutes.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-10">
          <h3 className="text-white font-semibold text-lg mb-5 text-center">How it works</h3>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Register', desc: 'Create your account with a phone number. Takes under 2 minutes.', icon: Users },
              { step: 2, title: 'Verify', desc: 'A quick 2-3 minute video call to confirm your identity. Then you go live.', icon: Video },
              { step: 3, title: 'Earn', desc: 'Set your rates, accept bookings from screened clients, and get paid.', icon: DollarSign },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-400 font-bold">{step}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className="text-purple-400" />
                    <h4 className="text-white font-medium">{title}</h4>
                  </div>
                  <p className="text-white/50 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Value props */}
        <div className="mb-10 space-y-4">
          <h3 className="text-white font-semibold text-lg mb-5 text-center">Why models choose Hush</h3>

          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Shield size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-green-300 font-medium mb-1">Deposit-protected bookings</h4>
                <p className="text-white/50 text-sm">
                  Every client pays a trust deposit before they can contact you. No time-wasters. If they no-show, you keep the deposit.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Lock size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-blue-300 font-medium mb-1">Screened clients only</h4>
                <p className="text-white/50 text-sm">
                  Our verification system screens every client. Only verified, deposit-paying members can book meetups.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <DollarSign size={20} className="text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-purple-300 font-medium mb-1">You set the rates</h4>
                <p className="text-white/50 text-sm">
                  Set your own rates for meetups, photo unlocks, and contact access. Earn directly from verified clients.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Star size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-amber-300 font-medium mb-1">Build your reputation</h4>
                <p className="text-white/50 text-sm">
                  Verified badge, client reviews, and meetup success stats help you stand out and attract more bookings.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-pink-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-pink-300 font-medium mb-1">Quick setup</h4>
                <p className="text-white/50 text-sm">
                  Add photos, set your rates, and schedule your verification call. Go live in under 10 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification details */}
        <div className="mb-10 p-5 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Video size={18} className="text-purple-400" />
            <h3 className="text-white font-semibold">About verification</h3>
          </div>
          <p className="text-white/50 text-sm mb-3">
            A 2-3 minute video call with a Hush team member. We ask you to hold your ID and say your name. That's it.
          </p>
          <div className="space-y-2">
            {['Confirms you are who you say you are', 'Earns your verified badge', 'Makes your profile visible in search results', 'Builds trust with clients before they book'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                <span className="text-white/60">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-12">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 rounded-xl text-white font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/30"
          >
            Get Started
            <ChevronRight size={20} />
          </Link>
          <p className="text-white/30 text-xs mt-4">Free to register • No listing fees • You earn directly</p>
        </div>
      </div>
    </div>
  );
}

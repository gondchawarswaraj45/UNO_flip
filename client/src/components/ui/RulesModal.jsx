/**
 * RulesModal — Comprehensive, crystal-clear in-game rulebook and card compendium.
 * Explains Classic vs Two-Side FLIP, the 5th color, all action cards, the Caught window, and scoring.
 */

import React, { useState } from 'react';
import sound from '../../utils/audio';

export default function RulesModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('modes'); // 'modes' | 'actions' | 'caught' | 'scoring'

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 620,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.6rem' }}>📜</span>
            <div>
              <h2 style={{ fontSize: '1.35rem', lineHeight: 1.1 }}>Official Rules & Guide</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Master Classic UNO, the Two-Side FLIP, and Tactical Counter-Calls
              </span>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ borderRadius: '50%', width: 36, height: 36, padding: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { id: 'modes',   label: '🎮 Modes & Setup' },
            { id: 'actions', label: '🃏 Action Cards' },
            { id: 'caught',  label: '🚨 UNO & Caught!' },
            { id: 'scoring', label: '🏆 XP & Career' },
          ].map((t) => (
            <button
              key={t.id}
              className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              onClick={() => {
                sound.buttonClick();
                setTab(t.id);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content Container */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 6 }}>
          {/* TAB 1: MODES & SETUP */}
          {tab === 'modes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ color: 'var(--text-gold)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🎯</span> Match Objective
                </h4>
                <p style={{ fontSize: '0.85rem' }}>
                  Be the first player to play all cards from your hand. You must match the top card of the Discard Pile by <strong>Color</strong>, <strong>Number</strong>, or <strong>Symbol</strong>. If you have no matching card, you must draw from the Draw Pile.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ color: '#93c5fd', marginBottom: 6 }}>Classic UNO Mode</h4>
                  <ul style={{ fontSize: '0.82rem', paddingLeft: 16, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <li>Single playable side. Standard fast-paced action.</li>
                    <li><strong>4-Color Palette:</strong> Red, Blue, Green, Yellow.</li>
                    <li><strong>5-Color Palette:</strong> Adds Regal Violet (Light Purple).</li>
                  </ul>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(168,85,247,0.3)' }}>
                  <h4 style={{ color: '#c084fc', marginBottom: 6 }}>Two-Side FLIP Mode</h4>
                  <ul style={{ fontSize: '0.82rem', paddingLeft: 16, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <li>Cards are dual-sided: <strong>Light Side</strong> & <strong>Dark Side</strong>.</li>
                    <li>Playing a <strong>FLIP Card</strong> inverts the entire table: discard pile, draw deck, and every player's hand!</li>
                    <li>Dark Side features ultra-punishing action cards.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTION CARDS */}
          {tab === 'actions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(234, 179, 8, 0.08)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                <h4 style={{ color: '#facc15', fontSize: '0.88rem', marginBottom: 4 }}>☀️ Light Side Action Cards</h4>
                <ul style={{ fontSize: '0.8rem', paddingLeft: 16, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li><strong>Draw One / Two (+1 / +2):</strong> Next player draws cards and skips turn.</li>
                  <li><strong>Skip:</strong> Next player loses their turn.</li>
                  <li><strong>Reverse:</strong> Inverts the direction of play.</li>
                  <li><strong>Wild:</strong> Play on any card and declare the new active color.</li>
                  <li><strong>Wild Draw Two / Four:</strong> Changes color and forces next player to draw.</li>
                  <li><strong>FLIP:</strong> Flips the entire table to the Dark Side!</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(131, 24, 67, 0.15)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                <h4 style={{ color: '#fda4af', fontSize: '0.88rem', marginBottom: 4 }}>🌙 Dark Side Special Action Cards</h4>
                <ul style={{ fontSize: '0.8rem', paddingLeft: 16, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li><strong>Draw Five (+5!):</strong> Next player must draw 5 cards immediately!</li>
                  <li><strong>Skip Everyone:</strong> All opponents skipped — you take another turn immediately!</li>
                  <li><strong>Wild Draw Color:</strong> Choose a color; next player must keep drawing cards until they pull that color!</li>
                  <li><strong>FLIP:</strong> Flips the board back to the Light Side!</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: UNO & CAUGHT */}
          {tab === 'caught' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ color: 'var(--text-gold)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📢</span> Declaring UNO
                </h4>
                <p style={{ fontSize: '0.85rem' }}>
                  When you play your second-to-last card (leaving you with exactly <strong>1 card</strong> in hand), you <strong>MUST press the UNO button</strong> before your turn ends.
                </p>
              </div>

              <div style={{ background: 'rgba(220, 38, 38, 0.1)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(220, 38, 38, 0.35)' }}>
                <h4 style={{ color: '#f87171', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🚨</span> The CAUGHT! Counter-Challenge
                </h4>
                <p style={{ fontSize: '0.85rem', marginBottom: 8 }}>
                  If a player holds 1 card and forgot to call UNO, opponents have a <strong>server-timed 2-second challenge window</strong> to press the <strong>CAUGHT!</strong> button.
                </p>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                  <div>⚡ <strong>If Caught:</strong> The delinquent player draws <strong>2 penalty cards</strong>!</div>
                  <div style={{ marginTop: 4 }}>🛡️ <strong>Authoritative:</strong> False alarms or late challenges are rejected by the server with zero false penalties.</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SCORING & XP */}
          {tab === 'scoring' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ color: 'var(--text-gold)', marginBottom: 8 }}>Career Progression & Leveling</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: '0.82rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: 8 }}>
                    🥇 <strong>Match Victory:</strong> +180 XP, +150 Coins
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: 8 }}>
                    🎮 <strong>Participation:</strong> +60 XP, +40 Coins
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: 8 }}>
                    🔔 <strong>UNO Called:</strong> +15 XP
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: 8 }}>
                    🎯 <strong>Caught Challenger:</strong> +25 XP
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(229, 185, 76, 0.08)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(229, 185, 76, 0.25)', fontSize: '0.82rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--text-gold)' }}>Unlockable Titles:</span>
                <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>
                  Novice Duelist (Lv. 1) • Table Duelist (Lv. 2) • Card Veteran (Lv. 3) • Flip Tactician (Lv. 5) • Grandmaster (Lv. 10+)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-gold" onClick={onClose} style={{ minWidth: 120 }}>
            Got It! 👍
          </button>
        </div>
      </div>
    </div>
  );
}

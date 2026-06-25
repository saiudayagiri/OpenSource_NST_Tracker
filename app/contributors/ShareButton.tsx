'use client';

import { useState, useEffect, useRef } from 'react';

interface Badge {
  id: string;
  name: string;
  emoji: string;
  style?: string;
  desc?: string;
}

interface Props {
  username: string;
  displayName: string;
  avatarUrl: string;
  mergedCount: number;
  totalCount: number;
  badges: Badge[];
}

export function ShareButton({
  username,
  displayName,
  avatarUrl,
  mergedCount,
  totalCount,
  badges,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const profileUrl = `${origin}/contributors/${username}`;

  // Close modal on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  function copyLink() {
    navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function downloadCard() {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 450;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw Background Gradient
      const bgGrad = ctx.createRadialGradient(400, 225, 50, 400, 225, 450);
      bgGrad.addColorStop(0, '#1a1235'); // Deep purple
      bgGrad.addColorStop(1, '#030712'); // Fixed dark background
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 800, 450);

      // 2. Draw Decorative Glow Circles (blur simulation)
      ctx.fillStyle = 'rgba(168, 85, 247, 0.08)'; // Purple glow
      ctx.beginPath();
      ctx.arc(80, 80, 200, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)'; // Blue glow
      ctx.beginPath();
      ctx.arc(700, 380, 180, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw Neon Glowing Card Border
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(20, 20, 760, 410, 16);
      } else {
        ctx.rect(20, 20, 760, 410);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // 4. Draw Header Branding
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('OPENSOURCE TRACKER NST', 45, 50);

      // 5. Draw Avatar (async load with CORS)
      let avatarLoaded = false;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = avatarUrl;
      await new Promise((resolve) => {
        img.onload = () => {
          avatarLoaded = true;
          resolve(null);
        };
        img.onerror = () => {
          avatarLoaded = false;
          resolve(null);
        };
      });

      ctx.save();
      ctx.beginPath();
      ctx.arc(105, 160, 52, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      if (avatarLoaded) {
        try {
          ctx.drawImage(img, 53, 108, 104, 104);
        } catch (e) {
          avatarLoaded = false;
        }
      }
      
      if (!avatarLoaded) {
        // Fallback placeholder if image fetch fails due to CORS or network
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(53, 108, 104, 104);
        ctx.fillStyle = '#818cf8';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(displayName[0]?.toUpperCase() ?? '?', 105, 175);
      }
      ctx.restore();

      // Draw Avatar Border Ring
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(105, 160, 52, 0, Math.PI * 2);
      ctx.stroke();

      // Reset text alignment
      ctx.textAlign = 'left';

      // 6. Draw User Profile details
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(displayName, 180, 150);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '15px monospace';
      ctx.fillText(`@${username}`, 180, 180);

      // 7. Draw Stats Grid
      // Total PRs
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('TOTAL CONTRIBUTIONS', 45, 290);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText(String(totalCount), 45, 340);

      // Merged PRs
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('MERGED PRs', 245, 290);
      ctx.fillStyle = '#10b981'; // Emerald 500
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText(String(mergedCount), 245, 340);

      // 8. Draw Badges Showcase Section
      if (badges.length > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('EARNED BADGES', 500, 115);

        badges.slice(0, 3).forEach((badge, idx) => {
          const bx = 500;
          const by = 135 + idx * 45;

          // Capsule box
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(bx, by, 250, 36, 8);
          } else {
            ctx.rect(bx, by, 250, 36);
          }
          ctx.fill();
          ctx.stroke();

          // Emoji and Name
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.font = '13px sans-serif';
          ctx.fillText(`${badge.emoji}  ${badge.name}`, bx + 15, by + 23);
        });
      }

      // 9. Draw Footer watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = '11px monospace';
      ctx.fillText('opensource.nst.edu', 45, 410);

      // 10. Generate and download image
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `nst-opensource-card-${username}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate PNG card:', err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex items-center">
      {/* Modal Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-400 hover:bg-purple-500/20 transition-all font-medium cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        View &amp; Share Card
      </button>

      {/* Modal Backdrop & Body */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#0a0f1d] border border-white/[0.08] rounded-2xl p-6 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-white font-semibold text-base">Your Contributor Card</h3>
                <p className="text-white/30 text-xs mt-0.5">Download and share your achievements natively.</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/30 hover:text-white/60 p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Interactive Card HTML/CSS Preview */}
            <div className="w-full aspect-[16/9] rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/10 to-blue-900/5 relative overflow-hidden p-6 flex flex-col justify-between shadow-lg">
              {/* Background glows */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 blur-2xl rounded-full" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full" />

              {/* Top Row Branding */}
              <div className="relative flex justify-between items-center text-[10px] font-mono font-bold tracking-wider text-purple-400 uppercase">
                <span>Opensource Tracker NST</span>
              </div>

              {/* Profile Details Row */}
              <div className="relative flex items-center gap-4 mt-2">
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-16 h-16 rounded-full ring-2 ring-purple-500/30 object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-lg truncate leading-snug">{displayName}</h4>
                  <p className="text-white/45 text-xs font-mono truncate">@{username}</p>
                </div>
              </div>

              {/* Stats & Badges Grid */}
              <div className="relative flex justify-between items-end mt-4">
                <div className="flex gap-8">
                  <div>
                    <span className="block text-[8px] font-bold text-white/30 tracking-wider uppercase">Contributions</span>
                    <span className="block text-2xl font-bold text-white/90 font-mono mt-0.5">{totalCount}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-white/30 tracking-wider uppercase">Merged PRs</span>
                    <span className="block text-2xl font-bold text-emerald-400 font-mono mt-0.5">{mergedCount}</span>
                  </div>
                </div>

                {/* Mini Badges Display */}
                {badges.length > 0 && (
                  <div className="flex gap-1">
                    {badges.slice(0, 3).map((b) => (
                      <span
                        key={b.id}
                        title={b.name}
                        className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xs"
                      >
                        {b.emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-white/[0.06]">
              <button
                onClick={downloadCard}
                disabled={downloading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-purple-900/10 transition-all cursor-pointer"
              >
                <svg className={`w-4 h-4 ${downloading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {downloading ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  )}
                </svg>
                {downloading ? 'Generating PNG...' : 'Download Card'}
              </button>

              <button
                onClick={copyLink}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] text-white/70 text-sm font-medium transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Profile Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

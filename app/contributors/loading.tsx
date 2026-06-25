export default function ContributorsLoading() {
  return (
    <main className="min-h-screen bg-[#030712]">
      <div className="relative overflow-hidden pt-16 pb-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="h-5 w-32 bg-white/5 rounded-full mx-auto mb-8 animate-pulse" />
          <div className="h-14 w-80 bg-white/5 rounded-2xl mx-auto mb-4 animate-pulse" />
          <div className="h-5 w-64 bg-white/5 rounded-full mx-auto mb-12 animate-pulse" />
          <div className="flex justify-center gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-8 py-4 w-36 animate-pulse">
                <div className="h-8 w-12 bg-white/10 rounded mx-auto mb-2" />
                <div className="h-3 w-16 bg-white/5 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-6 animate-pulse"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-13 h-13 rounded-full bg-white/10 flex-shrink-0" style={{ width: 52, height: 52 }} />
                <div className="flex-1 pt-0.5">
                  <div className="h-4 w-28 bg-white/10 rounded mb-2" />
                  <div className="h-3 w-20 bg-white/5 rounded" />
                </div>
              </div>
              <div className="flex gap-4 mb-3">
                <div className="h-3 w-16 bg-white/5 rounded" />
                <div className="h-3 w-12 bg-white/5 rounded" />
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full" />
              <div className="mt-4 h-3 w-24 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

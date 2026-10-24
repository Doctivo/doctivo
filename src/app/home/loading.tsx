export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFF] pb-24 md:pl-64 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-6 w-36 bg-slate-200 rounded-lg" />
          <div className="h-3 w-48 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-10 bg-slate-200 rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Banner Skeleton */}
        <div className="h-44 w-full bg-slate-200 rounded-3xl" />

        {/* Categories Skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-28 bg-slate-200 rounded" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 w-24 shrink-0 bg-slate-100 rounded-2xl border border-slate-200" />
            ))}
          </div>
        </div>

        {/* Doctor Cards Skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-36 bg-slate-200 rounded" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100 p-4 flex gap-4">
                <div className="h-24 w-24 bg-slate-200 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-5 w-40 bg-slate-200 rounded" />
                  <div className="h-3 w-28 bg-slate-100 rounded" />
                  <div className="h-4 w-20 bg-slate-100 rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

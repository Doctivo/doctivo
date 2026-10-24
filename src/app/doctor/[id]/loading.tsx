export default function DoctorProfileLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFF] pb-24 md:pl-64 animate-pulse">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Profile Card Skeleton */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-6">
          <div className="flex gap-4 items-center">
            <div className="h-20 w-20 rounded-2xl bg-slate-200 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-slate-200 rounded-lg" />
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="h-4 w-24 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="h-20 w-full bg-slate-50 rounded-2xl" />
        </div>

        {/* Schedule & Consultation Mode Skeleton */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-4">
          <div className="h-5 w-32 bg-slate-200 rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-slate-50 rounded-2xl" />
            <div className="h-16 bg-slate-50 rounded-2xl" />
          </div>
        </div>

        {/* Action Button Skeleton */}
        <div className="h-16 w-full bg-slate-200 rounded-full" />
      </div>
    </div>
  );
}

const SkeletonLoader = () => {
  return (
    <div className="bg-sidebar rounded-lg overflow-hidden border border-slate-700">
      <div className="aspect-square bg-background animate-pulse" />
      
      <div className="p-4 space-y-3">
        <div className="h-6 bg-slate-700 rounded animate-pulse" />
        <div className="h-4 bg-slate-700 rounded w-2/3 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-700 rounded animate-pulse" />
          <div className="h-4 bg-slate-700 rounded w-5/6 animate-pulse" />
        </div>
        <div className="h-10 bg-slate-700 rounded animate-pulse mt-4" />
      </div>
    </div>
  );
};

export default SkeletonLoader;

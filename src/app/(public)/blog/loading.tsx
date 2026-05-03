export default function BlogLoading() {
  return (
    <div className="flex flex-col w-full min-h-screen animate-pulse bg-default">
      <div className="w-full h-[60vh] bg-surface" />

      <div className="max-w-7xl mx-auto w-full px-6 py-16 space-y-6">
        <div className="w-48 h-10 bg-surface rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 h-[400px] bg-surface rounded-lg" />
          <div className="md:col-span-4 h-[400px] bg-surface rounded-lg" />
          <div className="md:col-span-4 h-[250px] bg-surface rounded-lg" />
          <div className="md:col-span-4 h-[250px] bg-surface rounded-lg" />
          <div className="md:col-span-4 h-[250px] bg-surface rounded-lg" />
        </div>
      </div>
    </div>
  );
}

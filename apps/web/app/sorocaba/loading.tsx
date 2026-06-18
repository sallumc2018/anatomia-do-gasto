export default function SorocabaLoading() {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* header skeleton */}
      <div
        style={{
          height: "var(--header-h)",
          borderBottom: "1px solid var(--border-01)",
          backgroundColor: "var(--bg-base)",
        }}
        className="flex items-center px-6"
      >
        <div className="animate-pulse h-4 w-32 rounded" style={{ backgroundColor: "var(--bg-raised)" }} />
      </div>

      {/* page title */}
      <div className="px-6 md:px-10 pt-8 pb-4" style={{ maxWidth: "1312px", margin: "0 auto", width: "100%" }}>
        <div className="animate-pulse h-3 w-16 rounded mb-3" style={{ backgroundColor: "var(--bg-raised)" }} />
        <div className="animate-pulse h-6 w-48 rounded mb-2" style={{ backgroundColor: "var(--bg-raised)" }} />
        <div className="animate-pulse h-4 w-80 rounded" style={{ backgroundColor: "var(--bg-raised)" }} />
      </div>

      {/* area cards grid */}
      <div className="px-6 md:px-10 py-6" style={{ maxWidth: "1312px", margin: "0 auto", width: "100%" }}>
        <div className="animate-pulse h-3 w-20 rounded mb-4" style={{ backgroundColor: "var(--bg-raised)" }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded p-5"
              style={{ backgroundColor: "var(--bg-elevated)", height: "140px" }}
            />
          ))}
        </div>
      </div>

      {/* secondary section */}
      <div className="px-6 md:px-10 pb-10" style={{ maxWidth: "1312px", margin: "0 auto", width: "100%" }}>
        <div className="animate-pulse h-3 w-24 rounded mb-4" style={{ backgroundColor: "var(--bg-raised)" }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded p-4"
              style={{ backgroundColor: "var(--bg-elevated)", height: "80px" }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

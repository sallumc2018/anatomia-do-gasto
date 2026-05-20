export default function Loading() {
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

      {/* hero / intro block */}
      <div className="px-6 md:px-10 pt-10 pb-6" style={{ maxWidth: "1312px", margin: "0 auto", width: "100%" }}>
        <div className="animate-pulse h-3 w-20 rounded mb-4" style={{ backgroundColor: "var(--bg-raised)" }} />
        <div className="animate-pulse h-7 w-2/3 rounded mb-3" style={{ backgroundColor: "var(--bg-raised)" }} />
        <div className="animate-pulse h-4 w-1/2 rounded" style={{ backgroundColor: "var(--bg-raised)" }} />
      </div>

      {/* metric cards row */}
      <div className="px-6 md:px-10 pb-8" style={{ maxWidth: "1312px", margin: "0 auto", width: "100%" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded p-4"
              style={{ backgroundColor: "var(--bg-elevated)", height: "88px" }}
            />
          ))}
        </div>
      </div>

      {/* areas section */}
      <div className="px-6 md:px-10 pb-10" style={{ maxWidth: "1312px", margin: "0 auto", width: "100%" }}>
        <div className="animate-pulse h-3 w-24 rounded mb-6" style={{ backgroundColor: "var(--bg-raised)" }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded p-5"
              style={{ backgroundColor: "var(--bg-elevated)", height: "120px" }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

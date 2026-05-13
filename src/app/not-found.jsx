import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f7f6f3] flex items-center justify-center px-6">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-10 items-center">
        
        {/* LEFT CONTENT */}
        <div className="text-center md:text-left">
          <p className="text-sm uppercase tracking-widest text-[#FF6A00] font-semibold mb-2">
            Page Not Found
          </p>

          <h1 className="text-6xl md:text-7xl font-serif font-bold text-[#2f2f2f] leading-tight mb-4">
            404
          </h1>

          <h2 className="text-2xl md:text-3xl font-serif text-[#FF6A00] mb-4">
            This chapter seems to be missing
          </h2>

          <p className="text-gray-600 text-lg mb-8 max-w-md">
            The page you’re looking for may have been moved, removed,
            or never written. Let’s turn the page and continue your journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#FF6A00] text-white font-semibold hover:bg-[#2a5560] transition"
            >
              Back to Home
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-[#FF6A00] text-[#FF6A00] font-semibold hover:bg-[#FF6A00]/10 transition"
            >
              Browse Books
            </Link>
          </div>
        </div>

        {/* RIGHT ILLUSTRATION */}
        <div className="flex justify-center">
          <svg
            width="360"
            height="360"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="max-w-full"
          >
            {/* Book */}
            <rect x="90" y="80" width="180" height="240" rx="12" fill="#FF6A00"/>
            <rect x="105" y="95" width="150" height="210" rx="8" fill="#ffffff"/>

            {/* Pages */}
            <rect x="120" y="115" width="120" height="10" rx="4" fill="#d1d5db"/>
            <rect x="120" y="140" width="100" height="10" rx="4" fill="#d1d5db"/>
            <rect x="120" y="165" width="110" height="10" rx="4" fill="#d1d5db"/>
            <rect x="120" y="190" width="90" height="10" rx="4" fill="#d1d5db"/>

            {/* Bookmark */}
            <path
              d="M250 80 V170 L235 155 L220 170 V80 Z"
              fill="#e11d48"
            />

            {/* Floating question mark */}
            <text
              x="280"
              y="120"
              fontSize="48"
              fontFamily="serif"
              fill="#9ca3af"
            >
              ?
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}

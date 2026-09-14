import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">404</p>
      <h1 className="text-3xl font-semibold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-600">
        The requested storefront resource does not exist or was moved.
      </p>
      <Link
        href="/"
        className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-900"
      >
        Return Home
      </Link>
    </main>
  );
}

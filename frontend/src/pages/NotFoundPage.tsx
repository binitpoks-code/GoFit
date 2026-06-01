import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center text-slate-950">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">404</p>
        <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
        <Link className="mt-6 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" to="/dashboard">
          Return to GoFit
        </Link>
      </section>
    </main>
  )
}

export default NotFoundPage

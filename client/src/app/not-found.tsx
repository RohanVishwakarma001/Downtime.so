import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-center px-4">
      <div>
        <p className="text-7xl font-extrabold text-primary mb-4">404</p>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-muted mb-6">The page you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors inline-block"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

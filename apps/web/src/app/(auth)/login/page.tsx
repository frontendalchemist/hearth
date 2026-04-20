import Link from 'next/link'
import type { Route } from 'next'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50">
      <div className="max-w-md w-full mx-auto p-8 text-center">
        <h1 className="font-serif text-4xl text-sage-700 mb-2">Hearth</h1>
        <p className="text-muted-foreground mb-8">
          Family caregiving, coordinated
        </p>
        <Link
          href={"/auth/login" as Route}
          className="inline-flex items-center justify-center rounded-md bg-sage-600 text-white px-8 py-3 text-base font-medium hover:bg-sage-700 transition-colors"
        >
          Sign in
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href={"/auth/login?screen_hint=signup" as Route}
            className="text-sage-600 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

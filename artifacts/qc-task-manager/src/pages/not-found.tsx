import { AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="panel w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]">
          <AlertCircle size={22} />
        </div>
        <p className="section-kicker">Signal lost</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-[-0.05em]">That page isn’t on the board.</h1>
        <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">The route may have moved or the task no longer exists.</p>
        <Link href="/" className="button-primary mt-6 inline-flex rounded-lg px-3.5 py-2.5 text-xs font-bold" data-testid="link-not-found-home">Return to overview</Link>
      </div>
    </div>
  );
}

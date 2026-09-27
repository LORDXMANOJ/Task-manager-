import { CalendarCheck, CheckCircle2, Filter, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { ThemeToggle } from "../components/ui/ThemeToggle";

const highlights = [
  { icon: CheckCircle2, text: "Plan, prioritise and finish your work in one place" },
  { icon: Filter, text: "Find anything instantly with search, filters and sorting" },
  { icon: CalendarCheck, text: "Never miss a deadline with due dates and overdue alerts" },
  { icon: Zap, text: "Live updates across every tab and device" },
];

interface AuthLayoutProps {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Split-screen layout for login/register/password pages. Brand panel hides on small screens. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh">
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-indigo-600 p-10 text-white lg:flex dark:bg-indigo-950">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(167,139,250,0.45) 0, transparent 45%)",
          }}
          aria-hidden
        />
        <Link to="/" className="relative inline-flex items-center gap-2.5 text-lg font-semibold">
          <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
            <rect width="32" height="32" rx="9" fill="white" fillOpacity="0.15" />
            <path d="M8.5 16.5l4.5 4.5 7-8" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 13h3.5" fill="none" stroke="#c7d2fe" strokeWidth="2.8" strokeLinecap="round" />
          </svg>
          TaskFlow
        </Link>

        <div className="relative">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Get more done,
            <br />
            with less stress.
          </h2>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-indigo-100">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="pt-0.5 text-sm leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-indigo-200">© {new Date().getFullYear()} TaskFlow</p>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link to="/" className="lg:invisible" aria-label="TaskFlow home">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="w-full max-w-sm animate-fade-in">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

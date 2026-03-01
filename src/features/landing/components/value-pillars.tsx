import { landingTheme, valuePillars } from "@/features/landing/config/theme";

export function ValuePillars() {
  return (
    <section
      aria-label="Platform highlights"
      className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-3"
    >
      {valuePillars.map(({ id, title, description, Icon }) => (
        <article
          key={id}
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.04)]"
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: landingTheme.color.softRuby }}
            >
              <Icon size={16} style={{ color: landingTheme.color.ruby }} aria-hidden />
            </span>
            <h2
              className="text-sm font-extrabold uppercase tracking-wide"
              style={{ color: landingTheme.color.espresso }}
            >
              {title}
            </h2>
          </div>
          <p className="text-xs leading-5" style={{ color: landingTheme.color.espressoMuted }}>
            {description}
          </p>
        </article>
      ))}
    </section>
  );
}

import type { Meta, StoryObj } from "@storybook/nextjs-vite"

// A living reference for the design tokens defined in src/app/globals.css.
// Swatches are filled from the CSS variables the @theme block generates, so
// what you see here is the exact value behind each Tailwind utility class.
// Prefer the SEMANTIC tokens (they flip correctly in dark mode); the raw
// hearth-* ramps are fixed values and do not adapt.

type Pair = { label: string; bg: string; fg: string; cls: string; use: string }
type Single = { label: string; v: string; cls: string; use: string }

const semantic: Pair[] = [
  {
    label: "primary",
    bg: "--color-primary",
    fg: "--color-primary-foreground",
    cls: "bg-primary / text-primary-foreground",
    use: "Primary CTAs, active nav item, key brand emphasis",
  },
  {
    label: "secondary",
    bg: "--color-secondary",
    fg: "--color-secondary-foreground",
    cls: "bg-secondary / text-secondary-foreground",
    use: "Secondary buttons, subtle neutral fills",
  },
  {
    label: "card",
    bg: "--color-card",
    fg: "--color-card-foreground",
    cls: "bg-card / text-card-foreground",
    use: "Raised surfaces — cards, panels",
  },
  {
    label: "popover",
    bg: "--color-popover",
    fg: "--color-popover-foreground",
    cls: "bg-popover / text-popover-foreground",
    use: "Floating layers — dropdowns, popovers, tooltips",
  },
  {
    label: "muted",
    bg: "--color-muted",
    fg: "--color-muted-foreground",
    cls: "bg-muted / text-muted-foreground",
    use: "Muted fills; text-muted-foreground for helper / secondary text",
  },
  {
    label: "accent",
    bg: "--color-accent",
    fg: "--color-accent-foreground",
    cls: "bg-accent / text-accent-foreground",
    use: "Hover states and subtle highlights",
  },
  {
    label: "destructive",
    bg: "--color-destructive",
    fg: "--color-destructive-foreground",
    cls: "bg-destructive / text-destructive-foreground",
    use: "Errors, delete / irreversible actions",
  },
  {
    label: "background",
    bg: "--color-background",
    fg: "--color-foreground",
    cls: "bg-background / text-foreground",
    use: "Page base surface + default body text",
  },
]

const singles: Single[] = [
  { label: "border", v: "--color-border", cls: "border-border", use: "Default borders (applied globally to *)" },
  { label: "input", v: "--color-input", cls: "border-input", use: "Form field borders" },
  { label: "ring", v: "--color-ring", cls: "ring-ring", use: "Focus rings" },
]

const sidebar: Pair[] = [
  {
    label: "sidebar",
    bg: "--color-sidebar",
    fg: "--color-sidebar-foreground",
    cls: "bg-sidebar / text-sidebar-foreground",
    use: "Sidebar surface + text",
  },
  {
    label: "sidebar-primary",
    bg: "--color-sidebar-primary",
    fg: "--color-sidebar-primary-foreground",
    cls: "bg-sidebar-primary / text-sidebar-primary-foreground",
    use: "Active / selected sidebar item",
  },
  {
    label: "sidebar-accent",
    bg: "--color-sidebar-accent",
    fg: "--color-sidebar-accent-foreground",
    cls: "bg-sidebar-accent / text-sidebar-accent-foreground",
    use: "Sidebar hover state",
  },
]

const ramps = ["hearth-cream", "hearth-orange", "hearth-brown", "hearth-muted"]
const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "1.25rem",
          marginBottom: "0.75rem",
          color: "var(--color-foreground)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function PairCard({ t }: { t: Pair }) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          background: `var(${t.bg})`,
          color: `var(${t.fg})`,
          padding: "1rem",
          minHeight: "72px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <strong>{t.label}</strong>
        <span style={{ fontSize: "0.9rem" }}>Aa — sample text</span>
      </div>
      <div style={{ padding: "0.6rem 0.75rem", background: "var(--color-card)" }}>
        <code style={{ fontSize: "0.72rem", color: "var(--color-foreground)" }}>{t.cls}</code>
        <p style={{ fontSize: "0.72rem", margin: "0.35rem 0 0", color: "var(--color-muted-foreground)" }}>
          {t.use}
        </p>
      </div>
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "0.75rem",
      }}
    >
      {children}
    </div>
  )
}

function TokenSheet() {
  return (
    <div
      style={{
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        fontFamily: "var(--font-sans)",
        padding: "2rem",
        minHeight: "100vh",
      }}
    >
      <Section title="Semantic colors — prefer these (dark-mode aware)">
        <Grid>
          {semantic.map((t) => (
            <PairCard key={t.label} t={t} />
          ))}
        </Grid>
      </Section>

      <Section title="Utility tokens (borders / focus)">
        <Grid>
          {singles.map((t) => (
            <div
              key={t.label}
              style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}
            >
              <div style={{ height: "56px", background: `var(${t.v})` }} />
              <div style={{ padding: "0.6rem 0.75rem", background: "var(--color-card)" }}>
                <code style={{ fontSize: "0.72rem" }}>{t.cls}</code>
                <p style={{ fontSize: "0.72rem", margin: "0.35rem 0 0", color: "var(--color-muted-foreground)" }}>
                  {t.use}
                </p>
              </div>
            </div>
          ))}
        </Grid>
      </Section>

      <Section title="Sidebar tokens">
        <Grid>
          {sidebar.map((t) => (
            <PairCard key={t.label} t={t} />
          ))}
        </Grid>
      </Section>

      <Section title="Raw ramps — fixed values, do NOT adapt to dark mode">
        {ramps.map((ramp) => (
          <div key={ramp} style={{ marginBottom: "1rem" }}>
            <code style={{ fontSize: "0.72rem", color: "var(--color-muted-foreground)" }}>{ramp}-*</code>
            <div style={{ display: "flex", marginTop: "0.35rem", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              {steps.map((step) => (
                <div
                  key={step}
                  title={`${ramp}-${step}`}
                  style={{
                    flex: 1,
                    height: "44px",
                    background: `var(--color-${ramp}-${step})`,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    fontSize: "0.6rem",
                    color: step >= 500 ? "white" : "black",
                    paddingBottom: "2px",
                  }}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Typography">
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "1.25rem" }}>
          font-sans — Inter. The quick brown fox jumps over the lazy dog.
        </p>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem" }}>
          font-serif — Lora. The quick brown fox jumps over the lazy dog.
        </p>
      </Section>

      <Section title="Radii">
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
          {[
            { cls: "rounded-sm", v: "var(--radius-sm)" },
            { cls: "rounded-md", v: "var(--radius-md)" },
            { cls: "rounded-lg", v: "var(--radius-lg)" },
          ].map((r) => (
            <div key={r.cls} style={{ textAlign: "center" }}>
              <div style={{ width: "72px", height: "72px", background: "var(--color-primary)", borderRadius: r.v }} />
              <code style={{ fontSize: "0.72rem" }}>{r.cls}</code>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

const meta: Meta = {
  title: "Design System/Tokens",
  parameters: { layout: "fullscreen" },
}
export default meta

type Story = StoryObj

export const Light: Story = {
  render: () => <TokenSheet />,
}

export const Dark: Story = {
  render: () => (
    <div className="dark">
      <TokenSheet />
    </div>
  ),
  parameters: { backgrounds: { default: "white" } },
}

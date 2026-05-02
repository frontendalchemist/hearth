import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Shell } from "../shell"
import { PageHeader } from "../page-header"

const StubSidebar = () => (
  <aside className="w-64 shrink-0 border-r border-border bg-card p-6">
    <p className="font-serif text-xl text-primary">Hearth</p>
    <p className="mt-6 text-sm text-muted-foreground">(sidebar contents)</p>
  </aside>
)

const meta: Meta<typeof Shell> = {
  component: Shell,
  title: "Shared/Shell",
  parameters: {
    layout: "fullscreen",
  },
}
export default meta

type Story = StoryObj<typeof Shell>

export const Default: Story = {
  args: {
    sidebar: <StubSidebar />,
    children: (
      <div>
        <PageHeader
          title="Document Vault"
          subtitle="Secure storage for your family's important documents."
        />
        <p className="text-muted-foreground">Page content goes here.</p>
      </div>
    ),
  },
}

export const WithHeader: Story = {
  args: {
    sidebar: <StubSidebar />,
    header: (
      <div className="flex h-14 items-center justify-between px-6">
        <span className="font-medium">Mom&apos;s care record</span>
        <span className="text-sm text-muted-foreground">whitney@example.com</span>
      </div>
    ),
    children: (
      <div>
        <PageHeader title="Document Vault" />
      </div>
    ),
  },
}

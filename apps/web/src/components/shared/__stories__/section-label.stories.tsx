import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SectionLabel } from "../section-label"

const meta: Meta<typeof SectionLabel> = {
  component: SectionLabel,
  title: "Shared/SectionLabel",
}
export default meta

type Story = StoryObj<typeof SectionLabel>

export const Default: Story = {
  args: { children: "Quick Actions" },
}

export const Reminders: Story = {
  args: { children: "Reminders & Alerts" },
}

export const AsH3: Story = {
  args: { as: "h3", children: "Recently Uploaded" },
}

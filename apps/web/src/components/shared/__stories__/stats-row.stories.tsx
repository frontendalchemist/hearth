import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { StatsRow } from "../stats-row"

const meta: Meta<typeof StatsRow> = {
  component: StatsRow,
  title: "Shared/StatsRow",
}
export default meta

type Story = StoryObj<typeof StatsRow>

export const Default: Story = {
  args: {
    stats: [
      { label: "Documents", value: 14 },
      { label: "Categories", value: 6 },
      { label: "Expiring", value: 2 },
    ],
  },
}

export const ManyStats: Story = {
  args: {
    stats: [
      { label: "Members", value: 4 },
      { label: "Tasks", value: 12 },
      { label: "Care log entries", value: 47 },
      { label: "Documents", value: 14 },
      { label: "Alerts", value: 3 },
    ],
  },
}

export const Single: Story = {
  args: {
    stats: [{ label: "Documents", value: 14 }],
  },
}

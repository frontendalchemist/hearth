import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import type { Route } from "next"
import { CareRecipientCard } from "../care-recipient-card"

const meta: Meta<typeof CareRecipientCard> = {
  component: CareRecipientCard,
  title: "Shared/CareRecipientCard",
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof CareRecipientCard>

const baseHref = "/care-recipients/mom" as Route

export const Default: Story = {
  args: {
    name: "Mom",
    relationship: "Mother",
    age: 78,
    stage: 2,
    alertCount: 0,
    href: baseHref,
  },
}

export const HighStage: Story = {
  args: {
    name: "Dad",
    relationship: "Father",
    age: 84,
    stage: 4,
    alertCount: 0,
    href: baseHref,
  },
}

export const MultipleAlerts: Story = {
  args: {
    name: "Mom",
    relationship: "Mother",
    age: 78,
    stage: 3,
    alertCount: 7,
    href: baseHref,
  },
}

export const EmptyAlerts: Story = {
  args: {
    name: "Aunt Lin",
    relationship: "Aunt",
    age: 71,
    stage: 1,
    alertCount: 0,
    href: baseHref,
  },
}

export const EndOfLifeStage: Story = {
  args: {
    name: "Grandpa",
    relationship: "Grandfather",
    age: 92,
    stage: 5,
    alertCount: 2,
    href: baseHref,
  },
}

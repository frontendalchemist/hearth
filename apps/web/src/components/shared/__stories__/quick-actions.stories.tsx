import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import type { Route } from "next"
import {
  FileText,
  ShieldAlert,
  Upload,
  Users,
} from "lucide-react"
import { QuickActions } from "../quick-actions"

const meta: Meta<typeof QuickActions> = {
  component: QuickActions,
  title: "Shared/QuickActions",
}
export default meta

type Story = StoryObj<typeof QuickActions>

const href = "/" as Route

export const TwoActions: Story = {
  args: {
    actions: [
      { label: "Emergency packet", icon: ShieldAlert, href, variant: "primary" },
      { label: "Upload document", icon: Upload, href },
    ],
  },
}

export const FourActions: Story = {
  args: {
    actions: [
      { label: "Emergency packet", icon: ShieldAlert, href, variant: "primary" },
      { label: "Upload document", icon: Upload, href },
      { label: "Invite member", icon: Users, href },
      { label: "View vault", icon: FileText, href },
    ],
  },
}

export const Mobile: Story = {
  args: {
    actions: [
      { label: "Emergency packet", icon: ShieldAlert, href, variant: "primary" },
      { label: "Upload document", icon: Upload, href },
      { label: "Invite member", icon: Users, href },
      { label: "View vault", icon: FileText, href },
    ],
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
}

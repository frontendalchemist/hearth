import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { AlertBanner } from "../alert-banner"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof AlertBanner> = {
  component: AlertBanner,
  title: "Shared/AlertBanner",
}
export default meta

type Story = StoryObj<typeof AlertBanner>

export const Info: Story = {
  args: {
    variant: "info",
    title: "New checklist item",
    description:
      "We've added a new recommended document for households with adult dependents.",
  },
}

export const Success: Story = {
  args: {
    variant: "success",
    title: "Packet sent",
    description:
      "The emergency packet was shared via the secure link.",
  },
}

export const Warning: Story = {
  args: {
    variant: "warning",
    title: "Document expiring",
    description: "Mom's healthcare proxy expires in 12 days.",
  },
}

export const ErrorVariant: Story = {
  name: "Error",
  args: {
    variant: "error",
    title: "Upload failed",
    description:
      "Couldn't reach the storage service. Check your connection and try again.",
  },
}

export const WithAction: Story = {
  args: {
    variant: "warning",
    title: "Missing healthcare proxy",
    description: "Mom doesn't have a healthcare proxy uploaded yet.",
    action: <Button size="sm">Upload now</Button>,
  },
}

export const Dismissible: Story = {
  args: {
    variant: "info",
    title: "Tip",
    description: "You can drag a file directly onto a category to upload.",
    onDismiss: () => {
      // no-op for story preview
    },
  },
}

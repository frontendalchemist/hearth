import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { FolderOpen } from "lucide-react"
import { EmptyState } from "../empty-state"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof EmptyState> = {
  component: EmptyState,
  title: "Shared/EmptyState",
}
export default meta

type Story = StoryObj<typeof EmptyState>

export const Default: Story = {
  args: { icon: FolderOpen, title: "No documents yet" },
}

export const WithDescription: Story = {
  args: {
    icon: FolderOpen,
    title: "No documents yet",
    description: "Upload your first document to start building Mom's vault.",
  },
}

export const WithAction: Story = {
  args: {
    icon: FolderOpen,
    title: "No documents yet",
    description: "Upload your first document to start building Mom's vault.",
    action: <Button>Upload a document</Button>,
  },
}

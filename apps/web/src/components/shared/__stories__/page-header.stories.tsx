import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Plus } from "lucide-react"
import { PageHeader } from "../page-header"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof PageHeader> = {
  component: PageHeader,
  title: "Shared/PageHeader",
}
export default meta

type Story = StoryObj<typeof PageHeader>

export const Default: Story = {
  args: { title: "Document Vault" },
}

export const WithSubtitle: Story = {
  args: {
    title: "Document Vault",
    subtitle:
      "Secure, role-scoped storage for your family's important documents.",
  },
}

export const WithActions: Story = {
  args: {
    title: "Document Vault",
    subtitle:
      "Secure, role-scoped storage for your family's important documents.",
    actions: (
      <Button>
        <Plus className="h-4 w-4" />
        Upload
      </Button>
    ),
  },
}

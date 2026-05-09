// @vitest-environment happy-dom
import type { Route } from "next"
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { Heart } from "lucide-react"
import { CareModuleTile } from "./care-module-tile"

afterEach(() => {
  cleanup()
})

describe("CareModuleTile", () => {
  it("renders an active tile as a navigable link with no Coming Soon badge", () => {
    render(
      <CareModuleTile
        status="active"
        href={"/recipients/cr-1/workspace" as Route}
        title="Family Workspace"
        description="Tasks and care log"
        icon={Heart}
      />,
    )

    const link = screen.getByRole("link", { name: /open family workspace/i })
    expect(link).toHaveAttribute("href", "/recipients/cr-1/workspace")
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
  })

  it("renders a coming-soon tile without a link and with the locked badge", () => {
    render(
      <CareModuleTile
        status="coming-soon"
        title="Health Hub"
        description="Medications, appointments"
        icon={Heart}
      />,
    )

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
  })
})

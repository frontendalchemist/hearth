// @vitest-environment happy-dom
import type { Route } from "next"
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { Breadcrumb } from "./breadcrumb"

afterEach(() => {
  cleanup()
})

describe("Breadcrumb", () => {
  it("renders intermediate items as links and the last item as a non-link page marker", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/dashboard" as Route },
          { label: "Margaret Lee" },
        ]}
      />,
    )

    const home = screen.getByRole("link", { name: "Home" })
    expect(home).toHaveAttribute("href", "/dashboard")

    const current = screen.getByText("Margaret Lee")
    expect(current).toHaveAttribute("aria-current", "page")
    expect(current.tagName).toBe("SPAN")
  })

  it("exposes the breadcrumb landmark for assistive tech", () => {
    render(<Breadcrumb items={[{ label: "Home" }]} />)
    expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeInTheDocument()
  })
})

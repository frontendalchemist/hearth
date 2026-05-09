// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CareRecordPage } from "./care-record-page"
import type { CareRecipient } from "@/lib/graphql/queries/care-recipients"

afterEach(() => {
  cleanup()
})

vi.mock("@/lib/graphql/client", () => ({
  graphqlFetch: vi.fn(),
  GraphQLClientError: class GraphQLClientError extends Error {},
}))

import { graphqlFetch } from "@/lib/graphql/client"

const mockFetch = vi.mocked(graphqlFetch)

function renderWithClient(ui: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const margaret: CareRecipient = {
  id: "cr-1",
  firstName: "Margaret",
  lastName: "Lee",
  dateOfBirth: "1948-06-15T00:00:00.000Z",
  careStage: "STAGE_4_MEMORY_CARE",
  photoUrl: null,
  relationship: "mother",
  age: 77,
}

describe("CareRecordPage", () => {
  it("renders the recipient header with name, relationship, age, and stage badge", async () => {
    mockFetch.mockResolvedValueOnce({ careRecipient: margaret })

    renderWithClient(<CareRecordPage id="cr-1" />)

    expect(
      await screen.findByRole("heading", { level: 1, name: "Margaret Lee" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/mother · age 77/i)).toBeInTheDocument()
    expect(screen.getByText(/Stage 4 · Daily care/i)).toBeInTheDocument()
  })

  it("renders the breadcrumb with a Home link and the recipient as the current page", async () => {
    mockFetch.mockResolvedValueOnce({ careRecipient: margaret })

    renderWithClient(<CareRecordPage id="cr-1" />)

    const home = await screen.findByRole("link", { name: "Home" })
    expect(home).toHaveAttribute("href", "/dashboard")
    expect(
      screen.getByText("Margaret Lee", { selector: '[aria-current="page"]' }),
    ).toBeInTheDocument()
  })

  it("renders the Needs Attention empty state", async () => {
    mockFetch.mockResolvedValueOnce({ careRecipient: margaret })

    renderWithClient(<CareRecordPage id="cr-1" />)

    expect(
      await screen.findByText(/no urgent items right now/i),
    ).toBeInTheDocument()
  })

  it("renders quick action buttons including a personalized Ask AI", async () => {
    mockFetch.mockResolvedValueOnce({ careRecipient: margaret })

    renderWithClient(<CareRecordPage id="cr-1" />)

    expect(
      await screen.findByRole("link", { name: /emergency share packet/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /share care summary/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /ask ai about margaret/i }),
    ).toBeInTheDocument()
  })

  it("renders the care modules grid with Family Workspace active and others coming soon", async () => {
    mockFetch.mockResolvedValueOnce({ careRecipient: margaret })

    renderWithClient(<CareRecordPage id="cr-1" />)

    const workspace = await screen.findByRole("link", {
      name: /open family workspace/i,
    })
    expect(workspace).toHaveAttribute("href", "/recipients/cr-1/workspace")

    expect(screen.getByText("Health Hub")).toBeInTheDocument()
    expect(screen.getByText("Care Finder")).toBeInTheDocument()
    expect(screen.getByText("Money & Coverage")).toBeInTheDocument()
    expect(screen.getByText("Stage Navigator")).toBeInTheDocument()
    // Each greyed-out module renders a "Coming soon" badge.
    expect(screen.getAllByText(/coming soon/i)).toHaveLength(4)
  })

  it("renders the not-found state when the resolver returns null (no membership)", async () => {
    mockFetch.mockResolvedValueOnce({ careRecipient: null })

    renderWithClient(<CareRecordPage id="cr-missing" />)

    expect(
      await screen.findByText(/care record not found/i),
    ).toBeInTheDocument()
  })

  it("renders an error fallback with retry when the query fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("offline"))

    renderWithClient(<CareRecordPage id="cr-1" />)

    expect(
      await screen.findByText(/couldn't load this care record/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument()
  })

  it("renders the loading skeleton while the query is pending", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    const { container } = renderWithClient(<CareRecordPage id="cr-1" />)

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it("falls back to 'Care recipient' when the membership has no relationship label", async () => {
    mockFetch.mockResolvedValueOnce({
      careRecipient: { ...margaret, relationship: null },
    })

    renderWithClient(<CareRecordPage id="cr-1" />)

    expect(
      await screen.findByText(/care recipient · age 77/i),
    ).toBeInTheDocument()
  })
})

// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HomeRecipientList } from "./home-recipient-list"
import type { CareRecipient } from "@/lib/graphql/queries/care-recipients"

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
  careStage: "STAGE_2_SOME_HELP",
  photoUrl: null,
  relationship: "mother",
  age: 77,
  activeAlertCount: 0,
}

const harold: CareRecipient = {
  id: "cr-2",
  firstName: "Harold",
  lastName: "Reyes",
  dateOfBirth: null,
  careStage: "STAGE_4_MEMORY_CARE",
  photoUrl: null,
  relationship: "father-in-law",
  age: 89,
  activeAlertCount: 0,
}

describe("HomeRecipientList", () => {
  it("renders a card per recipient with name, relationship, age, and stage label", async () => {
    mockFetch.mockResolvedValueOnce({ careRecipients: [margaret, harold] })

    renderWithClient(<HomeRecipientList />)

    expect(await screen.findByText("Margaret Lee")).toBeInTheDocument()
    expect(screen.getByText(/mother · age 77/i)).toBeInTheDocument()
    expect(screen.getByText(/Stage 2/)).toBeInTheDocument()

    expect(screen.getByText("Harold Reyes")).toBeInTheDocument()
    expect(screen.getByText(/father-in-law · age 89/i)).toBeInTheDocument()
    expect(screen.getByText(/Stage 4/)).toBeInTheDocument()
  })

  it("each card links to /recipients/[id]", async () => {
    mockFetch.mockResolvedValueOnce({ careRecipients: [margaret] })

    renderWithClient(<HomeRecipientList />)

    const link = await screen.findByRole("link", {
      name: /open care record for Margaret Lee/i,
    })
    expect(link).toHaveAttribute("href", "/recipients/cr-1")
  })

  it("renders the empty state with a CTA when no recipients exist", async () => {
    mockFetch.mockResolvedValueOnce({ careRecipients: [] })

    renderWithClient(<HomeRecipientList />)

    expect(await screen.findByText(/no care recipients yet/i)).toBeInTheDocument()
    const cta = screen.getByRole("link", { name: /add a care recipient/i })
    expect(cta).toHaveAttribute("href", "/onboarding")
  })

  it("renders the loading skeleton while the query is pending", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    const { container } = renderWithClient(<HomeRecipientList />)

    const busy = container.querySelector('[aria-busy="true"]')
    expect(busy).not.toBeNull()
  })

  it("renders an error fallback with a retry button when the query fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("offline"))

    renderWithClient(<HomeRecipientList />)

    expect(
      await screen.findByText(/couldn't load your care recipients/i),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
  })

  it("falls back to 'Care recipient' when the membership has no relationship label", async () => {
    mockFetch.mockResolvedValueOnce({
      careRecipients: [{ ...margaret, relationship: null }],
    })

    renderWithClient(<HomeRecipientList />)

    expect(await screen.findByText(/care recipient · age 77/i)).toBeInTheDocument()
  })
})

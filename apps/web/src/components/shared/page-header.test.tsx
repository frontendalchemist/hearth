// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHeader } from './page-header'

describe('PageHeader', () => {
  it('renders the title as a level-1 heading', () => {
    render(<PageHeader title="Document Vault" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Document Vault',
    )
  })

  it('omits the subtitle and actions slots when not provided', () => {
    const { container } = render(<PageHeader title="Vault" />)
    expect(container.querySelectorAll('p')).toHaveLength(0)
    // Only the title wrapper should exist — no actions <div>.
    expect(container.querySelectorAll('div')).toHaveLength(1)
  })

  it('renders subtitle and actions slots when provided', () => {
    render(
      <PageHeader
        title="Vault"
        subtitle="3 documents need attention"
        actions={<button>Upload</button>}
      />,
    )
    expect(screen.getByText('3 documents need attention')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
  })

  it('forwards extra HTML attributes onto the <header> element', () => {
    render(<PageHeader title="Vault" data-testid="vault-header" />)
    expect(screen.getByTestId('vault-header').tagName).toBe('HEADER')
  })
})

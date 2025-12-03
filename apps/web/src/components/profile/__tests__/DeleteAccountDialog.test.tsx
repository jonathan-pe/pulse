import { render, screen, fireEvent } from '@testing-library/react'
import { DeleteAccountDialog } from '../DeleteAccountDialog'
import { vi } from 'vitest'

describe('DeleteAccountDialog', () => {
  it('renders trigger button and dialog content', () => {
    render(<DeleteAccountDialog isDeleting={false} onConfirm={() => {}} />)
    const trigger = screen.getByRole('button', { name: /delete account/i })
    expect(trigger).toBeInTheDocument()
  })

  it('calls onConfirm when action clicked', async () => {
    const onConfirm = vi.fn()
    render(<DeleteAccountDialog isDeleting={false} onConfirm={onConfirm} />)

    // Open dialog
    const trigger = screen.getByRole('button', { name: /delete account/i })
    fireEvent.click(trigger)

    // Click confirm
    const confirm = await screen.findByRole('button', { name: /yes, delete my account/i })
    fireEvent.click(confirm)

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('disables buttons while deleting', () => {
    render(<DeleteAccountDialog isDeleting={true} onConfirm={() => {}} />)

    const trigger = screen.getByRole('button', { name: /delete account/i })
    expect(trigger).toBeDisabled()
  })
})

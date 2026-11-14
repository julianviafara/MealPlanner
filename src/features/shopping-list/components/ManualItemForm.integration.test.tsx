import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ManualItemForm } from './ManualItemForm'

describe('manual shopping item form', () => {
  it('requires a name and submits a trimmed name with an optional note', () => {
    const onSave = vi.fn()
    render(<ManualItemForm saving={false} onSave={onSave} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))
    expect(screen.getByText('Enter an item name.')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Item name'), { target: { value: '  Coffee  ' } })
    fireEvent.change(screen.getByLabelText('Quantity or note (optional)'), { target: { value: '  1 bag ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))
    expect(onSave).toHaveBeenCalledWith('Coffee', '1 bag')
  })
})

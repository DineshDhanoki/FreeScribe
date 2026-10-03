import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Header from './Header'

describe('Header navigation', () => {
  it('resets the current workspace without reloading the document', () => {
    const onNewProject = vi.fn()
    render(<Header onSelectProject={vi.fn()} onNewProject={onNewProject} />)

    fireEvent.click(screen.getByRole('button', { name: /new/i }))

    expect(onNewProject).toHaveBeenCalledOnce()
  })
})

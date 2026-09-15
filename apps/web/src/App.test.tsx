import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(cleanup)

describe('city-first climate experience', () => {
  it('starts without a bundled city database', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Start with a city.' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Climate controls')).not.toBeInTheDocument()
  })

  it('opens city search from the top magnifier', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Search city' }))
    expect(screen.getByRole('dialog', { name: 'Search for a city' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'City name' })).toHaveFocus()
  })
})

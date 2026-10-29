import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TestSummaryChart from './TestSummaryChart'
import React from 'react'

describe('TestSummaryChart', () => {
  it('should render the statistics title', () => {
    render(<TestSummaryChart passed={80} failed={20} total={100} />)
    expect(screen.getByText("Statistiques d'automatisation")).toBeInTheDocument()
  })

  it('should render the total count', () => {
    render(<TestSummaryChart passed={80} failed={20} total={100} />)
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('should render the values and percentages', () => {
    render(<TestSummaryChart passed={80} failed={20} total={100} />)
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
  })
})

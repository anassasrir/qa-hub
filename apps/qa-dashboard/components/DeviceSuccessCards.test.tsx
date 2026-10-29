import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DeviceSuccessCards from './DeviceSuccessCards'
import React from 'react'
import { TestData } from '../lib/utils'

describe('DeviceSuccessCards', () => {
  it('should render all devices', () => {
    render(<DeviceSuccessCards tests={[]} />)
    expect(screen.getByText('Chrome')).toBeInTheDocument()
    expect(screen.getByText('Firefox')).toBeInTheDocument()
    expect(screen.getByText('Safari')).toBeInTheDocument()
    expect(screen.getByText('iPhone')).toBeInTheDocument()
    expect(screen.getByText('Android')).toBeInTheDocument()
  })

  it('should calculate percentages correctly', () => {
    const mockTests: TestData[] = [
      { project: 'chrome', status: 'passed', title: '', suite: '', duration: 0, file: '', results: [] },
      { project: 'chrome', status: 'failed', title: '', suite: '', duration: 0, file: '', results: [] },
      { project: 'firefox', status: 'passed', title: '', suite: '', duration: 0, file: '', results: [] },
      { project: 'iphone', status: 'passed', title: '', suite: '', duration: 0, file: '', results: [] },
      { project: 'iphone', status: 'passed', title: '', suite: '', duration: 0, file: '', results: [] },
    ]
    render(<DeviceSuccessCards tests={mockTests} />)

    // Chrome: 1/2 = 50%
    expect(screen.getByText('50%')).toBeInTheDocument()
    // Firefox: 1/1 = 100%
    expect(screen.getAllByText('100%')[0]).toBeInTheDocument()
  })
})
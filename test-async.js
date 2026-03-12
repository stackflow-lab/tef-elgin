// Teste rápido de async/await com mocks
import { vi } from 'vitest'

const mockFn = vi.fn()
  .mockResolvedValueOnce('first')
  .mockResolvedValueOnce('second')

console.log('Calling first time...')
const result1 = mockFn()
console.log('First call returned:', result1)
console.log('Is promise?', result1 instanceof Promise)

const awaited1 = await result1
console.log('Awaited result 1:', awaited1)

const result2 = mockFn()
const awaited2 = await result2
console.log('Awaited result 2:', awaited2)

import { describe, expect, it, vi } from 'vitest'
import { createWorkerClient } from './workerClient'

function createFakeWorker() {
  const listeners = { message: new Set(), error: new Set() }
  return {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: (type, listener) => listeners[type].add(listener),
    removeEventListener: (type, listener) => listeners[type].delete(listener),
    emit: (type, value) => listeners[type].forEach((listener) => listener(value)),
  }
}

describe('worker client', () => {
  it('routes messages and supports cleanup', () => {
    const worker = createFakeWorker()
    const client = createWorkerClient(worker)
    const listener = vi.fn()
    client.subscribe(listener)
    client.send({ type: 'PING' })
    worker.emit('message', { data: { type: 'PONG' } })
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'PING' }, [])
    expect(listener).toHaveBeenCalledWith({ type: 'PONG' })
    client.terminate()
    expect(worker.terminate).toHaveBeenCalled()
  })

  it('routes worker failures separately', () => {
    const worker = createFakeWorker()
    const client = createWorkerClient(worker)
    const listener = vi.fn()
    client.onError(listener)
    const error = new Error('worker failed')
    worker.emit('error', error)
    expect(listener).toHaveBeenCalledWith(error)
  })

  it('supports transferable payloads for large audio buffers', () => {
    const worker = createFakeWorker()
    const client = createWorkerClient(worker)
    const buffer = new ArrayBuffer(8)
    client.send({ type: 'AUDIO' }, [buffer])
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'AUDIO' }, [buffer])
  })
})

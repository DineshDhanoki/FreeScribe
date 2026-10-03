export function createWorkerClient(worker) {
  const messageListeners = new Set()
  const errorListeners = new Set()

  const handleMessage = (event) => {
    messageListeners.forEach((listener) => listener(event.data))
  }
  const handleError = (event) => {
    errorListeners.forEach((listener) => listener(event))
  }

  worker.addEventListener('message', handleMessage)
  worker.addEventListener('error', handleError)

  return {
    subscribe(listener) {
      messageListeners.add(listener)
      return () => messageListeners.delete(listener)
    },
    onError(listener) {
      errorListeners.add(listener)
      return () => errorListeners.delete(listener)
    },
    send(message, transferables) {
      worker.postMessage(message, transferables || [])
    },
    terminate() {
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
      messageListeners.clear()
      errorListeners.clear()
      worker.terminate()
    },
  }
}


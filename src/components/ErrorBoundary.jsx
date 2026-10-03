import { Component } from 'react'
import PropTypes from 'prop-types'

export default class ErrorBoundary extends Component {
    static propTypes = {
        children: PropTypes.node.isRequired,
    }

    state = { hasError: false }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    render() {
        if (this.state.hasError) {
            return (
                <main className='flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center'>
                    <h1 className='font-semibold text-4xl'>FreeScribe needs to restart</h1>
                    <p className='text-slate-500'>The interface encountered an unexpected error. Your locally saved projects were not deleted.</p>
                    <button onClick={() => window.location.reload()} className='specialBtn rounded-lg px-3 py-2 text-blue-400'>Reload application</button>
                </main>
            )
        }

        return this.props.children
    }
}


import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { clearProjects, deleteProject, listProjects, saveProject } from '../services/storage/projectStore'
import { clearModelCaches } from '../services/models/modelCache'
import { parseProjectTransfer, serializeProject } from '../services/storage/projectTransfer'

export default function ProjectLibrary({ onSelectProject }) {
    const [projects, setProjects] = useState([])
    const [error, setError] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [deletingAll, setDeletingAll] = useState(false)
    const [loading, setLoading] = useState(false)
    const [clearingCache, setClearingCache] = useState(false)
    const [cacheMessage, setCacheMessage] = useState(null)
    const [transferMessage, setTransferMessage] = useState(null)
    const importInput = useRef(null)

    async function handleToggle(event) {
        if (!event.currentTarget.open) return
        try {
            setLoading(true)
            setError(null)
            setProjects(await listProjects())
        } catch (loadError) {
            console.error(loadError)
            setError('Local projects are unavailable in this browser.')
        } finally {
            setLoading(false)
        }
    }

    function handleSelect(event, project) {
        onSelectProject(project)
        const details = event.currentTarget.closest('details')
        if (details) {
            details.open = false
            details.querySelector('summary')?.focus()
        }
    }

    async function handleDelete(event, project) {
        event.stopPropagation()
        setDeletingId(project.id)
        try {
            await deleteProject(project.id)
            setProjects((current) => current.filter((item) => item.id !== project.id))
        } catch (deleteError) {
            console.error(deleteError)
            setError('Could not delete this local project.')
        } finally {
            setDeletingId(null)
        }
    }

    async function handleDeleteAll() {
        if (!globalThis.confirm?.('Delete all locally saved projects? This cannot be undone.')) return
        setDeletingAll(true)
        try {
            await clearProjects()
            setProjects([])
        } catch (clearError) {
            console.error(clearError)
            setError('Could not delete local projects.')
        } finally {
            setDeletingAll(false)
        }
    }

    async function handleClearModelCache() {
        if (!globalThis.confirm?.('Clear downloaded model files from this browser? They will be downloaded again when needed.')) return
        setClearingCache(true)
        setCacheMessage(null)
        try {
            const results = await clearModelCaches()
            const filesDeleted = results.reduce((total, item) => total + (item.result?.filesDeleted || 0), 0)
            const failures = results.filter((item) => item.error).length
            setCacheMessage(failures
                ? `Cleared ${filesDeleted} cached model files; ${failures} model cache entries could not be cleared.`
                : filesDeleted ? `Cleared ${filesDeleted} cached model files.` : 'No cached model files were found.')
        } catch (cacheError) {
            console.error(cacheError)
            setCacheMessage('Could not clear the model cache in this browser.')
        } finally {
            setClearingCache(false)
        }
    }

    function handleExportProject(event, project) {
        event.stopPropagation()
        const file = new Blob([serializeProject(project)], { type: 'application/json' })
        const element = document.createElement('a')
        element.href = URL.createObjectURL(file)
        element.download = 'freescribe-project.json'
        document.body.appendChild(element)
        element.click()
        URL.revokeObjectURL(element.href)
        element.remove()
        setTransferMessage('Project backup exported. Audio is not included.')
    }

    async function handleImportProject(event) {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        try {
            const project = parseProjectTransfer(await file.text())
            await saveProject(project)
            setProjects(await listProjects())
            setTransferMessage('Project backup imported as a new local project.')
        } catch (importError) {
            console.error(importError)
            setTransferMessage(importError.message || 'Could not import project backup.')
        }
    }

    return (
        <details onToggle={handleToggle} className='relative'>
            <summary aria-label='Open saved projects' className='cursor-pointer list-none rounded-lg bg-white px-3 py-2 text-sm text-blue-400'>Projects</summary>
            <div className='absolute right-0 z-10 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 text-left shadow-lg'>
                <input ref={importInput} type='file' accept='application/json,.json' onChange={handleImportProject} className='hidden' />
                <button aria-label='Import project backup' onClick={() => importInput.current?.click()} className='mb-1 w-full border-b border-slate-100 p-2 text-left text-xs text-slate-500 hover:bg-blue-50'>Import project backup</button>
                <button aria-label='Clear downloaded model files' disabled={clearingCache} onClick={handleClearModelCache} className='mb-1 w-full border-b border-slate-100 p-2 text-left text-xs text-slate-500 hover:bg-blue-50 disabled:opacity-50'>
                    {clearingCache ? 'Clearing model cache…' : 'Clear downloaded model files'}
                </button>
                {cacheMessage && <p role='status' className='p-2 text-xs text-slate-500'>{cacheMessage}</p>}
                {transferMessage && <p role='status' className='p-2 text-xs text-slate-500'>{transferMessage}</p>}
                {loading && <p role='status' className='p-2 text-xs text-slate-500'>Loading projects…</p>}
                {error && <p className='p-2 text-xs text-rose-500'>{error}</p>}
                {!loading && !error && projects.length === 0 && <p className='p-2 text-xs text-slate-500'>No saved projects yet.</p>}
                {!loading && !error && projects.length > 0 && <button aria-label='Delete all saved projects' disabled={deletingAll || Boolean(deletingId)} onClick={handleDeleteAll} className='mb-1 w-full border-b border-slate-100 p-2 text-left text-xs text-rose-500 hover:bg-rose-50 disabled:opacity-50'>
                    {deletingAll ? 'Deleting all…' : 'Delete all saved projects'}
                </button>}
                {!loading && projects.map((project) => (
                    <div key={project.id} className='flex items-start gap-1 rounded hover:bg-blue-50'>
                        <button onClick={(event) => handleSelect(event, project)} className='min-w-0 flex-1 truncate p-2 text-left text-sm'>
                            {project.name || 'Untitled transcript'}
                            <span className='block text-xs text-slate-400'>{new Date(project.updatedAt).toLocaleString()}</span>
                        </button>
                        <button aria-label={`Delete ${project.name || 'project'}`} disabled={deletingId === project.id} onClick={(event) => handleDelete(event, project)} className='p-2 text-xs text-slate-400 hover:text-rose-500 disabled:opacity-50'>
                            Delete
                        </button>
                        <button aria-label={`Export ${project.name || 'project'}`} onClick={(event) => handleExportProject(event, project)} className='p-2 text-xs text-slate-400 hover:text-blue-500'>
                            Export
                        </button>
                    </div>
                ))}
            </div>
        </details>
    )
}

ProjectLibrary.propTypes = {
    onSelectProject: PropTypes.func.isRequired,
}

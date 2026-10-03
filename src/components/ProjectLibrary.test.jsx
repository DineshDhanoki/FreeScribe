import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ProjectLibrary from './ProjectLibrary'
import { deleteProject, listProjects, saveProject } from '../services/storage/projectStore'
import { clearModelCaches } from '../services/models/modelCache'

vi.mock('../services/models/modelCache', () => ({
  clearModelCaches: vi.fn(),
}))

describe('ProjectLibrary component', () => {
  beforeEach(async () => {
    const projects = await listProjects()
    await Promise.all(projects.map((project) => deleteProject(project.id)))
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('loads a saved project and exposes it to the parent', async () => {
    const project = await saveProject({ name: 'Saved transcript', segments: [] })
    const onSelectProject = vi.fn()
    render(<ProjectLibrary onSelectProject={onSelectProject} />)

    fireEvent.click(screen.getByText('Projects'))
    await waitFor(() => expect(screen.getByText('Saved transcript')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Saved transcript'))
    expect(onSelectProject).toHaveBeenCalledWith(expect.objectContaining({ id: project.id }))
    expect(screen.getByText('Projects').closest('details')).not.toHaveAttribute('open')
    expect(screen.getByText('Projects')).toHaveFocus()
  })

  it('deletes a saved project from the local library', async () => {
    const project = await saveProject({ name: 'Delete me', segments: [] })
    render(<ProjectLibrary onSelectProject={vi.fn()} />)
    fireEvent.click(screen.getByText('Projects'))
    await waitFor(() => expect(screen.getByText('Delete me')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Delete Delete me' }))
    await waitFor(() => expect(screen.queryByText('Delete me')).not.toBeInTheDocument())
    expect(await listProjects()).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: project.id })]))
  })

  it('exposes project backup import and export controls', async () => {
    await saveProject({ name: 'Portable project', segments: [] })
    render(<ProjectLibrary onSelectProject={vi.fn()} />)
    fireEvent.click(screen.getByText('Projects'))
    await waitFor(() => expect(screen.getByText('Portable project')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Import project backup' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export Portable project' })).toBeInTheDocument()
  })

  it('clears all projects only after explicit confirmation', async () => {
    await saveProject({ name: 'First', segments: [] })
    await saveProject({ name: 'Second', segments: [] })
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    render(<ProjectLibrary onSelectProject={vi.fn()} />)
    fireEvent.click(screen.getByText('Projects'))
    await waitFor(() => expect(screen.getByText('First')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Delete all saved projects' }))
    await waitFor(() => expect(screen.getByText('No saved projects yet.')).toBeInTheDocument())
    expect(globalThis.confirm).toHaveBeenCalledOnce()
    expect(await listProjects()).toEqual([])
  })

  it('clears downloaded model files only after explicit confirmation', async () => {
    clearModelCaches.mockResolvedValue([{ result: { filesDeleted: 3 } }])
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    render(<ProjectLibrary onSelectProject={vi.fn()} />)
    fireEvent.click(screen.getByText('Projects'))
    fireEvent.click(screen.getByRole('button', { name: 'Clear downloaded model files' }))

    await waitFor(() => expect(screen.getByText('Cleared 3 cached model files.')).toBeInTheDocument())
    expect(clearModelCaches).toHaveBeenCalledOnce()
    expect(globalThis.confirm).toHaveBeenCalledWith(expect.stringContaining('Clear downloaded model files'))
  })
})

import PropTypes from 'prop-types'
import ProjectLibrary from './ProjectLibrary'

export default function Header({ onSelectProject, onNewProject, theme = 'light', onToggleTheme = () => {} }) {
    function handleNewProject(event) {
        event.preventDefault()
        event.stopPropagation()
        onNewProject()
    }

    return (
        <header className='app-header'>
            <a href='/' className='brand' aria-label='FreeScribe home'>
                <span className='brand-mark' aria-hidden='true'><i className='fa-solid fa-wave-square'></i></span>
                <span className='brand-name'>Free<span>Scribe</span></span>
            </a>
            <div className='header-actions'>
                <ProjectLibrary onSelectProject={onSelectProject} />
                <button
                    onClick={onToggleTheme}
                    className='btn-secondary theme-toggle'
                    type='button'
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    aria-pressed={theme === 'dark'}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} aria-hidden='true'></i>
                    <span className='button-label'>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                </button>
                <button onClick={handleNewProject} className='btn-primary' type='button' aria-label='Start a new project'>
                    <i className='fa-solid fa-plus' aria-hidden='true'></i>
                    <span className='button-label'>New project</span>
                </button>
            </div>
        </header>
    )
}

Header.propTypes = {
    onSelectProject: PropTypes.func.isRequired,
    onNewProject: PropTypes.func.isRequired,
    theme: PropTypes.oneOf(['light', 'dark']),
    onToggleTheme: PropTypes.func,
}

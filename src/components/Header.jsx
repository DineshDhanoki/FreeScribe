import PropTypes from 'prop-types'
import ProjectLibrary from './ProjectLibrary'

export default function Header({ onSelectProject, onNewProject }) {
    return (
        <header className='app-header'>
            <a href='/' className='brand' aria-label='FreeScribe home'>
                <span className='brand-mark' aria-hidden='true'><i className='fa-solid fa-wave-square'></i></span>
                <span className='brand-name'>Free<span>Scribe</span></span>
            </a>
            <div className='header-actions'>
                <ProjectLibrary onSelectProject={onSelectProject} />
                <button onClick={onNewProject} className='btn-primary'>
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
}

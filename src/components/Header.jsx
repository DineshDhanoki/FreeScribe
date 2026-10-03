import PropTypes from 'prop-types'
import ProjectLibrary from './ProjectLibrary'

export default function Header({ onSelectProject, onNewProject }) {
    return (
        <header className='flex items-center justify-between gap-4 p-4'>
            <a href="/"><h1 className='font-medium'>Free<span className='text-blue-400 bold'>Scribe</span></h1></a>
            <div className='gap-4 flex items-center '>
                <ProjectLibrary onSelectProject={onSelectProject} />
                <button onClick={onNewProject} className='flex items-center gap-2 specialBtn px-3 py-2 rounded-lg text-blue-400'>
                    <p>New</p>
                    <i className="fa-solid fa-plus"></i>
                </button>
            </div>
        </header>
    )
}

Header.propTypes = {
    onSelectProject: PropTypes.func.isRequired,
    onNewProject: PropTypes.func.isRequired,
}

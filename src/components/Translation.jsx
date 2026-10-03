import PropTypes from 'prop-types'
import { LANGUAGES } from '../utils/presets'

export default function Translation(props) {
    const { textElement, toLanguage, translating, translationProgress, translationError, setToLanguage, generateTranslation, cancelTranslation } = props
    return (
        <>
            {(textElement && !translating) && (
                <p>{textElement}</p>
            )}
            {translationError && <p className='text-rose-500'>{translationError}</p>}
            {translating && <>
                {typeof translationProgress === 'number' && <div role='progressbar' aria-label='Translation model progress' aria-valuemin='0' aria-valuemax='100' aria-valuenow={Math.round(translationProgress)} className='text-sm text-slate-500'>{Math.round(translationProgress)}%</div>}
                <button onClick={cancelTranslation} className='text-sm text-slate-500 hover:text-blue-600'>Cancel translation</button>
            </>}
            {!translating && (<div className='flex flex-col gap-1 mb-4'>
                <p className='text-xs sm:text-sm font-medium text-slate-500 mr-auto'>To language</p>
                <div className='flex items-stretch gap-2 sm:gap-4' >
                    <select aria-label='Translation target language' value={toLanguage} className='flex-1 outline-none w-full focus:outline-none bg-white duration-200 p-2  rounded' onChange={(e) => setToLanguage(e.target.value)}>
                        <option value={'Select language'}>Select language</option>
                        {Object.entries(LANGUAGES).map(([key, value]) => {
                            return (
                                <option key={key} value={value}>{key}</option>
                            )
                        })}

                    </select>
                    <button onClick={generateTranslation} disabled={toLanguage === 'Select language'} className='specialBtn px-3 py-2 rounded-lg text-blue-400 hover:text-blue-600 duration-200 disabled:cursor-not-allowed disabled:opacity-50'>Translate</button>
                </div>
            </div>)}
        </>
    )
}

Translation.propTypes = {
    textElement: PropTypes.node,
    toLanguage: PropTypes.string.isRequired,
    translating: PropTypes.bool,
    translationProgress: PropTypes.number,
    setToLanguage: PropTypes.func.isRequired,
    generateTranslation: PropTypes.func.isRequired,
    cancelTranslation: PropTypes.func.isRequired,
    translationError: PropTypes.string,
}

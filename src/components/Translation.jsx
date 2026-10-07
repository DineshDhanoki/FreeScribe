import PropTypes from 'prop-types'
import { LANGUAGES } from '../utils/presets'

export default function Translation(props) {
    const { textElement, toLanguage, translating, translationProgress, translationError, setToLanguage, generateTranslation, cancelTranslation } = props
    return (
        <div className='translation-view'>
            {(textElement && !translating) && (
                <div className='translation-copy'>{textElement}</div>
            )}
            {!textElement && !translating && !translationError && (
                <div className='translation-empty'>
                    <i className='fa-solid fa-language' aria-hidden='true'></i>
                    <p>Select a target language to create a local translation.</p>
                </div>
            )}
            {translationError && <p role='alert' className='rounded-xl bg-rose-50 p-3 text-sm text-rose-600'>{translationError}</p>}
            {translating && <div className='translation-progress'>
                <div className='mb-2 flex justify-between text-xs font-semibold text-slate-500'><span>Preparing translation model</span><span>{typeof translationProgress === 'number' ? `${Math.round(translationProgress)}%` : 'Starting…'}</span></div>
                {typeof translationProgress === 'number' && <div role='progressbar' aria-label='Translation model progress' aria-valuemin='0' aria-valuemax='100' aria-valuenow={Math.round(translationProgress)} className='progress-track'><div className='progress-fill' style={{ width: `${Math.max(0, Math.min(100, translationProgress))}%` }}></div></div>}
                <button onClick={cancelTranslation} className='btn-ghost mt-3'>Cancel translation</button>
            </div>}
            {!translating && (<div className='translation-controls'>
                <label className='flex-1 text-left'>
                  <span className='field-label'>Translate into</span>
                  <select aria-label='Translation target language' value={toLanguage} className='form-control' onChange={(e) => setToLanguage(e.target.value)}>
                        <option value={'Select language'}>Select language</option>
                        {Object.entries(LANGUAGES).map(([key, value]) => {
                            return (
                                <option key={key} value={value}>{key}</option>
                            )
                        })}

                  </select>
                </label>
                <button onClick={generateTranslation} disabled={toLanguage === 'Select language'} className='btn-primary'><i className='fa-solid fa-language' aria-hidden='true'></i>Translate</button>
            </div>)}
        </div>
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

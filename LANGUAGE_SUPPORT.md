# Language and model support

> Generated from `src/services/models/modelConfig.js` and `src/utils/presets.js`.
> Edit those registries, then run `npm run docs:languages`. `npm run check:languages`
> (also included in `npm run verify`) fails if this page is stale.

## What “supported” means here

The tables below describe **selectable options**, not measured accuracy. No representative
multilingual speech or language-pair translation benchmark has been published yet.
Treat every listed language pair as **unvalidated** until a licensed or consented evaluation
reports its results. See [quality tracking](https://github.com/DineshDhanoki/FreeScribe/issues/2),
[the evaluation plan](evaluation/LANGUAGE_QUALITY_PLAN.md), and the [model card](MODEL_CARD.md).

## Speech recognition models

| UI option | Model ID | Pinned revision | Selectable spoken languages | Approximate first download |
| --- | --- | --- | --- | --- |
| Whisper Tiny English | `Xenova/whisper-tiny.en` | `79fb389fc764e7c395bd330e9531d9d32ada7049` | English only; Auto-detect is disabled | 75 MB |
| Whisper Tiny Multilingual | `Xenova/whisper-tiny` | `5332fcc35e32a33b86612b9a57a89be7906102b1` | The 33 manual languages below, plus Auto-detect | 75 MB |
| Whisper Base Multilingual (default) | `Xenova/whisper-base` | `64da57285918e20ea79ea5c88eed7197933abaa8` | The 33 manual languages below, plus Auto-detect | 145 MB |
| Whisper Base English | `Xenova/whisper-base.en` | `95bf40a508535962c6483ead40270b2e32267508` | English only; Auto-detect is disabled | 145 MB |

English-only options: `Xenova/whisper-tiny.en`, `Xenova/whisper-base.en`.
Multilingual options: `Xenova/whisper-tiny`, `Xenova/whisper-base`.
Choosing an English-only checkpoint resets a non-English selection to English.
Download sizes are approximate UI hints, not a disk-space or memory guarantee.

## Selectable spoken languages

The multilingual speech-model UI offers 33 explicit spoken languages.
The NLLB code in this table is used as the translation **source** code after transcription;
it does not prove that recognition or translation is accurate for that language.

| Spoken language | UI code | Whisper code | NLLB source code |
| --- | --- | --- | --- |
| English | `en` | `english` | `eng_Latn` |
| Hindi | `hi` | `hindi` | `hin_Deva` |
| Bengali | `bn` | `bengali` | `ben_Beng` |
| Marathi | `mr` | `marathi` | `mar_Deva` |
| Telugu | `te` | `telugu` | `tel_Telu` |
| Tamil | `ta` | `tamil` | `tam_Taml` |
| Gujarati | `gu` | `gujarati` | `guj_Gujr` |
| Urdu | `ur` | `urdu` | `urd_Arab` |
| Kannada | `kn` | `kannada` | `kan_Knda` |
| Malayalam | `ml` | `malayalam` | `mal_Mlym` |
| Punjabi | `pa` | `punjabi` | `pan_Guru` |
| Odia | `or` | `odia` | `ory_Orya` |
| Assamese | `as` | `assamese` | `asm_Beng` |
| Nepali | `ne` | `nepali` | `npi_Deva` |
| Sanskrit | `sa` | `sanskrit` | `san_Deva` |
| Spanish | `es` | `spanish` | `spa_Latn` |
| French | `fr` | `french` | `fra_Latn` |
| German | `de` | `german` | `deu_Latn` |
| Italian | `it` | `italian` | `ita_Latn` |
| Portuguese | `pt` | `portuguese` | `por_Latn` |
| Russian | `ru` | `russian` | `rus_Cyrl` |
| Arabic | `ar` | `arabic` | `arb_Arab` |
| Japanese | `ja` | `japanese` | `jpn_Jpan` |
| Korean | `ko` | `korean` | `kor_Hang` |
| Chinese | `zh` | `chinese` | `zho_Hans` |
| Indonesian | `id` | `indonesian` | `ind_Latn` |
| Turkish | `tr` | `turkish` | `tur_Latn` |
| Vietnamese | `vi` | `vietnamese` | `vie_Latn` |
| Thai | `th` | `thai` | `tha_Thai` |
| Dutch | `nl` | `dutch` | `nld_Latn` |
| Polish | `pl` | `polish` | `pol_Latn` |
| Ukrainian | `uk` | `ukrainian` | `ukr_Cyrl` |
| Swahili | `sw` | `swahili` | `swh_Latn` |

Auto-detect is an additional UI option, not a language. It loads the separate local
`Xenova/mms-lid-256` classifier at pinned revision `74c747185d407ca911d346a892241c95131d6fa3`
and analyzes up to the first 15 seconds. If its top result cannot be mapped to a selectable
spoken language, FreeScribe asks for manual selection. A detector confidence score is not
transcript accuracy; short, noisy, or code-switched audio may be misidentified.

## Translation

FreeScribe uses `Xenova/nllb-200-distilled-600M` at pinned revision `261c31d1a5732c67cdd16d80e8d6088507c7ccea`.
Its UI lists 204 target options from the NLLB registry below.
Only the spoken languages above are selectable as translation **sources** in the current
workflow. Listing a target does not establish quality or guarantee that every source/target
pair works equally well. The NLLB model has a separate `cc-by-nc-4.0` license;
review model terms before commercial use. The app does not publish an approximate
translation-model download size.

| Target option | NLLB target code |
| --- | --- |
| Acehnese (Arabic script) | `ace_Arab` |
| Acehnese (Latin script) | `ace_Latn` |
| Afrikaans | `afr_Latn` |
| Akan | `aka_Latn` |
| Amharic | `amh_Ethi` |
| Armenian | `hye_Armn` |
| Assamese | `asm_Beng` |
| Asturian | `ast_Latn` |
| Awadhi | `awa_Deva` |
| Ayacucho Quechua | `quy_Latn` |
| Balinese | `ban_Latn` |
| Bambara | `bam_Latn` |
| Banjar (Arabic script) | `bjn_Arab` |
| Banjar (Latin script) | `bjn_Latn` |
| Bashkir | `bak_Cyrl` |
| Basque | `eus_Latn` |
| Belarusian | `bel_Cyrl` |
| Bemba | `bem_Latn` |
| Bengali | `ben_Beng` |
| Bhojpuri | `bho_Deva` |
| Bosnian | `bos_Latn` |
| Buginese | `bug_Latn` |
| Bulgarian | `bul_Cyrl` |
| Burmese | `mya_Mymr` |
| Catalan | `cat_Latn` |
| Cebuano | `ceb_Latn` |
| Central Atlas Tamazight | `tzm_Tfng` |
| Central Aymara | `ayr_Latn` |
| Central Kanuri (Arabic script) | `knc_Arab` |
| Central Kanuri (Latin script) | `knc_Latn` |
| Central Kurdish | `ckb_Arab` |
| Chhattisgarhi | `hne_Deva` |
| Chinese (Simplified) | `zho_Hans` |
| Chinese (Traditional) | `zho_Hant` |
| Chokwe | `cjk_Latn` |
| Crimean Tatar | `crh_Latn` |
| Croatian | `hrv_Latn` |
| Czech | `ces_Latn` |
| Danish | `dan_Latn` |
| Dari | `prs_Arab` |
| Dutch | `nld_Latn` |
| Dyula | `dyu_Latn` |
| Dzongkha | `dzo_Tibt` |
| Eastern Panjabi | `pan_Guru` |
| Eastern Yiddish | `ydd_Hebr` |
| Egyptian Arabic | `arz_Arab` |
| English | `eng_Latn` |
| Esperanto | `epo_Latn` |
| Estonian | `est_Latn` |
| Ewe | `ewe_Latn` |
| Faroese | `fao_Latn` |
| Fijian | `fij_Latn` |
| Finnish | `fin_Latn` |
| Fon | `fon_Latn` |
| French | `fra_Latn` |
| Friulian | `fur_Latn` |
| Galician | `glg_Latn` |
| Ganda | `lug_Latn` |
| Georgian | `kat_Geor` |
| German | `deu_Latn` |
| Greek | `ell_Grek` |
| Guarani | `grn_Latn` |
| Gujarati | `guj_Gujr` |
| Haitian Creole | `hat_Latn` |
| Halh Mongolian | `khk_Cyrl` |
| Hausa | `hau_Latn` |
| Hebrew | `heb_Hebr` |
| Hindi | `hin_Deva` |
| Hungarian | `hun_Latn` |
| Icelandic | `isl_Latn` |
| Igbo | `ibo_Latn` |
| Ilocano | `ilo_Latn` |
| Indonesian | `ind_Latn` |
| Irish | `gle_Latn` |
| Italian | `ita_Latn` |
| Japanese | `jpn_Jpan` |
| Javanese | `jav_Latn` |
| Jingpho | `kac_Latn` |
| Kabiyè | `kbp_Latn` |
| Kabuverdianu | `kea_Latn` |
| Kabyle | `kab_Latn` |
| Kamba | `kam_Latn` |
| Kannada | `kan_Knda` |
| Kashmiri (Arabic script) | `kas_Arab` |
| Kashmiri (Devanagari script) | `kas_Deva` |
| Kazakh | `kaz_Cyrl` |
| Khmer | `khm_Khmr` |
| Kikongo | `kon_Latn` |
| Kikuyu | `kik_Latn` |
| Kimbundu | `kmb_Latn` |
| Kinyarwanda | `kin_Latn` |
| Korean | `kor_Hang` |
| Kyrgyz | `kir_Cyrl` |
| Lao | `lao_Laoo` |
| Latgalian | `ltg_Latn` |
| Ligurian | `lij_Latn` |
| Limburgish | `lim_Latn` |
| Lingala | `lin_Latn` |
| Lithuanian | `lit_Latn` |
| Lombard | `lmo_Latn` |
| Luba-Kasai | `lua_Latn` |
| Luo | `luo_Latn` |
| Luxembourgish | `ltz_Latn` |
| Macedonian | `mkd_Cyrl` |
| Magahi | `mag_Deva` |
| Maithili | `mai_Deva` |
| Malayalam | `mal_Mlym` |
| Maltese | `mlt_Latn` |
| Maori | `mri_Latn` |
| Marathi | `mar_Deva` |
| Meitei (Bengali script) | `mni_Beng` |
| Mesopotamian Arabic | `acm_Arab` |
| Minangkabau (Arabic script) | `min_Arab` |
| Minangkabau (Latin script) | `min_Latn` |
| Mizo | `lus_Latn` |
| Modern Standard Arabic (Romanized) | `arb_Latn` |
| Modern Standard Arabic | `arb_Arab` |
| Moroccan Arabic | `ary_Arab` |
| Mossi | `mos_Latn` |
| Najdi Arabic | `ars_Arab` |
| Nepali | `npi_Deva` |
| Nigerian Fulfulde | `fuv_Latn` |
| North Azerbaijani | `azj_Latn` |
| North Levantine Arabic | `apc_Arab` |
| Northern Kurdish | `kmr_Latn` |
| Northern Sotho | `nso_Latn` |
| Northern Uzbek | `uzn_Latn` |
| Norwegian Bokmål | `nob_Latn` |
| Norwegian Nynorsk | `nno_Latn` |
| Nuer | `nus_Latn` |
| Nyanja | `nya_Latn` |
| Occitan | `oci_Latn` |
| Odia | `ory_Orya` |
| Pangasinan | `pag_Latn` |
| Papiamento | `pap_Latn` |
| Plateau Malagasy | `plt_Latn` |
| Polish | `pol_Latn` |
| Portuguese | `por_Latn` |
| Romanian | `ron_Latn` |
| Rundi | `run_Latn` |
| Russian | `rus_Cyrl` |
| Samoan | `smo_Latn` |
| Sango | `sag_Latn` |
| Sanskrit | `san_Deva` |
| Santali | `sat_Olck` |
| Sardinian | `srd_Latn` |
| Scottish Gaelic | `gla_Latn` |
| Serbian | `srp_Cyrl` |
| Shan | `shn_Mymr` |
| Shona | `sna_Latn` |
| Sicilian | `scn_Latn` |
| Silesian | `szl_Latn` |
| Sindhi | `snd_Arab` |
| Sinhala | `sin_Sinh` |
| Slovak | `slk_Latn` |
| Slovenian | `slv_Latn` |
| Somali | `som_Latn` |
| South Azerbaijani | `azb_Arab` |
| South Levantine Arabic | `ajp_Arab` |
| Southern Pashto | `pbt_Arab` |
| Southern Sotho | `sot_Latn` |
| Southwestern Dinka | `dik_Latn` |
| Spanish | `spa_Latn` |
| Standard Latvian | `lvs_Latn` |
| Standard Malay | `zsm_Latn` |
| Standard Tibetan | `bod_Tibt` |
| Sundanese | `sun_Latn` |
| Swahili | `swh_Latn` |
| Swati | `ssw_Latn` |
| Swedish | `swe_Latn` |
| Tagalog | `tgl_Latn` |
| Tajik | `tgk_Cyrl` |
| Tamasheq (Latin script) | `taq_Latn` |
| Tamasheq (Tifinagh script) | `taq_Tfng` |
| Tamil | `tam_Taml` |
| Tatar | `tat_Cyrl` |
| Ta’izzi-Adeni Arabic | `acq_Arab` |
| Telugu | `tel_Telu` |
| Thai | `tha_Thai` |
| Tigrinya | `tir_Ethi` |
| Tok Pisin | `tpi_Latn` |
| Tosk Albanian | `als_Latn` |
| Tsonga | `tso_Latn` |
| Tswana | `tsn_Latn` |
| Tumbuka | `tum_Latn` |
| Tunisian Arabic | `aeb_Arab` |
| Turkish | `tur_Latn` |
| Turkmen | `tuk_Latn` |
| Twi | `twi_Latn` |
| Ukrainian | `ukr_Cyrl` |
| Umbundu | `umb_Latn` |
| Urdu | `urd_Arab` |
| Uyghur | `uig_Arab` |
| Venetian | `vec_Latn` |
| Vietnamese | `vie_Latn` |
| Waray | `war_Latn` |
| Welsh | `cym_Latn` |
| West Central Oromo | `gaz_Latn` |
| Western Persian | `pes_Arab` |
| Wolof | `wol_Latn` |
| Xhosa | `xho_Latn` |
| Yoruba | `yor_Latn` |
| Yue Chinese | `yue_Hant` |
| Zulu | `zul_Latn` |

## Browser and device limits

- Inference runs in browser Web Workers; model files download on first use and may be cached
  for later runs. First use requires the model host to be reachable.
- Microphone recording requires browser media permissions and a compatible `MediaRecorder`
  format. Upload/decode support depends on the browser codec implementation.
- Input is limited to 200 MB and 30 minutes. These limits do **not** guarantee that a long
  recording fits device memory or completes quickly, particularly on mobile devices.
- Speed, memory use, and quality vary by device, browser, accent, noise, and model.
  See [performance](PERFORMANCE.md) and [privacy](PRIVACY.md).
- Model downloads come from external model hosting, but FreeScribe does not intentionally
  send user audio or transcript text to a FreeScribe backend.

## Adding a language

1. Add the Whisper and NLLB identifiers to the shared model registry. Add a target entry
   to `src/utils/presets.js` only if the NLLB target selector also needs it.
2. Add mapping tests and run `npm run docs:languages` to refresh this matrix.
3. Run `npm run verify`. Supply licensed or consented evaluation data—or clearly state
   that the new option has not been quality-validated.

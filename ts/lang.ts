import { Dictionary } from './type.js'

type L10nRawData = {
    language: string
    fields: Dictionary
}

const FIELD_KEYS = [''] as const

/**
 * Dictionary of key-value pair `(language, field_value)`.
 * 
 * Usage:
 * ``` js
 * button_l10n_filed.speak('EN') // get "Click"
 * ```
 */
class L10nField {
    private data: Dictionary

    constructor(data: Dictionary) {
        this.data = data
    }

    public speak(key: string): string {
        if (key in Object.keys(this.data)) {
            const value = this.data[key]
            return value !== undefined ? value : 'VALUE_MISSING'
        }
        return 'KEY_ERROR'
    }
}

/**
 * Dictionary of key-value pair `(field_key, l10n_field)`.
 * 
 * Usage:
 * ``` js
 * l10n_book.consult('BUTTON_TEXT').speak('EN') // get "Click"
 * ```
 */
class L10nBook {
    private data: Dictionary<typeof FIELD_KEYS[number], L10nField>

    constructor(...raw_data: readonly L10nRawData[]) {
        this.data = {}

        for (const field_key of FIELD_KEYS) {
            const page: Dictionary = {}

            for (const raw_page of raw_data) {
                if (raw_page.language !== '') {
                    page[raw_page.language] = raw_page.fields[field_key]
                }
            }

            this.data[field_key] = new L10nField(page)
        }
    }

    public consult(key: typeof FIELD_KEYS[number]): L10nField {
        let field = this.data[key]
        return field !== undefined ? field : new L10nField({})
    }
}

export { L10nBook }

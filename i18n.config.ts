import en from './locales/en.json'
import zh from './locales/zh.json'
import ja from './locales/ja.json'
import es from './locales/es.json'
import pt from './locales/pt.json'
import fr from './locales/fr.json'
import ko from './locales/ko.json'
import ru from './locales/ru.json'
import it from './locales/it.json'
import de from './locales/de.json'
import id from './locales/id.json'
import vi from './locales/vi.json'
import th from './locales/th.json'
export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  messages: {
    en,
    zh,
    ja,
    es,
    pt,
    fr,
    ko,
    ru,
    it,
    de,
    id,
    vi,
    th
  }
}))

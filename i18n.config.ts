import en from './app/locales/en.json'
import zh from './app/locales/zh.json'
import ja from './app/locales/ja.json'
import es from './app/locales/es.json'
import pt from './app/locales/pt.json'
import fr from './app/locales/fr.json'
import ko from './app/locales/ko.json'
import ru from './app/locales/ru.json'
import it from './app/locales/it.json'
import de from './app/locales/de.json'
import id from './app/locales/id.json'
import vi from './app/locales/vi.json'
import th from './app/locales/th.json'
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

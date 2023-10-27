import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default <Partial<Config>>{
  content: [
    'content/**/*.md'
  ],
  theme: {
    extend: {
      // fontFamily: {
      //   inter: ['"Inter"', ...defaultTheme.fontFamily.sans]
      // }
    }
  }

}

const EXTENSIONS = ['.ts', '.js', '.mjs']

export async function resolve (specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !EXTENSIONS.some(extension => specifier.endsWith(extension))) {
    return nextResolve(`${specifier}.ts`, context)
  }
  return nextResolve(specifier, context)
}

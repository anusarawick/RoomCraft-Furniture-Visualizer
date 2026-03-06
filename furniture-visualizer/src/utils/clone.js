export const cloneDesign = (design) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(design)
  }
  return JSON.parse(JSON.stringify(design))
}

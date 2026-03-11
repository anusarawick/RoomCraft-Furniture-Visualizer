export const formatDate = (iso) => {
  if (!iso) return 'Not saved yet'
  return new Date(iso).toLocaleString()
}

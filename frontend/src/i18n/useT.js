import { useStore } from '../store/useStore'
import { tr } from './translations'

export function useT() {
  const lang = useStore((s) => s.language)
  return (key) => tr(lang, key)
}

export function useNavigation() {
  const query = useState<string>('nav-query', () => '')
  const navOpen = useState<boolean>('nav-open', () => false)

  function toggleNav() {
    navOpen.value = !navOpen.value
  }
  function closeNav() {
    navOpen.value = false
  }

  return { query, navOpen, toggleNav, closeNav }
}

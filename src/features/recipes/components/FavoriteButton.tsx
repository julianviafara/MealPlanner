import { Heart } from 'lucide-react'
import styles from './Recipe.module.css'

export function FavoriteButton({ saved, busy = false, onToggle, label = true }: { saved: boolean; busy?: boolean; onToggle: () => void; label?: boolean }) {
  return <button type="button" className={`${styles.favoriteButton} ${saved ? styles.saved : ''}`} aria-pressed={saved} aria-label={saved ? 'Remove from favourites' : 'Save to favourites'} disabled={busy} onClick={(event) => { event.stopPropagation(); onToggle() }}>
    <Heart size={17} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />{label && <span>{saved ? 'Saved' : 'Save'}</span>}
  </button>
}

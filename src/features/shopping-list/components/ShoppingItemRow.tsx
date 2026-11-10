import { useState } from 'react'
import { Check, Pencil, Trash2 } from 'lucide-react'
import type { ShoppingItem, ManualShoppingItem } from '../types/shoppingList.types'
import { formatGeneratedMeasure } from '../utils/measurementUtils'
import styles from './ShoppingList.module.css'

export function ShoppingItemRow({ item, busy, onToggle, onEdit, onRemove }: {
  item: ShoppingItem; busy: boolean; onToggle: () => void; onEdit?: (item: ManualShoppingItem) => void; onRemove: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const isGenerated = item.type === 'generated'
  const measure = isGenerated ? formatGeneratedMeasure(item.quantity, item.unit, item.originalMeasures) : item.note

  return <li className={`${styles.itemRow} ${item.isPurchased ? styles.purchased : ''}`}>
    <button type="button" className={styles.purchaseButton} aria-label={item.isPurchased ? `Mark ${item.name} as not purchased` : `Mark ${item.name} as purchased`} aria-pressed={item.isPurchased} disabled={busy} onClick={onToggle}>
      {item.isPurchased && <Check size={15} strokeWidth={2.5} aria-hidden="true" />}
    </button>
    <div className={styles.itemCopy}><strong>{item.name}</strong>{measure && <span className={styles.measure}>{measure}</span>}{isGenerated && item.sourceRecipeNames.length > 0 && <span className={styles.provenance}>Used in: {item.sourceRecipeNames.join(', ')}</span>}</div>
    <div className={styles.itemActions}>
      {!isGenerated && onEdit && <button type="button" aria-label={`Edit ${item.name}`} disabled={busy} onClick={() => onEdit(item)}><Pencil size={16} aria-hidden="true" /></button>}
      {!confirming ? <button type="button" aria-label={`Remove ${item.name}`} disabled={busy} onClick={() => setConfirming(true)}><Trash2 size={16} aria-hidden="true" /></button> : <div className={styles.removeConfirm}><span>Remove?</span><button type="button" disabled={busy} onClick={onRemove}>{busy ? 'Removing…' : 'Yes'}</button><button type="button" disabled={busy} onClick={() => setConfirming(false)}>Keep</button></div>}
    </div>
  </li>
}

import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button/Button'
import { Input } from '../../../components/ui/Input/Input'
import styles from './ShoppingList.module.css'

export function ManualItemForm({ initialName = '', initialNote = '', editing = false, saving, onSave, onCancel }: {
  initialName?: string; initialNote?: string; editing?: boolean; saving: boolean
  onSave: (name: string, note: string) => void; onCancel: () => void
}) {
  const [name, setName] = useState(initialName)
  const [note, setNote] = useState(initialNote)
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) { setError('Enter an item name.'); return }
    setError('')
    onSave(cleanName, note.trim())
  }

  return <form className={styles.manualForm} onSubmit={submit}>
    <Input id="shopping-item-name" label="Item name" value={name} onChange={(event) => setName(event.target.value)} placeholder="For example, coffee" autoComplete="off" error={error} maxLength={120} />
    <Input id="shopping-item-note" label="Quantity or note (optional)" value={note} onChange={(event) => setNote(event.target.value)} placeholder="For example, 1 bag" autoComplete="off" maxLength={120} />
    <div className={styles.formActions}><Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add item'}</Button><Button type="button" variant="quiet" disabled={saving} onClick={onCancel}>Cancel</Button></div>
  </form>
}

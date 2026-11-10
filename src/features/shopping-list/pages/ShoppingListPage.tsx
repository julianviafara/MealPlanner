import { useMemo, useState } from 'react'
import { ArrowRight, Check, ListChecks, Plus, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { Button } from '../../../components/ui/Button/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner/LoadingSpinner'
import { getCurrentWeekStart, shiftWeek } from '../../planner/utils/dateUtils'
import { WeekNavigation } from '../../planner/components/WeekNavigation'
import { useShoppingList } from '../hooks/useShoppingList'
import type { ManualShoppingItem, ShoppingItem } from '../types/shoppingList.types'
import { timestampKey } from '../utils/timestampUtils'
import { ManualItemForm } from '../components/ManualItemForm'
import { ShoppingItemRow } from '../components/ShoppingItemRow'
import styles from '../components/ShoppingList.module.css'

export function ShoppingListPage() {
  const { user } = useAuth()
  const [weekId, setWeekId] = useState(() => shiftWeek(getCurrentWeekStart(), 1))
  const [addingItem, setAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<ManualShoppingItem | null>(null)
  const [savingItem, setSavingItem] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [feedback, setFeedback] = useState('')
  const { list, plannedMeals, planUpdatedAt, loading, error, refresh, regenerate, addItem, editItem, removeItem, setPurchased } = useShoppingList(user!.uid, weekId)
  const generatedItems = useMemo(() => list.items.filter((item) => item.type === 'generated').sort((a, b) => a.normalizedName.localeCompare(b.normalizedName) || a.itemId.localeCompare(b.itemId)), [list.items])
  const manualItems = useMemo(() => list.items.filter((item) => item.type === 'manual').sort((a, b) => a.name.localeCompare(b.name)), [list.items])
  const purchasedCount = list.items.filter((item) => item.isPurchased).length
  const totalCount = list.items.length
  const hasGenerated = list.generatedAt !== null && list.generatedAt !== undefined
  const isOutdated = hasGenerated && timestampKey(planUpdatedAt) !== timestampKey(list.sourceMealPlanUpdatedAt)

  function changeWeek(nextWeek: string) {
    setWeekId(nextWeek); setActionError(''); setFeedback(''); setAddingItem(false); setEditingItem(null)
  }

  async function updateGeneratedList() {
    setGenerating(true); setActionError(''); setFeedback('')
    try {
      await regenerate()
      setFeedback('Recipe ingredients are up to date. Your additional items and matching purchase statuses were kept.')
    } catch (failure) {
      setActionError(failure instanceof Error ? failure.message : 'Could not update the shopping list. Your saved items were not replaced.')
    } finally { setGenerating(false) }
  }

  async function saveManualItem(name: string, note: string) {
    setSavingItem(true); setActionError('')
    try {
      if (editingItem) {
        await editItem(editingItem.itemId, name, note)
        setFeedback(`${name} was updated.`); setEditingItem(null)
      } else {
        await addItem(name, note)
        setFeedback(`${name} was added to your list.`); setAddingItem(false)
      }
    } catch (failure) { setActionError(failure instanceof Error ? failure.message : 'Could not save this item.') }
    finally { setSavingItem(false) }
  }

  async function togglePurchased(item: ShoppingItem) {
    setPendingItemId(item.itemId); setActionError('')
    try { await setPurchased(item, !item.isPurchased) }
    catch (failure) { setActionError(failure instanceof Error ? failure.message : 'Could not update purchase status.') }
    finally { setPendingItemId(null) }
  }

  async function removeShoppingItem(item: ShoppingItem) {
    setPendingItemId(item.itemId); setActionError('')
    try {
      await removeItem(item.itemId)
      setFeedback(`${item.name} was removed.`)
    } catch (failure) { setActionError(failure instanceof Error ? failure.message : 'Could not remove this item.') }
    finally { setPendingItemId(null) }
  }

  return <div className={styles.page}>
    <header className={styles.pageHeading}><div><span className={styles.eyebrow}>A LITTLE MORE PREP, A LOT LESS GUESSWORK</span><h1>Your shopping list.</h1><p>Everything for the recipes you have planned, plus anything else you need.</p></div><Button onClick={() => void updateGeneratedList()} disabled={loading || generating}><RefreshCw size={16} aria-hidden="true" className={generating ? styles.spinning : ''} />{generating ? 'Updating…' : hasGenerated ? 'Update shopping list' : 'Generate shopping list'}</Button></header>
    <WeekNavigation weekId={weekId} disabled={generating || savingItem || pendingItemId !== null} onPrevious={() => changeWeek(shiftWeek(weekId, -1))} onNext={() => changeWeek(shiftWeek(weekId, 1))} onToday={() => changeWeek(getCurrentWeekStart())} />
    {actionError && <p className={styles.error} role="alert">{actionError}</p>}
    {feedback && <p className={styles.success} role="status"><Check size={15} aria-hidden="true" />{feedback}</p>}
    {isOutdated && !loading && <div className={styles.staleNotice} role="status"><div><RefreshCw size={17} aria-hidden="true" /><p>Your meal plan changed since this list was generated. Update it to recalculate the ingredients.</p></div><Button variant="secondary" onClick={() => void updateGeneratedList()} disabled={generating}><RefreshCw size={15} aria-hidden="true" />Update list</Button></div>}

    {error ? <div className={styles.loadError} role="alert"><p>{error}</p><Button variant="secondary" onClick={() => void refresh()}>Try again</Button></div> : loading ? <div className={styles.loading}><LoadingSpinner label="Loading your shopping list" /></div> : <>
      {totalCount > 0 && <section className={styles.progressCard} aria-label="Shopping progress"><div><span className={styles.progressIcon}><ListChecks size={18} aria-hidden="true" /></span><div><strong>{purchasedCount} of {totalCount} items purchased</strong><span>Keep going, you’re getting there.</span></div></div><progress value={purchasedCount} max={totalCount} aria-label={`${purchasedCount} of ${totalCount} items purchased`} /></section>}
      {!plannedMeals.length && <div className={styles.noMeals}><div><span className={styles.eyebrow}>NO RECIPES PLANNED</span><h2>Start with your weekly planner.</h2><p>Choose a few recipes for this week and we’ll gather their ingredients here.</p></div><Link to="/planner">Open planner <ArrowRight size={16} aria-hidden="true" /></Link></div>}
      <section className={styles.listSection} aria-labelledby="recipe-ingredients-heading">
        <header className={styles.sectionHeader}><div><span className={styles.sectionKicker}>FROM YOUR MEAL PLAN</span><h2 id="recipe-ingredients-heading">Recipe ingredients <span>{generatedItems.length}</span></h2></div></header>
        {generatedItems.length ? <ul className={styles.itemsList}>{generatedItems.map((item) => <ShoppingItemRow key={item.itemId} item={item} busy={generating || pendingItemId === item.itemId} onToggle={() => void togglePurchased(item)} onRemove={() => void removeShoppingItem(item)} />)}</ul> : <div className={styles.sectionEmpty}>{plannedMeals.length ? hasGenerated ? 'No ingredients were listed for this week’s planned recipes.' : 'Generate the list to gather ingredients from your planned recipes.' : 'Recipe ingredients will appear here when you add meals to your plan.'}</div>}
      </section>

      <section className={styles.listSection} aria-labelledby="additional-items-heading">
        <header className={styles.sectionHeader}><div><span className={styles.sectionKicker}>ANYTHING ELSE YOU NEED</span><h2 id="additional-items-heading">Additional items <span>{manualItems.length}</span></h2></div>{!addingItem && !editingItem && <Button variant="secondary" onClick={() => { setActionError(''); setAddingItem(true) }}><Plus size={16} aria-hidden="true" />Add item</Button>}</header>
        {addingItem && !editingItem && <ManualItemForm saving={savingItem} onSave={(name, note) => void saveManualItem(name, note)} onCancel={() => setAddingItem(false)} />}
        {manualItems.length ? <ul className={styles.itemsList}>{manualItems.map((item) => editingItem?.itemId === item.itemId ? <li className={styles.editRow} key={item.itemId}><ManualItemForm initialName={item.name} initialNote={item.note} editing saving={savingItem} onSave={(name, note) => void saveManualItem(name, note)} onCancel={() => setEditingItem(null)} /></li> : <ShoppingItemRow key={item.itemId} item={item} busy={pendingItemId === item.itemId} onToggle={() => void togglePurchased(item)} onEdit={(selected) => { setActionError(''); setAddingItem(false); setEditingItem(selected) }} onRemove={() => void removeShoppingItem(item)} />)}</ul> : !addingItem && <div className={styles.sectionEmpty}>Add pantry, household, or other items you need to pick up.</div>}
      </section>
      {totalCount === 0 && !plannedMeals.length && <p className={styles.allEmpty}>Your list is empty for this week. Plan recipes or add an item above to get started.</p>}
      <p className={styles.attribution}>Recipe data and ingredient details provided by TheMealDB.</p>
    </>}
  </div>
}

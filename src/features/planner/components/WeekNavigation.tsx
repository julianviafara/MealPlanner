import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react'
import { Button } from '../../../components/ui/Button/Button'
import { formatWeekRange } from '../utils/dateUtils'
import styles from './Planner.module.css'

export function WeekNavigation({ weekId, onPrevious, onNext, onToday, disabled = false }: { weekId: string; onPrevious: () => void; onNext: () => void; onToday: () => void; disabled?: boolean }) {
  return <div className={styles.weekNavigation}>
    <div className={styles.weekRange}><span className={styles.calendarIcon}><CalendarDays size={18} aria-hidden="true" /></span><div><span className={styles.eyebrow}>YOUR WEEK</span><h2>{formatWeekRange(weekId)}</h2></div></div>
    <div className={styles.weekControls}>
      <Button variant="secondary" aria-label="Previous week" disabled={disabled} onClick={onPrevious}><ArrowLeft size={16} aria-hidden="true" /><span className={styles.controlText}>Previous</span></Button>
      <Button variant="quiet" disabled={disabled} onClick={onToday}>Today</Button>
      <Button variant="secondary" aria-label="Next week" disabled={disabled} onClick={onNext}><span className={styles.controlText}>Next</span><ArrowRight size={16} aria-hidden="true" /></Button>
    </div>
  </div>
}

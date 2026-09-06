import {
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from 'react'
import { formatMultiset, formatVector, type HandCounts } from '../core/hand'
import { parseMultiplicityVector, parseMultiset } from '../core/parseHand'
import { ModalDialog } from './ModalDialog'

type HandInputDialogProps = {
  counts: HandCounts
  onApply: (counts: readonly number[]) => void
  onClose: () => void
}

type HandInputFieldProps = {
  id: string
  label: string
  value: string
  error: string | undefined
  inputRef: RefObject<HTMLInputElement | null>
  autoFocus?: boolean
  onChange: (value: string) => void
  onSubmit: (event: FormEvent) => void
}

function HandInputField({
  id,
  label,
  value,
  error,
  inputRef,
  autoFocus,
  onChange,
  onSubmit,
}: HandInputFieldProps) {
  const errorId = `${id}-error`
  return (
    <form className="hand-input-form" onSubmit={onSubmit} noValidate>
      <label htmlFor={id}>{label}</label>
      <div className="hand-input-row">
        <input
          id={id}
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error !== undefined}
          aria-describedby={errorId}
          autoFocus={autoFocus}
        />
        <button type="submit">Apply</button>
      </div>
      <p
        id={errorId}
        className={`hand-input-error${error ? '' : ' hand-input-error-empty'}`}
        role="alert"
      >
        {error ?? ''}
      </p>
    </form>
  )
}

export function HandInputDialog({ counts, onApply, onClose }: HandInputDialogProps) {
  const vectorInputRef = useRef<HTMLInputElement>(null)
  const multisetInputRef = useRef<HTMLInputElement>(null)
  const [vectorValue, setVectorValue] = useState(() => formatVector(counts))
  const [multisetValue, setMultisetValue] = useState(() => formatMultiset(counts))
  const [vectorError, setVectorError] = useState<string>()
  const [multisetError, setMultisetError] = useState<string>()

  const applyVector = (event: FormEvent) => {
    event.preventDefault()
    const result = parseMultiplicityVector(vectorValue, counts.length)
    if (!result.ok) {
      setVectorError(result.error)
      vectorInputRef.current?.focus()
      return
    }
    onApply(result.counts)
  }

  const applyMultiset = (event: FormEvent) => {
    event.preventDefault()
    const result = parseMultiset(multisetValue, counts.length)
    if (!result.ok) {
      setMultisetError(result.error)
      multisetInputRef.current?.focus()
      return
    }
    onApply(result.counts)
  }

  return (
    <ModalDialog className="hand-input-dialog" title="Input hand" onClose={onClose}>
      <HandInputField
        id="multiplicity-vector-input"
        label="Multiplicity vector"
        value={vectorValue}
        error={vectorError}
        inputRef={vectorInputRef}
        autoFocus
        onChange={(value) => {
          setVectorValue(value)
          setVectorError(undefined)
        }}
        onSubmit={applyVector}
      />
      <HandInputField
        id="multiset-input"
        label="Multiset"
        value={multisetValue}
        error={multisetError}
        inputRef={multisetInputRef}
        onChange={(value) => {
          setMultisetValue(value)
          setMultisetError(undefined)
        }}
        onSubmit={applyMultiset}
      />
    </ModalDialog>
  )
}

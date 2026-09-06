import { MAX_EDITABLE_TILE_COUNT } from './hand'

export type HandParseResult =
  | { ok: true; counts: number[] }
  | { ok: false; error: string }

const OUTER_BRACKETS = new Map([
  ['(', ')'],
  ['[', ']'],
  ['{', '}'],
  ['（', '）'],
  ['［', '］'],
  ['｛', '｝'],
  ['【', '】'],
])

function stripOuterBrackets(value: string): string {
  let result = value.trim()
  while (result.length >= 2 && OUTER_BRACKETS.get(result[0]) === result.at(-1)) {
    result = result.slice(1, -1).trim()
  }
  return result
}

function tokenize(value: string): string[] {
  const content = stripOuterBrackets(value)
  return content === '' ? [] : content.split(/[,，\s]+/u)
}

function parseWholeNumber(token: string): number | null {
  if (!/^\d+$/u.test(token)) return null
  const value = Number(token)
  return Number.isSafeInteger(value) ? value : null
}

export function parseMultiplicityVector(value: string, rankCount: number): HandParseResult {
  const tokens = tokenize(value)
  if (tokens.length !== rankCount) {
    return {
      ok: false,
      error: `Expected ${rankCount} entries, received ${tokens.length}.`,
    }
  }

  const counts: number[] = []
  for (let index = 0; index < tokens.length; index += 1) {
    const count = parseWholeNumber(tokens[index])
    if (count === null || count > MAX_EDITABLE_TILE_COUNT) {
      return {
        ok: false,
        error: `Entry ${index + 1} must be a whole number from 0 to ${MAX_EDITABLE_TILE_COUNT}.`,
      }
    }
    counts.push(count)
  }
  return { ok: true, counts }
}

export function parseMultiset(value: string, rankCount: number): HandParseResult {
  const counts = Array.from({ length: rankCount }, () => 0)
  const tokens = tokenize(value)

  for (let index = 0; index < tokens.length; index += 1) {
    const rank = parseWholeNumber(tokens[index])
    if (rank === null || rank < 1 || rank > rankCount) {
      return {
        ok: false,
        error: `Tile ${index + 1} must be a whole number from 1 to ${rankCount}.`,
      }
    }
    counts[rank - 1] += 1
    if (counts[rank - 1] > MAX_EDITABLE_TILE_COUNT) {
      return {
        ok: false,
        error: `Rank ${rank} may appear at most ${MAX_EDITABLE_TILE_COUNT} times.`,
      }
    }
  }
  return { ok: true, counts }
}

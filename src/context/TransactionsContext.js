import { createContext, useContext } from 'react'

export const TransactionsContext = createContext(null)

export function useTransactions() {
  const value = useContext(TransactionsContext)
  if (value === null) {
    throw new Error('useTransactions must be used inside a TransactionsProvider')
  }
  return value
}

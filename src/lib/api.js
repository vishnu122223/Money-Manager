class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status // undefined means the server was unreachable
  }
}

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new ApiError('Backend unreachable', undefined)
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError((body && body.error) || `Request failed (${res.status})`, res.status)
  }
  return body
}

export const api = {
  listTransactions: () => request('/api/transactions'),
  createTransaction: (data) =>
    request('/api/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id, patch) =>
    request(`/api/transactions/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteTransaction: (id) =>
    request(`/api/transactions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  listBudgets: () => request('/api/budgets'),
  setBudget: (category, amount) =>
    request(`/api/budgets/${encodeURIComponent(category)}`, { method: 'PUT', body: JSON.stringify({ amount }) }),
  clearAll: () => request('/api/data', { method: 'DELETE' }),
}

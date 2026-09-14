export function adminSessionMatches(user: {id?: unknown; auth_version?: unknown}, current: {id?: unknown; auth_version?: unknown} | null | undefined) {
  return current != null && String(user.auth_version ?? '') === String(current.auth_version ?? '')
}


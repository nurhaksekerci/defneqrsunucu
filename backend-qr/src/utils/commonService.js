/**
 * Fetch user info (id, fullName, email) from backend-common by user IDs.
 * Used for enriching responses when User data is in defneqr_common (backend-common).
 */
async function fetchUsersFromCommon(userIds, authHeader) {
  if (!userIds || userIds.length === 0) return {};
  const commonUrl = process.env.BACKEND_COMMON_URL || 'http://backend-common:5001';
  const url = `${commonUrl}/api/internal/admin/users-by-ids?ids=${userIds.join(',')}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: authHeader || '' }
    });
    if (!res.ok) return {};
    const json = await res.json();
    return json.data || {};
  } catch {
    return {};
  }
}

module.exports = { fetchUsersFromCommon };

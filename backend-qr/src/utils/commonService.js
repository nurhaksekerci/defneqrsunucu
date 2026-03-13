/**
 * Fetch user info (id, fullName, email) from backend-common by user IDs.
 * Uses internal service auth (X-Internal-Secret) - works for any user role (affiliate, admin, etc).
 */
async function fetchUsersFromCommon(userIds) {
  if (!userIds || userIds.length === 0) return {};
  const commonUrl = process.env.BACKEND_COMMON_URL || 'http://backend-common:5001';
  const url = `${commonUrl}/api/internal/service/users-by-ids?ids=${userIds.join(',')}`;
  const secret = process.env.BACKEND_INTERNAL_SECRET;
  try {
    const headers = {};
    if (secret) headers['X-Internal-Secret'] = secret;
    const res = await fetch(url, { headers });
    if (!res.ok) return {};
    const json = await res.json();
    return json.data || {};
  } catch {
    return {};
  }
}

module.exports = { fetchUsersFromCommon };

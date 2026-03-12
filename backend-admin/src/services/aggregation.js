const axios = require('axios');
const config = require('../config');

function getAuthHeaders(req) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function parseUserAgent(ua) {
  if (!ua) return null;
  const u = ua.toLowerCase();
  let browser = 'Tarayıcı';
  if (u.includes('chrome') && !u.includes('edg')) browser = 'Chrome';
  else if (u.includes('firefox')) browser = 'Firefox';
  else if (u.includes('safari') && !u.includes('chrome')) browser = 'Safari';
  else if (u.includes('edg')) browser = 'Edge';
  else if (u.includes('opera') || u.includes('opr')) browser = 'Opera';
  let device = u.includes('mobile') || u.includes('android') || u.includes('iphone') ? 'Mobil' : 'Masaüstü';
  if (u.includes('iphone') || u.includes('ipad')) device = 'iOS';
  else if (u.includes('android')) device = 'Android';
  return `${browser} / ${device}`;
}

exports.getDashboardStats = async (req) => {
  const headers = getAuthHeaders(req);
  const [commonRes, qrRes] = await Promise.all([
    axios.get(`${config.commonUrl}/api/users/stats`, { headers }).catch(() => ({ data: null })),
    axios.get(`${config.qrUrl}/api/internal/admin/stats`, { headers }).catch(() => ({ data: null }))
  ]);

  const userStats = commonRes?.data?.data;
  const qrStats = qrRes?.data?.data;

  return {
    success: true,
    data: {
      restaurants: qrStats?.restaurants || { total: 0, active: 0, premium: 0, free: 0 },
      users: userStats ? {
        total: userStats.totalUsers,
        active: userStats.totalUsers,
        passive: 0,
        admin: userStats.usersByRole?.find(r => r.role === 'ADMIN')?._count || 0
      } : { total: 0, active: 0, passive: 0, admin: 0 },
      global: qrStats?.global || { categories: 0, products: 0, activeProducts: 0, productsWithoutImage: 0 }
    }
  };
};

exports.getDashboardData = async (req) => {
  const headers = getAuthHeaders(req);
  const activityLimit = Math.min(parseInt(req.query.activityLimit) || 15, 100);

  const [commonRes, qrRes] = await Promise.all([
    axios.get(`${config.commonUrl}/api/internal/admin/dashboard-data?activityLimit=${activityLimit}`, { headers }).catch(() => ({ data: null })),
    axios.get(`${config.qrUrl}/api/internal/admin/dashboard-data?activityLimit=${activityLimit}`, { headers }).catch(() => ({ data: null }))
  ]);

  const commonData = commonRes?.data?.data || { activities: [] };
  const qrData = qrRes?.data?.data || { activities: [], recentRestaurants: [] };

  const activities = [...(commonData.activities || []), ...(qrData.activities || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, activityLimit);

  return {
    success: true,
    data: {
      recentRestaurants: qrData.recentRestaurants || [],
      activities
    }
  };
};

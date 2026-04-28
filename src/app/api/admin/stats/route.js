// API Route: Admin Stats (GET /api/admin/stats)
// Protected: only admin users can access
import { NextResponse } from 'next/server';
import { getUserFromRequest, createAdminClient, isAdminEmail } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    // 1. Authenticate
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Check admin role
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    // 3. Check database connection
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({
        totalGenerations: 0,
        activeUsers: 0,
        topPlatform: '-',
        topCategory: '-',
        recentLogs: [],
        platformCounts: {},
        categoryCounts: {},
        message: 'Database not configured',
      });
    }

    // 4. Parse optional filters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const filterPlatform = searchParams.get('platform');
    const filterCategory = searchParams.get('category');

    // 5. Build query for logs
    let logsQuery = supabase
      .from('generation_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate) logsQuery = logsQuery.gte('created_at', startDate);
    if (endDate) logsQuery = logsQuery.lte('created_at', endDate + 'T23:59:59');
    if (filterPlatform) logsQuery = logsQuery.eq('platform', filterPlatform);
    if (filterCategory) logsQuery = logsQuery.eq('category', filterCategory);

    const { data: logs, error: logsError } = await logsQuery.limit(100);
    if (logsError) throw logsError;

    // 6. Total count — respect same filters as logs query
    let countQuery = supabase
      .from('generation_logs')
      .select('*', { count: 'exact', head: true });
    if (startDate) countQuery = countQuery.gte('created_at', startDate);
    if (endDate) countQuery = countQuery.lte('created_at', endDate + 'T23:59:59');
    if (filterPlatform) countQuery = countQuery.eq('platform', filterPlatform);
    if (filterCategory) countQuery = countQuery.eq('category', filterCategory);
    const { count: totalGenerations } = await countQuery;

    // 7. Active users count
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 8. Aggregate stats from filtered logs
    const platformCounts = {};
    const categoryCounts = {};
    logs?.forEach(log => {
      platformCounts[log.platform] = (platformCounts[log.platform] || 0) + 1;
      categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
    });

    const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return NextResponse.json({
      totalGenerations: totalGenerations || 0,
      activeUsers: activeUsers || 0,
      topPlatform,
      topCategory,
      recentLogs: logs?.slice(0, 50) || [],
      platformCounts,
      categoryCounts,
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

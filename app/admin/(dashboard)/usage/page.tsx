import { requirePagePermission } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStorageUsage, getRowCounts, formatBytes } from '@/lib/admin/usage';
import UsageSettingsEditor from '../UsageSettingsEditor';

export const dynamic = 'force-dynamic';

// 무료 플랜 참고 한도 (플랜에 따라 다를 수 있어 참고용으로만 표시)
const FREE_STORAGE_LIMIT = 1024 * 1024 * 1024; // 1GB

function projectRef() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
  } catch {
    return '';
  }
}

export default async function UsageAdminPage() {
  await requirePagePermission('usage');
  const admin = createAdminClient();

  const [storage, rowCounts, { data: settingsRows }] = await Promise.all([
    getStorageUsage(admin),
    getRowCounts(admin),
    admin
      .from('site_settings')
      .select('key,value')
      .in('key', [
        'ga_measurement_id',
        'usage_supabase_url',
        'usage_vercel_url',
        'usage_ga_url',
      ]),
  ]);

  const settings = Object.fromEntries((settingsRows ?? []).map((s) => [s.key, s.value]));
  const ref = projectRef();

  const supabaseUrl =
    settings.usage_supabase_url ||
    (ref ? `https://supabase.com/dashboard/project/${ref}/reports/storage` : '');
  const vercelUrl = settings.usage_vercel_url || 'https://vercel.com/dashboard';
  const gaUrl = settings.usage_ga_url || 'https://analytics.google.com/';

  const storagePct = Math.min(100, (storage.totalBytes / FREE_STORAGE_LIMIT) * 100);

  const dashboards = [
    {
      title: 'Supabase',
      desc: 'DB·스토리지 사용량, 대역폭, 요금',
      href: supabaseUrl,
      color: 'bg-emerald-500',
      icon: 'ri-database-2-line',
    },
    {
      title: 'Vercel',
      desc: '배포·트래픽·대역폭(Analytics/Usage)',
      href: vercelUrl,
      color: 'bg-gray-900',
      icon: 'ri-line-chart-line',
    },
    {
      title: 'Google Analytics',
      desc: '방문자·접속·유입 경로 통계',
      href: gaUrl,
      color: 'bg-orange-500',
      icon: 'ri-bar-chart-box-line',
    },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">사용량 &amp; 트래픽</h1>
        <p className="text-gray-500">
          실시간 스토리지·DB 사용량을 확인하고, Supabase·Vercel·Google Analytics 대시보드로 바로
          이동할 수 있습니다.
        </p>
      </div>

      {/* Supabase 스토리지 사용량 (실측) */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">스토리지 사용량 (실시간)</h2>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-bold text-primary">
              {formatBytes(storage.totalBytes)}
            </span>
            <span className="text-sm text-gray-500">
              파일 {storage.totalCount.toLocaleString('ko-KR')}개 · 무료 플랜 기준 1GB
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-1">
            <div
              className={`h-full rounded-full ${storagePct > 80 ? 'bg-red-500' : 'bg-primary'}`}
              style={{ width: `${storagePct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mb-6">{storagePct.toFixed(1)}% 사용</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {storage.folders.map((f) => (
              <div key={f.folder} className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700">{f.folder}</p>
                <p className="text-lg font-bold text-gray-900">{formatBytes(f.bytes)}</p>
                <p className="text-xs text-gray-400">{f.count}개 파일</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DB 레코드 수 (실측) */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">DB 레코드 수 (실시간)</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {rowCounts.map((r) => (
            <div key={r.table} className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-3xl font-bold text-primary">{r.count.toLocaleString('ko-KR')}</p>
              <p className="text-sm text-gray-500 mt-1">{r.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          전체 DB 용량·대역폭 등 상세 수치는 아래 Supabase 대시보드에서 확인하세요.
        </p>
      </section>

      {/* 외부 대시보드 바로가기 */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">대시보드 바로가기</h2>
        <p className="text-sm text-gray-500 mb-4">
          각 서비스의 상세 통계는 보안상 페이지에 직접 삽입할 수 없어, 로그인된 공식 대시보드로
          연결합니다.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {dashboards.map((d) => (
            <a
              key={d.title}
              href={d.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow group"
            >
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-lg text-white mb-4 ${d.color}`}
              >
                <i className={`${d.icon} text-2xl`}></i>
              </div>
              <p className="font-bold text-gray-900 flex items-center gap-1">
                {d.title}
                <i className="ri-external-link-line text-sm text-gray-400 group-hover:text-primary"></i>
              </p>
              <p className="text-sm text-gray-500 mt-1">{d.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* 연동 설정 */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">연동 설정</h2>
        <p className="text-sm text-gray-500 mb-4">
          Google Analytics 측정 ID와 각 대시보드 링크를 설정합니다.
        </p>
        <UsageSettingsEditor
          gaMeasurementId={settings.ga_measurement_id ?? ''}
          supabaseUrl={settings.usage_supabase_url ?? ''}
          vercelUrl={settings.usage_vercel_url ?? ''}
          gaUrl={settings.usage_ga_url ?? ''}
        />
      </section>
    </div>
  );
}

import { requirePagePermission } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import InquiryManager from '../InquiryManager';

export const dynamic = 'force-dynamic';

export default async function InquiriesAdminPage() {
  await requirePagePermission('inquiries');
  const admin = createAdminClient();
  const { data: inquiries } = await admin
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  const list = inquiries ?? [];
  const pending = list.filter((q) => !q.reply).length;

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">고객 게시판</h1>
      <p className="text-gray-500 mb-6">
        고객이 남긴 비밀 문의를 확인하고 답변합니다. 답변을 저장하면 작성자가 홈페이지에서
        본인의 아이디·비밀번호로 확인할 수 있습니다.
        {pending > 0 && (
          <span className="ml-2 font-semibold text-secondary">답변 대기 {pending}건</span>
        )}
      </p>
      <InquiryManager inquiries={list} />
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { AppButton, AppText, Badge, Card, Chip, ErrorState, LoadingState, Screen, ScreenHeader, SectionTitle } from '../../src/components/ui';
import { analyzeHistory, buildAiPayload, buildInsights, buildPlan, coachGoalLabel, coachLevelLabel } from '../../src/features/coach/rules';
import type { AiPlan, CoachGoal, CoachLevel, CoachPrefs } from '../../src/features/coach/rules';
import { useToday } from '../../src/hooks/useToday';
import { isAiConfigured, requestAiPlan } from '../../src/services/ai';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { setAiConsent } from '../../src/store/settingsSlice';
import { errorMessage } from '../../src/utils/format';

type AiState = { status: 'idle' | 'loading' | 'done' | 'error'; plan?: AiPlan; error?: string };

export default function CoachScreen() {
  const dispatch = useAppDispatch();
  const today = useToday();
  const all = useAppSelector(s => s.workouts.all);
  const consent = useAppSelector(s => s.settings.aiConsent);
  const [prefs, setPrefs] = useState<CoachPrefs>({ goal: 'habit', daysPerWeek: 3, level: 'beginner' });
  const [ai, setAi] = useState<AiState>({ status: 'idle' });

  const analysis = useMemo(() => analyzeHistory(all, today), [all, today]);
  const insights = useMemo(() => buildInsights(analysis, prefs), [analysis, prefs]);
  const plan = useMemo(() => buildPlan(analysis, prefs), [analysis, prefs]);
  const aiReady = isAiConfigured();

  const runAi = async () => {
    setAi({ status: 'loading' });
    try {
      setAi({ status: 'done', plan: await requestAiPlan(buildAiPayload(all, prefs, today)) });
    } catch (e) {
      setAi({ status: 'error', error: errorMessage(e) });
    }
  };

  const askAi = () => {
    if (consent) {
      void runAi();
      return;
    }
    Alert.alert(
      'Gửi số liệu tới AI?',
      'FitLog sẽ gửi tới backend AI các số liệu tổng hợp: số buổi, số phút, loại hoạt động ưa thích và lựa chọn của bạn ở trên. Tên buổi tập, ghi chú, địa điểm và ảnh KHÔNG được gửi. Bạn có thể thu hồi sự đồng ý trong tab Cá nhân.',
      [
        { text: 'Không', style: 'cancel' },
        { text: 'Đồng ý', onPress: () => { dispatch(setAiConsent(true)); void runAi(); } }
      ]
    );
  };

  return (
    <Screen>
      <ScreenHeader eyebrow="Huấn luyện" title="AI Coach" subtitle="Gợi ý dựa trên lịch sử luyện tập thật của bạn" />

      <Card>
        <SectionTitle title="Mục tiêu của bạn" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(Object.keys(coachGoalLabel) as CoachGoal[]).map(g => <Chip key={g} label={coachGoalLabel[g]} selected={prefs.goal === g} onPress={() => setPrefs(p => ({ ...p, goal: g }))} />)}
        </View>
        <AppText weight="semi" size="sm">Số buổi mỗi tuần</AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[2, 3, 4, 5].map(n => <Chip key={n} label={String(n)} selected={prefs.daysPerWeek === n} onPress={() => setPrefs(p => ({ ...p, daysPerWeek: n }))} />)}
        </View>
        <AppText weight="semi" size="sm">Trình độ</AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(Object.keys(coachLevelLabel) as CoachLevel[]).map(l => <Chip key={l} label={coachLevelLabel[l]} selected={prefs.level === l} onPress={() => setPrefs(p => ({ ...p, level: l }))} />)}
        </View>
      </Card>

      <Card>
        <SectionTitle title="Phân tích lịch sử" action={<Badge label="Từ dữ liệu của bạn" icon="analytics" />} />
        {insights.map((t, i) => <AppText key={i} tone="muted" size="sm">• {t}</AppText>)}
      </Card>

      <Card>
        <SectionTitle title="Lịch gợi ý theo quy tắc" action={<Badge label="Không phải AI" tone="warning" />} />
        <AppText tone="muted" size="xs">Tạo bằng các quy tắc cố định từ lịch sử tập của bạn (thời lượng gần đây, hoạt động ưa thích, thời gian nghỉ).</AppText>
        {plan.map(p => (
          <View key={p.label} style={{ gap: 2, paddingTop: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText weight="bold">{p.label}: {p.title}</AppText>
              <AppText weight="semi">{p.minutes} phút</AppText>
            </View>
            <AppText tone="muted" size="xs">{p.type} · cường độ {p.intensity}. {p.note}</AppText>
          </View>
        ))}
      </Card>

      <Card tone="soft">
        <SectionTitle title="Nhờ AI điều chỉnh" action={<Badge label="AI" icon="sparkles" />} />
        {!aiReady ? (
          <>
            <AppText tone="muted" size="sm">AI chưa được cấu hình. Ứng dụng đã có sẵn lớp kết nối, nhưng cần một backend trung gian giữ API key (xem docs/AI_COACH.md) và biến EXPO_PUBLIC_AI_API_URL. Cho tới lúc đó, các gợi ý ở trên là gợi ý theo quy tắc, không phải AI.</AppText>
            <AppButton label="Nhờ AI điều chỉnh" icon="sparkles" disabled onPress={askAi} />
          </>
        ) : (
          <>
            {ai.status === 'idle' ? <AppText tone="muted" size="sm">AI nhận số liệu tổng hợp của bạn và đề xuất lịch tuần này.</AppText> : null}
            {ai.status === 'loading' ? <LoadingState message="AI đang phân tích..." /> : null}
            {ai.status === 'error' ? <ErrorState message={ai.error ?? 'Không gọi được AI.'} onRetry={askAi} /> : null}
            {ai.status === 'done' && ai.plan ? (
              <View style={{ gap: 8 }}>
                <AppText>{ai.plan.summary}</AppText>
                {ai.plan.plan.map((p, i) => (
                  <View key={i} style={{ gap: 2 }}>
                    <AppText weight="bold">{p.title} · {p.minutes} phút</AppText>
                    {p.notes ? <AppText tone="muted" size="xs">{p.notes}</AppText> : null}
                  </View>
                ))}
              </View>
            ) : null}
            {ai.status !== 'loading' ? <AppButton label={ai.status === 'done' ? 'Hỏi lại AI' : 'Nhờ AI điều chỉnh'} icon="sparkles" onPress={askAi} /> : null}
          </>
        )}
      </Card>

      <AppText tone="muted" size="xs">Gợi ý chỉ mang tính tham khảo chung, không thay thế tư vấn của bác sĩ hoặc huấn luyện viên. Hãy dừng tập và hỏi chuyên gia nếu bạn thấy đau, chóng mặt hoặc khó thở.</AppText>
    </Screen>
  );
}

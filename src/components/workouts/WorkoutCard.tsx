import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { Workout } from '../../types';
import { formatDate } from '../../utils/date';
import { formatDistance, formatDuration } from '../../utils/format';
import { Icon, workoutIcon } from '../ui/Icon';
import { AppText, Card } from '../ui/primitives';

export function WorkoutCard({ workout, onPress, index = 0 }: { workout: Workout; onPress: () => void; index?: number }) {
  const { colors } = useAppTheme();
  const meta = [formatDuration(workout.duration), workout.distance > 0 ? formatDistance(workout.distance) : null, workout.calories !== undefined ? `${workout.calories} kcal` : null].filter(Boolean).join(' · ');
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 40).duration(250)}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${workout.title}, ${workout.type}, ${formatDate(workout.date)}. ${meta}`} onPress={onPress}>
        <Card pressable flexDirection="row" alignItems="center" gap="$3" padding="$3">
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={workoutIcon[workout.type]} size={24} color={colors.brand} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText weight="bold" numberOfLines={1}>{workout.title}</AppText>
            <AppText tone="muted" size="xs">{workout.type} · {formatDate(workout.date)}</AppText>
            <AppText tone="muted" size="sm" numberOfLines={1}>{meta}</AppText>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.muted} />
        </Card>
      </Pressable>
    </Animated.View>
  );
}

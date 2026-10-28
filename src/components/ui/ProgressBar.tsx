import { View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

export function ProgressBar({ ratio, color, trackColor, height = 8, label }: { ratio: number; color?: string; trackColor?: string; height?: number; label?: string }) {
  const { colors } = useAppTheme();
  const r = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(r * 100) }}
      style={{ height, borderRadius: height / 2, overflow: 'hidden', backgroundColor: trackColor ?? colors.borderColor }}
    >
      <View style={{ width: `${r * 100}%`, height: '100%', borderRadius: height / 2, backgroundColor: color ?? colors.brand }} />
    </View>
  );
}

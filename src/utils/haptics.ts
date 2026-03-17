import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

/** Light haptic tap — used for food eat */
export async function hapticsLight(): Promise<void> {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Not available
  }
}

/** Medium haptic — used for wave clear, power-up select */
export async function hapticsMedium(): Promise<void> {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Not available
  }
}

/** Heavy haptic — used for death, boss defeat */
export async function hapticsHeavy(): Promise<void> {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {
    // Not available
  }
}

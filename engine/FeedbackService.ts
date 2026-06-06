import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

class FeedbackService {
  private sounds: Record<string, Audio.Sound> = {};

  async playFlip() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Add pop/flip sound here if available in assets
  }

  async playSuccess() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Add success chime here
  }

  async playLevelComplete() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async playWarning() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  async playError() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

export const feedbackService = new FeedbackService();

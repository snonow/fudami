import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

class FeedbackService {
  private sounds: Record<string, Audio.Sound> = {};

  async playFlip() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // You can add a 'pop.mp3' in assets/sounds/ and load it here
  }

  async playSuccess() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Voiced feedback is very satisfying for language learning
    const messages = ['Excellent !', 'Bien joué !', 'C\'est ça !', 'Parfait !'];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    
    Speech.speak(randomMsg, { 
      language: 'fr',
      pitch: 1.2,
      rate: 1.1 
    });
  }

  async playLevelComplete() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Speech.speak('Niveau terminé ! Félicitations !', { language: 'fr' });
  }

  async playWarning() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  async playError() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Speech.speak('Oups !', { language: 'fr', pitch: 0.8 });
  }
}

export const feedbackService = new FeedbackService();

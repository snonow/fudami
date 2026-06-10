// EXPO_PUBLIC_GOOGLE_TTS_KEY is set in jest.setup.env.js so that the cloud
// path is active when babel-preset-expo inlines env vars at transform time.
import { TtsService } from '../../../data/audio/TtsService';
import * as Speech from 'expo-speech';
import { createAudioPlayer } from 'expo-audio';
import { AudioRepository } from '../../../data/audio/AudioRepository';

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

// Mock expo-audio
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
}));

// Mock AudioRepository
jest.mock('../../../data/audio/AudioRepository', () => ({
  AudioRepository: {
    wordUri: jest.fn(),
    sentenceUri: jest.fn(),
  },
}));

// Mock global fetch for Cloud TTS
global.fetch = jest.fn();

describe('TtsService', () => {
  let mockPlayer: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPlayer = {
      play: jest.fn(),
      pause: jest.fn(),
      release: jest.fn(),
      addListener: jest.fn(),
    };
    (createAudioPlayer as jest.Mock).mockReturnValue(mockPlayer);
  });

  describe('speakWord', () => {
    it('tries pre-generated audio first', async () => {
      (AudioRepository.wordUri as jest.Mock).mockResolvedValue('file://pregenerated.wav');
      
      await TtsService.speakWord('w1', 'たべる');
      
      expect(AudioRepository.wordUri).toHaveBeenCalledWith('w1');
      expect(createAudioPlayer).toHaveBeenCalledWith('file://pregenerated.wav');
      expect(mockPlayer.play).toHaveBeenCalled();
    });

    it('falls back to cloud TTS if no pre-generated audio', async () => {
      (AudioRepository.wordUri as jest.Mock).mockResolvedValue(null);
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ audioContent: 'base64mp3' }),
      });

      await TtsService.speakWord('w1', 'たべる');

      expect(fetch).toHaveBeenCalled();
      expect(createAudioPlayer).toHaveBeenCalledWith(expect.stringContaining('data:audio/mp3;base64,'));
    });
  });

  describe('stop', () => {
    it('stops both player and system speech', async () => {
      // Setup active player
      (AudioRepository.wordUri as jest.Mock).mockResolvedValue('uri');
      await TtsService.speakWord('w1', 't');
      
      (Speech.isSpeakingAsync as jest.Mock).mockResolvedValue(true);
      
      await TtsService.stop();
      
      expect(mockPlayer.pause).toHaveBeenCalled();
      expect(mockPlayer.release).toHaveBeenCalled();
      expect(Speech.stop).toHaveBeenCalled();
      expect(TtsService.state).toBe('idle');
    });
  });
});

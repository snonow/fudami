import { installPackFromUrl, getInstalledManifest, isContentDbInstalled } from '../../../data/content/PackLoader';
import * as FileSystem from 'expo-file-system';

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/docs/',
  EncodingType: { Base64: 'base64' },
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock constants/pack
jest.mock('../../../constants/pack', () => ({
  PACK_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  IS_LOCAL_DEV: true,
}));

// Mock global fetch
global.fetch = jest.fn();

// Mock global crypto for decryption test
const mockDecrypt = jest.fn();
const mockImportKey = jest.fn();
(global as any).crypto = {
  subtle: {
    decrypt: mockDecrypt,
    importKey: mockImportKey,
  },
};

// Mock btoa for Node environment
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');

describe('PackLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isContentDbInstalled', () => {
    it('returns true if file exists and has size', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 1024 });
      const result = await isContentDbInstalled();
      expect(result).toBe(true);
    });

    it('returns false if file does not exist', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
      const result = await isContentDbInstalled();
      expect(result).toBe(false);
    });
  });

  describe('getInstalledManifest', () => {
    it('returns manifest if file exists', async () => {
      const manifest = { packName: 'n5-v1', version: '1.0' };
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(manifest));
      
      const result = await getInstalledManifest();
      expect(result).toEqual(manifest);
    });

    it('returns null if file missing', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
      const result = await getInstalledManifest();
      expect(result).toBeNull();
    });
  });

  describe('installPackFromUrl', () => {
    const packUrl = 'http://example.com/n5.pack';
    const manifest = { packName: 'n5-v1', packFormat: 1, version: '1.0' };
    
    beforeEach(() => {
      (fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.endsWith('-manifest.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(manifest),
          });
        }
        if (url === packUrl) {
          // [12B nonce] + [data]
          const bytes = new Uint8Array(40).fill(0);
          return Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(bytes.buffer),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      mockImportKey.mockResolvedValue('mock-key');
      mockDecrypt.mockResolvedValue(new Uint8Array([72, 101, 108, 108, 111]).buffer); // "Hello"
    });

    it('downloads, decrypts, and saves pack', async () => {
      const result = await installPackFromUrl(packUrl);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(manifest);
      }
      
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining('content.db'),
        expect.any(String), // base64 of "Hello"
        { encoding: 'base64' }
      );
    });

    it('uses chunked base64 conversion (verified by functionality)', async () => {
      // Large payload to test chunked logic
      const largeData = new Uint8Array(20000).fill(65); // 'A'
      mockDecrypt.mockResolvedValue(largeData.buffer);

      const result = await installPackFromUrl(packUrl);
      expect(result.ok).toBe(true);
      
      const [path, b64Data] = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls.find(
        call => call[0].endsWith('content.db')
      );
      
      // Verify base64 of 20000 'A's
      const decoded = Buffer.from(b64Data, 'base64').toString();
      expect(decoded.length).toBe(20000);
      expect(decoded[0]).toBe('A');
    });

    it('returns error if manifest download fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });
      const result = await installPackFromUrl(packUrl);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe('DOWNLOAD_FAILED');
      }
    });
  });
});

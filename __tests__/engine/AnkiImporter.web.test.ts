// Isolated test: verifies that Anki import throws a clear error on web.
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));
jest.mock('expo-file-system', () => ({}));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
jest.mock('fflate', () => ({ unzipSync: jest.fn() }));
jest.mock('../../db', () => ({ getDatabase: jest.fn() }));

import { AnkiImporter } from '../../engine/AnkiImporter';

describe('AnkiImporter on web', () => {
  it("throws an explicit error mentioning native format", async () => {
    const importer = new AnkiImporter();
    await expect(importer.importDeck()).rejects.toThrow('native');
  });

  it('does not attempt to call DocumentPicker on web', async () => {
    const { getDocumentAsync } = require('expo-document-picker');
    const importer = new AnkiImporter();
    try { await importer.importDeck(); } catch {}
    expect(getDocumentAsync).not.toHaveBeenCalled();
  });
});

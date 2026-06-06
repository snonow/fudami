// Test isolé : vérifie que l'import Anki lève une erreur claire sur web.
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));
jest.mock('expo-file-system', () => ({}));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
jest.mock('fflate', () => ({ unzipSync: jest.fn() }));
jest.mock('../../db', () => ({ getDatabase: jest.fn() }));

import { AnkiImporter } from '../../engine/AnkiImporter';

describe('AnkiImporter sur web', () => {
  it("lève une erreur explicite avec mention d'iOS", async () => {
    const importer = new AnkiImporter();
    await expect(importer.importDeck()).rejects.toThrow('iOS');
  });

  it('ne tente pas d\'appeler DocumentPicker sur web', async () => {
    const { getDocumentAsync } = require('expo-document-picker');
    const importer = new AnkiImporter();
    try { await importer.importDeck(); } catch {}
    expect(getDocumentAsync).not.toHaveBeenCalled();
  });
});

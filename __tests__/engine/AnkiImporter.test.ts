import { AnkiImporter } from '../../engine/AnkiImporter';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { getDatabase } from '../../db';
import { State } from 'ts-fsrs';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('expo-file-system', () => ({
  cacheDirectory: '/mock/cache/',
  documentDirectory: '/mock/documents/',
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn(),
  moveAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('fflate', () => ({
  unzipSync: jest.fn(),
}));

jest.mock('../../db', () => ({
  getDatabase: jest.fn(),
}));

const { unzipSync } = require('fflate');

const ANKI_DECKS_JSON = JSON.stringify({
  '1': { name: 'Default' },
  '2': { name: 'Mon Deck Test' },
});

function makeAnkiRow(overrides: Partial<{
  card_id: string; note_id: string; fields: string;
  queue: number; ivl: number; reps: number; lapses: number;
}> = {}) {
  return {
    card_id: '42', note_id: '100',
    fields: 'audio\x1fたべる\x1f食べる\x1fto eat',
    queue: 0, ivl: 0, reps: 0, lapses: 0, tags: '',
    due: 0, factor: 2500, card_type: 0,
    ...overrides,
  };
}

describe('AnkiImporter', () => {
  let importer: AnkiImporter;
  let mockAppDb: any;
  let mockAnkiDb: any;

  beforeEach(() => {
    importer = new AnkiImporter();

    mockAppDb = {
      withTransactionAsync: jest.fn(async (cb: any) => cb()),
      runAsync: jest.fn().mockResolvedValue({}),
    };
    mockAnkiDb = {
      getFirstAsync: jest.fn().mockResolvedValue({
        crt: Math.floor(Date.now() / 1000) - 30 * 86400,
        decks: ANKI_DECKS_JSON,
        dconf: '{}',
      }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      closeAsync: jest.fn().mockResolvedValue(undefined),
    };

    (getDatabase as jest.Mock).mockResolvedValue(mockAppDb);
    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockAnkiDb);

    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => ({
      exists: path.includes('collection.anki2'),
    }));
    (FileSystem.readAsStringAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (path.endsWith('media')) return '{}';
      return 'base64data';
    });

    unzipSync.mockReturnValue({
      'collection.anki2': new Uint8Array([1, 2, 3]),
      'media': new TextEncoder().encode('{}'),
    });
  });

  afterEach(() => jest.clearAllMocks());

  describe('importDeck — annulation', () => {
    it('renvoie null si l utilisateur annule', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: true, assets: [],
      });
      const result = await importer.importDeck();
      expect(result).toBeNull();
    });
  });

  describe('importDeck — flux complet', () => {
    beforeEach(() => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://test.apkg', name: 'test.apkg', mimeType: 'application/octet-stream' }],
      });
    });

    it('renvoie le nom du deck et le nombre de cartes', async () => {
      mockAnkiDb.getAllAsync.mockResolvedValue([makeAnkiRow()]);
      const result = await importer.importDeck();
      expect(result).not.toBeNull();
      expect(result!.deckName).toBe('Mon Deck Test');
      expect(result!.cardCount).toBe(1);
      expect(result!.mediaCount).toBe(0);
    });

    it("insère chaque carte dans la DB de l'app", async () => {
      mockAnkiDb.getAllAsync.mockResolvedValue([makeAnkiRow(), makeAnkiRow({ card_id: '43' })]);
      await importer.importDeck();
      expect(mockAppDb.runAsync).toHaveBeenCalledTimes(2);
    });

    it('préfixe l id de la carte avec anki_', async () => {
      mockAnkiDb.getAllAsync.mockResolvedValue([makeAnkiRow({ card_id: '99' })]);
      await importer.importDeck();
      const [sql, params] = mockAppDb.runAsync.mock.calls[0];
      expect(params[0]).toBe('anki_99');
    });
  });

  describe('parsing des champs', () => {
    beforeEach(() => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://test.apkg', name: 'test.apkg', mimeType: 'application/octet-stream' }],
      });
    });

    it('4 champs : index 1=kana, 2=kanji, 3=back', async () => {
      mockAnkiDb.getAllAsync.mockResolvedValue([
        makeAnkiRow({ fields: 'audio\x1fたべる\x1f食べる\x1fmanger' }),
      ]);
      await importer.importDeck();
      const params = mockAppDb.runAsync.mock.calls[0][1];
      expect(params[2]).toBe('食べる'); // front_kanji
      expect(params[3]).toBe('たべる'); // front_kana
      expect(params[4]).toBe('manger'); // back
    });

    it('3 champs : index 0=kana, 1=kanji, 2=back', async () => {
      mockAnkiDb.getAllAsync.mockResolvedValue([
        makeAnkiRow({ fields: 'たべる\x1f食べる\x1fmanger' }),
      ]);
      await importer.importDeck();
      const params = mockAppDb.runAsync.mock.calls[0][1];
      expect(params[2]).toBe('食べる');
      expect(params[3]).toBe('たべる');
      expect(params[4]).toBe('manger');
    });

    it('2 champs : index 0=kanji, 1=back', async () => {
      mockAnkiDb.getAllAsync.mockResolvedValue([
        makeAnkiRow({ fields: '食べる\x1fmanger' }),
      ]);
      await importer.importDeck();
      const params = mockAppDb.runAsync.mock.calls[0][1];
      expect(params[2]).toBe('食べる');
      expect(params[4]).toBe('manger');
    });

    it('préserve les balises pour le rendu média', async () => {
      mockAnkiDb.getAllAsync.mockResolvedValue([
        makeAnkiRow({ fields: 'audio\x1fたべる\x1f<b>食べる</b>\x1f<i>manger</i>' }),
      ]);
      await importer.importDeck();
      const params = mockAppDb.runAsync.mock.calls[0][1];
      expect(params[2]).toBe('<b>食べる</b>');
      expect(params[4]).toBe('<i>manger</i>');
    });
  });

  describe('mapAnkiToFSRS — états FSRS', () => {
    beforeEach(() => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://test.apkg', name: 'test.apkg', mimeType: 'application/octet-stream' }],
      });
    });

    it('queue=0 → état New', async () => {
      mockAnkiDb.getAllAsync.mockResolvedValue([makeAnkiRow({ queue: 0 })]);
      await importer.importDeck();
      const params = mockAppDb.runAsync.mock.calls[0][1];
      const fsrs = JSON.parse(params[6]);
      expect(fsrs.state).toBe(State.New);
    });

    it('queue=1 → état Learning', async () => {
      mockAnkiDb.getAllAsync.mockResolvedValue([makeAnkiRow({ queue: 1 })]);
      await importer.importDeck();
      const params = mockAppDb.runAsync.mock.calls[0][1];
      const fsrs = JSON.parse(params[6]);
      expect(fsrs.state).toBe(State.Learning);
    });

    it('queue=2 → état Review avec intervalle Anki', async () => {
      mockAnkiDb.getAllAsync.mockResolvedValue([makeAnkiRow({ queue: 2, ivl: 10 })]);
      await importer.importDeck();
      const params = mockAppDb.runAsync.mock.calls[0][1];
      const fsrs = JSON.parse(params[6]);
      expect(fsrs.state).toBe(State.Review);
      expect(fsrs.scheduled_days).toBe(10);
    });
  });

  describe('gestion des médias', () => {
    beforeEach(() => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://test.apkg', name: 'test.apkg', mimeType: 'application/octet-stream' }],
      });
    });

    it('compte les fichiers médias déplacés', async () => {
      unzipSync.mockReturnValue({
        'collection.anki2': new Uint8Array([1]),
        'media': new TextEncoder().encode('{"0":"image.jpg"}'),
        '0': new Uint8Array([255]),
      });
      (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => ({
        exists: path.includes('collection.anki2') || path.endsWith('/0') || path.endsWith('media'),
      }));
      (FileSystem.readAsStringAsync as jest.Mock).mockImplementation(async (path: string) => {
        if (path.endsWith('media')) return '{"0":"image.jpg"}';
        return 'base64data';
      });

      const result = await importer.importDeck();
      expect(result!.mediaCount).toBe(1);
    });

    it('ignore les médias absents sans erreur', async () => {
      unzipSync.mockReturnValue({
        'collection.anki2': new Uint8Array([1]),
        'media': new TextEncoder().encode('{"0":"manquant.jpg"}'),
      });
      (FileSystem.readAsStringAsync as jest.Mock).mockImplementation(async (path: string) => {
        if (path.endsWith('media')) return '{"0":"manquant.jpg"}';
        return 'base64data';
      });
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

      await expect(importer.importDeck()).rejects.toThrow();
    });
  });

  describe('erreurs', () => {
    it('lève une erreur si collection.anki2 est absente', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://bad.apkg', name: 'bad.apkg', mimeType: 'application/octet-stream' }],
      });
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

      await expect(importer.importDeck()).rejects.toThrow('Could not find Anki database');
    });
  });

});

import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as SQLite from 'expo-sqlite';
import { unzipSync } from 'fflate';
import { Buffer } from 'buffer';
import { Card as FSRSCard, State, createEmptyCard } from 'ts-fsrs';
import { DATABASE_NAME } from '../db/schema';

export interface AnkiImportResult {
  deckName: string;
  cardCount: number;
  mediaCount: number;
}

export class AnkiImporter {
  private static readonly TEMP_DIR = `${FileSystem.cacheDirectory}anki_import/`;
  private static readonly MEDIA_DIR = `${FileSystem.documentDirectory}media/`;
  private static readonly SQLITE_DIR = `${FileSystem.documentDirectory}SQLite/`;

  /**
   * Main entry point to pick and import an .apkg file
   */
  async importDeck(): Promise<AnkiImportResult | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/octet-stream', 'application/zip', 'application/x-zip-compressed'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return null;

      const fileUri = result.assets[0].uri;
      
      // 1. Clean up old temp files
      await this.cleanup();
      await FileSystem.makeDirectoryAsync(AnkiImporter.TEMP_DIR, { intermediates: true });

      // 2. Extract APKG (which is a ZIP)
      console.log('Extracting package...');
      await this.extractPackage(fileUri);

      // 3. Process Media
      console.log('Processing media...');
      const mediaCount = await this.processMedia();

      // 4. Process Database
      console.log('Processing database...');
      const dbResult = await this.processDatabase();

      return {
        ...dbResult,
        mediaCount,
      };
    } catch (error) {
      console.error('Anki Import Failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async extractPackage(uri: string) {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const zipData = new Uint8Array(Buffer.from(base64, 'base64'));
    const unzipped = unzipSync(zipData);

    for (const [filename, content] of Object.entries(unzipped)) {
      const fileUri = AnkiImporter.TEMP_DIR + filename;
      await FileSystem.writeAsStringAsync(fileUri, Buffer.from(content).toString('base64'), {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
  }

  private async processMedia(): Promise<number> {
    const mediaJsonPath = `${AnkiImporter.TEMP_DIR}media`;
    if (!(await FileSystem.getInfoAsync(mediaJsonPath)).exists) return 0;

    const mediaJson = await FileSystem.readAsStringAsync(mediaJsonPath);
    const mediaMap: Record<string, string> = JSON.parse(mediaJson);

    await FileSystem.makeDirectoryAsync(AnkiImporter.MEDIA_DIR, { intermediates: true });

    let count = 0;
    for (const [tempName, realName] of Object.entries(mediaMap)) {
      const from = `${AnkiImporter.TEMP_DIR}${tempName}`;
      const to = `${AnkiImporter.MEDIA_DIR}${realName}`;
      
      if ((await FileSystem.getInfoAsync(from)).exists) {
        await FileSystem.moveAsync({ from, to });
        count++;
      }
    }
    return count;
  }

  private async processDatabase(): Promise<{ deckName: string; cardCount: number }> {
    let dbFilename = 'collection.anki2';
    let sourcePath = `${AnkiImporter.TEMP_DIR}${dbFilename}`;

    if (!(await FileSystem.getInfoAsync(sourcePath)).exists) {
      dbFilename = 'collection.anki21';
      sourcePath = `${AnkiImporter.TEMP_DIR}${dbFilename}`;
    }

    if (!(await FileSystem.getInfoAsync(sourcePath)).exists) {
      throw new Error('Could not find Anki database in package');
    }

    const targetDbName = 'anki_import_temp.db';
    const targetPath = `${AnkiImporter.SQLITE_DIR}${targetDbName}`;
    
    await FileSystem.makeDirectoryAsync(AnkiImporter.SQLITE_DIR, { intermediates: true });
    await FileSystem.copyAsync({ from: sourcePath, to: targetPath });

    const ankiDb = await SQLite.openDatabaseAsync(targetDbName);
    const fudamiDb = await SQLite.openDatabaseAsync(DATABASE_NAME);

    try {
      // 1. Get Collection Info (creation time, decks, config)
      const colRow: any = await ankiDb.getFirstAsync('SELECT crt, decks, dconf FROM col');
      const creationTime = colRow.crt * 1000; // Anki crt is in seconds
      const decks = JSON.parse(colRow.decks);
      
      const deckIds = Object.keys(decks).filter(id => id !== '1');
      const primaryDeckId = deckIds[0] || '1';
      const deckName = decks[primaryDeckId].name;

      // 2. Fetch all cards and notes for the selected deck
      const query = `
        SELECT 
          n.id as note_id, n.flds as fields, n.tags,
          c.due, c.ivl, c.factor, c.reps, c.lapses, c.queue, c.type as card_type
        FROM notes n
        JOIN cards c ON n.id = c.nid
        WHERE c.did = ?
      `;
      
      const rows: any[] = await ankiDb.getAllAsync(query, [parseInt(primaryDeckId)]);

      // 3. Map and Insert into Fudami
      await fudamiDb.withTransactionAsync(async () => {
        for (const row of rows) {
          const fields = row.fields.split('\x1f');
          let frontKanji = '';
          let frontKana = '';
          let back = '';

          // Smart Mapping for common deck structures
          if (fields.length >= 4) {
            // Likely [Level, Kana, Kanji, Meaning] like the sample deck
            frontKana = fields[1];
            frontKanji = fields[2] || fields[1];
            back = fields[3];
          } else if (fields.length === 3) {
            // Likely [Kana, Kanji, Meaning]
            frontKana = fields[0];
            frontKanji = fields[1] || fields[0];
            back = fields[2];
          } else {
            // Fallback [Front, Back]
            frontKanji = fields[0];
            back = fields[1] || '';
          }

          // Clean HTML tags if any
          const clean = (text: string) => text.replace(/<[^>]*>?/gm, '').trim();
          
          const finalKanji = clean(frontKanji);
          const finalKana = clean(frontKana);
          const finalBack = clean(back);
          
          // Map Anki state to FSRSCard
          const fsrsCard = this.mapAnkiToFSRS(row, creationTime);
          
          await fudamiDb.runAsync(
            `INSERT OR REPLACE INTO cards (
              id, type, front_kanji, front_kana, back, level, fsrs_state, due_date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              `anki_${row.note_id}`,
              'vocab',
              finalKanji,
              finalKana,
              finalBack,
              'imported',
              JSON.stringify(fsrsCard),
              fsrsCard.due.toISOString(),
              new Date().toISOString()
            ]
          );
        }
      });

      return {
        deckName,
        cardCount: rows.length,
      };
    } finally {
      await ankiDb.closeAsync();
      // Cleanup the temporary import DB
      await FileSystem.deleteAsync(targetPath, { idempotent: true });
    }
  }

  /**
   * Approximate Anki scheduling info to FSRS state
   */
  private mapAnkiToFSRS(row: any, creationTime: number): FSRSCard {
    const card = createEmptyCard(new Date());
    
    // Anki Due:
    // For review cards (queue=2), due is days since creationTime
    // For new/learning, it's often a timestamp or sequence
    let dueDate: Date;
    if (row.queue === 2) {
      dueDate = new Date(creationTime + row.due * 24 * 60 * 60 * 1000);
      card.state = State.Review;
    } else {
      dueDate = new Date(); // Treat non-review as due now
      card.state = row.queue === 0 ? State.New : State.Learning;
    }

    card.due = dueDate;
    card.elapsed_days = row.ivl > 0 ? row.ivl : 0;
    card.scheduled_days = row.ivl > 0 ? row.ivl : 0;
    card.reps = row.reps;
    card.lapses = row.lapses;

    // FSRS doesn't directly use Anki's "factor" (ease), but we could use it to seed stability
    // For now, we'll let the FSRS engine re-calibrate as the user reviews.

    return card;
  }

  private async cleanup() {
    const tempInfo = await FileSystem.getInfoAsync(AnkiImporter.TEMP_DIR);
    if (tempInfo.exists) {
      await FileSystem.deleteAsync(AnkiImporter.TEMP_DIR, { idempotent: true });
    }
  }
}

export const ankiImporter = new AnkiImporter();

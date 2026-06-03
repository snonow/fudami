import { 
  FSRS, 
  Card, 
  Rating, 
  RecordLog, 
  State,
  createEmptyCard,
  generatorParameters
} from 'ts-fsrs';

// Default FSRS parameters
const params = generatorParameters({
  request_retention: 0.9,
  maximum_interval: 36500,
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]
});

const fsrs = new FSRS(params);

export interface FSRSReviewResult {
  card: Card;
  log: RecordLog;
}

/**
 * Creates a new FSRS card instance
 */
export function createNewCard(): Card {
  return createEmptyCard(new Date());
}

/**
 * Schedules a card based on the user rating
 * @param card Current card state
 * @param rating User rating (1=Again, 2=Hard, 3=Good, 4=Easy)
 * @returns New card state and review log
 */
export function scheduleReview(card: Card, rating: Rating): FSRSReviewResult {
  const now = new Date();
  const schedulingCards = fsrs.repeat(card, now);
  
  // schedulingCards is a record of Card objects for each rating
  const result = schedulingCards[rating];
  
  return {
    card: result.card,
    log: result.log
  };
}

/**
 * Helper to convert numeric rating (1-4) to ts-fsrs Rating enum
 */
export function getFsrsRating(rating: number): Rating {
  switch (rating) {
    case 1: return Rating.Again;
    case 2: return Rating.Hard;
    case 3: return Rating.Good;
    case 4: return Rating.Easy;
    default: return Rating.Good;
  }
}

/**
 * Helper to serialize/deserialize card state for storage
 */
export function serializeCard(card: Card): string {
  return JSON.stringify(card);
}

export function deserializeCard(json: string): Card {
  const data = JSON.parse(json);
  // Re-convert dates from strings
  return {
    ...data,
    due: new Date(data.due),
    last_review: data.last_review ? new Date(data.last_review) : undefined
  };
}

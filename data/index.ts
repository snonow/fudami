// Unified data layer — import from here, not from sub-modules directly.
export * from './Result';
export * from './content';
export * as UserRepository from './user/UserRepository';
export * as StudyRepository from './study/StudyRepository';
export * as AudioRepository from './audio/AudioRepository';
export { TtsService } from './audio/TtsService';

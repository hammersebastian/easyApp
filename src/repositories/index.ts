import { appConfig } from '../config/appConfig';
import { DemoLearningRepository } from './DemoLearningRepository';
import type { LearningRepository } from './LearningRepository';
import { SupabaseLearningRepository } from './SupabaseLearningRepository';

export const learningRepository: LearningRepository = appConfig.demoMode
  ? new DemoLearningRepository()
  : new SupabaseLearningRepository();

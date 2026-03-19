import { Types } from "mongoose";

export type CallbackFunction = (error: Error | null, allowed?: boolean) => void;

export interface QueryCondition {
  [key: string]: {
    $in: Array<string | number>;
  };
}

export interface PopulatedStudent {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email?: string;
  studentId?: string;
  avatar?: string;
  studentAssessmentResults?: Array<{
    assessmentId: Types.ObjectId;
    totalScore?: number;
    passingScore?: number;
    isPassed?: boolean;
    attemptNumber?: number;
    startTime?: Date | string;
    endTime?: Date | string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

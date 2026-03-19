export function processInstructorFormData(data: Record<string, any>): {
  error?: string;
  details?: { field: string; message: string }[];
  processedData?: Record<string, any>;
} {
  const result = { ...data };
  const errors: { field: string; message: string }[] = [];

  if ("expertise" in result) {
    try {
      if (typeof result.expertise === "string") {
        result.expertise = JSON.parse(result.expertise);
      }
      if (!Array.isArray(result.expertise)) {
        errors.push({
          field: "expertise",
          message: "Expected array, received string",
        });
      }
    } catch (error) {
      errors.push({
        field: "expertise",
        message: "Invalid expertise format",
      });
    }
  }

  if ("qualifications" in result) {
    try {
      if (typeof result.qualifications === "string") {
        result.qualifications = JSON.parse(result.qualifications);
      }
      if (!Array.isArray(result.qualifications)) {
        errors.push({
          field: "qualifications",
          message: "Expected array, received string",
        });
      }
    } catch (error) {
      errors.push({
        field: "qualifications",
        message: "Invalid qualifications format",
      });
    }
  }

  if ("socialLinks" in result) {
    try {
      if (typeof result.socialLinks === "string") {
        result.socialLinks = JSON.parse(result.socialLinks);
      }

      if (typeof result.socialLinks !== "object" || result.socialLinks === null) {
        errors.push({
          field: "socialLinks",
          message: "Expected object, received string",
        });
      }
    } catch (error) {
      errors.push({
        field: "socialLinks",
        message: "Invalid social links format",
      });
    }
  }

  if ("experienceYears" in result) {
    if (!isNaN(Number(result.experienceYears))) {
      result.experienceYears = Number(result.experienceYears);
    } else {
      errors.push({
        field: "experienceYears",
        message: "Expected number, received string",
      });
    }
  }

  if ("isVerified" in result) {
    if (result.isVerified.toLowerCase() === "true") {
      result.isVerified = true;
    } else if (result.isVerified.toLowerCase() === "false") {
      result.isVerified = false;
    } else {
      errors.push({
        field: "isVerified",
        message: "Expected boolean, received string",
      });
    }
  }

  if ("duration" in result) {
    if (!isNaN(Number(result.duration))) {
      result.duration = Number(result.duration);
    } else {
      errors.push({
        field: "duration",
        message: "Expected number, received string",
      });
    }
  }

  if (errors.length > 0) {
    return { error: "Validation error", details: errors };
  }

  return { processedData: result };
}

export function processAssessmentFormData(data: Record<string, any>): {
  error?: string;
  details?: { field: string; message: string }[];
  processedData?: Record<string, any>;
} {
  const result: Record<string, any> = {};
  const errors: { field: string; message: string }[] = [];
  const basicFields = [
    "organizationId",
    "section",
    "title",
    "description",
    "type",
    "dueDate",
    "startDate",
    "endDate",
    "timeLimit",
    "attemptsAllowed",
    "author",
    "isPublished",
    "isDeleted",
    "gradeMethod",
    "path",
    "passingScore",
    "shuffleQuestions",
    "numberOfQuestionsToShow",
  ];

  for (const field of basicFields) {
    if (field in data) {
      result[field] = data[field];
    }
  }

  const validTypes = [
    "quiz",
    "monthly_test",
    "periodical_test",
    "assignment",
    "activity",
    "final_exam",
  ];
  if ("type" in data) {
    if (!validTypes.includes(data.type.trim())) {
      errors.push({
        field: "type",
        message: `Invalid enum value. Expected ${validTypes.join(" | ")}, received '${data.type}'`,
      });
    } else {
      result.type = data.type.trim();
    }
  }

  if ("startDate" in data) {
    try {
      const date = new Date(data.startDate);
      if (isNaN(date.getTime())) {
        errors.push({
          field: "startDate",
          message: "Expected date, received string",
        });
      } else {
        result.startDate = date;
      }
    } catch (error) {
      console.error("Error parsing startDate:", error);
      errors.push({
        field: "startDate",
        message: "Failed to parse date",
      });
    }
  }

  if ("endDate" in data) {
    try {
      const date = new Date(data.endDate);
      if (isNaN(date.getTime())) {
        errors.push({
          field: "endDate",
          message: "Expected date, received string",
        });
      } else {
        result.endDate = date;
      }
    } catch (error) {
      console.error("Error parsing endDate:", error);
      errors.push({
        field: "endDate",
        message: "Failed to parse date",
      });
    }
  }

  const numericFields = [
    "attemptsAllowed",
    "timeLimit",
    "passingScore",
    "numberOfQuestionsToShow",
    "totalPoints",
    "numberOfItems",
  ];
  for (const field of numericFields) {
    if (field in data) {
      if (!isNaN(Number(data[field]))) {
        result[field] = Number(data[field]);
      } else {
        errors.push({
          field,
          message: "Expected number, received string",
        });
      }
    }
  }

  if ("shuffleQuestions" in data) {
    if (typeof data.shuffleQuestions === "string") {
      if (data.shuffleQuestions.toLowerCase() === "true") {
        result.shuffleQuestions = true;
      } else if (data.shuffleQuestions.toLowerCase() === "false") {
        result.shuffleQuestions = false;
      } else {
        errors.push({
          field: "shuffleQuestions",
          message: "Expected boolean (true/false), received string: " + data.shuffleQuestions,
        });
      }
    } else if (typeof data.shuffleQuestions === "boolean") {
      result.shuffleQuestions = data.shuffleQuestions;
    } else {
      errors.push({
        field: "shuffleQuestions",
        message:
          "Expected boolean or string (true/false), received: " + typeof data.shuffleQuestions,
      });
    }
  }

  const validGradeMethods = ["manual", "auto", "mixed"];
  if ("gradeMethod" in data) {
    if (!validGradeMethods.includes(data.gradeMethod.trim())) {
      errors.push({
        field: "gradeMethod",
        message: `Invalid enum value. Expected ${validGradeMethods.join(" | ")}, received '${data.gradeMethod}'`,
      });
    } else {
      result.gradeMethod = data.gradeMethod.trim();
    }
  }

  // Global option counter for unique IDs across all questions
  let globalOptionCounter = 0;

  if ("questions" in data) {
    if (typeof data.questions === "string") {
      try {
        const questionsArray = JSON.parse(data.questions);
        if (Array.isArray(questionsArray)) {
          result.questions = questionsArray.map((question, questionIndex) => {
            const processedQuestion: any = {
              ...question,
              _id: questionIndex + 1,
              points:
                typeof question.points === "string" || typeof question.points === "number"
                  ? Number(question.points)
                  : 1,
            };

            if (question.questionImageField) {
              processedQuestion.questionImageField = question.questionImageField;
            }

            if (
              processedQuestion.image &&
              typeof processedQuestion.image === "object" &&
              Object.keys(processedQuestion.image).length === 0
            ) {
              delete processedQuestion.image;
            }

            if (question.options && Array.isArray(question.options)) {
              processedQuestion.options = question.options.map((option: any) => {
                globalOptionCounter++;
                const processedOption = {
                  ...option,
                  _id: globalOptionCounter,
                  isCorrect: option.isCorrect === true || option.isCorrect === "true",
                  text: option.text || "",
                };

                if (option.imageField) {
                  processedOption.imageField = option.imageField;
                }

                if (
                  processedOption.image &&
                  typeof processedOption.image === "object" &&
                  Object.keys(processedOption.image).length === 0
                ) {
                  delete processedOption.image;
                }

                return processedOption;
              });
            }

            return processedQuestion;
          });

          return { processedData: result };
        } else {
          console.warn("questions field is not an array:", typeof questionsArray);
        }
      } catch (error) {
        console.error("Error parsing questions as JSON string:", error);
      }
    } else if (Array.isArray(data.questions)) {
      result.questions = data.questions.map((question, questionIndex) => {
        const processedQuestion: any = {
          ...question,
          _id: questionIndex + 1,
          points:
            typeof question.points === "string" ? parseInt(question.points, 10) : question.points,
        };

        if (
          processedQuestion.image &&
          typeof processedQuestion.image === "object" &&
          Object.keys(processedQuestion.image).length === 0
        ) {
          delete processedQuestion.image;
        }

        if (question.options && Array.isArray(question.options)) {
          processedQuestion.options = question.options.map((option: any) => {
            globalOptionCounter++;
            const processedOption = {
              ...option,
              _id: globalOptionCounter,
              isCorrect: option.isCorrect === true || option.isCorrect === "true",
            };

            if (
              processedOption.image &&
              typeof processedOption.image === "object" &&
              Object.keys(processedOption.image).length === 0
            ) {
              delete processedOption.image;
            }

            return processedOption;
          });
        }

        return processedQuestion;
      });
    } else {
      console.warn("questions field is not a string or array:", typeof data.questions);
    }
  }

  if (!result.questions || result.questions.length === 0) {
    const directQuestionIndices = new Set<number>();
    Object.keys(data).forEach((key) => {
      const match = key.match(/^questions\[(\d+)\]$/);
      if (match) {
        directQuestionIndices.add(parseInt(match[1], 10));
      }
    });

    if (directQuestionIndices.size > 0) {
      const questions: any[] = [];

      for (const index of Array.from(directQuestionIndices).sort((a, b) => a - b)) {
        const key = `questions[${index}]`;
        let question: any;

        if (typeof data[key] === "string") {
          try {
            question = JSON.parse(data[key]);
            question._id = index + 1;

            if (question.points) {
              question.points = Number(question.points);
            }

            if (
              question.image &&
              typeof question.image === "object" &&
              Object.keys(question.image).length === 0
            ) {
              delete question.image;
            }

            if (question.options && Array.isArray(question.options)) {
              question.options = question.options.map((option: any) => {
                globalOptionCounter++;
                const processedOption = {
                  ...option,
                  _id: globalOptionCounter,
                  isCorrect: option.isCorrect === true || option.isCorrect === "true",
                };

                if (
                  processedOption.image &&
                  typeof processedOption.image === "object" &&
                  Object.keys(processedOption.image).length === 0
                ) {
                  delete processedOption.image;
                }

                return processedOption;
              });
            }
          } catch (e) {
            console.error(`Failed to parse question[${index}] as JSON:`, e);
            question = {
              _id: index + 1,
              type: "multiple_choice",
              questionText: data[key],
              points: 1,
            };
          }
        } else {
          question = {
            ...data[key],
            _id: index + 1,
          };
        }

        questions.push(question);
      }

      if (questions.length > 0) {
        result.questions = questions;
        return { processedData: result };
      }
    }

    if (!result.questions || result.questions.length === 0) {
      const questions: any[] = [];
      const questionIndices = new Set<number>();

      Object.keys(data).forEach((key) => {
        const match = key.match(/^questions\[(\d+)\]/);
        if (match) {
          questionIndices.add(parseInt(match[1], 10));
        }
      });

      for (const index of Array.from(questionIndices).sort((a, b) => a - b)) {
        const question: any = {
          _id: index + 1,
        };

        const questionPrefix = `questions[${index}]`;
        const basicQuestionFields = ["type", "questionText", "points", "maxWords", "questionNo"];
        const hasRequiredFields = basicQuestionFields.some((field) => {
          const key = `${questionPrefix}[${field}]`;
          return key in data;
        });

        if (!hasRequiredFields) {
          continue;
        }

        for (const field of basicQuestionFields) {
          const key = `${questionPrefix}[${field}]`;

          if (key in data) {
            if (field === "points" || field === "maxWords") {
              question[field] = parseInt(data[key], 10) || 1;
            } else {
              question[field] = data[key] || "";
            }
          }
        }

        if (`${questionPrefix}[image]` in data) {
          question.questionImageField = `${questionPrefix}[image]`;
        }

        const optionIndices = new Set<number>();
        Object.keys(data).forEach((key) => {
          const match = key.match(
            new RegExp(`^${questionPrefix.replace(/[[\]]/g, "\\$&")}\\[options\\]\\[(\\d+)\\]`)
          );
          if (match) {
            optionIndices.add(parseInt(match[1], 10));
          }
        });

        if (optionIndices.size > 0) {
          question.options = [];
          for (const optIndex of Array.from(optionIndices).sort((a, b) => a - b)) {
            globalOptionCounter++;
            const option: any = {
              _id: globalOptionCounter,
            };
            const optionPrefix = `${questionPrefix}[options][${optIndex}]`;
            if (`${optionPrefix}[option]` in data) {
              option.option = data[`${optionPrefix}[option]`];
            }

            if (`${optionPrefix}[text]` in data) {
              option.text = data[`${optionPrefix}[text]`] || "";
            }

            if (`${optionPrefix}[isCorrect]` in data) {
              const isCorrectValue = data[`${optionPrefix}[isCorrect]`];
              option.isCorrect = isCorrectValue === true || isCorrectValue === "true";
            }

            if (`${optionPrefix}[image]` in data) {
              option.imageField = `${optionPrefix}[image]`;
            }

            question.options.push(option);
          }
        }

        const correctAnswersKey = `${questionPrefix}[correctAnswers]`;
        if (correctAnswersKey in data) {
          try {
            question.correctAnswers = Array.isArray(data[correctAnswersKey])
              ? data[correctAnswersKey]
              : data[correctAnswersKey].split(";").map((ans: string) => ans.trim());
          } catch {
            question.correctAnswers = [];
          }
        }

        if (!("points" in question)) {
          question.points = 1;
        }

        questions.push(question);
      }

      if (questions.length > 0) {
        result.questions = questions;
      }
    }
  }

  if ("questionType" in data) {
    result.questionType = data.questionType;
  }

  const shuffleQuestionsValue = result.shuffleQuestions; // This will be true, false, or undefined
  // Validation for totalPoints and shuffleQuestions conflict
  if (data.totalPoints !== undefined) {
    if (shuffleQuestionsValue === false) {
      errors.push({
        field: "totalPoints",
        message:
          "The field 'totalPoints' cannot be explicitly set if 'shuffleQuestions' is false. " +
          "It will be calculated automatically based on all questions.",
      });
    } else if (typeof shuffleQuestionsValue === "undefined") {
      errors.push({
        field: "shuffleQuestions",
        message:
          "The field 'shuffleQuestions' must be provided and set to true when 'totalPoints' is explicitly specified. " +
          "Otherwise, totalPoints is calculated automatically.",
      });
    }
    // If shuffleQuestionsValue is true, explicitly setting totalPoints is allowed.
  }

  // New Validation: If shuffleQuestions is true, totalPoints and numberOfQuestionsToShow are mandatory
  if (shuffleQuestionsValue === true) {
    if (typeof result.numberOfQuestionsToShow !== "number") {
      // Check the parsed numeric value
      errors.push({
        field: "numberOfQuestionsToShow",
        message:
          "The field 'numberOfQuestionsToShow' is required and must be a number when 'shuffleQuestions' is true.",
      });
    }
  }

  // Final processing of questions and related fields
  if (result.questions && Array.isArray(result.questions)) {
    if (result.shuffleQuestions === true) {
      result.totalPoints = null;
      result.numberOfItems =
        typeof result.numberOfQuestionsToShow === "number" ? result.numberOfQuestionsToShow : null;
    } else {
      result.numberOfItems = result.questions.length;
      result.totalPoints = result.questions.reduce(
        (sum: number, question: any) => sum + (Number(question.points) || 0),
        0
      );
      if (result.totalPoints === 0 && result.questions.length > 0) {
        // If all question points are 0 or undefined, but questions exist,
        // this might indicate an issue or a specific case to handle.
        // For now, if totalPoints is 0 from actual calculation, it stays 0.
      }
    }
  } else {
    // If there are no questions, or questions is not an array
    result.numberOfItems = 0;
    result.totalPoints = 0;
    if (result.shuffleQuestions === true) {
      result.totalPoints = null;
      result.numberOfItems =
        typeof result.numberOfQuestionsToShow === "number" ? result.numberOfQuestionsToShow : null;
    }
  }

  if (errors.length > 0) {
    return { error: "Validation error", details: errors };
  }

  return { processedData: result };
}

export function processCsvQuestions(
  csvBuffer: Buffer,
  _questionType?: string
): {
  error?: string;
  details?: { field: string; message: string; line?: number }[];
  processedQuestions?: any[];
} {
  try {
    const csvString = csvBuffer.toString("utf-8");
    const lines = csvString.split("\n").filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      return {
        error: "Invalid CSV format",
        details: [
          { field: "csv", message: "CSV file must contain headers and at least one question" },
        ],
      };
    }

    const headers = lines[0].split(",").map((header) => header.trim());

    const allPossibleHeaders = [
      "questionType",
      "questionText",
      "points",
      "maxWords",
      "option1",
      "option2",
      "option3",
      "option4",
      "correctOption",
      "correctAnswer",
      "correctAnswers",
    ];

    const unrecognizedHeaders = headers.filter((header) => !allPossibleHeaders.includes(header));

    if (unrecognizedHeaders.length > 0) {
      return {
        error: "Unrecognized headers",
        details: [
          {
            field: "csv",
            message: `The following headers are not recognized: ${unrecognizedHeaders.join(", ")}`,
          },
        ],
      };
    }

    const questions: any[] = [];
    const errors: { field: string; message: string; line?: number }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = line.split(",").map((value) => value.trim());

      const questionData: any = {};
      headers.forEach((header, index) => {
        if (index < values.length) {
          questionData[header] = values[index];
        }
      });

      let rowQuestionType = questionData.questionType;

      if (!rowQuestionType) {
        if (questionData.option1 && questionData.correctOption) {
          rowQuestionType = "multiple_choice";
        } else if (
          questionData.correctAnswer &&
          (questionData.correctAnswer.toLowerCase() === "true" ||
            questionData.correctAnswer.toLowerCase() === "false")
        ) {
          rowQuestionType = "true_false";
        } else if (questionData.correctAnswers) {
          rowQuestionType = "short_answer";
        } else if (questionData.maxWords) {
          rowQuestionType = "essay";
        } else {
          rowQuestionType = "essay";
        }
      }

      const question: any = {
        type: rowQuestionType,
        questionText: questionData.questionText,
        points: parseInt(questionData.points, 10) || 1,
      };

      if (rowQuestionType === "multiple_choice") {
        if (!questionData.option1 || !questionData.option2 || !questionData.correctOption) {
          errors.push({
            field: "csv",
            message: `Missing required fields for multiple_choice question at line ${i + 1}. Need at least option1, option2, and correctOption.`,
            line: i + 1,
          });
          continue;
        }

        if (!["1", "2", "3", "4"].includes(questionData.correctOption)) {
          errors.push({
            field: "correctOption",
            message: `Invalid correctOption '${questionData.correctOption}' at line ${i + 1}. Must be 1, 2, 3, or 4.`,
            line: i + 1,
          });
          continue;
        }

        question.options = [
          {
            option: "Option 1",
            text: questionData.option1,
            isCorrect: questionData.correctOption === "1",
          },
          {
            option: "Option 2",
            text: questionData.option2,
            isCorrect: questionData.correctOption === "2",
          },
        ];

        if (questionData.option3) {
          question.options.push({
            option: "Option 3",
            text: questionData.option3,
            isCorrect: questionData.correctOption === "3",
          });
        }

        if (questionData.option4) {
          question.options.push({
            option: "Option 4",
            text: questionData.option4,
            isCorrect: questionData.correctOption === "4",
          });
        }
      } else if (rowQuestionType === "true_false") {
        if (!questionData.correctAnswer) {
          errors.push({
            field: "correctAnswer",
            message: `Missing correctAnswer for true_false question at line ${i + 1}`,
            line: i + 1,
          });
          continue;
        }

        const normalizedAnswer = questionData.correctAnswer.toLowerCase();
        if (normalizedAnswer !== "true" && normalizedAnswer !== "false") {
          errors.push({
            field: "correctAnswer",
            message: `Invalid correctAnswer '${questionData.correctAnswer}' at line ${i + 1}. Must be 'true' or 'false'.`,
            line: i + 1,
          });
          continue;
        }

        question.options = [
          {
            option: "Option 1",
            text: "True",
            isCorrect: normalizedAnswer === "true",
          },
          {
            option: "Option 2",
            text: "False",
            isCorrect: normalizedAnswer === "false",
          },
        ];
      } else if (rowQuestionType === "short_answer") {
        if (!questionData.correctAnswers) {
          errors.push({
            field: "correctAnswers",
            message: `Missing correctAnswers for short_answer question at line ${i + 1}`,
            line: i + 1,
          });
          continue;
        }

        question.correctAnswers = questionData.correctAnswers
          .split(";")
          .map((answer: string) => answer.trim());

        if (questionData.maxWords) {
          question.maxWords = parseInt(questionData.maxWords, 10) || 100;
        }
      } else if (rowQuestionType === "essay") {
        if (questionData.maxWords) {
          question.maxWords = parseInt(questionData.maxWords, 10) || 100;
        }
      }

      questions.push(question);
    }

    if (errors.length > 0) {
      return { error: "CSV parsing errors", details: errors };
    }

    return { processedQuestions: questions };
  } catch (error) {
    return {
      error: "Failed to process CSV file",
      details: [{ field: "csv", message: error instanceof Error ? error.message : String(error) }],
    };
  }
}

export function processStudentFormData(data: Record<string, any>): {
  error?: string;
  details?: { field: string; message: string }[];
  processedData?: Record<string, any>;
} {
  const result = { ...data };
  const errors: { field: string; message: string }[] = [];

  if ("socialLinks" in result) {
    try {
      if (typeof result.socialLinks === "string") {
        result.socialLinks = JSON.parse(result.socialLinks);
      }

      if (typeof result.socialLinks !== "object" || result.socialLinks === null) {
        errors.push({
          field: "socialLinks",
          message: "Expected object with social media links",
        });
      }
    } catch (error) {
      errors.push({
        field: "socialLinks",
        message: "Invalid social links format",
      });
    }
  }

  // Convert yearLevel to number if present
  if ("yearLevel" in result) {
    if (!isNaN(Number(result.yearLevel))) {
      result.yearLevel = Number(result.yearLevel);
    } else {
      errors.push({
        field: "yearLevel",
        message: "Expected number, received string",
      });
    }
  }

  if (errors.length > 0) {
    return { error: "Validation error", details: errors };
  }

  return { processedData: result };
}

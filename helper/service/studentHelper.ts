export function processStudentGradeData(data: any): any {
  if (!data || !data.students || !data.headers) {
    return { headers: [], students: [] };
  }

  const simpleHeaders = data.headers.map((header: any) => header.value);

  const processedStudents = data.students.map((student: any) => {
    const orderedAssessments = [];

    const assessmentMap = new Map();
    student.assessments.forEach((assessment: any) => {
      const key = `${assessment.type}_${assessment.assessmentNo}`;
      assessmentMap.set(key, assessment);
    });

    for (const header of data.headers) {
      const key = `${header.type}_${header.assessmentNo}`;
      if (assessmentMap.has(key)) {
        orderedAssessments.push(assessmentMap.get(key));
      }
    }

    return {
      _id: student._id,
      studentId: student.studentId,
      avatar: student.avatar || "",
      fullName: student.fullName,
      assessments: orderedAssessments,
    };
  });

  return {
    headers: simpleHeaders,
    students: processedStudents,
  };
}

export function processStudentAssessmentData(studentRecord: any, gradingScale: any[] = []) {
  if (!studentRecord) return null;

  return {
    _id: studentRecord._id,
    studentId: studentRecord.studentId,
    fullName: `${studentRecord.firstName} ${studentRecord.lastName}`,
    avatar: studentRecord.avatar || "",
    assessments: mapStudentAssessments(studentRecord.studentAssessmentResults || [], gradingScale),
  };
}

export function mapStudentAssessments(assessmentResults: any[], gradingScale: any[] = []) {
  if (!assessmentResults.length) return [];

  return assessmentResults.map((result) => ({
    assessmentId: result.assessmentId,
    totalScore: Number(result.totalScore || 0),
    totalItems: Number(result.totalItems || 0),
    totalPoints: Number(result.totalPoints || 3),
    type: result.type,
    assessmentNo: result.assessmentNo,
    gradeMethod: result.gradeMethod || "auto",
    percentageScore: calculatePercentageScore(result.totalScore, result.totalPoints),
    gradeLabel: determineGradeLabel(
      calculatePercentageScore(result.totalScore, result.totalPoints),
      gradingScale
    ),
  }));
}

export function calculatePercentageScore(score: number, total: number): number {
  if (!total) return 0;
  const percentage = (Number(score) / Number(total)) * 100;
  return Math.min(Math.round(percentage * 100) / 100, 100); // Round to 2 decimal places and cap at 100
}

export function determineGradeLabel(percentageScore: number, gradingScale: any[]): string {
  if (!gradingScale || !gradingScale.length) return "1.00";

  for (const scale of gradingScale) {
    if (
      percentageScore >= scale.percentageRange.startRange &&
      percentageScore <= scale.percentageRange.endRange
    ) {
      return scale.gradeLabel;
    }
  }

  return "1.00";
}

export function extractUniqueAssessments(students: any[]): any[] {
  if (!students || !students.length) return [];

  const uniqueAssessments = new Set();

  students.forEach((student) => {
    (student.assessments || []).forEach((assessment: any) => {
      uniqueAssessments.add(
        JSON.stringify({
          type: assessment.type,
          assessmentNo: assessment.assessmentNo,
        })
      );
    });
  });

  return Array.from(uniqueAssessments)
    .map((item) => JSON.parse(item as string))
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      return a.assessmentNo - b.assessmentNo;
    })
    .map((item) => ({
      value: `${item.type} ${item.assessmentNo}`,
      type: item.type,
      assessmentNo: item.assessmentNo,
    }));
}

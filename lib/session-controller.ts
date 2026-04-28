import { Prisma, PrismaClient } from "@prisma/client";
import {
  computeAttentionScore,
  computeEvaluationGrade,
  getAttentionLevel
} from "@/lib/score";

function shuffle<T>(items: T[]) {
  const cloned = [...items];

  for (let index = cloned.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[randomIndex]] = [cloned[randomIndex], cloned[index]];
  }

  return cloned;
}

function selectSessionQuestions<T>(items: T[]) {
  const randomized = shuffle(items);
  const targetCount = Math.min(randomized.length, randomized.length >= 5 ? 5 : 4);

  return randomized.slice(0, targetCount);
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildRandomDueTimes(params: {
  startedAt: Date;
  questionCount: number;
  plannedDurationMinutes: number;
}) {
  const { startedAt, questionCount, plannedDurationMinutes } = params;

  const durationSeconds = Math.max(plannedDurationMinutes * 60, questionCount * 60);
  const dueTimes: Date[] = [];

  if (questionCount <= 0) return dueTimes;

  const firstQuestionOffsetSeconds = Math.min(
    randomInt(30, 90),
    Math.max(20, durationSeconds - 30)
  );

  dueTimes.push(
    new Date(startedAt.getTime() + firstQuestionOffsetSeconds * 1000)
  );

  if (questionCount === 1) return dueTimes;

  const remainingCount = questionCount - 1;
  const remainingStartSeconds = Math.min(120, Math.floor(durationSeconds * 0.2));
  const remainingEndSeconds = Math.max(
    remainingStartSeconds + remainingCount * 30,
    durationSeconds - 60
  );

  const usableRange = Math.max(remainingEndSeconds - remainingStartSeconds, remainingCount * 60);
  const bucketSize = usableRange / remainingCount;

  for (let index = 0; index < remainingCount; index++) {
    const bucketStart = Math.floor(remainingStartSeconds + index * bucketSize);
    const bucketEnd = Math.floor(
      remainingStartSeconds + (index + 1) * bucketSize
    );

    const offsetSeconds = randomInt(bucketStart, Math.max(bucketStart + 15, bucketEnd));

    dueTimes.push(new Date(startedAt.getTime() + offsetSeconds * 1000));
  }

  return dueTimes.sort((a, b) => a.getTime() - b.getTime());
}

export async function startClassSession(params: {
  prisma: PrismaClient;
  teacherId: string;
  classId: string;
  intervalSeconds: number;
  plannedDurationMinutes: number;
}) {
  const {
    prisma,
    teacherId,
    classId,
    intervalSeconds,
    plannedDurationMinutes
  } = params;

  const targetClass = await prisma.class.findFirst({
    where: {
      id: classId,
      teacherId
    },
    include: {
      enrollments: true
    }
  });

  if (!targetClass) {
    throw new Error("Class not found or not owned by teacher.");
  }

  if (targetClass.enrollments.length === 0) {
    throw new Error(
      "At least one student must be enrolled before starting a session."
    );
  }

  const existingActiveSession = await prisma.classSession.findFirst({
    where: {
      classId,
      status: "ACTIVE"
    }
  });

  if (existingActiveSession) {
    throw new Error("This class already has an active session.");
  }

  const questions = await prisma.question.findMany({
    where: {
      classId,
      isActive: true
    }
  });

  if (questions.length < 4) {
    throw new Error("Add at least 4 active MCQs before starting a session.");
  }

  const selectedQuestions = selectSessionQuestions(questions);
  const startedAt = new Date();

  const dueTimes = buildRandomDueTimes({
    startedAt,
    questionCount: selectedQuestions.length,
    plannedDurationMinutes
  });

  return prisma.classSession.create({
    data: {
      classId,
      teacherId,
      status: "ACTIVE",
      intervalSeconds,
      plannedDurationMinutes,
      startedAt,
      sessionQuestions: {
        create: selectedQuestions.map((question, index) => ({
          questionId: question.id,
          orderNo: index + 1,
          dueAt: dueTimes[index]
        }))
      }
    },
    include: {
      sessionQuestions: {
        include: {
          question: true
        },
        orderBy: {
          dueAt: "asc"
        }
      }
    }
  });
}

export async function getDueQuestionForStudent(params: {
  prisma: PrismaClient;
  studentId: string;
}) {
  const { prisma, studentId } = params;
  const now = new Date();

  const activeSessions = await prisma.classSession.findMany({
    where: {
      status: "ACTIVE",
      class: {
        enrollments: {
          some: {
            studentId
          }
        }
      }
    },
    include: {
      class: true,
      sessionQuestions: {
        include: {
          question: true
        },
        orderBy: {
          dueAt: "asc"
        }
      }
    },
    orderBy: {
      startedAt: "desc"
    }
  });

  if (activeSessions.length === 0) {
    return {
      active: false as const
    };
  }

  let nearestNextQuestionAt: Date | null = null;

  for (const activeSession of activeSessions) {
    const answered = await prisma.response.findMany({
      where: {
        sessionId: activeSession.id,
        classId: activeSession.classId,
        studentId
      },
      select: {
        questionId: true
      }
    });

    const answeredIds = new Set(answered.map((item) => item.questionId));

    const unansweredQuestions = activeSession.sessionQuestions.filter(
      (item) => !answeredIds.has(item.questionId)
    );

    const dueQuestion = unansweredQuestions.find(
      (item) => item.dueAt.getTime() <= now.getTime()
    );

    if (dueQuestion) {
      return {
        active: true as const,
        sessionId: activeSession.id,
        classId: activeSession.classId,
        className: activeSession.class.name,
        nextQuestionAt: dueQuestion.dueAt,
        question: {
          id: dueQuestion.question.id,
          prompt: dueQuestion.question.prompt,
          dueAt: dueQuestion.dueAt,
          options: {
            A: dueQuestion.question.optionA,
            B: dueQuestion.question.optionB,
            C: dueQuestion.question.optionC,
            D: dueQuestion.question.optionD
          }
        }
      };
    }

    const nextQuestion = unansweredQuestions.find(
      (item) => item.dueAt.getTime() > now.getTime()
    );

    if (nextQuestion) {
      if (
        !nearestNextQuestionAt ||
        nextQuestion.dueAt.getTime() < nearestNextQuestionAt.getTime()
      ) {
        nearestNextQuestionAt = nextQuestion.dueAt;
      }
    }
  }

  return {
    active: true as const,
    question: null,
    nextQuestionAt: nearestNextQuestionAt
  };
}

export async function submitStudentResponse(params: {
  prisma: PrismaClient;
  studentId: string;
  sessionId: string;
  questionId: string;
  selectedOption: "A" | "B" | "C" | "D";
}) {
  const { prisma, studentId, sessionId, questionId, selectedOption } = params;

  const session = await prisma.classSession.findFirst({
    where: {
      id: sessionId,
      status: "ACTIVE",
      class: {
        enrollments: {
          some: {
            studentId
          }
        }
      }
    }
  });

  if (!session) {
    throw new Error("Session inactive or access denied.");
  }

  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      classId: session.classId,
      isActive: true
    }
  });

  if (!question) {
    throw new Error("Question does not belong to this class.");
  }

  const scheduledQuestion = await prisma.sessionQuestion.findUnique({
    where: {
      sessionId_questionId: {
        sessionId: session.id,
        questionId: question.id
      }
    }
  });

  if (!scheduledQuestion) {
    throw new Error("Question is not scheduled for this session.");
  }

  const existing = await prisma.response.findUnique({
    where: {
      sessionId_questionId_studentId: {
        sessionId: session.id,
        questionId: question.id,
        studentId
      }
    }
  });

  if (existing) {
    return existing;
  }

  const now = new Date();
  const responseTimeMs = Math.max(
    0,
    now.getTime() - scheduledQuestion.dueAt.getTime()
  );

  return prisma.response.create({
    data: {
      sessionId: session.id,
      classId: session.classId,
      questionId: question.id,
      studentId,
      selectedOption,
      isCorrect: selectedOption === question.correctOption,
      responseStatus: "ANSWERED",
      dueAt: scheduledQuestion.dueAt,
      responseTimeMs,
      respondedAt: now
    }
  });
}

export async function endClassSession(params: {
  prisma: PrismaClient;
  teacherId: string;
  sessionId: string;
}) {
  const { prisma, teacherId, sessionId } = params;

  const session = await prisma.classSession.findFirst({
    where: {
      id: sessionId,
      teacherId,
      status: "ACTIVE"
    },
    include: {
      class: {
        include: {
          enrollments: true
        }
      },
      sessionQuestions: {
        include: {
          question: true
        }
      }
    }
  });

  if (!session) {
    throw new Error("Active session not found.");
  }

  const totalQuestions = session.sessionQuestions.length;

  if (totalQuestions === 0) {
    throw new Error("No scheduled questions found.");
  }

  const endedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.classSession.update({
      where: {
        id: session.id
      },
      data: {
        status: "ENDED",
        endedAt
      }
    });

    await createUnansweredResponses({
      tx,
      sessionId: session.id,
      classId: session.classId,
      enrollments: session.class.enrollments,
      sessionQuestions: session.sessionQuestions,
      endedAt
    });

    await computeScoresForSession({
      tx,
      sessionId: session.id,
      classId: session.classId,
      enrollments: session.class.enrollments,
      totalQuestions,
      intervalSeconds: session.intervalSeconds
    });
  });

  return {
    success: true,
    message: "Session ended. Unanswered responses and scores were computed."
  };
}

async function createUnansweredResponses(params: {
  tx: Prisma.TransactionClient;
  sessionId: string;
  classId: string;
  enrollments: { studentId: string }[];
  sessionQuestions: { questionId: string; dueAt: Date }[];
  endedAt: Date;
}) {
  const {
    tx,
    sessionId,
    classId,
    enrollments,
    sessionQuestions,
    endedAt
  } = params;

  for (const enrollment of enrollments) {
    const existingResponses = await tx.response.findMany({
      where: {
        sessionId,
        classId,
        studentId: enrollment.studentId
      },
      select: {
        questionId: true
      }
    });

    const existingQuestionIds = new Set(
      existingResponses.map((response) => response.questionId)
    );

    const missingResponses = sessionQuestions
      .filter((item) => !existingQuestionIds.has(item.questionId))
      .map((item) => ({
        sessionId,
        classId,
        questionId: item.questionId,
        studentId: enrollment.studentId,
        selectedOption: null,
        isCorrect: false,
        responseStatus: "UNANSWERED" as const,
        dueAt: item.dueAt,
        responseTimeMs: null,
        respondedAt: endedAt
      }));

    if (missingResponses.length > 0) {
      await tx.response.createMany({
        data: missingResponses,
        skipDuplicates: true
      });
    }
  }
}

async function computeScoresForSession(params: {
  tx: Prisma.TransactionClient;
  sessionId: string;
  classId: string;
  enrollments: { studentId: string }[];
  totalQuestions: number;
  intervalSeconds: number;
}) {
  const {
    tx,
    sessionId,
    classId,
    enrollments,
    totalQuestions,
    intervalSeconds
  } = params;

  for (const enrollment of enrollments) {
    const responses = await tx.response.findMany({
      where: {
        sessionId,
        classId,
        studentId: enrollment.studentId
      }
    });

    const answeredResponses = responses.filter(
      (response) => response.responseStatus === "ANSWERED"
    );

    const answeredCount = answeredResponses.length;
    const unansweredCount = Math.max(0, totalQuestions - answeredCount);
    const correctCount = answeredResponses.filter(
      (response) => response.isCorrect
    ).length;

    const responseTimes = answeredResponses
      .map((response) => response.responseTimeMs)
      .filter((value): value is number => typeof value === "number");

    const averageResponseTimeMs =
      responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((sum, value) => sum + value, 0) /
              responseTimes.length
          )
        : null;

    const attentionScore = computeAttentionScore({
      answeredCount,
      correctCount,
      totalQuestions,
      averageResponseTimeMs,
      intervalSeconds
    });

    const evaluationGrade = computeEvaluationGrade(correctCount, totalQuestions);
    const level = getAttentionLevel(attentionScore);

    await tx.attentionScore.upsert({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: enrollment.studentId
        }
      },
      update: {
        classId,
        answeredCount,
        unansweredCount,
        totalQuestions,
        correctCount,
        averageResponseTimeMs,
        attentionScore,
        evaluationGrade,
        level,
        computedAt: new Date()
      },
      create: {
        sessionId,
        classId,
        studentId: enrollment.studentId,
        answeredCount,
        unansweredCount,
        totalQuestions,
        correctCount,
        averageResponseTimeMs,
        attentionScore,
        evaluationGrade,
        level
      }
    });
  }
}
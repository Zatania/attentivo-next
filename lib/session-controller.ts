import { PrismaClient } from "@prisma/client";
import {
  computeAttentionScore,
  computeEvaluationGrade,
  getAttentionLevel
} from "@/lib/score";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function startClassSession(params: {
  prisma: PrismaClient;
  teacherId: string;
  classId: string;
  intervalSeconds: number;
}) {
  const { prisma, teacherId, classId, intervalSeconds } = params;

  const targetClass = await prisma.class.findFirst({
    where: {
      id: classId,
      teacherId
    }
  });

  if (!targetClass) {
    throw new Error("Class not found or not owned by teacher.");
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
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (questions.length === 0) {
    throw new Error("Add at least one active MCQ before starting a session.");
  }

  const startedAt = new Date();

  return prisma.classSession.create({
    data: {
      classId,
      teacherId,
      status: "ACTIVE",
      intervalSeconds,
      startedAt,
      sessionQuestions: {
        create: questions.map((question, index) => ({
          questionId: question.id,
          orderNo: index + 1,
          dueAt: new Date(startedAt.getTime() + index * intervalSeconds * 1000)
        }))
      }
    },
    include: {
      sessionQuestions: {
        include: {
          question: true
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

  const activeSession = await prisma.classSession.findFirst({
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
        where: {
          dueAt: {
            lte: new Date()
          }
        },
        include: {
          question: true
        },
        orderBy: {
          dueAt: "asc"
        }
      }
    }
  });

  if (!activeSession) {
    return {
      active: false as const
    };
  }

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

  const dueQuestion = activeSession.sessionQuestions.find(
    (item) => !answeredIds.has(item.questionId)
  );

  return {
    active: true as const,
    sessionId: activeSession.id,
    classId: activeSession.classId,
    className: activeSession.class.name,
    question: dueQuestion
      ? {
          id: dueQuestion.question.id,
          prompt: dueQuestion.question.prompt,
          options: {
            A: dueQuestion.question.optionA,
            B: dueQuestion.question.optionB,
            C: dueQuestion.question.optionC,
            D: dueQuestion.question.optionD
          },
          dueAt: dueQuestion.dueAt
        }
      : null
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

  return prisma.response.create({
    data: {
      sessionId: session.id,
      classId: session.classId,
      questionId: question.id,
      studentId,
      selectedOption,
      isCorrect: selectedOption === question.correctOption
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
      sessionQuestions: true
    }
  });

  if (!session) {
    throw new Error("Active session not found.");
  }

  const totalQuestions = session.sessionQuestions.length;

  if (totalQuestions === 0) {
    throw new Error("No scheduled questions found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.classSession.update({
      where: { id: session.id },
      data: {
        status: "ENDED",
        endedAt: new Date()
      }
    });

    await computeScoresForSession({
      tx,
      sessionId: session.id,
      classId: session.classId,
      enrollments: session.class.enrollments,
      totalQuestions
    });
  });

  return {
    success: true,
    message: "Session ended and scores computed."
  };
}

async function computeScoresForSession(params: {
  tx: TxClient;
  sessionId: string;
  classId: string;
  enrollments: { studentId: string }[];
  totalQuestions: number;
}) {
  const { tx, sessionId, classId, enrollments, totalQuestions } = params;

  for (const enrollment of enrollments) {
    const responses = await tx.response.findMany({
      where: {
        sessionId,
        classId,
        studentId: enrollment.studentId
      }
    });

    const answeredCount = responses.length;
    const correctCount = responses.filter((response) => response.isCorrect).length;

    const attentionScore = computeAttentionScore(answeredCount, totalQuestions);
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
        totalQuestions,
        correctCount,
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
        totalQuestions,
        correctCount,
        attentionScore,
        evaluationGrade,
        level
      }
    });
  }
}
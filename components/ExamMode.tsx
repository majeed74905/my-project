import React, { useState, useEffect } from 'react';
import { ExamConfig, ExamSession, ExamQuestion, ExamAnswer } from '../types';
import { generateExamQuestions, evaluateTheoryAnswers } from '../services/gemini';
import { ExamSetup } from './exam/ExamSetup';
import { ExamTaking } from './exam/ExamTaking';
import { ExamResults } from './exam/ExamResults';
import { Loader2 } from 'lucide-react';

const STORAGE_KEY_EXAM_SESSION = 'zara_exam_session';

export const ExamMode: React.FC = () => {
  const [step, setStep] = useState<'setup' | 'taking' | 'evaluating' | 'results'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  
  const [config, setConfig] = useState<ExamConfig>({
    subject: '',
    examType: 'Quiz',
    difficulty: 'Medium',
    language: 'English',
    questionCount: 5,
    includeTheory: false,
    durationMinutes: 10
  });

  const [session, setSession] = useState<ExamSession | null>(null);

  // Load active session from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXAM_SESSION);
    if (saved) {
      try {
        const parsed: ExamSession = JSON.parse(saved);
        if (parsed.isActive && !parsed.completedAt) {
          setSession(parsed);
          setStep('taking');
        }
      } catch (e) {
        console.error("Failed to load exam session", e);
      }
    }
  }, []);

  const saveSession = (updatedSession: ExamSession) => {
    setSession(updatedSession);
    localStorage.setItem(STORAGE_KEY_EXAM_SESSION, JSON.stringify(updatedSession));
  };

  const startExam = async () => {
    setIsLoading(true);
    try {
      const questions = await generateExamQuestions(config);
      
      const newSession: ExamSession = {
        id: crypto.randomUUID(),
        config,
        questions,
        answers: {},
        createdAt: Date.now(),
        isActive: true
      };

      saveSession(newSession);
      setStep('taking');
    } catch (e: any) {
      alert(e.message);
    }
    setIsLoading(false);
  };

  const handleAnswer = (qId: number, value: string) => {
    if (!session) return;
    const updated = {
      ...session,
      answers: {
        ...session.answers,
        [qId]: {
          questionId: qId,
          userAnswer: value,
          isEvaluated: false,
          score: 0
        }
      }
    };
    saveSession(updated);
  };

  const submitExam = async () => {
    if (!session) return;
    setStep('evaluating');
    
    // Evaluate
    const answers = { ...session.answers };
    let totalScore = 0;
    let maxScore = 0;

    for (const q of session.questions) {
      maxScore += q.marks;
      const ans = answers[q.id];

      if (!ans) {
        // Unanswered
        continue;
      }

      if (q.type === 'MCQ') {
        // Auto-grade MCQ (Case insensitive just in case, though usually exact match)
        // Ensure options check against simple letter or full text depending on generation
        // For simplicity, we assume exact string match from generated options
        const isCorrect = ans.userAnswer.trim() === q.correctAnswer.trim();
        ans.score = isCorrect ? q.marks : 0;
        ans.isEvaluated = true;
        totalScore += ans.score;
      } else {
        // Theory Evaluation via Gemini
        try {
          const evalResult = await evaluateTheoryAnswers(session.config.subject, q, ans.userAnswer);
          ans.score = evalResult.score;
          ans.feedback = evalResult.feedback;
          ans.isEvaluated = true;
          totalScore += ans.score;
        } catch (e) {
          console.error(`Failed to grade Q${q.id}`, e);
          ans.score = 0;
          ans.feedback = "Auto-evaluation failed.";
          ans.isEvaluated = true;
        }
      }
    }

    const completedSession: ExamSession = {
      ...session,
      answers,
      isActive: false,
      completedAt: Date.now(),
      totalScore,
      maxScore
    };

    saveSession(completedSession);
    setStep('results');
  };

  const exitExam = () => {
    localStorage.removeItem(STORAGE_KEY_EXAM_SESSION);
    setSession(null);
    setStep('setup');
  };

  const retakeSame = () => {
    localStorage.removeItem(STORAGE_KEY_EXAM_SESSION);
    startExam();
  };

  if (step === 'setup') {
    return <ExamSetup config={config} setConfig={setConfig} onStart={startExam} isLoading={isLoading} />;
  }

  if (step === 'taking' && session) {
    return (
      <ExamTaking 
        questions={session.questions} 
        durationMinutes={session.config.durationMinutes}
        answers={session.answers}
        onAnswer={handleAnswer}
        onSubmit={submitExam}
        subject={session.config.subject}
      />
    );
  }

  if (step === 'evaluating') {
    return (
      <div className="h-full flex flex-col items-center justify-center animate-fade-in">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-text mb-2">Evaluating Results...</h2>
        <p className="text-text-sub">Zara is checking your answers.</p>
      </div>
    );
  }

  if (step === 'results' && session) {
    return <ExamResults session={session} onRetake={retakeSame} onExit={exitExam} />;
  }

  return null;
};
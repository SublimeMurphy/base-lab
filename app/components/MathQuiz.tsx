'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeArea,
  useIsInMiniApp,
  useMiniKit,
  usePrimaryButton,
} from '@coinbase/onchainkit/minikit';
import { Transaction, TransactionButton, TransactionToast } from '@coinbase/onchainkit/transaction';
import { calls } from '../calls';
import styles from './MathQuiz.module.css';
import { baseSepolia } from 'wagmi/chains';

type QuizQuestion = {
  prompt: string;
  answer: number;
};

type QuizPhase = 'answer' | 'result';

const OPERATIONS = [
  {
    symbol: '+',
    compute: (a: number, b: number) => a + b,
  },
  {
    symbol: '-',
    compute: (a: number, b: number) => a - b,
  },
  {
    symbol: '*',
    compute: (a: number, b: number) => a * b,
  },
] as const;

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const buildQuestion = (): QuizQuestion => {
  const a = randomInt(2, 12);
  const b = randomInt(2, 12);
  const operation = OPERATIONS[randomInt(0, OPERATIONS.length - 1)];

  if (operation.symbol === '-') {
    const larger = Math.max(a, b);
    const smaller = Math.min(a, b);
    return {
      prompt: `${larger} ${operation.symbol} ${smaller}`,
      answer: operation.compute(larger, smaller),
    };
  }

  return {
    prompt: `${a} ${operation.symbol} ${b}`,
    answer: operation.compute(a, b),
  };
};

export default function MathQuiz() {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [phase, setPhase] = useState<QuizPhase>('answer');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [history, setHistory] = useState<Array<{ prompt: string; correct: boolean }>>([]);

  const { setMiniAppReady } = useMiniKit();
  const { isInMiniApp } = useIsInMiniApp();
  const readyCalledRef = useRef(false);

  useEffect(() => {
    if (!question) {
      setQuestion(buildQuestion());
    }

    if (readyCalledRef.current) return;

    setMiniAppReady()
      .then(() => {
        readyCalledRef.current = true;
      })
      .catch(() => {
        readyCalledRef.current = true;
      });
  }, [question, setMiniAppReady]);

  const resetForNextQuestion = useCallback(() => {
    setQuestion(buildQuestion());
    setUserAnswer('');
    setPhase('answer');
    setFeedback(null);
  }, []);

  const handleGradeAnswer = useCallback(() => {
    if (!question || !userAnswer.trim()) return;
    const { answer, prompt } = question;
    const parsed = Number.parseInt(userAnswer, 10);
    const isCorrect = parsed === answer;

    setFeedback(
      isCorrect
        ? 'Great job! That is correct.'
        : `Close! The correct answer is ${answer}.`,
    );
    setScore((previous) => previous + (isCorrect ? 1 : 0));
    setAttempts((previous) => previous + 1);
    setHistory((previous) => [
      { prompt, correct: isCorrect },
      ...previous.slice(0, 3),
    ]);
    setPhase('result');
  }, [question, userAnswer]);

  const handleQuizAction = useCallback(() => {
    if (!question) {
      setQuestion(buildQuestion());
      return;
    }

    if (phase === 'answer') {
      handleGradeAnswer();
      return;
    }
    resetForNextQuestion();
  }, [handleGradeAnswer, phase, question, resetForNextQuestion]);

  const primaryButtonOptions = useMemo(
    () => ({
      text: !question
        ? 'Start Quiz'
        : phase === 'answer'
          ? 'Submit Answer'
          : 'Next Question',
      disabled: !question || (phase === 'answer' ? userAnswer.trim().length === 0 : false),
      hidden: !isInMiniApp || !question,
    }),
    [phase, question, userAnswer, isInMiniApp],
  );

  usePrimaryButton(primaryButtonOptions, handleQuizAction);

  return (
    <SafeArea>
      <div className={styles.quizWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Mini Math Quiz</h1>
          <p className={styles.subtitle}>
            Solve quick arithmetic questions and build a streak. Works great inside your Farcaster
            mini app.
          </p>
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>Question</span>
          <span className={styles.question}>
            {question ? question.prompt : <span className={styles.loading}>Loading question</span>}
          </span>
        </div>

        <label className={styles.answerField}>
          <span className={styles.answerLabel}>Your answer</span>
          <input
            value={userAnswer}
            onChange={(event) => setUserAnswer(event.target.value)}
            type="number"
            inputMode="numeric"
            placeholder="Type the result"
            disabled={phase === 'result' || !question}
            className={styles.input}
          />
        </label>

        {feedback ? (
          <div
            className={`${styles.feedback} ${
              feedback.startsWith('Great') ? styles.feedbackPositive : styles.feedbackNeutral
            }`}
          >
            {feedback}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleQuizAction}
          disabled={primaryButtonOptions.disabled}
          className={styles.primaryButton}
        >
          {primaryButtonOptions.text}
        </button>

        <div className={styles.scorePanel}>
          <div className={styles.scoreSummary}>
            <span>Score</span>
            <span>
              {score} / {attempts}
            </span>
          </div>
          <div className={styles.scoreTip}>
            Tip: When opened inside Warpcast or another Farcaster client, the primary button mirrors
            your actions so you can play without tapping the on-screen button.
          </div>
          {history.length ? (
            <ul className={styles.historyList}>
              {history.map((item, index) => (
                <li key={`${item.prompt}-${index}`} className={styles.historyItem}>
                  <span>{item.prompt}</span>
                  <span
                    className={
                      item.correct
                        ? `${styles.historyLabel} ${styles.historyLabelPositive}`
                        : `${styles.historyLabel} ${styles.historyLabelNeutral}`
                    }
                  >
                    {item.correct ? 'Correct' : 'Retry'}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className={styles.saveSection}>
          <div className={styles.saveCopy}>
            <h2 className={styles.saveTitle}>Onchain&apos;e Kaydet</h2>
            <p className={styles.saveDescription}>
              Quiz ilerlemeni Base ağına yazmak için hızlıca zincir üstü bir iz bırak.
            </p>
          </div>
          <Transaction
            calls={calls}
            chainId={baseSepolia.id}
            className={styles.transactionContainer}
          >
            <TransactionButton
            text="Onchain&apos;e Kaydet"
              className={styles.transactionButton}
            />
            <TransactionToast />
          </Transaction>
        </div>
      </div>
    </SafeArea>
  );
}

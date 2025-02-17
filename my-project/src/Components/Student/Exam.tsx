import { useParams } from "react-router-dom";
import useExam from "./useExam";
import { useState, useEffect, useRef, useMemo } from "react";
import ScoreCard from "./ScoreCard";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type UserAnswers = { [key: string]: string };
export default function Exam() {
  const { id } = useParams();
  const {
    subjectID,
    subjectName,
    totalQuestions,
    marks,
    duration,
    facultyName,
    randomQuestions,
  } = useExam(id as string);
  const [studentID] = useState(localStorage.getItem("studentid"));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [submitted,setSubmitted]=useState<boolean>(false)


  useEffect(() => {
    setTimeRemaining(duration * 60);
  }, [duration]);

  const intervalIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (timeRemaining <= 0 || currentQuestionIndex >= randomQuestions.length) {
      clearInterval(intervalIdRef.current as number);
    } else {
      intervalIdRef.current = setInterval(() => {
        setTimeRemaining((timeRemaining) => timeRemaining - 1);
      }, 1000) as unknown as number;
    }

    if(timeRemaining<=0&&currentQuestionIndex>1){
      handleSubmit();
    }

    return () => clearInterval(intervalIdRef.current as number);
  }, [timeRemaining, currentQuestionIndex, randomQuestions.length]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setUserAnswers({ ...userAnswers, [questionIndex]: answerIndex });
  };

  const handleNextQuestion = () => {
    if(currentQuestionIndex === randomQuestions.length - 1){
      handleSubmit();
    }
    else{
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  const score = useMemo(() => {
    const score = Object.entries(userAnswers).reduce(
      (totalScore, [questionIndex, answerIndex]) => {
        const correctAnswerIndex =
          randomQuestions[parseInt(questionIndex, 10)].correctAnswerIndex;
        return (
          totalScore +
          (answerIndex.toString() === correctAnswerIndex.toString() ? 1 : 0)
        );
      },
      0
    );

    const timeTaken = duration * 60 - timeRemaining;
    if(!submitted)
    setTimeTaken(timeTaken);

    return score;
  }, [duration, timeRemaining, randomQuestions, userAnswers]);

  const handleSubmit = async () => {
    const data = {
      studentID: studentID,
      SubjectID: subjectID,
      SubjectName: subjectName,
      totalQuestions: totalQuestions,
      duration: duration,
      timeTaken: timeTaken,
      marks: marks,
      score: score,
      facultyName: facultyName,
    };
    console.log(data);

    try {
      const res = await axios.patch(
        `http://localhost:8088/user/submit/result/${studentID}`,
        { Results: [data] }
      );
      toast.success("Exam result submitted successfully!");
      setSubmitted(true);
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };

  if (submitted) {
    
    return (
      <ScoreCard
        subjectID={subjectID}
        subjectName={subjectName}
        duration={duration * 60}
        totalQuestions={totalQuestions}
        marks={marks}
        score={score}
        timeTaken={timeTaken}
        facultyName={facultyName}
      />
    );
  }

  const currentQuestion = randomQuestions[currentQuestionIndex]||{question:"",answers:[]};

  return (
    <>
      <div className="flex flex-col mb-4 bg-blue-500 p-4  shadow-md">
        <div className="text-white font-medium text-lg w-1/4">
          Subject ID: {subjectID}
        </div>
        <div className="text-white font-medium text-lg w-1/4">
          Subject: {subjectName}
        </div>
        <div className="text-white font-medium text-lg w-1/4">
          Time: {duration}
        </div>
        <div className="text-white font-medium text-lg w-1/4">
          Total Questions: {totalQuestions}
        </div>
      </div>

      <div className="bg-white p-6  shadow-lg">
        <div className="flex justify-between">
          <h1 className="text-gray-900 font-bold text-2xl mb-4">
            Current Question {currentQuestionIndex + 1} -{" "}
            {randomQuestions.length}
          </h1>
          <h1 className="text-gray-900 font-bold text-2xl mb-4">
            Time remaining: {minutes}:{seconds < 10 ? "0" : ""}
            {seconds} Minutes
          </h1>
        </div>
        <div className="text-gray-900 text-lg font-medium mb-4">
          {currentQuestionIndex + 1} . {currentQuestion.question}
        </div>
        {currentQuestion.answers.map((answer, index) => (
          <div className="mb-2" key={index}>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name={`question${currentQuestionIndex}`}
                value={index}
                onChange={() => handleAnswerSelect(currentQuestionIndex, index)}
                checked={
                  userAnswers[currentQuestionIndex] !== undefined &&
                  userAnswers[currentQuestionIndex].toString() === index.toString()
                }
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-900 text-lg font-medium">
                {answer}
              </span>
            </label>
          </div>
        ))}
        <div className="flex justify-between mt-6">
          <button
            className={`bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded ${
              currentQuestionIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          <button
            className={`bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded shadow ${
              userAnswers[currentQuestionIndex] === undefined
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            onClick={handleNextQuestion}
            disabled={userAnswers[currentQuestionIndex] === undefined}
          >
            {currentQuestionIndex === randomQuestions.length - 1
              ? "Submit"
              : "next"}
          </button>
        </div>
      </div>
    </>
  );
}

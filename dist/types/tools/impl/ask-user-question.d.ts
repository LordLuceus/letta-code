interface QuestionOption {
    label: string;
    description: string;
}
interface Question {
    question: string;
    header: string;
    options: QuestionOption[];
    multiSelect?: boolean;
}
interface AskUserQuestionArgs {
    questions: Question[];
    answers?: Record<string, string>;
}
interface AskUserQuestionResult {
    message: string;
}
export declare function ask_user_question(args: AskUserQuestionArgs): Promise<AskUserQuestionResult>;
export {};
//# sourceMappingURL=ask-user-question.d.ts.map
export type Locale = "en" | "vi";

export const translations = {
  en: {
    // Navigation
    learn: "Learn",
    profile: "Profile",
    quests: "Quests",
    viewAll: "View all",
    returnToLearn: "Return to Learn",

    // Course selection
    currentlyLearning: "Currently Learning",
    continueLearning: "Continue Learning",
    addCourse: "Add course",
    noOtherCourses: "No other courses available.",
    courseSelected: "Course selected",
    somethingWentWrong: "Something went wrong",

    // Quests
    completeQuestsHint: "Complete quests by earning points.",
    earnXP: (value: number) => `Earn ${value} XP`,

    // Profile
    settings: "Settings",
    manageAccount: "Manage your account and preferences.",
    username: "Username",
    email: "Email",
    cefrLevel: "CEFR Level",
    selectLevel: "Select Level",
    newPassword: "New Password (leave blank to keep current)",
    confirmPassword: "Confirm Password",
    saving: "Saving...",
    saveChanges: "Save Changes",
    signOut: "Sign out",
    loading: "Loading...",
    profileUpdated: "Profile updated successfully",
    failedToUpdateProfile: "Failed to update profile",
    failedToLoadProfile: "Failed to load profile",
    passwordsDoNotMatch: "Passwords do not match",
    logoutFailed: "Logout failed",

    // Lesson – feedback footer
    nicelyDone: "Nicely done!",
    tryAgain: "Try again.",
    hmmTryAgain: "Hmm... Try again.",
    correctSolution: "Correct solution:",
    practiceAgain: "Practice again",
    check: "Check",
    next: "Next",
    retry: "Retry",
    continue: "Continue",
    exerciseSkipped: "Exercise skipped for 15 minutes.",
    listeningDisabled: "Listening exercises disabled for 15 minutes.",
    speakingDisabled: "Speaking exercises disabled for 15 minutes.",
    voiceUnavailable: "Voice recognition unavailable.",
    letsMove: "Let's Move On.",
    failedToSaveProgress: "Failed to save progress. Please try again.",
    failedToSaveProgressRetry: "Failed to save progress. Please retry.",
    validationFailed: "Validation failed.",

    // Lesson complete
    greatJob: "Great job!",
    lessonComplete: "You've completed the lesson.",
    lessonEmptyTitle: "Lesson Empty",
    lessonEmptyDesc: "This lesson doesn't have any exercises yet. Check back later!",
    score: "Score",
    hearts: "Hearts",
    heartsLeft: "Hearts Left",
    totalXP: "Total XP",

    // Exercise instructions
    completeExercise: "Complete the exercise",
    selectCorrectResponse: "Select the correct response",
    formCorrectSentence: "Form the correct sentence",
    translateSentence: "Translate this sentence",
    whichIs: (word: string) => `Which of these is the "${word}"?`,
    typeWhatYouHear: "Type what you hear",
    listenSelectWords: "Listen and select the words",
    speakSentence: "Speak this sentence",
    selectCorrectMeaning: "Select the correct meaning",

    // Lesson – ignore buttons
    cantListenNow: "Can't listen now",
    cantSpeakNow: "Can't speak now",

    // Modals
    outOfHearts: "You ran out of hearts!",
    heartsRegenerate:
      "Hearts regenerate automatically over time. Come back later or keep practising to earn more.",
    backToLessons: "Back to lessons",
    noThanks: "No thanks",
    waitDontGo: "Wait, don't go!",
    aboutToLeave: "You're about to leave the lesson. Are you sure?",
    keepLearning: "Keep learning",
    endSession: "End session",
    practiceLesson: "Practice lesson",
    practiceLessonDesc:
      "Use practice lessons to regain hearts and points. You cannot lose hearts or points in practice lessons.",
    iUnderstand: "I understand",

    // Unit banner
    continueLearningBtn: "Continue",

    // Exercise submit button states
    submitted: "Submitted",
  },
  vi: {
    // Navigation
    learn: "Học",
    profile: "Hồ sơ",
    quests: "Nhiệm vụ",
    viewAll: "Xem tất cả",
    returnToLearn: "Quay lại học",

    // Course selection
    currentlyLearning: "Đang học",
    continueLearning: "Tiếp tục học",
    addCourse: "Thêm khóa học",
    noOtherCourses: "Không có khóa học nào khác.",
    courseSelected: "Đã chọn khóa học",
    somethingWentWrong: "Đã xảy ra lỗi",

    // Quests
    completeQuestsHint: "Hoàn thành nhiệm vụ bằng cách kiếm điểm.",
    earnXP: (value: number) => `Kiếm ${value} XP`,

    // Profile
    settings: "Cài đặt",
    manageAccount: "Quản lý tài khoản và tùy chọn của bạn.",
    username: "Tên người dùng",
    email: "Email",
    cefrLevel: "Trình độ CEFR",
    selectLevel: "Chọn trình độ",
    newPassword: "Mật khẩu mới (để trống để giữ nguyên)",
    confirmPassword: "Xác nhận mật khẩu",
    saving: "Đang lưu...",
    saveChanges: "Lưu thay đổi",
    signOut: "Đăng xuất",
    loading: "Đang tải...",
    profileUpdated: "Cập nhật hồ sơ thành công",
    failedToUpdateProfile: "Cập nhật hồ sơ thất bại",
    failedToLoadProfile: "Không thể tải hồ sơ",
    passwordsDoNotMatch: "Mật khẩu không khớp",
    logoutFailed: "Đăng xuất thất bại",

    // Lesson – feedback footer
    nicelyDone: "Tuyệt lắm!",
    tryAgain: "Thử lại.",
    hmmTryAgain: "Hmm... Thử lại.",
    correctSolution: "Đáp án đúng:",
    practiceAgain: "Luyện tập lại",
    check: "Kiểm tra",
    next: "Tiếp theo",
    retry: "Thử lại",
    continue: "Tiếp tục",
    exerciseSkipped: "Bài tập đã bỏ qua trong 15 phút.",
    listeningDisabled: "Bài nghe đã tắt trong 15 phút.",
    speakingDisabled: "Bài nói đã tắt trong 15 phút.",
    voiceUnavailable: "Nhận dạng giọng nói không khả dụng.",
    letsMove: "Tiếp tục thôi.",
    failedToSaveProgress: "Lưu tiến độ thất bại. Vui lòng thử lại.",
    failedToSaveProgressRetry: "Lưu tiến độ thất bại. Vui lòng thử lại.",
    validationFailed: "Xác thực thất bại.",

    // Lesson complete
    greatJob: "Làm tốt lắm!",
    lessonComplete: "Bạn đã hoàn thành bài học.",
    lessonEmptyTitle: "Bài học trống",
    lessonEmptyDesc: "Bài học này chưa có bài tập nào. Vui lòng quay lại sau!",
    score: "Điểm",
    hearts: "Tim",
    heartsLeft: "Tim còn lại",
    totalXP: "Tổng XP",

    // Exercise instructions
    completeExercise: "Hoàn thành bài tập",
    selectCorrectResponse: "Chọn câu trả lời đúng",
    formCorrectSentence: "Tạo câu đúng",
    translateSentence: "Dịch câu này",
    whichIs: (word: string) => `Cái nào là "${word}"?`,
    typeWhatYouHear: "Gõ những gì bạn nghe",
    listenSelectWords: "Nghe và chọn từ",
    speakSentence: "Đọc câu này",
    selectCorrectMeaning: "Chọn nghĩa đúng",

    // Lesson – ignore buttons
    cantListenNow: "Không thể nghe lúc này",
    cantSpeakNow: "Không thể nói lúc này",

    // Modals
    outOfHearts: "Bạn đã hết tim!",
    heartsRegenerate:
      "Tim tự động phục hồi theo thời gian. Quay lại sau hoặc tiếp tục luyện tập để kiếm thêm.",
    backToLessons: "Quay lại bài học",
    noThanks: "Không cảm ơn",
    waitDontGo: "Chờ đã, đừng đi!",
    aboutToLeave: "Bạn sắp rời bài học. Bạn có chắc không?",
    keepLearning: "Tiếp tục học",
    endSession: "Kết thúc phiên",
    practiceLesson: "Bài luyện tập",
    practiceLessonDesc:
      "Dùng bài luyện tập để lấy lại tim và điểm. Bạn không thể mất tim hoặc điểm trong bài luyện tập.",
    iUnderstand: "Tôi hiểu rồi",

    // Unit banner
    continueLearningBtn: "Tiếp tục",

    // Exercise submit button states
    submitted: "Đã gửi",
  },
} as const;

export type Translations = {
  [K in keyof typeof translations["en"]]: (typeof translations["en"])[K] extends (
    ...args: infer A
  ) => string
    ? (...args: A) => string
    : string;
};

export function getLocaleFromCourse(courseTitle?: string | null): Locale {
  if (!courseTitle) return "en";
  const lower = courseTitle.toLowerCase();
  if (lower.includes("tieng anh") || lower.includes("tiếng anh")) return "vi";
  return "en";
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale] as unknown as Translations;
}

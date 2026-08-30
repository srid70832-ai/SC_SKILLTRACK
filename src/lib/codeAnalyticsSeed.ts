import { 
  CodeAnalyticsStudentMetrics, 
  CodingContest, 
  LiveActivityFeedItem, 
  Student 
} from '../types';

export function generateInitialCodeAnalyticsData(students: Student[]) {
  const codeAnalyticsStudents: Record<string, CodeAnalyticsStudentMetrics> = {};
  const feedItems: LiveActivityFeedItem[] = [];
  const contests: CodingContest[] = [];

  students.forEach((student) => {
    const regUpper = student.registerNumber.toUpperCase();

    const studentMetric: CodeAnalyticsStudentMetrics = {
      registerNumber: regUpper,
      studentName: student.studentName,
      department: student.department || 'AI&DS',
      section: student.section || 'A',
      year: student.year || 'I',
      mentorName: student.mentorName || 'Mrs. V. Prema',
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80`,
      profileLinks: {
        leetcode: '',
        codechef: '',
        codeforces: '',
        atcoder: '',
        codolio: '',
        github: ''
      },
      problemsSolvedToday: 0,
      problemsSolvedYesterday: 0,
      weeklyCount: 0,
      monthlyCount: 0,
      totalSolved: 0,
      contestParticipation: 0,
      contestRank: 0,
      contestRating: 0,
      currentRating: 0,
      maxRating: 0,
      xp: 0,
      streakDays: 0,
      lastActiveAt: '🟡 Waiting for Sync',
      isActiveToday: false,
      difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
      languagesUsed: {},
      platformBreakdown: {
        LeetCode: 0,
        CodeChef: 0,
        Codeforces: 0,
        AtCoder: 0,
        Codolio: 0,
        HackerRank: 0,
        GitHub: 0,
        GeeksforGeeks: 0
      },
      badges: [],
      recentSubmissions: [],
      heatmap: {},
      contestHistory: []
    };

    codeAnalyticsStudents[regUpper] = studentMetric;
  });

  return {
    codeAnalyticsStudents,
    feedItems,
    contests
  };
}

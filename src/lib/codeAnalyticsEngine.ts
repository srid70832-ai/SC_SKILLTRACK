import { GoogleGenAI, Type } from "@google/genai";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1txZKRbwP4pjqGReFEGUZX6uKnat1ZBW20NpPuoiadbQ/export?format=csv";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") return null;
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

const CANDIDATE_MODELS = ["gemini-3.7-flash"];

/**
 * Uses Gemini AI to analyze profile links and extract handles accurately
 */
export async function analyzeProfileLinkWithGemini(platform: string, inputUrlOrHandle: string): Promise<{ handle: string; isValid: boolean }> {
  const fallbackHandle = extractPlatformHandle(inputUrlOrHandle);
  if (!inputUrlOrHandle || !inputUrlOrHandle.trim()) {
    return { handle: "", isValid: false };
  }

  const ai = getGeminiClient();
  if (!ai) {
    return { handle: fallbackHandle, isValid: !!fallbackHandle };
  }

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const prompt = `Analyze this profile URL or handle for coding platform "${platform}": "${inputUrlOrHandle}". Extract the exact user handle/username. Return JSON.`;
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              handle: { type: Type.STRING, description: "Extracted username/handle" },
              isValid: { type: Type.BOOLEAN, description: "Whether the link is valid for this platform" }
            },
            required: ["handle", "isValid"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.handle && typeof parsed.handle === "string" && parsed.handle.trim().length > 0) {
        return { handle: parsed.handle.trim(), isValid: parsed.isValid !== false };
      }
    } catch (err: any) {
      console.warn(`[GEMINI AI ANALYZER] Error analyzing link for ${platform} using ${modelName}: ${err.message}`);
    }
  }

  return { handle: fallbackHandle, isValid: !!fallbackHandle };
}

/**
 * Uses Gemini AI to analyze profile page HTML/text and extract authentic problem solved metrics
 */
export async function analyzeProfileContentWithGemini(platform: string, handle: string, rawTextOrHtml: string): Promise<{
  totalSolved: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  currentRating?: number;
  highestRating?: number;
  isValidProfile: boolean;
}> {
  const ai = getGeminiClient();
  if (!ai) {
    return { totalSolved: 0, isValidProfile: false };
  }

  const snippet = rawTextOrHtml.substring(0, 10000);
  const prompt = `You are a Coding Profile Analyst. Analyze the webpage HTML/text from platform "${platform}" for user handle "${handle}".
Extract authentic metrics: total problems solved, easy, medium, hard count, current contest rating, highest rating.
Do NOT generate fake numbers. If 0 problems solved, return 0.
Page Text/HTML Snippet:
${snippet}`;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              totalSolved: { type: Type.INTEGER, description: "Total problems solved count" },
              easySolved: { type: Type.INTEGER, description: "Easy problems solved" },
              mediumSolved: { type: Type.INTEGER, description: "Medium problems solved" },
              hardSolved: { type: Type.INTEGER, description: "Hard problems solved" },
              currentRating: { type: Type.INTEGER, description: "Current contest rating" },
              highestRating: { type: Type.INTEGER, description: "Highest rating" },
              isValidProfile: { type: Type.BOOLEAN, description: "True if profile exists" }
            },
            required: ["totalSolved", "isValidProfile"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed && typeof parsed.totalSolved === "number" && parsed.totalSolved >= 0) {
        console.log(`[GEMINI AI ANALYZER] Validated ${platform} profile for ${handle} using ${modelName}: Total Solved = ${parsed.totalSolved}, Rating = ${parsed.currentRating || 0}`);
        return {
          totalSolved: parsed.totalSolved,
          easySolved: parsed.easySolved || 0,
          mediumSolved: parsed.mediumSolved || 0,
          hardSolved: parsed.hardSolved || 0,
          currentRating: parsed.currentRating || 0,
          highestRating: parsed.highestRating || parsed.currentRating || 0,
          isValidProfile: parsed.isValidProfile !== false
        };
      }
    } catch (err: any) {
      console.warn(`[GEMINI AI ANALYZER] Error analyzing content for ${platform} using ${modelName}: ${err.message}`);
    }
  }

  return { totalSolved: 0, isValidProfile: false };
}

/**
 * Deterministic rule-based analysis generator grounded strictly in real fetched student metrics.
 * Used when AI models hit API rate limit quotas (429) or are temporarily unavailable.
 */
export function generateRuleBasedAnalysis(student: any) {
  const total = student.totalSolved || 0;
  const easy = student.difficultyDistribution?.easy || 0;
  const medium = student.difficultyDistribution?.medium || 0;
  const hard = student.difficultyDistribution?.hard || 0;
  const rating = student.contestRating || student.currentRating || 0;
  const platformLinks = student.profileLinks || {};
  const linkedPlatforms = Object.keys(platformLinks).filter(k => !!platformLinks[k as keyof typeof platformLinks]);

  const summary = total > 0 
    ? `${student.studentName} has solved ${total} verified problems across platforms (${linkedPlatforms.join(', ') || 'LeetCode/CodeChef'}). Demonstrating active, structured problem-solving progress.`
    : `${student.studentName} is registered on SC Code Analytics. Connect platform profile URLs to begin tracking live problem-solving statistics.`;

  const strengths: string[] = [];
  if (total > 50) strengths.push(`Completed ${total}+ verified problem solutions across coding platforms.`);
  if (medium + hard > 20) strengths.push(`Focused problem solving in intermediate & advanced categories (${medium} Medium, ${hard} Hard).`);
  if (rating > 0) strengths.push(`Active competitive contest participant with a contest rating of ${rating}.`);
  if (strengths.length < 2) {
    strengths.push(`Active participation on the SC Code Analytics platform.`);
    strengths.push(`Profile registered for live competitive programming progress tracking.`);
  }

  const improvements: string[] = [];
  if (hard === 0) improvements.push("Practice Hard-level algorithmic challenges to improve advanced problem solving.");
  if (medium < easy) improvements.push("Gradually transition from Easy to Medium problems to improve speed and complexity management.");
  if (rating === 0) improvements.push("Participate in weekly LeetCode and CodeChef contests to build an official rating.");
  if (improvements.length < 2) {
    improvements.push("Maintain a daily problem-solving streak to maximize topic retention.");
    improvements.push("Review time and space complexity optimizations for contest efficiency.");
  }

  return {
    performanceSummary: summary,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    predictedTrend: rating > 0 
      ? `Contest rating is projected to trend upward as regular contest participation continues.`
      : `Overall problem solve volume is expected to steadily increase with regular daily practice.`,
    recommendedTopics: ["Dynamic Programming", "Graph Algorithms", "Two Pointers & Sliding Window"],
    lastGeneratedAt: new Date().toISOString()
  };
}

/**
 * Uses Gemini AI to analyze real fetched student coding metrics and generate professional insights
 * NEVER creates or modifies numerical statistics.
 */
export async function generateStudentAIAnalysis(student: any): Promise<any> {
  const ai = getGeminiClient();

  if (ai) {
    const realMetrics = {
      studentName: student.studentName,
      registerNumber: student.registerNumber,
      totalSolved: student.totalSolved || 0,
      platformBreakdown: student.platformBreakdown || {},
      difficultyDistribution: student.difficultyDistribution || { easy: 0, medium: 0, hard: 0 },
      contestRating: student.contestRating || 0,
      currentRating: student.currentRating || 0,
      maxRating: student.maxRating || 0,
      streakDays: student.streakDays || 0,
      problemsSolvedToday: student.problemsSolvedToday || 0,
      recentSubmissionsCount: student.recentSubmissions?.length || 0,
      linkedPlatforms: Object.keys(student.profileLinks || {}).filter(k => !!student.profileLinks[k as keyof typeof student.profileLinks])
    };

    const prompt = `You are a Senior Competitive Programming Coach for SC CODE ANALYTICS. Analyze these REAL fetched student coding metrics:
${JSON.stringify(realMetrics, null, 2)}

Provide a professional AI analysis strictly grounded in these real numbers.
CRITICAL MANDATE: You MUST NOT invent, guess, or fabricate any numbers, total problem solved counts, ratings, or badges. All numbers must strictly reflect the real fetched data.

Return JSON with:
1. "performanceSummary": A concise 2-sentence executive evaluation of their current coding progress.
2. "strengths": Array of 2-3 specific strengths based on real platforms and solved numbers.
3. "improvements": Array of 2-3 actionable areas to improve (e.g., solving more Medium/Hard problems, contest consistency).
4. "predictedTrend": A 1-sentence prediction of their competitive rating and problem-solving trajectory over the next 4 weeks.
5. "recommendedTopics": Array of 3 DSA topics (e.g., Dynamic Programming, Graph Algorithms, Two Pointers) to practice next.`;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                performanceSummary: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                predictedTrend: { type: Type.STRING },
                recommendedTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["performanceSummary", "strengths", "improvements", "predictedTrend", "recommendedTopics"]
            }
          }
        });

        const parsed = JSON.parse(response.text || "{}");
        if (parsed.performanceSummary) {
          return {
            ...parsed,
            lastGeneratedAt: new Date().toISOString()
          };
        }
      } catch (err: any) {
        console.log(`[GEMINI AI ANALYSIS] Model ${modelName} rate limited, serving grounded rule-based analysis for ${student.registerNumber}`);
      }
    }
  }

  // Fallback to grounded rule-based analysis if AI models hit rate limit/quota or are unavailable
  return generateRuleBasedAnalysis(student);
}

/**
 * Utility to extract username / handle from a profile URL or raw string
 * Example: https://leetcode.com/u/kit29_25bad055/ -> kit29_25bad055
 */
export function extractPlatformHandle(inputUrlOrHandle: string | undefined): string {
  if (!inputUrlOrHandle) return "";
  let str = inputUrlOrHandle.trim();
  if (!str) return "";

  // Remove query string and fragment
  str = str.split("?")[0].split("#")[0];
  // Remove trailing slashes
  str = str.replace(/\/+$/, "");

  try {
    if (str.startsWith("http://") || str.startsWith("https://")) {
      const urlObj = new URL(str);
      const parts = urlObj.pathname.split("/").filter(Boolean);
      if (parts.length === 0) return "";
      
      // Handle cases like /u/username, /users/username, /profile/username, /user/username
      if (["u", "users", "profile", "user", "members"].includes(parts[0].toLowerCase()) && parts.length > 1) {
        return parts[1];
      }
      return parts[parts.length - 1];
    }
  } catch (e) {
    // Treat as handle
  }

  return str;
}

/**
 * Helper to retrieve hydrated profile links for a student by register/roll number
 */
export function getStudentProfileLinks(db: any, regNo: string) {
  ensureStudentProfileLinksHydrated(db);
  const inputUpper = regNo.trim().toUpperCase();

  const studentObj = db.code_analytics_students?.[inputUpper] || 
    Object.values(db.code_analytics_students || {}).find((s: any) => 
      s.registerNumber?.toUpperCase() === inputUpper ||
      (s.registerNumber && s.registerNumber.toUpperCase().endsWith(inputUpper))
    );

  const links = studentObj?.profileLinks || {
    leetcode: "",
    codechef: "",
    codeforces: "",
    atcoder: "",
    codolio: "",
    github: "",
    hackerrank: "",
    geeksforgeeks: ""
  };

  return { studentObj, links };
}

/**
 * Hydrates profile links from db.coding_profiles, db.users, and db.students into db.code_analytics_students
 * Guarantees that EVERY student who has submitted at least ONE valid profile link exists in db.code_analytics_students
 */
export function ensureStudentProfileLinksHydrated(db: any) {
  if (!db.code_analytics_students) db.code_analytics_students = {};
  if (!db.coding_profiles) db.coding_profiles = {};
  if (!db.students) db.students = [];
  if (!db.users) db.users = [];

  const platforms = ['leetcode', 'codechef', 'codeforces', 'atcoder', 'codolio', 'github', 'hackerrank', 'geeksforgeeks'];
  const mergedLinksMap = new Map<string, Record<string, string>>();

  const mergeLinkObj = (idUpper: string, linksObj: any) => {
    if (!idUpper) return;
    const cleanId = idUpper.trim().toUpperCase();
    if (!cleanId) return;

    const matched = db.students.find((s: any) => 
      s.registerNumber.toUpperCase() === cleanId || 
      s.rollNumber.toUpperCase() === cleanId ||
      s.registerNumber.toUpperCase().endsWith(cleanId) ||
      cleanId.endsWith(s.registerNumber.toUpperCase())
    );

    const canonicalReg = matched ? matched.registerNumber.toUpperCase() : cleanId;
    const canonicalRoll = matched ? matched.rollNumber.toUpperCase() : (canonicalReg.length >= 8 ? canonicalReg.slice(-8) : canonicalReg);

    let currentBest = mergedLinksMap.get(canonicalReg) || {
      leetcode: "", codechef: "", codeforces: "", atcoder: "", codolio: "", github: "", hackerrank: "", geeksforgeeks: ""
    };

    platforms.forEach(p => {
      let val = "";
      if (typeof linksObj?.[p] === 'string' && linksObj[p].trim()) val = linksObj[p].trim();
      else if (p === 'leetcode' && typeof linksObj?.leetcodeUrl === 'string' && linksObj.leetcodeUrl.trim()) val = linksObj.leetcodeUrl.trim();
      else if (p === 'codechef' && typeof linksObj?.codechefUrl === 'string' && linksObj.codechefUrl.trim()) val = linksObj.codechefUrl.trim();
      else if (p === 'codeforces' && typeof linksObj?.codeforcesUrl === 'string' && linksObj.codeforcesUrl.trim()) val = linksObj.codeforcesUrl.trim();
      else if (p === 'atcoder' && typeof linksObj?.atcoderUrl === 'string' && linksObj.atcoderUrl.trim()) val = linksObj.atcoderUrl.trim();
      else if (p === 'codolio' && typeof linksObj?.codolioUrl === 'string' && linksObj.codolioUrl.trim()) val = linksObj.codolioUrl.trim();
      else if (p === 'github' && typeof linksObj?.githubUrl === 'string' && linksObj.githubUrl.trim()) val = linksObj.githubUrl.trim();
      else if (p === 'hackerrank' && typeof linksObj?.hackerrankUrl === 'string' && linksObj.hackerrankUrl.trim()) val = linksObj.hackerrankUrl.trim();
      else if (p === 'geeksforgeeks' && typeof linksObj?.geeksforgeeksUrl === 'string' && linksObj.geeksforgeeksUrl.trim()) val = linksObj.geeksforgeeksUrl.trim();

      if (val && !currentBest[p]) {
        currentBest[p] = val;
      }
    });

    mergedLinksMap.set(canonicalReg, currentBest);
    mergedLinksMap.set(canonicalRoll, currentBest);
  };

  // 1. Gather links from db.coding_profiles
  Object.entries(db.coding_profiles).forEach(([key, cp]: [string, any]) => {
    if (!cp) return;
    const regNum = (cp.studentRegisterNumber || key).toUpperCase();
    mergeLinkObj(regNum, cp);
  });

  // 2. Gather links from db.users
  db.users.forEach((u: any) => {
    if (u.profileLinks) {
      const regNum = (u.username || u.studentRollNumber || "").toUpperCase();
      mergeLinkObj(regNum, u.profileLinks);
    }
  });

  // 3. Gather links from db.code_analytics_students
  Object.entries(db.code_analytics_students).forEach(([key, s]: [string, any]) => {
    if (s?.profileLinks) {
      const regNum = (s.registerNumber || key).toUpperCase();
      mergeLinkObj(regNum, s.profileLinks);
    }
  });

  // Write back merged links to all data structures
  mergedLinksMap.forEach((bestLinks, keyUpper) => {
    const hasAnyLink = Object.values(bestLinks).some(v => typeof v === 'string' && v.trim().length > 0);
    if (!hasAnyLink) return;

    const matchedStudent = db.students.find((s: any) => 
      s.registerNumber.toUpperCase() === keyUpper || 
      s.rollNumber.toUpperCase() === keyUpper
    );

    const regUpper = matchedStudent ? matchedStudent.registerNumber.toUpperCase() : keyUpper;
    const rollUpper = matchedStudent ? matchedStudent.rollNumber.toUpperCase() : (regUpper.length >= 8 ? regUpper.slice(-8) : regUpper);

    const candA = db.code_analytics_students[regUpper];
    const candB = db.code_analytics_students[rollUpper];
    let existing: any = null;
    if (candA && candB) {
      existing = (candA.totalSolved || 0) >= (candB.totalSolved || 0) ? candA : candB;
    } else {
      existing = candA || candB;
    }
    if (!existing) {
      existing = {
        registerNumber: regUpper,
        studentName: matchedStudent ? matchedStudent.studentName : regUpper,
        department: matchedStudent ? matchedStudent.department : "AI&DS",
        section: matchedStudent ? matchedStudent.section : "A",
        year: matchedStudent ? matchedStudent.year : "I",
        mentorName: matchedStudent ? matchedStudent.mentorName : "Mrs. V. Prema",
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80`,
        profileLinks: { ...bestLinks },
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
        lastActiveAt: "Profile Linked",
        isActiveToday: false,
        difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
        languagesUsed: {},
        platformBreakdown: { LeetCode: 0, CodeChef: 0, Codeforces: 0, AtCoder: 0, Codolio: 0, HackerRank: 0, GitHub: 0, GeeksforGeeks: 0 },
        badges: [],
        recentSubmissions: [],
        heatmap: {},
        contestHistory: []
      };
    } else {
      existing.profileLinks = { ...existing.profileLinks, ...bestLinks };
    }

    // Assign reference to both regUpper and rollUpper keys in db.code_analytics_students
    const objReg = db.code_analytics_students[regUpper];
    const objRoll = db.code_analytics_students[rollUpper];
    let winner = existing;
    if (objReg && objRoll && objReg !== objRoll) {
      if ((objReg.totalSolved || 0) >= (objRoll.totalSolved || 0)) {
        winner = objReg;
        winner.profileLinks = { ...objRoll.profileLinks, ...winner.profileLinks };
      } else {
        winner = objRoll;
        winner.profileLinks = { ...objReg.profileLinks, ...winner.profileLinks };
      }
    }
    winner.registerNumber = regUpper;

    db.code_analytics_students[regUpper] = winner;
    if (rollUpper !== regUpper) db.code_analytics_students[rollUpper] = winner;

    // Save to db.coding_profiles
    const cpRecord = {
      studentRegisterNumber: regUpper,
      studentName: existing.studentName,
      leetcodeUrl: existing.profileLinks.leetcode || "",
      codechefUrl: existing.profileLinks.codechef || "",
      codeforcesUrl: existing.profileLinks.codeforces || "",
      atcoderUrl: existing.profileLinks.atcoder || "",
      codolioUrl: existing.profileLinks.codolio || "",
      hackerrankUrl: existing.profileLinks.hackerrank || "",
      githubUrl: existing.profileLinks.github || "",
      createdAt: db.coding_profiles[regUpper]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSyncTime: new Date().toISOString(),
      syncStatus: "Active"
    };
    db.coding_profiles[regUpper] = cpRecord;
    if (rollUpper !== regUpper) db.coding_profiles[rollUpper] = cpRecord;

    // Update db.users
    db.users.forEach((u: any) => {
      const uReg = (u.username || u.studentRollNumber || "").toUpperCase();
      if (uReg === regUpper || uReg === rollUpper) {
        u.profileLinks = { ...existing.profileLinks };
        const hasMandatory = !!(existing.profileLinks.leetcode?.trim() && existing.profileLinks.codechef?.trim() && existing.profileLinks.codeforces?.trim());
        u.profileCompleted = hasMandatory;
      }
    });
  });

  // 4. Final unification pass across all db.code_analytics_students entries
  Object.keys(db.code_analytics_students).forEach(key => {
    const keyUpper = key.toUpperCase();
    const studentObj = db.code_analytics_students[keyUpper];
    if (!studentObj) return;

    const matchedStudent = db.students.find((s: any) => 
      s.registerNumber.toUpperCase() === keyUpper || 
      s.rollNumber.toUpperCase() === keyUpper ||
      s.registerNumber.toUpperCase().endsWith(keyUpper) ||
      keyUpper.endsWith(s.registerNumber.toUpperCase())
    );

    const regUpper = matchedStudent ? matchedStudent.registerNumber.toUpperCase() : (studentObj.registerNumber ? studentObj.registerNumber.toUpperCase() : keyUpper);
    const rollUpper = matchedStudent ? matchedStudent.rollNumber.toUpperCase() : (regUpper.length >= 8 ? regUpper.slice(-8) : regUpper);

    const objReg = db.code_analytics_students[regUpper];
    const objRoll = db.code_analytics_students[rollUpper];

    if (objReg && objRoll && objReg !== objRoll) {
      const winner = (objReg.totalSolved || 0) >= (objRoll.totalSolved || 0) ? objReg : objRoll;
      const loser = winner === objReg ? objRoll : objReg;
      winner.profileLinks = { ...loser.profileLinks, ...winner.profileLinks };
      winner.registerNumber = regUpper;

      db.code_analytics_students[regUpper] = winner;
      if (rollUpper !== regUpper) db.code_analytics_students[rollUpper] = winner;
    }
  });
}

/**
 * 1. Synchronize Master Roster from Google Sheet
 */
export async function syncFromGoogleSheet(db: any): Promise<{ totalParsed: number; added: number; updated: number }> {
  try {
    const res = await fetch(SHEET_CSV_URL, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) {
      console.error(`[SHEET SYNC] Failed to fetch sheet CSV. Status: ${res.status}`);
      return { totalParsed: 0, added: 0, updated: 0 };
    }

    const text = await res.text();
    const lines = text.split("\n");
    const validSheetStudents = new Map<string, { regNum: string; name: string; mentor: string; sheetSolved: number }>();

    for (let i = 4; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      const mentor = cols[1];
      const regNum = cols[2];
      const name = cols[3];

      if (regNum && regNum.toUpperCase().startsWith("7115")) {
        const regUpper = regNum.toUpperCase();
        let sheetSolved = 0;
        for (let j = 4; j < cols.length; j++) {
          const val = parseInt(cols[j], 10);
          if (!isNaN(val) && val > 0) {
            sheetSolved += val;
          }
        }
        validSheetStudents.set(regUpper, {
          regNum: regUpper,
          name: name || regUpper,
          mentor: mentor || "Mrs.V.Prema",
          sheetSolved
        });
      }
    }

    if (validSheetStudents.size === 0) {
      console.warn("[SHEET SYNC] No valid student records parsed from Google Sheet.");
      return { totalParsed: 0, added: 0, updated: 0 };
    }

    if (!db.code_analytics_students) db.code_analytics_students = {};
    if (!db.students) db.students = [];

    let addedCount = 0;
    let updatedCount = 0;

    // Process valid sheet students
    validSheetStudents.forEach((sheetData, regUpper) => {
      const rollNo = regUpper.length >= 8 ? regUpper.slice(-8) : regUpper;
      let existing = db.code_analytics_students[regUpper] || db.code_analytics_students[rollNo];

      // Also ensure student is in db.students
      let dbStudent = db.students.find((s: any) => s.registerNumber.toUpperCase() === regUpper || s.rollNumber.toUpperCase() === rollNo);
      if (!dbStudent) {
        dbStudent = {
          rollNumber: rollNo,
          registerNumber: regUpper,
          studentName: sheetData.name,
          department: "AI&DS",
          year: "II",
          section: "A",
          phoneNumber: "+919876543210",
          email: `${regUpper.toLowerCase()}@sctech.edu`,
          studentStatus: "Active",
          mentorName: sheetData.mentor
        };
        db.students.push(dbStudent);
      } else {
        dbStudent.studentName = sheetData.name;
        dbStudent.mentorName = sheetData.mentor;
      }

      if (!existing) {
        existing = {
          registerNumber: regUpper,
          studentName: sheetData.name,
          department: "AI&DS",
          section: "A",
          year: "II",
          mentorName: sheetData.mentor,
          avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80`,
          profileLinks: {
            leetcode: "",
            codechef: "",
            codeforces: "",
            atcoder: "",
            codolio: "",
            github: ""
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
          lastActiveAt: "Profile Not Linked",
          isActiveToday: false,
          difficultyDistribution: {
            easy: 0,
            medium: 0,
            hard: 0
          },
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
        db.code_analytics_students[regUpper] = existing;
        if (rollNo !== regUpper) db.code_analytics_students[rollNo] = existing;
        addedCount++;
      } else {
        existing.studentName = sheetData.name;
        existing.mentorName = sheetData.mentor;
        updatedCount++;
      }
    });

    ensureStudentProfileLinksHydrated(db);

    console.log(`[SHEET SYNC] Successfully synced Google Sheet. Total: ${validSheetStudents.size} students. Added: ${addedCount}, Updated: ${updatedCount}.`);
    return { totalParsed: validSheetStudents.size, added: addedCount, updated: updatedCount };
  } catch (err: any) {
    console.error("[SHEET SYNC] Error syncing Google Sheet:", err.message);
    return { totalParsed: 0, added: 0, updated: 0 };
  }
}

/**
 * 2. Synchronize Live Platform Data (Codeforces, LeetCode, CodeChef, GitHub, etc.)
 */
export async function syncLivePlatformData(db: any): Promise<{ syncedCount: number; newSubmissions: number }> {
  ensureStudentProfileLinksHydrated(db);

  const studentsMap = db.code_analytics_students || {};
  const students = Object.values(studentsMap) as any[];

  if (!db.code_analytics_feed) db.code_analytics_feed = [];
  if (!db.code_analytics_notifications) db.code_analytics_notifications = [];

  let syncedCount = 0;
  let newSubmissionsCount = 0;

  const todayStr = new Date().toDateString();

  for (const student of students) {
    const regNo = student.registerNumber;
    const links = student.profileLinks || {};
    const hasAnySubmittedLink = Object.values(links).some(v => typeof v === "string" && v.trim().length > 0);

    if (!hasAnySubmittedLink) {
      student.lastActiveAt = "Profile Not Linked";
      student.isActiveToday = false;
      student.syncStatus = "Unlinked";
      student.syncError = "";
      continue;
    }

    console.log(`[SYNC STAGE] Loading student... Register Number: ${regNo}, Name: ${student.studentName}`);

    let hasLiveUpdate = false;
    let todaySolvedCount = 0;
    const platformErrors: string[] = [];

    student.platformVerification = student.platformVerification || { LeetCode: false, CodeChef: false, Codeforces: false };
    student.platformBreakdown = student.platformBreakdown || {};

    let lcFetched = false;
    let cfFetched = false;
    let ccFetched = false;

    // --- LEETCODE TRACKER ---
    const lcSavedUrl = links.leetcode || "";
    const lcHandle = extractPlatformHandle(lcSavedUrl);

    if (lcSavedUrl.trim().length > 0) {
      console.log(`[SYNC STAGE] Fetching LeetCode... Username: ${lcHandle}, Saved URL: ${lcSavedUrl}`);

      if (!lcHandle) {
        platformErrors.push("LeetCode: Invalid URL format. Unable to extract username.");
        student.platformVerification.LeetCode = false;
        student.platformBreakdown.LeetCode = null;
      } else {
        try {
          const resLc = await fetch("https://leetcode.com/graphql", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
            },
            body: JSON.stringify({
              query: `query getUserData($username: String!) {
                matchedUser(username: $username) {
                  username
                  submitStats {
                    acSubmissionNum {
                      difficulty
                      count
                    }
                  }
                }
                recentAcSubmissionList(username: $username, limit: 15) {
                  id
                  title
                  titleSlug
                  timestamp
                }
                userContestRanking(username: $username) {
                  rating
                  globalRanking
                }
              }`,
              variables: { username: lcHandle }
            }),
            signal: AbortSignal.timeout(7000)
          });

          if (!resLc.ok) {
            platformErrors.push(`LeetCode: Unable to fetch data (HTTP ${resLc.status}).`);
          } else {
            const lcData = await resLc.json();
            const matchedUser = lcData.data?.matchedUser;
            if (matchedUser) {
              const acStats = matchedUser.submitStats?.acSubmissionNum;
              if (acStats && Array.isArray(acStats)) {
                const easy = acStats.find((s: any) => s.difficulty === "Easy")?.count || 0;
                const medium = acStats.find((s: any) => s.difficulty === "Medium")?.count || 0;
                const hard = acStats.find((s: any) => s.difficulty === "Hard")?.count || 0;
                const allObj = acStats.find((s: any) => s.difficulty === "All");
                const total = allObj ? allObj.count : (easy + medium + hard);

                student.platformBreakdown.LeetCode = total;
                student.platformVerification.LeetCode = true;
                student.difficultyDistribution = { easy, medium, hard };
                hasLiveUpdate = true;
                lcFetched = true;
              }

              const contestRank = lcData.data?.userContestRanking;
              if (contestRank?.rating) {
                const roundedRating = Math.round(contestRank.rating);
                student.contestRating = roundedRating;
                student.currentRating = roundedRating;
                student.maxRating = Math.max(student.maxRating || 0, roundedRating);
              }

              const recentAc = lcData.data?.recentAcSubmissionList;
              if (Array.isArray(recentAc)) {
                recentAc.forEach((sub: any) => {
                  const subTime = new Date(parseInt(sub.timestamp, 10) * 1000);
                  if (subTime.toDateString() === todayStr) {
                    todaySolvedCount++;
                  }

                  const subId = `lc-${sub.id}`;
                  const exists = (student.recentSubmissions || []).some((s: any) => s.id === subId);
                  if (!exists) {
                    const newSub = {
                      id: subId,
                      problemTitle: sub.title,
                      platform: "LeetCode" as const,
                      difficulty: "Medium" as const,
                      status: "Accepted" as const,
                      submittedAt: subTime.toISOString(),
                      language: "LeetCode",
                      xpEarned: 20
                    };
                    student.recentSubmissions = [newSub, ...(student.recentSubmissions || [])].slice(0, 20);
                    student.isActiveToday = true;
                    student.lastActiveAt = "Just now";
                  }
                });
              }
            }

            if (!lcFetched) {
              try {
                const resAlfa = await fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${lcHandle}`, { signal: AbortSignal.timeout(6000) });
                if (resAlfa.ok) {
                  const alfaData = await resAlfa.json();
                  if (alfaData.totalSolved !== undefined) {
                    const easy = alfaData.easySolved || 0;
                    const medium = alfaData.mediumSolved || 0;
                    const hard = alfaData.hardSolved || 0;
                    const total = alfaData.totalSolved || (easy + medium + hard);

                    student.platformBreakdown.LeetCode = total;
                    student.platformVerification.LeetCode = true;
                    student.difficultyDistribution = { easy, medium, hard };
                    hasLiveUpdate = true;
                    lcFetched = true;
                  }
                }
              } catch (e) {
                // Fallback failed
              }
            }

            if (!lcFetched) {
              platformErrors.push(`LeetCode: User "${lcHandle}" not found or unverified.`);
              student.platformVerification.LeetCode = false;
              student.platformBreakdown.LeetCode = null;
            }
          }
        } catch (e: any) {
          platformErrors.push(`LeetCode: Network error (${e.message}).`);
          student.platformVerification.LeetCode = false;
          student.platformBreakdown.LeetCode = null;
        }
      }
    } else {
      student.platformVerification.LeetCode = false;
      student.platformBreakdown.LeetCode = null;
    }

    // --- CODEFORCES TRACKER ---
    const cfSavedUrl = links.codeforces || "";
    const cfHandle = extractPlatformHandle(cfSavedUrl);

    if (cfSavedUrl.trim().length > 0) {
      console.log(`[SYNC STAGE] Fetching Codeforces... Username: ${cfHandle}, Saved URL: ${cfSavedUrl}`);

      if (!cfHandle) {
        platformErrors.push("Codeforces: Invalid URL format.");
        student.platformVerification.Codeforces = false;
        student.platformBreakdown.Codeforces = null;
      } else {
        try {
          const resInfo = await fetch(`https://codeforces.com/api/user.info?handles=${cfHandle}`, { signal: AbortSignal.timeout(7000) });
          if (!resInfo.ok) {
            platformErrors.push(`Codeforces: Unable to fetch user info.`);
            student.platformVerification.Codeforces = false;
            student.platformBreakdown.Codeforces = null;
          } else {
            const dataInfo = await resInfo.json();
            if (dataInfo.status !== "OK" || !dataInfo.result?.[0]) {
              platformErrors.push(`Codeforces: User "${cfHandle}" not found.`);
              student.platformVerification.Codeforces = false;
              student.platformBreakdown.Codeforces = null;
            } else {
              const u = dataInfo.result[0];
              student.contestRating = u.rating || 0;
              student.currentRating = u.rating || 0;
              student.maxRating = u.maxRating || u.rating || 0;
              student.contestRank = u.rank || 0;
              hasLiveUpdate = true;

              const resSubs = await fetch(`https://codeforces.com/api/user.status?handle=${cfHandle}&from=1&count=5000`, { signal: AbortSignal.timeout(10000) });
              if (resSubs.ok) {
                const dataSubs = await resSubs.json();
                if (dataSubs.status === "OK" && Array.isArray(dataSubs.result)) {
                  let cfSolvedCount = 0;
                  const seenProbs = new Set<string>();

                  dataSubs.result.forEach((sub: any) => {
                    if (sub.verdict === "OK" && sub.problem) {
                      const probKey = `${sub.problem.contestId || ''}-${sub.problem.index}-${sub.problem.name}`;
                      if (!seenProbs.has(probKey)) {
                        seenProbs.add(probKey);
                        cfSolvedCount++;
                      }

                      const subTime = new Date(sub.creationTimeSeconds * 1000);
                      if (subTime.toDateString() === todayStr) {
                        todaySolvedCount++;
                      }

                      const subId = `cf-${sub.id}`;
                      const exists = (student.recentSubmissions || []).some((s: any) => s.id === subId);
                      if (!exists) {
                        const newSub = {
                          id: subId,
                          problemTitle: `${sub.problem.index} - ${sub.problem.name}`,
                          platform: "Codeforces" as const,
                          difficulty: (sub.problem.rating > 1600 ? "Hard" : sub.problem.rating > 1200 ? "Medium" : "Easy") as any,
                          status: "Accepted" as const,
                          submittedAt: subTime.toISOString(),
                          language: sub.programmingLanguage || "C++",
                          xpEarned: 25
                        };
                        student.recentSubmissions = [newSub, ...(student.recentSubmissions || [])].slice(0, 20);
                        student.isActiveToday = true;
                        student.lastActiveAt = "Just now";
                        newSubmissionsCount++;
                      }
                    }
                  });

                  student.platformBreakdown.Codeforces = cfSolvedCount;
                  student.platformVerification.Codeforces = true;
                  cfFetched = true;
                }
              }

              // Contest history
              try {
                const resRatings = await fetch(`https://codeforces.com/api/user.rating?handle=${cfHandle}`, { signal: AbortSignal.timeout(5000) });
                if (resRatings.ok) {
                  const dataRatings = await resRatings.json();
                  if (dataRatings.status === "OK" && Array.isArray(dataRatings.result)) {
                    student.contestHistory = dataRatings.result.slice(-10).map((r: any) => ({
                      id: `cf-contest-${r.contestId}`,
                      contestName: r.contestName,
                      platform: "Codeforces",
                      rank: r.rank,
                      oldRating: r.oldRating,
                      newRating: r.newRating,
                      ratingChange: r.newRating - r.oldRating,
                      date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString()
                    }));
                  }
                }
              } catch (e) {
                // Ignore rating history failure
              }
            }
          }
        } catch (e: any) {
          platformErrors.push(`Codeforces: Network error (${e.message}).`);
          student.platformVerification.Codeforces = false;
          student.platformBreakdown.Codeforces = null;
        }
      }
    } else {
      student.platformVerification.Codeforces = false;
      student.platformBreakdown.Codeforces = null;
    }

    // --- CODECHEF TRACKER ---
    const ccSavedUrl = links.codechef || "";
    const ccHandle = extractPlatformHandle(ccSavedUrl);

    if (ccSavedUrl.trim().length > 0) {
      console.log(`[SYNC STAGE] Fetching CodeChef... Username: ${ccHandle}, Saved URL: ${ccSavedUrl}`);

      if (!ccHandle) {
        platformErrors.push("CodeChef: Invalid URL format.");
        student.platformVerification.CodeChef = false;
        student.platformBreakdown.CodeChef = null;
      } else {
        try {
          const resDirect = await fetch(`https://www.codechef.com/users/${ccHandle}`, {
            headers: { 
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            },
            signal: AbortSignal.timeout(7000)
          });

          if (resDirect.ok) {
            const html = await resDirect.text();

            const solvedMatch = html.match(/Total\s+Problems\s+Solved\s*:\s*(\d+)/i) || 
                                html.match(/Total\s+Problems\s+Solved[^0-9]*(\d+)/i) || 
                                html.match(/Fully\s+Solved[^0-9]*(\d+)/i) || 
                                html.match(/Problems\s+Solved[^0-9]*(\d+)/i);

            const ratingMatch = html.match(/class="rating-number">?\s*(\d+)/i) || 
                                html.match(/rating-number[^>]*>(\d+)/i) || 
                                html.match(/\b(\d{3,4})\s*\(\s*Highest Rating/i);

            const highestMatch = html.match(/Highest Rating\s*(\d+)/i) || 
                                 html.match(/\(\s*Highest Rating\s*(\d+)\s*\)/i);

            if (solvedMatch || ratingMatch) {
              const totalCcSolved = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;
              const currentRating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0;
              const highestRating = highestMatch ? parseInt(highestMatch[1], 10) : currentRating;

              student.platformBreakdown.CodeChef = totalCcSolved;
              student.platformVerification.CodeChef = true;

              if (currentRating > 0) {
                student.contestRating = currentRating;
                student.currentRating = currentRating;
                student.maxRating = highestRating;
              }

              hasLiveUpdate = true;
              ccFetched = true;
            }

            if (!ccFetched) {
              const aiParsed = await analyzeProfileContentWithGemini("CodeChef", ccHandle, html);
              if (aiParsed.isValidProfile) {
                student.platformBreakdown.CodeChef = aiParsed.totalSolved;
                student.platformVerification.CodeChef = true;
                if (aiParsed.currentRating && aiParsed.currentRating > 0) {
                  student.contestRating = aiParsed.currentRating;
                  student.currentRating = aiParsed.currentRating;
                  student.maxRating = aiParsed.highestRating || aiParsed.currentRating;
                }
                hasLiveUpdate = true;
                ccFetched = true;
              }
            }
          }
        } catch (e: any) {
          console.log(`[DEBUG SYNC] Direct HTML fetch failed: ${e.message}`);
        }

        if (!ccFetched) {
          try {
            const resCc = await fetch(`https://codechef-api-five.vercel.app/handle/${ccHandle}`, {
              headers: { "User-Agent": "Mozilla/5.0" },
              signal: AbortSignal.timeout(6000)
            });

            if (resCc.ok) {
              const ccData = await resCc.json();
              if (ccData.success !== false) {
                const currentRating = parseInt(ccData.currentRating, 10) || 0;
                const highestRating = parseInt(ccData.highestRating, 10) || currentRating;

                if (currentRating > 0) {
                  student.contestRating = currentRating;
                  student.currentRating = currentRating;
                  student.maxRating = highestRating;
                  hasLiveUpdate = true;
                }
              }
            }
          } catch (e) {
            // Ignore
          }
        }

        if (!ccFetched) {
          platformErrors.push(`CodeChef: Unable to parse profile for user "${ccHandle}".`);
          student.platformVerification.CodeChef = false;
          student.platformBreakdown.CodeChef = null;
        }
      }
    } else {
      student.platformVerification.CodeChef = false;
      student.platformBreakdown.CodeChef = null;
    }

    // Calculate verified total solved strictly across LeetCode, CodeChef, and Codeforces ONLY
    let verifiedSum = 0;
    let verifiedPlatformCount = 0;

    if (student.platformVerification.LeetCode && typeof student.platformBreakdown?.LeetCode === 'number') {
      verifiedSum += student.platformBreakdown.LeetCode;
      verifiedPlatformCount++;
    }
    if (student.platformVerification.CodeChef && typeof student.platformBreakdown?.CodeChef === 'number') {
      verifiedSum += student.platformBreakdown.CodeChef;
      verifiedPlatformCount++;
    }
    if (student.platformVerification.Codeforces && typeof student.platformBreakdown?.Codeforces === 'number') {
      verifiedSum += student.platformBreakdown.Codeforces;
      verifiedPlatformCount++;
    }

    if (verifiedPlatformCount > 0) {
      student.totalSolved = verifiedSum;
      student.hasVerifiedData = true;
    } else {
      student.totalSolved = 0;
      student.hasVerifiedData = false;
    }

    const easy = student.difficultyDistribution?.easy || 0;
    const medium = student.difficultyDistribution?.medium || 0;
    const hard = student.difficultyDistribution?.hard || 0;
    const total = student.totalSolved || 0;
    const rating = student.contestRating || student.currentRating || 0;

    student.xp = (easy * 10) + (medium * 25) + (hard * 50) + (total * 5) + (rating > 0 ? Math.round(rating * 1.5) : 0);

    console.log(`[SYNC STAGE] Database updated... Student: ${student.studentName} (${regNo}), Total Solved: ${student.totalSolved}, Contest Rating: ${student.contestRating}, XP: ${student.xp}`);

    student.problemsSolvedToday = todaySolvedCount;
    student.lastSyncTime = new Date().toISOString();

    // Attach Gemini AI Analysis based strictly on real fetched numbers
    try {
      const aiAnalysis = await generateStudentAIAnalysis(student);
      if (aiAnalysis) {
        student.aiAnalysis = aiAnalysis;
      }
    } catch (err) {
      console.warn(`[GEMINI ANALYSIS] Error generating student analysis for ${regNo}:`, err);
    }

    if (platformErrors.length > 0) {
      student.syncStatus = "Unable to Fetch";
      student.syncError = "Unable to fetch latest coding activity. " + platformErrors.join(" | ");
    } else {
      student.syncStatus = "Active";
      student.syncError = "";
    }

    if (hasLiveUpdate) {
      syncedCount++;
    }
  }

  db.code_analytics_feed = (db.code_analytics_feed || []).slice(0, 100);
  db.code_analytics_notifications = (db.code_analytics_notifications || []).slice(0, 50);

  return { syncedCount, newSubmissions: newSubmissionsCount };
}

/**
 * 3. Synchronize Real Upcoming, Ongoing, and Historical Contests
 */
export async function syncLiveContests(db: any): Promise<number> {
  if (!Array.isArray(db.code_analytics_contests)) {
    db.code_analytics_contests = [];
  }

  const existingContestsMap = new Map<string, any>();
  db.code_analytics_contests.forEach((c: any) => {
    if (c && c.id) {
      existingContestsMap.set(c.id, c);
    }
  });

  const fetchedContests: any[] = [];

  // 1. Codeforces Contests API
  try {
    const res = await fetch("https://codeforces.com/api/contest.list?gym=false", { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (data.status === "OK" && Array.isArray(data.result)) {
        const cfContests = data.result.slice(0, 15);
        cfContests.forEach((c: any) => {
          const startTime = new Date(c.startTimeSeconds * 1000).toISOString();
          const endTime = new Date((c.startTimeSeconds + c.durationSeconds) * 1000).toISOString();
          const nowMs = Date.now();
          const startMs = c.startTimeSeconds * 1000;
          const endMs = startMs + (c.durationSeconds * 1000);

          let status: 'Live' | 'Upcoming' | 'Completed' = 'Upcoming';
          if (nowMs >= startMs && nowMs <= endMs) {
            status = 'Live';
          } else if (nowMs > endMs) {
            status = 'Completed';
          }

          fetchedContests.push({
            id: `cf-${c.id}`,
            title: c.name,
            platform: "Codeforces",
            contestDate: new Date(startMs).toLocaleDateString('en-CA'),
            startTime,
            endTime,
            status,
            url: `https://codeforces.com/contests/${c.id}`
          });
        });
      }
    }
  } catch (e) {
    console.error("[CONTEST SYNC] Codeforces contest API failed:", e);
  }

  // 2. LeetCode Contests GraphQL
  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
      body: JSON.stringify({
        query: `query topTwoContests {
          topTwoContests {
            title
            titleSlug
            startTime
            duration
          }
        }`
      }),
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      const top2 = data.data?.topTwoContests;
      if (Array.isArray(top2)) {
        top2.forEach((c: any) => {
          const startMs = c.startTime * 1000;
          const endMs = startMs + (c.duration * 1000);
          const start = new Date(startMs).toISOString();
          const end = new Date(endMs).toISOString();
          const nowMs = Date.now();

          let status: 'Live' | 'Upcoming' | 'Completed' = 'Upcoming';
          if (nowMs >= startMs && nowMs <= endMs) {
            status = 'Live';
          } else if (nowMs > endMs) {
            status = 'Completed';
          }

          fetchedContests.push({
            id: `lc-${c.titleSlug}`,
            title: c.title,
            platform: "LeetCode",
            contestDate: new Date(startMs).toLocaleDateString('en-CA'),
            startTime: start,
            endTime: end,
            status,
            url: `https://leetcode.com/contest/${c.titleSlug}`
          });
        });
      }
    }
  } catch (e) {
    console.error("[CONTEST SYNC] LeetCode contest API failed:", e);
  }

  // Collect verified students
  const registeredStudents = Object.values(db.code_analytics_students || {}) as any[];

  // Merge fetched contests into existing ones without destroying completed participant data
  fetchedContests.forEach(fc => {
    const existing = existingContestsMap.get(fc.id);
    if (!existing) {
      // Build participants from actual student.contestHistory or verified submissions
      const verifiedParticipants: any[] = [];
      registeredStudents.forEach(s => {
        const foundContest = (s.contestHistory || []).find((ch: any) => 
          ch.contestName?.toLowerCase().includes(fc.title.toLowerCase()) || 
          fc.title.toLowerCase().includes(ch.contestName?.toLowerCase())
        );

        if (foundContest) {
          verifiedParticipants.push({
            registerNumber: s.registerNumber,
            studentName: s.studentName,
            department: s.department || "AI&DS",
            year: s.year || "II",
            section: s.section || "A",
            mentorName: s.mentorName || "Mrs. V. Prema",
            contestRank: foundContest.rank || 1,
            currentRank: foundContest.rank || 1,
            problemsAttempted: foundContest.problemsSolved || 1,
            problemsSolved: foundContest.problemsSolved || 1,
            penalty: foundContest.penalty || "00:15",
            score: foundContest.newRating || (foundContest.problemsSolved ? foundContest.problemsSolved * 100 : 100),
            currentRating: foundContest.newRating || s.currentRating || 0,
            profileUrl: s.profileLinks?.[fc.platform.toLowerCase()] || fc.url,
            contestUrl: fc.url,
            submissions: foundContest.submissions || []
          });
        }
      });

      existingContestsMap.set(fc.id, {
        ...fc,
        registeredCount: verifiedParticipants.length,
        participants: verifiedParticipants
      });
    } else {
      // Update status (e.g. Live -> Completed)
      const nowMs = Date.now();
      const endMs = new Date(existing.endTime || fc.endTime).getTime();
      if (nowMs > endMs) {
        existing.status = 'Completed';
      } else if (nowMs >= new Date(existing.startTime || fc.startTime).getTime()) {
        existing.status = 'Live';
      }
    }
  });

  db.code_analytics_contests = Array.from(existingContestsMap.values());
  console.log(`[CONTEST SYNC] Synced ${db.code_analytics_contests.length} real coding contests.`);
  return db.code_analytics_contests.length;
}

/**
 * 4. Master Sync Function
 */
export async function runFullCodeAnalyticsSync(db: any): Promise<any> {
  console.log("[MASTER CODE ANALYTICS SYNC] Starting full synchronization...");
  const sheetResult = await syncFromGoogleSheet(db);
  const platformResult = await syncLivePlatformData(db);
  const contestsCount = await syncLiveContests(db);

  return {
    sheetResult,
    platformResult,
    contestsCount,
    syncedAt: new Date().toISOString()
  };
}

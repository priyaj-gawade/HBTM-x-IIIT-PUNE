export const MOCK_WORKSPACES: any[] = [];

export const MOCK_CHAT_MESSAGES = [
  {
    id: "msg-1",
    sender: "AI",
    text: "Welcome back! What do you want to learn today, or how do you want to improve your skills?",
    options: ["Master Python OOPs", "Build a React Dashboard", "Analyze a CSV dataset"],
  },
];

export const MOCK_FLASHCARDS = [
  { id: "fc-1", front: "What is Heap Memory?", back: "A region of memory used for dynamic allocation, where variables are allocated and freed manually or via garbage collection." },
  { id: "fc-2", front: "What is a Stack?", back: "A linear data structure that follows the Last In, First Out (LIFO) principle." },
  { id: "fc-3", front: "Garbage Collection", back: "An automatic memory management feature that reclaims memory occupied by objects that are no longer in use." },
];

export const MOCK_ROADMAP = [
  {
    id: "rm-1",
    title: "Memory Management",
    status: "Completed",
    children: [
      { id: "rm-1-1", title: "Stack vs Heap", status: "Completed", children: [] },
      { id: "rm-1-2", title: "Pointers & References", status: "Completed", children: [] },
    ]
  },
  {
    id: "rm-2",
    title: "Data Structures",
    status: "In Progress",
    children: [
      { id: "rm-2-1", title: "Arrays & Strings", status: "Completed", children: [] },
      { id: "rm-2-2", title: "Linked Lists", status: "In Progress", children: [] },
      { id: "rm-2-3", title: "Trees & Graphs", status: "Pending", children: [] },
    ]
  },
];

export interface RoadmapActivity {
  id: string;
  title: string;
  type: 'Watch Video' | 'Read Article' | 'Practice Lab' | 'Take Quiz' | 'Generate Flashcards';
  status: 'Completed' | 'In Progress' | 'Pending';
  estimatedTime?: string;
}

export interface RoadmapSection {
  id: string;
  title: string;
  estimatedTime?: string;
  activities: RoadmapActivity[];
}

export interface RoadmapModule {
  id: string;
  title: string;
  subtitle?: string;
  progressPercent: number;
  sections: RoadmapSection[];
}

export const MOCK_PYTHON_ROADMAP: RoadmapModule[] = [
  {
    id: 'mod-1',
    title: 'Python Basics & Fundamentals',
    subtitle: 'Module 1',
    progressPercent: 0.6,
    sections: [
      {
        id: 'sec-1-1',
        title: 'Introduction to Python',
        estimatedTime: '45m',
        activities: [
          { id: 'act-1-1-1', title: 'What is Python?', type: 'Watch Video', status: 'Completed', estimatedTime: '10m' },
          { id: 'act-1-1-2', title: 'Setting up the environment', type: 'Practice Lab', status: 'Completed', estimatedTime: '25m' },
          { id: 'act-1-1-3', title: 'Intro Quiz', type: 'Take Quiz', status: 'Completed', estimatedTime: '10m' },
        ]
      },
      {
        id: 'sec-1-2',
        title: 'Variables & Data Types',
        estimatedTime: '1h 15m',
        activities: [
          { id: 'act-1-2-1', title: 'Understanding Variables', type: 'Watch Video', status: 'Completed', estimatedTime: '15m' },
          { id: 'act-1-2-2', title: 'Primitive Data Types (int, float, str, bool)', type: 'Read Article', status: 'Completed', estimatedTime: '20m' },
          { id: 'act-1-2-3', title: 'Type casting and conversion', type: 'Practice Lab', status: 'In Progress', estimatedTime: '30m' },
          { id: 'act-1-2-4', title: 'Variables Quiz', type: 'Take Quiz', status: 'Pending', estimatedTime: '10m' },
        ]
      },
      {
        id: 'sec-1-3',
        title: 'Basic Operators',
        estimatedTime: '45m',
        activities: [
          { id: 'act-1-3-1', title: 'Arithmetic & Assignment Operators', type: 'Watch Video', status: 'Pending', estimatedTime: '12m' },
          { id: 'act-1-3-2', title: 'Comparison & Logical Operators', type: 'Read Article', status: 'Pending', estimatedTime: '15m' },
          { id: 'act-1-3-3', title: 'Operator Precedence Lab', type: 'Practice Lab', status: 'Pending', estimatedTime: '18m' },
        ]
      }
    ]
  },
  {
    id: 'mod-2',
    title: 'Control Flow & Loops',
    subtitle: 'Module 2',
    progressPercent: 0.0,
    sections: [
      {
        id: 'sec-2-1',
        title: 'Conditional Statements (if, elif, else)',
        estimatedTime: '1h',
        activities: [
          { id: 'act-2-1-1', title: 'If/Else Logic', type: 'Watch Video', status: 'Pending', estimatedTime: '15m' },
          { id: 'act-2-1-2', title: 'Nested Conditionals', type: 'Practice Lab', status: 'Pending', estimatedTime: '30m' },
          { id: 'act-2-1-3', title: 'Conditionals Quiz', type: 'Take Quiz', status: 'Pending', estimatedTime: '15m' },
        ]
      },
      {
        id: 'sec-2-2',
        title: 'Loops (for & while)',
        estimatedTime: '1h 30m',
        activities: [
          { id: 'act-2-2-1', title: 'The For Loop & Range', type: 'Watch Video', status: 'Pending', estimatedTime: '20m' },
          { id: 'act-2-2-2', title: 'While Loops & Break/Continue', type: 'Read Article', status: 'Pending', estimatedTime: '15m' },
          { id: 'act-2-2-3', title: 'Pattern Printing Lab', type: 'Practice Lab', status: 'Pending', estimatedTime: '40m' },
          { id: 'act-2-2-4', title: 'Loops Mastery Quiz', type: 'Take Quiz', status: 'Pending', estimatedTime: '15m' },
        ]
      }
    ]
  }
];

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionItem {
  id: string;
  topicTag: string;
  questionText: string;
  type: 'mcq' | 'subjective' | 'code';
  options: QuizOption[];
  
  // For subjective/code
  codeInitialTemplate?: string;
  codeSolution?: string;
  expectedOutput?: string;
  testCases?: { description: string }[];
}

export const MOCK_MICRO_QUIZ: QuestionItem[] = [
  {
    id: 'q1',
    topicTag: 'Python Basics',
    questionText: 'What is the correct syntax to output "Hello World" in Python?',
    type: 'mcq',
    options: [
      { id: 'opt1', text: 'echo "Hello World"', isCorrect: false },
      { id: 'opt2', text: 'print("Hello World")', isCorrect: true },
      { id: 'opt3', text: 'console.log("Hello World")', isCorrect: false },
      { id: 'opt4', text: 'printf("Hello World")', isCorrect: false },
    ]
  }
];

export const MOCK_LONG_QUIZ: QuestionItem[] = [
  {
    id: 'q1',
    topicTag: 'Data Structures',
    questionText: 'Which of the following data structures operates on a Last-In-First-Out (LIFO) principle?',
    type: 'mcq',
    options: [
      { id: 'opt1', text: 'Queue', isCorrect: false },
      { id: 'opt2', text: 'Linked List', isCorrect: false },
      { id: 'opt3', text: 'Stack', isCorrect: true },
      { id: 'opt4', text: 'Tree', isCorrect: false },
    ]
  },
  {
    id: 'q2',
    topicTag: 'Algorithms',
    questionText: 'Explain the difference between QuickSort and MergeSort in terms of time complexity and space complexity.',
    type: 'subjective',
    options: []
  }
];

export const MOCK_CODE_CHALLENGE: QuestionItem = {
  id: 'q-code',
  topicTag: 'Algorithms',
  questionText: 'Write a Python function `two_sum(nums, target)` that returns the indices of the two numbers such that they add up to `target`. You may assume each input has exactly one solution.',
  type: 'code',
  options: [],
  codeInitialTemplate: 'def two_sum(nums, target):\n    # Write your code here\n    pass\n',
  codeSolution: 'def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        if target - num in seen:\n            return [seen[target - num], i]\n        seen[num] = i\n    return []',
  expectedOutput: 'Test Case 1 passed: [0, 1]\nTest Case 2 passed: [1, 2]\nAll tests passed successfully!',
  testCases: [
    { description: 'Input: nums = [2, 7, 11, 15], target = 9 | Output: [0, 1]' },
    { description: 'Input: nums = [3, 2, 4], target = 6 | Output: [1, 2]' }
  ]
};

export interface CourseCatalogEntry {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Expert' | 'Hard';
  tags: string[];
  estimatedHours: number;
  thumbnailUrl: string;
}

export const MOCK_HUB_COURSES: CourseCatalogEntry[] = [
  {
    id: "course-1",
    title: "Advanced Data Structures",
    category: "Computer Science",
    difficulty: "Hard",
    tags: ["Trees", "Graphs", "Algorithms"],
    estimatedHours: 12,
    thumbnailUrl: "/placeholder-1.jpg"
  },
  {
    id: "course-2",
    title: "Neural Networks from Scratch",
    category: "Machine Learning",
    difficulty: "Expert",
    tags: ["Deep Learning", "Math", "Python"],
    estimatedHours: 24,
    thumbnailUrl: "/placeholder-2.jpg"
  },
  {
    id: "course-3",
    title: "Web Dev 101: HTML & CSS",
    category: "Web Development",
    difficulty: "Beginner",
    tags: ["HTML", "CSS", "Frontend"],
    estimatedHours: 8,
    thumbnailUrl: "/placeholder-3.jpg"
  },
  {
    id: "course-4",
    title: "React Performance Tuning",
    category: "Web Development",
    difficulty: "Expert",
    tags: ["React", "Optimization", "JavaScript"],
    estimatedHours: 5,
    thumbnailUrl: "/placeholder-4.jpg"
  },
  {
    id: "course-5",
    title: "System Design Interview Prep",
    category: "Software Engineering",
    difficulty: "Hard",
    tags: ["Architecture", "Scalability", "Databases"],
    estimatedHours: 16,
    thumbnailUrl: "/placeholder-5.jpg"
  }
];

/**
 * Renaissance Course Data
 * Source: YouTube Playlist "How to draw a face using loomis method"
 */

const courseData = [
    {
        id: 1,
        title: "Introduction & Setup",
        description: "Full voice-over tutorial covering the foundational sphere and cross construction.",
        videoId: "R5FIMxZIsAQ",
        duration: "10:42",
        category: "Basics"
    },
    {
        id: 2,
        title: "Facial Features Placement",
        description: "Mastering the layout of eyes, nose, and mouth in just 8 minutes.",
        videoId: "lF1x09Yp0UY",
        duration: "08:15",
        category: "Anatomy"
    },
    {
        id: 3,
        title: "Side Profile Construction",
        description: "Adapting the Loomis method for side view portraits.",
        videoId: "wXXu5nKUWRc",
        duration: "06:30",
        category: "Perspective"
    },
    {
        id: 4,
        title: "Rapid Sketching Techniques",
        description: "How to draw a face quickly and efficiently in 6 minutes.",
        videoId: "7J1RJDuvFRk",
        duration: "06:05",
        category: "Sketching"
    },
    {
        id: 5,
        title: "Refining the Jawline",
        description: "Detailed focus on the jaw and chin structure.",
        videoId: "neQUCD3_JLg",
        duration: "07:20",
        category: "Anatomy"
    },
    {
        id: 6,
        title: "Final Polish & Shading",
        description: "Bringing the portrait together with final details.",
        videoId: "FjYCYB1uO6g",
        duration: "08:45",
        category: "Rendering"
    }
];

// Attach to window for global access
window.renaissanceCourses = courseData;

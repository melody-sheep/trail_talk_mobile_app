// src/constants/impactStories.js
// Emotional impact stories for each donation type

export const IMPACT_STORIES = {
  meal: [
    "Your ₱49 provided 3 meals for a Nursing student who was skipping lunch to save money.",
    "A Computer Science major had dinner tonight because of your donation.",
    "Your donation fed a future engineer studying for their finals.",
    "Three warm meals for a student who chose textbooks over food this week."
  ],
  transport: [
    "Your ₱30 gave a 4th-year student a jeepney ride to their final exam.",
    "Because of you, a working student made it to their night class.",
    "Your fare donation turned 'I can\'t afford to go' into 'I made it to class.'",
    "A student from a remote barangay reached campus today because of your donation."
  ],
  print: [
    "Your ₱99 printed 100 pages of a thesis that was due tomorrow.",
    "A group project got submitted on time thanks to your printing donation.",
    "Your donation printed a struggling student's research paper.",
    "100 pages of dreams, now tangible because of your support."
  ],
  internet: [
    "Your ₱50 gave a student 7 days of connectivity for online research.",
    "Because of you, a student could attend their virtual classes this week.",
    "Your internet load turned 'I can\'t research' into 'I discovered.'",
    "Seven days of online learning made possible by your donation."
  ],
  necessities: [
    "Your ₱75 provided basic necessities for a student in need.",
    "Toothpaste, soap, medicine—dignity restored because of you.",
    "Your donation covered the invisible costs of being a student.",
    "Basic necessities that make focusing on studies possible."
  ],
  capstone: [
    "Your ₱199 bought the Arduino sensor that completes a capstone project.",
    "A graduation dream became reality because of your support.",
    "Your donation powered a student's final year project.",
    "The missing component that turns 'impossible project' into 'graduation.'"
  ],
  platformStudent: [
    "Your ₱149: 50% builds better app features, 50% helps students in need.",
    "You're building both technology and tomorrow's leaders.",
    "Half builds digital bridges, half catches falling dreams.",
    "30 days of premium features + helping students = dual impact."
  ],
  studentSustainer: [
    "Your ₱29/month says 'I believe in you' to a struggling student.",
    "Less than one café drink, more hope than words can measure.",
    "Monthly support that says 'We don\'t forget, we don\'t abandon.'",
    "A sustaining promise that changes lives every month."
  ],
  facultySustainer: [
    "Your ₱79/month makes you a professor of both equations and empathy.",
    "Faculty support that reaches beyond the classroom.",
    "Teaching compassion alongside curriculum.",
    "Monthly commitment to student welfare."
  ],
  alumniSustainer: [
    "Your ₱149/month is the hand reaching back to pull others forward.",
    "Alumni giving back to create new success stories.",
    "The sustaining legacy of those who made it reaching back.",
    "Monthly sponsorship that changes futures."
  ]
};

// Get a random impact story for a donation type
export const getRandomImpactStory = (donationType) => {
  const stories = IMPACT_STORIES[donationType];
  if (!stories || stories.length === 0) {
    return `Your donation made a difference in a student's life.`;
  }
  return stories[Math.floor(Math.random() * stories.length)];
};
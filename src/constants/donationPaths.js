// src/constants/donationPaths.js
// 3-Path Emotional Donation System Configuration

export const DONATION_PATHS = [
  {
    id: 'immediateRescue',
    title: 'PATH 1: IMMEDIATE RESCUE',
    description: 'When hunger knocks, when buses pass by, when printers remain silent.',
    color: '#FF6B6B', // Red for urgency
    icon: 'flash-outline',
    expanded: false, // Start collapsed
    showDetails: false, // New: control detail view
    items: [
      {
        id: 'meal',
        name: 'Meal Allowance',
        amount: 49,
        icon: 'fast-food-outline',
        description: 'Three warm meals for a student who would otherwise study hungry.',
        color: '#FF6B6B',
        quickDescription: '₱49 - 3 warm meals'
      },
      {
        id: 'transport',
        name: 'Transportation Fare',
        amount: 30,
        icon: 'bus-outline',
        description: 'A short transport fare to help a student reach class or an essential appointment.',
        color: '#FF9E6B',
        quickDescription: '₱30 - Transport support'
      },
      {
        id: 'print',
        name: 'Printing & Photocopy',
        amount: 99,
        icon: 'print-outline',
        description: '100+ pages of requirements, research, and dreams made tangible.',
        color: '#FFD166',
        quickDescription: '₱99 - 100+ pages'
      },
      {
        id: 'internet',
        name: 'Internet Load',
        amount: 50,
        icon: 'wifi-outline',
        description: 'Seven days of connectivity that transforms "I can\'t research" into "I discovered."',
        color: '#06D6A0',
        quickDescription: '₱50 - 7 days internet'
      },
      {
        id: 'necessities',
        name: 'Basic Necessities',
        amount: 75,
        icon: 'cart-outline',
        description: 'Toothpaste, soap, medicine—the invisible costs of dignity.',
        color: '#118AB2',
        quickDescription: '₱75 - Basic needs'
      },
      {
        id: 'capstone',
        name: 'Capstone Support',
        amount: 199,
        icon: 'hardware-chip-outline',
        description: 'The sensor, the component, the cloud credit that turns "impossible project" into "graduation reality."',
        color: '#073B4C',
        quickDescription: '₱199 - Project support'
      },
      {
        id: 'customRescue',
        name: 'Custom Immediate Rescue',
        amount: 0,
        icon: 'create-outline',
        description: 'Choose your own amount for immediate rescue support.',
        color: '#FF6B6B',
        quickDescription: 'Custom - Your choice'
      }
    ]
  },
  {
    id: 'dualImpact',
    title: 'PATH 2: DUAL IMPACT',
    description: 'Building both technology and tomorrow\'s leaders.',
    color: '#1DD1A1', // Green for growth
    icon: 'git-compare-outline',
    expanded: false,
    showDetails: false,
    items: [
      {
        id: 'platformStudent',
        name: 'Platform & Student Fund',
        amount: 149,
        icon: 'git-compare-outline',
        description: 'Half builds better digital bridges, half catches falling dreams.',
        subDescription: 'Half supports the platform, half helps a student in need — thank you for giving.',
        color: '#1DD1A1',
        quickDescription: '₱149 - 50% app, 50% students'
      },
      {
        id: 'smallPlatform',
        name: 'Small Platform Support',
        amount: 50,
        icon: 'code-outline',
        description: 'Basic platform maintenance and small feature updates.',
        color: '#1DD1A1',
        quickDescription: '₱50 - Platform basics'
      },
      {
        id: 'mediumPlatform',
        name: 'Medium Platform Support',
        amount: 100,
        icon: 'hardware-chip-outline',
        description: 'Enhanced platform features and moderate improvements.',
        color: '#4ECDC4',
        quickDescription: '₱100 - Platform growth'
      },
      {
        id: 'largePlatform',
        name: 'Large Platform Support',
        amount: 200,
        icon: 'server-outline',
        description: 'Major platform upgrades and scalability improvements.',
        color: '#26A69A',
        quickDescription: '₱200 - Platform scale'
      },
      {
        id: 'studentEmergency',
        name: 'Student Emergency Fund',
        amount: 75,
        icon: 'medical-outline',
        description: 'Immediate support for urgent student needs.',
        color: '#FF7043',
        quickDescription: '₱75 - Emergency aid'
      },
      {
        id: 'studentAcademic',
        name: 'Student Academic Fund',
        amount: 150,
        icon: 'school-outline',
        description: 'Academic materials and educational resources.',
        color: '#42A5F5',
        quickDescription: '₱150 - Academic support'
      },
      {
        id: 'customDual',
        name: 'Custom Dual Impact',
        amount: 0,
        icon: 'create-outline',
        description: 'Choose your own amount for dual impact support.',
        color: '#1DD1A1',
        quickDescription: 'Custom - Your choice'
      }
    ]
  },
  {
    id: 'sustainingLegacy',
    title: 'PATH 3: SUSTAINING LEGACY',
    description: 'The monthly promise that says "We don\'t forget, we don\'t abandon."',
    color: '#9B5DE5', // Purple for legacy
    icon: 'infinite-outline',
    expanded: false,
    showDetails: false,
    items: [
      {
        id: 'studentSustainer',
        name: 'Student Sustainer',
        amount: 29,
        icon: 'heart-circle-outline',
        description: 'Less than one café drink. More hope than words can measure.',
        isMonthly: true,
        color: '#9B5DE5',
        quickDescription: '₱29/month - Student support'
      },
      {
        id: 'facultySustainer',
        name: 'Faculty Sustainer',
        amount: 79,
        icon: 'school-outline',
        description: 'The professor who teaches both equations and empathy.',
        isMonthly: true,
        color: '#B38CFF',
        quickDescription: '₱79/month - Faculty support'
      },
      {
        id: 'alumniSustainer',
        name: 'Alumni/Sponsor Sustainer',
        amount: 149,
        icon: 'business-outline',
        description: 'The hand reaching back to pull others forward.',
        isMonthly: true,
        color: '#7B4DD9',
        quickDescription: '₱149/month - Alumni support'
      }
    ]
  }
];

// Initial community impact counters
export const INITIAL_IMPACT_COUNTERS = {
  mealsProvided: 127,
  journeysFunded: 58,
  pagesPrinted: 2300,
  capstonesPowered: 7,
  studentsHelped: 42,
  totalHopeGenerated: 8450 // in pesos
};

// Mock donation ledger data (like blockchain transactions)
export const DONATION_LEDGER = [
  {
    id: '1',
    type: 'meal',
    amount: 49,
    donor: 'Anonymous Student',
    date: '2024-12-17 14:30',
    impact: 'Provided 3 meals for Nursing student'
  },
  {
    id: '2',
    type: 'transport',
    amount: 30,
    donor: 'Faculty Member',
    date: '2024-12-17 10:15',
    impact: 'Transport support for reaching an exam'
  },
  {
    id: '3',
    type: 'print',
    amount: 99,
    donor: 'Alumni Sponsor',
    date: '2024-12-16 16:45',
    impact: 'Printed 100-page thesis'
  },
  {
    id: '4',
    type: 'platformStudent',
    amount: 149,
    donor: 'USTP Department',
    date: '2024-12-16 09:20',
    impact: '50% app development, 50% student aid'
  },
  {
    id: '5',
    type: 'studentSustainer',
    amount: 29,
    donor: 'Monthly Supporter',
    date: '2024-12-15',
    impact: 'Monthly student support'
  }
];
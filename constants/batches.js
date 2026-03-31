export const BATCHES = {
  B1: { id: 'B1', name: 'Batch B1', startRoll: 1, endRoll: 21 },
  B2: { id: 'B2', name: 'Batch B2', startRoll: 22, endRoll: 42 },
  B3: { id: 'B3', name: 'Batch B3', startRoll: 43, endRoll: 999 }, // 43 onwards
};

export const BRANCH_BATCHES = {
  'AI / ML': ['B1', 'B2', 'B3'],
  'Computer Engineering': ['B1', 'B2', 'B3'],
  'Electronics and Telecommunication Engineering': ['B1', 'B2', 'B3'],
  'Information Technology': ['B1', 'B2', 'B3'],
};

// Helper function to determine batch based on roll number
export const getStudentBatch = (rollNo) => {
  const roll = parseInt(rollNo, 10);
  if (isNaN(roll)) return null;
  
  if (roll >= 1 && roll <= 21) return 'B1';
  if (roll >= 22 && roll <= 42) return 'B2';
  if (roll >= 43) return 'B3';
  return null;
};

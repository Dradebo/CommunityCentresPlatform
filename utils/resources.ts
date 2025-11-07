// Resources Available for Community Centers
// Organized into 4 main categories with subcategories

export const availableResources = {
  physicalInfrastructure: [
    'Library (Physical Collection)',
    'Meeting/Training Room(s)',
    'Co-working Space / Meeting Cafe',
    'Dedicated Office Space',
    'Outdoor Green Space',
    'Specialized Vocational Workshop',
    'Artist Studio Space(s)',
    'Open-air/Indoor Performance Stage',
    'Basic Clinic/Health Facility',
    'Specialized Hospital Facility (24/7)',
    'Laboratory (General or Medical)',
    'Safe House/Shelter',
    'Sports Field / Playground',
    'Kitchen Facility',
    'Vocational Tools (Sewing Machines, Garment Tools)',
    'Carpentry and Joinery Tools',
    'Bricklaying Equipment',
    'Specialized Hairdressing Supplies',
    'Medical Supplies and Medicines',
    'Laboratory and Chemistry Equipment',
    'Humanitarian Goods (Blankets, Mats, Jerrycans, Soap)',
    'Solar Lanterns / Energy-saving Stoves',
    'Emergency Shelter Kits'
  ],

  digitalResources: [
    'Dedicated Computer Lab/CTA Centre',
    'Public-Use Computers (Desktop/Laptop)',
    'Hub-Provided Wi-Fi / Internet Access',
    'Access to Government Public Wi-Fi Hotspots',
    'General Physical Book Collection',
    'Specialized Library (Art, Technical)',
    'Curriculum-Aligned Textbooks and Study Guides',
    'Library Catalogue System'
  ],

  humanResources: [
    'Professional Counselor (Individual, Family, Marital)',
    'Clinical Psychologist',
    'Psychiatric Clinical Officer',
    'Refugee Peer Counsellors',
    'HIV/AIDS Counselor',
    'General Staff Trained in Counseling/Mentoring',
    'Surgeons',
    'Physiotherapists',
    'Skilled Midwives / Clinical Staff',
    'Village Health Teams (VHTs) / Community Health Workers',
    'Staff Lawyers (Pro-bono Legal Advice/Representation)',
    'Community Paralegals (Trained Community Members)',
    'Qualified Vocational Tutors',
    'Digital/ICT Trainers',
    'Agricultural Extension Workers',
    'Parish Chiefs / Government Extension Officers'
  ],

  financialResources: [
    'Access to Parish Revolving Fund (PRF)',
    'Affiliation with a SACCO',
    'Ability to Distribute Direct Cash Grants',
    'Established Operational Funding (Donations, Grants)',
    'Participation in a Pooled Resource Model (Shared Resource Center)'
  ]
} as const;

// Flattened array for checkboxes and filtering
export const allResources = [
  ...availableResources.physicalInfrastructure,
  ...availableResources.digitalResources,
  ...availableResources.humanResources,
  ...availableResources.financialResources
] as const;

// Category labels for UI grouping
export const resourceCategories = {
  physicalInfrastructure: 'Physical Infrastructure & Tangible Assets',
  digitalResources: 'Digital & Information Resources',
  humanResources: 'Human Resources & Specialized Personnel',
  financialResources: 'Financial Resources'
} as const;

// Type exports for TypeScript
export type ResourceCategory = keyof typeof availableResources;
export type ResourceType = typeof allResources[number];

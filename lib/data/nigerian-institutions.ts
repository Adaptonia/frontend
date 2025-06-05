import { SchoolSelectionData } from '../types';

export const NIGERIAN_INSTITUTIONS: SchoolSelectionData[] = [
  // Federal Universities
  { name: 'University of Lagos (UNILAG)', location: 'Lagos', type: 'university' },
  { name: 'University of Ibadan (UI)', location: 'Oyo', type: 'university' },
  { name: 'Ahmadu Bello University (ABU)', location: 'Kaduna', type: 'university' },
  { name: 'Obafemi Awolowo University (OAU)', location: 'Osun', type: 'university' },
  { name: 'University of Nigeria, Nsukka (UNN)', location: 'Enugu', type: 'university' },
  { name: 'Federal University of Technology, Akure (FUTA)', location: 'Ondo', type: 'university' },
  { name: 'University of Benin (UNIBEN)', location: 'Edo', type: 'university' },
  { name: 'Bayero University Kano (BUK)', location: 'Kano', type: 'university' },
  { name: 'University of Calabar (UNICAL)', location: 'Cross River', type: 'university' },
  { name: 'University of Port Harcourt (UNIPORT)', location: 'Rivers', type: 'university' },
  { name: 'Federal University of Technology, Minna (FUTMINNA)', location: 'Niger', type: 'university' },
  { name: 'Nnamdi Azikiwe University (UNIZIK)', location: 'Anambra', type: 'university' },
  { name: 'University of Jos (UNIJOS)', location: 'Plateau', type: 'university' },
  { name: 'Federal University of Technology, Owerri (FUTO)', location: 'Imo', type: 'university' },
  { name: 'University of Ilorin (UNILORIN)', location: 'Kwara', type: 'university' },
  { name: 'University of Abuja (UNIABUJA)', location: 'FCT', type: 'university' },
  { name: 'Federal University, Oye-Ekiti (FUOYE)', location: 'Ekiti', type: 'university' },
  { name: 'Federal University, Dutse (FUD)', location: 'Jigawa', type: 'university' },
  { name: 'Federal University, Kashere', location: 'Gombe', type: 'university' },
  { name: 'Federal University, Lafia', location: 'Nasarawa', type: 'university' },

  // State Universities
  { name: 'Lagos State University (LASU)', location: 'Lagos', type: 'university' },
  { name: 'Olabisi Onabanjo University (OOU)', location: 'Ogun', type: 'university' },
  { name: 'Adekunle Ajasin University', location: 'Ondo', type: 'university' },
  { name: 'Ekiti State University (EKSU)', location: 'Ekiti', type: 'university' },
  { name: 'Osun State University (UNIOSUN)', location: 'Osun', type: 'university' },
  { name: 'Oyo State Technical University', location: 'Oyo', type: 'university' },
  { name: 'Delta State University (DELSU)', location: 'Delta', type: 'university' },
  { name: 'River State University (RSU)', location: 'Rivers', type: 'university' },
  { name: 'Imo State University (IMSU)', location: 'Imo', type: 'university' },
  { name: 'Enugu State University of Science & Technology (ESUT)', location: 'Enugu', type: 'university' },
  { name: 'Ebonyi State University', location: 'Ebonyi', type: 'university' },
  { name: 'Abia State University (ABSU)', location: 'Abia', type: 'university' },
  { name: 'Akwa Ibom State University', location: 'Akwa Ibom', type: 'university' },
  { name: 'Cross River State University of Technology', location: 'Cross River', type: 'university' },
  { name: 'Kano State University of Science & Technology', location: 'Kano', type: 'university' },
  { name: 'Kaduna State University (KASU)', location: 'Kaduna', type: 'university' },
  { name: 'Kebbi State University of Science & Technology', location: 'Kebbi', type: 'university' },
  { name: 'Kwara State University (KWASU)', location: 'Kwara', type: 'university' },

  // Private Universities
  { name: 'Covenant University', location: 'Ogun', type: 'university' },
  { name: 'Babcock University', location: 'Ogun', type: 'university' },
  { name: 'Landmark University', location: 'Omu-Aran', type: 'university' },
  { name: 'Pan-Atlantic University', location: 'Lagos', type: 'university' },
  { name: 'Redeemer\'s University', location: 'Osun', type: 'university' },
  { name: 'Lead City University', location: 'Oyo', type: 'university' },
  { name: 'Bells University of Technology', location: 'Ogun', type: 'university' },
  { name: 'Igbinedion University', location: 'Edo', type: 'university' },
  { name: 'Madonna University', location: 'Enugu', type: 'university' },
  { name: 'Nile University of Nigeria', location: 'FCT', type: 'university' },
  { name: 'American University of Nigeria (AUN)', location: 'Adamawa', type: 'university' },
  { name: 'Bowen University', location: 'Osun', type: 'university' },
  { name: 'Caleb University', location: 'Lagos', type: 'university' },
  { name: 'Crawford University', location: 'Ogun', type: 'university' },
  { name: 'Adeleke University', location: 'Osun', type: 'university' },

  // Federal Polytechnics
  { name: 'Yaba College of Technology (YABATECH)', location: 'Lagos', type: 'polytechnic' },
  { name: 'Federal Polytechnic, Ilaro', location: 'Ogun', type: 'polytechnic' },
  { name: 'Federal Polytechnic, Auchi', location: 'Edo', type: 'polytechnic' },
  { name: 'Federal Polytechnic, Oko', location: 'Anambra', type: 'polytechnic' },
  { name: 'Federal Polytechnic, Nekede', location: 'Imo', type: 'polytechnic' },
  { name: 'Federal Polytechnic, Bida', location: 'Niger', type: 'polytechnic' },
  { name: 'Federal Polytechnic, Kaduna', location: 'Kaduna', type: 'polytechnic' },
  { name: 'Federal Polytechnic, Bauchi', location: 'Bauchi', type: 'polytechnic' },
  { name: 'Federal Polytechnic, Mubi', location: 'Adamawa', type: 'polytechnic' },
  { name: 'Federal Polytechnic, Offa', location: 'Kwara', type: 'polytechnic' },

  // State Polytechnics
  { name: 'Lagos State Polytechnic (LASPOTECH)', location: 'Lagos', type: 'polytechnic' },
  { name: 'Moshood Abiola Polytechnic', location: 'Ogun', type: 'polytechnic' },
  { name: 'The Polytechnic, Ibadan', location: 'Oyo', type: 'polytechnic' },
  { name: 'Osun State Polytechnic', location: 'Osun', type: 'polytechnic' },
  { name: 'Delta State Polytechnic, Ogwashi-Uku', location: 'Delta', type: 'polytechnic' },
  { name: 'Rivers State Polytechnic', location: 'Rivers', type: 'polytechnic' },
  { name: 'Imo State Polytechnic', location: 'Imo', type: 'polytechnic' },
  { name: 'Institute of Management & Technology (IMT)', location: 'Enugu', type: 'polytechnic' },
  { name: 'Akwa Ibom State Polytechnic', location: 'Akwa Ibom', type: 'polytechnic' },
  { name: 'Abia State Polytechnic', location: 'Abia', type: 'polytechnic' },
  { name: 'Kano State Polytechnic', location: 'Kano', type: 'polytechnic' },
  { name: 'Kaduna Polytechnic', location: 'Kaduna', type: 'polytechnic' },

  // Colleges of Education
  { name: 'Federal College of Education, Lagos', location: 'Lagos', type: 'college' },
  { name: 'Federal College of Education, Abeokuta', location: 'Ogun', type: 'college' },
  { name: 'Federal College of Education (Technical), Akoka', location: 'Lagos', type: 'college' },
  { name: 'Adeyemi College of Education', location: 'Ondo', type: 'college' },
  { name: 'Emmanuel Alayande College of Education', location: 'Oyo', type: 'college' },
  { name: 'Federal College of Education, Okene', location: 'Kogi', type: 'college' },
  { name: 'Federal College of Education, Zaria', location: 'Kaduna', type: 'college' },
  { name: 'Federal College of Education, Kano', location: 'Kano', type: 'college' },
  { name: 'Shehu Shagari College of Education', location: 'Sokoto', type: 'college' },
  { name: 'Federal College of Education (Technical), Gombe', location: 'Gombe', type: 'college' },
];

// Helper function to search institutions
export const searchInstitutions = (query: string): SchoolSelectionData[] => {
  if (!query.trim()) return NIGERIAN_INSTITUTIONS;
  
  const searchTerm = query.toLowerCase();
  return NIGERIAN_INSTITUTIONS.filter(institution => 
    institution.name.toLowerCase().includes(searchTerm) ||
    institution.location.toLowerCase().includes(searchTerm)
  );
};

// Helper function to get institutions by type
export const getInstitutionsByType = (type: 'university' | 'polytechnic' | 'college'): SchoolSelectionData[] => {
  return NIGERIAN_INSTITUTIONS.filter(institution => institution.type === type);
}; 
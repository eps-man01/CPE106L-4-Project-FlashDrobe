import { ClothingItem, OutfitCategory, UserProfile } from '../types';
import { MALE_BODY_TYPES } from './bodyTypes';

export const INITIAL_CATEGORIES: OutfitCategory[] = [
  {
    id: 'cat_school',
    name: 'School Wear',
    icon: 'GraduationCap',
    description: 'Comfortable, campus-appropriate fits for lectures and study sessions',
    colorAccent: 'from-[#7c5e46] to-[#5e4432]',
    defaultOccasion: 'Classes, Laboratory & Campus',
  },
  {
    id: 'cat_casual',
    name: 'Casual Wear',
    icon: 'Coffee',
    description: 'Relaxed, versatile everyday outfits for coffee runs and hanging out',
    colorAccent: 'from-[#b47043] to-[#8f4f24]',
    defaultOccasion: 'Daily Errands, Weekend Lounge',
  },
  {
    id: 'cat_formal',
    name: 'Formal Wear',
    icon: 'Briefcase',
    description: 'Sharp, elegant attire for defenses, presentations, and banquets',
    colorAccent: 'from-[#4a4740] to-[#2c2a26]',
    defaultOccasion: 'Presentations, Banquets & Galas',
  },
  {
    id: 'cat_athletic',
    name: 'Athletic Wear',
    icon: 'Dumbbell',
    description: 'Breathable, moisture-wicking gear for gym sessions and outdoor sports',
    colorAccent: 'from-[#6b7c59] to-[#4d5e3c]',
    defaultOccasion: 'Workout, Running & Training',
  },
  {
    id: 'cat_work',
    name: 'Work Wear',
    icon: 'Building2',
    description: 'Smart casual and professional business attire for office and internships',
    colorAccent: 'from-[#8a6850] to-[#6d4e39]',
    defaultOccasion: 'Office, Meetings & Internship',
  },
  {
    id: 'cat_travel',
    name: 'Travel Wear',
    icon: 'Plane',
    description: 'Layered, crease-resistant, practical combinations for transit and exploring',
    colorAccent: 'from-[#a67c52] to-[#7d5630]',
    defaultOccasion: 'Flights, Roadtrips & Sightseeing',
  },
  {
    id: 'cat_beach',
    name: 'Beach Wear',
    icon: 'Palmtree',
    description: 'Breezy linen shirts, swim shorts, sunglasses, and airy sandals',
    colorAccent: 'from-[#c49a6c] to-[#9b7245]',
    defaultOccasion: 'Resort, Coastal Trips & Swimming',
  },
  {
    id: 'cat_night',
    name: 'Party / Night Out',
    icon: 'Sparkles',
    description: 'Chic, statement-making ensembles for dinner dates and nightlife',
    colorAccent: 'from-[#9c515a] to-[#73353e]',
    defaultOccasion: 'Social Dinners & Celebrations',
  },
];

// Empty initial wardrobe - users input and upload their own clothes
export const INITIAL_WARDROBE: ClothingItem[] = [];

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'user_001',
  name: 'Josh Sunga',
  email: 'sungajosh777@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  sex: 'male',
  bodyType: MALE_BODY_TYPES[3],
  customNotes: '',
};

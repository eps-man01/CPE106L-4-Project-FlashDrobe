import { BodyTypeInfo, BiologicalSex } from '../types';

export const MALE_BODY_TYPES: BodyTypeInfo[] = [
  {
    code: '01',
    label: 'Slender / Lean',
    category: 'Underweight / Lean',
    description: 'Narrow shoulder line, slender arms, and a light, narrow torso frame.',
    stylingTip: 'Horizontal stripes, layered jackets, and structured shoulders add balanced volume.',
  },
  {
    code: '02',
    label: 'Slim / Athletic-Lean',
    category: 'Lean / Trim',
    description: 'Slender silhouette with slightly broader chest and toned, straight lines.',
    stylingTip: 'Fitted shirts, slim-taper trousers, and light knitwear create sharp definition.',
  },
  {
    code: '03',
    label: 'Athletic / V-Taper',
    category: 'Fit / Athletic',
    description: 'Balanced athletic proportion with defined chest, broad shoulders, and trim waist.',
    stylingTip: 'Tailored fit tops, open-collar shirts, and tapered bottoms accentuate natural lines.',
  },
  {
    code: '04',
    label: 'Standard / Average',
    category: 'Moderate / Normal',
    description: 'Everyday balanced build with even proportions across chest, waist, and hips.',
    stylingTip: 'Versatile silhouette suitable for classic straight cuts, button-ups, and relaxed outerwear.',
  },
  {
    code: '05',
    label: 'Solid / Broad Frame',
    category: 'Sturdy / Broad',
    description: 'Substantial shoulder spread, thicker torso, and sturdy leg profile.',
    stylingTip: 'Vertical seams, structured overshirts, and straight-leg trousers create clean proportions.',
  },
  {
    code: '06',
    label: 'Sturdy / Robust',
    category: 'Fuller Torso',
    description: 'Fuller midsection with broad chest, sturdy shoulders, and strong legs.',
    stylingTip: 'Darker core layers paired with unbuttoned chore jackets or cardigans give slimming drape.',
  },
  {
    code: '07',
    label: 'Heavy / Stocky',
    category: 'Plus Build',
    description: 'Wider midriff, rounded waistline, and fuller thigh and arm profile.',
    stylingTip: 'Relaxed fit garments, matte fabrics, and monotone palettes lengthen the vertical line.',
  },
  {
    code: '08',
    label: 'Full / Plus Size',
    category: 'Class II Plus',
    description: 'Broad, generous silhouette with fuller torso, hips, and limbs.',
    stylingTip: 'Structured cottons, breathable linens, and proportional collars maintain neat structure.',
  },
  {
    code: '09',
    label: 'Extended Plus',
    category: 'Class III Plus',
    description: 'Maximum full silhouette with prominent torso and broad build.',
    stylingTip: 'Fluid fabrics with good drape, open layering, and comfort-stretch waists maximize ease and style.',
  },
];

export const FEMALE_BODY_TYPES: BodyTypeInfo[] = [
  {
    code: '10',
    label: 'Slender / Petite',
    category: 'Underweight / Lean',
    description: 'Very lean, narrow frame with delicate shoulders and straight silhouette.',
    stylingTip: 'Ruffles, pleats, layered knits, and cropped jackets create dimension and balance.',
  },
  {
    code: '11',
    label: 'Slim / Subtle Curve',
    category: 'Lean / Trim',
    description: 'Slender torso with gently defined waist and proportionate hips.',
    stylingTip: 'Wrap tops, high-waisted bottoms, and tailored blazers highlight delicate lines.',
  },
  {
    code: '12',
    label: 'Classic / Balanced',
    category: 'Normal / Proportional',
    description: 'Harmonious waist-to-hip proportion with classic balanced silhouette.',
    stylingTip: 'Belted coats, A-line skirts, and fitted crewneck or V-neck tops flatter seamlessly.',
  },
  {
    code: '13',
    label: 'Moderate / Soft Curve',
    category: 'Normal / Curvy',
    description: 'Everyday medium build with natural soft curves and balanced midsection.',
    stylingTip: 'Mid-rise trousers, semi-fitted blouses, and fluid drapes offer effortless comfort.',
  },
  {
    code: '14',
    label: 'Midsize / Curvaceous',
    category: 'Overweight / Curvy',
    description: 'Fuller bust and hips with gentle waist definition and shapely silhouette.',
    stylingTip: 'Structured wrap dresses, wide-leg trousers, and open necklines celebrate curves.',
  },
  {
    code: '15',
    label: 'Full-Figured / Hourglass-Plus',
    category: 'Class I Full',
    description: 'Fuller bust, waist, and hips with defined feminine curves throughout.',
    stylingTip: 'Empire cuts, monochromatic column styling, and breathable stretch textiles.',
  },
  {
    code: '16',
    label: 'Plus / Voluptuous',
    category: 'Class II Plus',
    description: 'Generous midsection, fuller hips, and shapely silhouette with presence.',
    stylingTip: 'Longline cardigans, asymmetric hems, and vertical panel details lengthen the look.',
  },
  {
    code: '17',
    label: 'Extended Full',
    category: 'Class II Extended',
    description: 'Broad, full-figured silhouette across torso, waist, and thighs.',
    stylingTip: 'Soft tailored jackets, breathable cottons, and comfortable elasticized waistbands.',
  },
  {
    code: '18',
    label: 'Maximum Plus',
    category: 'Class III Plus',
    description: 'Maximum full silhouette with generous volume and relaxed proportions.',
    stylingTip: 'Flowing tunics, soft overshirts, and dark accent pieces provide graceful movement.',
  },
];

export function getBodyTypesForSex(sex: BiologicalSex): BodyTypeInfo[] {
  return sex === 'male' ? MALE_BODY_TYPES : FEMALE_BODY_TYPES;
}

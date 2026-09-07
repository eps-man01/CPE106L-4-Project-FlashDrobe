import React from 'react';
import { BiologicalSex } from '../../types';

interface BodySilhouetteSvgProps {
  code: string;
  sex: BiologicalSex;
  className?: string;
  isSelected?: boolean;
}

export const BodySilhouetteSvg: React.FC<BodySilhouetteSvgProps> = ({
  code,
  sex,
  className = 'w-16 h-28',
  isSelected = false,
}) => {
  // Parsing index (0 to 8) for scale
  const isMale = sex === 'male';
  const index = isMale ? parseInt(code, 10) - 1 : parseInt(code, 10) - 10;
  const safeIdx = Math.max(0, Math.min(8, isNaN(index) ? 3 : index));

  // Visual parameters scaled progressively (0: leanest -> 8: fullest)
  // Matching the Stunkard / Pulvers Body Rating Scale in user images
  const scale = safeIdx / 8; // 0.0 to 1.0

  if (isMale) {
    // Male parameters
    const shoulderHalf = 18 + scale * 9; // 18 to 27
    const chestHalf = 14 + scale * 12; // 14 to 26
    const waistHalf = 10 + scale * 17; // 10 to 27
    const hipHalf = 12 + scale * 16; // 12 to 28
    const armThick = 3.5 + scale * 4; // 3.5 to 7.5
    const thighHalf = 6 + scale * 6; // 6 to 12
    const calfHalf = 4.5 + scale * 4; // 4.5 to 8.5
    const headWidth = 9 + scale * 1.5; // 9 to 10.5
    const headHeight = 12;

    const fillStyle = isSelected ? '#8c5836' : '#57534e';
    const strokeStyle = isSelected ? '#5c381e' : '#292524';
    const garmentFill = isSelected ? '#3e2413' : '#1c1917';

    return (
      <svg
        viewBox="0 0 100 160"
        className={`${className} transition-transform duration-200`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shadow base */}
        <ellipse cx="50" cy="155" rx={14 + scale * 10} ry="3.5" fill="#000000" opacity="0.12" />

        {/* Head */}
        <ellipse
          cx="50"
          cy="18"
          rx={headWidth}
          ry={headHeight}
          fill={fillStyle}
          stroke={strokeStyle}
          strokeWidth="1.2"
        />
        {/* Hair cap */}
        <path
          d={`M ${50 - headWidth} 17 Q 50 8 ${50 + headWidth} 17 Q 50 14 ${50 - headWidth} 17 Z`}
          fill={garmentFill}
        />

        {/* Neck */}
        <path
          d={`M ${47 - scale * 2} 29 L ${47 - scale * 2} 34 L ${53 + scale * 2} 34 L ${53 + scale * 2} 29 Z`}
          fill={fillStyle}
        />

        {/* Left Arm */}
        <path
          d={`M ${50 - shoulderHalf} 35 
              C ${50 - shoulderHalf - armThick * 1.2} 48, ${50 - chestHalf - armThick * 1.5} 70, ${50 - waistHalf - armThick * 1.4} 85 
              C ${50 - waistHalf - armThick * 1.6} 92, ${50 - waistHalf - armThick * 1.2} 96, ${50 - waistHalf - armThick} 98 
              C ${50 - waistHalf - armThick * 0.4} 97, ${50 - waistHalf - armThick * 0.2} 93, ${50 - waistHalf} 86 
              C ${50 - chestHalf + 2} 70, ${50 - shoulderHalf + 4} 48, ${50 - shoulderHalf + 3} 37 Z`}
          fill={fillStyle}
          stroke={strokeStyle}
          strokeWidth="1"
        />

        {/* Right Arm */}
        <path
          d={`M ${50 + shoulderHalf} 35 
              C ${50 + shoulderHalf + armThick * 1.2} 48, ${50 + chestHalf + armThick * 1.5} 70, ${50 + waistHalf + armThick * 1.4} 85 
              C ${50 + waistHalf + armThick * 1.6} 92, ${50 + waistHalf + armThick * 1.2} 96, ${50 + waistHalf + armThick} 98 
              C ${50 + waistHalf + armThick * 0.4} 97, ${50 + waistHalf + armThick * 0.2} 93, ${50 + waistHalf} 86 
              C ${50 + chestHalf - 2} 70, ${50 + shoulderHalf - 4} 48, ${50 + shoulderHalf - 3} 37 Z`}
          fill={fillStyle}
          stroke={strokeStyle}
          strokeWidth="1"
        />

        {/* Main Torso */}
        <path
          d={`M ${50 - shoulderHalf} 35 
              Q 50 33 ${50 + shoulderHalf} 35 
              C ${50 + chestHalf} 48, ${50 + waistHalf} 66, ${50 + hipHalf} 88 
              L ${50 - hipHalf} 88 
              C ${50 - waistHalf} 66, ${50 - chestHalf} 48, ${50 - shoulderHalf} 35 Z`}
          fill={fillStyle}
          stroke={strokeStyle}
          strokeWidth="1.2"
        />

        {/* Male Briefs / Shorts Garment (as seen in uploaded sample) */}
        <path
          d={`M ${50 - hipHalf} 76 
              Q 50 78 ${50 + hipHalf} 76 
              L ${50 + hipHalf - 1} 93 
              L 50 91 
              L ${50 - hipHalf + 1} 93 Z`}
          fill={garmentFill}
          stroke={strokeStyle}
          strokeWidth="1"
        />

        {/* Left Leg */}
        <path
          d={`M ${50 - hipHalf + 2} 92 
              C ${50 - hipHalf - 1} 108, ${50 - thighHalf - 5} 122, ${50 - calfHalf - 4} 148 
              L ${41 - scale * 2} 153 
              L ${46 - scale * 1} 153 
              C ${47} 145, ${49} 128, 50 93 Z`}
          fill={fillStyle}
          stroke={strokeStyle}
          strokeWidth="1"
        />

        {/* Right Leg */}
        <path
          d={`M 50 93 
              C 51 128, 53 145, ${54 + scale * 1} 153 
              L ${59 + scale * 2} 153 
              L ${50 + calfHalf + 4} 148 
              C ${50 + thighHalf + 5} 122, ${50 + hipHalf + 1} 108, ${50 + hipHalf - 2} 92 Z`}
          fill={fillStyle}
          stroke={strokeStyle}
          strokeWidth="1"
        />
      </svg>
    );
  }

  // Female parameters (matching female figures 10-18 and A-J swimsuit figures)
  const shoulderHalf = 14 + scale * 8; // 14 to 22
  const bustHalf = 13 + scale * 13; // 13 to 26
  const waistHalf = 8.5 + scale * 17; // 8.5 to 25.5 (hourglass pinch that broadens)
  const hipHalf = 15 + scale * 17; // 15 to 32 (feminine curves)
  const armThick = 3 + scale * 4.5;
  const thighHalf = 6 + scale * 8;
  const calfHalf = 4.5 + scale * 4.5;
  const headWidth = 8.5 + scale * 1.5;
  const headHeight = 11.5;

  const fillStyle = isSelected ? '#8c5836' : '#57534e';
  const strokeStyle = isSelected ? '#5c381e' : '#292524';
  const swimsuitFill = isSelected ? '#3e2413' : '#1c1917';

  return (
    <svg
      viewBox="0 0 100 160"
      className={`${className} transition-transform duration-200`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow base */}
      <ellipse cx="50" cy="155" rx={14 + scale * 10} ry="3.5" fill="#000000" opacity="0.12" />

      {/* Head */}
      <ellipse
        cx="50"
        cy="18"
        rx={headWidth}
        ry={headHeight}
        fill={fillStyle}
        stroke={strokeStyle}
        strokeWidth="1.2"
      />
      {/* Bob/medium hair as in uploaded photos */}
      <path
        d={`M ${50 - headWidth - 1} 15 
            C ${50 - headWidth} 7, ${50 + headWidth} 7, ${50 + headWidth + 1} 15 
            C ${50 + headWidth + 2} 24, ${50 + headWidth} 26, ${50 + headWidth - 1} 27 
            C 50 24, 50 24, ${50 - headWidth + 1} 27 
            Z`}
        fill={swimsuitFill}
      />

      {/* Neck */}
      <path
        d={`M ${47.5 - scale * 1.5} 28 L ${47.5 - scale * 1.5} 33 L ${52.5 + scale * 1.5} 33 L ${52.5 + scale * 1.5} 28 Z`}
        fill={fillStyle}
      />

      {/* Left Arm */}
      <path
        d={`M ${50 - shoulderHalf} 34 
            C ${50 - shoulderHalf - armThick} 47, ${50 - bustHalf - armThick * 1.2} 65, ${50 - waistHalf - armThick * 1.2} 80 
            C ${50 - waistHalf - armThick * 1.4} 89, ${50 - hipHalf - armThick} 94, ${50 - hipHalf - 2} 97 
            C ${50 - hipHalf + 1} 96, ${50 - hipHalf + 2} 91, ${50 - hipHalf + 2} 85 
            C ${50 - waistHalf + 1} 70, ${50 - bustHalf + 2} 50, ${50 - shoulderHalf + 3} 36 Z`}
        fill={fillStyle}
        stroke={strokeStyle}
        strokeWidth="1"
      />

      {/* Right Arm */}
      <path
        d={`M ${50 + shoulderHalf} 34 
            C ${50 + shoulderHalf + armThick} 47, ${50 + bustHalf + armThick * 1.2} 65, ${50 + waistHalf + armThick * 1.2} 80 
            C ${50 + waistHalf + armThick * 1.4} 89, ${50 + hipHalf + armThick} 94, ${50 + hipHalf + 2} 97 
            C ${50 + hipHalf - 1} 96, ${50 + hipHalf - 2} 91, ${50 + hipHalf - 2} 85 
            C ${50 + waistHalf - 1} 70, ${50 + bustHalf - 2} 50, ${50 + shoulderHalf - 3} 36 Z`}
        fill={fillStyle}
        stroke={strokeStyle}
        strokeWidth="1"
      />

      {/* Main Torso */}
      <path
        d={`M ${50 - shoulderHalf} 34 
            Q 50 32 ${50 + shoulderHalf} 34 
            C ${50 + bustHalf} 46, ${50 + waistHalf} 62, ${50 + hipHalf} 84 
            L ${50 - hipHalf} 84 
            C ${50 - waistHalf} 62, ${50 - bustHalf} 46, ${50 - shoulderHalf} 34 Z`}
        fill={fillStyle}
        stroke={strokeStyle}
        strokeWidth="1.2"
      />

      {/* Female Swimsuit One-Piece (matching sample A-J swimsuit) */}
      <path
        d={`M ${46 - scale * 2} 37 
            L ${54 + scale * 2} 37 
            C ${50 + bustHalf - 0.5} 48, ${50 + waistHalf} 62, ${50 + hipHalf - 0.5} 82 
            C ${50 + hipHalf - 2} 88, 50 92, 50 92 
            C 50 92, ${50 - hipHalf + 2} 88, ${50 - hipHalf + 0.5} 82 
            C ${50 - waistHalf} 62, ${50 - bustHalf + 0.5} 48, ${46 - scale * 2} 37 Z`}
        fill={swimsuitFill}
        stroke={strokeStyle}
        strokeWidth="1"
      />

      {/* Left Leg */}
      <path
        d={`M ${50 - hipHalf + 2} 85 
            C ${50 - hipHalf - 1} 102, ${50 - thighHalf - 4} 118, ${50 - calfHalf - 3} 148 
            L ${42 - scale * 1.5} 153 
            L ${46.5} 153 
            C ${48} 142, ${49} 122, 50 92 Z`}
        fill={fillStyle}
        stroke={strokeStyle}
        strokeWidth="1"
      />

      {/* Right Leg */}
      <path
        d={`M 50 92 
            C 51 122, 52 142, ${53.5} 153 
            L ${58 + scale * 1.5} 153 
            L ${50 + calfHalf + 3} 148 
            C ${50 + thighHalf + 4} 118, ${50 + hipHalf + 1} 102, ${50 + hipHalf - 2} 85 Z`}
        fill={fillStyle}
        stroke={strokeStyle}
        strokeWidth="1"
      />
    </svg>
  );
};

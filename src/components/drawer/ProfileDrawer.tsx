import React, { useState, useEffect } from 'react';
import MuiCheckbox from '@mui/material/Checkbox';
import { CloseIcon } from '../icons/CloseIcon';
import { useMediaQuery, COMPACT_QUERY } from '../../hooks/useMediaQuery';
import { GenerateFromProfileBar } from './GenerateFromProfileBar';
import type { SelectedProfileItem } from '../../data/pitchAnalysis';
import type { AnglePrompt } from '../../data/anglePrompts';

// Types
export interface JobHistoryItem {
  id: string;
  companyLogo?: string;
  companyName: string;
  role: string;
  dateRange: string;
  isSelected?: boolean;
}

export interface ScreenerQuestion {
  id: string;
  question: string;
  answer?: string;
  isKeyQuestion?: boolean;
  isSelected?: boolean;
  responseDate?: string;
}

export interface ProfileDetailsData {
  id: string;
  name: string;
  isCustomRecruit?: boolean;
  biography?: string;
  jobHistory?: JobHistoryItem[];
  screeners?: ScreenerQuestion[]; // Business/Angle screeners (only for vetted profiles)
  pastScreeners?: ScreenerQuestion[]; // Past screeners (for all profiles, with project ID info)
}

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileDetailsData | null;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onInjectContent?: (content: string) => void;
  /** Always show as an overlay sheet, even on wide screens */
  forceOverlay?: boolean;
  /** Replace the pitch's bullets with generated content (enables "Replace Bullets") */
  onReplaceContent?: (content: string) => void;
  /** Angle context used when generating from selected profile data */
  anglePrompt?: AnglePrompt;
}

// Profile Avatar Icon (from profilecircle.svg)
const ProfileAvatarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4.9375 14.0996C5.6875 13.5718 6.48958 13.1795 7.34375 12.9225C8.19792 12.6656 9.08333 12.5371 10 12.5371C10.9167 12.5371 11.8021 12.6656 12.6562 12.9225C13.5104 13.1795 14.3125 13.5718 15.0625 14.0996C15.5486 13.5302 15.9097 12.8982 16.1458 12.2038C16.3819 11.5093 16.5 10.7871 16.5 10.0371C16.5 8.23614 15.8665 6.70253 14.5994 5.43628C13.3323 4.17016 11.7976 3.53711 9.99521 3.53711C8.19285 3.53711 6.65972 4.17016 5.39583 5.43628C4.13194 6.70253 3.5 8.23614 3.5 10.0371C3.5 10.7871 3.61806 11.5093 3.85417 12.2038C4.09028 12.8982 4.45139 13.5302 4.9375 14.0996ZM10 11.5371C9.16667 11.5371 8.45833 11.2454 7.875 10.6621C7.29167 10.0788 7 9.37044 7 8.53711C7 7.70378 7.29167 6.99544 7.875 6.41211C8.45833 5.82878 9.16667 5.53711 10 5.53711C10.8333 5.53711 11.5417 5.82878 12.125 6.41211C12.7083 6.99544 13 7.70378 13 8.53711C13 9.37044 12.7083 10.0788 12.125 10.6621C11.5417 11.2454 10.8333 11.5371 10 11.5371ZM10.0058 18.0371C8.90472 18.0371 7.86806 17.8288 6.89583 17.4121C5.92361 16.9954 5.07292 16.4225 4.34375 15.6934C3.61458 14.9642 3.04167 14.1138 2.625 13.1421C2.20833 12.1704 2 11.1322 2 10.0275C2 8.9228 2.20833 7.8878 2.625 6.92253C3.04167 5.95725 3.61458 5.11003 4.34375 4.38086C5.07292 3.65169 5.92333 3.07878 6.895 2.66211C7.86667 2.24544 8.90486 2.03711 10.0096 2.03711C11.1143 2.03711 12.1493 2.24544 13.1146 2.66211C14.0799 3.07878 14.9271 3.65169 15.6562 4.38086C16.3854 5.11003 16.9583 5.95878 17.375 6.92711C17.7917 7.89558 18 8.9303 18 10.0313C18 11.1324 17.7917 12.1691 17.375 13.1413C16.9583 14.1135 16.3854 14.9642 15.6562 15.6934C14.9271 16.4225 14.0783 16.9954 13.11 17.4121C12.1415 17.8288 11.1068 18.0371 10.0058 18.0371ZM10 16.5371C10.7222 16.5371 11.4167 16.4225 12.0833 16.1934C12.75 15.9642 13.375 15.6274 13.9583 15.1829C13.3611 14.8079 12.7292 14.5232 12.0625 14.3288C11.3958 14.1343 10.7083 14.0371 10 14.0371C9.29167 14.0371 8.60069 14.1309 7.92708 14.3184C7.25347 14.5059 6.625 14.7941 6.04167 15.1829C6.625 15.6274 7.25 15.9642 7.91667 16.1934C8.58333 16.4225 9.27778 16.5371 10 16.5371ZM10 10.0371C10.4167 10.0371 10.7708 9.89128 11.0625 9.59961C11.3542 9.30794 11.5 8.95378 11.5 8.53711C11.5 8.12044 11.3542 7.76628 11.0625 7.47461C10.7708 7.18294 10.4167 7.03711 10 7.03711C9.58333 7.03711 9.22917 7.18294 8.9375 7.47461C8.64583 7.76628 8.5 8.12044 8.5 8.53711C8.5 8.95378 8.64583 9.30794 8.9375 9.59961C9.22917 9.89128 9.58333 10.0371 10 10.0371Z" fill="currentColor" fillOpacity="0.64"/>
  </svg>
);

// Chevron Up Icon
const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5 12.5L10 7.5L15 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Chevron Down Icon
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Checkmark Icon (for badge)
const CheckIcon: React.FC<{ className?: string; size?: number }> = ({ className, size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2.5 6L5 8.5L9.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// View All Icon (double chevron up/down)
const ViewAllIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5 6L8 3L11 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 10L8 13L11 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Role/Person Icon
const RoleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M8 8C9.38071 8 10.5 6.88071 10.5 5.5C10.5 4.11929 9.38071 3 8 3C6.61929 3 5.5 4.11929 5.5 5.5C5.5 6.88071 6.61929 8 8 8Z" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M3 13C3 10.7909 5.23858 9 8 9C10.7614 9 13 10.7909 13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// Key Question Star Icon (kid_star from Figma)
const KeyQuestionStarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <mask id="mask_star" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
      <rect width="20" height="20" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask_star)">
      <path d="M6.35547 5.33268L8.6888 2.31185C8.85547 2.08963 9.05339 1.92643 9.28255 1.82227C9.51172 1.7181 9.7513 1.66602 10.0013 1.66602C10.2513 1.66602 10.4909 1.7181 10.7201 1.82227C10.9492 1.92643 11.1471 2.08963 11.3138 2.31185L13.6471 5.33268L17.1888 6.52018C17.5499 6.63129 17.8346 6.83615 18.043 7.13477C18.2513 7.43338 18.3555 7.76324 18.3555 8.12435C18.3555 8.29102 18.3312 8.45768 18.2826 8.62435C18.2339 8.79102 18.1541 8.95074 18.043 9.10352L15.7513 12.3535L15.8346 15.7702C15.8485 16.2563 15.6888 16.666 15.3555 16.9993C15.0221 17.3327 14.6332 17.4993 14.1888 17.4993C14.161 17.4993 14.0082 17.4785 13.7305 17.4368L10.0013 16.3952L6.27214 17.4368C6.20269 17.4646 6.1263 17.482 6.04297 17.4889C5.95964 17.4959 5.88325 17.4993 5.8138 17.4993C5.36936 17.4993 4.98047 17.3327 4.64714 16.9993C4.3138 16.666 4.15408 16.2563 4.16797 15.7702L4.2513 12.3327L1.98047 9.10352C1.86936 8.95074 1.7895 8.79102 1.74089 8.62435C1.69227 8.45768 1.66797 8.29102 1.66797 8.12435C1.66797 7.77713 1.76866 7.45421 1.97005 7.1556C2.17144 6.85699 2.45269 6.64518 2.8138 6.52018L6.35547 5.33268Z" fill="#009E52"/>
    </g>
  </svg>
);

// Inject Icon (input_circle from Figma)
const InjectIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <mask id="mask_inject" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
      <rect width="24" height="24" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask_inject)">
      <path d="M12 8L7 13L8.4 14.4L11 11.825V22H13V11.825L15.6 14.4L17 13L12 8ZM3.65 17.5C3.11667 16.6833 2.70833 15.8083 2.425 14.875C2.14167 13.9417 2 12.9833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 12.9833 21.8583 13.9417 21.575 14.875C21.2917 15.8083 20.8833 16.6833 20.35 17.5L18.9 16.05C19.2667 15.4333 19.5417 14.7833 19.725 14.1C19.9083 13.4167 20 12.7167 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 12.7167 4.09167 13.4167 4.275 14.1C4.45833 14.7833 4.73333 15.4333 5.1 16.05L3.65 17.5Z" fill="currentColor"/>
    </g>
  </svg>
);

// Profile Details Tab Icon (from profiledetailstab.svg)
const ProfileDetailsTabIcon: React.FC<{ className?: string }> = ({ className }) => {
  const maskId = `mask_profile_tab_${Date.now()}`;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <mask id={maskId} style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
        <rect width="16" height="16" fill="#D9D9D9"/>
      </mask>
      <g mask={`url(#${maskId})`}>
        <path d="M9.60156 4.39922V3.19922H14.4016V4.39922H9.60156ZM9.60156 6.99922V5.79922H14.4016V6.99922H9.60156ZM9.60156 9.59922V8.39922H14.4016V9.59922H9.60156ZM5.60156 8.79922C5.04601 8.79922 4.57378 8.60477 4.1849 8.21589C3.79601 7.827 3.60156 7.35477 3.60156 6.79922C3.60156 6.24366 3.79601 5.77144 4.1849 5.38255C4.57378 4.99366 5.04601 4.79922 5.60156 4.79922C6.15712 4.79922 6.62934 4.99366 7.01823 5.38255C7.40712 5.77144 7.60156 6.24366 7.60156 6.79922C7.60156 7.35477 7.40712 7.827 7.01823 8.21589C6.62934 8.60477 6.15712 8.79922 5.60156 8.79922ZM1.60156 12.7992V11.7492C1.60156 11.4381 1.68212 11.1548 1.84323 10.8992C2.00434 10.6437 2.21823 10.4492 2.4849 10.3159C2.96267 10.0826 3.46267 9.90477 3.9849 9.78255C4.50712 9.66033 5.04601 9.59922 5.60156 9.59922C6.15712 9.59922 6.69601 9.66033 7.21823 9.78255C7.74045 9.90477 8.24045 10.0826 8.71823 10.3159C8.9849 10.4492 9.19879 10.6437 9.3599 10.8992C9.52101 11.1548 9.60156 11.4381 9.60156 11.7492V12.7992H1.60156ZM2.81823 11.5992H8.3849C8.05156 11.3437 7.65156 11.1464 7.1849 11.0076C6.71823 10.8687 6.19045 10.7992 5.60156 10.7992C5.01267 10.7992 4.4849 10.8687 4.01823 11.0076C3.55156 11.1464 3.15156 11.3437 2.81823 11.5992ZM5.60156 7.59922C5.82823 7.59922 6.01823 7.52255 6.17156 7.36922C6.3249 7.21589 6.40156 7.02589 6.40156 6.79922C6.40156 6.57255 6.3249 6.38255 6.17156 6.22922C6.01823 6.07589 5.82823 5.99922 5.60156 5.99922C5.3749 5.99922 5.1849 6.07589 5.03156 6.22922C4.87823 6.38255 4.80156 6.57255 4.80156 6.79922C4.80156 7.02589 4.87823 7.21589 5.03156 7.36922C5.1849 7.52255 5.3749 7.59922 5.60156 7.59922Z" fill="currentColor"/>
      </g>
    </svg>
  );
};

// Past Screeners Tab Icon (from pastscreenertab.svg)
const ScreenersTabIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4.39572 12.7992C4.06472 12.7992 3.78255 12.6814 3.54922 12.4457C3.31589 12.2101 3.19922 11.9267 3.19922 11.5957C3.19922 11.2647 3.31705 10.9826 3.55272 10.7492C3.78839 10.5159 4.07172 10.3992 4.40272 10.3992C4.73372 10.3992 5.01589 10.5171 5.24922 10.7527C5.48255 10.9884 5.59922 11.2717 5.59922 11.6027C5.59922 11.9337 5.48139 12.2159 5.24572 12.4492C5.01005 12.6826 4.72672 12.7992 4.39572 12.7992ZM4.39572 9.19922C4.06472 9.19922 3.78255 9.08139 3.54922 8.84572C3.31589 8.61005 3.19922 8.32672 3.19922 7.99572C3.19922 7.66472 3.31705 7.38255 3.55272 7.14922C3.78839 6.91589 4.07172 6.79922 4.40272 6.79922C4.73372 6.79922 5.01589 6.91705 5.24922 7.15272C5.48255 7.38839 5.59922 7.67172 5.59922 8.00272C5.59922 8.33372 5.48139 8.61589 5.24572 8.84922C5.01005 9.08255 4.72672 9.19922 4.39572 9.19922ZM4.39572 5.59922C4.06472 5.59922 3.78255 5.48139 3.54922 5.24572C3.31589 5.01005 3.19922 4.72672 3.19922 4.39572C3.19922 4.06472 3.31705 3.78255 3.55272 3.54922C3.78839 3.31589 4.07172 3.19922 4.40272 3.19922C4.73372 3.19922 5.01589 3.31705 5.24922 3.55272C5.48255 3.78839 5.59922 4.07172 5.59922 4.40272C5.59922 4.73372 5.48139 5.01589 5.24572 5.24922C5.01005 5.48255 4.72672 5.59922 4.39572 5.59922ZM7.99572 5.59922C7.66472 5.59922 7.38255 5.48139 7.14922 5.24572C6.91589 5.01005 6.79922 4.72672 6.79922 4.39572C6.79922 4.06472 6.91705 3.78255 7.15272 3.54922C7.38838 3.31589 7.67172 3.19922 8.00272 3.19922C8.33372 3.19922 8.61589 3.31705 8.84922 3.55272C9.08255 3.78839 9.19922 4.07172 9.19922 4.40272C9.19922 4.73372 9.08138 5.01589 8.84572 5.24922C8.61005 5.48255 8.32672 5.59922 7.99572 5.59922ZM11.5957 5.59922C11.2647 5.59922 10.9826 5.48139 10.7492 5.24572C10.5159 5.01005 10.3992 4.72672 10.3992 4.39572C10.3992 4.06472 10.5171 3.78255 10.7527 3.54922C10.9884 3.31589 11.2717 3.19922 11.6027 3.19922C11.9337 3.19922 12.2159 3.31705 12.4492 3.55272C12.6826 3.78839 12.7992 4.07172 12.7992 4.40272C12.7992 4.73372 12.6814 5.01589 12.4457 5.24922C12.2101 5.48255 11.9267 5.59922 11.5957 5.59922ZM7.99572 9.19922C7.66472 9.19922 7.38255 9.08139 7.14922 8.84572C6.91589 8.61005 6.79922 8.32672 6.79922 7.99572C6.79922 7.66472 6.91705 7.38255 7.15272 7.14922C7.38838 6.91589 7.67172 6.79922 8.00272 6.79922C8.33372 6.79922 8.61589 6.91705 8.84922 7.15272C9.08255 7.38839 9.19922 7.67172 9.19922 8.00272C9.19922 8.33372 9.08138 8.61589 8.84572 8.84922C8.61005 9.08255 8.32672 9.19922 7.99572 9.19922ZM8.79922 12.7992V10.9159L12.2992 7.43255C12.3799 7.35022 12.4695 7.29072 12.5681 7.25405C12.6666 7.2175 12.7646 7.19922 12.8619 7.19922C12.968 7.19922 13.0697 7.21866 13.1671 7.25755C13.2644 7.29644 13.3529 7.35477 13.4326 7.43255L14.1659 8.18255C14.2391 8.26322 14.2963 8.35283 14.3374 8.45139C14.3786 8.54994 14.3992 8.64789 14.3992 8.74522C14.3992 8.84255 14.3809 8.94211 14.3444 9.04389C14.3077 9.14555 14.2482 9.23622 14.1659 9.31589L10.6826 12.7992H8.79922ZM9.59922 11.9992H10.3492L12.2659 10.0826L11.8992 9.69922L11.5326 9.33255L9.59922 11.2492V11.9992ZM11.8992 9.69922L11.5326 9.33255L12.2659 10.0826L11.8992 9.69922Z" fill="currentColor" fillOpacity="0.64"/>
  </svg>
);

// Custom Checkbox component
const Checkbox: React.FC<{
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}> = ({ checked = false, onChange, className, disabled = false }) => (
  <MuiCheckbox
    size="small"
    checked={checked}
    disabled={disabled}
    onChange={(event) => onChange?.(event.target.checked)}
    className={className}
    sx={{ p: 0.25 }}
  />
);

// Company Logo Badge
const CompanyLogoBadge: React.FC<{ 
  name: string;
  className?: string;
}> = ({ name, className }) => {
  // Generate initials from company name (max 2 chars)
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  
  return (
    <div className={`w-8 h-8 rounded bg-blue-100 flex items-center justify-center flex-shrink-0 ${className || ''}`}>
      <span className="text-xs font-semibold text-blue-700">{initials}</span>
    </div>
  );
};

// Section Card component (wraps each section with border)
const SectionCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div 
    className={`border border-grey-scale-200 bg-white ${className || ''}`}
    style={{
      borderRadius: '8px',
      boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    }}
  >
    {children}
  </div>
);

// Section Header component
const SectionHeader: React.FC<{
  title: string;
  hasCheckbox?: boolean;
  checked?: boolean;
  onCheckChange?: (checked: boolean) => void;
  onViewAll?: () => void;
}> = ({ title, hasCheckbox, checked, onCheckChange, onViewAll }) => (
  <div className="flex items-center justify-between px-4 py-3">
    <div className="flex items-center gap-3">
      {hasCheckbox && (
        <Checkbox checked={checked} onChange={onCheckChange} />
      )}
      <span className="text-sm font-semibold text-grey-scale-800">
        {title}
      </span>
    </div>
    {onViewAll && (
      <button
        onClick={onViewAll}
        className="flex items-center gap-1 transition-colors hover:opacity-100"
        style={{ color: 'rgba(0, 0, 0, 0.64)' }}
      >
        <ViewAllIcon />
        <span className="text-sm font-medium">View All</span>
      </button>
    )}
  </div>
);

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  onNavigatePrevious,
  onNavigateNext,
  hasPrevious = false,
  hasNext = false,
  onInjectContent,
  forceOverlay = false,
  onReplaceContent,
  anglePrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'screeners'>('details');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [selectedScreeners, setSelectedScreeners] = useState<Set<string>>(new Set());
  const [selectedBusinessScreeners, setSelectedBusinessScreeners] = useState<Set<string>>(new Set());
  const [selectedAngleScreeners, setSelectedAngleScreeners] = useState<Set<string>>(new Set());
  const [selectedPastScreeners, setSelectedPastScreeners] = useState<Set<string>>(new Set());
  const [biographyChecked, setBiographyChecked] = useState(false);
  // Phones/tablets: no room beside the cards, so show as an overlay sheet instead of inline
  const isCompact = useMediaQuery(COMPACT_QUERY);
  const isOverlay = forceOverlay || isCompact;

  // Helper functions to filter screeners
  const getBusinessScreeners = () => {
    if (!profile?.screeners) return [];
    return profile.screeners.filter(s => !s.id.startsWith('angle-'));
  };

  const getAngleScreeners = () => {
    if (!profile?.screeners) return [];
    return profile.screeners.filter(s => s.id.startsWith('angle-'));
  };
  
  // Close button hover/active states (matching modal)
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isCloseActive, setIsCloseActive] = useState(false);
  
  const getCloseBackgroundColor = () => {
    if (isCloseActive) {
      return 'rgba(0, 130, 235, 0.16)'; // blue-600 at 16%
    }
    if (isCloseHovered) {
      return 'rgba(0, 0, 0, 0.04)'; // grey at 4%
    }
    return 'transparent';
  };

  const getCloseIconColor = () => {
    if (isCloseActive) {
      return '#0082EB'; // blue-600
    }
    return 'rgba(0, 0, 0, 0.64)'; // black at 64%
  };

  // Reset selections when profile changes
  useEffect(() => {
    setSelectedJobs(new Set());
    setSelectedScreeners(new Set());
    setSelectedBusinessScreeners(new Set());
    setSelectedAngleScreeners(new Set());
    setSelectedPastScreeners(new Set());
    setBiographyChecked(false);
  }, [profile?.id]);

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const toggleScreenerSelection = (screenerId: string) => {
    setSelectedScreeners(prev => {
      const next = new Set(prev);
      if (next.has(screenerId)) {
        next.delete(screenerId);
      } else {
        next.add(screenerId);
      }
      return next;
    });
  };

  const selectAllScreeners = () => {
    if (profile?.screeners) {
      // Check if ALL screeners are currently selected
      const allSelected = selectedScreeners.size === profile.screeners.length;
      if (allSelected) {
        // Deselect all
        setSelectedScreeners(new Set());
      } else {
        // Select all screeners
        setSelectedScreeners(new Set(profile.screeners.map(s => s.id)));
      }
    }
  };

  const selectAllKeyScreeners = () => {
    if (profile?.screeners) {
      const keyScreenerIds = profile.screeners.filter(s => s.isKeyQuestion).map(s => s.id);
      const nonKeyScreenerIds = profile.screeners.filter(s => !s.isKeyQuestion).map(s => s.id);
      
      // Check if ONLY key questions are selected (all key selected, no non-key selected)
      const allKeySelected = keyScreenerIds.length > 0 && keyScreenerIds.every(id => selectedScreeners.has(id));
      const noNonKeySelected = nonKeyScreenerIds.every(id => !selectedScreeners.has(id));
      const onlyKeyQuestionsSelected = allKeySelected && noNonKeySelected;
      
      if (onlyKeyQuestionsSelected) {
        // Deselect all (toggle off)
        setSelectedScreeners(new Set());
      } else {
        // Select ONLY key questions (deselect non-key ones)
        setSelectedScreeners(new Set(keyScreenerIds));
      }
    }
  };

  // Check if ALL screeners are selected
  const areAllScreenersSelected = (): boolean => {
    if (!profile?.screeners) return false;
    return profile.screeners.length > 0 && selectedScreeners.size === profile.screeners.length;
  };

  // Check if ONLY key questions are selected (all key selected, no non-key selected)
  const areOnlyKeyQuestionsSelected = (): boolean => {
    if (!profile?.screeners) return false;
    const keyScreenerIds = profile.screeners.filter(s => s.isKeyQuestion).map(s => s.id);
    const nonKeyScreenerIds = profile.screeners.filter(s => !s.isKeyQuestion).map(s => s.id);
    
    const allKeySelected = keyScreenerIds.length > 0 && keyScreenerIds.every(id => selectedScreeners.has(id));
    const noNonKeySelected = nonKeyScreenerIds.every(id => !selectedScreeners.has(id));
    
    return allKeySelected && noNonKeySelected;
  };

  // Inject all selected screeners into the editor
  const handleInjectSelected = () => {
    if (onInjectContent && profile?.screeners && selectedScreeners.size > 0) {
      const selectedScreenersList = profile.screeners.filter(s => selectedScreeners.has(s.id));
      
      // Format all selected Q&As as bullet list
      const bulletItems = selectedScreenersList.map(screener => 
        `<li><strong>Q:</strong> ${screener.question}</li>${screener.answer ? `<li><strong>A:</strong> ${screener.answer}</li>` : ''}`
      ).join('');
      
      const bulletContent = `<ul>${bulletItems}</ul>`;
      onInjectContent(bulletContent);
      
      // Clear selection after inject
      setSelectedScreeners(new Set());
    }
  };

  // Business Screeners functions
  const toggleBusinessScreenerSelection = (screenerId: string) => {
    setSelectedBusinessScreeners(prev => {
      const next = new Set(prev);
      if (next.has(screenerId)) {
        next.delete(screenerId);
      } else {
        next.add(screenerId);
      }
      return next;
    });
  };

  const selectAllBusinessScreeners = () => {
    const businessScreeners = getBusinessScreeners();
    const allSelected = selectedBusinessScreeners.size === businessScreeners.length;
    if (allSelected) {
      setSelectedBusinessScreeners(new Set());
    } else {
      setSelectedBusinessScreeners(new Set(businessScreeners.map(s => s.id)));
    }
  };

  const selectAllKeyBusinessScreeners = () => {
    const businessScreeners = getBusinessScreeners();
    const keyScreenerIds = businessScreeners.filter(s => s.isKeyQuestion).map(s => s.id);
    const nonKeyScreenerIds = businessScreeners.filter(s => !s.isKeyQuestion).map(s => s.id);
    
    const allKeySelected = keyScreenerIds.length > 0 && keyScreenerIds.every(id => selectedBusinessScreeners.has(id));
    const noNonKeySelected = nonKeyScreenerIds.every(id => !selectedBusinessScreeners.has(id));
    const onlyKeyQuestionsSelected = allKeySelected && noNonKeySelected;
    
    if (onlyKeyQuestionsSelected) {
      setSelectedBusinessScreeners(new Set());
    } else {
      setSelectedBusinessScreeners(new Set(keyScreenerIds));
    }
  };

  const areAllBusinessScreenersSelected = (): boolean => {
    const businessScreeners = getBusinessScreeners();
    return businessScreeners.length > 0 && selectedBusinessScreeners.size === businessScreeners.length;
  };

  const areOnlyKeyBusinessQuestionsSelected = (): boolean => {
    const businessScreeners = getBusinessScreeners();
    const keyScreenerIds = businessScreeners.filter(s => s.isKeyQuestion).map(s => s.id);
    const nonKeyScreenerIds = businessScreeners.filter(s => !s.isKeyQuestion).map(s => s.id);
    
    const allKeySelected = keyScreenerIds.length > 0 && keyScreenerIds.every(id => selectedBusinessScreeners.has(id));
    const noNonKeySelected = nonKeyScreenerIds.every(id => !selectedBusinessScreeners.has(id));
    
    return allKeySelected && noNonKeySelected;
  };

  const hasKeyBusinessScreeners = (): boolean => {
    const businessScreeners = getBusinessScreeners();
    return businessScreeners.some(s => s.isKeyQuestion);
  };

  const handleInjectSelectedBusinessScreeners = () => {
    const businessScreeners = getBusinessScreeners();
    if (onInjectContent && selectedBusinessScreeners.size > 0) {
      const selectedScreenersList = businessScreeners.filter(s => selectedBusinessScreeners.has(s.id));
      
      const bulletItems = selectedScreenersList.map(screener => 
        `<li><strong>Q:</strong> ${screener.question}</li>${screener.answer ? `<li><strong>A:</strong> ${screener.answer}</li>` : ''}`
      ).join('');
      
      const bulletContent = `<ul>${bulletItems}</ul>`;
      onInjectContent(bulletContent);
      
      setSelectedBusinessScreeners(new Set());
    }
  };

  // Angle Screeners functions
  const toggleAngleScreenerSelection = (screenerId: string) => {
    setSelectedAngleScreeners(prev => {
      const next = new Set(prev);
      if (next.has(screenerId)) {
        next.delete(screenerId);
      } else {
        next.add(screenerId);
      }
      return next;
    });
  };

  const selectAllAngleScreeners = () => {
    const angleScreeners = getAngleScreeners();
    const allSelected = selectedAngleScreeners.size === angleScreeners.length;
    if (allSelected) {
      setSelectedAngleScreeners(new Set());
    } else {
      setSelectedAngleScreeners(new Set(angleScreeners.map(s => s.id)));
    }
  };

  const selectAllKeyAngleScreeners = () => {
    const angleScreeners = getAngleScreeners();
    const keyScreenerIds = angleScreeners.filter(s => s.isKeyQuestion).map(s => s.id);
    const nonKeyScreenerIds = angleScreeners.filter(s => !s.isKeyQuestion).map(s => s.id);
    
    const allKeySelected = keyScreenerIds.length > 0 && keyScreenerIds.every(id => selectedAngleScreeners.has(id));
    const noNonKeySelected = nonKeyScreenerIds.every(id => !selectedAngleScreeners.has(id));
    const onlyKeyQuestionsSelected = allKeySelected && noNonKeySelected;
    
    if (onlyKeyQuestionsSelected) {
      setSelectedAngleScreeners(new Set());
    } else {
      setSelectedAngleScreeners(new Set(keyScreenerIds));
    }
  };

  const areAllAngleScreenersSelected = (): boolean => {
    const angleScreeners = getAngleScreeners();
    return angleScreeners.length > 0 && selectedAngleScreeners.size === angleScreeners.length;
  };

  const areOnlyKeyAngleQuestionsSelected = (): boolean => {
    const angleScreeners = getAngleScreeners();
    const keyScreenerIds = angleScreeners.filter(s => s.isKeyQuestion).map(s => s.id);
    const nonKeyScreenerIds = angleScreeners.filter(s => !s.isKeyQuestion).map(s => s.id);
    
    const allKeySelected = keyScreenerIds.length > 0 && keyScreenerIds.every(id => selectedAngleScreeners.has(id));
    const noNonKeySelected = nonKeyScreenerIds.every(id => !selectedAngleScreeners.has(id));
    
    return allKeySelected && noNonKeySelected;
  };

  const hasKeyAngleScreeners = (): boolean => {
    const angleScreeners = getAngleScreeners();
    return angleScreeners.some(s => s.isKeyQuestion);
  };

  const handleInjectSelectedAngleScreeners = () => {
    const angleScreeners = getAngleScreeners();
    if (onInjectContent && selectedAngleScreeners.size > 0) {
      const selectedScreenersList = angleScreeners.filter(s => selectedAngleScreeners.has(s.id));
      
      const bulletItems = selectedScreenersList.map(screener => 
        `<li><strong>Q:</strong> ${screener.question}</li>${screener.answer ? `<li><strong>A:</strong> ${screener.answer}</li>` : ''}`
      ).join('');
      
      const bulletContent = `<ul>${bulletItems}</ul>`;
      onInjectContent(bulletContent);
      
      setSelectedAngleScreeners(new Set());
    }
  };

  // Past Screeners functions
  const togglePastScreenerSelection = (screenerId: string) => {
    setSelectedPastScreeners(prev => {
      const next = new Set(prev);
      if (next.has(screenerId)) {
        next.delete(screenerId);
      } else {
        next.add(screenerId);
      }
      return next;
    });
  };

  const selectAllPastScreeners = () => {
    if (profile?.pastScreeners) {
      const allSelected = selectedPastScreeners.size === profile.pastScreeners.length;
      if (allSelected) {
        setSelectedPastScreeners(new Set());
      } else {
        setSelectedPastScreeners(new Set(profile.pastScreeners.map(s => s.id)));
      }
    }
  };

  const selectAllKeyPastScreeners = () => {
    if (profile?.pastScreeners) {
      const keyScreenerIds = profile.pastScreeners.filter(s => s.isKeyQuestion).map(s => s.id);
      const nonKeyScreenerIds = profile.pastScreeners.filter(s => !s.isKeyQuestion).map(s => s.id);
      
      const allKeySelected = keyScreenerIds.length > 0 && keyScreenerIds.every(id => selectedPastScreeners.has(id));
      const noNonKeySelected = nonKeyScreenerIds.every(id => !selectedPastScreeners.has(id));
      const onlyKeyQuestionsSelected = allKeySelected && noNonKeySelected;
      
      if (onlyKeyQuestionsSelected) {
        setSelectedPastScreeners(new Set());
      } else {
        setSelectedPastScreeners(new Set(keyScreenerIds));
      }
    }
  };

  const areAllPastScreenersSelected = (): boolean => {
    if (!profile?.pastScreeners) return false;
    return profile.pastScreeners.length > 0 && selectedPastScreeners.size === profile.pastScreeners.length;
  };

  const areOnlyKeyPastQuestionsSelected = (): boolean => {
    if (!profile?.pastScreeners) return false;
    const keyScreenerIds = profile.pastScreeners.filter(s => s.isKeyQuestion).map(s => s.id);
    const nonKeyScreenerIds = profile.pastScreeners.filter(s => !s.isKeyQuestion).map(s => s.id);
    
    const allKeySelected = keyScreenerIds.length > 0 && keyScreenerIds.every(id => selectedPastScreeners.has(id));
    const noNonKeySelected = nonKeyScreenerIds.every(id => !selectedPastScreeners.has(id));
    
    return allKeySelected && noNonKeySelected;
  };

  const handleInjectSelectedPastScreeners = () => {
    if (onInjectContent && profile?.pastScreeners && selectedPastScreeners.size > 0) {
      const selectedScreenersList = profile.pastScreeners.filter(s => selectedPastScreeners.has(s.id));
      
      const bulletItems = selectedScreenersList.map(screener => 
        `<li><strong>Q:</strong> ${screener.question}</li>${screener.answer ? `<li><strong>A:</strong> ${screener.answer}</li>` : ''}`
      ).join('');
      
      const bulletContent = `<ul>${bulletItems}</ul>`;
      onInjectContent(bulletContent);
      
      setSelectedPastScreeners(new Set());
    }
  };

  // Don't render if not open or no profile
  if (!isOpen || !profile) return null;

  // Everything ticked across the drawer, for "Generate Into Pitch"
  const selectedProfileItems: SelectedProfileItem[] = [
    ...(biographyChecked && profile.biography ? [{ kind: 'biography' as const, text: profile.biography }] : []),
    ...(profile.jobHistory || [])
      .filter((job) => selectedJobs.has(job.id))
      .map((job) => ({ kind: 'job' as const, text: `${job.role} at ${job.companyName} (${job.dateRange})` })),
    ...(profile.screeners || [])
      .filter((screener) => selectedScreeners.has(screener.id) || selectedBusinessScreeners.has(screener.id) || selectedAngleScreeners.has(screener.id))
      .map((screener) => ({ kind: 'screener' as const, text: screener.question, answer: screener.answer })),
    ...(profile.pastScreeners || [])
      .filter((screener) => selectedPastScreeners.has(screener.id))
      .map((screener) => ({ kind: 'screener' as const, text: screener.question, answer: screener.answer })),
  ];

  const clearAllSelections = () => {
    setBiographyChecked(false);
    setSelectedJobs(new Set());
    setSelectedScreeners(new Set());
    setSelectedBusinessScreeners(new Set());
    setSelectedAngleScreeners(new Set());
    setSelectedPastScreeners(new Set());
  };

  const drawerStyle: React.CSSProperties = isOverlay
    ? {
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 60, // Above navigation (z-50)
        width: '100%',
        maxWidth: '616px',
        boxShadow: '-4px 0px 24px rgba(0, 0, 0, 0.16)',
      }
    : {
        width: '616px', 
        flexShrink: 0, 
        position: 'sticky',
        top: '140px',
        alignSelf: 'flex-start',
        height: 'calc(100vh - 180px)',
        borderRadius: '16px',
        boxShadow: '-4px 0px 24px rgba(0, 0, 0, 0.08), 0px 4px 16px rgba(0, 0, 0, 0.04)',
      };

  return (
    <>
    {/* Backdrop - overlay mode only */}
    {isOverlay && (
      <div
        className="fixed inset-0 bg-black/40"
        style={{ zIndex: 60 }}
        onClick={onClose}
        aria-hidden="true"
      />
    )}
    <div 
      className="drawer-section flex flex-col bg-white"
      style={drawerStyle}
      role={isOverlay ? 'dialog' : undefined}
      aria-modal={isOverlay ? true : undefined}
      aria-label={isOverlay ? `Profile details for ${profile.name}` : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-grey-scale-500 shrink-0">
            <ProfileAvatarIcon />
          </div>
          <span 
            className="text-grey-scale-900 truncate"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '16px',
              fontWeight: 600,
              lineHeight: '24px',
            }}
          >
            {profile.name}
          </span>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {/* Navigation arrows */}
          <button
            onClick={onNavigatePrevious}
            disabled={!hasPrevious}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              hasPrevious 
                ? 'text-grey-scale-600 hover:text-grey-scale-900 hover:bg-grey-scale-100' 
                : 'text-grey-scale-300 cursor-not-allowed'
            }`}
            aria-label="Previous profile"
          >
            <ChevronUpIcon />
          </button>
          <button
            onClick={onNavigateNext}
            disabled={!hasNext}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              hasNext 
                ? 'text-grey-scale-600 hover:text-grey-scale-900 hover:bg-grey-scale-100' 
                : 'text-grey-scale-300 cursor-not-allowed'
            }`}
            aria-label="Next profile"
          >
            <ChevronDownIcon />
          </button>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-full"
            style={{
              width: '32px',
              height: '32px',
              padding: '8px',
              borderRadius: '1000px',
              backgroundColor: getCloseBackgroundColor(),
              flexShrink: 0,
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Close drawer"
            onMouseEnter={() => setIsCloseHovered(true)}
            onMouseLeave={() => {
              setIsCloseHovered(false);
              setIsCloseActive(false);
            }}
            onMouseDown={() => setIsCloseActive(true)}
            onMouseUp={() => setIsCloseActive(false)}
            onFocus={() => setIsCloseHovered(true)}
            onBlur={() => {
              setIsCloseHovered(false);
              setIsCloseActive(false);
            }}
          >
            <CloseIcon style={{ color: getCloseIconColor() }} />
          </button>
        </div>
      </div>

      {/* Custom Recruit Badge */}
      {profile.isCustomRecruit && (
        <div className="px-4 sm:px-6 pb-4">
          <div className="inline-flex items-center gap-2">
            <span 
              className="px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: '#E6F7F5',
                color: '#0D9488',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Custom Recruit
            </span>
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#0D9488' }}
            >
              <CheckIcon className="text-white" size={14} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex px-4 sm:px-6 border-b border-grey-scale-200">
        <button
          onClick={() => setActiveTab('details')}
          className={`py-3 mr-6 text-sm font-medium transition-colors relative flex items-center gap-2 ${
            activeTab === 'details'
              ? 'text-blue-600'
              : 'text-grey-scale-500 hover:text-grey-scale-700'
          }`}
        >
          <ProfileDetailsTabIcon />
          <span>Profile Details</span>
          {activeTab === 'details' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('screeners')}
          className={`py-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
            activeTab === 'screeners'
              ? 'text-blue-600'
              : 'text-grey-scale-500 hover:text-grey-scale-700'
          }`}
        >
          <ScreenersTabIcon />
          <span>Past Screeners</span>
          {activeTab === 'screeners' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      {/* Content */}
      <div 
        className="overflow-y-auto flex-1 p-4 sm:p-6"
        style={{
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
        }}
      >
        {activeTab === 'details' ? (
          <div className="flex flex-col gap-4">
            {/* Biography Section */}
            <SectionCard>
              <SectionHeader
                title="Biography"
                hasCheckbox
                checked={biographyChecked}
                onCheckChange={setBiographyChecked}
                onViewAll={() => console.log('View all biography')}
              />
              <div className="px-4 pb-4">
                <p 
                  className="text-grey-scale-700 leading-relaxed"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '14px',
                    lineHeight: '22px',
                  }}
                >
                  {profile.biography || 'No biography available.'}
                </p>
              </div>
            </SectionCard>

            {/* Job History Section */}
            <SectionCard>
              <SectionHeader
                title="Job History"
                onViewAll={() => console.log('View all job history')}
              />
              <div className="px-4 pb-2">
                {profile.jobHistory && profile.jobHistory.length > 0 ? (
                  profile.jobHistory.map((job, index) => (
                    <div
                      key={job.id}
                      className={`flex items-start gap-3 py-3 ${
                        index !== profile.jobHistory!.length - 1 ? 'border-b border-grey-scale-100' : ''
                      }`}
                    >
                      <Checkbox
                        checked={selectedJobs.has(job.id)}
                        onChange={() => toggleJobSelection(job.id)}
                        className="mt-1.5"
                      />
                      <CompanyLogoBadge name={job.companyName} />
                      <div className="flex-1 min-w-0">
                        <p 
                          className="text-grey-scale-800 truncate"
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '14px',
                            fontWeight: 500,
                            lineHeight: '20px',
                          }}
                        >
                          {job.companyName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <RoleIcon className="text-grey-scale-500 flex-shrink-0" />
                          <p 
                            className="text-grey-scale-600 truncate"
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '12px',
                              lineHeight: '18px',
                            }}
                          >
                            {job.role}
                          </p>
                        </div>
                      </div>
                      <p 
                        className="text-grey-scale-500 whitespace-nowrap flex-shrink-0"
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '12px',
                          lineHeight: '18px',
                        }}
                      >
                        {job.dateRange}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-grey-scale-500 py-4">No job history available.</p>
                )}
              </div>
            </SectionCard>

            {/* Business Screeners Section */}
            <SectionCard>
              <SectionHeader
                title="Business Screeners"
                onViewAll={() => console.log('View all business screeners')}
              />
              <div className="px-4 pb-2">
                {(() => {
                  const businessScreeners = getBusinessScreeners();
                  const hasScreeners = businessScreeners.length > 0;
                  const hasKeyQuestions = hasKeyBusinessScreeners();
                  
                  return hasScreeners ? (
                    <>
                      {/* Select All options with floating Inject button */}
                      <div className="flex items-center justify-between py-3 border-b border-grey-scale-100">
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={areAllBusinessScreenersSelected()}
                              onChange={selectAllBusinessScreeners}
                            />
                            <span 
                              className="text-grey-scale-600"
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '13px',
                              }}
                            >
                              Select All
                            </span>
                          </label>
                          <label className={`flex items-center gap-2 ${hasKeyQuestions ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                            <Checkbox
                              checked={areOnlyKeyBusinessQuestionsSelected()}
                              onChange={selectAllKeyBusinessScreeners}
                              disabled={!hasKeyQuestions}
                            />
                            <span 
                              className="text-grey-scale-600"
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '13px',
                              }}
                            >
                              Select All Key Q's
                            </span>
                          </label>
                        </div>
                        
                        {/* Floating Inject Button */}
                        {selectedBusinessScreeners.size > 0 && (
                          <button
                            onClick={handleInjectSelectedBusinessScreeners}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors hover:opacity-90"
                            style={{
                              backgroundColor: 'rgba(0, 130, 235, 0.08)',
                              color: '#0082EB',
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '13px',
                              fontWeight: 600,
                            }}
                            title={`Inject ${selectedBusinessScreeners.size} selected Q&A(s) into pitch`}
                          >
                            <InjectIcon className="w-4 h-4" />
                            <span>Inject ({selectedBusinessScreeners.size})</span>
                          </button>
                        )}
                      </div>
                      
                      {businessScreeners.map((screener, index) => (
                        <div
                          key={screener.id}
                          className={`relative flex gap-2 py-4 ${
                            index !== businessScreeners.length - 1 ? 'border-b border-grey-scale-100' : ''
                          }`}
                          style={{ padding: '16px 0' }}
                        >
                          {/* Left column: Checkbox + Key Question Star */}
                          <div className="flex flex-col items-center gap-2 pt-0.5 flex-shrink-0">
                            <Checkbox
                              checked={selectedBusinessScreeners.has(screener.id)}
                              onChange={() => toggleBusinessScreenerSelection(screener.id)}
                            />
                            {screener.isKeyQuestion && (
                              <KeyQuestionStarIcon />
                            )}
                          </div>
                          
                          {/* Middle: Q&A Content */}
                          <div className="flex-1 min-w-0 flex flex-col gap-2">
                            <p 
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '14px',
                                lineHeight: '20px',
                                color: '#000000',
                              }}
                            >
                              <span style={{ fontWeight: 700 }}>Q: </span>
                              <span style={{ fontWeight: 500 }}>{screener.question}</span>
                            </p>
                            
                            {screener.answer && (
                              <p 
                                style={{
                                  fontFamily: "'Poppins', sans-serif",
                                  fontSize: '14px',
                                  lineHeight: '20px',
                                  color: '#000000',
                                }}
                              >
                                <span style={{ fontWeight: 700 }}>A: </span>
                                <span style={{ fontWeight: 500 }}>{screener.answer}</span>
                              </p>
                            )}
                            
                            {screener.responseDate && (
                              <p 
                                style={{
                                  fontFamily: "'Poppins', sans-serif",
                                  fontSize: '12px',
                                  lineHeight: '20px',
                                  color: '#000000',
                                }}
                              >
                                <span style={{ fontWeight: 500 }}>Response Date: </span>
                                <span style={{ fontWeight: 700 }}>{screener.responseDate}</span>
                              </p>
                            )}
                          </div>
                          
                          {/* Right: Inject Button */}
                          <button 
                            className="flex-shrink-0 flex items-center justify-center transition-colors hover:opacity-80"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '1000px',
                              backgroundColor: 'rgba(0, 130, 235, 0.08)',
                              color: '#0082EB',
                            }}
                            onClick={() => {
                              if (onInjectContent) {
                                const bulletContent = `<ul><li><strong>Q:</strong> ${screener.question}</li>${screener.answer ? `<li><strong>A:</strong> ${screener.answer}</li>` : ''}</ul>`;
                                onInjectContent(bulletContent);
                              }
                            }}
                            title="Inject Q&A into pitch"
                          >
                            <InjectIcon />
                          </button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-sm text-grey-scale-500 py-4">No business screeners available.</p>
                  );
                })()}
              </div>
            </SectionCard>

            {/* Angle Screeners Section */}
            <SectionCard>
              <SectionHeader
                title="Angle Screeners"
                onViewAll={() => console.log('View all angle screeners')}
              />
              <div className="px-4 pb-2">
                {(() => {
                  const angleScreeners = getAngleScreeners();
                  const hasScreeners = angleScreeners.length > 0;
                  const hasKeyQuestions = hasKeyAngleScreeners();
                  
                  return hasScreeners ? (
                    <>
                      {/* Select All options with floating Inject button */}
                      <div className="flex items-center justify-between py-3 border-b border-grey-scale-100">
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={areAllAngleScreenersSelected()}
                              onChange={selectAllAngleScreeners}
                            />
                            <span 
                              className="text-grey-scale-600"
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '13px',
                              }}
                            >
                              Select All
                            </span>
                          </label>
                          <label className={`flex items-center gap-2 ${hasKeyQuestions ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                            <Checkbox
                              checked={areOnlyKeyAngleQuestionsSelected()}
                              onChange={selectAllKeyAngleScreeners}
                              disabled={!hasKeyQuestions}
                            />
                            <span 
                              className="text-grey-scale-600"
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '13px',
                              }}
                            >
                              Select All Key Q's
                            </span>
                          </label>
                        </div>
                        
                        {/* Floating Inject Button */}
                        {selectedAngleScreeners.size > 0 && (
                          <button
                            onClick={handleInjectSelectedAngleScreeners}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors hover:opacity-90"
                            style={{
                              backgroundColor: 'rgba(0, 130, 235, 0.08)',
                              color: '#0082EB',
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '13px',
                              fontWeight: 600,
                            }}
                            title={`Inject ${selectedAngleScreeners.size} selected Q&A(s) into pitch`}
                          >
                            <InjectIcon className="w-4 h-4" />
                            <span>Inject ({selectedAngleScreeners.size})</span>
                          </button>
                        )}
                      </div>
                      
                      {angleScreeners.map((screener, index) => (
                        <div
                          key={screener.id}
                          className={`relative flex gap-2 py-4 ${
                            index !== angleScreeners.length - 1 ? 'border-b border-grey-scale-100' : ''
                          }`}
                          style={{ padding: '16px 0' }}
                        >
                          {/* Left column: Checkbox + Key Question Star */}
                          <div className="flex flex-col items-center gap-2 pt-0.5 flex-shrink-0">
                            <Checkbox
                              checked={selectedAngleScreeners.has(screener.id)}
                              onChange={() => toggleAngleScreenerSelection(screener.id)}
                            />
                            {screener.isKeyQuestion && (
                              <KeyQuestionStarIcon />
                            )}
                          </div>
                          
                          {/* Middle: Q&A Content */}
                          <div className="flex-1 min-w-0 flex flex-col gap-2">
                            <p 
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '14px',
                                lineHeight: '20px',
                                color: '#000000',
                              }}
                            >
                              <span style={{ fontWeight: 700 }}>Q: </span>
                              <span style={{ fontWeight: 500 }}>{screener.question}</span>
                            </p>
                            
                            {screener.answer && (
                              <p 
                                style={{
                                  fontFamily: "'Poppins', sans-serif",
                                  fontSize: '14px',
                                  lineHeight: '20px',
                                  color: '#000000',
                                }}
                              >
                                <span style={{ fontWeight: 700 }}>A: </span>
                                <span style={{ fontWeight: 500 }}>{screener.answer}</span>
                              </p>
                            )}
                            
                            {screener.responseDate && (
                              <p 
                                style={{
                                  fontFamily: "'Poppins', sans-serif",
                                  fontSize: '12px',
                                  lineHeight: '20px',
                                  color: '#000000',
                                }}
                              >
                                <span style={{ fontWeight: 500 }}>Response Date: </span>
                                <span style={{ fontWeight: 700 }}>{screener.responseDate}</span>
                              </p>
                            )}
                          </div>
                          
                          {/* Right: Inject Button */}
                          <button 
                            className="flex-shrink-0 flex items-center justify-center transition-colors hover:opacity-80"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '1000px',
                              backgroundColor: 'rgba(0, 130, 235, 0.08)',
                              color: '#0082EB',
                            }}
                            onClick={() => {
                              if (onInjectContent) {
                                const bulletContent = `<ul><li><strong>Q:</strong> ${screener.question}</li>${screener.answer ? `<li><strong>A:</strong> ${screener.answer}</li>` : ''}</ul>`;
                                onInjectContent(bulletContent);
                              }
                            }}
                            title="Inject Q&A into pitch"
                          >
                            <InjectIcon />
                          </button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-sm text-grey-scale-500 py-4">No angle screeners available.</p>
                  );
                })()}
              </div>
            </SectionCard>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <SectionCard>
              <SectionHeader
                title="Past Screeners"
                onViewAll={() => console.log('View all past screeners')}
              />
              <div className="px-4 pb-2">
                {/* Select All options with floating Inject button */}
                <div className="flex items-center justify-between py-3 border-b border-grey-scale-100">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={areAllPastScreenersSelected()}
                        onChange={selectAllPastScreeners}
                      />
                      <span 
                        className="text-grey-scale-600"
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '13px',
                        }}
                      >
                        Select All
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={areOnlyKeyPastQuestionsSelected()}
                        onChange={selectAllKeyPastScreeners}
                      />
                      <span 
                        className="text-grey-scale-600"
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '13px',
                        }}
                      >
                        Select All Key Q's
                      </span>
                    </label>
                  </div>
                  
                  {/* Floating Inject Button - appears when past screeners are selected */}
                  {selectedPastScreeners.size > 0 && (
                    <button
                      onClick={handleInjectSelectedPastScreeners}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors hover:opacity-90"
                      style={{
                        backgroundColor: 'rgba(0, 130, 235, 0.08)',
                        color: '#0082EB',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                      title={`Inject ${selectedPastScreeners.size} selected Q&A(s) into pitch`}
                    >
                      <InjectIcon className="w-4 h-4" />
                      <span>Inject ({selectedPastScreeners.size})</span>
                    </button>
                  )}
                </div>
                
                {profile.pastScreeners && profile.pastScreeners.length > 0 ? (
                  profile.pastScreeners.map((screener, index) => (
                    <div
                      key={screener.id}
                      className={`relative flex gap-2 py-4 ${
                        index !== profile.pastScreeners!.length - 1 ? 'border-b border-grey-scale-100' : ''
                      }`}
                      style={{ padding: '16px 0' }}
                    >
                      {/* Left column: Checkbox + Key Question Star */}
                      <div className="flex flex-col items-center gap-2 pt-0.5 flex-shrink-0">
                        <Checkbox
                          checked={selectedPastScreeners.has(screener.id)}
                          onChange={() => togglePastScreenerSelection(screener.id)}
                        />
                        {screener.isKeyQuestion && (
                          <KeyQuestionStarIcon />
                        )}
                      </div>
                      
                      {/* Middle: Q&A Content */}
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        {/* Project ID and Date */}
                        <div className="flex justify-between items-center mb-1">
                          <span 
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '14px',
                              fontWeight: 400,
                              color: '#000000',
                            }}
                          >
                            Project ID:{' '}
                            <a
                              href="#"
                              style={{
                                color: '#0082EB',
                                textDecoration: 'underline',
                              }}
                              onClick={(e) => e.preventDefault()}
                            >
                              123456 - {profile.name}
                            </a>
                          </span>
                          {screener.responseDate && (
                            <span
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '12px',
                                lineHeight: '20px',
                                color: 'rgba(0, 0, 0, 0.48)',
                              }}
                            >
                              Date: {screener.responseDate}
                            </span>
                          )}
                        </div>
                        
                        {/* Question */}
                        <p 
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '14px',
                            lineHeight: '20px',
                            color: '#000000',
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>Q: </span>
                          <span style={{ fontWeight: 500 }}>{screener.question}</span>
                        </p>
                        
                        {/* Answer */}
                        {screener.answer && (
                          <p 
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '14px',
                              lineHeight: '20px',
                              color: '#000000',
                            }}
                          >
                            <span style={{ fontWeight: 700 }}>A: </span>
                            <span style={{ fontWeight: 500 }}>{screener.answer}</span>
                          </p>
                        )}
                      </div>
                      
                      {/* Right: Inject Button */}
                      <button 
                        className="flex-shrink-0 flex items-center justify-center transition-colors hover:opacity-80"
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '1000px',
                          backgroundColor: 'rgba(0, 130, 235, 0.08)',
                          color: '#0082EB',
                        }}
                        onClick={() => {
                          if (onInjectContent) {
                            const bulletContent = `<ul><li><strong>Q:</strong> ${screener.question}</li>${screener.answer ? `<li><strong>A:</strong> ${screener.answer}</li>` : ''}</ul>`;
                            onInjectContent(bulletContent);
                          }
                        }}
                        title="Inject Q&A into pitch"
                      >
                        <InjectIcon />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-grey-scale-500 py-4">No past screeners available.</p>
                )}
              </div>
            </SectionCard>
          </div>
        )}
      </div>

      {onInjectContent && (
        <GenerateFromProfileBar
          key={profile.id}
          advisorName={profile.name}
          items={selectedProfileItems}
          onClearSelection={clearAllSelections}
          anglePrompt={anglePrompt}
          onAddToPitch={onInjectContent}
          onReplacePitch={onReplaceContent}
        />
      )}
    </div>
    </>
  );
};

export default ProfileDrawer;

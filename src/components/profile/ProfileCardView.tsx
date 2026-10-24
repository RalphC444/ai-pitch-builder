import React from 'react';
import { ProfileCard, ProfileCardProps } from './ProfileCard';

/**
 * ProfileCardView Component
 * 
 * Wrapper component for ProfileCard in view mode.
 * This is a convenience component that ensures ProfileCard is used in view mode.
 * 
 * @example
 * <ProfileCardView
 *   name="Colin Anderson"
 *   status="unvetted"
 *   content="Advisor content..."
 * />
 */
export const ProfileCardView: React.FC<ProfileCardProps> = (props) => {
  return <ProfileCard {...props} />;
};

export default ProfileCardView;







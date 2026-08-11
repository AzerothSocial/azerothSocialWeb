'use client';

import { useState } from 'react';
import { followUserAction } from '@/app/actions/social';

interface FollowSuggestionButtonProps {
  targetUserId: string;
}

export default function FollowSuggestionButton({ targetUserId }: FollowSuggestionButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = async () => {
    setIsFollowing(true);
    const result = await followUserAction(targetUserId);
    
    // If it fails, revert the loading state. 
    // If it succeeds, the page will revalidate and this component will unmount/re-render.
    if (result && !result.success) {
      console.error(result.error);
      setIsFollowing(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleFollow();
      }}
      disabled={isFollowing}
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: '#C89B3C',
        color: '#000',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        opacity: isFollowing ? 0.5 : 1,
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
        flexShrink: 0
      }}
      title="Seguir Usuário"
    >
      {isFollowing ? (
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '12px' }}></i>
      ) : (
        <i className="fa-solid fa-plus"></i>
      )}
    </button>
  );
}

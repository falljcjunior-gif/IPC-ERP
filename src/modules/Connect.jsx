import React from 'react';
import TeamChat from '../components/TeamChat';

/**
 * IPC CONNECT - Standalone Module Wrapper
 * This module promotes the TeamChat component to a first-class enterprise module.
 */
const Connect = (props) => {
  return (
    <div style={{ height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
      <TeamChat 
        {...props} 
        isOpen={true} 
        mode="module" 
        onClose={() => {}} // No-op in module mode
      />
    </div>
  );
};

export default Connect;

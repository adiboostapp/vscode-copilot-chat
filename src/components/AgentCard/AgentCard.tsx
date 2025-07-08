// src/components/AgentCard/AgentCard.tsx
import React from 'react';
// import './AgentCard.css'; // Assuming CSS or styled-components would be here

interface AgentCardProps {
    agentId: string;
    name: string;
    role: string;
    avatarUrl?: string;
    icon?: React.ReactNode;
    status: 'active' | 'idle' | 'engaged';
    isSelected: boolean;
    onClick: (agentId: string) => void;
    onEdit: (agentId: string) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({
    agentId,
    name,
    role,
    avatarUrl,
    icon,
    status,
    isSelected,
    onClick,
    onEdit
}) => {
    const statusIndicatorColor = {
        active: 'green', // Placeholder colors
        idle: 'grey',
        engaged: 'blue',
    }[status];

    return (
        <div
            className={`agent-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onClick(agentId)}
            role="button"
            tabIndex={0}
            aria-selected={isSelected}
            aria-label={`Agent: ${name}, Role: ${role}, Status: ${status}`}
            // Style this div with CSS: display: flex, alignItems: center, padding, margin, border, etc.
        >
            <div className="agent-card-avatar-status" /* Style: flex, alignItems: center */ >
                {avatarUrl ? <img src={avatarUrl} alt={`${name} avatar`} style={{width: '32px', height: '32px', borderRadius: '50%', marginRight: '8px'}} /> : <span className="icon" /* Style: marginRight: 8px */ >{icon || '👤'}</span>}
                <span className="status-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusIndicatorColor, marginRight: '8px' }} title={status}></span>
            </div>
            <div className="agent-card-info" /* Style: flex-grow: 1 */ >
                <h4 className="agent-name" /* Style: margin: 0, fontSize: '1em' */ >{name}</h4>
                <p className="agent-role" /* Style: margin: 0, fontSize: '0.85em', color: 'grey' */ >{role}</p>
            </div>
            <button
                className="agent-edit-button"
                onClick={(e) => { e.stopPropagation(); onEdit(agentId); }}
                aria-label={`Edit agent ${name}`}
                // Style: background: transparent, border: none, cursor: pointer, padding: 4px
            >
                ⚙️ {/* Settings/Edit Icon - consider using an SVG icon library */}
            </button>
        </div>
    );
};

export default AgentCard;

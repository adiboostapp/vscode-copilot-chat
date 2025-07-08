// src/components/AgentSidebar/AgentSidebar.tsx
import React from 'react';
import AgentCard from '../AgentCard/AgentCard';
// import './AgentSidebar.css'; // Assuming CSS or styled-components

// Assuming Agent type is defined in a shared types file e.g., src/types/index.ts
// For now, defining it inline for clarity in this conceptual step
interface Agent {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
    icon?: React.ReactNode; // Placeholder for an icon component or SVG
    status: 'active' | 'idle' | 'engaged';
}

interface AgentSidebarProps {
    agents: Agent[];
    selectedAgentId: string | null;
    onSelectAgent: (agentId: string) => void;
    onEditAgent: (agentId: string) => void;
    onCreateAgent: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const AgentSidebar: React.FC<AgentSidebarProps> = ({
    agents,
    selectedAgentId,
    onSelectAgent,
    onEditAgent,
    onCreateAgent,
    isCollapsed,
    onToggleCollapse,
}) => {
    if (isCollapsed) {
        return (
            <div className="agent-sidebar collapsed" /* Style: width: 50px, padding: 10px */>
                <button onClick={onToggleCollapse} aria-label="Expand sidebar" /* Style: background: transparent, border: none */ >➡️</button>
                {/* In collapsed mode, you might show only icons of agents or a selection */}
            </div>
        );
    }

    return (
        <div className="agent-sidebar expanded" /* Style: width: 250px, borderRight: 1px solid #ccc, display: flex, flexDirection: column, height: 100% */ >
            <div className="sidebar-header" /* Style: display: flex, justifyContent: space-between, alignItems: center, padding: 10px, borderBottom: 1px solid #eee */ >
                <h3 /* Style: margin: 0 */>Agents</h3>
                <button onClick={onToggleCollapse} aria-label="Collapse sidebar" /* Style: background: transparent, border: none */>⬅️</button>
            </div>
            <div className="agent-list" /* Style: overflowY: auto, flexGrow: 1, padding: 8px */ >
                {agents.map((agent) => (
                    <AgentCard
                        key={agent.id}
                        agentId={agent.id}
                        name={agent.name}
                        role={agent.role}
                        avatarUrl={agent.avatarUrl}
                        icon={agent.icon}
                        status={agent.status}
                        isSelected={agent.id === selectedAgentId}
                        onClick={onSelectAgent}
                        onEdit={onEditAgent}
                    />
                ))}
            </div>
            <div className="sidebar-footer" /* Style: padding: 10px, borderTop: 1px solid #eee */ >
                <button onClick={onCreateAgent} className="create-agent-button" /* Style: width: 100%, padding: 8px, background: #007bff, color: white, border: none, borderRadius: 4px */ >
                    + Create New Agent
                </button>
            </div>
        </div>
    );
};

export default AgentSidebar;

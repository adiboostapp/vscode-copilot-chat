// src/components/AgentQuickSwitchDropdown/AgentQuickSwitchDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
// import './AgentQuickSwitchDropdown.css'; // Or styled-components

interface AgentInfo {
    id: string;
    name: string;
    avatarUrl?: string;
    icon?: React.ReactNode; // Could be an SVG component or similar
    role?: string;
}

interface AgentQuickSwitchDropdownProps {
    agents: AgentInfo[];
    activeAgentId: string;
    onSelectAgent: (agentId: string) => void;
    maxVisibleNameLength?: number;
}

const AgentQuickSwitchDropdown: React.FC<AgentQuickSwitchDropdownProps> = ({
    agents,
    activeAgentId,
    onSelectAgent,
    maxVisibleNameLength = 20, // Default max length for display
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeAgent = agents.find(agent => agent.id === activeAgentId);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleSelect = (agentId: string) => {
        onSelectAgent(agentId);
        setIsOpen(false);
    };

    // Close dropdown if clicked outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const truncateName = (name: string) => {
        if (!name) return '';
        return name.length > maxVisibleNameLength ? name.substring(0, maxVisibleNameLength) + '...' : name;
    };

    if (!activeAgent) {
        // This case should ideally be handled by ensuring `activeAgentId` is always valid
        // or by having a default/placeholder agent.
        // For now, rendering a simple placeholder.
        return <div className="agent-quick-switch-dropdown" style={{ padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px' }}>No active agent</div>;
    }

    return (
        <div className="agent-quick-switch-dropdown" ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }} >
            <button
                onClick={toggleDropdown}
                className="dropdown-toggle"
                aria-haspopup="true"
                aria-expanded={isOpen}
                title={`Current Agent: ${activeAgent.name} (${activeAgent.role || 'General'})`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#efefef',
                    border: '1px solid #ccc',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    minWidth: '150px', // Ensure some minimum width
                    justifyContent: 'space-between'
                }}
            >
                <span style={{display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {activeAgent.avatarUrl ? (
                        <img src={activeAgent.avatarUrl} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '8px', flexShrink: 0 }} />
                    ) : (
                        activeAgent.icon ? <span style={{ marginRight: '8px', flexShrink: 0 }}>{activeAgent.icon}</span> : <span style={{ marginRight: '8px', flexShrink: 0 }}>👤</span>
                    )}
                    <span className="active-agent-name" style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis' }} >{truncateName(activeAgent.name)}</span>
                </span>
                <span className="dropdown-arrow" style={{ marginLeft: 'auto', paddingLeft: '5px' }} >{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <ul
                    className="dropdown-menu"
                    role="menu"
                    style={{
                        position: 'absolute',
                        bottom: '100%', // Position above the button
                        left: 0,
                        background: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        listStyle: 'none',
                        margin: '0 0 5px 0', // Margin to separate from button
                        padding: '5px 0',
                        zIndex: 1000,
                        minWidth: '200px',
                        maxHeight: '300px', // Prevent overly long lists
                        overflowY: 'auto', // Scroll if many agents
                        boxShadow: '0 -2px 5px rgba(0,0,0,0.1)' // Shadow for "above" effect
                    }}
                >
                    {agents.map(agent => (
                        <li
                            key={agent.id}
                            onClick={() => handleSelect(agent.id)}
                            role="menuitem"
                            title={`${agent.name} (${agent.role || 'General'})`}
                            className={`dropdown-item ${agent.id === activeAgentId ? 'selected' : ''}`}
                            style={{
                                padding: '10px 15px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                background: agent.id === activeAgentId ? '#e0e0e0' : 'transparent',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = agent.id === activeAgentId ? '#d0d0d0' : '#f5f5f5')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = agent.id === activeAgentId ? '#e0e0e0' : 'transparent')}
                        >
                            {agent.avatarUrl ? (
                                <img src={agent.avatarUrl} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '8px', flexShrink: 0 }} />
                            ) : (
                                agent.icon ? <span style={{ marginRight: '8px', flexShrink: 0 }}>{agent.icon}</span> : <span style={{ marginRight: '8px', flexShrink: 0 }}>👤</span>
                            )}
                            <span style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>{agent.name}</span>
                            {agent.id === activeAgentId && <span style={{ marginLeft: 'auto', paddingLeft: '10px', color: '#007bff' }}>✓</span>}
                        </li>
                    ))}
                     <li style={{borderTop: '1px solid #eee', marginTop: '5px', paddingTop: '5px'}}>
                        <button
                            // onClick={onManageAgents} // This would be a prop to open the full agent management view
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                background: 'transparent',
                                border: 'none',
                                padding: '10px 15px',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            Manage Agents...
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
};

export default AgentQuickSwitchDropdown;

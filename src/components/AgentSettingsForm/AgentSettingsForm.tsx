// src/components/AgentSettingsForm/AgentSettingsForm.tsx
import React, { useState, useEffect } from 'react';
// import './AgentSettingsForm.css'; // Or styled-components

interface AgentConfig {
    name: string;
    role: string;
    systemPrompt: string;
    avatarUrl?: string;
    // Future additions:
    // tone?: 'concise' | 'verbose';
    // specialty?: string; // Could be a string for now, or an array of predefined specialties
    // contextScope?: string; // e.g., 'currentFile', 'currentRepo'
}

interface AgentSettingsFormProps {
    initialConfig?: AgentConfig;
    onSubmit: (config: AgentConfig) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const AgentSettingsForm: React.FC<AgentSettingsFormProps> = ({
    initialConfig,
    onSubmit,
    onCancel,
    isLoading,
}) => {
    const [config, setConfig] = useState<AgentConfig>(initialConfig || {
        name: '',
        role: '',
        systemPrompt: '',
        avatarUrl: '',
    });

    useEffect(() => {
        if (initialConfig) {
            setConfig(initialConfig);
        } else {
            // Reset form if initialConfig is not provided (e.g. for creating new)
            setConfig({
                name: '',
                role: '',
                systemPrompt: '',
                avatarUrl: '',
            });
        }
    }, [initialConfig]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig(prevConfig => ({ ...prevConfig, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation example
        if (!config.name.trim()) {
            alert("Agent name is required."); // Replace with proper UI feedback
            return;
        }
        onSubmit(config);
    };

    return (
        <form onSubmit={handleSubmit} className="agent-settings-form" /* Style: padding: 20px, background: #f9f9f9, border: 1px solid #ddd, borderRadius: 8px */ >
            <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>{initialConfig ? 'Edit Agent' : 'Create New Agent'}</h3>

            <div className="form-group" style={{ marginBottom: '15px' }}>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={config.name}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                />
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
                <label htmlFor="role" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Role/Specialty:</label>
                <input
                    type="text"
                    id="role"
                    name="role"
                    value={config.role}
                    onChange={handleChange}
                    placeholder="e.g., Code Reviewer, Python Expert"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                />
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
                <label htmlFor="systemPrompt" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>System Prompt:</label>
                <textarea
                    id="systemPrompt"
                    name="systemPrompt"
                    value={config.systemPrompt}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Define the agent's personality, instructions, and constraints here..."
                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical' }}
                />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="avatarUrl" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Avatar URL (Optional):</label>
                <input
                    type="url"
                    id="avatarUrl"
                    name="avatarUrl"
                    value={config.avatarUrl || ''}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.png"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                />
            </div>

            {/*
            TODO: Implement more structured fields based on earlier discussions:
            - Tone: Dropdown ('concise', 'verbose')
            - Specialty: Select/Multiselect/Tags ('coding', 'documentation', 'debugging', 'testing')
            - Context Scope: Dropdown ('Current File', 'Open Files', 'Current Repository', 'Current Branch')
                          Possibly with an advanced option for custom path/pattern input.
            */}

            <div className="form-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }} >
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: '#eee', cursor: 'pointer' }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer' }}
                >
                    {isLoading ? 'Saving...' : (initialConfig ? 'Save Changes' : 'Create Agent')}
                </button>
            </div>
        </form>
    );
};

export default AgentSettingsForm;

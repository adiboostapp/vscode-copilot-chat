// src/components/CreateAgentModal/CreateAgentModal.tsx
import React from 'react';
import AgentSettingsForm from '../AgentSettingsForm/AgentSettingsForm';
// import './CreateAgentModal.css'; // For modal-specific styling (overlay, container)

// Assuming AgentConfig is defined in a shared types file or imported from AgentSettingsForm
// For now, defining it inline for clarity
interface AgentConfig {
    name: string;
    role: string;
    systemPrompt: string;
    avatarUrl?: string;
    // Potentially more settings like tone, specialty, contextScope
}

interface CreateAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (config: AgentConfig) => void; // This is the data from the form
    isLoading?: boolean;
}

const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
}) => {
    if (!isOpen) {
        return null;
    }

    // The actual agent creation logic (e.g., API call to backend)
    // will happen in the parent component that uses this modal and provides the onSubmit callback.
    // This component's responsibility is to gather the data via AgentSettingsForm and pass it up.

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Close modal if overlay (not content) is clicked
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="modal-overlay"
            onClick={handleOverlayClick}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1050, // Ensure it's above other content
                padding: '20px' // Padding for smaller screens
            }}
        >
            <div
                className="modal-content"
                style={{
                    background: 'white',
                    // padding: '20px', // AgentSettingsForm has its own padding
                    borderRadius: '8px',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                    minWidth: '320px', // Minimum width for small screens
                    maxWidth: '600px', // Max width for larger forms
                    width: '100%', // Responsive width
                    maxHeight: '90vh', // Max height to prevent overflow
                    overflowY: 'auto' // Allow scrolling for form content if needed
                }}
            >
                {/*
                  The AgentSettingsForm includes its own title ("Create New Agent" or "Edit Agent")
                  and Cancel/Submit buttons. So, a separate modal header/footer might be redundant
                  unless more complex modal interactions are needed.
                */}
                <AgentSettingsForm
                    // No initialConfig is passed, so AgentSettingsForm knows it's for creation
                    onSubmit={onSubmit}
                    onCancel={onClose} // The form's cancel button will trigger the modal's onClose
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};

export default CreateAgentModal;

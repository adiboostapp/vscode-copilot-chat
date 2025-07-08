// src/store/agentStore.ts
import {create} from 'zustand';
import { immer } from 'zustand/middleware/immer';

// It's good practice to define these types in a shared location, e.g., src/types/agent.ts
// For now, keeping them here for simplicity in this conceptual step.
export interface AgentContextScope {
    type: 'currentFile' | 'openFiles' | 'currentRepository' | 'currentBranch' | 'custom' | 'none';
    customPath?: string; // if type is 'custom'
}

export interface Agent {
    id: string; // UUID, generated on creation (or by backend)
    name: string;
    role: string; // e.g., "Code Reviewer", "Documentation Assistant"
    systemPrompt: string;
    avatarUrl?: string;
    icon?: string; // Placeholder for an icon identifier or SVG string
    status: 'active' | 'idle' | 'engaged'; // Primarily for frontend display logic

    // Preferences / Configuration that affect behavior
    tone: 'concise' | 'verbose' | 'neutral' | 'friendly' | 'formal';
    specialty: string[]; // e.g., ['python', 'react', 'testing'] - managed as tags or multi-select
    contextScope: AgentContextScope;

    // Timestamps for management
    createdAt: string; // ISO Date string
    updatedAt: string; // ISO Date string

    // For potential future features like ordering
    // order?: number;
}

// Data structure for the form when creating or editing an agent.
// Omits fields that are auto-generated or managed by the system.
export type AgentConfigFormData = Omit<Agent, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
// For updates, most fields are optional. For creation, some might be required by the form.
export type AgentUpdateFormData = Partial<AgentConfigFormData>;


interface AgentState {
    agentsList: Agent[];
    activeAgentId: string | null;
    editingAgent: Agent | null; // The full Agent object being edited
    isSettingsModalOpen: boolean;
    isLoading: boolean;
    error: string | null;

    // --- Actions ---
    // Initialization
    loadAgents: (agents: Agent[]) => void;

    // Agent Manipulation
    addAgent: (newAgentData: AgentConfigFormData) => Promise<Agent | null>; // Returns created agent or null on failure
    updateAgent: (agentId: string, updatedAgentData: AgentUpdateFormData) => Promise<Agent | null>; // Returns updated agent or null
    deleteAgent: (agentId: string) => Promise<boolean>; // Returns true on success

    // UI State Management
    setActiveAgentId: (agentId: string | null) => void;
    openSettingsModal: (agentToEdit?: Agent) => void;
    closeSettingsModal: () => void;

    // Async operation status
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // (Optional) Purely frontend status updates if needed
    // setAgentDisplayStatus: (agentId: string, status: Agent['status']) => void;
}

// Dummy async function for simulating API calls
const simulateApiCall = (shouldSucceed: boolean = true, delay: number = 500) =>
    new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            if (shouldSucceed) {
                resolve();
            } else {
                reject(new Error("Simulated API Error"));
            }
        }, delay);
    });


export const useAgentStore = create<AgentState>()(
    immer((set, get) => ({
        // --- Initial State ---
        agentsList: [],
        activeAgentId: null,
        editingAgent: null,
        isSettingsModalOpen: false,
        isLoading: false,
        error: null,

        // --- Action Implementations ---
        loadAgents: (agents) => set(state => {
            state.agentsList = agents;
            if (!state.activeAgentId && agents.length > 0) {
                state.activeAgentId = agents[0].id;
            } else if (state.activeAgentId && !agents.find(a => a.id === state.activeAgentId)) {
                state.activeAgentId = agents.length > 0 ? agents[0].id : null;
            }
        }),

        setActiveAgentId: (agentId) => set(state => {
            state.activeAgentId = agentId;
        }),

        openSettingsModal: (agentToEdit) => set(state => {
            state.editingAgent = agentToEdit ? { ...agentToEdit } : null; // Store a copy for editing
            state.isSettingsModalOpen = true;
            state.error = null;
        }),

        closeSettingsModal: () => set(state => {
            state.isSettingsModalOpen = false;
            state.editingAgent = null;
        }),

        setLoading: (loading) => set(state => {
            state.isLoading = loading;
        }),

        setError: (error) => set(state => {
            state.error = error;
        }),

        addAgent: async (newAgentData) => {
            set(state => { state.isLoading = true; state.error = null; });
            try {
                await simulateApiCall(true);
                const newAgent: Agent = {
                    id: `agent_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`, // Temp ID
                    status: 'idle', // Default status
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    ...newAgentData, // Spread form data
                };
                set(state => {
                    state.agentsList.push(newAgent);
                    state.isLoading = false;
                    state.isSettingsModalOpen = false;
                });
                return newAgent;
            } catch (e: any) {
                set(state => { state.isLoading = false; state.error = e.message || "Failed to add agent"; });
                return null;
            }
        },

        updateAgent: async (agentId, updatedAgentData) => {
            set(state => { state.isLoading = true; state.error = null; });
            try {
                await simulateApiCall(true);
                let updatedAgent: Agent | null = null;
                set(state => {
                    const agentIndex = state.agentsList.findIndex(a => a.id === agentId);
                    if (agentIndex !== -1) {
                        state.agentsList[agentIndex] = {
                            ...state.agentsList[agentIndex],
                            ...updatedAgentData,
                            updatedAt: new Date().toISOString(),
                        };
                        updatedAgent = state.agentsList[agentIndex];
                    }
                    state.isLoading = false;
                    state.isSettingsModalOpen = false;
                });
                return updatedAgent;
            } catch (e: any) {
                set(state => { state.isLoading = false; state.error = e.message || "Failed to update agent"; });
                return null;
            }
        },

        deleteAgent: async (agentId) => {
            set(state => { state.isLoading = true; state.error = null; });
            try {
                await simulateApiCall(true);
                set(state => {
                    state.agentsList = state.agentsList.filter(a => a.id !== agentId);
                    if (state.activeAgentId === agentId) {
                        state.activeAgentId = state.agentsList.length > 0 ? state.agentsList[0].id : null;
                    }
                    state.isLoading = false;
                });
                return true;
            } catch (e: any) {
                set(state => { state.isLoading = false; state.error = e.message || "Failed to delete agent"; });
                return false;
            }
        },
    }))
);

// Example of how a component might use the store:
/*
import { useAgentStore, Agent } from './agentStore';

function MyComponent() {
    const agents = useAgentStore(state => state.agentsList);
    const activeAgentId = useAgentStore(state => state.activeAgentId);
    const addAgent = useAgentStore(state => state.addAgent);
    const setActiveAgentId = useAgentStore(state => state.setActiveAgentId);
    const isLoading = useAgentStore(state => state.isLoading);

    const currentActiveAgent = agents.find(agent => agent.id === activeAgentId);

    // ... component logic
}
*/

// It would also be beneficial to create a separate `src/types/agent.ts`
// to house the Agent, AgentConfigFormData, AgentContextScope interfaces
// for better organization and to avoid circular dependencies if other stores need these types.
// For example:
// export type { Agent, AgentConfigFormData, AgentContextScope } from './types/agent';
// And then import them here.
// But for this conceptual step, having them inline is acceptable.

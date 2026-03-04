'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// ─── Types ──────────────────────────────────────────
export type KioskView = 'home' | 'flow' | 'chat' | 'voice';

export type FlowType =
    | 'book-appointment'
    | 'find-doctor'
    | 'emergency'
    | 'ambulance'
    | 'health-packages'
    | 'hospital-services';

export interface FlowSelection {
    step: string;
    label: string;
    value: string;
    data?: any;
}

export interface FlowState {
    flowType: FlowType;
    step: number;
    selections: FlowSelection[];
}

export interface KioskState {
    view: KioskView;
    flow: FlowState | null;
    chatInitialMessage: string | null;
}

// ─── Actions ────────────────────────────────────────
type KioskAction =
    | { type: 'GO_HOME' }
    | { type: 'START_FLOW'; flowType: FlowType }
    | { type: 'FLOW_NEXT'; selection: FlowSelection }
    | { type: 'FLOW_BACK' }
    | { type: 'OPEN_CHAT'; initialMessage?: string }
    | { type: 'OPEN_VOICE' };

// ─── Reducer ────────────────────────────────────────
const initialState: KioskState = {
    view: 'home',
    flow: null,
    chatInitialMessage: null,
};

function kioskReducer(state: KioskState, action: KioskAction): KioskState {
    switch (action.type) {
        case 'GO_HOME':
            return { ...initialState };

        case 'START_FLOW':
            return {
                ...state,
                view: 'flow',
                flow: {
                    flowType: action.flowType,
                    step: 0,
                    selections: [],
                },
            };

        case 'FLOW_NEXT':
            if (!state.flow) return state;
            return {
                ...state,
                flow: {
                    ...state.flow,
                    step: state.flow.step + 1,
                    selections: [...state.flow.selections, action.selection],
                },
            };

        case 'FLOW_BACK':
            if (!state.flow) return state;
            if (state.flow.step === 0) {
                return { ...initialState };
            }
            return {
                ...state,
                flow: {
                    ...state.flow,
                    step: state.flow.step - 1,
                    selections: state.flow.selections.slice(0, -1),
                },
            };

        case 'OPEN_CHAT':
            return {
                ...state,
                view: 'chat',
                chatInitialMessage: action.initialMessage || null,
            };

        case 'OPEN_VOICE':
            return {
                ...state,
                view: 'voice',
            };

        default:
            return state;
    }
}

// ─── Context ────────────────────────────────────────
interface KioskContextValue {
    state: KioskState;
    goHome: () => void;
    startFlow: (flowType: FlowType) => void;
    flowNext: (selection: FlowSelection) => void;
    flowBack: () => void;
    openChat: (initialMessage?: string) => void;
    openVoice: () => void;
}

const KioskContext = createContext<KioskContextValue | null>(null);

export function KioskProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(kioskReducer, initialState);

    const goHome = useCallback(() => dispatch({ type: 'GO_HOME' }), []);
    const startFlow = useCallback((flowType: FlowType) => dispatch({ type: 'START_FLOW', flowType }), []);
    const flowNext = useCallback((selection: FlowSelection) => dispatch({ type: 'FLOW_NEXT', selection }), []);
    const flowBack = useCallback(() => dispatch({ type: 'FLOW_BACK' }), []);
    const openChat = useCallback((initialMessage?: string) => dispatch({ type: 'OPEN_CHAT', initialMessage }), []);
    const openVoice = useCallback(() => dispatch({ type: 'OPEN_VOICE' }), []);

    return (
        <KioskContext.Provider value= {{ state, goHome, startFlow, flowNext, flowBack, openChat, openVoice }
}>
    { children }
    </KioskContext.Provider>
    );
}

export function useKiosk() {
    const ctx = useContext(KioskContext);
    if (!ctx) throw new Error('useKiosk must be used within KioskProvider');
    return ctx;
}

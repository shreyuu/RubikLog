import React, { createContext, useReducer, useContext } from 'react';

const SolveContext = createContext();

const solveReducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_SOLVES':
            return { ...state, solves: action.payload, loading: false };
        case 'ADD_SOLVE':
            return { ...state, solves: [action.payload, ...state.solves] };
        case 'DELETE_SOLVE':
            return { ...state, solves: state.solves.filter(solve => solve.id !== action.payload) };
        default:
            return state;
    }
};

export const SolveProvider = ({ children }) => {
    const [state, dispatch] = useReducer(solveReducer, {
        solves: [],
        loading: true,
    });

    return (
        <SolveContext.Provider value={{ state, dispatch }}>
            {children}
        </SolveContext.Provider>
    );
};

export const useSolveContext = () => useContext(SolveContext);
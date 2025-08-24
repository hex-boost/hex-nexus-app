import { useReducer } from 'react';

// Step state
type Step = {
  label?: string;
  description?: string;
  isCompleted: boolean;
  isOptional: boolean;
};

// Reducer actions
type Action =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'complete' }
  | { type: 'reset' };

// Reducer function
function reducer(state: Step[], action: Action): Step[] {
  switch (action.type) {
    case 'next':
      return state.map((step, index, array) => {
        if (index === state.findIndex(s => !s.isCompleted)) {
          // Find the current active step and mark it as completed
          if (index < array.length - 1) {
            return { ...step, isCompleted: true };
          }
        }
        return step;
      });
    case 'prev':
      return state.map((step, index) => {
        // Find the last completed step and mark it as not completed
        if (index === state.findIndex(s => !s.isCompleted) - 1 && index >= 0) {
          return { ...step, isCompleted: false };
        }
        return step;
      });
    case 'complete':
      return state.map(step => ({ ...step, isCompleted: true }));
    case 'reset':
      return state.map(step => ({ ...step, isCompleted: false }));
    default:
      return state;
  }
}

export function useStepper(initialState: Step[]) {
  const [steps, dispatch] = useReducer(reducer, initialState);

  const activeStep = steps.findIndex(step => !step.isCompleted);
  const isLastStep = activeStep === steps.length - 1;

  return {
    steps,
    activeStep,
    isLastStep,
    nextStep: () => dispatch({ type: 'next' }),
    prevStep: () => dispatch({ type: 'prev' }),
    completeSteps: () => dispatch({ type: 'complete' }),
    resetSteps: () => dispatch({ type: 'reset' }),
  };
}

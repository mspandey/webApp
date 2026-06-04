import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadDraft, clearDraft } from "../features/pizzaSlice";

const DRAFT_KEY = "pizza_draft";

export function usePizzaDraft() {
  const dispatch = useDispatch();
  const pizzaState = useSelector((state) => state.pizza); // adjust selector if needed

  // Save to localStorage on every state change
  useEffect(() => {
    if (pizzaState.toppings?.length > 0 || pizzaState.size || pizzaState.crust) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(pizzaState));
    }
  }, [pizzaState]);

  // On mount: check for existing draft and prompt user
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      const resume = window.confirm("Resume your previous pizza creation?");
      if (resume) {
        dispatch(loadDraft(JSON.parse(saved)));
      } else {
        localStorage.removeItem(DRAFT_KEY);
        dispatch(clearDraft());
      }
    }
  }, []); // runs once on mount
}

export function clearPizzaDraft() {
  localStorage.removeItem(DRAFT_KEY);
}
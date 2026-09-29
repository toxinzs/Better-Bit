import { create } from "zustand";

// A tiny in-app navigation stack for BitLife-style drill-down menus: a hub
// row pushes a full menu screen, the back button pops it, and the tab bar
// resets to the tab's root. It lives outside the game store on purpose - it's
// pure UI state, never saved. On web it mirrors the browser history so the
// back button (and swipe-back) pops a menu instead of leaving the game.

export type MenuId =
  | "venues" | "lessons" | "health" | "dating" | "fertility" | "vacations" | "endroad" | "crime"
  | "car" | "home" | "loans" | "invest" | "retire"
  | "occupation" | "findwork" | "school"
  | "peopleGroup"
  | "profile" | "statDetail";

export type Route = { id: MenuId; params?: Record<string, string | number | undefined> };

type Nav = {
  stack: Route[];
  // a text thread being read (opened from a person's sheet)
  thread: string | null;
  setThread: (id: string | null) => void;
  push: (id: MenuId, params?: Route["params"]) => void;
  pop: () => void;
  reset: () => void;
};

const hasHistory = typeof window !== "undefined" && typeof window.history?.pushState === "function";
// popstate events caused by our own history.back()/go() calls, which must not pop twice
let ignorePops = 0;

export const useNav = create<Nav>((set, get) => ({
  stack: [],
  thread: null,
  setThread: (thread) => set({ thread }),
  push: (id, params) => {
    set({ stack: [...get().stack, { id, params }] });
    if (hasHistory) {
      try {
        window.history.pushState({ menu: get().stack.length }, "");
      } catch {
        // sandboxed frames can refuse history changes - the in-app back button still works
      }
    }
  },
  pop: () => {
    if (get().stack.length === 0) return;
    set({ stack: get().stack.slice(0, -1) });
    try {
      if (hasHistory && window.history.state && typeof window.history.state.menu === "number") {
        ignorePops += 1;
        window.history.back();
      }
    } catch {
      ignorePops = 0;
    }
  },
  reset: () => {
    const n = get().stack.length;
    if (n === 0) return;
    set({ stack: [] });
    try {
      if (hasHistory && window.history.state && typeof window.history.state.menu === "number") {
        ignorePops += 1;
        window.history.go(-n);
      }
    } catch {
      ignorePops = 0;
    }
  },
}));

if (hasHistory) {
  window.addEventListener("popstate", () => {
    if (ignorePops > 0) {
      ignorePops -= 1;
      return;
    }
    // the browser's own back button
    const { stack } = useNav.getState();
    if (stack.length > 0) useNav.setState({ stack: stack.slice(0, -1) });
  });
}

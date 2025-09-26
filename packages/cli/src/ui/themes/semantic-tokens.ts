/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { lightTheme, darkTheme, ansiTheme } from './theme.js';

export interface SemanticColors {
  text: {
    primary: string;
    secondary: string;
    link: string;
    accent: string;
    muted: string;
  };
  background: {
    primary: string;
    secondary: string;
    diff: {
      added: string;
      removed: string;
    };
  };
  border: {
    default: string;
    focused: string;
  };
  ui: {
    comment: string;
    symbol: string;
    gradient: string[] | undefined;
  };
  status: {
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  charts: {
    line: string;
    bar: string;
  };
}

export const lightSemanticColors: SemanticColors = {
  text: {
    primary: lightTheme.Foreground,
    secondary: lightTheme.Gray,
    link: lightTheme.AccentBlue,
    accent: lightTheme.AccentPurple,
    muted: lightTheme.Gray,
  },
  background: {
    primary: lightTheme.Background,
    secondary: lightTheme.Gray,
    diff: {
      added: lightTheme.DiffAdded,
      removed: lightTheme.DiffRemoved,
    },
  },
  border: {
    default: lightTheme.Gray,
    focused: lightTheme.AccentBlue,
  },
  ui: {
    comment: lightTheme.Comment,
    symbol: lightTheme.Gray,
    gradient: lightTheme.GradientColors,
  },
  status: {
    error: lightTheme.AccentRed,
    success: lightTheme.AccentGreen,
    warning: lightTheme.AccentYellow,
    info: lightTheme.AccentBlue,
  },
  charts: {
    line: lightTheme.AccentCyan,
    bar: lightTheme.AccentPurple,
  },
};

export const darkSemanticColors: SemanticColors = {
  text: {
    primary: darkTheme.Foreground,
    secondary: darkTheme.Gray,
    link: darkTheme.AccentBlue,
    accent: darkTheme.AccentPurple,
    muted: darkTheme.Gray,
  },
  background: {
    primary: darkTheme.Background,
    secondary: darkTheme.Gray,
    diff: {
      added: darkTheme.DiffAdded,
      removed: darkTheme.DiffRemoved,
    },
  },
  border: {
    default: darkTheme.Gray,
    focused: darkTheme.AccentBlue,
  },
  ui: {
    comment: darkTheme.Comment,
    symbol: darkTheme.Gray,
    gradient: darkTheme.GradientColors,
  },
  status: {
    error: darkTheme.AccentRed,
    success: darkTheme.AccentGreen,
    warning: darkTheme.AccentYellow,
    info: darkTheme.AccentBlue,
  },
  charts: {
    line: darkTheme.AccentCyan,
    bar: darkTheme.AccentPurple,
  },
};

export const ansiSemanticColors: SemanticColors = {
  text: {
    primary: ansiTheme.Foreground,
    secondary: ansiTheme.Gray,
    link: ansiTheme.AccentBlue,
    accent: ansiTheme.AccentPurple,
    muted: ansiTheme.Gray,
  },
  background: {
    primary: ansiTheme.Background,
    secondary: ansiTheme.Gray,
    diff: {
      added: ansiTheme.DiffAdded,
      removed: ansiTheme.DiffRemoved,
    },
  },
  border: {
    default: ansiTheme.Gray,
    focused: ansiTheme.AccentBlue,
  },
  ui: {
    comment: ansiTheme.Comment,
    symbol: ansiTheme.Gray,
    gradient: ansiTheme.GradientColors,
  },
  status: {
    error: ansiTheme.AccentRed,
    success: ansiTheme.AccentGreen,
    warning: ansiTheme.AccentYellow,
    info: ansiTheme.AccentBlue,
  },
  charts: {
    line: ansiTheme.AccentCyan,
    bar: ansiTheme.AccentPurple,
  },
};

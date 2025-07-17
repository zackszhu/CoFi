// src/lib/constants.ts

// This file should only contain truly static constants safe for both client and server.
// Dynamically loaded configurations (like categories from cofi.config.yaml)
// should be fetched server-side and passed to client components as props.

export const PREDEFINED_CATEGORIES: string[] = [];

// We will adjust components that use PREDEFINED_CATEGORIES
// to receive them from server components later.

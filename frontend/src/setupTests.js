
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Polyfills for React Router v7 in the Jest environment.
Object.defineProperty(global, "TextEncoder", {
  value: TextEncoder,
  writable: true,
  configurable: true,
});

Object.defineProperty(global, "TextDecoder", {
  value: TextDecoder,
  writable: true,
  configurable: true,
});

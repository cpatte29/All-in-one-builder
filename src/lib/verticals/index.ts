// Public barrel for the Vertical Profile Engine. Engines import from here
// (never from registry.ts/types.ts directly) so that loading this module is
// guaranteed to also load every registered profile below.
export * from "./types";
export * from "./registry";

// Production vertical profiles register themselves as a side effect of
// being imported (Platform Constitution, Article V — No Speculative
// Build: dental is the one real vertical; nothing else registers here
// until a second vertical is a real business decision).
import "./dental";

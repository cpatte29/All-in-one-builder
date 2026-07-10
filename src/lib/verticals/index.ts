// Public barrel for the Vertical Profile Engine. Engines import from here
// (never from registry.ts/types.ts directly) so that loading this module is
// guaranteed to also load every registered profile below.
export * from "./types";
export * from "./registry";

// Production vertical profiles register themselves as a side effect of
// being imported. This list is intentionally empty until a profile packet
// lands (Platform Constitution, Article V — No Speculative Build).
//
// import "./<profile-module>";

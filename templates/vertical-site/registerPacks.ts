// Registers every content pack this deployment ships with. Lives outside
// src/ deliberately — src/ is the base and must stay grep-clean of any
// specific vertical's name (Platform Constitution, Article IV). Swapping
// verticals means editing this one import list, never base code.
import "./packs/dental/pack";

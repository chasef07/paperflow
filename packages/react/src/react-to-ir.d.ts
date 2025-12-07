/**
 * React to IR Converter
 *
 * Converts a React element tree into the PaperSend Intermediate Representation.
 * This is the bridge between React components and the rendering engines.
 */
import { type ReactElement } from 'react';
import { type IRDocument } from '@papersend/core';
/**
 * Convert a React element tree to IR document
 */
export declare function reactToIR(element: ReactElement): Promise<IRDocument>;
//# sourceMappingURL=react-to-ir.d.ts.map
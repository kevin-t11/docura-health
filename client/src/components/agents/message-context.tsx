'use client';

/** Share message alignment with nested bubble components. */
import { createContext } from 'react';

export type MessageSide = 'start' | 'end';

export const MessageSideContext = createContext<MessageSide | undefined>(undefined);

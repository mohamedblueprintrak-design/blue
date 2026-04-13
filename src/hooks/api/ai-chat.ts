/**
 * AI Chat API hooks
 * Uses /api/ai/chat endpoint
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';

export function useAIChat() {
  const _isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useMutation({
    mutationFn: async (data: {
      message?: string;
      model?: string;
      history?: Array<{ role: string; content: string }>;
      skill?: string;
      skillParams?: Record<string, unknown>;
      pageContext?: string;
      contextType?: 'project' | 'mun' | 'financial' | 'overdue' | undefined;
    }) => {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });
}

import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';
import React from 'react';
import { vi, describe, it, expect } from 'vitest';

const ToastConsumer = ({ onRender }: { onRender: () => void }) => {
  useToast(); // Consumes context
  onRender();
  return <div>Consumer</div>;
};

const ToastTrigger = () => {
  const { show } = useToast();
  return <button onClick={() => show('test')}>Show</button>;
};

describe('Toast Performance', () => {
  it('consumers do not re-render when a toast is shown', async () => {
    const onRender = vi.fn();

    render(
      <ToastProvider>
        <ToastConsumer onRender={onRender} />
        <ToastTrigger />
      </ToastProvider>
    );

    // Initial render
    expect(onRender).toHaveBeenCalledTimes(1);

    // Trigger toast
    await act(async () => {
      screen.getByText('Show').click();
    });

    // Wait for toast to appear in DOM (ensures state update happened)
    await screen.findByText('test');

    // Without memoization, context value changes, causing consumer to re-render.
    // So current expectation (fail) is 2.
    // Goal expectation (pass) is 1.

    // Expect render count to remain 1 (no re-render for consumer)
    expect(onRender).toHaveBeenCalledTimes(1);
  });
});

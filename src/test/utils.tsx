import React, { ReactElement } from 'react';
import { render, renderHook, RenderOptions, RenderHookOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { WorkspaceProvider } from '../contexts/WorkspaceContext';

import { ToastProvider } from '../components/Toast';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AuthProvider>
                    <WorkspaceProvider>
                        {children}
                    </WorkspaceProvider>
                </AuthProvider>
            </ToastProvider>
        </BrowserRouter>
    );
};

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

const customRenderHook = <Result, Props>(
    render: (initialProps: Props) => Result,
    options?: Omit<RenderHookOptions<Props>, 'wrapper'>,
) => renderHook(render, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render, customRenderHook as renderHook };

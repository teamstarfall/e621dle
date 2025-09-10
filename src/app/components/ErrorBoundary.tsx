"use client";

import React from "react";
import { ErrorBoundaryProps, ErrorBoundaryState } from "../interfaces";

export default class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    state = {
        error: null,
        didThrow: false,
    };

    componentDidCatch(error: Error): void {
        this.setState({
            didThrow: true,
            error: error,
        });
    }

    render(): React.ReactNode {
        if (this.state.didThrow) {
            return this.props.fallback;
        }

        return this.props.children;
    }
}

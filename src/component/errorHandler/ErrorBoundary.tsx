import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { sessionError } from '../../services/SessionEventService';

interface Props {
    children: ReactNode;
}
interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Log to remote server or console
        sessionError({
            name: error.name,
            message: error.message,
            stack_trace: info.componentStack,
            context: {
                cause: error.cause
            }
        })

    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Une erreur est survenue</Text>
                    <Text style={styles.message}>{this.state.error?.message}</Text>
                    <Text style={styles.message}>Veuillez réessayer plus tard.</Text>
                </View>
            );
        }
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    message: { fontSize: 16, color: '#888' },
});

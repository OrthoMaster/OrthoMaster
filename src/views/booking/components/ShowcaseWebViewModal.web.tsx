import React from 'react';

interface ShowcaseWebViewModalProps {
  visible: boolean;
  url: string | null;
  onClose: () => void;
}

/**
 * Sur le web, la page vitrine s'ouvre dans un nouvel onglet, directement depuis le clic
 * (ExpertiseHomeView) : ouvert depuis un effet, le navigateur bloquerait la fenêtre.
 * Ce fichier évite aussi d'embarquer react-native-webview dans le bundle web.
 */
export const ShowcaseWebViewModal: React.FC<ShowcaseWebViewModalProps> = () => null;
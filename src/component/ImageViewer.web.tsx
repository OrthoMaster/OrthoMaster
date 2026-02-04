import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Modal, StyleSheet, TouchableOpacity } from 'react-native';

export const ImageViewer = ({ url, visible, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent={true}
      animationType="fade"
    >
      <div style={styles.overlay}>
        <div style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          <img
            src={url}
            alt="Full size"
            style={styles.image}
          />
        </div>
      </div>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    width: 50,
    height: 50,
    position: 'absolute',
    top: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    cursor: 'pointer',
    zIndex: 10,
  },
  closeIcon: {
    width: '50%',
    height: '50%',
    objectFit: 'contain',
  },
  image: {
    maxWidth: '90%',
    maxHeight: '90%',
    objectFit: 'contain',
  },
});
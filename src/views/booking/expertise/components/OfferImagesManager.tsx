import React, { useEffect, useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NestableDraggableFlatList, RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import {
  BookingOfferImage,
  ExpertBookingSetup,
  deleteMyOfferImage,
  reorderMyOfferImages,
  updateMyOfferImage,
} from '../../../../services/v2/BookingService';
import { confirmAction, notify } from '../../bookingActions';

const THUMB_WIDTH = 72;
const THUMB_HEIGHT = 54;

interface OfferImagesManagerProps {
  offerId: number;
  images: BookingOfferImage[];
  maxImages: number;
  captionMax: number;
  /** Écrit l'état complet renvoyé par le serveur dans le cache partagé. */
  onApply: (setup: ExpertBookingSetup) => void;
}

/**
 * Illustrations d'un thème, dans le formulaire de l'offre.
 * L'ajout se fait depuis le CMS (pas de sélecteur d'images dans l'application) ;
 * ici l'expert réordonne (appui long puis glisser), légende et supprime.
 * Chaque changement est enregistré tout de suite, indépendamment du bouton « Enregistrer ».
 * À placer dans un NestableScrollContainer.
 */
export const OfferImagesManager: React.FC<OfferImagesManagerProps> = ({
  offerId,
  images,
  maxImages,
  captionMax,
  onApply,
}) => {
  // Copie locale : l'ordre change à l'écran dès le lâcher, sans attendre le serveur.
  const [items, setItems] = useState(images);
  const [captions, setCaptions] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    setItems(images);
  }, [images]);

  const fail = (message: string | null) =>
    notify('Enregistrement impossible', message ?? 'Vérifiez votre connexion puis réessayez.');

  const reorder = async (next: BookingOfferImage[]) => {
    const previous = items;
    setItems(next);
    const result = await reorderMyOfferImages(offerId, next.map((image) => image.id));
    if (result.ok === false) {
      setItems(previous);
      fail(result.message);
      return;
    }
    onApply(result.data);
  };

  const saveCaption = async (image: BookingOfferImage) => {
    const draft = captions[image.id];
    if (draft === undefined || draft.trim() === (image.caption ?? '')) return;

    setBusyId(image.id);
    const result = await updateMyOfferImage(offerId, image.id, draft.trim() || null);
    setBusyId(null);
    if (result.ok === false) {
      fail(result.message);
      return;
    }
    setCaptions(({ [image.id]: _, ...rest }) => rest);
    onApply(result.data);
  };

  const remove = (image: BookingOfferImage) => {
    // confirm du navigateur sur le web (Alert.alert y est sans effet).
    confirmAction(
      'Supprimer cette image ?',
      'Elle ne sera plus visible sur la fiche du thème.',
      'Supprimer',
      async () => {
        setBusyId(image.id);
        const result = await deleteMyOfferImage(offerId, image.id);
        setBusyId(null);
        if (result.ok === false) {
          fail(result.message);
          return;
        }
        onApply(result.data);
      },
      { destructive: true }
    );
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<BookingOfferImage>) => {
    const busy = busyId === item.id;
    return (
      <ScaleDecorator activeScale={1.03}>
        <View style={[styles.row, isActive && styles.rowActive]}>
          <TouchableOpacity
            onLongPress={drag}
            delayLongPress={180}
            disabled={isActive || busy}
            style={styles.handle}
            accessibilityLabel="Maintenir puis glisser pour déplacer"
          >
            <MaterialCommunityIcons name="drag-vertical" size={22} color={Colors.subtext} />
          </TouchableOpacity>

          <View style={styles.thumb}>
            <Image source={{ uri: item.url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <Text style={styles.rank}>{(getIndex() ?? 0) + 1}</Text>
          </View>

          <TextInput
            style={styles.caption}
            value={captions[item.id] ?? item.caption ?? ''}
            onChangeText={(value) => setCaptions((current) => ({ ...current, [item.id]: value }))}
            onEndEditing={() => saveCaption(item)}
            placeholder="Légende (facultatif)"
            placeholderTextColor={Colors.subtext}
            maxLength={captionMax}
            returnKeyType="done"
            editable={!busy}
          />

          {busy ? (
            <ActivityIndicator size="small" color={Colors.lblue} style={styles.remove} />
          ) : (
            <TouchableOpacity style={styles.remove} onPress={() => remove(item)} hitSlop={8} accessibilityLabel="Supprimer l'image">
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.label}>Images</Text>
        <Text style={styles.count}>
          {items.length} / {maxImages}
        </Text>
      </View>

      {items.length > 0 ? (
        <NestableDraggableFlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          onDragEnd={({ data }) => reorder(data)}
          activationDistance={8}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={22} color={Colors.subtext} />
          <Text style={styles.emptyText}>Aucune image pour ce thème.</Text>
        </View>
      )}

      <Text style={styles.hint}>
        {items.length > 1 ? 'Maintenez la poignée puis glissez pour changer l’ordre. ' : ''}
        Pour ajouter des images, envoyez-les à l'équipe OrthoMaster : elles apparaîtront ici.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: Spacings.xs,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  count: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.xs,
    marginBottom: Spacings.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  rowActive: {
    borderColor: Colors.lblue,
    shadowColor: Colors.lblueDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  handle: {
    paddingVertical: Spacings.xs,
  },
  thumb: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.grayLight,
  },
  rank: {
    position: 'absolute',
    top: 3,
    left: 3,
    minWidth: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    color: Colors.white,
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    textAlign: 'center',
  },
  caption: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.text,
    paddingVertical: Spacings.xs,
  },
  remove: {
    width: 32,
    alignItems: 'center',
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    padding: Spacings.md,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.subtext,
  },
  hint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.subtext,
  },
});
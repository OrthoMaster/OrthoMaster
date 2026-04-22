import React, { useEffect, useState } from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
  TouchableWithoutFeedback
} from "react-native";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from "expo";
import { Ionicons, AntDesign } from '@expo/vector-icons';

import { hmsToMilliseconds } from "../../../futils";
import { IVASTObject } from "../../../utils/interfaces";
import { constructVASTObjectWithUrlFromAdButler, saveVastEvent } from "../../../utils/vastTools";
import { useMutation } from "@tanstack/react-query";
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useGetUser } from "../../../hooks/useGetUser.hook";

import Colors from "../../../../constants/Colors";
import Spacings from "../../../../constants/Spacings";

import { sendInterestToAdvertiser } from "../../../services/v2/ToolService";

const { width: screenWidth, height } = Dimensions.get("screen")

type AdServingModalMediaAccessProps = {
  enabled: boolean
  onClose: () => void;
  grantAccess: () => void;
  closable?: boolean // Show close button
}

type AdCardProps = {
  vastObj: IVASTObject,
  onSelect: (vast: IVASTObject) => void
}

const InterestModal: React.FC<{ visible: boolean; onClose: () => any; vast: IVASTObject }> = ({ visible, onClose, vast }) => {
  const sendInterest = useMutation({
    mutationKey: ["Ad-interest", vast.adTitle],
    mutationFn: sendInterestToAdvertiser,
    onSuccess: data => {
      setIsSent(true)
    },
    onError: (e) => {
      setIsError(true)
    }
  })
  const [isSent, setIsSent] = useState(false)
  const [isError, setIsError] = useState(false)

  const send = () => {
    sendInterest.mutate({
      destEmail: vast.interestEmail,
      adTitle: vast.adTitle
    })
  }

  useEffect(() => {
    if (isSent)
      setTimeout(() => {
        setIsSent(false)
        onClose()
      }, 3000)
  }, [isSent])


  return <Modal
    animationType="slide"
    transparent={true}
    visible={visible}>
    <TouchableWithoutFeedback
      onPress={() => {
        setIsError(false)
        setIsSent(false)
        onClose()
      }}>
      <View style={{ backgroundColor: "rgba(0,0,0,0.9)", position: 'absolute', width: '100%', height: "100%" }} />
    </TouchableWithoutFeedback>
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: Spacings.md }}>
      <View style={{ backgroundColor: Colors.white, borderRadius: 16, padding: Spacings.lg, justifyContent: 'center' }}>
        <View>
          <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: Colors.text }}>Merci pour votre intérêt !</Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: Colors.subtext, marginTop: Spacings.sm }}>Afin d'être contacté par l'annonceur, nous lui communiquerons les informations suivantes relatives à votre compte :</Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: Colors.text, marginTop: Spacings.sm, paddingLeft: Spacings.lg }}>
            • Nom Prénom{'\n'}
            • Email{'\n'}
            • Fonction professionnelle
          </Text>

          <View style={{ flexDirection: 'row', marginTop: Spacings.lg, width: '100%', gap: Spacings.md }}>
            <TouchableOpacity
              style={{
                flex: 1, alignItems: 'center', justifyContent: 'center',
                paddingVertical: Spacings.xs, borderRadius: 6, backgroundColor: Colors.primary
              }}
              onPress={send}>
              {sendInterest.isPending
                ? <ActivityIndicator />
                : <Text style={{
                  color: Colors.white,
                  textAlign: 'center',
                  fontFamily: 'Poppins-Medium',
                  fontSize: 12
                }}>
                  Je confirme
                </Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1, alignItems: 'center', justifyContent: 'center',
                paddingVertical: Spacings.xs, borderRadius: 6, borderWidth: 2, borderColor: Colors.primary
              }}
              onPress={onClose}
            >
              <Text style={{
                color: Colors.primary,
                textAlign: 'center',
                fontFamily: 'Poppins-Medium',
                fontSize: 12
              }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
        {
          (isSent || isError) &&
          <View style={{
            position: 'absolute',
            backgroundColor: Colors.white,
            height: '100%',
            width: '100%',
            alignItems: 'center', justifyContent: "center",
            alignSelf: 'center',
          }}>
            {
              isError &&
              <AntDesign name="exclamation-circle" size={70} color={Colors.danger} />
            }
            {
              isSent &&
              <AntDesign name="check-circle" size={70} color={Colors.success} />
            }

            <Text style={{
              fontSize: 22,
              fontFamily: 'Poppins-Medium',
              marginTop: 10
            }}>
              {isSent && "Envoyé"}
              {isError && "Une erreur s'est produite"}
            </Text>
            {
              isError &&
              <TouchableOpacity style={{
                backgroundColor: '#ffaf31',
                padding: 10,
                borderRadius: 5,
                marginTop: 20
              }}
                onPress={send}
              >
                {
                  sendInterest.isPending ?
                    <ActivityIndicator />
                    :
                    <Text>Réessayer</Text>
                }
              </TouchableOpacity>
            }
          </View>
        }
      </View>
    </View>
  </Modal>
}

const DisplayAdModal: React.FC<{ vast: IVASTObject, onAccess: () => any }> = ({ vast, onAccess }) => {
  const { data: user, ...userQuery } = useGetUser();
  const player = useVideoPlayer(vast?.linearMedia?.mediaFiles[0], player => {
    player.loop = false;
    player.currentTime = 0;
    player.timeUpdateEventInterval = 1;
  });
  const [savedEvents, setSavedEvents] = useState([])
  const [currentTime, setCurrentTime] = useState(0); // en ms
  const [duration, setDuration] = useState(0); // en ms
  const [isComplete, setIsComplete] = useState(false)
  const [showInterestModal, setShowInterestModal] = useState(false)
  const [skipLimit, setSkipLimit] = useState(0)
  const [showSkipBtn, setShowSkipBtn] = useState(false)

  const width = useSharedValue(screenWidth / 3);
  const height = useSharedValue((screenWidth / 3) * 9 / 16);
  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const onSkip = () => {
    setSavedEvents([...savedEvents, "skip"])
    saveVastEvent(vast.linearMedia.trackingEvents["skip"])
    player.pause()
    player.currentTime = 0
    onAccess()
  }
  const openInterestModal = (status: boolean) => {
    if (status) {
      saveVastEvent(vast.linearMedia.clickTracking)
      setSavedEvents([...savedEvents, "ClickTracking"])

      player.pause()
      setShowInterestModal(true)
    } else {
      setShowInterestModal(false)
    }
  }

  useEffect(() => {
    if (vast) {
      if (vast.linearMedia.duration)
        setDuration(hmsToMilliseconds(vast.linearMedia.duration))
      if (vast.linearMedia.skipOffset)
        setSkipLimit(hmsToMilliseconds(vast.linearMedia.skipOffset))
      player.play()
      saveVastEvent(vast.linearMedia.trackingEvents["start"])
      saveVastEvent(vast.impressions[0])
      setSavedEvents(["start", "impression"])

      width.value = withSpring(screenWidth * 0.9, { duration: 2000, dampingRatio: 1 });
      height.value = withSpring((screenWidth * 0.9) * 9 / 16, { duration: 2000, dampingRatio: 1 });
    }
  }, [vast])

  useEventListener(player, "timeUpdate", (payload) => {
    const curT = Math.round(payload.currentTime) * 1000
    const videoProgress = curT / duration

    switch (true) {
      case (videoProgress >= 0.25 && videoProgress < 0.5 && !savedEvents.includes("FirstQuartile")):

        setSavedEvents([...savedEvents, "FirstQuartile"])
        saveVastEvent(vast.linearMedia.trackingEvents["firstQuartile"])
        break;
      case (videoProgress >= 0.5 && videoProgress < 0.75 && !savedEvents.includes("MidPoint")):
        setSavedEvents([...savedEvents, "MidPoint"])
        saveVastEvent(vast.linearMedia.trackingEvents["midpoint"])
        break;
      case (videoProgress >= 0.75 && !savedEvents.includes("ThirdQuartile")):
        setSavedEvents([...savedEvents, "ThirdQuartile"])
        saveVastEvent(vast.linearMedia.trackingEvents["thirdQuartile"])
        break;
      default:
        break;
    }

    if ((skipLimit > 0 && curT > skipLimit) || user?.closable_ads) {
      setShowSkipBtn(true)
    }

    setCurrentTime(curT);
  });
  useEventListener(player, "playToEnd", () => {
    saveVastEvent(vast.linearMedia.trackingEvents["complete"])
    setSavedEvents([...savedEvents, "complete"])
    setIsComplete(true)
    setShowSkipBtn(false)
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={vast !== null}
    >
      <View style={{ flex: 1, justifyContent: "center", padding: Spacings.md, backgroundColor: "rgba(0,0,0,0.95)" }}>
        <Text style={{ fontSize: 14, color: Colors.white, fontFamily: 'Poppins-Bold' }}>{vast?.adAdviser}</Text>
        <Text style={{ fontSize: 10, color: Colors.white, fontFamily: 'Roboto', marginBottom: Spacings.sm }}>{vast?.adTitle}</Text>
        <Animated.View style={{ width, height }}>
          <VideoView
            style={{
              width: screenWidth - 2 * Spacings.md,
              height: (screenWidth - 2 * Spacings.md) * 9 / 16,
            }}
            contentFit="contain"
            player={player}
            allowsPictureInPicture={false}
            allowsVideoFrameAnalysis={false}
            nativeControls={false}
          />
          <View style={{
            backgroundColor: "rgba(0,0,0,0.4)",
            position: 'absolute',
            right: 0,
            bottom: 0,
            padding: Spacings.xs,
          }}>
            <Text style={{
              color: Colors.white,
              fontSize: 12,
              fontFamily: 'Poppins-Medium'
            }}>{formatTime(currentTime)} / {formatTime(duration)}</Text>
          </View>
          {
            showSkipBtn &&
            <TouchableOpacity style={{
              backgroundColor: "rgba(0,0,0,0.7)",
              position: 'absolute',
              right: 0,
              bottom: 50,
              paddingHorizontal: 15, paddingVertical: 5,
              flexDirection: 'row',
              alignItems: 'center', justifyContent: 'center'
            }} onPress={onSkip}>
              <Text style={{ color: Colors.white, fontFamily: 'Poppins-Medium', fontSize: 12 }}>Passer</Text>
              <Ionicons style={{ marginLeft: Spacings.xs }} name="play-skip-forward" size={15} color={Colors.white} />
            </TouchableOpacity>
          }
        </Animated.View>
        <TouchableOpacity style={{
          alignSelf: 'center',
          borderRadius: 6,
          marginTop: Spacings.lg,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: Spacings.sm,
          paddingHorizontal: Spacings.lg,
          borderWidth: 2,
          borderColor: Colors.white,
          flexDirection: 'row',
          gap: Spacings.xs,
        }} onPress={() => openInterestModal(true)}>
          <Ionicons name="heart" size={30} color={Colors.primary} />
          <View>
            <Text style={{ fontSize: 10, color: Colors.white, fontFamily: 'Poppins-Medium' }}>Ça m'intéresse</Text>
            <Text style={{ fontSize: 10, color: Colors.primary, fontFamily: 'Poppins-Bold' }}>Contactez-moi !</Text>
          </View>
        </TouchableOpacity>
        {
          isComplete &&
          <TouchableOpacity style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            bottom: 120,
            right: Spacings.lg,
          }}
            onPress={onAccess}
          >
            <Text style={{
              color: Colors.white,
              fontFamily: 'Poppins-Medium',
              fontSize: 12
            }}>Accéder au contenu</Text>
            <Ionicons style={{ marginLeft: Spacings.xxs }} name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        }
      </View>
      <InterestModal visible={showInterestModal} onClose={() => {
        if (!isComplete)
          player.play()
        openInterestModal(false)
      }} vast={vast} />
    </Modal>
  )
}

const AdCard: React.FC<AdCardProps> = ({ vastObj, onSelect }) => {
  const [image, setImage] = useState(null);
  const generateThumbnail = async () => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        vastObj.linearMedia.mediaFiles[0], { time: 0, }
      );
      setImage(uri);
    } catch (e) { }
  };
  useEffect(() => {
    generateThumbnail()
  }, [])

  return <TouchableOpacity
    style={{
      backgroundColor: Colors.white,
      width: (screenWidth - (5 * Spacings.md)) / 2,
      borderRadius: 6,
      shadowOffset: {
        width: 0, height: 4
      },
      shadowRadius: 2,
      shadowOpacity: 0.1,
      shadowColor: Colors.text
    }}
    onPress={() => {
      onSelect(vastObj)
    }}
  >
    <Image
      source={{ uri: image }}
      resizeMode="cover"
      style={{
        width: "100%",
        height: (screenWidth / 2.5) * 9 / 16,
        objectFit: 'cover',
        borderTopRightRadius: 6,
        borderTopLeftRadius: 6,
      }}
    />
    <Text style={styles.adsTitle} numberOfLines={1} ellipsizeMode="tail">{vastObj.adAdviser}</Text>
    <Text style={styles.adsDescription} numberOfLines={2} ellipsizeMode="tail">{vastObj.adTitle?.trim()}</Text>
  </TouchableOpacity>
}

export const AdServingModalMediaAccess: React.FC<AdServingModalMediaAccessProps> = ({ enabled, onClose, grantAccess, closable = true }) => {
  const [vastArray, setVastArray] = useState<IVASTObject[]>([])
  const [selectedVAST, setSelectedVAST] = useState<IVASTObject>(null)

  const { data: user, ...userQuery } = useGetUser();

  const vastsArrayUrl: string[] = [
    "https://servedbyadbutler.com/vast.spark?setID=63510&ID=188636&pageid=123456&_abdk[Job Function]=" + user?.job_function,
    "https://servedbyadbutler.com/vast.spark?setID=63510&ID=188636&pageid=123456&_abdk[Job Function]=" + user?.job_function,
    "https://servedbyadbutler.com/vast.spark?setID=63510&ID=188636&pageid=123456&_abdk[Job Function]=" + user?.job_function,
    "https://servedbyadbutler.com/vast.spark?setID=63510&ID=188636&pageid=123456&_abdk[Job Function]=" + user?.job_function,
  ]

  const initVastArray = async (urlArray: string[]): Promise<IVASTObject[]> => {
    let vastObjArray: IVASTObject[] = [];
    for await (const vasturl of urlArray) {
      let vastObj = await constructVASTObjectWithUrlFromAdButler(vasturl);

      if (vastObjArray.findIndex(v => v.adTitle === vastObj.adTitle) !== -1) { //VAST OBJ ALREADY EXISTS
        var i = 0;
        while (i < 5) { // 3 try
          i++;
          vastObj = await constructVASTObjectWithUrlFromAdButler(vasturl);
          if (vastObjArray.findIndex(v => v.adTitle === vastObj.adTitle) === -1) { //VAST OBJ NOT EXISTS
            break;
          }
        }
      }
      if (!vastObj) { // OBJ Not created
        continue;
      }
      if (vastArray.length < 4) {
        setVastArray(prev => [...prev, vastObj]);
      }
      vastObjArray.push(vastObj);
    }
    return vastObjArray;
  }

  useEffect(() => {
    if (enabled) {
      initVastArray(vastsArrayUrl).then((vasts) => {
        if (vasts.length === 0)
          grantAccess()
      });
    }
  }, [enabled])

  if (!enabled) { return null; }

  if (vastArray.length > 0) {
    return (
      <Modal animationType="slide"
        transparent={true}
        visible={true}
        onRequestClose={() => { closable && onClose() }}>
        {!selectedVAST &&
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.headerText}>Pour accéder à ce contenu, choisissez une communication de l'un de nos partenaires.</Text>
              <View style={styles.body}>
                {vastArray.map((value, index) => {
                  if (value.linearMedia)
                    return <AdCard
                      key={index + "ad-card"}
                      vastObj={value}
                      onSelect={(vastObj) => {
                        setSelectedVAST(vastObj);
                      }}
                    />
                })}
              </View>

              {closable &&
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Fermer</Text>
                </TouchableOpacity>
              }
            </View>
          </View>
        }
        {selectedVAST &&
          <DisplayAdModal
            vast={selectedVAST}
            onAccess={() => {
              setSelectedVAST(null)
              grantAccess()
            }}
          />
        }
      </Modal>
    )
  }

  return null;
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: Spacings.md,
  },
  modalContainer: {
    backgroundColor: Colors.grayLight,
    borderRadius: 16,
    padding: Spacings.md
  },
  body: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: 'center',
    width: '100%',
    gap: Spacings.md
  },
  headerText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    color: Colors.text
  },
  adsTitle: {
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
    paddingHorizontal: Spacings.xs,
    marginTop: Spacings.xs,
  },
  adsDescription: {
    fontSize: 9,
    fontFamily: 'Roboto',
    color: Colors.subtext2,
    paddingHorizontal: Spacings.xs,
    marginBottom: Spacings.xs,
  },

  cancelButton: {
    alignSelf: 'center',
    paddingVertical: Spacings.xxs,
    paddingHorizontal: Spacings.md,
    borderRadius: 6,
    marginTop: Spacings.lg,
    borderWidth: 2,
    borderColor: Colors.primary
  },
  cancelButtonText: {
    color: Colors.primary,
    textAlign: 'center',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  }

});

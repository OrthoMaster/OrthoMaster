import React, { useEffect, useState } from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableWithoutFeedback,
  useWindowDimensions
} from "react-native";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import { Ionicons, AntDesign } from '@expo/vector-icons';

import { hmsToMilliseconds } from "../../../futils";
import { IVASTObject } from "../../../utils/interfaces";
import { constructVASTObjectWithUrlFromAdButler, saveVastEvent } from "../../../utils/vastTools";
import { useMutation } from "@tanstack/react-query";
import { useGetUser } from "../../../hooks/useGetUser.hook";
import { sendInterestToAdvertiser } from "../../../services/v2/ToolService";

import Colors from "../../../../constants/Colors";
import Spacings from "../../../../constants/Spacings";

type AdServingModalMediaAccessProps = {
  enabled: boolean
  onClose: () => void;
  grantAccess: () => void;
  closable?: boolean
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
      }, 2000)
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
        {
          (isSent || isError) &&
          <View style={{
            position: 'absolute',
            backgroundColor: '#fff',
            width: "100%", height: "100%",
            alignItems: 'center', justifyContent: "center"
          }}>
            {
              isError &&
              <AntDesign name="exclamation-circle" size={70} color="#F25151" />
            }
            {
              isSent &&
              <AntDesign name="check-circle" size={70} color="#6AF28E" />
            }

            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
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
  const { data: user, ...userQuery } = useGetUser()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [savedEvents, setSavedEvents] = useState([])
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [skipLimit, setSkipLimit] = useState(0);
  const [showSkipBtn, setShowSkipBtn] = useState(false);

  const targetHeight = screenHeight * 0.5;
  const targetWidth = targetHeight * 16 / 9;

  const initialHeight = screenHeight * 0.25;
  const initialWidth = initialHeight * 16 / 9;

  const width = useSharedValue(initialWidth);
  const height = useSharedValue(initialHeight);

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const onSkip = () => {
    setSavedEvents([...savedEvents, "skip"])
    saveVastEvent(vast.linearMedia.trackingEvents["skip"])
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    onAccess()
  }

  const openInterestModal = (status: boolean) => {
    if (status) {
      saveVastEvent(vast.linearMedia.clickTracking)
      setSavedEvents([...savedEvents, "ClickTracking"])
      if (videoRef.current) {
        videoRef.current.pause();
      }
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

      if (videoRef.current) {
        videoRef.current.play();
      }

      saveVastEvent(vast.linearMedia.trackingEvents["start"])
      saveVastEvent(vast.impressions[0])
      setSavedEvents(["start", "impression"])

      width.value = withSpring(targetWidth, { duration: 2000, dampingRatio: 1 });
      height.value = withSpring(targetHeight, { duration: 2000, dampingRatio: 1 });
    }
  }, [vast])

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const curT = Math.round(videoRef.current.currentTime) * 1000;
      const videoProgress = curT / duration;

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
        setShowSkipBtn(true);
      }

      setCurrentTime(curT);
    }
  };

  const handleEnded = () => {
    saveVastEvent(vast.linearMedia.trackingEvents["complete"])
    setSavedEvents([...savedEvents, "complete"])
    setIsComplete(true)
    setShowSkipBtn(false)
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={vast !== null}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: Spacings.xxxxl, backgroundColor: "rgba(0,0,0,0.95)" }}>
        <Text style={{ fontSize: 20, color: Colors.white, fontFamily: 'Poppins-Bold' }}>{vast?.adAdviser}</Text>
        <Text style={{ fontSize: 16, color: Colors.white, fontFamily: 'Roboto', marginBottom: Spacings.sm }}>{vast?.adTitle}</Text>
        <Animated.View style={{ width, height, position: 'relative' }}>
          <video
            ref={videoRef}
            src={vast?.linearMedia?.mediaFiles[0]}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            playsInline
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
        <View style={{ flexDirection: 'row', gap: Spacings.md }}>
          <TouchableOpacity style={{
            alignSelf: 'center',
            borderRadius: 6,
            marginTop: Spacings.lg,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: Spacings.lg,
            borderWidth: 2,
            borderColor: Colors.white,
            flexDirection: 'row',
            gap: Spacings.xs,
            height: 60,
          }} onPress={() => openInterestModal(true)}>
            <Ionicons name="heart" size={30} color={Colors.primary} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Text style={{ fontSize: 16, color: Colors.white, fontFamily: 'Poppins-Medium' }}>Ça m'intéresse, </Text>
              <Text style={{ fontSize: 16, color: Colors.primary, fontFamily: 'Poppins-Medium' }}>Contactez-moi !</Text>
            </View>
          </TouchableOpacity>
          {
            isComplete &&
            <TouchableOpacity style={{
              alignSelf: 'center',
              borderRadius: 6,
              marginTop: Spacings.lg,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: Spacings.lg,
              flexDirection: 'row',
              gap: Spacings.xxs,
              backgroundColor: Colors.primary,
              height: 60,
            }}
              onPress={onAccess}
            >
              <Text style={{ color: Colors.white, fontFamily: 'Poppins-Medium', fontSize: 16 }}>Accéder au contenu</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </TouchableOpacity>
          }
        </View>
      </View>
      <InterestModal visible={showInterestModal} onClose={() => {
        if (!isComplete && videoRef.current)
          videoRef.current.play()
        openInterestModal(false)
      }} vast={vast} />
    </Modal>
  )
}

const AdCard: React.FC<AdCardProps> = ({ vastObj, onSelect }) => {
  const [image, setImage] = useState(null);
  const generateThumbnail = async () => {
    try {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous'; // Nếu video từ domain khác
      video.src = vastObj.linearMedia.mediaFiles[0];

      video.addEventListener('loadedmetadata', () => {
        video.currentTime = 0; // Set time sau khi load metadata
      });

      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        setImage(base64Image);
      });

      video.load();
    } catch (e) { }
  };

  useEffect(() => {
    generateThumbnail()
  }, [])

  return <TouchableOpacity
    style={{
      backgroundColor: Colors.white,
      width: 300,
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
        width: 300,
        height: 300 * 9 / 16,
        borderTopRightRadius: 6,
        borderTopLeftRadius: 6,
      }}
    />
    <Text style={styles.adsTitle} numberOfLines={1} ellipsizeMode="tail">{vastObj.adAdviser}</Text>
    <Text style={styles.adsDescription} numberOfLines={2} ellipsizeMode="tail">{vastObj.adTitle?.trim()}</Text>
  </TouchableOpacity>
}

export const AdServingModalMediaAccess: React.FC<AdServingModalMediaAccessProps> = ({ enabled, onClose, grantAccess, closable = true }) => {
  const { data: user, ...userQuery } = useGetUser()

  const [vastArray, setVastArray] = useState<IVASTObject[]>([])
  const [selectedVAST, setSelectedVAST] = useState<IVASTObject>(null)

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

      if (vastObjArray.findIndex(v => v.adTitle === vastObj.adTitle) !== -1) {
        var i = 0;
        while (i < 5) {
          i++;
          vastObj = await constructVASTObjectWithUrlFromAdButler(vasturl);
          if (vastObjArray.findIndex(v => v.adTitle === vastObj.adTitle) === -1) {
            break;
          }
        }
      }
      if (!vastObj) {
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
  },
  modalContainer: {
    backgroundColor: Colors.grayLight,
    borderRadius: 16,
    padding: Spacings.md,
    width: 700,
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
    marginVertical: Spacings.lg,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    color: Colors.text
  },
  adsTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
    paddingHorizontal: Spacings.xs,
    marginTop: Spacings.xs,
  },
  adsDescription: {
    fontSize: 12,
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
    marginBottom: Spacings.md,
    marginTop: Spacings.lg,
    borderWidth: 2,
    borderColor: Colors.primary
  },
  cancelButtonText: {
    color: Colors.primary,
    textAlign: 'center',
    borderRadius: 6,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  }
});
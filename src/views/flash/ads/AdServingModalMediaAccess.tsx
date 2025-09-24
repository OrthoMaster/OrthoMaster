import React, { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View, StyleSheet, Dimensions, ActivityIndicator, Image, TouchableWithoutFeedback } from "react-native";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from "expo";
import AntDesign from '@expo/vector-icons/AntDesign';
import { hmsToMilliseconds } from "../../../futils";
import { IVASTObject } from "../../../utils/interfaces";
import { constructVASTObjectWithUrlFromAdButler, saveVastEvent, sendInterestToAdvertiser } from "../../../utils/vastTools";
import { useMutation } from "@tanstack/react-query";
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useGetUser } from "../../../hooks/useGetUser.hook";

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
      }, 2000)
  }, [isSent])


  return <Modal animationType="slide"
    transparent={true}
    visible={visible}>
    <TouchableWithoutFeedback onPress={() => {
      setIsError(false)
      setIsSent(false)
      onClose()
    }}>
      <View style={{ backgroundColor: "rgba(0,0,0,0.9)", position: 'absolute', width: '100%', height: "100%" }} />
    </TouchableWithoutFeedback>
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <View style={{ width: "90%", backgroundColor: "white", borderRadius: 10, padding: 20, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Merci pour votre intérêt.</Text>
        <Text style={{ fontSize: 12 }}>Afin d'être contacté par l'annonceur, nous lui communiquerons les informations suivantes relatives à votre compte :</Text>
        <Text style={{
          fontWeight: 'bold',
          alignSelf: 'center',
          fontSize: 12,
          marginVertical: 20
        }}>
          • Nom Prénom{'\n'}
          • Email{'\n'}
          • Fonction professionnelle
        </Text>

        <View style={{
          display: 'flex', flexDirection: 'row',
          width: '100%',
          marginTop: 5
        }}>
          <TouchableOpacity style={{
            flex: 1, alignItems: 'center', justifyContent: 'center', padding: 5
          }} onPress={send}>
            {
              sendInterest.isPending ?
                <ActivityIndicator />
                :
                <Text style={{
                  color: '#fff',
                  backgroundColor: '#ffaf31',
                  width: '100%', paddingVertical: 15,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  borderRadius: 5,
                  fontSize: 12
                }}>
                  Je confirme{'\n'} mon intérêt
                </Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={{
            flex: 1, alignItems: 'center', justifyContent: 'center', padding: 5
          }}
            onPress={onClose}
          >
            <Text style={{
              color: '#fff',
              backgroundColor: '#8E8E8E',
              width: '100%', paddingVertical: 15,
              textAlign: 'center',
              borderRadius: 5,
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

    if (skipLimit > 0 && curT > skipLimit) {
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

  return <Modal animationType="slide"
    transparent={true}
    visible={vast !== null}
  >
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.9)" }}>
      <View style={{ width: '90%' }}>
        <Text style={{ fontSize: 15, fontWeight: "bold", color: '#fff' }}>{vast?.adAdviser}</Text>
        <Text style={{ fontSize: 12, marginBottom: 10, color: '#fff' }}>{vast?.adTitle}</Text>
      </View>
      <Animated.View style={{
        width,
        height,
      }}>
        <VideoView
          style={{
            width: "100%",
            height: "100%",
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
          padding: 5,

        }}>
          <Text style={{
            color: "#fff",
            fontWeight: 'bold',
            fontSize: 12,
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
            <Text style={{ color: "#fff" }}>Passer</Text>
            <AntDesign style={{ marginLeft: 10 }} name="step-forward" size={15} color="#fff" />
          </TouchableOpacity>
        }
      </Animated.View>
      <TouchableOpacity style={{
        alignSelf: 'center',
        borderRadius: 10,
        marginTop: 50,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15, paddingHorizontal: 30,
        borderWidth: 0.5,
        borderColor: "#fff"
      }} onPress={() => openInterestModal(true)}>
        <Image
          source={require('../../../../assets/ads/interest.png')}
          style={{
            width: 30, height: 30,
            objectFit: 'contain',
            marginBottom: 5
          }}
        />
        <Text style={{ fontSize: 10, color: "#fff", fontWeight: 'bold', textAlign: 'center' }}>Ça m'intéresse</Text>
        <Text style={{ fontSize: 10, color: "#fff", fontWeight: 'bold', textAlign: 'center' }}>contactez-moi</Text>
      </TouchableOpacity>
      {
        isComplete &&
        <TouchableOpacity style={{
          padding: 10,
          borderWidth: 2,
          borderColor: "#fff",
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          bottom: 100
        }}
          onPress={onAccess}
        >
          <Text style={{
            color: "#fff",
            fontWeight: "bold",
            fontSize: 10
          }}>Accéder au contenu</Text>
          <AntDesign style={{ marginLeft: 15 }} name="arrow-right" size={15} color="#fff" />
        </TouchableOpacity>
      }
    </View>
    <InterestModal visible={showInterestModal} onClose={() => {
      if (!isComplete)
        player.play()
      openInterestModal(false)
    }} vast={vast} />
  </Modal>
}

const AdCard: React.FC<AdCardProps> = ({ vastObj, onSelect }) => {
  const [image, setImage] = useState(null);

  const generateThumbnail = async () => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        vastObj.linearMedia.mediaFiles[0],
        {
          time: 0,
        }
      );
      setImage(uri);
    } catch (e) {
      console.warn(e);
    }
  };
  useEffect(() => {
    generateThumbnail()
  }, [])


  return <TouchableOpacity style={{
    backgroundColor: "#fff",
    width: screenWidth / 2.5,
    margin: 5,
    padding: 5,
    borderRadius: 5,
    shadowOffset: {
      width: 0, height: 4
    },
    shadowRadius: 2,
    shadowOpacity: 0.1
  }}
    onPress={() => {
      onSelect(vastObj)
    }}
  >
    <View style={{
      width: "100%",
      height: (screenWidth / 2.5) * 9 / 16,
    }}>
      <Image
        source={{ uri: image }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: 'contain'
        }}
      />
    </View>
    <Text style={{ color: "#000", fontSize: 10, fontWeight: 'bold' }}>{vastObj.adAdviser}</Text>
    <Text style={{ fontSize: 10, color: '#494949' }}>{vastObj.adTitle?.trim()}</Text>
  </TouchableOpacity>
}

export const AdServingModalMediaAccess: React.FC<AdServingModalMediaAccessProps> = ({ enabled, onClose, grantAccess, closable = true }) => {

  const { data: user, ...userQuery } = useGetUser()

  const [vastArray, setvastArray] = useState<IVASTObject[]>([])
  const [selectedVAST, setSelectedVAST] = useState<IVASTObject>(null)

  const vastsArrayUrl: string[] = [
    "https://servedbyadbutler.com/vast.spark?setID=63510&ID=188636&pageid=123456&_abdk[Job Function]=" + user?.job_function,
    "https://servedbyadbutler.com/vast.spark?setID=63510&ID=188636&pageid=123456&_abdk[Job Function]=" + user?.job_function,
    "https://servedbyadbutler.com/vast.spark?setID=63510&ID=188636&pageid=123456&_abdk[Job Function]=" + user?.job_function,
  ]

  const initVastArray = async (urlArray: string[]): Promise<IVASTObject[]> => {
    let vastObjArray: IVASTObject[] = []
    for await (const vasturl of urlArray) {
      let vastObj = await constructVASTObjectWithUrlFromAdButler(vasturl)

      if (vastObjArray.findIndex(v => v.adTitle === vastObj.adTitle) !== -1) { //VAST OBJ ALREADY EXISTS
        var i = 0;
        while (i < 5) { // 3 try
          i++;
          vastObj = await constructVASTObjectWithUrlFromAdButler(vasturl)
          if (vastObjArray.findIndex(v => v.adTitle === vastObj.adTitle) === -1) { //VAST OBJ NOT EXISTS
            break;
          }
        }
      }
      if (!vastObj) { // OBJ Not created
        continue
      }
      setvastArray(prev => [...prev, vastObj])
      vastObjArray.push(vastObj)
    }
    return vastObjArray
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
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ width: "90%", backgroundColor: "#DFDFDF", borderRadius: 10, paddingBottom: 20 }}>
            <View style={{ paddingTop: 20, display: "flex", flexDirection: 'column', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, marginBottom: 20, width: '90%', textAlign: 'center' }}>Pour accéder à ce contenu, choisissez une communication de l'un de nos partenaires.</Text>
            </View>
            <View style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: 'center',
              width: '100%',
            }}>
              {
                vastArray.map((value, index) => {
                  if (value.linearMedia)
                    return <AdCard
                      key={index + "ad-card"}
                      vastObj={value}
                      onSelect={(vastObj) => {
                        setSelectedVAST(vastObj)
                      }}
                    />
                })

              }
            </View>

            {closable &&
              <TouchableOpacity style={{
                alignSelf: 'center',
                paddingVertical: 5, paddingHorizontal: 15,
                borderRadius: 5,
                marginTop: 20,
                borderWidth: 2,
                borderColor: "#FFAF31"
              }} onPress={onClose}>
                <Text style={{ fontSize: 16, color: "#ffaf31", fontWeight: 'bold' }}>Annuler</Text>
              </TouchableOpacity>
            }
          </View>
        </View>
        {
          selectedVAST &&
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



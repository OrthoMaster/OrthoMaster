import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Image
} from 'react-native';
import Svg, { G, Circle, Polygon, Path } from 'react-native-svg';


export const MODULE_NOT_STARTED = 0
export const MODULE_STARTED = 1
export const MODULE_FINISHED = 2

export const ModuleProgress = ({
  radius = 70,
  strokeWidth = 10,
  color = "tomato",
  moduleImg = "https://orthoflash-cloud-content.s3.eu-west-3.amazonaws.com/lesson/35/logo.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA4OHA2QKW6FQMCH75%2F20220411%2Feu-west-3%2Fs3%2Faws4_request&X-Amz-Date=20220411T160309Z&X-Amz-Expires=900&X-Amz-Signature=4f2c82b93c58605587ad4990b5892df622206dab9d67373af0108fd7b8826a9b&X-Amz-SignedHeaders=host",
  moduleState = MODULE_NOT_STARTED,
  nbLesson = 12,
  nbLessonValidate = 12
}) => {
  const circleRef = React.useRef();
  const circumference = 2 * Math.PI * radius;
  const halfCircle = radius + strokeWidth;

  useEffect(() => {

    const maxPerc = 100 * nbLessonValidate / nbLesson;
    const strokeDashoffset = nbLesson ? (circumference - (circumference * maxPerc) / 100) + 50 : 0
    if (circleRef?.current) {
      circleRef.current.setNativeProps({
        strokeDashoffset,
      });
    }

    return () => {
    }
  }, [nbLesson, nbLessonValidate])

    

  return (
    <View style={{ width: radius * 2, height: radius * 2 }}>
      <View style={
        [
          StyleSheet.absoluteFillObject,
          {
            width: 100,
            height: 100,
            borderRadius: 100,
            shadowColor: 'black',
            shadowRadius: 15,
            shadowOpacity: moduleState == MODULE_NOT_STARTED ? .0 : .35,
            shadowOffset: {
              height: 10
            },
            top: 20,
            left: 20,
          }]}>

        {moduleImg ? 
          <Image
          style={{
            width: 100,
            height: 100,
            resizeMode: 'contain'
          }}
          source={{ uri: moduleImg }}
        />
        : <ActivityIndicator />
      }
      </View>
      <Svg
        height={radius * 2}
        width={(radius) * 2}
        viewBox={`0 0 ${halfCircle * 2} ${(halfCircle) * 2}`}
      //style={{backgroundColor: 'red', opacity: .05}}
      >
        <G
          transform={"rotate(60)"}
        //origin(`${halfCircle}, ${halfCircle}`)
        >
          <Circle
            ref={circleRef}
            cx="37%"
            cy="-10%"
            r={radius}
            fill="transparent"
            stroke={
              moduleState == MODULE_NOT_STARTED
                ? "#F1F1F1"
                : color
            }
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDashoffset={circumference}
            strokeDasharray={circumference}

          />
          <Circle
            cx="37%"
            cy="-10%"
            r={radius}
            fill="transparent"
            stroke={
              moduleState == MODULE_NOT_STARTED
                ? "#F1F1F1"
                : color
            }
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeOpacity={
              moduleState == MODULE_NOT_STARTED
                ? "1"
                : "0.2"
            }
          />
        </G>
        <Circle
          cx="82%"
          cy="74%"
          r={22}
          fill={
            moduleState == MODULE_NOT_STARTED
              ? "#F1F1F1"
              : moduleState == MODULE_FINISHED
                ? '#66CC33'
                : color
          }
          stroke='white'
          strokeWidth={5}
          strokeLinejoin="round"
          strokeOpacity="1"
        />
        {
          moduleState == MODULE_FINISHED
            ? <Path
              x={122}
              y={119}
              d="M0 0 L7 7 L20 -5"
              stroke={'white'}
              strokeWidth={7}
              strokeLinejoin="round"
              strokeLinecap='round'
            />
            : <Polygon
              x={127}
              y={114}
              points="0 0, 10 5, 0 10"
              stroke="white"
              strokeWidth={5}
              fill="white"
              strokeLinejoin='round'
            />
        }


      </Svg>

    </View>
  );
}

const styles = StyleSheet.create({
  text: { fontWeight: '900', textAlign: 'center' },
});

import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Slider } from "../../component/Slider";

import IntroPage1 from "./pages/IntroPage1";
import IntroPage2 from "./pages/IntroPage2";
import IntroPage3 from "./pages/IntroPage3";
import IntroPage4 from "./pages/IntroPage4";
import IntroPage5 from "./pages/IntroPage5";
import IntroPage6 from "./pages/IntroPage6";

const INTRO_PAGES_ARRAY = [
    <IntroPage1 />,
    <IntroPage2 />,
    <IntroPage3 />,
    <IntroPage4 />,
    <IntroPage5 />,
    <IntroPage6 />
]

export const IntroView = ({ onClose }) => {
    const [currentPageIndex, setCurrentPageIndex] = useState(0)
    return <>
        <Slider
            pagesArray={INTRO_PAGES_ARRAY}
            onQuit={onClose}
            isSkipable={false}
            getCurrentPageIndex={(page) => {
                setCurrentPageIndex(page)
            }}
            customPaginationComponent={<View style={styles.paginationWrapper}>
                {INTRO_PAGES_ARRAY.map((key, index) => (
                    <View
                        style={[index >= 2 && index <= 4 ? styles.paginationBarNumber : styles.paginationBar,
                        {
                            opacity: currentPageIndex === index ? 1 : 0.2,
                        }]}
                        key={index} >
                            {
                                (index >= 2 && index <= 4) &&
                                <Text style={{
                                    color: '#000',
                                    fontWeight: 'bold'
                                }}>{index - 1}</Text>
                            }
                    </View>
                ))}
            </View>}
        />
    </>
}

const styles = StyleSheet.create({
    paginationWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        height: 100,
    },
    paginationBar: {
        height: 15,
        width: 15,
        backgroundColor: '#FFAF31',
        borderRadius: 50,
        marginHorizontal: 5
    },
    paginationBarNumber: {
        height: 30,
        width: 30,
        backgroundColor: '#FFAF31',
        borderRadius: 50,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center'
    }
});

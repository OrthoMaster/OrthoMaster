import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  View,
  TouchableOpacity
} from 'react-native';

import { getQueChoisir } from '../../../services/tools/QueChoisirService';
import { useQuery } from 'react-query';



const BoxNavigation = ({ currentNode, onSelect, isLocked }) => {
  if (currentNode)
    return <View style={{ flex: 1, backgroundColor: 'pink' }}>
      {
        isLocked === false &&
        currentNode.children.map((value, index) => {
          return <TouchableOpacity key={index} style={{
            padding: 10, margin: 5,
            backgroundColor: '#F1F1F1',
          }}
            onPress={() => {
              onSelect(currentNode, value)
            }}
          >
            <Text>{value.label}</Text>
          </TouchableOpacity>
        })
      }
    </View>
}

export const QueChoisirView = ({ navigation }) => {
  const [patientTreeCurrentNode, setPatientTreeCurrentNode] = useState(null)
  const [locationTreeCurrentNode, setLocationTreeCurrentNode] = useState(null)
  const [pathologyTreeCurrentNode, setPathologyTreeCurrentNode] = useState(null)
  const [userStackTrace, setUserStackTrace] = useState([])
  const metaObject = useRef({})

  const [pathologyDynamicTrees, setPathologyDynamicTrees] = useState(null)
  const [patientDynamicTrees, setPatientDynamicTrees] = useState(null)
  const [locationDynamicTrees, setLocationDynamicTrees] = useState(null)

  const [patientBoxLocked, setPatientBoxLocked] = useState(false)
  const [locationBoxLocked, setLocationBoxLocked] = useState(true)
  const [pathologyBoxLocked, setPathologyBoxLocked] = useState(false)

  const handleMetaObjectChanged = () => {
    if (
      metaObject.current.patient
      && metaObject.current.age_patient
      && metaObject.current.activite_patient
    ) {
      setLocationBoxLocked(false)
    }
    pathologyDynamicTrees.forEach(element => {
      for (const key in element.start_conditions) {

        if (key in metaObject.current == false || element.start_conditions[key] != metaObject.current[key]) {
          // console.log("key in metaObject : ", key in metaObject);
          // console.log("metaObject = ", metaObject);
          return
        }
      }
      setPathologyTreeCurrentNode(element) // TODO handle car overide la navigation
      // setPatientBoxLocked(false)
    });
    // console.log(patientTreeCurrentNode);
  }

  const addStep = (node, responseNode, tree) => {
    setUserStackTrace([...userStackTrace, {
      node: node,
      selected_node: responseNode,
      tree: tree
    }])
    if (responseNode.children) {
      switch (tree) {
        case 'patient':
          setPatientTreeCurrentNode(responseNode)
          break;
        case 'localisation':
          setLocationTreeCurrentNode(responseNode)
          break;
        case 'pathologie':
          console.log("Set patho:", responseNode);
          setPathologyTreeCurrentNode(responseNode)
          break;
        default:
          break;
      }
    }
    metaObject.current[responseNode.target] = responseNode.value
    handleMetaObjectChanged()
  }

  const removeStep = () => {
    const lastStep = userStackTrace[userStackTrace.length - 1]
    if (lastStep) {
      switch (lastStep.tree) {
        case 'patient':
          setPatientTreeCurrentNode(lastStep.node)
          break;
        case 'localisation':
          setLocationTreeCurrentNode(lastStep.node)
          break;
        case 'pathologie':
          setPathologyTreeCurrentNode(lastStep.node)
          break;

        default:
          break;
      }
      setUserStackTrace(userStackTrace.slice(0, -1))
      delete metaObject.current[lastStep.selected_node.target]
      handleMetaObjectChanged()
    }
  }

  useQuery(["queChoisir", "GET", "init"], () => getQueChoisir(), {
    onSuccess: (data) => {
      setPatientTreeCurrentNode(data.steps.static.patient)
      setLocationTreeCurrentNode(data.steps.static.localisation)
      setPathologyTreeCurrentNode(data.steps.static.pathologie)

      setPathologyDynamicTrees(data.steps.dynamic.pathologie)
      setLocationDynamicTrees(data.steps.dynamic.localisation)
      setPatientDynamicTrees(data.steps.dynamic.patient)
    },
    onError: (err) => {
      console.log('error', err);
    }
  })

  useEffect(() => {
    console.log("current patho : ", pathologyTreeCurrentNode);
  }, [pathologyTreeCurrentNode])
  


  if (patientTreeCurrentNode && locationTreeCurrentNode)
    return (
      <SafeAreaView style={{ backgroundColor: 'blue', flex: 1 }}>

        <Text style={styles.containerTitle}>
          Que choisir ?
        </Text>
        <View style={{ backgroundColor: 'yellow', flex: 1, display: 'flex' }}>
          <View style={{ flex: 1 }}>
            <Text>Patient</Text>
            <BoxNavigation currentNode={patientTreeCurrentNode}
              onSelect={(node, responseNode) => {
                addStep(node, responseNode, "patient")
              }}
              isLocked={patientBoxLocked}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text>Localisation</Text>
            <BoxNavigation
              currentNode={locationTreeCurrentNode}
              onSelect={(node, responseNode) => {
                addStep(node, responseNode, "localisation")
              }}
              isLocked={locationBoxLocked}
            />

          </View>
          <View style={{ flex: 1 }}>
            <Text>Pathologie</Text>
            <BoxNavigation
              currentNode={pathologyTreeCurrentNode}
              onSelect={(node, responseNode) => {
                addStep(node, responseNode, "pathologie")
              }}
              isLocked={pathologyBoxLocked}
            />

          </View>
          <TouchableOpacity style={{ padding: 10, alignSelf: 'center' }}
            onPress={removeStep}
          >
            <Text>Retour</Text>
          </TouchableOpacity>
        </View>




      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  AndroidSafeArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  containerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginVertical: 30
  }

})


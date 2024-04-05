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



const BoxNavigation = ({ currentNode, onSelect, isActive, history }) => {
  return <View style={{ flex: 1, backgroundColor: 'pink' }}>
    <View style={{ display: 'flex', flexDirection: 'row', width: '100%', backgroundColor: "orange", flexWrap: 'wrap' }}>
      {
        history?.map((value, index) => {
          return <Text key={index} style={{ marginHorizontal: 2 }}>{value}</Text>
        })
      }

    </View>
    {
      currentNode?.children?.map((value, index) => {
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
    {
      isActive == false &&
      <View style={{
        backgroundColor: '#000',
        position: 'absolute',
        height: "100%", width: "100%",
        opacity: 0.2
      }} />
    }
  </View>
}

export const QueChoisirView = ({ navigation }) => {
  useQuery(["queChoisir", "GET", "init"], () => getQueChoisir(), {
    onSuccess: (data) => {
      queChoisir.current = data.que_choisir
      initQueChoisirStep()
    }
  })
  const [treesNavigation, setTreesNavigation] = useState({
    patient: {
      currentNode: null,
      stack: [],
    },
    localisation: {
      currentNode: null,
      stack: [],
    },
    pathologie: {
      currentNode: null,
      stack: [],
    }
  })

  const queChoisir = useRef(null)
  const stepIndex = useRef(0)
  const treeIndexNav = useRef(0)

  const userStackTrace = useRef([])
  const metaObject = useRef({})

  const findTreeByMetadata = async (trees, metadata) => {
    return new Promise((resolve, reject) => {
      trees.forEach((tree, index) => {
        tree.start_conditions.forEach(condition => {
          let isValid = false
          for (const [key, value] of Object.entries(condition)) {
            if (key in metadata == false || value != metadata[key]) {
              isValid = false
              break;
            }
            isValid = true
          }
          if (isValid == true) {
            resolve(tree)
          }
        });
      });
      resolve(null)
    })
  }

  const addStep = async (node, responseNode, tree) => {
    const newTreeIndex = treeIndexNav.current + 1

    userStackTrace.current.push({
      node: node,
      selected_node: responseNode,
      tree: tree,
      step: stepIndex.current
    })
    metaObject.current = {
      ...metaObject.current,
      [responseNode.target]: responseNode.value
    }


    if (responseNode.children == null && newTreeIndex != queChoisir.current[stepIndex.current].trees.length) {

      let newTree
      if (Array.isArray(queChoisir.current[stepIndex.current].trees[newTreeIndex].value)) {
        newTree = await findTreeByMetadata(queChoisir.current[stepIndex.current].trees[newTreeIndex].value, metaObject.current)
      } else {
        newTree = queChoisir.current[stepIndex.current].trees[newTreeIndex].value
      }



      setTreesNavigation({
        ...treesNavigation,
        [tree]: {
          ...treesNavigation[tree],
          currentNode: responseNode,
          stack: [...treesNavigation[tree].stack, responseNode.label]
        },
        [queChoisir.current[stepIndex.current].trees[newTreeIndex].tree]: {
          ...treesNavigation[queChoisir.current[stepIndex.current].trees[newTreeIndex].tree],
          currentNode: newTree,
        }
      })
      treeIndexNav.current = newTreeIndex
    } else {
      setTreesNavigation({
        ...treesNavigation,
        [tree]: {
          ...treesNavigation[tree],
          currentNode: responseNode,//responseNode.children ? responseNode : null,
          stack: [...treesNavigation[tree].stack, responseNode.label]
        }
      })
    }
  }

  const removeStep = () => {
    const lastStep = userStackTrace.current[userStackTrace.current.length - 1]

    if (lastStep) {
      userStackTrace.current = userStackTrace.current.slice(0, -1)
      delete metaObject.current[lastStep.selected_node.target]

      if (lastStep.selected_node.children == null) {
        if (lastStep.step < stepIndex.current) {
          let newTreeNavState = {
            patient: {
              ...treesNavigation.patient,
              currentNode: { children: null },
            },
            localisation: {
              ...treesNavigation.localisation,
              currentNode: { children: null },
            },
            pathologie: {
              ...treesNavigation.pathologie,
              currentNode: { children: null }
            }
          }
          newTreeNavState[lastStep.tree] = {
            ...newTreeNavState[lastStep.tree],
            currentNode: lastStep.node,
            stack: treesNavigation[lastStep.tree].stack.slice(0, -1)
          }
          setTreesNavigation(newTreeNavState)
          stepIndex.current = stepIndex.current - 1
        } else {
          setTreesNavigation({
            ...treesNavigation,
            [queChoisir.current[stepIndex.current].trees[treeIndexNav.current].tree]: {
              ...treesNavigation[queChoisir.current[stepIndex.current].trees[treeIndexNav.current].tree],
              currentNode: null
            },
            [lastStep.tree]: {
              ...treesNavigation[lastStep.tree],
              currentNode: lastStep.node,
              stack: treesNavigation[lastStep.tree].stack.slice(0, -1)
            }
          })
          if (queChoisir.current[stepIndex.current].display == "single") {
            treeIndexNav.current = treeIndexNav.current - 1
          }
        }

      } else {
        setTreesNavigation({
          ...treesNavigation,
          [lastStep.tree]: {
            ...treesNavigation[lastStep.tree],
            currentNode: lastStep.node,
            stack: treesNavigation[lastStep.tree].stack.slice(0, -1)
          }
        })
      }
    }
  }


  const initTreesSingleDisplayMode = async () => {
    treeIndexNav.current = 0
    let newTree
    if (Array.isArray(queChoisir.current[stepIndex.current].trees[treeIndexNav.current].value)) {
      newTree = await findTreeByMetadata(queChoisir.current[stepIndex.current].trees[treeIndexNav.current].value, metaObject)
    } else {
      newTree = queChoisir.current[stepIndex.current].trees[treeIndexNav.current].value
    }
    setTreesNavigation({
      ...treesNavigation,
      [queChoisir.current[stepIndex.current].trees[treeIndexNav.current].tree]: {
        ...treesNavigation[queChoisir.current[stepIndex.current].trees[treeIndexNav.current].tree],
        currentNode: newTree
      }
    })
  }

  const initTreesAllDisplayMode = async () => {

    let newTreesNavigation = {}

    for (const tree of queChoisir.current[stepIndex.current].trees) {
      let treeToDisplay = null
      if (Array.isArray(tree.value)) {
        treeToDisplay = await findTreeByMetadata(tree.value, metaObject.current)
      } else {
        treeToDisplay = tree.value
      }
      newTreesNavigation[tree.tree] = {
        currentNode: treeToDisplay,
        stack: treesNavigation[tree.tree].stack
      }
    };
    setTreesNavigation(newTreesNavigation)
  }

  const initQueChoisirStep = () => {
    if (queChoisir.current) { //init step
      if (queChoisir.current[stepIndex.current].display == "single") {
        initTreesSingleDisplayMode()
      } else if (queChoisir.current[stepIndex.current].display == "all") {
        initTreesAllDisplayMode()
      }
    }
  }



  useEffect(() => {
    console.log("[NAV TREE] - ", treesNavigation);
    if (
      treesNavigation.patient.currentNode
      && treesNavigation.patient.currentNode.children == null
      && treesNavigation.localisation.currentNode
      && treesNavigation.localisation.currentNode.children == null
      && treesNavigation.pathologie.currentNode
      && treesNavigation.pathologie.currentNode.children == null

    ) {
      console.log("ON DOIT CHANGER D'ETAPE !!!");
      if (stepIndex.current < queChoisir.current.length - 1) {
        stepIndex.current = stepIndex.current + 1
        initQueChoisirStep()
      }
    }
  }, [treesNavigation])


  return (
    <SafeAreaView style={{ backgroundColor: 'blue', flex: 1 }}>

      <Text style={styles.containerTitle}>
        Que choisir ?
      </Text>
      <View style={{ backgroundColor: 'yellow', flex: 1, display: 'flex' }}>
        <View style={{ flex: 1 }}>
          <Text>Patient</Text>
          <BoxNavigation currentNode={treesNavigation.patient.currentNode}
            onSelect={(node, responseNode) => {
              addStep(node, responseNode, "patient")
            }}
            isActive={true}
            history={treesNavigation.patient.stack}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text>Localisation</Text>
          <BoxNavigation
            currentNode={treesNavigation.localisation.currentNode}
            onSelect={(node, responseNode) => {
              addStep(node, responseNode, "localisation")
            }}
            isActive={true}
            history={treesNavigation.localisation.stack}
          />

        </View>
        <View style={{ flex: 1 }}>
          <Text>Pathologie</Text>
          <BoxNavigation
            currentNode={treesNavigation.pathologie.currentNode}
            onSelect={(node, responseNode) => {
              addStep(node, responseNode, "pathologie")
            }}
            isActive={true}
            history={treesNavigation.pathologie.stack}
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


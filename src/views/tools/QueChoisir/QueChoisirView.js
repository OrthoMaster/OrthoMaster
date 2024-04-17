import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  View,
  TouchableOpacity,
  Dimensions
} from 'react-native';

import { getQueChoisir } from '../../../services/tools/QueChoisirService';
import { getProducts } from '../../../services/ProductsService';
import { useQuery } from 'react-query';

import { BoxNavigation, TreeType } from './BoxNavigation';
import AppModal from '../../../component/AppModal';

import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { HelpModal } from './HelpModal';

const { width, height } = Dimensions.get('window')
const treeNavBoxDiameter = height * 0.5



export const QueChoisirView = ({ navigation, route }) => {
  const selectedFilters = route.params.filtersConfig
  useQuery(["queChoisir", "GET", "init"], () => getQueChoisir(), {
    onSuccess: (data) => {
      queChoisir.current = data.que_choisir
      dictionaryQueChoisir.current = data.dictionary
      initQueChoisirStep()
    }
  })
  const products = useQuery(["GET", "products", metaObject], () => getProducts(metaObject.current), {
    onSuccess: data => {
      setProductSelection(data)
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
  const [productSelection, setProductSelection] = useState([])
  const [helpTextToDisplayed, sethelpTextToDisplayed] = useState([])
  const queChoisir = useRef(null)
  const dictionaryQueChoisir = useRef(null)
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
          stack: [...treesNavigation[tree].stack, dictionaryQueChoisir.current[responseNode.value]]
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
          stack: [...treesNavigation[tree].stack, dictionaryQueChoisir.current[responseNode.value]]
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

  const filterProducts = async () => {
    let newSelection = []
    products.data.forEach((product, index) => {
      let isValidProduct = true;
      for (const [key, value] of Object.entries(metaObject.current)) {
        // console.log("looking for :", key, value);
        if (product[key]) {
          // console.log(product.brand, " | ", product.model, " | ", product.type);
          // console.log(key + " : " + product[key]);
          let productTags = product[key].split(";")
          let validTag = productTags.filter(tag => tag.indexOf(value) == 0)

          if (validTag.length > 0) {
            let tag = validTag[0]
            if (tag[value.length] == "(") {
              //TODO gérer si les condition sont multiples
              let conditions = tag.slice(value.length + 1, - 1)
              conditions = conditions.split("=")
              if (metaObject.current[conditions[0]] && metaObject.current[conditions[0]] == conditions[1]) {
                isValidProduct = true;
              } else {
                isValidProduct = false;
                break;
              }
            } else if (tag[value.length] == undefined) {
              isValidProduct = true;
            } else {
              isValidProduct = false;
              break;
            }
          } else {
            isValidProduct = false;
            break;
          }
        } else {
          isValidProduct = true;
        }
      }
      // if (product.patient) {
      //   console.log(product.brand, " | ", product.model, " | ", product.type);
      //   console.log(product.patient, product.age_patient);
      //   console.log(metaObject.current);
      //   console.log(isValidProduct);
      // }
      if (isValidProduct == true) {
        newSelection.push(product)
      }
    })
    setProductSelection(newSelection)
  }

  const displayCurrentHelpOnSpecificTree = (tree) => {
    console.log("------------------------------");
    console.log("Display help for tree :", tree);
    console.log("---");
    let newHelpArray = []
    treesNavigation[tree].currentNode?.children?.forEach((value, index) => {
      console.log(value);
      if (value.help) {
        newHelpArray.push(value.help)
      }
    })
    if (newHelpArray.length == 0) {
      newHelpArray = ["Aucun article d'aide n'a été trouvé"]
    }
    sethelpTextToDisplayed(newHelpArray)
  }

  useEffect(() => {
    if (products.data) {
      filterProducts()
    }
    if (
      treesNavigation.patient.currentNode
      && treesNavigation.patient.currentNode.children == null
      && treesNavigation.localisation.currentNode
      && treesNavigation.localisation.currentNode.children == null
      && treesNavigation.pathologie.currentNode
      && treesNavigation.pathologie.currentNode.children == null

    ) {
      if (stepIndex.current < queChoisir.current.length - 1) {
        stepIndex.current = stepIndex.current + 1
        initQueChoisirStep()
      }
    }
  }, [treesNavigation])

  useEffect(() => {
    navigation.getParent().setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
      navigation.getParent().setOptions({ tabBarStyle: { display: 'flex' } });
    }
  }, [])


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
        <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <View style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 10 }}>
            <BoxNavigation currentNode={treesNavigation.patient.currentNode}
              onSelect={(node, responseNode) => {
                addStep(node, responseNode, "patient")
              }}
              isActive={true}
              history={treesNavigation.patient.stack}
              textDictionary={dictionaryQueChoisir.current}
              treeContainerStyle={{
                left: 20,
                // left: -width * 0.3,
                height: treeNavBoxDiameter,
                width: treeNavBoxDiameter,
                //borderRadius: treeNavBoxRadius,
              }}
              tree={TreeType.PATIENT}
            />
            <TouchableOpacity style={{
              position: 'absolute',
              left: 10,
              bottom: 20
            }}
              onPress={() => displayCurrentHelpOnSpecificTree(TreeType.PATIENT)}
            >
              <FontAwesome5 name="info-circle" size={24} color="#DEDEDE" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, display: 'flex', display: 'flex', alignItems: 'flex-end', paddingTop: 10 }}>
            <BoxNavigation
              currentNode={treesNavigation.pathologie.currentNode}
              onSelect={(node, responseNode) => {
                addStep(node, responseNode, "pathologie")
              }}
              isActive={true}
              history={treesNavigation.pathologie.stack}
              textDictionary={dictionaryQueChoisir.current}
              treeContainerStyle={{
                // left: -width * 0.2,
                left: 20,
                // top: 50,
                height: treeNavBoxDiameter,
                width: treeNavBoxDiameter,
                //borderRadius: treeNavBoxRadius,
              }}
              tree={TreeType.PATHOLOGIE}
            />
            <TouchableOpacity style={{
              position: 'absolute',
              left: 10,
              bottom: 10
            }}
              onPress={() => displayCurrentHelpOnSpecificTree(TreeType.PATHOLOGIE)}
            >
              <FontAwesome5 name="info-circle" size={24} color="#DEDEDE" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: "flex-start" }}>
          <BoxNavigation
            currentNode={treesNavigation.localisation.currentNode}
            onSelect={(node, responseNode) => {
              addStep(node, responseNode, "localisation")
            }}
            isActive={true}
            history={treesNavigation.localisation.stack}
            textDictionary={dictionaryQueChoisir.current}
            treeContainerStyle={{
              // right: -width * 0.2,
              left: -20,
              height: treeNavBoxDiameter,
              width: treeNavBoxDiameter,
              //borderRadius: treeNavBoxRadius,
            }}
            tree={TreeType.LOCALISATION}
          />
          <TouchableOpacity style={{
            position: 'absolute',
            right: 10,
            bottom: height / 4
          }}
            onPress={() => displayCurrentHelpOnSpecificTree(TreeType.LOCALISATION)}
          >
            <FontAwesome5 name="info-circle" size={24} color="#DEDEDE" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={{
        position: 'absolute',
        backgroundColor: "#999999",
        borderColor: '#656565',
        borderWidth: 3,
        bottom: height / 4 - 100,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        padding: 10
      }}
        disabled={false}
        onPress={()=>{
          navigation.navigate("tools-que-choisir-final", {
            history: {
              patient: treesNavigation.patient.stack,
              localisation: treesNavigation.localisation.stack[treesNavigation.localisation.stack.length - 1] || null,
              pathologie: treesNavigation.pathologie.stack
            },
            products: productSelection,
            filters: selectedFilters
          })
        }}
      >
        <Text style={{ color: '#fff' }}>Produits trouvés</Text>
        <Text style={{ color: '#fff' }}>{productSelection.length}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{
        position: 'absolute',
        backgroundColor: "#999999",
        borderColor: '#656565',
        borderWidth: 3,
        bottom: height / 4 - 150,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        padding: 10
      }}
        disabled={true}
      >
        <Text style={{ color: '#fff' }}>Nos guides</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{
        paddingVertical: 5, paddingHorizontal: 15,
        backgroundColor: '#fff',
        borderColor: 'red',
        borderWidth: 2,
        borderRadius: 50,
        position: 'absolute',
        bottom: 30,
        display: "flex",
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center'
      }}
        onPress={removeStep}
      >
        <FontAwesome5 name="step-backward" size={20} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={{
        paddingVertical: 5, paddingHorizontal: 15,
        backgroundColor: '#FFAF31',
        borderRadius: 50,
        position: 'absolute',
        top: 50, right: 20,
        display: "flex",
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center'
      }}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="exit" size={20} color="black" />
        <Text style={{ marginLeft: 5 }}>Quitter</Text>
      </TouchableOpacity>
      <HelpModal
      isVisible={helpTextToDisplayed.length > 0}
      onClose={() => { sethelpTextToDisplayed([]) }}
      helpToDisplay={helpTextToDisplayed}
      />
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
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 40,
  }

})


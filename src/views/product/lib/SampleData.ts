import { MainNode } from './Logic';

// Mirrors the Orthomaster sample from the web prototype.
// Swap this with data fetched from your API in production.
export const SAMPLE_NODES: MainNode[] = [
  {
    "id": "patient",
    "title": "Patient",
    "selectionType": "multi",
    "children": [
      {
        "id": "type",
        "label": "Type"
      },
      {
        "id": "age",
        "label": "Âge",
        "visibilityRule": {
          "op": "NOT",
          "rule": {
            "kind": "selected",
            "nodeId": "type",
            "childId": "enfant"
          }
        }
      },
      {
        "id": "activite",
        "label": "Activité"
      }
    ],
    "visibilityRule": null
  },
  {
    "id": "type",
    "title": "Type",
    "selectionType": "single",
    "children": [
      {
        "id": "homme",
        "label": "Homme"
      },
      {
        "id": "femme",
        "label": "Femme"
      },
      {
        "id": "femme-2",
        "label": "Femme enceinte"
      },
      {
        "id": "enfant",
        "label": "Enfant"
      }
    ],
    "visibilityRule": {
      "kind": "selected",
      "nodeId": "patient",
      "childId": "type"
    }
  },
  {
    "id": "age",
    "title": "Âge",
    "selectionType": "single",
    "children": [
      {
        "id": "age-u25",
        "label": "15-25"
      },
      {
        "id": "age-u40",
        "label": "26-40"
      },
      {
        "id": "age-u65",
        "label": "41-65"
      },
      {
        "id": "age-u75",
        "label": "66-75"
      }
    ],
    "visibilityRule": {
      "op": "AND",
      "rules": [
        {
          "kind": "selected",
          "nodeId": "patient",
          "childId": "age"
        },
        {
          "op": "NOT",
          "rule": {
            "kind": "selected",
            "nodeId": "type",
            "childId": "enfant"
          }
        }
      ]
    }
  },
  {
    "id": "activite",
    "title": "Activité",
    "selectionType": "single",
    "children": [
      {
        "id": "activ-1",
        "label": "Sédentaire"
      },
      {
        "id": "activ-2",
        "label": "Modéré"
      },
      {
        "id": "activ-3",
        "label": "Très actif"
      },
      {
        "id": "activ-4",
        "label": "Intense"
      }
    ],
    "visibilityRule": {
      "kind": "selected",
      "nodeId": "patient",
      "childId": "activite"
    }
  },
  {
    "id": "zone",
    "title": "Zone",
    "selectionType": "single",
    "children": [
      {
        "id": "tronc",
        "label": "Tronc"
      },
      {
        "id": "mem-sup",
        "label": "Membre supérieur"
      },
      {
        "id": "mem-inf",
        "label": "Membre inférieur"
      }
    ],
    "visibilityRule": null
  },
  {
    "id": "path_type",
    "title": "Pathologie",
    "selectionType": "single",
    "children": [
      {
        "id": "traumato",
        "label": "Traumato: Douleur aiguë"
      },
      {
        "id": "rhumato",
        "label": "Rhumato: Douleur chronique"
      },
      {
        "id": "neuro",
        "label": "Neuro: Douleur irradiante/paralysie"
      }
    ],
    "visibilityRule": null
  },
  {
    "id": "pec",
    "title": "Prise en charge",
    "selectionType": "single",
    "children": [
      {
        "id": "pec-1",
        "label": "Catégorie-1"
      }
    ],
    "visibilityRule": null
  },
  {
    "id": "segment",
    "title": "Segment",
    "selectionType": "single",
    "children": [
      {
        "id": "tronc-rac-hau",
        "label": "Rachis haut",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "zone",
          "childId": "tronc"
        }
      },
      {
        "id": "tronc-rac-bas",
        "label": "Rachis bas",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "zone",
          "childId": "tronc"
        }
      },
      {
        "id": "tronc-abd",
        "label": "Abdomen",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "zone",
          "childId": "tronc"
        }
      },
      {
        "id": "tronc-bas",
        "label": "Bassin",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "zone",
          "childId": "tronc"
        }
      },
      {
        "id": "mem-sup-epa",
        "label": "Épaule",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "zone",
          "childId": "mem-sup"
        }
      },
      {
        "id": "mem-sup-cou",
        "label": "Coude",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "zone",
          "childId": "mem-sup"
        }
      },
      {
        "id": "mem-sup-poi",
        "label": "Poignet-main",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "zone",
          "childId": "mem-sup"
        }
      },
      {
        "id": "mem-sup-doi",
        "label": "Doigts",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "zone",
          "childId": "mem-sup"
        }
      },
      {
        "id": "mem-inf-cui",
        "label": "Cuisse",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "zone",
          "childId": "mem-inf"
        }
      },
      {
        "id": "mem-inf-gen",
        "label": "Genou",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "zone",
          "childId": "mem-inf"
        }
      },
      {
        "id": "mem-inf-che",
        "label": "Cheville",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "zone",
          "childId": "mem-inf"
        }
      },
      {
        "id": "mem-inf-pie",
        "label": "Pied",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "zone",
          "childId": "mem-inf"
        }
      }
    ],
    "visibilityRule": {
      "kind": "any_selected",
      "nodeId": "zone"
    }
  },
  {
    "id": "localisation",
    "title": "Localisation",
    "selectionType": "single",
    "children": [
      {
        "id": "rach-hau-cerv",
        "label": "Cervical",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "tronc-rac-hau"
        }
      },
      {
        "id": "rach-hau-thor",
        "label": "Thoracique",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "tronc-rac-hau"
        }
      },
      {
        "id": "rach-hau-cote",
        "label": "Cotes",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "tronc-rac-hau"
        }
      },
      {
        "id": "rach-bas-lomb",
        "label": "Lombaire (intervertébral)",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "tronc-rac-bas"
        }
      },
      {
        "id": "rach-bas-glob",
        "label": "Global",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "tronc-rac-bas"
        }
      },
      {
        "id": "abd-abd",
        "label": "Abdominaux/Viscères",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "tronc-abd"
        }
      },
      {
        "id": "abd-sym",
        "label": "Symphyse",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "tronc-abd"
        }
      },
      {
        "id": "abd-mat",
        "label": "Maternité",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "tronc-abd"
        }
      },
      {
        "id": "bas-bas",
        "label": "Bassin",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "tronc-bas"
        }
      },
      {
        "id": "bas-sac",
        "label": "Saccrum-coccyx",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "tronc-bas"
        }
      },
      {
        "id": "epa-cla",
        "label": "Clavicule",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-sup-epa"
        }
      },
      {
        "id": "epa-epa",
        "label": "Épaule",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-sup-epa"
        }
      },
      {
        "id": "epa-scap",
        "label": "Scapula (Omoplate)",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-sup-epa"
        }
      },
      {
        "id": "cou-epi",
        "label": "Epicondyle/epitrochlée",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-sup-cou"
        }
      },
      {
        "id": "cou-ole",
        "label": "Olécrane",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-sup-cou"
        }
      },
      {
        "id": "cou-art",
        "label": "Articulation radio-lunaire",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-sup-cou"
        }
      },
      {
        "id": "poi-poi",
        "label": "Poignet",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-sup-poi"
        }
      },
      {
        "id": "poi-car",
        "label": "Carpe",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-sup-poi"
        }
      },
      {
        "id": "poi-met",
        "label": "Métacarpe II-V",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-sup-poi"
        }
      },
      {
        "id": "poi-bas",
        "label": "Base du pouce (M I)",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-sup-poi"
        }
      },
      {
        "id": "doi-pou",
        "label": "Pouce",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-sup-doi"
        }
      },
      {
        "id": "doi-bas",
        "label": "Base des doigts (MP)",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-sup-doi"
        }
      },
      {
        "id": "doi-lng",
        "label": "Doigts longs",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-sup-doi"
        }
      },
      {
        "id": "cui-ant",
        "label": "Cuisse antérieur (quadriceps)",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-cui"
        }
      },
      {
        "id": "cui-med",
        "label": "Cuisse médiale (adducteurs) ",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-cui"
        }
      },
      {
        "id": "cui-lat",
        "label": "Cuisse latéral",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-cui"
        }
      },
      {
        "id": "cui-pos",
        "label": "Cuisse postérieure (ischios)",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-cui"
        }
      },
      {
        "id": "gen-ant",
        "label": "Genou antérieur",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-gen"
        }
      },
      {
        "id": "gen-pos",
        "label": "Genou postérieur (poplité)",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-gen"
        }
      },
      {
        "id": "gen-med",
        "label": "Genou médial (interne)",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-gen"
        }
      },
      {
        "id": "gen-lat",
        "label": "Genou latéral (externe)",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-gen"
        }
      },
      {
        "id": "che-lat",
        "label": "Cheville latérale",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-che"
        }
      },
      {
        "id": "che-med",
        "label": "Cheville médiale",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-che"
        }
      },
      {
        "id": "che-glob",
        "label": "Cheville globale",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-che"
        }
      },
      {
        "id": "pie-arr",
        "label": "Arrière pied",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-pie"
        }
      },
      {
        "id": "pie-med",
        "label": "Médio et avant pied",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-pie"
        }
      },
      {
        "id": "pie-hal",
        "label": "Hallux",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-pie"
        }
      },
      {
        "id": "pie-ort",
        "label": "Orteil",
        "visibilityRule": {
          "kind": "selected",
          "nodeId": "segment",
          "childId": "mem-inf-pie"
        }
      }
    ],
    "visibilityRule": {
      "kind": "any_selected",
      "nodeId": "segment"
    }
  },
  {
    "id": "pathologie",
    "title": "Pathologie",
    "selectionType": "single",
    "children": [
      {
        "id": "cer-trau-tor",
        "label": "Torticolis",
        "visibilityRule": {
          "op": "AND",
          "rules": [
            {
              "kind": "selected",
              "nodeId": "localisation",
              "childId": "rach-hau-cerv"
            },
            {
              "kind": "selected",
              "nodeId": "path_type",
              "childId": "traumato"
            }
          ]
        }
      },
      {
        "id": "cer-trau-ent",
        "label": "Entorse  (choisir : I - II - III)",
        "visibilityRule": {
          "op": "AND",
          "rules": [
            {
              "kind": "selected",
              "nodeId": "localisation",
              "childId": "rach-hau-cerv"
            },
            {
              "kind": "selected",
              "nodeId": "path_type",
              "childId": "traumato"
            }
          ]
        }
      },
      {
        "id": "cer-trau-fra",
        "label": "Fracture odontoïde",
        "visibilityRule": {
          "op": "AND",
          "rules": [
            {
              "kind": "selected",
              "nodeId": "localisation",
              "childId": "rach-hau-cerv"
            },
            {
              "kind": "selected",
              "nodeId": "path_type",
              "childId": "traumato"
            }
          ]
        }
      },
      {
        "id": "cer-rhu-tor",
        "label": "Torticolis",
        "visibilityRule": {
          "op": "AND",
          "rules": [
            {
              "kind": "selected",
              "nodeId": "localisation",
              "childId": "rach-hau-cerv"
            },
            {
              "kind": "selected",
              "nodeId": "path_type",
              "childId": "rhumato"
            }
          ]
        }
      },
      {
        "id": "cer-rhu-art",
        "label": "Arthrose cervicale",
        "visibilityRule": {
          "op": "AND",
          "rules": [
            {
              "kind": "selected",
              "nodeId": "localisation",
              "childId": "rach-hau-cerv"
            },
            {
              "kind": "selected",
              "nodeId": "path_type",
              "childId": "rhumato"
            }
          ]
        }
      },
      {
        "id": "cer-neu-nev",
        "label": "Névralgie Cervico-brachiale",
        "visibilityRule": {
          "op": "AND",
          "rules": [
            {
              "kind": "selected",
              "nodeId": "localisation",
              "childId": "rach-hau-cerv"
            },
            {
              "kind": "selected",
              "nodeId": "path_type",
              "childId": "neuro"
            }
          ]
        }
      }
    ],
    "visibilityRule": {
      "kind": "any_selected",
      "nodeId": "path_type"
    }
  }
]
;
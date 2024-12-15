export const LAYER_STRUCTURE = {
  // Base layers (constant/required)
  BASE: {
    order: 0,
    sublayers: [
      'body',
      'arm-right',
      'ear-left', 
      'head',
      'face',
      'ear-right'
    ]
  },

  // Variable layers in correct render order
  VARIABLE: {
    // Hair/Hat layer 
    HAIR_HAT: {
      order: 1,
      folder: 'hair-hat',
      metadataKey: 'hair-hat'
    },

    // Top layer with its sub-components
    TOP: {
      order: 2,
      folder: 'top',
      metadataKey: 'top',
      sublayers: [
        'sleeve-left',
        'torso',
        'sleeve-right'
      ]
    },

    // Bottom layer
    BOTTOM: {
      order: 3,
      folder: 'bottom',
      metadataKey: 'bottom'
    },

    // Shoes layer  
    SHOES: {
      order: 4,
      folder: 'shoes',
      metadataKey: 'shoes'
    },

    // Special suits layer (overrides clothing layers)
    SUITS: {
      order: 5,
      folder: 'suits',
      metadataKey: 'suits',
      override: true
    },

    // Accessories at the very top
    ACCESSORIES: {
      order: 6,
      sublayers: [
        {
          name: 'accessory-1',
          metadataKey: 'accessory-1'
        },
        {
          name: 'accessory-2',
          metadataKey: 'accessory-2'
        },
        {
          name: 'accessory-3',
          metadataKey: 'accessory-3'
        },
        {
          name: 'accessory-4',
          metadataKey: 'accessory-4'
        }
      ]
    }
  }
}; 
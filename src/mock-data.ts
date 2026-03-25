export const BRANCHES = [
    { id: 'bello', name: 'Sede Bello', zones: ['Bello', 'Copacabana', 'Girardota'] },
    { id: 'la-13', name: 'Sede La 13', zones: ['Comuna 13', 'San Javier', 'La América'] },
    { id: 'villa-aburra', name: 'Sede Villa de Aburrá', zones: ['Villa de Aburrá', 'Belén', 'Guayabal'] },
    { id: 'la-floresta', name: 'Sede La Floresta', zones: ['La Floresta', 'Calasanz', 'Estadio'] }
]

export const CATEGORIES = [
    'Marquesita Sencilla ($7.000)',
    'Marquesita Especial ($10.000)',
    'Marquesita Salada ($10.000)',
    'Armar mi propia Marquesita'
]

export const MENU = {
    'Marquesita Sencilla ($7.000)': [
        { name: 'Sencilla #1', description: 'Queso, arequipe, chips chocolate', price: 7000 },
        { name: 'Sencilla #2', description: 'Queso, dulce de guayaba, arequipe', price: 7000 },
        { name: 'Sencilla #3', description: 'Chocolate, queso, lecherita, chips colores', price: 7000 },
        { name: 'Sencilla #4', description: 'Chocolate blanco, queso, arequipe, chips chocolate', price: 7000 }
    ],
    'Marquesita Especial ($10.000)': [
        { name: 'Especial #1', description: 'Chocolate, queso, fresa, banano, lecherita, chips colores', price: 10000 },
        { name: 'Especial #2', description: 'Chocolate, queso, fresa, durazno, arequipe, mani', price: 10000 },
        { name: 'Especial #3', description: 'Chocolate blanco, queso, fresa, durazno, mora, coco', price: 10000 },
        { name: 'Especial #4', description: 'Chocolate blanco, queso, fresa, banano, arequipe, chips chocolate', price: 10000 },
        { name: 'Especial #5', description: 'Nutella, fresa, arequipe, chips chocolate', price: 10000 },
        { name: 'Especial #6', description: 'Nutella, queso, fresa, durazno, lecherita, chips colores', price: 10000 },
        { name: 'Especial #7', description: 'Nutella, queso, fresa, banano, arequipe, chips chocolate', price: 10000 }
    ],
    'Marquesita Salada ($10.000)': [
        { name: 'HAWAIIANA', description: 'Pepperoni, salami, queso, piña', price: 10000 },
        { name: 'PAISA', description: 'Queso, maicitos en salsa de la casa, salami', price: 10000 }
    ]
}

export const TOPPINGS_EXTRA = [
    { name: 'Chocolate', price: 2000 },
    { name: 'Queso', price: 2000 },
    { name: 'Fruta', price: 2000 }
]

export const CUSTOM_INGREDIENTS = {
    dulce: {
        base: ['Chocolate', 'Chocolate blanco', 'Nutella'],
        queso: ['Queso'],
        fruta: ['Fresa', 'Banano', 'Durazno', 'Piña'],
        salsa: ['Arequipe', 'Lechera', 'Mora'],
        exterior: ['Chips chocolate', 'Chips colores', 'Mani', 'Coco']
    },
    salada: {
        base: ['Pepperoni', 'Salami', 'Maicitos'],
        queso: ['Queso'],
        aderezo: ['Cheddar', 'Chipotle'],
        fruta: ['Piña'],
        exterior: []
    }
}

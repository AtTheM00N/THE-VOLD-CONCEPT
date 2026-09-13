export const products = [
  { id: 'classic', name: 'Classic', category: 'Energy drink', line: 'The original. Unfiltered.', description: 'The taste that started it all. A bold, sparkling original with an unmistakable VOLD attitude.', color: '#FF3131', image: 'can_classic', label: 'ORIGINAL TASTE', details: ['250 ml slim can', '75 mg caffeine', 'Taurine + B vitamins'], note: 'Caffeine content is for the 250 ml energy can. Check the pack for full ingredients and consumption guidance.' },
  { id: 'green', name: 'Green Apple', category: 'Energy drink', line: 'A little bite. A lot of bold.', description: 'Crisp green apple meets a sparkling energy base. Fresh, sharp, and ready to change the pace.', color: '#39FF14', image: 'can_green_white', label: 'GREEN EDITION', details: ['250 ml slim can', '75 mg caffeine', 'Taurine + B vitamins'], note: 'Caffeine content is for the 250 ml energy can. Check the pack for full ingredients and consumption guidance.' },
  { id: 'ginger', name: 'Ginger Ale', category: 'Sparkling mixer', line: 'Bring a little heat.', description: 'Ginger warmth. A dry, sparkling finish. Pour it over ice or make it part of your next signature serve.', color: '#FFA500', image: 'can_ginger', label: 'GINGER ALE', details: ['250 ml slim can', 'Real ginger', 'Caffeine free'], note: 'A sparkling mixer, separate from the VOLD energy range. Check the pack for full ingredients.' },
  { id: 'tonic', name: 'Tonic Water', category: 'Sparkling mixer', line: 'Made for good company.', description: 'Bright bubbles with a crisp, bittersweet edge. A tonic that holds its own, however you pour it.', color: '#00FFFF', image: 'can_tonic', label: 'TONIC WATER', details: ['250 ml slim can', 'Contains quinine', 'Caffeine free'], note: 'A sparkling mixer, separate from the VOLD energy range. Check the pack for full ingredients.' },
] as const

export type Product = typeof products[number]
export type SceneMotion = { progress: number; scrollY: number }

export const regions = ['Maharashtra', 'Goa', 'North Karnataka', 'UP East', 'Delhi', 'Punjab', 'Haryana', 'Rajasthan', 'North East']
export const faqs = [
  { q: 'What is VOLD?', a: 'An independent Indian beverage brand, born in Pune. Our range brings together energy drinks and sparkling mixers in cans, PET bottles, and glass.' },
  { q: 'Which one is an energy drink?', a: 'Classic and Green Apple are our energy drinks. Their 250 ml cans contain 75 mg of caffeine, with taurine and B vitamins. Ginger Ale and Tonic Water are caffeine-free mixers. Always refer to the label for ingredients and consumption guidance.' },
  { q: 'Can I order VOLD online?', a: 'Contact the team with your city, preferred products, and quantity to check availability and ordering options. Use the email or WhatsApp links below to make an enquiry.' },
  { q: 'What packaging is available?', a: 'The range spans 250 ml slim cans, 250 ml PET bottles, and 275 ml glass bottles. Availability varies by product and region; the team can help you choose the right format.' },
  { q: 'How do I become a stockist?', a: 'Choose “Trade partnership” in the enquiry form and tell us your business name, territory, and the products you are interested in. Your enquiry opens in your email app, ready to send to the VOLD team.' },
]

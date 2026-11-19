import type { Macros } from "./types";

export interface FoodRef {
  name: string;
  aliases: string[];
  per100: Macros;
  /** Porción típica en gramos. */
  portion: number;
  /** Peso de una unidad (huevo, arepa…), para interpretar "2 huevos". */
  unit?: number;
}

const f = (kcal: number, protein: number, carbs: number, fat: number): Macros => ({ kcal, protein, carbs, fat });

/** Base local de referencia (valores aproximados por 100 g, alimento cocido salvo que se indique). */
export const FOOD_DB: FoodRef[] = [
  { name: "Pollo a la plancha", aliases: ["pollo", "pechuga"], per100: f(165, 31, 0, 3.6), portion: 150 },
  { name: "Carne de res magra", aliases: ["carne", "res", "lomo de res", "bistec"], per100: f(217, 26, 0, 12), portion: 150 },
  { name: "Carne molida", aliases: ["carne molida", "molida"], per100: f(250, 26, 0, 15), portion: 120 },
  { name: "Lomo de cerdo", aliases: ["cerdo", "lomo de cerdo"], per100: f(143, 26, 0, 3.5), portion: 150 },
  { name: "Salmón", aliases: ["salmon", "salmón"], per100: f(208, 20, 0, 13), portion: 150 },
  { name: "Atún en agua", aliases: ["atun", "atún"], per100: f(116, 26, 0, 1), portion: 100 },
  { name: "Tilapia", aliases: ["tilapia", "pescado", "mojarra"], per100: f(128, 26, 0, 2.7), portion: 150 },
  { name: "Huevo", aliases: ["huevo", "huevos", "huevos revueltos", "huevo frito"], per100: f(143, 12.6, 0.7, 9.5), portion: 100, unit: 50 },
  { name: "Claras de huevo", aliases: ["claras", "clara"], per100: f(52, 11, 0.7, 0.2), portion: 120, unit: 33 },
  { name: "Arroz blanco", aliases: ["arroz", "arroz blanco"], per100: f(130, 2.7, 28, 0.3), portion: 150 },
  { name: "Arroz integral", aliases: ["arroz integral"], per100: f(123, 2.7, 25.6, 1), portion: 150 },
  { name: "Arepa de maíz", aliases: ["arepa", "arepas"], per100: f(219, 4.6, 43, 2.8), portion: 80, unit: 80 },
  { name: "Arepa con queso", aliases: ["arepa con queso", "arepa de queso"], per100: f(260, 9, 35, 9.5), portion: 110, unit: 110 },
  { name: "Pan integral", aliases: ["pan integral", "pan"], per100: f(247, 13, 41, 3.4), portion: 60, unit: 30 },
  { name: "Avena en hojuelas", aliases: ["avena"], per100: f(389, 16.9, 66, 6.9), portion: 40 },
  { name: "Pasta cocida", aliases: ["pasta", "espagueti", "spaghetti"], per100: f(158, 5.8, 31, 0.9), portion: 180 },
  { name: "Quinoa", aliases: ["quinoa", "quinua"], per100: f(120, 4.4, 21, 1.9), portion: 150 },
  { name: "Papa cocida", aliases: ["papa", "papas", "patata"], per100: f(87, 1.9, 20, 0.1), portion: 150 },
  { name: "Papas a la francesa", aliases: ["papas fritas", "papas a la francesa"], per100: f(312, 3.4, 41, 15), portion: 120 },
  { name: "Batata", aliases: ["batata", "camote"], per100: f(86, 1.6, 20, 0.1), portion: 150 },
  { name: "Yuca cocida", aliases: ["yuca"], per100: f(160, 1.4, 38, 0.3), portion: 150 },
  { name: "Plátano maduro", aliases: ["maduro", "platano maduro", "plátano maduro"], per100: f(122, 1.3, 32, 0.4), portion: 120 },
  { name: "Patacón", aliases: ["patacon", "patacón", "platano verde"], per100: f(236, 1.5, 38, 9), portion: 100 },
  { name: "Frijoles", aliases: ["frijoles", "frijol", "frejoles"], per100: f(127, 8.7, 22.8, 0.5), portion: 150 },
  { name: "Lentejas", aliases: ["lentejas", "lenteja"], per100: f(116, 9, 20, 0.4), portion: 150 },
  { name: "Garbanzos", aliases: ["garbanzos", "garbanzo"], per100: f(164, 8.9, 27, 2.6), portion: 150 },
  { name: "Aguacate", aliases: ["aguacate", "palta"], per100: f(160, 2, 8.5, 14.7), portion: 50 },
  { name: "Ensalada verde", aliases: ["ensalada", "lechuga", "verduras"], per100: f(20, 1.2, 3.5, 0.2), portion: 100 },
  { name: "Brócoli", aliases: ["brocoli", "brócoli"], per100: f(34, 2.8, 7, 0.4), portion: 100 },
  { name: "Tomate", aliases: ["tomate"], per100: f(18, 0.9, 3.9, 0.2), portion: 80 },
  { name: "Banano", aliases: ["banano", "banana", "guineo"], per100: f(89, 1.1, 22.8, 0.3), portion: 120, unit: 120 },
  { name: "Manzana", aliases: ["manzana"], per100: f(52, 0.3, 14, 0.2), portion: 180, unit: 180 },
  { name: "Fresas", aliases: ["fresas", "fresa"], per100: f(32, 0.7, 7.7, 0.3), portion: 150 },
  { name: "Mango", aliases: ["mango"], per100: f(60, 0.8, 15, 0.4), portion: 150 },
  { name: "Yogur griego natural", aliases: ["yogur", "yogurt", "griego"], per100: f(97, 9, 3.6, 5), portion: 170 },
  { name: "Yogur griego 0%", aliases: ["yogur light", "yogur 0"], per100: f(59, 10, 3.6, 0.4), portion: 170 },
  { name: "Leche entera", aliases: ["leche"], per100: f(61, 3.2, 4.8, 3.3), portion: 240 },
  { name: "Queso campesino", aliases: ["queso", "quesito"], per100: f(264, 18, 3, 20), portion: 40 },
  { name: "Café con leche", aliases: ["cafe con leche", "café con leche", "cafe", "café"], per100: f(38, 2, 3, 2), portion: 240 },
  { name: "Jugo de naranja", aliases: ["jugo de naranja", "jugo"], per100: f(45, 0.7, 10.4, 0.2), portion: 250 },
  { name: "Proteína whey", aliases: ["whey", "proteina", "proteína", "batido de proteina", "scoop"], per100: f(400, 80, 8, 6), portion: 30, unit: 30 },
  { name: "Mantequilla de maní", aliases: ["mantequilla de mani", "mantequilla de maní", "mani", "maní"], per100: f(588, 25, 20, 50), portion: 32 },
  { name: "Almendras", aliases: ["almendras", "nueces", "frutos secos"], per100: f(579, 21, 22, 50), portion: 30 },
  { name: "Aceite de oliva", aliases: ["aceite"], per100: f(884, 0, 0, 100), portion: 10 },
  { name: "Granola", aliases: ["granola"], per100: f(471, 10, 64, 20), portion: 45 },
  { name: "Tortilla de trigo", aliases: ["tortilla", "wrap"], per100: f(310, 8, 52, 8), portion: 60, unit: 60 },
  { name: "Pizza", aliases: ["pizza"], per100: f(266, 11, 33, 10), portion: 200 },
  { name: "Hamburguesa", aliases: ["hamburguesa"], per100: f(254, 14, 24, 11), portion: 230 },
  { name: "Chocolate oscuro 70%", aliases: ["chocolate"], per100: f(598, 7.8, 46, 43), portion: 20 },
];

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

export function searchFoods(q: string, limit = 8): FoodRef[] {
  const nq = normalize(q);
  if (!nq) return FOOD_DB.slice(0, limit);
  return FOOD_DB.map((food) => {
    const names = [food.name, ...food.aliases].map(normalize);
    let score = 0;
    for (const n of names) {
      if (n === nq) score = Math.max(score, 3);
      else if (n.startsWith(nq)) score = Math.max(score, 2);
      else if (n.includes(nq)) score = Math.max(score, 1);
    }
    return { food, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.food);
}

/** Busca el alimento cuyo alias aparece en el texto (el alias más largo gana). */
export function matchFoodsInText(text: string): { food: FoodRef; index: number; alias: string }[] {
  const nt = ` ${normalize(text)} `;
  const found: { food: FoodRef; index: number; alias: string }[] = [];
  const taken: [number, number][] = [];
  const candidates = FOOD_DB.flatMap((food) => [food.name, ...food.aliases].map((a) => ({ food, alias: normalize(a) }))).sort(
    (a, b) => b.alias.length - a.alias.length,
  );
  for (const { food, alias } of candidates) {
    const re = new RegExp(`[^a-z]${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^a-z]`);
    const m = re.exec(nt);
    if (!m) continue;
    const start = m.index;
    const end = start + alias.length;
    if (taken.some(([s, e]) => start < e && end > s)) continue;
    if (found.some((x) => x.food === food)) continue;
    taken.push([start, end]);
    found.push({ food, index: start, alias });
  }
  return found.sort((a, b) => a.index - b.index);
}

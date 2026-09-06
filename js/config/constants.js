/**
 * @fileoverview Constantes e parâmetros técnicos para cálculo de marcenaria.
 * @module config/constants
 */

/**
 * Tipos de módulos de móveis suportados.
 * @type {ReadonlyArray<{id: string, name: string}>}
 */
export const MODULE_TYPES = Object.freeze([
    { id: 'SINK_CABINET', name: 'Balcão de Pia' },
    { id: 'WALL_CABINET', name: 'Armário Aéreo' },
    { id: 'KITCHEN_BASE', name: 'Armário de Cozinha' },
    { id: 'WARDROBE', name: 'Guarda-Roupa' }
]);

/**
 * Espessuras padrão de MDF em milímetros.
 * @type {ReadonlyArray<number>}
 */
export const MDF_THICKNESS = Object.freeze([15, 18]);

/**
 * Configurações de rebaixo e espessura para o fundo do móvel (Valores em mm).
 * @type {Readonly<{THICKNESS: number, REBATE_DEPTH: number, REBATE_WIDTH: number}>}
 */
export const BACK_PANEL = Object.freeze({
    THICKNESS: 6,
    REBATE_DEPTH: 7,
    REBATE_WIDTH: 13
});

/**
 * Desconto aplicado em mm por borda onde houver fita aplicada (portas e frentes).
 * @type {number}
 */
export const EDGE_BANDING_DISCOUNT_PER_EDGE = 1;

/**
 * Recuo padrão em mm para prateleiras e divisórias internas em relação à profundidade da caixa.
 * @type {number}
 */
export const SHELF_RECESS = 10;

/**
 * Folga total na largura do vão para instalação de corrediças telescópicas (13mm de cada lado).
 * @type {Readonly<{TOTAL: number, PER_SIDE: number}>}
 */
export const SLIDE_CLEARANCE = Object.freeze({
    TOTAL: 26,
    PER_SIDE: 13
});

/**
 * Altura padrão em mm para o rodapé do móvel.
 * @type {number}
 */
export const PLINTH_DEFAULT_HEIGHT = 100;

/**
 * Padrões de acabamento configuráveis.
 * @type {ReadonlyArray<{id: string, label: string}>}
 */
export const FINISH_TYPES = Object.freeze([
    { id: 'ALL_WHITE', label: 'Todo Branco' },
    { id: 'WHITE_BOX_WOOD_FRONT', label: 'Caixa Branca / Frentes Madeiradas' },
    { id: 'ALL_WOOD', label: 'Todo Madeirado' }
]);

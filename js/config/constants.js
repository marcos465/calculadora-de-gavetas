/**
 * @fileoverview Constantes de configuração e opções estruturais do sistema MarcenariaCalc.
 * @module config/constants
 */

/**
 * Mapeamento dos tipos de construção e fixação das laterais em relação à base e piso.
 * @type {Readonly<{FLOOR: string, OVER_BASE: string}>}
 */
export const SIDE_CONSTRUCTION_TYPES = Object.freeze({
    /** Lateral estendida até o chão; base parafusada entre as laterais */
    FLOOR: 'FLOOR',
    /** Lateral apoiada/parafusada por cima da base inferior ou apoiada no rodapé */
    OVER_BASE: 'OVER_BASE'
});

/**
 * Rótulos descritivos amigáveis para exibição na interface do usuário.
 * @type {Readonly<Record<string, string>>}
 */
export const SIDE_CONSTRUCTION_LABELS = Object.freeze({
    [SIDE_CONSTRUCTION_TYPES.FLOOR]: 'Até o chão',
    [SIDE_CONSTRUCTION_TYPES.OVER_BASE]: 'Parafusada por baixo / Apoio na base'
});

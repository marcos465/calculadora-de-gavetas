/**
 * @fileoverview Ponto de entrada da aplicação MarcenariaCalc.
 * @module app
 */

import {
    MODULE_TYPES,
    MDF_THICKNESS,
    BACK_PANEL,
    EDGE_BANDING_DISCOUNT_PER_EDGE,
    SHELF_RECESS,
    SLIDE_CLEARANCE,
    PLINTH_DEFAULT_HEIGHT,
    FINISH_TYPES
} from './config/constants.js';

/**
 * Valida a integridade dos parâmetros técnicos importados.
 * @returns {boolean} Retorna true se a validação for bem-sucedida.
 * @throws {Error} Lança um erro se alguma constante crítica estiver fora dos limites esperados.
 */
function validateConfigurations() {
    if (!Array.isArray(MODULE_TYPES) || MODULE_TYPES.length === 0) {
        throw new Error('Configuração inválida: MODULE_TYPES deve ser um array não vazio.');
    }

    if (!Array.isArray(MDF_THICKNESS) || !MDF_THICKNESS.includes(15) || !MDF_THICKNESS.includes(18)) {
        throw new Error('Configuração inválida: MDF_THICKNESS deve conter as opções 15mm e 18mm.');
    }

    if (SLIDE_CLEARANCE.TOTAL !== SLIDE_CLEARANCE.PER_SIDE * 2) {
        throw new Error('Configuração inconsistente: Folga total da corrediça deve ser o dobro da folga lateral.');
    }

    return true;
}

/**
 * Inicializa a aplicação e carrega as configurações base.
 * @returns {void}
 */
function initApp() {
    try {
        validateConfigurations();

        console.group('🪵 MarcenariaCalc - Sistema Inicializado');
        console.log('✅ Regras técnicas e constantes carregadas com sucesso:');
        console.log('- Tipos de Módulos:', MODULE_TYPES);
        console.log('- Espessuras de MDF (mm):', MDF_THICKNESS);
        console.log('- Regras de Fundo (mm):', BACK_PANEL);
        console.log(`- Desconto de Fita de Borda: ${EDGE_BANDING_DISCOUNT_PER_EDGE}mm por borda`);
        console.log(`- Recuo de Prateleira: ${SHELF_RECESS}mm`);
        console.log(`- Folga de Corrediças: ${SLIDE_CLEARANCE.TOTAL}mm total (${SLIDE_CLEARANCE.PER_SIDE}mm/lado)`);
        console.log(`- Altura de Rodapé Padrão: ${PLINTH_DEFAULT_HEIGHT}mm`);
        console.log('- Acabamentos:', FINISH_TYPES);
        console.groupEnd();
    } catch (error) {
        console.error('❌ Falha na inicialização do MarcenariaCalc:', error.message);
    }
}

// Garante a execução do script após a renderização do DOM
document.addEventListener('DOMContentLoaded', initApp);

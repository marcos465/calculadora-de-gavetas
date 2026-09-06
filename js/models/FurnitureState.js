/**
 * @fileoverview Gerenciador do estado do móvel em cálculo.
 * @module models/FurnitureState
 */

import {
    MODULE_TYPES,
    MDF_THICKNESS,
    PLINTH_DEFAULT_HEIGHT,
    FINISH_TYPES
} from '../config/constants.js';

/**
 * Representa as configurações e dimensões do móvel a ser calculado.
 */
export class FurnitureState {
    /**
     * @param {Object} [initialData={}] Dados iniciais para preenchimento do estado.
     */
    constructor(initialData = {}) {
        this.type = initialData.type || MODULE_TYPES[0].id;
        this.height = Number(initialData.height) || 0;
        this.width = Number(initialData.width) || 0;
        this.depth = Number(initialData.depth) || 0;
        this.mdfThickness = Number(initialData.mdfThickness) || MDF_THICKNESS[0];
        this.plinthHeight = Number(initialData.plinthHeight) ?? PLINTH_DEFAULT_HEIGHT;
        this.drawerCount = Number(initialData.drawerCount) || 0;
        this.finishType = initialData.finishType || FINISH_TYPES[0].id;
        this.hasProfileHandle = Boolean(initialData.hasProfileHandle);
    }

    /**
     * Atualiza os dados do estado com base em um objeto parcial de novos valores.
     * @param {Object} newData Parâmetros a serem atualizados.
     * @returns {FurnitureState} A própria instância para encadeamento.
     */
    update(newData = {}) {
        if (newData.type !== undefined) this.type = String(newData.type);
        if (newData.height !== undefined) this.height = Number(newData.height);
        if (newData.width !== undefined) this.width = Number(newData.width);
        if (newData.depth !== undefined) this.depth = Number(newData.depth);
        if (newData.mdfThickness !== undefined) this.mdfThickness = Number(newData.mdfThickness);
        if (newData.plinthHeight !== undefined) this.plinthHeight = Number(newData.plinthHeight);
        if (newData.drawerCount !== undefined) this.drawerCount = Number(newData.drawerCount);
        if (newData.finishType !== undefined) this.finishType = String(newData.finishType);
        if (newData.hasProfileHandle !== undefined) this.hasProfileHandle = Boolean(newData.hasProfileHandle);

        return this;
    }

    /**
     * Valida se as dimensões mínimas e campos obrigatórios foram preenchidos corretamente.
     * @returns {{isValid: boolean, errors: string[]}} Status de validação e lista de erros encontrados.
     */
    validate() {
        const errors = [];

        if (!MODULE_TYPES.some((m) => m.id === this.type)) {
            errors.push('Selecione um tipo de móvel válido.');
        }

        if (isNaN(this.height) || this.height < 200) {
            errors.push('A altura mínima recomendada do móvel é 200mm.');
        }

        if (isNaN(this.width) || this.width < 200) {
            errors.push('A largura mínima recomendada do móvel é 200mm.');
        }

        if (isNaN(this.depth) || this.depth < 100) {
            errors.push('A profundidade mínima recomendada do móvel é 100mm.');
        }

        if (!MDF_THICKNESS.includes(this.mdfThickness)) {
            errors.push('Selecione uma espessura de MDF válida (15mm ou 18mm).');
        }

        if (isNaN(this.plinthHeight) || this.plinthHeight < 0) {
            errors.push('A altura do rodapé não pode ser negativa.');
        }

        if (this.type === 'WALL_CABINET' && this.plinthHeight > 0) {
            // Em aéreos não costuma existir rodapé
            this.plinthHeight = 0;
        }

        if (isNaN(this.drawerCount) || this.drawerCount < 0) {
            errors.push('A quantidade de gavetas deve ser igual ou maior a zero.');
        }

        if (!FINISH_TYPES.some((f) => f.id === this.finishType)) {
            errors.push('Selecione um tipo de acabamento válido.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Retorna uma cópia limpa do estado (Plain Old JavaScript Object).
     * @returns {Object} Dados do estado.
     */
    toObject() {
        return {
            type: this.type,
            height: this.height,
            width: this.width,
            depth: this.depth,
            mdfThickness: this.mdfThickness,
            plinthHeight: this.plinthHeight,
            drawerCount: this.drawerCount,
            finishType: this.finishType,
            hasProfileHandle: this.hasProfileHandle
        };
    }
}

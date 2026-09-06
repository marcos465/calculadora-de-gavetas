/**
 * @fileoverview Modelo de estado representativo do móvel e suas configurações estruturais.
 * @module models/FurnitureState
 */

/**
 * Define o layout estrutural quando há divisão de vãos (ex: Gavetas + Portas).
 * @typedef {'LEFT_DRAWERS' | 'RIGHT_DRAWERS' | 'FULL_WIDTH'} DrawerLayout
 */

/**
 * Classe de modelo para armazenar, validar e exportar o estado de configuração do móvel.
 */
export class FurnitureState {
    constructor() {
        this.type = 'SINK_CABINET';
        this.width = 1200;            // Largura total em mm
        this.height = 870;            // Altura total em mm (incluindo rodapé)
        this.depth = 550;             // Profundidade total em mm
        this.mdfThickness = 15;       // Espessura do MDF/MDP em mm
        this.plinthHeight = 150;      // Altura do rodapé em mm
        this.drawerCount = 3;         // Quantidade de gavetas
        this.doorCount = 2;           // Quantidade de portas
        this.shelfCount = 1;          // Quantidade de prateleiras internas
        this.hasProfileHandle = true;  // Utiliza perfil de alumínio/gola
        this.finishType = 'Branco';   // Cor/Acabamento
        /** @type {DrawerLayout} */
        this.drawerLayout = 'LEFT_DRAWERS'; // Disposição das gavetas se houver divisão
    }

    /**
     * Atualiza o estado a partir de um objeto de dados parciais ou completos.
     * @param {Partial<FurnitureState>} data Dados para fusão no estado.
     */
    update(data) {
        if (!data || typeof data !== 'object') return;

        if (data.type !== undefined) this.type = String(data.type);
        if (data.width !== undefined) this.width = Number(data.width);
        if (data.height !== undefined) this.height = Number(data.height);
        if (data.depth !== undefined) this.depth = Number(data.depth);
        if (data.mdfThickness !== undefined) this.mdfThickness = Number(data.mdfThickness);
        if (data.plinthHeight !== undefined) this.plinthHeight = Number(data.plinthHeight);
        if (data.drawerCount !== undefined) this.drawerCount = Number(data.drawerCount);
        if (data.doorCount !== undefined) this.doorCount = Number(data.doorCount);
        if (data.shelfCount !== undefined) this.shelfCount = Number(data.shelfCount);
        if (data.hasProfileHandle !== undefined) this.hasProfileHandle = Boolean(data.hasProfileHandle);
        if (data.finishType !== undefined) this.finishType = String(data.finishType);
        if (data.drawerLayout !== undefined) this.drawerLayout = String(data.drawerLayout);
    }

    /**
     * Valida os parâmetros de dimensão e regras mínimas de construção.
     * @returns {{isValid: boolean, errors: string[]}}
     */
    validate() {
        const errors = [];

        if (isNaN(this.width) || this.width < 300 || this.width > 2700) {
            errors.push('A largura deve estar entre 300mm e 2700mm.');
        }

        if (isNaN(this.height) || this.height < 400 || this.height > 2600) {
            errors.push('A altura deve estar entre 400mm e 2600mm.');
        }

        if (isNaN(this.depth) || this.depth < 250 || this.depth > 1000) {
            errors.push('A profundidade deve estar entre 250mm e 1000mm.');
        }

        if (isNaN(this.doorCount) || this.doorCount < 0 || this.doorCount > 4) {
            errors.push('A quantidade de portas deve ser entre 0 e 4.');
        }

        if (isNaN(this.shelfCount) || this.shelfCount < 0 || this.shelfCount > 3) {
            errors.push('A quantidade de prateleiras deve ser entre 0 e 3.');
        }

        if (isNaN(this.drawerCount) || this.drawerCount < 0 || this.drawerCount > 8) {
            errors.push('A quantidade de gavetas deve ser entre 0 e 8.');
        }

        // Validação estrutural de coerência
        if (this.width > 800 && this.drawerCount > 0 && this.doorCount === 0 && this.drawerLayout !== 'FULL_WIDTH') {
            errors.push('Para móveis sem portas, selecione o layout "Apenas Gavetas / Apenas Portas".');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Retorna uma cópia serializável limpa do estado atual.
     * @returns {Object}
     */
    toObject() {
        return {
            type: this.type,
            width: this.width,
            height: this.height,
            depth: this.depth,
            mdfThickness: this.mdfThickness,
            plinthHeight: this.plinthHeight,
            drawerCount: this.drawerCount,
            doorCount: this.doorCount,
            shelfCount: this.shelfCount,
            hasProfileHandle: this.hasProfileHandle,
            finishType: this.finishType,
            drawerLayout: this.drawerLayout
        };
    }
}

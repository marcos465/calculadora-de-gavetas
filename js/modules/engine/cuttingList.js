/**
 * @fileoverview Engine de cálculo preciso do plano de corte e modulação de componentes de marcenaria.
 * @module modules/engine/cuttingList
 */

/**
 * Objeto representando uma peça individual da lista de corte.
 * @typedef {Object} CuttingItem
 * @property {string} name - Nome técnico da peça.
 * @property {number} quantity - Quantidade de peças.
 * @property {number} height - Comprimento (medida maior ou no sentido do veio) em mm.
 * @property {number} width - Largura (medida menor) em mm.
 * @property {number} thickness - Espessura do MDF em mm.
 * @property {string} edgeBanding - Instrução de fita de borda (ex: '1L 1C', '4 Lados').
 * @property {string} description - Descrição e detalhes de montagem.
 */

/**
 * Calculador e modulador técnico responsável pela geração de peças de corte.
 */
export class CuttingListEngine {
    /**
     * Recuo padrão da prateleira e divisórias internas em relação à frente da caixa.
     * @type {number}
     */
    static SHELF_RECESS = 10;

    /**
     * @param {import('../../models/FurnitureState.js').FurnitureState} furnitureState
     */
    constructor(furnitureState) {
        if (!furnitureState) {
            throw new Error('CuttingListEngine requer uma instância válida de FurnitureState.');
        }
        this.state = furnitureState;
    }

    /**
     * Processa e calcula o plano de corte completo baseado no estado do móvel.
     * @returns {CuttingItem[]} Lista estruturada de peças cortadas com descontos.
     */
    generateList() {
        const list = [];
        const {
            width,
            height,
            depth,
            mdfThickness,
            plinthHeight,
            drawerCount,
            doorCount,
            shelfCount,
            drawerLayout
        } = this.state;

        // ---------------------------------------------------------------------
        // 1. CÁLCULO DE DIMENSÕES DA CAIXA E VÃOS INTERNOS
        // ---------------------------------------------------------------------
        const cabinetHeight = height - plinthHeight;
        const internalHeight = cabinetHeight - (2 * mdfThickness); // Altura entre a base e o tampo/riplas
        const internalWidthTotal = width - (2 * mdfThickness);      // Vão livre total interno
        const internalDepth = depth - CuttingListEngine.SHELF_RECESS; // Profundidade recuada para internos

        // Determina se há necessidade de Divisória Vertical (Gavetas + Portas em móveis amplos)
        const hasDivider = (drawerCount > 0 && doorCount > 0) || (width > 800 && drawerCount > 0 && drawerLayout !== 'FULL_WIDTH');

        // Divisão de Vãos: Se houver divisória, desconta a espessura da divisória e divide por 2
        let drawerBayWidth = internalWidthTotal;
        let doorBayWidth = internalWidthTotal;

        if (hasDivider) {
            const availableSpace = internalWidthTotal - mdfThickness;
            drawerBayWidth = Math.round(availableSpace / 2);
            doorBayWidth = availableSpace - drawerBayWidth;
        }

        // ---------------------------------------------------------------------
        // 2. ESTRUTURA EXTERNA (CAIXA)
        // ---------------------------------------------------------------------

        // Laterais (2 unidades)
        list.push({
            name: 'Lateral Caixa',
            quantity: 2,
            height: cabinetHeight,
            width: depth,
            thickness: mdfThickness,
            edgeBanding: '1L 1C',
            description: 'Laterais externas da caixa'
        });

        // Base Inferior (1 unidade)
        list.push({
            name: 'Base Inferior',
            quantity: 1,
            height: internalWidthTotal,
            width: depth,
            thickness: mdfThickness,
            edgeBanding: '1L',
            description: 'Base montada entre as laterais'
        });

        // Traves / Ripas Superiores de Amarração (2 unidades)
        list.push({
            name: 'Ripa Superior (Fixação)',
            quantity: 2,
            height: internalWidthTotal,
            width: 80,
            thickness: mdfThickness,
            edgeBanding: '1L',
            description: 'Sustentação da pia/tampo e amarração estrutural'
        });

        // Fundo Traseiro (MDF 3mm ou 15mm encabeçado - Usando MDF do projeto)
        list.push({
            name: 'Fundo Traseiro Engrossado',
            quantity: 1,
            height: internalHeight - 5,
            width: internalWidthTotal - 5,
            thickness: mdfThickness,
            edgeBanding: 'Sem Fita',
            description: 'Fundo estrutural recuado'
        });

        // Rodapé Frontal e Traseiro
        if (plinthHeight > 0) {
            list.push({
                name: 'Régua de Rodapé',
                quantity: 2,
                height: internalWidthTotal,
                width: plinthHeight,
                thickness: mdfThickness,
                edgeBanding: '1L',
                description: 'Rodapés inferior (Frontal e Traseiro)'
            });
        }

        // ---------------------------------------------------------------------
        // 3. DIVISÓRIA VERTICAL INTERNA
        // ---------------------------------------------------------------------
        if (hasDivider) {
            list.push({
                name: 'Divisória Vertical Central',
                quantity: 1,
                height: internalHeight,
                width: internalDepth,
                thickness: mdfThickness,
                edgeBanding: '1L',
                description: 'Separação física entre o vão das gavetas e o vão das portas'
            });
        }

        // ---------------------------------------------------------------------
        // 4. PRATELEIRAS INTERNAS
        // ---------------------------------------------------------------------
        if (shelfCount > 0) {
            // A prateleira ocupa o vão reservado para as portas (ou vão total se sem divisória)
            const shelfWidth = hasDivider ? doorBayWidth - 2 : internalWidthTotal - 2; // -2mm para folga de montagem

            list.push({
                name: 'Prateleira Interna',
                quantity: shelfCount,
                height: shelfWidth,
                width: internalDepth,
                thickness: mdfThickness,
                edgeBanding: '1L',
                description: `Prateleiras ajustáveis no vão das portas (${shelfWidth}mm de largura)`
            });
        }

        // ---------------------------------------------------------------------
        // 5. CAIXAS E FRENTES DE GAVETAS
        // ---------------------------------------------------------------------
        if (drawerCount > 0) {
            // Largura da frente da gaveta
            const drawerFrontWidth = hasDivider ? drawerBayWidth - 3 : internalWidthTotal - 3;
            const drawerFrontHeight = Math.round((internalHeight - ((drawerCount + 1) * 3)) / drawerCount);

            // Folga das corrediças telescópicas = 26mm no total (13mm de cada lado)
            const drawerBoxWidth = (hasDivider ? drawerBayWidth : internalWidthTotal) - (2 * mdfThickness) - 26;
            const drawerBoxDepth = Math.min(500, Math.max(250, Math.floor((depth - 50) / 50) * 50));
            const drawerBoxHeight = Math.max(90, drawerFrontHeight - 40);

            // Frentes de Gaveta
            list.push({
                name: 'Frente de Gaveta',
                quantity: drawerCount,
                height: drawerFrontWidth,
                width: drawerFrontHeight,
                thickness: mdfThickness,
                edgeBanding: '4 Lados',
                description: `Frentes externas do vão (${drawerFrontWidth}x${drawerFrontHeight}mm)`
            });

            // Laterais da Gaveta
            list.push({
                name: 'Lateral de Gaveta',
                quantity: drawerCount * 2,
                height: drawerBoxDepth,
                width: drawerBoxHeight,
                thickness: mdfThickness,
                edgeBanding: '1L',
                description: 'Lados da caixa interna da gaveta'
            });

            // Cabeceiras (Frente e Traseira da Caixa da Gaveta)
            const drawerHeadWidth = drawerBoxWidth - (2 * mdfThickness);
            list.push({
                name: 'Cabeceira de Gaveta (Frente/Fundo)',
                quantity: drawerCount * 2,
                height: drawerHeadWidth,
                width: drawerBoxHeight,
                thickness: mdfThickness,
                edgeBanding: '1L',
                description: 'Montagem interna da caixa de gaveta'
            });

            // Fundo da Gaveta
            list.push({
                name: 'Fundo da Gaveta',
                quantity: drawerCount,
                height: drawerHeadWidth,
                width: drawerBoxDepth,
                thickness: mdfThickness,
                edgeBanding: 'Sem Fita',
                description: 'Fundo da caixa de gaveta'
            });
        }

        // ---------------------------------------------------------------------
        // 6. PORTAS
        // ---------------------------------------------------------------------
        if (doorCount > 0) {
            const targetWidth = hasDivider ? doorBayWidth : internalWidthTotal;
            const doorWidth = Math.round((targetWidth - ((doorCount + 1) * 3)) / (hasDivider ? Math.min(doorCount, 2) : doorCount));
            const doorHeight = internalHeight - 6;

            list.push({
                name: 'Porta de Abrir',
                quantity: doorCount,
                height: doorHeight,
                width: doorWidth,
                thickness: mdfThickness,
                edgeBanding: '4 Lados',
                description: `Portas externas de abrigo no vão de ${targetWidth}mm`
            });
        }

        return list;
    }
}

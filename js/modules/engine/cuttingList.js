/**
 * @fileoverview Motor de Cálculo Geométrico e Lista de Corte para Marcenaria.
 * @module modules/engine/cuttingList
 */

import { SIDE_CONSTRUCTION_TYPES } from '../../config/constants.js';

/**
 * Representa um item gerado para a tabela do plano de corte.
 * @typedef {Object} CuttingItem
 * @property {string} name - Nome da peça.
 * @property {number} quantity - Quantidade de peças idênticas.
 * @property {number} height - Comprimento/Altura da peça em mm.
 * @property {number} width - Largura da peça em mm.
 * @property {number} thickness - Espessura do MDF em mm.
 * @property {string} edgeBanding - Padrão de fitagem de borda (ex: '1L 1C', '4 Lados').
 * @property {string} description - Detalhes e aplicação técnica da peça.
 */

/**
 * Processador rigoroso para cálculo matemático das dimensões de corte de um Balcão de Pia.
 */
export class CuttingListEngine {
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
     * Executa as equações geométricas de fabricação para gerar a lista de corte.
     * @returns {CuttingItem[]} Lista de peças cortadas.
     */
    generateList() {
        const list = [];
        const {
            width,
            height,
            depth,
            mdfThickness,
            drawerMdfThickness,
            plinthHeight,
            sideConstruction,
            drawerCount,
            doorCount,
            shelfCount,
            drawerLayout
        } = this.state;

        // Largura constante fixada para a régua/trave superior de fixação
        const TOP_RAIL_WIDTH = 80;

        // ---------------------------------------------------------------------
        // 1. LATERAIS (2x)
        // ---------------------------------------------------------------------
        let sideHeight = 0;
        let sideDepth = depth;

        if (sideConstruction === SIDE_CONSTRUCTION_TYPES.FLOOR) {
            // Altura = Altura Total
            sideHeight = height;
        } else {
            // SIDE_CONSTRUCTION_TYPES.OVER_BASE: Altura = Altura Total - Altura Rodapé - Espessura MDF
            sideHeight = height - plinthHeight - mdfThickness;
        }

        list.push({
            name: 'Lateral Caixa',
            quantity: 2,
            height: Math.round(sideHeight),
            width: Math.round(sideDepth),
            thickness: mdfThickness,
            edgeBanding: '1L 1C',
            description: `Laterais (${sideConstruction === SIDE_CONSTRUCTION_TYPES.FLOOR ? 'Até o chão' : 'Parafusada por baixo'})`
        });

        // ---------------------------------------------------------------------
        // 2. BASE INFERIOR (1x)
        // ---------------------------------------------------------------------
        let baseWidth = 0;

        if (sideConstruction === SIDE_CONSTRUCTION_TYPES.FLOOR) {
            // Largura = Largura Total - (2 * Espessura MDF)
            baseWidth = width - (2 * mdfThickness);
        } else {
            // SIDE_CONSTRUCTION_TYPES.OVER_BASE: Largura = Largura Total
            baseWidth = width;
        }

        list.push({
            name: 'Base Inferior',
            quantity: 1,
            height: Math.round(baseWidth),
            width: Math.round(depth),
            thickness: mdfThickness,
            edgeBanding: '1L',
            description: 'Base do balcão de sustentação'
        });

        // ---------------------------------------------------------------------
        // 3. FUNDO (1x, Espessura 6mm / Padrão de Rebaixo)
        // ---------------------------------------------------------------------
        // Largura = Largura Total - 12mm
        // Altura = Altura Total - Altura Rodapé - 7mm
        const backWidth = width - 12;
        const backHeight = height - plinthHeight - 7;

        list.push({
            name: 'Fundo Traseiro',
            quantity: 1,
            height: Math.round(backHeight),
            width: Math.round(backWidth),
            thickness: 6,
            edgeBanding: 'Sem Fita',
            description: 'Fundo estrutural rebaixado'
        });

        // ---------------------------------------------------------------------
        // 4. RÉGUAS SUPERIORES DE AMARRAÇÃO (2x)
        // ---------------------------------------------------------------------
        const topRailLength = width - (2 * mdfThickness);
        list.push({
            name: 'Régua Superior (Trave de Fixação)',
            quantity: 2,
            height: Math.round(topRailLength),
            width: TOP_RAIL_WIDTH,
            thickness: mdfThickness,
            edgeBanding: '1L',
            description: 'Traves frontais e traseiras para amarração e apoio da pia'
        });

        // ---------------------------------------------------------------------
        // 5. RODAPÉ FRONTAL E TRASEIRO (2x)
        // ---------------------------------------------------------------------
        if (plinthHeight > 0) {
            const plinthLength = sideConstruction === SIDE_CONSTRUCTION_TYPES.FLOOR ? baseWidth : width;
            list.push({
                name: 'Régua de Rodapé',
                quantity: 2,
                height: Math.round(plinthLength),
                width: Math.round(plinthHeight),
                thickness: mdfThickness,
                edgeBanding: '1L',
                description: 'Estrutura de apoio no solo'
            });
        }

        // ---------------------------------------------------------------------
        // 6. DIVISÓRIA VERTICAL (Se houver gavetas e portas ou largura > 800mm)
        // ---------------------------------------------------------------------
        const hasDivider = (drawerCount > 0 && doorCount > 0) || (width > 800 && drawerCount > 0 && drawerLayout !== 'FULL_WIDTH');

        if (hasDivider) {
            // Altura = Altura Total - Altura Rodapé - Espessura Base - Espessura Régua Superior
            const dividerHeight = height - plinthHeight - mdfThickness - mdfThickness;
            // Profundidade = Profundidade Total - 6mm (Espessura do fundo)
            const dividerDepth = depth - 6;

            list.push({
                name: 'Divisória Vertical Central',
                quantity: 1,
                height: Math.round(dividerHeight),
                width: Math.round(dividerDepth),
                thickness: mdfThickness,
                edgeBanding: '1L',
                description: 'Divisória interna separando vãos de portas e gavetas'
            });
        }

        // ---------------------------------------------------------------------
        // 7. FRENTES (Portas e Gavetas em colunas organizadas)
        // ---------------------------------------------------------------------
        // Vão das Frentes = Largura Total - (2 * Espessura Lateral) + 12mm
        const frontBayWidth = width - (2 * mdfThickness) + 12;

        // Determinação das Colunas de Frentes:
        // Se houver divisória, dividimos em 2 colunas. Caso contrário, 1 coluna única.
        const columnCount = hasDivider ? 2 : 1;
        const gapPerDivision = 2; // Folga de 2mm entre colunas
        const divisionGapsTotal = (columnCount - 1) * gapPerDivision;

        // Largura Individual da Frente = (Vão das Frentes - (Folgas de 2mm * qtd_divisões)) / Quantidade de Colunas
        const individualFrontWidth = (frontBayWidth - divisionGapsTotal) / columnCount;

        // Vão Interno do Módulo para Caixa de Gavetas (por coluna)
        const internalBayForDrawers = hasDivider ? ((width - (2 * mdfThickness) - mdfThickness) / 2) : (width - (2 * mdfThickness));

        // --- GAVETAS ---
        if (drawerCount > 0) {
            // Altura da Frente de Gaveta = ((Altura Total - Altura Rodapé - Espessura Base) - 37mm - 2mm) / Quantidade de Gavetas
            const drawerFrontHeight = ((height - plinthHeight - mdfThickness) - 37 - 2) / drawerCount;

            list.push({
                name: 'Frente de Gaveta',
                quantity: drawerCount,
                height: Math.round(individualFrontWidth),
                width: Math.round(drawerFrontHeight),
                thickness: mdfThickness,
                edgeBanding: '4 Lados',
                description: `Frente externa cortada para coluna de ${Math.round(individualFrontWidth)}mm`
            });

            // --- CAIXA DE GAVETA (Por Gaveta) ---
            // Altura da Lateral de Gaveta = Altura da Frente de Gaveta - 20mm
            const drawerSideHeight = drawerFrontHeight - 20;

            // Altura do Frontal/Traseiro de Gaveta = Altura da Lateral de Gaveta - 15mm
            const drawerHeadHeight = drawerSideHeight - 15;

            // Profundidade da caixa de gaveta (padronizada nas medidas comercias de corrediças)
            const drawerDepth = Math.min(550, Math.max(250, Math.floor((depth - 50) / 50) * 50));

            // Largura do Frontal/Traseiro = Vão Interno da Gaveta - (2 * Espessura MDF Gaveta) - Folga Corrediça (26mm)
            const drawerHeadWidth = internalBayForDrawers - (2 * drawerMdfThickness) - 26;

            // Laterais de Gaveta (2 por gaveta)
            list.push({
                name: 'Lateral de Gaveta',
                quantity: drawerCount * 2,
                height: Math.round(drawerDepth),
                width: Math.round(drawerSideHeight),
                thickness: drawerMdfThickness,
                edgeBanding: '1L',
                description: 'Laterais da caixa interna da gaveta'
            });

            // Frontal / Traseiro de Gaveta (2 por gaveta)
            list.push({
                name: 'Cabeceira de Gaveta (Frente/Traseiro)',
                quantity: drawerCount * 2,
                height: Math.round(drawerHeadWidth),
                width: Math.round(drawerHeadHeight),
                thickness: drawerMdfThickness,
                edgeBanding: '1L',
                description: 'Frontal e traseiro interno da caixa de gaveta'
            });

            // Fundo da Gaveta (1 por gaveta - MDF 6mm)
            const drawerBottomWidth = drawerHeadWidth + (2 * drawerMdfThickness);
            list.push({
                name: 'Fundo da Gaveta',
                quantity: drawerCount,
                height: Math.round(drawerDepth),
                width: Math.round(drawerBottomWidth),
                thickness: 6,
                edgeBanding: 'Sem Fita',
                description: 'Fundo encaixado/rebaixado da caixa de gaveta'
            });
        }

        // --- PORTAS ---
        if (doorCount > 0) {
            // Altura da Porta = Altura Total - Altura Rodapé - Espessura Base - Largura Réguas + 12mm - 35mm
            const doorHeight = height - plinthHeight - mdfThickness - TOP_RAIL_WIDTH + 12 - 35;

            // Cálculo da largura individual das portas
            const doorsInColumn = hasDivider ? doorCount : doorCount;
            const doorGaps = (doorsInColumn - 1) * 3; // 3mm de folga entre portas da mesma coluna
            const doorWidth = (individualFrontWidth - doorGaps) / (hasDivider ? Math.max(1, doorCount) : doorCount);

            list.push({
                name: 'Porta de Abrir',
                quantity: doorCount,
                height: Math.round(doorHeight),
                width: Math.round(doorWidth),
                thickness: mdfThickness,
                edgeBanding: '4 Lados',
                description: `Portas para vão de abrigo`
            });
        }

        // ---------------------------------------------------------------------
        // 8. PRATELEIRAS INTERNAS
        // ---------------------------------------------------------------------
        if (shelfCount > 0) {
            const shelfWidth = hasDivider ? (internalBayForDrawers - 2) : (width - (2 * mdfThickness) - 2);
            const shelfDepth = depth - 16; // Recuo para não colidir com o fundo de 6mm e portas

            list.push({
                name: 'Prateleira Interna',
                quantity: shelfCount,
                height: Math.round(shelfWidth),
                width: Math.round(shelfDepth),
                thickness: mdfThickness,
                edgeBanding: '1L',
                description: `Prateleiras internas recuadas (${Math.round(shelfWidth)}mm de largura)`
            });
        }

        return list;
    }
}

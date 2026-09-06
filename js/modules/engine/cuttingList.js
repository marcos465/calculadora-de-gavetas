/**
 * @fileoverview Motor de Cálculo Geométrico e Lista de Corte para Marcenaria.
 * @module modules/engine/cuttingList
 */

import { SIDE_CONSTRUCTION_TYPES } from '../../config/constants.js';

/**
 * Constantes globais de tolerâncias e folgas técnicas de marcenaria em milímetros (mm).
 * @type {Readonly<{TOTAL: number, SIDE: number, SHELF_RECESS: number}>}
 */
export const SLIDE_CLEARANCE = Object.freeze({
    /** Folga total combinada para corrediças telescópicas/ocultas (13mm de cada lado) */
    TOTAL: 26,
    /** Folga individual por lateral da corrediça */
    SIDE: 13,
    /** Recuo padrão da profundidade da prateleira interna em relação ao corpo do móvel */
    SHELF_RECESS: 10
});

/**
 * Representa um item gerado para a tabela do plano de corte.
 * @typedef {Object} CuttingItem
 * @property {string} name - Nome descritivo da peça.
 * @property {number} quantity - Quantidade de peças idênticas.
 * @property {number} height - Comprimento/Altura da peça em mm.
 * @property {number} width - Largura da peça em mm.
 * @property {number} thickness - Espessura da chapa MDF em mm.
 * @property {string} edgeBanding - Padrão de aplicação de fita de borda (ex: '1L 1C', '4 Lados').
 * @property {string} description - Detalhes e aplicação técnica da peça na estrutura.
 */

/**
 * Processador rigoroso para cálculo matemático das dimensões de corte do móvel.
 */
export class CuttingListEngine {
    /**
     * @param {import('../../models/FurnitureState.js').FurnitureState} furnitureState Instância contendo as dimensões e parâmetros do móvel.
     */
    constructor(furnitureState) {
        if (!furnitureState) {
            throw new Error('CuttingListEngine requer uma instância válida de FurnitureState.');
        }
        this.state = furnitureState;
    }

    /**
     * Executa as equações geométricas de fabricação para gerar a lista de corte completa.
     * @returns {CuttingItem[]} Lista estruturada de peças para o plano de corte.
     */
    generateList() {
        const list = [];
        const {
            width: larguraTotal,
            height: alturaTotal,
            depth: profundidadeTotal,
            mdfThickness: espessuraMDF,
            drawerMdfThickness: espessuraMDFGaveta,
            plinthHeight: alturaRodape,
            sideConstruction,
            drawerCount: gavetaCount,
            doorCount: portaCount,
            shelfCount: prateleiraCount,
            drawerLayout
        } = this.state;

        // Altura padrão fixa para as réguas/traves superiores de amarração (mm)
        const LARGURA_REGUA_SUPERIOR = 80;

        // ---------------------------------------------------------------------
        // 1. LATERAIS DA CAIXA (2x)
        // ---------------------------------------------------------------------
        let alturaLateral = 0;
        const profundidadeLateral = profundidadeTotal;

        if (sideConstruction === SIDE_CONSTRUCTION_TYPES.FLOOR) {
            alturaLateral = alturaTotal;
        } else {
            // SIDE_CONSTRUCTION_TYPES.OVER_BASE: Apoiada sobre o rodapé/base
            alturaLateral = alturaTotal - alturaRodape - espessuraMDF;
        }

        list.push({
            name: 'Lateral Caixa',
            quantity: 2,
            height: Math.round(alturaLateral),
            width: Math.round(profundidadeLateral),
            thickness: espessuraMDF,
            edgeBanding: '1L 1C',
            description: `Laterais (${sideConstruction === SIDE_CONSTRUCTION_TYPES.FLOOR ? 'Até o chão' : 'Parafusada por baixo'})`
        });

        // ---------------------------------------------------------------------
        // 2. BASE INFERIOR (1x)
        // ---------------------------------------------------------------------
        let larguraBase = 0;

        if (sideConstruction === SIDE_CONSTRUCTION_TYPES.FLOOR) {
            larguraBase = larguraTotal - (2 * espessuraMDF);
        } else {
            larguraBase = larguraTotal;
        }

        list.push({
            name: 'Base Inferior',
            quantity: 1,
            height: Math.round(larguraBase),
            width: Math.round(profundidadeTotal),
            thickness: espessuraMDF,
            edgeBanding: '1L',
            description: 'Base do balcão de sustentação'
        });

        // ---------------------------------------------------------------------
        // 3. FUNDO DO MÓVEL (1x - MDF 6mm)
        // ---------------------------------------------------------------------
        const larguraFundo = larguraTotal - 12;
        const alturaFundo = alturaTotal - alturaRodape - 7;

        list.push({
            name: 'Fundo Traseiro',
            quantity: 1,
            height: Math.round(alturaFundo),
            width: Math.round(larguraFundo),
            thickness: 6,
            edgeBanding: 'Sem Fita',
            description: 'Fundo estrutural rebaixado'
        });

        // ---------------------------------------------------------------------
        // 4. RÉGUAS SUPERIORES DE AMARRAÇÃO (2x)
        // ---------------------------------------------------------------------
        const comprimentoReguaSuperior = larguraTotal - (2 * espessuraMDF);

        list.push({
            name: 'Régua Superior (Trave de Fixação)',
            quantity: 2,
            height: Math.round(comprimentoReguaSuperior),
            width: LARGURA_REGUA_SUPERIOR,
            thickness: espessuraMDF,
            edgeBanding: '1L',
            description: 'Traves frontais e traseiras para amarração e apoio da pia'
        });

        // ---------------------------------------------------------------------
        // 5. RODAPÉ FRONTAL E TRASEIRO (2x)
        // ---------------------------------------------------------------------
        if (alturaRodape > 0) {
            const comprimentoRodape = sideConstruction === SIDE_CONSTRUCTION_TYPES.FLOOR ? larguraBase : larguraTotal;
            list.push({
                name: 'Régua de Rodapé',
                quantity: 2,
                height: Math.round(comprimentoRodape),
                width: Math.round(alturaRodape),
                thickness: espessuraMDF,
                edgeBanding: '1L',
                description: 'Estrutura de apoio no solo'
            });
        }

        // ---------------------------------------------------------------------
        // 6. DIVISÓRIA VERTICAL INTERNA
        // ---------------------------------------------------------------------
        const temDivisoria = (gavetaCount > 0 && portaCount > 0) || (larguraTotal > 800 && gavetaCount > 0 && drawerLayout !== 'FULL_WIDTH');
        const qtdDivisorias = temDivisoria ? 1 : 0;
        const qtdLaterais = 2;

        if (temDivisoria) {
            const alturaDivisoria = alturaTotal - alturaRodape - espessuraMDF - LARGURA_REGUA_SUPERIOR;
            const profundidadeDivisoria = profundidadeTotal - 6; // Desconto do rebaixo do fundo

            list.push({
                name: 'Divisória Vertical Central',
                quantity: 1,
                height: Math.round(alturaDivisoria),
                width: Math.round(profundidadeDivisoria),
                thickness: espessuraMDF,
                edgeBanding: '1L',
                description: 'Divisória interna separando vãos de portas e gavetas'
            });
        }

        // ---------------------------------------------------------------------
        // 7. GEOMETRIA DE VÃOS LÍQUIDOS E COLUNAS
        // ---------------------------------------------------------------------
        // Determina quantas colunas estruturais existem (ex: 2 portas + 1 coluna gaveta = 3 colunas)
        const totalColunas = portaCount + (gavetaCount > 0 ? 1 : 0);

        let larguraColuna = 0;
        let mdfTotal = 0;
        let vaoLiquidoTotal = 0;

        if (totalColunas > 0) {
            // Regra 1: Cálculo da Coluna Base (Vão Líquido)
            mdfTotal = (qtdLaterais + qtdDivisorias) * espessuraMDF;
            vaoLiquidoTotal = larguraTotal - mdfTotal;
            larguraColuna = vaoLiquidoTotal / totalColunas;
        }

        // ---------------------------------------------------------------------
        // 8. ALTURA DAS FRENTES (PORTAS E GAVETAS)
        // ---------------------------------------------------------------------
        const espessuraBase = espessuraMDF;
        const vaoVerticalBruto = alturaTotal - alturaRodape - espessuraBase - LARGURA_REGUA_SUPERIOR + 12;

        // Altura da Porta Pronta
        const alturaPortaPronta = vaoVerticalBruto - 35;

        // Regra 5: Altura das Frentes de Gaveta (Mantida)
        // alturaFrenteGaveta = ((alturaPortaPronta + 35) / qtdGavetas) - 35 - 2
        let alturaFrenteGaveta = 0;
        if (gavetaCount > 0) {
            alturaFrenteGaveta = ((alturaPortaPronta + 35) / gavetaCount) - 35 - 2;
        }

        // ---------------------------------------------------------------------
        // 9. FRENTES DE GAVETA & CAIXA DE GAVETA
        // ---------------------------------------------------------------------
        if (gavetaCount > 0) {
            // Regra 2: Largura das Frentes de Gaveta
            const larguraFrenteGaveta = larguraColuna + 12;

            list.push({
                name: 'Frente de Gaveta',
                quantity: gavetaCount,
                height: Number(larguraFrenteGaveta.toFixed(2)),
                width: Number(alturaFrenteGaveta.toFixed(2)),
                thickness: espessuraMDF,
                edgeBanding: '4 Lados',
                description: `Frente externa para coluna de gavetas (${larguraFrenteGaveta.toFixed(1)}mm de largura)`
            });

            // Regra 6: Preservação da Caixa de Gaveta
            // Folga de 26mm para corrediças telescópicas mantida
            const alturaLateralGaveta = alturaFrenteGaveta - 20;
            const alturaFrontalTraseiroGaveta = alturaLateralGaveta - 15;

            // Determinação do Vão Interno da Gaveta com base na largura da coluna
            const larguraVaoInternoGaveta = larguraColuna;

            const larguraFrontalTraseiroGaveta = larguraVaoInternoGaveta - (2 * espessuraMDFGaveta) - SLIDE_CLEARANCE.TOTAL;
            const profundidadeGaveta = Math.min(550, Math.max(250, Math.floor((profundidadeTotal - 50) / 50) * 50));

            // Laterais da Gaveta (2x por gaveta)
            list.push({
                name: 'Lateral de Gaveta',
                quantity: gavetaCount * 2,
                height: Math.round(profundidadeGaveta),
                width: Number(alturaLateralGaveta.toFixed(2)),
                thickness: espessuraMDFGaveta,
                edgeBanding: '1L',
                description: 'Laterais estruturais da caixa de gaveta'
            });

            // Frontal / Traseiro da Gaveta (2x por gaveta)
            list.push({
                name: 'Cabeceira de Gaveta (Frente/Traseiro)',
                quantity: gavetaCount * 2,
                height: Number(larguraFrontalTraseiroGaveta.toFixed(2)),
                width: Number(alturaFrontalTraseiroGaveta.toFixed(2)),
                thickness: espessuraMDFGaveta,
                edgeBanding: '1L',
                description: 'Painel frontal e traseiro da caixa interna da gaveta (com desconto de 26mm das corrediças)'
            });

            // Fundo da Gaveta (1x por gaveta - MDF 6mm)
            const larguraFundoGaveta = larguraFrontalTraseiroGaveta + (2 * espessuraMDFGaveta);
            list.push({
                name: 'Fundo da Gaveta',
                quantity: gavetaCount,
                height: Math.round(profundidadeGaveta),
                width: Number(larguraFundoGaveta.toFixed(2)),
                thickness: 6,
                edgeBanding: 'Sem Fita',
                description: 'Fundo estrutural em MDF 6mm para caixa de gaveta'
            });
        }

        // ---------------------------------------------------------------------
        // 10. PORTAS DE ABRIR
        // ---------------------------------------------------------------------
        if (portaCount > 0) {
            // Regra 3: Largura das Portas
            if (portaCount === 1) {
                // Caso Porta Única (1 coluna)
                const larguraPorta = larguraColuna + 12;
                list.push({
                    name: 'Porta de Abrir',
                    quantity: 1,
                    height: Number(larguraPorta.toFixed(2)),
                    width: Number(alturaPortaPronta.toFixed(2)),
                    thickness: espessuraMDF,
                    edgeBanding: '4 Lados',
                    description: `Porta de abrir única para vão de 1 coluna (${larguraPorta.toFixed(1)}mm de largura)`
                });
            } else if (portaCount === 2) {
                // Caso Par de Portas (2 colunas)
                const vaoLiquidoPar = larguraColuna * 2;
                const larguraCadaPorta = (vaoLiquidoPar + 12 - 4) / 2;
                list.push({
                    name: 'Porta de Abrir',
                    quantity: 2,
                    height: Number(larguraCadaPorta.toFixed(2)),
                    width: Number(alturaPortaPronta.toFixed(2)),
                    thickness: espessuraMDF,
                    edgeBanding: '4 Lados',
                    description: `Par de portas para vão contínuo de 2 colunas (${larguraCadaPorta.toFixed(1)}mm de largura cada)`
                });
            } else {
                // Fallback de distribuição genérica para N portas em vãos múltiplos
                const vaoLiquidoGeral = larguraColuna * portaCount;
                const larguraCadaPorta = (vaoLiquidoGeral + 12 - (4 * (portaCount - 1))) / portaCount;
                list.push({
                    name: 'Porta de Abrir',
                    quantity: portaCount,
                    height: Number(larguraCadaPorta.toFixed(2)),
                    width: Number(alturaPortaPronta.toFixed(2)),
                    thickness: espessuraMDF,
                    edgeBanding: '4 Lados',
                    description: `${portaCount} portas distribuídas no vão (${larguraCadaPorta.toFixed(1)}mm de largura cada)`
                });
            }
        }

        // ---------------------------------------------------------------------
        // 11. PRATELEIRAS INTERNAS (VÃO DAS PORTAS)
        // ---------------------------------------------------------------------
        if (prateleiraCount > 0) {
            let comprimentoPrateleira = 0;

            // Regra 4: Comprimento da Prateleira Interna (Vão das Portas)
            if (portaCount >= 2) {
                // Para o vão cobrindo 2 colunas
                comprimentoPrateleira = larguraColuna * 2;
            } else if (portaCount === 1) {
                // Vão cobrindo 1 coluna
                comprimentoPrateleira = larguraColuna;
            } else {
                // Caso geral/sem portas
                comprimentoPrateleira = vaoLiquidoTotal > 0 ? vaoLiquidoTotal : larguraTotal - (2 * espessuraMDF);
            }

            // Profundidade mantida: profundidadeTotal - 10
            const profundidadePrateleira = profundidadeTotal - SLIDE_CLEARANCE.SHELF_RECESS;

            list.push({
                name: 'Prateleira Interna',
                quantity: prateleiraCount,
                height: Number(comprimentoPrateleira.toFixed(2)),
                width: Math.round(profundidadePrateleira),
                thickness: espessuraMDF,
                edgeBanding: '1L',
                description: `Prateleira interna para vão de portas (${comprimentoPrateleira.toFixed(1)}mm de comprimento x ${Math.round(profundidadePrateleira)}mm de profundidade)`
            });
        }

        return list;
    }
}

/**
 * @fileoverview Motor de Cálculo Geométrico e Lista de Corte para Marcenaria.
 * @module modules/engine/cuttingList
 */

import { SIDE_CONSTRUCTION_TYPES } from '../../config/constants.js';

/**
 * Constantes globais de tolerâncias e folgas técnicas de marcenaria em milímetros (mm).
 * @type {Readonly<{TOTAL: number, SIDE: number}>}
 */
export const SLIDE_CLEARANCE = Object.freeze({
    /** Folga total combinada para corrediças telescópicas/ocultas (13mm de cada lado) */
    TOTAL: 26,
    /** Folga individual por lateral da corrediça */
    SIDE: 13
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

        // Largura padrão fixa para as réguas/traves superiores de amarração (mm)
        const LARGURA_REGUA_SUPERIOR = 80;

        // ---------------------------------------------------------------------
        // 1. LATERAIS DA CAIXA (2x)
        // ---------------------------------------------------------------------
        let alturaLateral = 0;
        const profundidadeLateral = profundidadeTotal;

        if (sideConstruction === SIDE_CONSTRUCTION_TYPES.FLOOR) {
            alturaLateral = alturaTotal;
        } else {
            // SIDE_CONSTRUCTION_TYPES.OVER_BASE: Apóia sobre o rodapé/base
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
        // 7. CÁLCULO DAS FRENTES (LARGURA UNIFORME DE COLUNAS E ALTURAS)
        // ---------------------------------------------------------------------
        // Regra 1: Largura Uniforme de Colunas
        // vãoBrutoLargura = larguraTotal - (2 * espessuraMDF) + 12
        const vaoBrutoLargura = larguraTotal - (2 * espessuraMDF) + 12;

        // Número total de colunas verticais (Exemplo: 2 portas + 1 coluna de gavetas = 3 colunas)
        const qtdColunas = portaCount + (gavetaCount > 0 ? 1 : 0);

        let larguraFrenteUnica = 0;
        if (qtdColunas > 0) {
            const folgaTotalLargura = 2 * qtdColunas;
            // Todas as frentes (portas e colunas de gaveta) compartilham rigorosamente esta largura
            larguraFrenteUnica = (vaoBrutoLargura - folgaTotalLargura) / qtdColunas;
        }

        // Cálculo da Altura das Portas
        const espessuraBase = espessuraMDF;
        const vaoVerticalBruto = alturaTotal - alturaRodape - espessuraBase - LARGURA_REGUA_SUPERIOR + 12;
        
        // Altura base da Porta Pronta
        const alturaPortaPronta = vaoVerticalBruto - 35;

        // Regra 2: Cálculo da Altura da Frente de Gaveta baseado na Porta Pronta
        let alturaFrenteGaveta = 0;
        if (gavetaCount > 0) {
            alturaFrenteGaveta = (alturaPortaPronta + 35 - (35 * gavetaCount) - (2 * gavetaCount) - 2) / gavetaCount;
        }

        // Inserção das Frentes de Gaveta na lista de corte
        if (gavetaCount > 0) {
            list.push({
                name: 'Frente de Gaveta',
                quantity: gavetaCount,
                height: Number(larguraFrenteUnica.toFixed(2)),
                width: Number(alturaFrenteGaveta.toFixed(2)),
                thickness: espessuraMDF,
                edgeBanding: '4 Lados',
                description: `Frente externa para coluna de gavetas em largura uniforme de ${larguraFrenteUnica.toFixed(1)}mm`
            });

            // -----------------------------------------------------------------
            // 8. ESTRUTURA DA CAIXA DA GAVETA (MDF GAVETA)
            // -----------------------------------------------------------------
            const alturaLateralGaveta = alturaFrenteGaveta - 20;
            const alturaFrontalTraseiroGaveta = alturaLateralGaveta - 15;

            // Determinação do Vão Interno do Módulo para a Caixa de Gaveta
            const larguraVaoInternoGaveta = temDivisoria
                ? ((larguraTotal - (2 * espessuraMDF) - espessuraMDF) / (qtdColunas > 1 ? qtdColunas : 2))
                : (larguraTotal - (2 * espessuraMDF));

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
                description: 'Painel frontal e traseiro da caixa interna da gaveta'
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

        // Inserção das Portas na lista de corte
        if (portaCount > 0) {
            list.push({
                name: 'Porta de Abrir',
                quantity: portaCount,
                height: Number(larguraFrenteUnica.toFixed(2)),
                width: Number(alturaPortaPronta.toFixed(2)),
                thickness: espessuraMDF,
                edgeBanding: '4 Lados',
                description: `Porta frontal em coluna uniforme de ${larguraFrenteUnica.toFixed(1)}mm`
            });
        }

        // ---------------------------------------------------------------------
        // 9. PRATELEIRAS INTERNAS (PRATELEIRAS PASSANTES NOS VÃOS DAS PORTAS)
        // ---------------------------------------------------------------------
        if (prateleiraCount > 0) {
            let larguraPrateleira = 0;

            if (temDivisoria && portaCount > 0 && gavetaCount > 0) {
                // Regra 1: A prateleira interna cobre o vão contínuo das portas.
                // Exemplo: Se houver portas ocupando N colunas, o vão das portas abrange o espaço contínuo.
                const larguraVaoPortasContinuo = (larguraFrenteUnica * portaCount) + ((portaCount - 1) * 2);
                larguraPrateleira = larguraVaoPortasContinuo - 2; // Folga de encaixe
            } else if (temDivisoria) {
                // Caso haja divisória central entre dois vãos
                const vaoInternoPorDivisao = (larguraTotal - (2 * espessuraMDF) - espessuraMDF) / 2;
                larguraPrateleira = vaoInternoPorDivisao - 2;
            } else {
                // Vão único sem divisórias
                larguraPrateleira = larguraTotal - (2 * espessuraMDF) - 2;
            }

            const profundidadePrateleira = profundidadeTotal - 16; // Recuo para o fundo de 6mm e fecho das portas

            list.push({
                name: 'Prateleira Interna Passante',
                quantity: prateleiraCount,
                height: Number(larguraPrateleira.toFixed(2)),
                width: Math.round(profundidadePrateleira),
                thickness: espessuraMDF,
                edgeBanding: '1L',
                description: `Prateleira contínua para o vão das portas (${larguraPrateleira.toFixed(1)}mm de largura)`
            });
        }

        return list;
    }
}

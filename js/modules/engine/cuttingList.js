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
        // 7. CÁLCULO DE PRUMADAS E LARGURA DE FRENTES
        // ---------------------------------------------------------------------
        // totalColunas = quantidade total de vãos verticais de frentes
        const totalColunas = portaCount + (gavetaCount > 0 ? 1 : 0);

        let larguraFrenteUnica = 0;

        if (totalColunas > 0) {
            // totalPrumadas = 2 + (qtdDivisorias * 2)
            const totalPrumadas = 2 + (qtdDivisorias * 2);

            // coberturaTotal = totalPrumadas * 6
            const coberturaTotal = totalPrumadas * 6;

            // mdfTotal = somatória das espessuras das laterais e divisórias
            const mdfTotal = (2 * espessuraMDF) + (qtdDivisorias * espessuraMDF);

            // Junções de pares de portas dentro de um mesmo vão ou adjacentes
            const juncoesParesPortas = portaCount > 1 ? Math.floor(portaCount / 2) : 0;

            // vlt = larguraTotal - mdfTotal + coberturaTotal - (juncoesParesPortas * 4)
            const vlt = larguraTotal - mdfTotal + coberturaTotal - (juncoesParesPortas * 4);

            // larguraFrenteUnica = vlt / totalColunas
            larguraFrenteUnica = vlt / totalColunas;
        }

        // ---------------------------------------------------------------------
        // 8. CÁLCULO DA ALTURA DAS FRENTES (PORTAS E GAVETAS)
        // ---------------------------------------------------------------------
        const espessuraBase = espessuraMDF;
        const vaoVerticalBruto = alturaTotal - alturaRodape - espessuraBase - LARGURA_REGUA_SUPERIOR + 12;

        // Altura da Porta Pronta
        const alturaPortaPronta = vaoVerticalBruto - 35;

        // Regra 1: Cálculo exato da Altura da Frente de Gaveta
        // alturaFrenteGaveta = ((alturaPortaPronta + 35) / qtdGavetas) - 35 - 2
        let alturaFrenteGaveta = 0;
        if (gavetaCount > 0) {
            alturaFrenteGaveta = ((alturaPortaPronta + 35) / gavetaCount) - 35 - 2;
        }

        // Inserção das Frentes de Gaveta na lista
        if (gavetaCount > 0) {
            list.push({
                name: 'Frente de Gaveta',
                quantity: gavetaCount,
                height: Number(larguraFrenteUnica.toFixed(2)),
                width: Number(alturaFrenteGaveta.toFixed(2)),
                thickness: espessuraMDF,
                edgeBanding: '4 Lados',
                description: `Frente externa para coluna de gavetas em largura única de ${larguraFrenteUnica.toFixed(1)}mm`
            });

            // -----------------------------------------------------------------
            // 9. ESTRUTURA DA CAIXA DA GAVETA (MDF GAVETA)
            // -----------------------------------------------------------------
            const alturaLateralGaveta = alturaFrenteGaveta - 20;
            const alturaFrontalTraseiroGaveta = alturaLateralGaveta - 15;

            // Vão interno da gaveta por módulo
            const larguraVaoInternoGaveta = temDivisoria
                ? ((larguraTotal - (2 * espessuraMDF) - espessuraMDF) / (totalColunas > 1 ? totalColunas : 2))
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

        // Inserção das Portas na lista
        if (portaCount > 0) {
            list.push({
                name: 'Porta de Abrir',
                quantity: portaCount,
                height: Number(larguraFrenteUnica.toFixed(2)),
                width: Number(alturaPortaPronta.toFixed(2)),
                thickness: espessuraMDF,
                edgeBanding: '4 Lados',
                description: `Porta frontal em prumada uniforme de ${larguraFrenteUnica.toFixed(1)}mm`
            });
        }

        // ---------------------------------------------------------------------
        // 10. PRATELEIRAS INTERNAS (VÃO DAS PORTAS)
        // ---------------------------------------------------------------------
        if (prateleiraCount > 0) {
            let comprimentoPrateleira = 0;

            // Regra 2: Cálculo do Comprimento das Prateleiras Internas para vão de portas
            if (portaCount === 2) {
                // comprimentoPrateleira = (2 * larguraFrenteUnica) + 4 - 12 (ou seja: (2 * larguraFrenteUnica) - 8)
                comprimentoPrateleira = (2 * larguraFrenteUnica) - 8;
            } else if (portaCount === 1) {
                comprimentoPrateleira = larguraFrenteUnica - 8;
            } else if (portaCount > 2) {
                comprimentoPrateleira = (portaCount * larguraFrenteUnica) - (4 * (portaCount - 1)) - 8;
            } else {
                // Caso não haja portas (apenas gavetas/vão aberto)
                comprimentoPrateleira = larguraTotal - (2 * espessuraMDF) - 2;
            }

            // Profundidade da prateleira = Profundidade total - 10mm (SHELF_RECESS)
            const profundidadePrateleira = profundidadeTotal - SLIDE_CLEARANCE.SHELF_RECESS;

            list.push({
                name: 'Prateleira Interna',
                quantity: prateleiraCount,
                height: Number(comprimentoPrateleira.toFixed(2)),
                width: Math.round(profundidadePrateleira),
                thickness: espessuraMDF,
                edgeBanding: '1L',
                description: `Prateleira para vão de portas (${comprimentoPrateleira.toFixed(1)}mm de comprimento x ${Math.round(profundidadePrateleira)}mm de profundidade)`
            });
        }

        return list;
    }
}

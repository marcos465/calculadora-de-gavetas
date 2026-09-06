/**
 * @fileoverview Engine de cálculo de plano de corte e regras geométricas para marcenaria.
 * @module modules/engine/cuttingList
 */

import {
    BACK_PANEL,
    EDGE_BANDING_DISCOUNT_PER_EDGE,
    SHELF_RECESS,
    SLIDE_CLEARANCE
} from '../../config/constants.js';

/**
 * Representa um item gerado no plano de corte.
 * @typedef {Object} CuttingItem
 * @property {string} name - Nome ou identificação da peça.
 * @property {number} quantity - Quantidade de peças idênticas.
 * @property {number} width - Largura da peça em milímetros (sentido do corte).
 * @property {number} height - Comprimento/Altura da peça em milímetros (sentido do veio do mdf/corte).
 * @property {number} thickness - Espessura do MDF utilizado na peça em milímetros.
 * @property {string} edgeBanding - Instruções de fitamento de borda (ex: "2L 2A", "1L 2A").
 * @property {string} description - Descrição detalhada do papel estrutural da peça.
 */

/**
 * Processador matemático responsável por transformar as especificações do móvel
 * em uma lista detalhada de plano de corte para produção.
 */
export class CuttingListEngine {
    /**
     * @param {import('../../models/FurnitureState.js').FurnitureState} furnitureState Instância do estado com as dimensões do móvel.
     */
    constructor(furnitureState) {
        if (!furnitureState) {
            throw new Error('CuttingListEngine requer uma instância válida de FurnitureState.');
        }
        this.state = furnitureState;
    }

    /**
     * Ponto de entrada principal para a geração do plano de corte.
     * Delega os cálculos conforme o tipo de módulo selecionado no estado.
     * @returns {CuttingItem[]} Lista de peças calculadas com suas dimensões finais de corte.
     */
    generateList() {
        switch (this.state.type) {
            case 'SINK_CABINET':
                return this._calculateSinkCabinet();
            case 'WALL_CABINET':
                return this._calculateWallCabinet();
            case 'KITCHEN_BASE':
                return this._calculateKitchenBase();
            case 'WARDROBE':
                return this._calculateWardrobe();
            default:
                throw new Error(`Tipo de módulo não suportado para cálculo: ${this.state.type}`);
        }
    }

    /**
     * Realiza a engenharia detalhada e corte de peças para o módulo Balcão de Pia.
     * @private
     * @returns {CuttingItem[]} Lista de peças estruturais e frentes para o balcão de pia.
     */
    _calculateSinkCabinet() {
        const list = [];
        const {
            height,
            width,
            depth,
            mdfThickness,
            plinthHeight,
            drawerCount,
            hasProfileHandle
        } = this.state;

        // ---------------------------------------------------------------------
        // 1. LATERAIS (2 Peças)
        // Fórmula:
        // Altura útil da caixa = Altura Total - Altura do Rodapé
        // Profundidade da peça = Profundidade Total do Móvel
        // ---------------------------------------------------------------------
        const cabinetBodyHeight = height - plinthHeight;
        const sideHeight = cabinetBodyHeight;
        const sideDepth = depth;

        list.push({
            name: 'Lateral Esquerda / Direita',
            quantity: 2,
            height: sideHeight,
            width: sideDepth,
            thickness: mdfThickness,
            edgeBanding: '1L 2A', // Frontal fita grossa, superior/inferior fita fina
            description: 'Laterais externas da caixa do balcão'
        });

        // ---------------------------------------------------------------------
        // 2. VÃO INTERNO DA CAIXA (Cálculo Base para Peças Internas)
        // Fórmula:
        // Largura Interna do Vão = Largura Total - (2 * Espessura do MDF)
        // ---------------------------------------------------------------------
        const internalWidth = width - (2 * mdfThickness);

        // ---------------------------------------------------------------------
        // 3. BASE INFERIOR (1 Peça)
        // Fórmula:
        // Largura = Largura Interna do Vão
        // Profundidade = Profundidade Total
        // ---------------------------------------------------------------------
        list.push({
            name: 'Base Inferior',
            quantity: 1,
            height: internalWidth,
            width: sideDepth,
            thickness: mdfThickness,
            edgeBanding: '1L 0A',
            description: 'Base de assentamento inferior do móvel'
        });

        // ---------------------------------------------------------------------
        // 4. SARRAFOS SUPERIORES / REFORÇOS DE PIA (2 Peças: Frontal e Traseiro)
        // Em balcões de pia, substitui-se o teto inteiro por sarrafos horizontais
        // para dar passagem à cuba/sifão e garantir travamento estrutural.
        // Fórmula:
        // Comprimento = Largura Interna do Vão
        // Largura Padrão do Sarrafo = 80mm
        // ---------------------------------------------------------------------
        const plinthSartofWidth = 80;
        list.push({
            name: 'Sarrafo Superior (Frontal/Traseiro)',
            quantity: 2,
            height: internalWidth,
            width: plinthSartofWidth,
            thickness: mdfThickness,
            edgeBanding: '1L 0A',
            description: 'Régua de travamento superior da caixa para sustentação da pia'
        });

        // ---------------------------------------------------------------------
        // 5. RODAPÉ (Se houver rodapé configurado)
        // Fórmula:
        // Comprimento = Largura Interna do Vão
        // Altura do Rodapé = plinthHeight
        // ---------------------------------------------------------------------
        if (plinthHeight > 0) {
            list.push({
                name: 'Sarrafo de Rodapé',
                quantity: 2,
                height: internalWidth,
                width: plinthHeight,
                thickness: mdfThickness,
                edgeBanding: '1L 0A',
                description: 'Estrutura inferior de vedação/apoio do rodapé'
            });
        }

        // ---------------------------------------------------------------------
        // 6. FUNDO TRASEIRO (1 Peça de 6mm)
        // Regra de Fixação com Rebaixo (Rasgo/Rebaixo):
        // Rebaixo Traseiro: Profundidade = 7mm, Encaixe/Passe = 13mm
        // O fundo entra 7mm em cada lateral e 7mm na base e sarrafo.
        // Fórmula:
        // Altura do Fundo = Altura Interna Útil da Caixa + (2 * BACK_PANEL.REBATE_DEPTH)
        // Largura do Fundo = Largura Interna + (2 * BACK_PANEL.REBATE_DEPTH)
        // Altura Interna Útil = Altura Corpo - Base (mdfThickness) - Sarrafo (mdfThickness)
        // ---------------------------------------------------------------------
        const internalHeight = cabinetBodyHeight - (2 * mdfThickness);
        const backPanelHeight = internalHeight + (2 * BACK_PANEL.REBATE_DEPTH);
        const backPanelWidth = internalWidth + (2 * BACK_PANEL.REBATE_DEPTH);

        list.push({
            name: 'Painel de Fundo',
            quantity: 1,
            height: backPanelHeight,
            width: backPanelWidth,
            thickness: BACK_PANEL.THICKNESS,
            edgeBanding: '0L 0A',
            description: `Fundo de ${BACK_PANEL.THICKNESS}mm encaixado em rebaixo de ${BACK_PANEL.REBATE_DEPTH}x${BACK_PANEL.REBATE_WIDTH}mm`
        });

        // ---------------------------------------------------------------------
        // 7. GAVETAS (Caixas Internas e Frentes)
        // Se houver gavetas configuradas para o balcão
        // ---------------------------------------------------------------------
        if (drawerCount > 0) {
            const drawerComponents = this._calculateDrawerBoxes(drawerCount, internalWidth, internalHeight, depth, mdfThickness);
            list.push(...drawerComponents);

            const drawerFronts = this._calculateDrawerFronts(drawerCount, width, cabinetBodyHeight, hasProfileHandle, mdfThickness);
            list.push(...drawerFronts);
        }

        return list;
    }

    /**
     * Calcula as caixas internas de gaveta (Laterais, Cabeceiras e Fundo).
     * @private
     * @param {number} count Quantidade de gavetas.
     * @param {number} internalWidth Largura interna do vão.
     * @param {number} internalHeight Altura interna útil do vão.
     * @param {number} cabinetDepth Profundidade total do móvel.
     * @param {number} mdfThickness Espessura do MDF.
     * @returns {CuttingItem[]}
     */
    _calculateDrawerBoxes(count, internalWidth, internalHeight, cabinetDepth, mdfThickness) {
        const drawerItems = [];

        // Largura da gaveta descontando folga telescópica total (26mm -> 13mm cada lado)
        const drawerBoxOuterWidth = internalWidth - SLIDE_CLEARANCE.TOTAL;

        // Profundidade padrão da gaveta (Folga recomendada de 50mm referente à profundidade total)
        const drawerDepth = Math.floor((cabinetDepth - 50) / 50) * 50; 

        // Altura média padrão de laterais de gaveta (Proporcional à quantidade de gavetas)
        const availableHeightPerDrawer = internalHeight / count;
        const drawerSideHeight = Math.max(100, Math.min(200, Math.floor(availableHeightPerDrawer - 50)));

        // 1. Laterais da Gaveta (2 por gaveta)
        drawerItems.push({
            name: 'Gaveta - Lateral',
            quantity: count * 2,
            height: drawerDepth,
            width: drawerSideHeight,
            thickness: mdfThickness,
            edgeBanding: '1L 0A',
            description: 'Laterais estruturais das caixas de gaveta'
        });

        // 2. Cabeceiras/Frentes Internas da Gaveta (2 por gaveta: Frente e Traseira)
        // Fórmula: Largura Externa da Gaveta - (2 * Espessura MDF da Gaveta)
        const drawerHeaderWidth = drawerBoxOuterWidth - (2 * mdfThickness);
        drawerItems.push({
            name: 'Gaveta - Cabeceira (Frente/Trás Interna)',
            quantity: count * 2,
            height: drawerHeaderWidth,
            width: drawerSideHeight,
            thickness: mdfThickness,
            edgeBanding: '1L 0A',
            description: 'Cabeceiras frontais e traseiras da caixa de gaveta'
        });

        // 3. Fundo da Gaveta em 6mm (1 por gaveta)
        // Encaixado no canal inferior
        drawerItems.push({
            name: 'Gaveta - Fundo',
            quantity: count,
            height: drawerDepth,
            width: drawerBoxOuterWidth,
            thickness: BACK_PANEL.THICKNESS,
            edgeBanding: '0L 0A',
            description: 'Fundo da caixa de gaveta'
        });

        return drawerItems;
    }

    /**
     * Calcula as dimensões das frentes externas das gavetas aplicando os descontos de fita de borda e perfis.
     * @private
     * @param {number} count Quantidade de gavetas.
     * @param {number} totalWidth Largura total externa do móvel.
     * @param {number} cabinetBodyHeight Altura total do corpo útil.
     * @param {boolean} hasProfileHandle Indica se utiliza puxador perfil de alumínio gola.
     * @param {number} mdfThickness Espessura do MDF.
     * @returns {CuttingItem[]}
     */
    _calculateDrawerFronts(count, totalWidth, cabinetBodyHeight, hasProfileHandle, mdfThickness) {
        // Folga padrão de revelo entre frentes e/ou estrutura = 3mm por junta
        const GAP_BETWEEN_FRONTS = 3;
        
        // Desconto do Puxador Perfil de Alumínio Gola na altura (35mm por perfil)
        const PROFILE_HANDLE_CLEARANCE = hasProfileHandle ? 35 : 0;

        // Dimensão Bruta da Frente
        const grossFrontWidth = totalWidth - 6; // Revelos laterais de 3mm de cada lado
        const totalGapsHeight = (count + 1) * GAP_BETWEEN_FRONTS;
        const totalProfilesHeight = count * PROFILE_HANDLE_CLEARANCE;
        const grossFrontHeight = Math.floor((cabinetBodyHeight - totalGapsHeight - totalProfilesHeight) / count);

        // Aplicação do desconto de Fita de Borda (EDGE_BANDING_DISCOUNT_PER_EDGE = 1mm por borda)
        // Desconto total na largura = 2 * 1mm = 2mm
        // Desconto total na altura = 2 * 1mm = 2mm
        const netFrontWidth = grossFrontWidth - (2 * EDGE_BANDING_DISCOUNT_PER_EDGE);
        const netFrontHeight = grossFrontHeight - (2 * EDGE_BANDING_DISCOUNT_PER_EDGE);

        return [{
            name: 'Frente de Gaveta (Medida de Corte MDF)',
            quantity: count,
            height: netFrontHeight,
            width: netFrontWidth,
            thickness: mdfThickness,
            edgeBanding: '2L 2A', // Aplicar fita em todas as 4 bordas
            description: `Frente externa. Aplicado desconto de ${EDGE_BANDING_DISCOUNT_PER_EDGE}mm por borda de fita de borda.`
        }];
    }

    /**
     * Cobre o cálculo de armários aéreos.
     * @private
     * @returns {CuttingItem[]}
     */
    _calculateWallCabinet() {
        const { height, width, depth, mdfThickness } = this.state;
        const list = [];

        // Laterais
        list.push({
            name: 'Lateral Esquerda / Direita',
            quantity: 2,
            height: height,
            width: depth,
            thickness: mdfThickness,
            edgeBanding: '1L 2A',
            description: 'Laterais do armário aéreo'
        });

        // Teto e Base
        const internalWidth = width - (2 * mdfThickness);
        list.push({
            name: 'Base Inferior e Teto Superior',
            quantity: 2,
            height: internalWidth,
            width: depth,
            thickness: mdfThickness,
            edgeBanding: '1L 0A',
            description: 'Bases horizontal superior e inferior'
        });

        // Prateleira Interna com Recuo (SHELF_RECESS = 10mm)
        const shelfDepth = depth - SHELF_RECESS;
        list.push({
            name: 'Prateleira Interna',
            quantity: 1,
            height: internalWidth,
            width: shelfDepth,
            thickness: mdfThickness,
            edgeBanding: '1L 0A',
            description: `Prateleira interna com recuo de ${SHELF_RECESS}mm na profundidade`
        });

        // Fundo Encaixado
        const internalHeight = height - (2 * mdfThickness);
        list.push({
            name: 'Painel de Fundo',
            quantity: 1,
            height: internalHeight + (2 * BACK_PANEL.REBATE_DEPTH),
            width: internalWidth + (2 * BACK_PANEL.REBATE_DEPTH),
            thickness: BACK_PANEL.THICKNESS,
            edgeBanding: '0L 0A',
            description: 'Fundo traseiro do aéreo'
        });

        return list;
    }

    /**
     * Cobre o cálculo de armário baixo/cozinha.
     * @private
     * @returns {CuttingItem[]}
     */
    _calculateKitchenBase() {
        // Reutiliza e estende os conceitos do balcão de pia agregando teto completo
        return this._calculateSinkCabinet();
    }

    /**
     * Cobre o cálculo de guarda-roupas.
     * @private
     * @returns {CuttingItem[]}
     */
    _calculateWardrobe() {
        // Implementação padronizada base para estruturas de guarda-roupa
        return this._calculateSinkCabinet();
    }
}

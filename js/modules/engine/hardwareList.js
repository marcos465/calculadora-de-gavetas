/**
 * @fileoverview Engine de cálculo e estimativa de ferragens, suportes e insumos para marcenaria.
 * @module modules/engine/hardwareList
 */

/**
 * Item calculado de ferragem ou insumo.
 * @typedef {Object} HardwareItem
 * @property {string} item - Descrição da ferragem/insumo.
 * @property {number} quantity - Quantidade calculada.
 * @property {string} unit - Unidade de medida (ex: 'par', 'unidade', 'metro').
 * @property {string} details - Especificação e contexto de aplicação.
 */

/**
 * Calculador especializado em determinação de insumos metálicos e funcionais.
 */
export class HardwareListEngine {
    /**
     * Calcula e compila a lista detalhada de ferragens.
     * @param {import('../../models/FurnitureState.js').FurnitureState} furnitureState
     * @returns {HardwareItem[]}
     */
    generateList(furnitureState) {
        if (!furnitureState) {
            throw new Error('HardwareListEngine requer uma instância válida de FurnitureState.');
        }

        const list = [];
        const {
            height,
            width,
            depth,
            drawerCount,
            doorCount,
            shelfCount,
            hasProfileHandle,
            type,
            plinthHeight
        } = furnitureState;

        // ---------------------------------------------------------------------
        // 1. CORREDIÇAS TELESCÓPICAS
        // ---------------------------------------------------------------------
        if (drawerCount > 0) {
            const rawDepth = depth - 50;
            const slideSize = Math.min(600, Math.max(250, Math.floor(rawDepth / 50) * 50));

            list.push({
                item: `Corrediça Telescópica ${slideSize}mm`,
                quantity: drawerCount,
                unit: 'par',
                details: `1 par por gaveta (comprimento ${slideSize}mm)`
            });
        }

        // ---------------------------------------------------------------------
        // 2. DOBRADIÇAS DE PRESSÃO (35mm)
        // ---------------------------------------------------------------------
        if (doorCount > 0) {
            const cabinetBodyHeight = height - (type === 'WALL_CABINET' ? 0 : plinthHeight);
            const doorHeight = cabinetBodyHeight - 6;
            const hingesPerDoor = this._calculateHingesPerDoor(doorHeight);
            const totalHinges = doorCount * hingesPerDoor;

            list.push({
                item: 'Dobradiça Reta/Curva 35mm (Com Amortecedor)',
                quantity: totalHinges,
                unit: 'unidade',
                details: `${doorCount} porta(s) com ${hingesPerDoor} dobradiças por porta`
            });
        }

        // ---------------------------------------------------------------------
        // 3. SUPORTES DE PRATELEIRA / TAQUETES
        // ---------------------------------------------------------------------
        if (shelfCount > 0) {
            // 4 suportes/taquetes metálicos por prateleira
            const totalPins = shelfCount * 4;
            list.push({
                item: 'Suporte de Prateleira (Taquete Metal 5mm)',
                quantity: totalPins,
                unit: 'unidade',
                details: `4 suportes por prateleira para ${shelfCount} prateleira(s) interna(s)`
            });
        }

        // ---------------------------------------------------------------------
        // 4. PUXADORES / PERFIS DE ALUMÍNIO
        // ---------------------------------------------------------------------
        const totalFronts = drawerCount + doorCount;

        if (totalFronts > 0) {
            if (hasProfileHandle) {
                const profileMeters = Number(((width / 1000) * 1.1).toFixed(2));
                list.push({
                    item: 'Perfil Puxador Alumínio Tipo Gola / Y',
                    quantity: profileMeters,
                    unit: 'metro',
                    details: `Barra contínua para corte no vão total de ${width}mm`
                });

                list.push({
                    item: 'Ponteiras para Perfil Gola (Pares)',
                    quantity: totalFronts,
                    unit: 'par',
                    details: 'Ponteiras de acabamento lateral em ABS'
                });
            } else {
                list.push({
                    item: 'Puxador Alça / Ponto',
                    quantity: totalFronts,
                    unit: 'unidade',
                    details: `1 puxador por frente de gaveta ou porta`
                });
            }
        }

        // ---------------------------------------------------------------------
        // 5. PARAFUSOS E UNÕES ESTRUTURAIS
        // ---------------------------------------------------------------------
        const structuralScrews = 20 + (drawerCount * 8) + (shelfCount * 4);
        list.push({
            item: 'Parafuso Chipboard 4,0x40mm (Estrutural)',
            quantity: structuralScrews,
            unit: 'unidade',
            details: 'Fixação de caixa, divisórias e estrutura principal'
        });

        const hardwareScrews = (drawerCount * 12) + (doorCount * 8) + 16;
        list.push({
            item: 'Parafuso Chipboard 3,5x16mm (Ferragens)',
            quantity: hardwareScrews,
            unit: 'unidade',
            details: 'Fixação de dobradiças, corrediças e calços'
        });

        if (plinthHeight > 0 && type !== 'WALL_CABINET') {
            list.push({
                item: 'Sapata Niveladora L com Parafuso',
                quantity: width > 1200 ? 6 : 4,
                unit: 'unidade',
                details: 'Isolamento de umidade do solo e nivelamento'
            });
        }

        return list;
    }

    /**
     * Determina a quantidade necessária de dobradiças baseada na altura útil da porta.
     * @private
     * @param {number} doorHeight Altura da porta em mm.
     * @returns {number} Quantidade de dobradiças por porta.
     */
    _calculateHingesPerDoor(doorHeight) {
        if (doorHeight <= 900) return 2;
        if (doorHeight <= 1500) return 3;
        if (doorHeight <= 2000) return 4;
        return 5;
    }
}

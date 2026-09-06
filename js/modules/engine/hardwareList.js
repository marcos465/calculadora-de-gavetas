/**
 * @fileoverview Engine de cálculo e estimativa de ferragens e insumos para marcenaria.
 * @module modules/engine/hardwareList
 */

/**
 * Representa um item gerado no cálculo de ferragens.
 * @typedef {Object} HardwareItem
 * @property {string} item - Nome descritivo da ferragem ou acessório.
 * @property {number} quantity - Quantidade necessária.
 * @property {string} unit - Unidade de medida (ex: 'par', 'unidade', 'metro').
 * @property {string} details - Detalhes técnicos, especificações ou observações do item.
 */

/**
 * Processador técnico responsável por determinar as ferragens necessárias
 * com base na estrutura e acessórios configurados no estado do móvel.
 */
export class HardwareListEngine {
    /**
     * Ponto de entrada principal para cálculo e geração da lista de ferragens.
     * @param {import('../../models/FurnitureState.js').FurnitureState} furnitureState Instância do estado do móvel.
     * @returns {HardwareItem[]} Lista detalhada de ferragens e acessórios necessários.
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
            hasProfileHandle,
            type,
            plinthHeight
        } = furnitureState;

        // ---------------------------------------------------------------------
        // 1. CORREDIÇAS TELESCÓPICAS (1 Par por Gaveta)
        // Regra Técnica:
        // O comprimento nominal comercial da corrediça (250mm a 600mm, em passos de 50mm)
        // é determinado pela profundidade útil da gaveta (depth - 50mm de folga traseira).
        // ---------------------------------------------------------------------
        if (drawerCount > 0) {
            const rawDepth = depth - 50;
            const slideSize = Math.min(600, Math.max(250, Math.floor(rawDepth / 50) * 50));

            list.push({
                item: `Corrediça Telescópica ${slideSize}mm`,
                quantity: drawerCount,
                unit: 'par',
                details: `Tamanho nominal de ${slideSize}mm para gavetas com folga traseira`
            });
        }

        // ---------------------------------------------------------------------
        // 2. DOBRADIÇAS DE PRESSÃO (35mm)
        // Cálculo de portas estimado com base na quantidade de gavetas e tipo de móvel:
        // - Balcão de Pia / Cozinha / Aéreo sem gavetas: Assume-se 2 portas se a largura for > 500mm, senão 1 porta.
        // - Balcão com gavetas: Se a largura for grande (> 800mm), pode haver porta lateral além das gavetas.
        // Dimensionamento de dobradiças por porta baseado na altura útil da porta:
        //   - Até 900mm: 2 dobradiças por porta
        //   - 901mm a 1500mm: 3 dobradiças por porta
        //   - 1501mm a 2000mm: 4 dobradiças por porta
        //   - Acima de 2000mm: 5 dobradiças por porta
        // ---------------------------------------------------------------------
        const doorCount = this._estimateDoorCount(type, width, drawerCount);

        if (doorCount > 0) {
            const cabinetBodyHeight = height - (type === 'WALL_CABINET' ? 0 : plinthHeight);
            const doorHeight = cabinetBodyHeight - 6; // Desconto padrão de revelo
            const hingesPerDoor = this._calculateHingesPerDoor(doorHeight);
            const totalHinges = doorCount * hingesPerDoor;

            list.push({
                item: 'Dobradiça Curva/Reta 35mm (Com Amortecedor)',
                quantity: totalHinges,
                unit: 'unidade',
                details: `${doorCount} porta(s) com ${hingesPerDoor} dobradiças por porta (Altura útil: ${doorHeight}mm)`
            });
        }

        // ---------------------------------------------------------------------
        // 3. PUXADORES / PERFIS DE ALUMÍNIO
        // Se `hasProfileHandle` for verdadeiro: Puxador perfil gola em metros.
        // Caso contrário: Puxadores ponto/alça convencionais por cada frente e porta.
        // ---------------------------------------------------------------------
        const totalFronts = drawerCount + doorCount;

        if (totalFronts > 0) {
            if (hasProfileHandle) {
                // Cálculo da metragem linear necessária de perfil de alumínio Gola
                // Comprimento do perfil por frente = Largura Total do Móvel - 10mm de acabamento/ponteiras
                const profileMetersPerFront = (width - 10) / 1000;
                const totalMeters = (profileMetersPerFront * totalFronts).toFixed(2);

                list.push({
                    item: 'Perfil Puxador Alumínio Tipo Gola / Y',
                    quantity: Number(totalMeters),
                    unit: 'metro',
                    details: `Perfil continuo cortado para ${totalFronts} frente(s) de ~${width - 10}mm cada`
                });

                list.push({
                    item: 'Ponteira de Acabamento para Perfil Gola',
                    quantity: totalFronts * 2,
                    unit: 'par',
                    details: 'Ponteiras E/D de acabamento lateral para os perfis cortados'
                });
            } else {
                list.push({
                    item: 'Puxador Alça / Ponto',
                    quantity: totalFronts,
                    unit: 'unidade',
                    details: `1 puxador para cada frente de gaveta ou porta (${totalFronts} no total)`
                });
            }
        }

        // ---------------------------------------------------------------------
        // 4. FIXAÇÕES E INSUMOS ESTRUTURAIS
        // ---------------------------------------------------------------------
        // Parafuso 4.0x40mm (Soberbo / Estrutural da Caixa): ~12 parafusos por módulo base
        const structuralScrews = 16 + (drawerCount * 8);
        list.push({
            name: 'Parafuso Chipboard 4,0x40mm (Cabeça Chata)',
            item: 'Parafuso Chipboard 4,0x40mm',
            quantity: structuralScrews,
            unit: 'unidade',
            details: 'Fixação da estrutura da caixa e caixas de gaveta'
        });

        // Parafuso 3.5x16mm (Para dobradiças, corrediças e fundos)
        const hardwareScrews = (drawerCount * 12) + (doorCount * 8) + 24;
        list.push({
            item: 'Parafuso Chipboard 3,5x16mm',
            quantity: hardwareScrews,
            unit: 'unidade',
            details: 'Fixação de corrediças, dobradiças, rebaixos e cantoneiras'
        });

        // Cantoneiras de Fixação / Suporte de Parede para Aéreos
        if (type === 'WALL_CABINET') {
            list.push({
                item: 'Suporte Suspenso Oculto / Cantoneira 2 Furos com Capa',
                quantity: 2,
                unit: 'par',
                details: 'Fixação e regulagem do armário aéreo na parede'
            });
        }

        // Sapatas niveladoras para módulos com rodapé
        if (plinthHeight > 0 && type !== 'WALL_CABINET') {
            list.push({
                item: 'Sapata Niveladora Plástica L com Parafuso',
                quantity: width > 1000 ? 6 : 4,
                unit: 'unidade',
                details: 'Ajuste de nível e isolamento contra umidade do piso'
            });
        }

        return list;
    }

    /**
     * Estima o número de portas com base no tipo de móvel, largura total e gavetas.
     * @private
     * @param {string} type Tipo do móvel.
     * @param {number} width Largura total em mm.
     * @param {number} drawerCount Quantidade de gavetas.
     * @returns {number} Quantidade estimada de portas.
     */
    _estimateDoorCount(type, width, drawerCount) {
        if (drawerCount > 0 && width <= 600) {
            // Balcão estreito apenas de gavetas
            return 0;
        }

        if (drawerCount > 0 && width > 600) {
            // Módulo misto (Ex: Gaveteiro + Porta)
            return 1;
        }

        // Se não possui gavetas:
        if (width <= 500) {
            return 1;
        } else {
            return 2;
        }
    }

    /**
     * Determina o número necessário de dobradiças por porta baseado em sua altura útil.
     * @private
     * @param {number} doorHeight Altura útil da porta em mm.
     * @returns {number} Quantidade de dobradiças.
     */
    _calculateHingesPerDoor(doorHeight) {
        if (doorHeight <= 900) return 2;
        if (doorHeight <= 1500) return 3;
        if (doorHeight <= 2000) return 4;
        return 5;
    }
}

/**
 * @fileoverview Componente de interface para renderização responsiva do plano de corte e ferragens.
 * @module modules/display/cutListUI
 */

/**
 * Responsável por estruturar e renderizar as tabelas de peças e ferragens na tela mobile.
 */
export class CutListUI {
    /**
     * @param {HTMLElement} containerElement Contêiner DOM onde a listagem será montada.
     * @param {Function} onEditCallback Função disparada ao clicar no botão de editar/nova triagem.
     */
    constructor(containerElement, onEditCallback) {
        if (!containerElement) {
            throw new Error('CutListUI requer um elemento contêiner do DOM válido.');
        }
        this.container = containerElement;
        this.onEditCallback = onEditCallback;
    }

    /**
     * Renderiza as tabelas de peças, ferragens e opções de ação.
     * @param {import('../engine/cuttingList.js').CuttingItem[]} cuttingList Lista de peças calculadas.
     * @param {import('../engine/hardwareList.js').HardwareItem[]} hardwareList Lista de ferragens calculadas.
     * @param {import('../../models/FurnitureState.js').FurnitureState} state Estado atual do móvel.
     */
    render(cuttingList, hardwareList, state) {
        const moduleName = this._getModuleName(state.type);

        this.container.innerHTML = `
            <div class="results-card">
                <div class="results-header">
                    <div>
                        <h2>Plano de Corte & Insumos</h2>
                        <p class="results-subtitle">${moduleName} (${state.width} x ${state.height} x ${state.depth} mm) - MDF ${state.mdfThickness}mm</p>
                    </div>
                    <button type="button" id="btn-edit-project" class="btn btn-secondary btn-sm">
                        ✏️ Editar Projeto / Nova Triagem
                    </button>
                </div>

                <div class="summary-pills">
                    <span class="pill"><strong>Total Peças:</strong> ${this._countTotalParts(cuttingList)}</span>
                    <span class="pill"><strong>Acabamento:</strong> ${state.finishType}</span>
                    <span class="pill"><strong>Fita de Borda:</strong> Desconto de 1mm/borda</span>
                </div>

                <!-- Tabela de Peças (Lista de Corte) -->
                <div class="table-section">
                    <h3 class="table-title">🪵 Lista de Peças para Corte</h3>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Peça</th>
                                    <th class="text-center">Qtd</th>
                                    <th class="text-right">Comp. (mm)</th>
                                    <th class="text-right">Larg. (mm)</th>
                                    <th class="text-center">Esp. (mm)</th>
                                    <th class="text-center">Fita</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cuttingList.map((item) => this._renderCuttingRow(item)).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Tabela de Ferragens e Acessórios -->
                <div class="table-section">
                    <h3 class="table-title">🔩 Ferragens, Insumos e Acessórios</h3>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Item / Descrição</th>
                                    <th class="text-center">Qtd</th>
                                    <th class="text-center">Unid.</th>
                                    <th>Detalhes Técnicos</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${hardwareList.map((hw) => this._renderHardwareRow(hw)).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="results-actions">
                    <button type="button" id="btn-print-project" class="btn btn-primary">
                        🖨️ Imprimir / Salvar PDF
                    </button>
                    <button type="button" id="btn-new-project" class="btn btn-secondary">
                        🔄 Nova Triagem
                    </button>
                </div>
            </div>
        `;

        this._bindEvents();
    }

    /**
     * Renderiza uma linha individual para a tabela de peças de corte.
     * @private
     * @param {import('../engine/cuttingList.js').CuttingItem} item
     * @returns {string}
     */
    _renderCuttingRow(item) {
        return `
            <tr>
                <td class="font-medium">
                    ${item.name}
                    <small class="item-description">${item.description}</small>
                </td>
                <td class="text-center font-bold">${item.quantity}</td>
                <td class="text-right font-mono">${item.height}</td>
                <td class="text-right font-mono">${item.width}</td>
                <td class="text-center font-mono">${item.thickness}</td>
                <td class="text-center">
                    <span class="badge-edge">${item.edgeBanding}</span>
                </td>
            </tr>
        `;
    }

    /**
     * Renderiza uma linha individual para a tabela de ferragens.
     * @private
     * @param {import('../engine/hardwareList.js').HardwareItem} hw
     * @returns {string}
     */
    _renderHardwareRow(hw) {
        return `
            <tr>
                <td class="font-medium">${hw.item}</td>
                <td class="text-center font-bold">${hw.quantity}</td>
                <td class="text-center text-muted">${hw.unit}</td>
                <td class="text-muted"><small>${hw.details}</small></td>
            </tr>
        `;
    }

    /**
     * Associa eventos aos botões da tela de resultados.
     * @private
     */
    _bindEvents() {
        const btnEdit = this.container.querySelector('#btn-edit-project');
        const btnNew = this.container.querySelector('#btn-new-project');
        const btnPrint = this.container.querySelector('#btn-print-project');

        const triggerEdit = () => {
            if (typeof this.onEditCallback === 'function') {
                this.onEditCallback();
            }
        };

        if (btnEdit) btnEdit.addEventListener('click', triggerEdit);
        if (btnNew) btnNew.addEventListener('click', triggerEdit);

        if (btnPrint) {
            btnPrint.addEventListener('click', () => {
                window.print();
            });
        }
    }

    /**
     * Soma a quantidade total física de peças no plano de corte.
     * @private
     * @param {import('../engine/cuttingList.js').CuttingItem[]} list
     * @returns {number}
     */
    _countTotalParts(list) {
        return list.reduce((sum, item) => sum + item.quantity, 0);
    }

    /**
     * Mapeia o código do tipo de móvel para um nome legível.
     * @private
     * @param {string} typeId
     * @returns {string}
     */
    _getModuleName(typeId) {
        const names = {
            'SINK_CABINET': 'Balcão de Pia',
            'WALL_CABINET': 'Armário Aéreo',
            'KITCHEN_BASE': 'Armário de Cozinha',
            'WARDROBE': 'Guarda-Roupa'
        };
        return names[typeId] || 'Móvel Sob Medida';
    }
}

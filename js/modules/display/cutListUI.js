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
        if (!containerElement) {/**
 * @fileoverview Componente de Interface do Usuário (UI) para exibição responsiva da Lista de Corte
 * e Lista de Ferragens da aplicação MarcenariaCalc.
 * @module modules/display/cutListUI
 */

import { exportToCutListCSV } from '../../utils/csvExporter.js';

/**
 * Encapsula a lógica de renderização, manipulação do DOM e eventos da interface de resultados.
 */
export class CutListUI {
    /**
     * @param {string} [containerId='resultContainer'] - ID do elemento contêiner principal na página.
     */
    constructor(containerId = 'resultContainer') {
        /**
         * Referência ao contêiner HTML onde a tabela e os controles serão renderizados.
         * @type {HTMLElement|null}
         */
        this.container = document.getElementById(containerId);

        /**
         * Guarda a referência da lista de corte calculada para suporte a eventos de exportação.
         * @type {Array<import('../engine/cuttingList.js').CuttingItem>}
         */
        this.currentCuttingList = [];

        if (!this.container) {
            console.warn(`CutListUI: Elemento com ID '${containerId}' não foi localizado no DOM.`);
        }
    }

    /**
     * Renderiza o painel completo contendo a barra de ações, a tabela de peças e a lista de ferragens.
     *
     * @param {Object} data - Objeto de dados fornecido pelo app.
     * @param {Array<import('../engine/cuttingList.js').CuttingItem>} data.cuttingList - Peças calculadas do móvel.
     * @param {Array<Object>} [data.hardwareList=[]] - Lista de ferragens e insumos calculados.
     * @param {Object} [data.state] - Instância do estado do móvel (largura, altura, MDF, etc).
     * @returns {void}
     */
    render({ cuttingList = [], hardwareList = [], state = null }) {
        if (!this.container) {
            this.container = document.getElementById('resultContainer');
            if (!this.container) {
                console.error('CutListUI.render: Impossível renderizar. Contêiner de resultados não encontrado.');
                return;
            }
        }

        this.currentCuttingList = cuttingList;

        if (!Array.isArray(cuttingList) || cuttingList.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Constrói a estrutura HTML principal com suporte a layout Mobile-First
        this.container.innerHTML = `
            <section class="cutlist-panel card shadow-sm rounded-lg p-3 p-md-4 my-4">
                <header class="cutlist-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
                    <div>
                        <h2 class="h4 font-weight-bold text-dark m-0">Plano de Corte - Balcão de Pia</h2>
                        ${state ? `<p class="text-muted small m-0">Dimensões: ${state.width}mm (L) x ${state.height}mm (A) x ${state.depth}mm (P) | MDF ${state.mdfThickness}mm</p>` : ''}
                    </div>
                    <div class="action-toolbar w-100 w-md-auto">
                        <button id="btnExportCSV" type="button" class="btn btn-primary w-100 w-md-auto d-inline-flex align-items-center justify-content-center gap-2 py-2 px-3 fw-bold">
                            <span>📥</span> Baixar para CutList Optimizer (.CSV)
                        </button>
                    </div>
                </header>

                <div class="table-responsive border rounded bg-white mb-4">
                    <table class="table table-hover align-middle m-0" style="min-width: 600px;">
                        <thead class="table-dark">
                            <tr>
                                <th scope="col" class="py-2 px-3">Peça / Descrição</th>
                                <th scope="col" class="text-center py-2 px-3">Qtd</th>
                                <th scope="col" class="text-end py-2 px-3">Comprimento (mm)</th>
                                <th scope="col" class="text-end py-2 px-3">Largura (mm)</th>
                                <th scope="col" class="text-center py-2 px-3">Espessura</th>
                                <th scope="col" class="text-center py-2 px-3">Fita de Borda</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateCuttingRowsHTML(cuttingList)}
                        </tbody>
                    </table>
                </div>

                ${this.generateHardwareSectionHTML(hardwareList)}
            </section>
        `;

        // Atribui o ouvinte de evento diretamente ao botão renderizado
        this.attachEventListeners();
    }

    /**
     * Gera a marcação HTML para as linhas da tabela da lista de corte.
     *
     * @private
     * @param {Array<import('../engine/cuttingList.js').CuttingItem>} items - Itens da lista de corte.
     * @returns {string} String HTML formatada.
     */
    generateCuttingRowsHTML(items) {
        return items.map((item) => {
            const height = Number(item.height) || 0;
            const width = Number(item.width) || 0;
            const lengthDisplay = Math.max(height, width).toFixed(1);
            const widthDisplay = Math.min(height, width).toFixed(1);

            return `
                <tr>
                    <td class="py-2 px-3">
                        <strong class="d-block text-dark">${this.escapeHTML(item.name)}</strong>
                        ${item.description ? `<small class="text-muted d-block fs-7">${this.escapeHTML(item.description)}</small>` : ''}
                    </td>
                    <td class="text-center py-2 px-3 fw-bold">${item.quantity}</td>
                    <td class="text-end py-2 px-3 font-monospace fw-semibold">${lengthDisplay}</td>
                    <td class="text-end py-2 px-3 font-monospace fw-semibold">${widthDisplay}</td>
                    <td class="text-center py-2 px-3"><span class="badge bg-secondary">${item.thickness}mm</span></td>
                    <td class="text-center py-2 px-3"><span class="badge bg-light text-dark border">${this.escapeHTML(item.edgeBanding || 'Sem Fita')}</span></td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Gera o bloco de exibição para a lista de ferragens e insumos complementares.
     *
     * @private
     * @param {Array<Object>} hardwareList - Itens de ferragens.
     * @returns {string} String HTML contendo a seção de ferragens ou string vazia.
     */
    generateHardwareSectionHTML(hardwareList) {
        if (!Array.isArray(hardwareList) || hardwareList.length === 0) {
            return '';
        }

        const rows = hardwareList.map((item) => `
            <tr>
                <td class="py-2 px-3 fw-semibold text-dark">${this.escapeHTML(item.name)}</td>
                <td class="text-center py-2 px-3 font-monospace fw-bold">${item.quantity} ${this.escapeHTML(item.unit || 'un')}</td>
                <td class="py-2 px-3 text-muted small">${this.escapeHTML(item.description || '-')}</td>
            </tr>
        `).join('');

        return `
            <div class="hardware-panel mt-4 pt-3 border-top">
                <h3 class="h5 font-weight-bold text-dark mb-3">🛠️ Ferragens e Acessórios Necessários</h3>
                <div class="table-responsive border rounded bg-white">
                    <table class="table table-sm table-striped align-middle m-0">
                        <thead class="table-light">
                            <tr>
                                <th scope="col" class="py-2 px-3">Item / Ferragem</th>
                                <th scope="col" class="text-center py-2 px-3">Quantidade</th>
                                <th scope="col" class="py-2 px-3">Observação / Aplicação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * Exibe uma mensagem amigável no contêiner quando não houver dados calculados.
     *
     * @private
     * @returns {void}
     */
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="alert alert-info text-center my-4 p-4 rounded-lg shadow-sm">
                <p class="m-0 fw-semibold">Nenhum cálculo disponível no momento. Preencha as dimensões e clique em calcular para gerar o plano de corte.</p>
            </div>
        `;
    }

    /**
     * Associa os ouvintes de eventos da interface gráfica, garantindo o acionamento do download CSV.
     *
     * @private
     * @returns {void}
     */
    attachEventListeners() {
        const btnExport = this.container.querySelector('#btnExportCSV');

        if (btnExport) {
            btnExport.addEventListener('click', (event) => {
                event.preventDefault();

                if (!Array.isArray(this.currentCuttingList) || this.currentCuttingList.length === 0) {
                    alert('Não há itens na lista de corte para exportar.');
                    return;
                }

                // Dispara a exportação com tratamento de contexto e fallback de nome de arquivo
                try {
                    exportToCutListCSV(this.currentCuttingList, 'corte_balcao_cutlist.csv');
                } catch (error) {
                    console.error('Falha ao exportar a lista de corte para o CutList Optimizer:', error);
                    alert('Ocorreu um erro ao gerar o arquivo CSV de corte.');
                }
            });
        }
    }

    /**
     * Função utilitária para higienização de strings previnindo injeções de HTML (XSS).
     *
     * @private
     * @param {string} str - Texto não higienizado.
     * @returns {string} Texto seguro para injeção via template literals.
     */
    escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
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

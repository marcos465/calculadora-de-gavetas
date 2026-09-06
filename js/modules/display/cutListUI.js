/**
 * @fileoverview Componente de Interface de Usuário (UI) responsável por renderizar 
 * a Lista de Corte de Marcenaria, Tabela de Ferragens e Controles de Ação (Edição e Exportação CSV).
 * Executado 100% no lado do cliente (Client-side) em ecossistema ES6 Modules nativo.
 * 
 * @module modules/display/cutListUI
 */

import { exportToCutListCSV } from '../../utils/csvExporter.js';

/**
 * Classe responsável pelo gerenciamento do DOM e renderização do plano de corte.
 */
export class CutListUI {
    /**
     * Inicializa a instância da UI configurando o elemento contêiner de exibição.
     * @param {string|HTMLElement} [containerId='resultContainer'] - ID do elemento HTML ou nó DOM direto.
     */
    constructor(containerId = 'resultContainer') {
        /**
         * Referência ao elemento contêiner no DOM.
         * @type {HTMLElement|null}
         */
        this.container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        /**
         * Armazena localmente a lista de corte atual em memória para exportação CSV.
         * @type {Array<Object>}
         */
        this.currentCuttingList = [];

        /**
         * Callback de ação para botão de edição do projeto.
         * @type {Function|null}
         */
        this.onEditCallback = null;

        if (!this.container && typeof containerId === 'string') {
            console.warn(`[CutListUI] Contêiner inicial com ID '${containerId}' não foi localizado no DOM.`);
        }
    }

    /**
     * Renderiza o painel completo contendo o cabeçalho, ações, tabela de corte e ferragens.
     *
     * @param {Object} data - Estrutura de dados contendo o plano de corte e ferragens.
     * @param {Array<Object>} [data.cuttingList=[]] - Lista das peças calculadas.
     * @param {Array<Object>} [data.hardwareList=[]] - Lista de ferragens e insumos.
     * @param {Object|null} [data.state=null] - Estado com os parâmetros dimensionais do móvel.
     * @param {Function|null} [onEditCallback=null] - Função callback para retorno à triagem/edição.
     * @returns {void}
     */
    render({ cuttingList = [], hardwareList = [], state = null } = {}, onEditCallback = null) {
        // Reconecta ao contêiner caso ele não estivesse pronto no construtor
        if (!this.container) {
            this.container = document.getElementById('resultContainer');
            if (!this.container) {
                console.error('[CutListUI.render] Erro fatal: Contêiner "#resultContainer" não foi encontrado no DOM.');
                return;
            }
        }

        this.currentCuttingList = Array.isArray(cuttingList) ? cuttingList : [];
        this.onEditCallback = typeof onEditCallback === 'function' ? onEditCallback : null;

        // Trata o estado vazio do plano de corte
        if (this.currentCuttingList.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Extração segura das dimensões para exibição no cabeçalho
        const widthVal = state?.width || 0;
        const heightVal = state?.height || 0;
        const depthVal = state?.depth || 0;
        const mdfVal = state?.mdfThickness || 15;

        // Injeção limpa da estrutura no HTML do contêiner
        this.container.innerHTML = `
            <section class="cutlist-panel card shadow-sm rounded-lg p-3 p-md-4 my-4" aria-label="Plano de Corte e Ferragens">
                <header class="cutlist-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
                    <div class="header-info">
                        <h2 class="h4 font-weight-bold text-dark m-0">Plano de Corte - Balcão de Pia</h2>
                        <p class="text-muted small m-0 mt-1">
                            Dimensões Totais: <strong>${widthVal}mm</strong> (L) x <strong>${heightVal}mm</strong> (A) x <strong>${depthVal}mm</strong> (P) | MDF: <strong>${mdfVal}mm</strong>
                        </p>
                    </div>
                    <div class="action-toolbar w-100 w-md-auto d-flex flex-column flex-sm-row gap-2">
                        <button id="btn-edit-project" type="button" class="btn btn-outline-secondary w-100 w-sm-auto d-inline-flex align-items-center justify-content-center gap-2 py-2 px-3 fw-semibold">
                            ✏️ Editar / Nova Triagem
                        </button>
                        <button id="btnExportCSV" type="button" class="btn btn-primary w-100 w-sm-auto d-inline-flex align-items-center justify-content-center gap-2 py-2 px-3 fw-bold">
                            📥 Baixar para CutList Optimizer (.CSV)
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
                            ${this.generateCuttingRowsHTML(this.currentCuttingList, state)}
                        </tbody>
                    </table>
                </div>

                ${this.generateHardwareSectionHTML(hardwareList)}
            </section>
        `;

        // Atribuição de ouvintes de eventos
        this.attachEventListeners(this.onEditCallback);
    }

    /**
     * Gera as linhas HTML para a tabela da lista de corte tratando resiliência de dados para evitar NaN.
     *
     * @private
     * @param {Array<Object>} items - Array de peças da lista de corte.
     * @param {Object|null} state - Estado global da aplicação para fallback de espessura.
     * @returns {string} String com o HTML formatado das linhas (<tr>).
     */
    generateCuttingRowsHTML(items, state = null) {
        if (!Array.isArray(items) || items.length === 0) {
            return `<tr><td colspan="6" class="text-center py-3 text-muted">Nenhuma peça listada.</td></tr>`;
        }

        return items.map((item) => {
            // Leitura resiliente dos valores numéricos com fallbacks
            const rawLength = Number(item.length || item.height || 0);
            const rawWidth = Number(item.width || 0);
            const quantity = Number(item.quantity || item.qty || 1);
            const thickness = Number(item.thickness || state?.mdfThickness || 15);

            // Regra do CutList Optimizer: Comprimento >= Largura
            const lengthDisplay = Math.max(rawLength, rawWidth).toFixed(1);
            const widthDisplay = Math.min(rawLength, rawWidth).toFixed(1);

            // Tratamento das propriedades de texto
            const name = this.escapeHTML(item.name || item.label || 'Peça sem nome');
            const description = item.description ? this.escapeHTML(item.description) : '';
            const edgeBanding = this.escapeHTML(item.edgeBanding || 'Sem Fita');

            return `
                <tr>
                    <td class="py-2 px-3">
                        <strong class="d-block text-dark">${name}</strong>
                        ${description ? `<small class="text-muted d-block fs-7">${description}</small>` : ''}
                    </td>
                    <td class="text-center py-2 px-3 fw-bold">${quantity}</td>
                    <td class="text-end py-2 px-3 font-monospace fw-semibold">${lengthDisplay}</td>
                    <td class="text-end py-2 px-3 font-monospace fw-semibold">${widthDisplay}</td>
                    <td class="text-center py-2 px-3"><span class="badge bg-secondary">${thickness}mm</span></td>
                    <td class="text-center py-2 px-3"><span class="badge bg-light text-dark border">${edgeBanding}</span></td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Gera o bloco de exibição e a tabela HTML de ferragens e insumos.
     *
     * @private
     * @param {Array<Object>} hardwareList - Array com os itens de ferragens.
     * @returns {string} String HTML contendo a seção de ferragens.
     */
    generateHardwareSectionHTML(hardwareList) {
        if (!Array.isArray(hardwareList) || hardwareList.length === 0) {
            return '';
        }

        const rows = hardwareList.map((item) => {
            const name = this.escapeHTML(item.name || 'Item de Ferragem');
            const quantity = Number(item.quantity || item.qty || 1);
            const unit = this.escapeHTML(item.unit || 'un');
            const description = this.escapeHTML(item.description || '-');

            return `
                <tr>
                    <td class="py-2 px-3 fw-semibold text-dark">${name}</td>
                    <td class="text-center py-2 px-3 font-monospace fw-bold">${quantity} ${unit}</td>
                    <td class="py-2 px-3 text-muted small">${description}</td>
                </tr>
            `;
        }).join('');

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
     * Renderiza o estado padrão para quando não houver cálculos disponíveis.
     *
     * @private
     * @returns {void}
     */
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="alert alert-info text-center my-4 p-4 rounded-lg shadow-sm">
                <p class="m-0 fw-semibold">Nenhum cálculo disponível. Preencha as dimensões do balcão de pia e clique em calcular para exibir o plano de corte.</p>
            </div>
        `;
    }

    /**
     * Vincula os eventos de clique aos botões do painel renderizado no DOM.
     *
     * @private
     * @param {Function|null} onEditCallback - Função de callback opcional para o botão de editar.
     * @returns {void}
     */
    attachEventListeners(onEditCallback = null) {
        // Evento para Exportação CSV do CutList Optimizer
        const btnExport = this.container.querySelector('#btnExportCSV');
        if (btnExport) {
            btnExport.addEventListener('click', (event) => {
                event.preventDefault();
                exportToCutListCSV(this.currentCuttingList, 'corte_balcao_cutlist.csv');
            });
        }

        // Evento para Editar / Nova Triagem
        const btnEdit = this.container.querySelector('#btn-edit-project');
        if (btnEdit) {
            btnEdit.addEventListener('click', (event) => {
                event.preventDefault();
                if (typeof onEditCallback === 'function') {
                    onEditCallback();
                }
            });
        }
    }

    /**
     * Sanitiza textos convertendo caracteres especiais em entidades HTML
     * para prevenir falhas de segurança do tipo Cross-Site Scripting (XSS).
     *
     * @private
     * @param {string} str - Texto não confiável.
     * @returns {string} Texto sanitizado.
     */
    escapeHTML(str) {
        if (typeof str !== 'string') {
            return '';
        }
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

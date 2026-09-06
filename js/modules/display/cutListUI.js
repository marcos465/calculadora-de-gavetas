/**
 * @fileoverview Componente de Interface de Usuário (UI) responsável por renderizar 
 * a Lista de Corte de Marcenaria, Ferragens e integrar os controles de exportação CSV.
 * Compatível com execução client-side em navegadores modernos (GitHub Pages).
 * 
 * @module modules/display/cutListUI
 */

import { exportToCutListCSV } from '../../utils/csvExporter.js';

/**
 * Encapsula a lógica de apresentação e renderização do plano de corte no DOM.
 */
export class CutListUI {
    /**
     * @param {string} [containerId='resultContainer'] - ID do elemento contêiner HTML principal.
     */
    constructor(containerId = 'resultContainer') {
        /**
         * Referência ao contêiner HTML onde a tabela e as ações serão injetadas.
         * @type {HTMLElement|null}
         */
        this.container = document.getElementById(containerId);

        /**
         * Armazena localmente a lista de peças calculada para reuso nos eventos de exportação.
         * @type {Array<Object>}
         */
        this.currentCuttingList = [];

        if (!this.container) {
            console.warn(`[CutListUI] Contêiner com ID '${containerId}' não foi localizado no DOM inicial.`);
        }
    }

    /**
     * Renderiza o painel completo contendo a lista de corte, ferragens e o botão de exportação.
     *
     * @param {Object} data - Objeto contendo os dados processados do móvel.
     * @param {Array<Object>} data.cuttingList - Lista das peças de corte calculadas.
     * @param {Array<Object>} [data.hardwareList=[]] - Lista das ferragens e insumos.
     * @param {Object} [data.state=null] - Instância de dados com os parâmetros do móvel.
     * @returns {void}
     */
    render({ cuttingList = [], hardwareList = [], state = null }) {
        if (!this.container) {
            this.container = document.getElementById('resultContainer');
            if (!this.container) {
                console.error('[CutListUI.render] Impossível renderizar. O contêiner "#resultContainer" não existe no DOM.');
                return;
            }
        }

        // Atualiza a referência das peças em memória
        this.currentCuttingList = Array.isArray(cuttingList) ? cuttingList : [];

        if (this.currentCuttingList.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Renderização do painel completo seguindo design Mobile-First
        this.container.innerHTML = `
            <section class="cutlist-panel card shadow-sm rounded-lg p-3 p-md-4 my-4" aria-label="Plano de Corte e Acessórios">
                <header class="cutlist-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
                    <div class="header-info">
                        <h2 class="h4 font-weight-bold text-dark m-0">Plano de Corte - Balcão de Pia</h2>
                        ${state ? `<p class="text-muted small m-0 mt-1">Dimensões Totais: ${state.width}mm (L) x ${state.height}mm (A) x ${state.depth}mm (P) | MDF ${state.mdfThickness}mm</p>` : ''}
                    </div>
                    <div class="action-toolbar w-100 w-md-auto mt-2 mt-md-0">
                        <button id="btnExportCSV" type="button" class="btn-primary w-100 w-md-auto d-inline-flex align-items-center justify-content-center gap-2 py-2 px-3 fw-bold">
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
                            ${this.generateCuttingRowsHTML(this.currentCuttingList)}
                        </tbody>
                    </table>
                </div>

                ${this.generateHardwareSectionHTML(hardwareList)}
            </section>
        `;

        // Atribui os ouvintes de eventos logo após a injeção do HTML no DOM
        this.attachEventListeners();
    }

    /**
     * Gera a marcação HTML para as linhas da tabela de corte.
     *
     * @private
     * @param {Array<Object>} items - Array de objetos representando as peças.
     * @returns {string} String HTML formatada.
     */
    generateCuttingRowsHTML(items) {
        return items.map((item) => {
            const rawLength = item.length !== undefined ? item.length : item.height;
            const lengthNum = Number(rawLength) || 0;
            const widthNum = Number(item.width) || 0;

            const lengthDisplay = Math.max(lengthNum, widthNum).toFixed(1);
            const widthDisplay = Math.min(lengthNum, widthNum).toFixed(1);

            return `
                <tr>
                    <td class="py-2 px-3">
                        <strong class="d-block text-dark">${this.escapeHTML(item.name || item.label || 'Peça sem nome')}</strong>
                        ${item.description ? `<small class="text-muted d-block fs-7">${this.escapeHTML(item.description)}</small>` : ''}
                    </td>
                    <td class="text-center py-2 px-3 fw-bold">${item.quantity || item.qty || 1}</td>
                    <td class="text-end py-2 px-3 font-monospace fw-semibold">${lengthDisplay}</td>
                    <td class="text-end py-2 px-3 font-monospace fw-semibold">${widthDisplay}</td>
                    <td class="text-center py-2 px-3"><span class="badge bg-secondary">${item.thickness || 15}mm</span></td>
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
     * Exibe um estado amigável quando não houver peças calculadas para exibição.
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
     * Conecta o ouvinte de evento de clique ao botão de exportação CSV.
     *
     * @private
     * @returns {void}
     */
    attachEventListeners() {
        const btnExport = this.container.querySelector('#btnExportCSV');

        if (btnExport) {
            btnExport.addEventListener('click', (event) => {
                event.preventDefault();

                // Dispara a exportação utilizando a função importada do módulo csvExporter.js
                exportToCutListCSV(this.currentCuttingList, 'corte_balcao_cutlist.csv');
            });
        }
    }

    /**
     * Método utilitário de segurança para prevenção de vulnerabilidades Cross-Site Scripting (XSS).
     *
     * @private
     * @param {string} str - Texto de entrada.
     * @returns {string} String com entidades HTML devidamente escapadas.
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

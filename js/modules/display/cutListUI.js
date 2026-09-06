/**
 * @fileoverview Componente de Interface de Usuário (UI) responsável por renderizar 
 * a Lista de Corte de Marcenaria, Lista de Ferragens e a toolbar de exportação para o CutList Optimizer.
 * Desenvolvido em Vanilla JS ES6 nativo, otimizado para navegadores e hospedagem no GitHub Pages.
 * 
 * @module modules/display/cutListUI
 */

import { exportToCutListCSV } from '../../utils/csvExporter.js';

/**
 * Encapsula a lógica de apresentação e renderização do plano de corte e ferragens no DOM.
 */
export class CutListUI {
    /**
     * Inicializa o componente CutListUI vinculando o contêiner de exibição.
     * @param {string|HTMLElement} [containerId='resultContainer'] - ID do elemento HTML ou referência direta ao nó DOM.
     */
    constructor(containerId = 'resultContainer') {
        /**
         * Referência ao nó DOM do contêiner onde a UI será renderizada.
         * @type {HTMLElement|null}
         */
        this.container = typeof containerId === 'string' 
            ? document.getElementById(containerId) 
            : containerId;

        /**
         * Estado em memória da lista de corte mais recente para suporte à exportação CSV.
         * @type {Array<Object>}
         */
        this.currentCuttingList = [];

        /**
         * Referência para o callback de edição de formulário / nova triagem.
         * @type {Function|null}
         */
        this.onEditCallback = null;

        if (!this.container && typeof containerId === 'string') {
            console.warn(`[CutListUI] Contêiner com ID '${containerId}' não foi localizado no DOM inicial.`);
        }
    }

    /**
     * Renderiza o painel completo contendo o cabeçalho, ações, tabela de corte e tabela de ferragens.
     *
     * @param {Object} data - Objeto contendo as listas calculadas e estado do projeto.
     * @param {Array<Object>} [data.cuttingList=[]] - Lista das peças de corte calculadas.
     * @param {Array<Object>} [data.hardwareList=[]] - Lista das ferragens e insumos necessários.
     * @param {Object|null} [data.state=null] - Dados dimensionais e especificações do móvel.
     * @param {Function|null} [onEditCallback=null] - Callback disparado ao clicar no botão de editar triagem.
     * @returns {void}
     */
    render({ cuttingList = [], hardwareList = [], state = null } = {}, onEditCallback = null) {
        // Garantia de reconexão ao contêiner caso o nó não estivesse disponível na instanciação
        if (!this.container) {
            this.container = document.getElementById('resultContainer');
            if (!this.container) {
                console.error('[CutListUI.render] Impossível renderizar. O contêiner de resultados não existe no DOM.');
                return;
            }
        }

        this.onEditCallback = onEditCallback;
        this.currentCuttingList = Array.isArray(cuttingList) ? cuttingList : [];

        // Validação e exibição de estado vazio se a lista de corte for inválida ou sem itens
        if (this.currentCuttingList.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Injeção limpa da estrutura HTML Mobile-First
        this.container.innerHTML = `
            <section class="cutlist-panel card shadow-sm rounded-lg p-3 p-md-4 my-4" aria-label="Plano de Corte e Ferragens">
                <header class="cutlist-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
                    <div class="header-info">
                        <h2 class="h4 font-weight-bold text-dark m-0">Plano de Corte - Balcão de Pia</h2>
                        ${state ? `
                            <p class="text-muted small m-0 mt-1">
                                Dimensões: <strong>${state.width || 0}mm</strong> (L) x <strong>${state.height || 0}mm</strong> (A) x <strong>${state.depth || 0}mm</strong> (P) | MDF: <strong>${state.mdfThickness || 15}mm</strong>
                            </p>
                        ` : ''}
                    </div>
                    <div class="action-toolbar w-100 w-md-auto d-flex flex-column flex-sm-row gap-2">
                        <button id="btnEditTriage" type="button" class="btn btn-outline-secondary w-100 w-sm-auto d-inline-flex align-items-center justify-content-center gap-2 py-2 px-3 fw-semibold">
                            ✏️ Editar Triagem
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
                            ${this.generateCuttingRowsHTML(this.currentCuttingList)}
                        </tbody>
                    </table>
                </div>

                ${this.generateHardwareSectionHTML(hardwareList)}
            </section>
        `;

        // Registro imediato dos escutadores de eventos no DOM recém-criado
        this.attachEventListeners();
    }

    /**
     * Gera as linhas HTML da tabela da lista de corte com higienização e tratamento de dimensões.
     *
     * @private
     * @param {Array<Object>} items - Array de peças da lista de corte.
     * @returns {string} String HTML formatada com as tr/td da tabela.
     */
    generateCuttingRowsHTML(items) {
        return items.map((item) => {
            const rawLength = item.length !== undefined ? item.length : item.height;
            const lengthNum = Number(rawLength) || 0;
            const widthNum = Number(item.width) || 0;

            // Orientação de corte: Comprimento deve ser a maior dimensão para o CutList Optimizer
            const lengthDisplay = Math.max(lengthNum, widthNum).toFixed(1);
            const widthDisplay = Math.min(lengthNum, widthNum).toFixed(1);

            const quantity = Number(item.quantity || item.qty || 1);
            const thickness = item.thickness || 15;
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
     * Gera a seção e tabela HTML para exibição das ferragens e insumos.
     *
     * @private
     * @param {Array<Object>} hardwareList - Lista das ferragens calculadas.
     * @returns {string} String HTML contendo o bloco visual de ferragens.
     */
    generateHardwareSectionHTML(hardwareList) {
        if (!Array.isArray(hardwareList) || hardwareList.length === 0) {
            return '';
        }

        const rows = hardwareList.map((item) => {
            const name = this.escapeHTML(item.name || 'Item de Ferragem');
            const quantity = item.quantity || 1;
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
     * Renderiza uma mensagem visual para estado de dados ausentes ou lista vazia.
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
     * Atribui os ouvintes de evento nos botões interativos injetados no DOM.
     *
     * @private
     * @returns {void}
     */
    attachEventListeners() {
        // Evento do botão de exportação CSV
        const btnExport = this.container.querySelector('#btnExportCSV');
        if (btnExport) {
            btnExport.addEventListener('click', (event) => {
                event.preventDefault();
                exportToCutListCSV(this.currentCuttingList, 'corte_balcao_cutlist.csv');
            });
        }

        // Evento do botão de editar / nova triagem
        const btnEdit = this.container.querySelector('#btnEditTriage');
        if (btnEdit) {
            btnEdit.addEventListener('click', (event) => {
                event.preventDefault();
                if (typeof this.onEditCallback === 'function') {
                    this.onEditCallback();
                }
            });
        }
    }

    /**
     * Higieniza textos de entrada convertendo caracteres especiais em entidades HTML
     * para mitigar ataques de Cross-Site Scripting (XSS).
     *
     * @private
     * @param {string} str - String não confiável.
     * @returns {string} String sanitizada e segura para injeção via Template String.
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

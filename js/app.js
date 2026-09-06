/**
 * @fileoverview Ponto de entrada principal da aplicação MarcenariaCalc.
 * Unifica o fluxo de validação da triagem, execução dos motores de cálculo
 * (lista de corte e ferragens), renderização da interface e exportação para CSV.
 * 
 * @module app
 */

import { FurnitureState } from './models/FurnitureState.js';
import { CuttingListEngine } from './modules/engine/cuttingList.js';
import { HardwareListEngine } from './modules/engine/hardwareList.js';
import { CutListUI } from './modules/display/cutListUI.js';
import { exportToCutListCSV } from './utils/csvExporter.js';

/**
 * Classe principal de orquestração do ecossistema Client-Side.
 */
class App {
    constructor() {
        /**
         * Instância compartilhada do estado do móvel.
         * @type {FurnitureState|null}
         */
        this.furnitureState = null;

        /**
         * Instância do renderizador da interface gráfica da lista de corte.
         * @type {CutListUI|null}
         */
        this.cutListUI = null;

        /**
         * Armazena em memória a lista de corte calculada mais recente para exportação.
         * @type {Array<import('./modules/engine/cuttingList.js').CuttingItem>}
         */
        this.currentCuttingList = [];

        /**
         * Armazena em memória a lista de ferragens calculada mais recente.
         * @type {Array<Object>}
         */
        this.currentHardwareList = [];
    }

    /**
     * Inicializa os módulos, seletores de interface e escutadores de eventos principais.
     * @returns {void}
     */
    init() {
        try {
            this.furnitureState = new FurnitureState();
            this.cutListUI = new CutListUI();

            this.bindEvents();
        } catch (error) {
            console.error('Erro durante a inicialização do MarcenariaCalc:', error);
            this.showNotification('Erro ao inicializar a aplicação. Verifique o console.', 'error');
        }
    }

    /**
     * Registra os eventos da interface do usuário (Formulário/Triagem e Botões Globais).
     * @returns {void}
     */
    bindEvents() {
        const formTriage = document.getElementById('formTriage') || document.getElementById('furnitureForm');
        
        if (formTriage) {
            formTriage.addEventListener('submit', (event) => this.handleTriageSubmit(event));
        }

        // Delegação de evento ou escuta direta no container de resultados para garantir escuta do botão de exportação
        const resultContainer = document.getElementById('resultContainer') || document.body;
        resultContainer.addEventListener('click', (event) => this.handleGlobalClick(event));
    }

    /**
     * Processa a submissão e validação do formulário de triagem de marcenaria.
     * @param {Event} event - Evento nativo de submissão do formulário.
     * @returns {void}
     */
    handleTriageSubmit(event) {
        event.preventDefault();

        try {
            // 1. Atualiza o estado da aplicação coletando os inputs do formulário
            const formElement = event.target;
            this.furnitureState.updateFromForm(formElement);

            // Validação das entradas fornecidas
            const validation = this.furnitureState.validate();
            if (!validation.isValid) {
                this.showNotification(`Atenção: ${validation.message}`, 'warning');
                return;
            }

            // 2. Executa os motores de cálculo geométrico e quantitativo
            const cuttingEngine = new CuttingListEngine(this.furnitureState);
            const hardwareEngine = new HardwareListEngine(this.furnitureState);

            this.currentCuttingList = cuttingEngine.generateList();
            this.currentHardwareList = hardwareEngine.generateList();

            // 3. Renderiza os resultados na interface do usuário
            this.cutListUI.render({
                cuttingList: this.currentCuttingList,
                hardwareList: this.currentHardwareList,
                state: this.furnitureState
            });

            this.showNotification('Lista de corte e ferragens calculadas com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao processar o cálculo do balcão:', error);
            this.showNotification('Erro interno ao calcular a lista de corte. Verifique os dados inseridos.', 'error');
        }
    }

    /**
     * Trata os cliques globais na interface, capturando interações com botões dinâmicos (ex: #btnExportCSV).
     * @param {MouseEvent} event - Evento nativo de clique.
     * @returns {void}
     */
    handleGlobalClick(event) {
        const target = /** @type {HTMLElement} */ (event.target);
        const exportBtn = target.closest('#btnExportCSV');

        if (exportBtn) {
            event.preventDefault();
            this.handleCSVExport();
        }
    }

    /**
     * Executa a exportação da lista de corte calculada para o formato CSV do CutList Optimizer.
     * @returns {void}
     */
    handleCSVExport() {
        try {
            if (!Array.isArray(this.currentCuttingList) || this.currentCuttingList.length === 0) {
                this.showNotification('A lista de corte está vazia. Calcule o projeto antes de exportar.', 'warning');
                return;
            }

            // Dispara o utilitário nativo de download do CSV
            exportToCutListCSV(this.currentCuttingList, 'corte_balcao_cutlist.csv');
            
            this.showNotification('Arquivo CSV exportado com sucesso para o CutList Optimizer!', 'success');

        } catch (error) {
            console.error('Erro ao exportar a lista de corte para CSV:', error);
            this.showNotification('Ocorreu uma falha ao gerar o arquivo CSV de corte.', 'error');
        }
    }

    /**
     * Exibe mensagens visuais e alertas de feedback para o usuário na interface.
     * @param {string} message - Texto da mensagem.
     * @param {'success'|'warning'|'error'|'info'} [type='info'] - Nível visual da notificação.
     * @returns {void}
     */
    showNotification(message, type = 'info') {
        const notificationContainer = document.getElementById('notificationContainer');

        if (notificationContainer) {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;

            notificationContainer.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        } else {
            // Fallback limpo caso o container de notificações não exista no DOM
            if (type === 'error' || type === 'warning') {
                alert(message);
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        }
    }
}

// Inicialização segura da aplicação quando a árvore DOM estiver totalmente carregada
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

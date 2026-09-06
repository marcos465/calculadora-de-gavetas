/**
 * @fileoverview Ponto de entrada principal da aplicação MarcenariaCalc.
 * Responsável por gerenciar o ciclo de vida da aplicação client-side, escutar os
 * eventos do formulário de triagem, orquestrar os motores de cálculo de peças e ferragens,
 * e acionar a interface de exibição (CutListUI).
 * 
 * Compatível com execução 100% Client-side e hospedagem no GitHub Pages.
 * 
 * @module app
 */

import { FurnitureState } from './models/FurnitureState.js';
import { CuttingListEngine } from './modules/engine/cuttingList.js';
import { HardwareListEngine } from './modules/engine/hardwareList.js';
import { CutListUI } from './modules/display/cutListUI.js';

/**
 * Classe responsável pelo gerenciamento de eventos e estado da aplicação principal.
 */
class MarcenariaCalcApp {
    /**
     * Inicializa os seletores da aplicação e instâncias de módulos.
     */
    constructor() {
        /**
         * Instância do renderizador da interface gráfica da lista de corte.
         * @type {CutListUI|null}
         */
        this.cutListUI = null;

        /**
         * Elemento HTML do formulário de triagem.
         * @type {HTMLFormElement|null}
         */
        this.formElement = null;

        /**
         * Elemento contêiner do formulário de triagem para alternância visual/scroll.
         * @type {HTMLElement|null}
         */
        this.formContainer = null;

        /**
         * Elemento contêiner dos resultados.
         * @type {HTMLElement|null}
         */
        this.resultContainer = null;
    }

    /**
     * Inicializa a aplicação configurando as instâncias e registrando os ouvintes de eventos.
     * @returns {void}
     */
    init() {
        try {
            // Instancia a UI apontando para o contêiner de exibição
            this.cutListUI = new CutListUI('resultContainer');

            // Captura de elementos do DOM
            this.formElement = document.getElementById('furniture-form');
            this.formContainer = document.getElementById('formContainer') || document.querySelector('.form-section') || this.formElement;
            this.resultContainer = document.getElementById('resultContainer');

            if (!this.formElement) {
                console.error('[MarcenariaCalcApp] Formulário "#furniture-form" não encontrado no DOM.');
                return;
            }

            // Registra os ouvintes de eventos
            this.bindEvents();

        } catch (error) {
            console.error('[MarcenariaCalcApp] Erro crítico ao inicializar a aplicação:', error);
        }
    }

    /**
     * Registra todos os escutadores de eventos globais do aplicativo.
     * @private
     * @returns {void}
     */
    bindEvents() {
        this.formElement.addEventListener('submit', (event) => this.handleFormSubmit(event));
    }

    /**
     * Processa a submissão do formulário de triagem, realiza os cálculos e atualiza a UI.
     * 
     * @private
     * @param {SubmitEvent} event - Evento de submissão do formulário.
     * @returns {void}
     */
    handleFormSubmit(event) {
        event.preventDefault();

        try {
            // 1. Extração dos dados do formulário
            const formData = new FormData(this.formElement);
            const rawData = Object.fromEntries(formData.entries());

            // 2. Instanciação do modelo de estado do móvel com conversão e sanitização de dados
            const state = new FurnitureState({
                width: Number(rawData.width || rawData.largura),
                height: Number(rawData.height || rawData.altura),
                depth: Number(rawData.depth || rawData.profundidade),
                mdfThickness: Number(rawData.mdfThickness || rawData.espessuraMdf || 15),
                backPanelThickness: Number(rawData.backPanelThickness || rawData.espessuraFundo || 3),
                doorsQuantity: Number(rawData.doorsQuantity || rawData.qtdPortas || 2),
                shelvesQuantity: Number(rawData.shelvesQuantity || rawData.qtdPrateleiras || 1),
                drawersQuantity: Number(rawData.drawersQuantity || rawData.qtdGavetas || 0),
                rawInputs: rawData
            });

            // Validação simples do modelo antes dos cálculos
            if (typeof state.validate === 'function') {
                const validation = state.validate();
                if (!validation.isValid) {
                    alert(`Atenção nos dados informados: ${validation.message}`);
                    return;
                }
            }

            // 3. Execução dos motores de cálculo
            const cuttingList = CuttingListEngine.calculate(state);
            const hardwareList = HardwareListEngine.calculate(state);

            // 4. Disparo da renderização na interface do usuário com callback de edição
            this.cutListUI.render(
                { cuttingList, hardwareList, state },
                () => this.handleEditProject()
            );

            // 5. Transição suave de tela para o container de resultados
            if (this.resultContainer) {
                this.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

        } catch (error) {
            console.error('[MarcenariaCalcApp] Erro durante o processamento do cálculo:', error);
            alert('Ocorreu um erro ao calcular o plano de corte. Verifique os valores preenchidos.');
        }
    }

    /**
     * Permite ao usuário retornar ao formulário para ajustar parâmetros do móvel.
     * Realiza rolagem suave de volta para a seção do formulário de triagem.
     * 
     * @returns {void}
     */
    handleEditProject() {
        if (this.formContainer) {
            this.formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Foca no primeiro campo input do formulário para facilitar a usabilidade
            const firstInput = this.formElement ? this.formElement.querySelector('input, select') : null;
            if (firstInput) {
                setTimeout(() => firstInput.focus({ preventScroll: true }), 400);
            }
        }
    }
}

// Inicialização segura após o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new MarcenariaCalcApp();
    app.init();
});

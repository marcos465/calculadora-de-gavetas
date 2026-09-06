/**
 * @fileoverview Componente de Interface de Usuário (UI) responsável por renderizar 
 * dinamicamente o formulário de triagem para captura das especificações do móvel.
 * Operação 100% Client-side utilizando Vanilla JS e ES6 Modules.
 * 
 * @module modules/display/triagemFormUI
 */

/**
 * Classe responsável pelo gerenciamento da renderização do formulário de triagem no DOM.
 */
export class TriagemFormUI {
    /**
     * Inicializa a instância da UI do formulário associando o contêiner de destino.
     * @param {string|HTMLElement} [containerId='formContainer'] - ID do elemento HTML ou referência direta ao nó DOM.
     */
    constructor(containerId = 'formContainer') {
        /**
         * Referência ao elemento contêiner no DOM.
         * @type {HTMLElement|null}
         */
        this.container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        if (!this.container && typeof containerId === 'string') {
            console.warn(`[TriagemFormUI] Contêiner com ID '${containerId}' não foi localizado no DOM durante a instanciação.`);
        }
    }

    /**
     * Renderiza o formulário de triagem dentro do contêiner configurado.
     * Reconecta ao DOM caso o elemento não tenha sido localizado no construtor.
     * 
     * @returns {void}
     */
    render() {
        if (!this.container) {
            this.container = document.getElementById('formContainer');
            if (!this.container) {
                console.error('[TriagemFormUI.render] Erro fatal: Contêiner "#formContainer" não foi encontrado no DOM.');
                return;
            }
        }

        this.container.innerHTML = `
            <div class="card shadow-sm rounded-lg p-3 p-md-4 my-3">
                <h2 class="card-title h4 font-weight-bold text-dark mb-4">Triagem do Móvel</h2>
                <form id="furniture-form" class="furniture-form" novalidate>
                    
                    <fieldset class="form-group-group mb-4 border-0 p-0">
                        <legend class="h6 font-weight-semibold text-secondary mb-3">Tipo do Móvel</legend>
                        <div class="form-row">
                            <div class="form-group col-12">
                                <label for="type" class="form-label font-weight-medium text-dark">Tipo de Móvel:</label>
                                <select id="type" name="type" class="form-select form-control" required>
                                    <option value="balcao_pia" selected>Balcão de Pia</option>
                                    <option value="armario_aereo">Armário Aéreo</option>
                                    <option value="balcao_gaveteiro">Balcão Gaveteiro</option>
                                    <option value="paneleiro">Paneleiro / Armário Alto</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset class="form-group-group mb-4 border-0 p-0">
                        <legend class="h6 font-weight-semibold text-secondary mb-3">Dimensões Totais (mm)</legend>
                        <div class="form-row row g-3">
                            <div class="form-group col-12 col-md-4">
                                <label for="width" class="form-label font-weight-medium text-dark">Largura (mm):</label>
                                <input 
                                    type="number" 
                                    id="width" 
                                    name="width" 
                                    class="form-control" 
                                    min="100" 
                                    max="5000" 
                                    step="1" 
                                    required 
                                    placeholder="Ex: 1200"
                                >
                            </div>
                            <div class="form-group col-12 col-md-4">
                                <label for="height" class="form-label font-weight-medium text-dark">Altura (mm):</label>
                                <input 
                                    type="number" 
                                    id="height" 
                                    name="height" 
                                    class="form-control" 
                                    min="100" 
                                    max="3000" 
                                    step="1" 
                                    required 
                                    placeholder="Ex: 850"
                                >
                            </div>
                            <div class="form-group col-12 col-md-4">
                                <label for="depth" class="form-label font-weight-medium text-dark">Profundidade (mm):</label>
                                <input 
                                    type="number" 
                                    id="depth" 
                                    name="depth" 
                                    class="form-control" 
                                    min="100" 
                                    max="1500" 
                                    step="1" 
                                    required 
                                    placeholder="Ex: 600"
                                >
                            </div>
                        </div>
                    </fieldset>

                    <fieldset class="form-group-group mb-4 border-0 p-0">
                        <legend class="h6 font-weight-semibold text-secondary mb-3">Especificações do Material</legend>
                        <div class="form-row row g-3">
                            <div class="form-group col-12 col-md-6">
                                <label for="mdfThickness" class="form-label font-weight-medium text-dark">Espessura Caixa (MDF):</label>
                                <select id="mdfThickness" name="mdfThickness" class="form-select form-control" required>
                                    <option value="15" selected>15 mm</option>
                                    <option value="18">18 mm</option>
                                </select>
                            </div>
                            <div class="form-group col-12 col-md-6">
                                <label for="backPanelThickness" class="form-label font-weight-medium text-dark">Espessura Fundo (MDF):</label>
                                <select id="backPanelThickness" name="backPanelThickness" class="form-select form-control" required>
                                    <option value="3" selected>3 mm</option>
                                    <option value="6">6 mm</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset class="form-group-group mb-4 border-0 p-0">
                        <legend class="h6 font-weight-semibold text-secondary mb-3">Divisões Internas e Portas</legend>
                        <div class="form-row row g-3">
                            <div class="form-group col-12 col-md-4">
                                <label for="doorsQuantity" class="form-label font-weight-medium text-dark">Quantidade de Portas:</label>
                                <input 
                                    type="number" 
                                    id="doorsQuantity" 
                                    name="doorsQuantity" 
                                    class="form-control" 
                                    min="0" 
                                    max="10" 
                                    step="1" 
                                    value="2" 
                                    required
                                >
                            </div>
                            <div class="form-group col-12 col-md-4">
                                <label for="shelvesQuantity" class="form-label font-weight-medium text-dark">Quantidade de Prateleiras:</label>
                                <input 
                                    type="number" 
                                    id="shelvesQuantity" 
                                    name="shelvesQuantity" 
                                    class="form-control" 
                                    min="0" 
                                    max="10" 
                                    step="1" 
                                    value="1" 
                                    required
                                >
                            </div>
                            <div class="form-group col-12 col-md-4">
                                <label for="drawersQuantity" class="form-label font-weight-medium text-dark">Quantidade de Gavetas:</label>
                                <input 
                                    type="number" 
                                    id="drawersQuantity" 
                                    name="drawersQuantity" 
                                    class="form-control" 
                                    min="0" 
                                    max="10" 
                                    step="1" 
                                    value="0" 
                                    required
                                >
                            </div>
                        </div>
                    </fieldset>

                    <div class="form-actions d-grid gap-2 d-md-flex justify-content-md-end pt-3 border-top">
                        <button type="submit" class="btn btn-primary btn-lg w-100 w-md-auto font-weight-bold px-4">
                            📐 Calcular Plano de Corte
                        </button>
                    </div>

                </form>
            </div>
        `;
    }
}

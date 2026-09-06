/**
 * @fileoverview Módulo de interface de usuário para triagem e formulários de parâmetros do móvel.
 * @module modules/triagem
 */

import {
    MODULE_TYPES,
    MDF_THICKNESS,
    FINISH_TYPES,
    PLINTH_DEFAULT_HEIGHT
} from '../config/constants.js';

/**
 * Módulo responsável pela renderização e eventos da triagem inicial.
 */
export class TriagemModule {
    /**
     * @param {HTMLElement} containerElement Elemento contêiner do DOM onde o formulário será montado.
     * @param {FurnitureState} state Instância do estado global da aplicação.
     * @param {Function} onStateChange Callback acionado quando houver alteração válida no estado.
     */
    constructor(containerElement, state, onStateChange) {
        if (!containerElement) {
            throw new Error('TriagemModule requer um elemento contêiner do DOM válido.');
        }
        this.container = containerElement;
        this.state = state;
        this.onStateChange = onStateChange;

        // Armazena a etapa atual do wizard
        this.currentStep = 1;
    }

    /**
     * Inicializa e renderiza a interface da triagem.
     */
    init() {
        this.render();
    }

    /**
     * Renderiza o HTML do formulário de acordo com a etapa atual do assistente.
     */
    render() {
        this.container.innerHTML = `
            <div class="triagem-card">
                <div class="triagem-header">
                    <h2>Configuração do Móvel</h2>
                    <div class="step-indicator">
                        <span class="step ${this.currentStep >= 1 ? 'active' : ''}">1</span>
                        <span class="step ${this.currentStep >= 2 ? 'active' : ''}">2</span>
                        <span class="step ${this.currentStep >= 3 ? 'active' : ''}">3</span>
                    </div>
                </div>

                <form id="triagem-form" class="triagem-form">
                    ${this._renderStepContent()}

                    <div class="triagem-actions">
                        ${this.currentStep > 1 ? '<button type="button" id="btn-prev" class="btn btn-secondary">Voltar</button>' : ''}
                        ${this.currentStep < 3 ? '<button type="button" id="btn-next" class="btn btn-primary">Avançar</button>' : '<button type="submit" id="btn-submit" class="btn btn-success">Calcular Plano de Corte</button>'}
                    </div>
                </form>
            </div>
        `;

        this._bindEvents();
    }

    /**
     * Retorna o template HTML correspondente à etapa ativa do formulário.
     * @private
     * @returns {string}
     */
    _renderStepContent() {
        switch (this.currentStep) {
            case 1:
                return `
                    <div class="form-step">
                        <h3>Passo 1: Tipo de Móvel</h3>
                        <div class="form-group">
                            <label for="type">Selecione o tipo de estrutura:</label>
                            <select id="type" name="type" class="form-input">
                                ${MODULE_TYPES.map(
                                    (item) => `
                                    <option value="${item.id}" ${this.state.type === item.id ? 'selected' : ''}>
                                        ${item.name}
                                    </option>
                                `
                                ).join('')}
                            </select>
                        </div>
                    </div>
                `;

            case 2:
                return `
                    <div class="form-step">
                        <h3>Passo 2: Dimensões Brutas e Material</h3>
                        
                        <div class="form-group">
                            <label for="height">Altura Total (mm):</label>
                            <input type="number" id="height" name="height" class="form-input" placeholder="Ex: 850" value="${this.state.height || ''}" min="200" required inputmode="numeric" />
                        </div>

                        <div class="form-group">
                            <label for="width">Largura Total (mm):</label>
                            <input type="number" id="width" name="width" class="form-input" placeholder="Ex: 1200" value="${this.state.width || ''}" min="200" required inputmode="numeric" />
                        </div>

                        <div class="form-group">
                            <label for="depth">Profundidade Total (mm):</label>
                            <input type="number" id="depth" name="depth" class="form-input" placeholder="Ex: 600" value="${this.state.depth || ''}" min="100" required inputmode="numeric" />
                        </div>

                        <div class="form-group">
                            <label for="mdfThickness">Espessura MDF da Caixa (mm):</label>
                            <select id="mdfThickness" name="mdfThickness" class="form-input">
                                ${MDF_THICKNESS.map(
                                    (thickness) => `
                                    <option value="${thickness}" ${this.state.mdfThickness === thickness ? 'selected' : ''}>
                                        ${thickness} mm
                                    </option>
                                `
                                ).join('')}
                            </select>
                        </div>
                    </div>
                `;

            case 3:
                const isWallCabinet = this.state.type === 'WALL_CABINET';
                return `
                    <div class="form-step">
                        <h3>Passo 3: Acessórios e Acabamento</h3>

                        <div class="form-group">
                            <label for="drawerCount">Quantidade de Gavetas:</label>
                            <input type="number" id="drawerCount" name="drawerCount" class="form-input" value="${this.state.drawerCount}" min="0" max="10" inputmode="numeric" />
                        </div>

                        ${
                            !isWallCabinet
                                ? `
                            <div class="form-group">
                                <label for="plinthHeight">Altura do Rodapé (mm):</label>
                                <input type="number" id="plinthHeight" name="plinthHeight" class="form-input" value="${this.state.plinthHeight || PLINTH_DEFAULT_HEIGHT}" min="0" max="300" inputmode="numeric" />
                            </div>
                        `
                                : ''
                        }

                        <div class="form-group">
                            <label for="finishType">Padrão de Acabamento:</label>
                            <select id="finishType" name="finishType" class="form-input">
                                ${FINISH_TYPES.map(
                                    (finish) => `
                                    <option value="${finish.id}" ${this.state.finishType === finish.id ? 'selected' : ''}>
                                        ${finish.label}
                                    </option>
                                `
                                ).join('')}
                            </select>
                        </div>

                        <div class="form-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="hasProfileHandle" name="hasProfileHandle" ${this.state.hasProfileHandle ? 'checked' : ''} />
                                Utilizar Puxador Perfil de Alumínio (Gola)
                            </label>
                        </div>
                    </div>
                `;

            default:
                return '';
        }
    }

    /**
     * Associa os eventos do formulário e botões de navegação.
     * @private
     */
    _bindEvents() {
        const form = this.container.querySelector('#triagem-form');
        const btnNext = this.container.querySelector('#btn-next');
        const btnPrev = this.container.querySelector('#btn-prev');

        if (btnNext) {
            btnNext.addEventListener('click', () => this._handleNextStep());
        }

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                this._saveCurrentStepData();
                this.currentStep--;
                this.render();
            });
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this._saveCurrentStepData();

            const validation = this.state.validate();
            if (!validation.isValid) {
                alert('Atenção:\n- ' + validation.errors.join('\n- '));
                return;
            }

            if (typeof this.onStateChange === 'function') {
                this.onStateChange(this.state);
            }
        });
    }

    /**
     * Salva os dados digitados na etapa atual diretamente na instância do estado.
     * @private
     */
    _saveCurrentStepData() {
        const form = this.container.querySelector('#triagem-form');
        if (!form) return;

        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Checkbox ausente no FormData quando desmarcado
        if (this.currentStep === 3) {
            data.hasProfileHandle = form.querySelector('#hasProfileHandle')?.checked || false;
        }

        this.state.update(data);
    }

    /**
     * Valida e avança para o próximo passo.
     * @private
     */
    _handleNextStep() {
        this._saveCurrentStepData();

        if (this.currentStep === 2) {
            if (!this.state.height || !this.state.width || !this.state.depth) {
                alert('Por favor, preencha Altura, Largura e Profundidade para continuar.');
                return;
            }
        }

        this.currentStep++;
        this.render();
    }
}

/**
 * @fileoverview Interface de triagem e captação de parâmetros do móvel.
 * @module modules/triagem
 */

import { SIDE_CONSTRUCTION_TYPES, SIDE_CONSTRUCTION_LABELS } from '../config/constants.js';

/**
 * Gerencia o formulário interativo de configuração técnica do móvel.
 */
export class TriagemModule {
    /**
     * @param {HTMLElement} containerElement Contêiner do DOM onde a triagem será injetada.
     * @param {import('../models/FurnitureState.js').FurnitureState} furnitureState Instância do estado do móvel.
     * @param {Function} onValidateCallback Função chamada quando o formulário for validado com sucesso.
     */
    constructor(containerElement, furnitureState, onValidateCallback) {
        if (!containerElement) {
            throw new Error('TriagemModule requer um elemento contêiner válido no DOM.');
        }
        this.container = containerElement;
        this.state = furnitureState;
        this.onValidateCallback = onValidateCallback;
    }

    /**
     * Inicializa a renderização e registra os ouvintes de eventos do formulário.
     */
    init() {
        this.render();
        this._bindEvents();
        this._updateLayoutVisibility();
    }

    /**
     * Renderiza o HTML do formulário com as opções parametrizadas.
     */
    render() {
        this.container.innerHTML = `
            <div class="triagem-card">
                <h2>Configuração Técnica do Balcão</h2>
                <form id="form-triagem" novalidate>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="type">Tipo de Móvel</label>
                            <select id="type" name="type" class="form-control">
                                <option value="SINK_CABINET" ${this.state.type === 'SINK_CABINET' ? 'selected' : ''}>Balcão de Pia</option>
                                <option value="KITCHEN_BASE" ${this.state.type === 'KITCHEN_BASE' ? 'selected' : ''}>Armário de Cozinha Base</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="mdfThickness">Espessura MDF Caixa (mm)</label>
                            <select id="mdfThickness" name="mdfThickness" class="form-control">
                                <option value="15" ${this.state.mdfThickness === 15 ? 'selected' : ''}>15 mm</option>
                                <option value="18" ${this.state.mdfThickness === 18 ? 'selected' : ''}>18 mm</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="sideConstruction">Tipo de Montagem da Lateral</label>
                            <select id="sideConstruction" name="sideConstruction" class="form-control">
                                <option value="${SIDE_CONSTRUCTION_TYPES.OVER_BASE}" ${this.state.sideConstruction === SIDE_CONSTRUCTION_TYPES.OVER_BASE ? 'selected' : ''}>
                                    ${SIDE_CONSTRUCTION_LABELS[SIDE_CONSTRUCTION_TYPES.OVER_BASE]}
                                </option>
                                <option value="${SIDE_CONSTRUCTION_TYPES.FLOOR}" ${this.state.sideConstruction === SIDE_CONSTRUCTION_TYPES.FLOOR ? 'selected' : ''}>
                                    ${SIDE_CONSTRUCTION_LABELS[SIDE_CONSTRUCTION_TYPES.FLOOR]}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="width">Largura Total (mm)</label>
                            <input type="number" id="width" name="width" class="form-control" value="${this.state.width}" min="300" max="2700" required />
                        </div>
                        <div class="form-group">
                            <label for="height">Altura Total (mm)</label>
                            <input type="number" id="height" name="height" class="form-control" value="${this.state.height}" min="400" max="2600" required />
                        </div>
                        <div class="form-group">
                            <label for="depth">Profundidade Total (mm)</label>
                            <input type="number" id="depth" name="depth" class="form-control" value="${this.state.depth}" min="250" max="1000" required />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="doorCount">Qtd. de Portas (0 a 4)</label>
                            <input type="number" id="doorCount" name="doorCount" class="form-control" value="${this.state.doorCount}" min="0" max="4" required />
                        </div>
                        <div class="form-group">
                            <label for="drawerCount">Qtd. de Gavetas (0 a 8)</label>
                            <input type="number" id="drawerCount" name="drawerCount" class="form-control" value="${this.state.drawerCount}" min="0" max="8" required />
                        </div>
                        <div class="form-group">
                            <label for="shelfCount">Qtd. de Prateleiras (0 a 3)</label>
                            <input type="number" id="shelfCount" name="shelfCount" class="form-control" value="${this.state.shelfCount}" min="0" max="3" required />
                        </div>
                    </div>

                    <div class="form-row" id="group-layout-wrapper" style="display: none;">
                        <div class="form-group full-width">
                            <label for="drawerLayout">Disposição dos Vãos</label>
                            <select id="drawerLayout" name="drawerLayout" class="form-control">
                                <option value="LEFT_DRAWERS" ${this.state.drawerLayout === 'LEFT_DRAWERS' ? 'selected' : ''}>Gavetas na Esquerda / Portas na Direita</option>
                                <option value="RIGHT_DRAWERS" ${this.state.drawerLayout === 'RIGHT_DRAWERS' ? 'selected' : ''}>Gavetas na Direita / Portas na Esquerda</option>
                                <option value="FULL_WIDTH" ${this.state.drawerLayout === 'FULL_WIDTH' ? 'selected' : ''}>Apenas Gavetas / Apenas Portas (Vão Único)</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="plinthHeight">Altura Rodapé (mm)</label>
                            <input type="number" id="plinthHeight" name="plinthHeight" class="form-control" value="${this.state.plinthHeight}" min="0" max="250" required />
                        </div>
                        <div class="form-group">
                            <label for="finishType">Cor / Acabamento</label>
                            <input type="text" id="finishType" name="finishType" class="form-control" value="${this.state.finishType}" required />
                        </div>
                    </div>

                    <div class="form-row checkbox-row">
                        <label class="checkbox-label">
                            <input type="checkbox" id="hasProfileHandle" name="hasProfileHandle" ${this.state.hasProfileHandle ? 'checked' : ''} />
                            Utilizar Puxador Perfil Alumínio (Gola)
                        </label>
                    </div>

                    <div id="error-container" class="error-container" style="display: none;"></div>

                    <div class="form-actions">
                        <button type="submit" id="btn-submit" class="btn btn-primary">
                            🚀 Gerar Plano de Corte Matemático
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Adiciona escutadores para alteração de layout dinâmico e submissão.
     * @private
     */
    _bindEvents() {
        const form = this.container.querySelector('#form-triagem');
        const widthInput = this.container.querySelector('#width');
        const drawerInput = this.container.querySelector('#drawerCount');
        const doorInput = this.container.querySelector('#doorCount');

        const updateVisibility = () => this._updateLayoutVisibility();

        if (widthInput) widthInput.addEventListener('input', updateVisibility);
        if (drawerInput) drawerInput.addEventListener('input', updateVisibility);
        if (doorInput) doorInput.addEventListener('input', updateVisibility);

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this._handleSubmit();
            });
        }
    }

    /**
     * Oculta/exibe o seletor de layout de gaveta conforme as regras de negócio.
     * @private
     */
    _updateLayoutVisibility() {
        const width = Number(this.container.querySelector('#width')?.value || 0);
        const drawers = Number(this.container.querySelector('#drawerCount')?.value || 0);
        const doors = Number(this.container.querySelector('#doorCount')?.value || 0);
        const layoutWrapper = this.container.querySelector('#group-layout-wrapper');

        if (layoutWrapper) {
            const shouldShow = (width > 800 && drawers > 0 && doors > 0) || (drawers > 0 && doors > 0);
            layoutWrapper.style.display = shouldShow ? 'flex' : 'none';
        }
    }

    /**
     * Valida os campos antes de transmitir o estado ao orquestrador.
     * @private
     */
    _handleSubmit() {
        const formData = new FormData(this.container.querySelector('#form-triagem'));

        const updatedData = {
            type: formData.get('type'),
            width: Number(formData.get('width')),
            height: Number(formData.get('height')),
            depth: Number(formData.get('depth')),
            mdfThickness: Number(formData.get('mdfThickness')),
            drawerMdfThickness: Number(formData.get('mdfThickness')), // Alinhado por padrão com a caixa
            sideConstruction: formData.get('sideConstruction'),
            plinthHeight: Number(formData.get('plinthHeight')),
            drawerCount: Number(formData.get('drawerCount')),
            doorCount: Number(formData.get('doorCount')),
            shelfCount: Number(formData.get('shelfCount')),
            finishType: formData.get('finishType'),
            drawerLayout: formData.get('drawerLayout') || 'FULL_WIDTH',
            hasProfileHandle: this.container.querySelector('#hasProfileHandle').checked
        };

        this.state.update(updatedData);

        const validation = this.state.validate();
        const errorContainer = this.container.querySelector('#error-container');

        if (!validation.isValid) {
            errorContainer.innerHTML = validation.errors.map(err => `<p class="error-msg">⚠️ ${err}</p>`).join('');
            errorContainer.style.display = 'block';
            return;
        }

        errorContainer.style.display = 'none';

        if (typeof this.onValidateCallback === 'function') {
            this.onValidateCallback(this.state);
        }
    }
}

/**
 * @fileoverview Ponto de entrada e orquestrador principal da aplicação MarcenariaCalc.
 * @module app
 */

import { FurnitureState } from './models/FurnitureState.js';
import { TriagemModule } from './modules/triagem.js';
import { CuttingListEngine } from './modules/engine/cuttingList.js';
import { HardwareListEngine } from './modules/engine/hardwareList.js';
import { CutListUI } from './modules/display/cutListUI.js';

/**
 * Inicializa e gerencia a transição de telas do fluxo da aplicação.
 */
function initApp() {
    const triagemRegion = document.getElementById('triagem-region');
    const resultsRegion = document.getElementById('results-region');

    if (!triagemRegion || !resultsRegion) {
        console.error('❌ Erro crítico: Regiões do aplicativo não foram encontradas no DOM.');
        return;
    }

    // Instancia o estado persistente do móvel
    const furnitureState = new FurnitureState();

    /**
     * Alterna a visibilidade para a tela de triagem/configuração.
     */
    const showTriagemScreen = () => {
        resultsRegion.innerHTML = '';
        triagemRegion.style.display = 'block';

        const triagemUI = new TriagemModule(triagemRegion, furnitureState, handleStateValidated);
        triagemUI.init();
    };

    /**
     * Callback acionado ao concluir e validar a triagem com sucesso.
     * Transita da tela de triagem para a exibição do plano de corte e ferragens.
     * @param {FurnitureState} validatedState
     */
    const handleStateValidated = (validatedState) => {
        console.group('📐 MarcenariaCalc - Calculando Plano de Corte & Ferragens');
        console.log('Parâmetros de Entrada:', validatedState.toObject());

        try {
            // Executa as engines de cálculo
            const cuttingEngine = new CuttingListEngine(validatedState);
            const cuttingList = cuttingEngine.generateList();

            const hardwareEngine = new HardwareListEngine();
            const hardwareList = hardwareEngine.generateList(validatedState);

            console.log('Peças Geradas:', cuttingList);
            console.log('Ferragens Calculadas:', hardwareList);
            console.groupEnd();

            // Esconde o formulário de triagem e renderiza a tela de resultados
            triagemRegion.style.display = 'none';

            const displayUI = new CutListUI(resultsRegion, showTriagemScreen);
            displayUI.render(cuttingList, hardwareList, validatedState);

            // Rola suavemente para o topo da lista de corte
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('❌ Erro durante o cálculo do plano de corte:', error);
            alert(`Falha no cálculo: ${error.message}`);
        }
    };

    // Inicializa a aplicação na tela de triagem
    showTriagemScreen();

    console.log('🚀 MarcenariaCalc - Orquestrador inicializado com sucesso.');
}

// Garante a execução do script após a montagem do DOM
document.addEventListener('DOMContentLoaded', initApp);

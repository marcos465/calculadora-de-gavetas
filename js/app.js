/**
 * @fileoverview Ponto de entrada da aplicação MarcenariaCalc.
 * @module app
 */

import { FurnitureState } from './models/FurnitureState.js';
import { TriagemModule } from './modules/triagem.js';

/**
 * Inicializa e conecta as camadas da aplicação no carregamento do DOM.
 */
function initApp() {
    const triagemRegion = document.getElementById('triagem-region');

    if (!triagemRegion) {
        console.error('❌ Erro crítico: Região de triagem (#triagem-region) não encontrada.');
        return;
    }

    // Instancia o estado global do móvel
    const furnitureState = new FurnitureState();

    // Callback para disparar o cálculo técnico após validação dos dados
    const handleStateValidated = (updatedState) => {
        console.group('📐 MarcenariaCalc - Estado Validado');
        console.log('Objeto de Estado Pronto para Cálculo:', updatedState.toObject());
        console.groupEnd();

        // Em próximas etapas, chamaremos aqui a engine de cálculo do plano de corte.
        alert('Dados salvos e validados com sucesso! Pronto para gerar o plano de corte.');
    };

    // Inicializa o módulo UI da triagem
    const triagemUI = new TriagemModule(triagemRegion, furnitureState, handleStateValidated);
    triagemUI.init();

    console.log('🚀 MarcenariaCalc - Interface de Triagem e Estado inicializados.');
}

// Garante que o fluxo inicia apenas após a montagem do DOM
document.addEventListener('DOMContentLoaded', initApp);

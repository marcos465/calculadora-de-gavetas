/**
 * @fileoverview Utilitário para exportação de listas de corte no formato CSV compatível com CutList Optimizer.
 * @module utils/csvExporter
 */

/**
 * Representa um item da lista de corte retornado pe/**
 * @fileoverview Módulo utilitário para exportação de listas de corte no formato CSV
 * compatível com o CutList Optimizer, executado 100% no lado do cliente (Client-side).
 * @module utils/csvExporter
 */

/**
 * Encapsula e escapa campos de texto para evitar corrupção da estrutura do CSV
 * caso contenham aspas duplas, vírgulas ou quebras de linha.
 * 
 * @param {string | number} val - Valor do campo a ser formatado.
 * @returns {string} Valor escapado pronto para inclusão no arquivo CSV.
 */
function escapeCSVField(val) {
    if (val === null || val === undefined) {
        return '""';
    }
    const str = String(val).trim();
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Converte um array de peças de corte em uma string formatada em CSV compatível
 * com o padrão exigido pelo CutList Optimizer e dispara o download nativo via Blob no navegador.
 *
 * @param {Array<{length: number, width: number, quantity: number, material: string, name: string}>} items - Lista de peças de corte.
 * @param {string} [filename='corte_balcao_cutlist.csv'] - Nome sugerido para o arquivo baixado.
 * @returns {void}
 */
export function exportToCutListCSV(items, filename = 'corte_balcao_cutlist.csv') {
    // 1. Tratamento de Exceções e Validação de Entrada
    if (!Array.isArray(items) || items.length === 0) {
        alert('Atenção: Não há itens na lista de corte para serem exportados.');
        console.warn('[csvExporter] Tentativa de exportação com array de itens vazio ou inválido.');
        return;
    }

    try {
        // 2. Formatação do Cabeçalho e Conteúdo (CutList Optimizer Spec)
        const headers = ['Length', 'Width', 'Qty', 'Material', 'Label', 'Enabled'];
        const csvRows = [headers.join(',')];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Extração e higienização dos valores
            const rawLength = Number(item.length || item.height || 0);
            const rawWidth = Number(item.width || 0);
            const quantity = Number(item.quantity || item.qty || 1);

            // Garantia matemática: CutList Optimizer espera Length >= Width
            const length = Math.max(rawLength, rawWidth);
            const width = Math.min(rawLength, rawWidth);

            const material = item.material ? String(item.material) : `MDF ${item.thickness || 15}mm`;
            const name = item.name || item.label || `Peça ${i + 1}`;
            const enabled = true;

            // Montagem da linha com escape rigoroso
            const row = [
                length,
                width,
                quantity,
                escapeCSVField(material),
                escapeCSVField(name),
                enabled
            ];

            csvRows.push(row.join(','));
        }

        // Unificação das linhas utilizando a quebra de linha padrão universal (\r\n)
        const csvString = csvRows.join('\r\n');

        // 3. Geração do Download NATIVO (Browser Blob sem Back-end)
        // Adiciona o caractere BOM (\uFEFF) para forçar o Excel e ferramentas a lerem o arquivo em UTF-8 corretamente
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const blobUrl = URL.createObjectURL(blob);

        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.setAttribute('download', filename);

        // Oculta o elemento temporário antes da anexação no DOM
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);

        // Dispara a interatividade de download nativa do navegador
        downloadLink.click();

        // Limpeza de memória e remoção do nó do DOM
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);

    } catch (error) {
        console.error('[csvExporter] Ocorreu uma falha ao gerar o arquivo CSV:', error);
        alert('Ocorreu um erro inesperado ao gerar o arquivo CSV de corte. Tente novamente.');
    }
}lo CuttingListEngine.
 * @typedef {Object} CuttingItem
 * @property {string} name - Nome descritivo da peça.
 * @property {number} quantity - Quantidade de peças idênticas.
 * @property {number} height - Comprimento/Altura da peça em mm.
 * @property {number} width - Largura da peça em mm.
 * @property {number} thickness - Espessura da chapa MDF em mm.
 * @property {string} [edgeBanding] - Padrão de aplicação de fita de borda.
 * @property {string} [description] - Detalhes e aplicação técnica.
 */

/**
 * Formata um valor textual para o padrão CSV, tratando aspas duplas e vírgulas internas.
 * 
 * @param {string | number} val - Valor a ser formatado.
 * @returns {string} Valor escapado para CSV.
 */
function escapeCSVField(val) {
    if (val === null || val === undefined) {
        return '""';
    }
    const str = String(val).trim();
    // Se o valor contiver aspas, vírgulas ou quebras de linha, envolve em aspas e duplica as aspas internas.
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Converte a lista de peças de corte em uma string CSV no formato CutList Optimizer
 * e dispara o download nativo no navegador.
 *
 * @param {CuttingItem[]} items - Array de peças gerado pelo CuttingListEngine.
 * @param {string} [filename='corte_balcao_cutlist.csv'] - Nome do arquivo para download.
 * @returns {void}
 */
export function exportToCutListCSV(items, filename = 'corte_balcao_cutlist.csv') {
    if (!Array.isArray(items) || items.length === 0) {
        console.warn('exportToCutListCSV: Nenhuma peça fornecida para exportação.');
        return;
    }

    // 1. Cabeçalho exato exigido pelo CutList Optimizer
    const headers = ['Length', 'Width', 'Qty', 'Material', 'Label', 'Enabled'];
    const rows = [headers.join(',')];

    // 2. Mapeamento e formatação de cada peça do projeto
    for (const item of items) {
        const dim1 = Number(item.height) || 0;
        const dim2 = Number(item.width) || 0;

        // CutList Spec: Length deve ser sempre a maior dimensão, e Width a menor
        const length = Math.max(dim1, dim2);
        const width = Math.min(dim1, dim2);
        const qty = item.quantity || 1;
        
        // Formata o nome do material utilizando a espessura da peça
        const material = `MDF ${item.thickness || 15}mm`;
        const label = item.name || 'Peça sem nome';
        const enabled = true;

        const row = [
            length,
            width,
            qty,
            escapeCSVField(material),
            escapeCSVField(label),
            enabled
        ];

        rows.push(row.join(','));
    }

    const csvContent = rows.join('\r\n');

    // 3. Gerador de Download NATIVO (Browser Blob)
    // Inclusão do BOM (\uFEFF) para garantir que caracteres acentuados sejam interpretados corretamente em UTF-8 no Excel/CutList.
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);

    // Esconde o elemento no DOM antes do clique simulated
    link.style.display = 'none';
    document.body.appendChild(link);

    link.click();

    // Limpeza da memória do navegador e remoção do elemento
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
}
